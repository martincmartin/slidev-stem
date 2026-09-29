This is a review of all TypeScript code in watches/webgl/

**I would keep this architecture and tighten its contracts.** The code has a clear purpose, sensible separation of responsibilities, and a rendering technique suited to an illustration. Its main weakness is that several important assumptions exist only in comments—or are silently bypassed when violated.

I reviewed all 1,373 lines across the five files. I also ran small checks on the indexing helper and test assertions. The full test suite could not start because `earcut` is unavailable in this workspace; browser rendering verification was also unavailable. WebGL findings below are based on code inspection and the API specifications.

**What’s good**

- **The three main responsibilities are separated well:** :chatgpt-content-reference{index="5"}[scene.ts](sandbox:/workspace/scratch/00be7143866e/upload/scene.ts) describes data, :chatgpt-content-reference{index="6"}[mesh.ts](sandbox:/workspace/scratch/00be7143866e/upload/mesh.ts) constructs geometry, and :chatgpt-content-reference{index="7"}[renderer.ts](sandbox:/workspace/scratch/00be7143866e/upload/renderer.ts) draws it. None needs to understand watch mechanics.
- **The rendering policy is explained unusually well.** The opening comments explain why lines use screen-space capsules, why visibility is tested at their centres, and why fading renders two pictures.
- **The implementation respects its visual model.** Fill opacity means colour mixed with paper, not physical transparency. Hidden surfaces still occlude. These are coherent choices for technical illustration.
- **Geometry construction is mostly pure and testable.** Small functions such as `wallTriangles`, `ringLines`, and `viewProjection` are easier to reason about than equivalent logic embedded in drawing code.
- **Several WebGL choices are sound:** instancing line segments, immutable texture storage, explicitly disabling depth comparison for sampled depth textures, and detaching the depth attachment before sampling it.
- **TypeScript is used straightforwardly.** Type-only imports, tuples, explicit nullable fields, and modest interfaces are appropriate. There is little unnecessary abstraction.

The renderer is 798 lines, but approximately 145 are shader definitions. I would not split it simply to reduce its line count.

**1. Fix vertex attribute ownership around dynamic updates — highest correctness priority**

Relevant code: `renderer.ts`, `build`, `drawFaces`, and `drawLines`.

Everything uses the default vertex array object. `drawLines` enables its attributes and leaves them enabled; it resets their divisors but does not disable them.

Meanwhile, `build` deletes the previous geometry buffers.

This creates a specific hazardous sequence:

1. A mesh supplies the last line draw.
2. `updateMesh` deletes that mesh’s line buffer.
3. The enabled attribute bindings referencing that buffer are cleared.
4. The next face pass restores only its `position` attribute.
5. Other enabled attributes can remain without buffers.

Deleting a buffer attached to the current vertex array clears those bindings. WebGL rejects draws when an enabled attribute has no buffer, including attributes unused by the current program. This makes the interaction a correctness problem, not merely redundant state changes. :chatgpt-content-reference{index="0"}

**Preferred fix:** retain each mesh’s buffer objects and upload replacement contents into them; give faces, lines, and the fullscreen pass explicit VAO ownership. Per-mesh face and line VAOs are reasonable if they simplify setup.

**Smaller alternative:** disable the line attributes after drawing and explicitly establish the attributes required by each pass. That is a valid patch, but leaves more responsibility with surrounding code.

I have not reproduced this sequence in a browser here. It deserves a regression test using a dynamic mesh drawn last.

**2. Make the supported mutation model explicit**

Relevant code: `scene.ts`; `renderer.ts`, `initialise`, `prepare`, `updateMesh`, and `setDiscs`.

The renderer caches some fields but reads others live:

| Field | Renderer behaviour |
|---|---|
| Fill colour | Cached during preparation |
| Disc coordinates and radii | Cached during preparation |
| Disc count | Read live during drawing |
| Line order | Sorted during initialization |
| Geometry | Uploaded during initialization or `updateMesh` |
| `inDrawing` and group assignment | Read live |

Consequently, changing a perfectly writable TypeScript property can have no effect, a partial effect, or a different effect after context restoration.

For example, appending a disc changes the shader’s count without updating its uploaded disc data or rechecking `MAX_DISCS`.

**Preferred design:** scene definitions are immutable after construction; geometry changes through `updateMesh`; frame-specific state stays in `Frame`.

Concretely:

- Make fixed metadata and collections readonly.
- Define `MeshGeometry` once in `scene.ts`, instead of repeating its `Pick` in the builder and renderer.
- Reject updates to meshes not owned by this renderer.
- Either enforce `mesh.dynamic` or rename it to indicate that it is only an upload usage hint.
- Keep writable geometry under an explicitly controlled update path.

Readonly types help prevent accidental mutation, but do not provide deep runtime immutability or eliminate writable aliases. Typed-array ownership still needs a clear convention. :chatgpt-content-reference{index="1"}

I would choose this over adding setters and cache invalidation for every property. The latter substantially enlarges the renderer’s API.

**3. Replace silent fallbacks where they conceal broken invariants**

Several fallbacks make errors look like plausible output:

| Location | Current behaviour | Better contract |
|---|---|---|
| `render`, missing group matrix | Uses identity | Require a matrix for every non-null group |
| `uniform`, unknown name | Returns `null`; upload silently does nothing | Throw for required uniforms |
| `attribute`, unknown name | Returns `-1`; later GL calls fail | Throw during program setup |
| `sortRings`, missing parent face | Optional chaining drops the hole | Assert the expected face exists |
| `normalMatrix`, zero determinant | Substitutes a denominator of 1 | Reject unsupported singular transforms |
| `hexRgb`, malformed input | Can produce an unintended colour | Validate the supported hex format |

Identity is sensible for `group: null`. It is much less sensible for “this mesh belongs to a group, but the frame forgot its transform.”

Likewise, optional shader uniforms can be legitimate, but should be explicitly optional. All the current shader interfaces are known ahead of time.

The governing rule should be: **defaults express valid omitted choices; assertions expose violated internal contracts.**

**4. Strengthen tests that currently provide false confidence**

Relevant file: :chatgpt-content-reference{index="8"}[mesh.test.ts](sandbox:/workspace/scratch/00be7143866e/upload/mesh.test.ts).

The first test calculates:

```ts
const capVertices = mesh.triangles.length / 3 - 16 * 3;
```

It then subtracts that calculated value to “verify” 16 wall triangles. Algebraically, that assertion always equals 16.

The cap assertion is only an upper bound. **I checked that both triangle assertions pass even when the triangle array is empty.**

For the square-with-hole fixture, useful checks are:

- Each cap has area \(20^2 - 8^2 = 336\).
- There are 16 wall triangles.
- Wall triangles span the intended bottom and top heights.
- Cap triangles do not fill the hole.

Area and placement assertions verify the geometric result without unnecessarily depending on Earcut’s exact triangulation.

The final test also does not verify its title, “keeps normals perpendicular.” It checks one matrix element and a transformed point. Use an oblique normal and tangent under nonuniform scaling or shear, then assert:

\[
\left|(Nn)\cdot(Mt)\right| < \varepsilon
\]

The most valuable additional cases would cover:

- Dynamic update after the last line draw.
- Context loss and restoration.
- Fade endpoints and an intermediate fade.
- Missing group matrices and invalid geometry.
- Reversed ring winding and nested holes.

**5. Validate the small set of inputs the algorithms actually require**

The geometry code is compact partly because it assumes well-formed inputs. That is reasonable for authored presentation assets, but the assumptions should be explicit.

`sortRings` determines containment from one point of each ring. That works for simple, non-touching rings that are disjoint or nested. It does not implement general SVG even-odd filling for intersecting paths. Earcut itself does not guarantee correct triangulation for arbitrary self-intersections. :chatgpt-content-reference{index="2"}

I would document that narrower contract and validate inexpensive conditions at construction:

- Closed rings have at least three points; open paths at least two.
- Coordinates are finite.
- `corners.length === points.length`.
- Consecutive vertices are distinct, including the closing edge.
- Triangle data length is divisible by nine.
- Matrices have 16 finite entries and satisfy the supported affine-transform contract.

Avoid silently replacing a zero-length edge’s denominator with `1`; that produces a zero normal while hiding the malformed edge.

For arbitrary imported SVG paths, a normalization/intersection-processing stage would be needed. For controlled watch geometry, implementing that machinery would likely be excessive.

**6. Finish resource lifecycle management**

Context restoration is handled, which is good. Normal disposal is missing.

There is no method to:

- Remove the two canvas event listeners.
- Delete programs, mesh buffers, textures, framebuffers, and the corner buffer.
- Prevent rendering or restoration after disposal.

Anonymous event callbacks also make listener removal awkward. In a Slidev/Vue component, this matters when components are unmounted or replaced during development.

Add an idempotent `dispose()` and connect it to the component’s unmount lifecycle. Delete shader objects after attaching them, and clean up resources when initialization fails. Explicit resource deletion is established WebGL practice. :chatgpt-content-reference{index="3"}

Also check framebuffer completeness when allocating or resizing targets, and reject or skip zero-sized frames. Those checks belong at allocation boundaries, not in every draw call.

**7. Document three rendering limitations before changing the algorithms**

These are important distinctions between intended behaviour and actual guarantees.

**Line order is painter order, not depth order.**  
The introductory comment says a nearer line covers a farther one. The implementation guarantees only that a later `lineOrder` covers an earlier one. That may be exactly the desired illustration rule; change the comment accordingly.

**Independent capsules overlap at joins.**  
They produce round geometry, but their alpha coverage accumulates. Two fully covered segments with opacity 0.5 produce effective opacity:

\[
1-(1-0.5)^2=0.75
\]

Thus translucent joins can be darker than the segment bodies. Even opaque strokes can accumulate antialias coverage near their boundaries.

If the artwork looks good, retain the technique and document the approximation. Exact stroke opacity would require joined geometry or a coverage/compositing approach, with appreciably more complexity.

**The transform and pixel-unit contracts need sharper names.**

- Line projection assumes orthographic projection and affine model matrices; there is no perspective divide.
- `Group.parent` is not traversed. Clarify whether `groupMatrices` contains already-composed world matrices.
- Disc clipping uses world XY, so discs do not automatically move with a mesh’s group.
- `pixelsPerCss = frameWidth / slideWidth` is pixels per slide unit. Whether that equals the intended CSS-pixel scale depends on the component’s sizing convention.
- `transformMesh` transforms vertices and normals but leaves clipping discs unchanged. Its claim to move “all” geometry should acknowledge that distinction.

These mostly need precise contracts, not additional rendering features.

**Smaller readability and TypeScript improvements**

- **Repair `at`.** In :chatgpt-content-reference{index="9"}[checked.ts](sandbox:/workspace/scratch/00be7143866e/upload/checked.ts), bounds checks allow `NaN`, fractional indices, and sparse slots. I verified that all three can return `undefined` despite the promised return type. Check integer indices and decide explicitly whether missing values are permitted.
- **Move matrix utilities out of `mesh.ts`.** Importing `normalMatrix` currently makes the renderer depend on the geometry-building module and transitively on Earcut. A small `math.ts` is a useful separation.
- **Rename the local `at` in `ringLines` to `pointsAtHeight`.** It currently shadows the checked-index helper.
- **Centralize the line-instance layout.** The 18-float format is maintained separately in packing code and attribute offsets. Keep a small shared layout definition rather than introducing a generic serialization framework.
- **Avoid large argument spreads for triangle arrays.** `triangles.push(...largeArray)` can exceed engine argument limits. A loop is simple and removes a size-dependent failure.
- **Document two-sided geometry.** Both caps currently use the same winding. That works because face culling is disabled; enabling culling later would require correcting winding.

I would not add branded types for every number, replace object identity with string IDs everywhere, or introduce a renderer class hierarchy. Those changes would add more concepts than this application currently needs.

**My ranking of the alternatives**

| Rank | Approach | Why |
|---|---|---|
| **1** | Keep the renderer; tighten ownership, validation, and tests | Preserves the specialized visual behaviour while addressing concrete failure modes |
| **2** | Add a small structural split: matrix utilities and explicit GPU resource/VAO ownership | Helps once the contracts are settled; reduces dependencies and state coupling |
| **3** | Replace the renderer with a general rendering framework | A larger migration whose benefits are uncertain; the custom line visibility and fade semantics would still require specialized work |

Within the first approach, I would fix **dynamic-buffer/attribute state first**, then **mutation contracts and misleading tests**, then **disposal and input validation**. Cosmetic restructuring comes after those.

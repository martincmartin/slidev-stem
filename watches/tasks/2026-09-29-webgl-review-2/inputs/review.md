# Code review: `webgl/` and `watch/`

## Scope and checks

I reviewed the TypeScript, tests, and browser probe under `webgl/` and `watch/`. I did not inspect or change other project files. I ran:

- `pnpm exec tsc --noEmit` — passed with no diagnostics.
- `pnpm test` — all 27 Node tests passed.

`webgl/probe/checks.ts` also defines browser checks for rendering, fade output, dynamic geometry, context loss, disposal, and stills. I did not run those checks in a browser for this review. The Node test command does not include that probe file.

## Overall assessment

The code has a good core design. It separates watch geometry, scene contracts, rendering, and animation. It documents important rendering rules and handles WebGL object ownership and context loss more carefully than many small custom renderers.

The main correctness risk is that some exported APIs accept domain objects without validating their invariants. This matters most in timing data: invalid input can make `stepper()` run without end. There is also a concrete transition discontinuity when a stage changes subjects. On maintainability, `webgl/renderer.ts` (1,160 lines) and `watch/generate.ts` (1,376 lines) hold several distinct responsibilities, though the code is internally commented and the generated watch currently has one subject.

## Findings, ranked by impact

### 1. High — Validate timing invariants before generating keyframes

**Evidence:** `watch/design.ts:141-169,172-277`; `watch/model.ts:74-108,112-132`.

`readDesign()` checks scalar fields for finite numbers, but does not enforce timing constraints such as `period > 0`, `fourthLoop > 0`, `amplitude > 0`, or `0 < pinArc < amplitude`. `point()` checks that pair members have type `number`, but does not check that they are finite. JSON such as `1e999` can parse as `Infinity` in JavaScript.

The unchecked period is not only a cosmetic concern. `stepper()` computes `periods = duration / timing.period` and loops while `period < Math.round(periods)`. With `period === 0` and a positive duration, `periods` is `Infinity`; the loop does not terminate. `Motion` calls `stepper(timing, timing.fourthLoop, ...)`, so a custom design with this value can hang construction.

**Recommendation:** Validate domain invariants once in `readDesign()` (or in a dedicated `checkDesign()` called by every public entry point that accepts a `Design`). Check finiteness for coordinates and positive values for radii, durations, counts, and timing. Check that timing ratios have the ranges the formulas require. Also add direct guards to exported numerical helpers such as `stepper()` if they are intended for general callers. Prefer a clear exception to a hang or a `NaN` keyframe.

### 2. Medium — A change from one subject to another swaps the visible subject immediately

**Evidence:** `webgl/stage.ts:143-178,248-266`.

`Stage.show()` updates `this.keep` to the new subject before the transition starts. If a stage currently shows subject A and receives a state for subject B, the next rendered frame uses B's mesh set immediately. The view and other channels may animate, but the image has already changed from A to B. This breaks the stated behavior that a new state starts from what is on screen now.

The current watch scene has one subject, so this does not appear in its present slide states. It is still a correctness issue in the general `Stage` API, which accepts any scene with multiple subjects.

**Recommendation:** Preserve the current visible composition while a subject transition begins. For a robust design, represent the active fade as explicit source and destination subject sets and blend between those compositions, or sequence the subject replacement at a defined point. Merely delaying the `keep` update until the end avoids the immediate swap but does not correctly interpolate between two different subjects.

### 3. Medium — Validate geometry helper inputs at the helper boundary

**Evidence:** `webgl/mesh.ts:87-114,280-330,341-367`; `webgl/math.ts:16-31,37-66`.

`checkRing()` validates point count, finite coordinates, and zero-length ring edges. That is useful, and the unsupported self-intersection case is documented. Other exported helpers have weaker input contracts:

- `extrude()` and `ribbon()` do not validate `bottom` and `top`. A non-finite height or `top < bottom` can create invalid or inverted geometry and is only likely to fail later when a scene is checked.
- `transformMesh()` calls `normalMatrix()` but does not call `checkAffine()` or otherwise check the full matrix. `transformPoint()` ignores the projective bottom row and does not divide by `w`; a projective matrix or a non-finite translation can therefore produce incorrect geometry without a clear boundary error.
- `normalMatrix()` checks only that the determinant is finite and non-zero. A very ill-conditioned matrix can produce values that overflow when stored in its `Float32Array`, even though the determinant check passed.

**Recommendation:** Put the contracts where callers enter: require finite ordered heights, validate `transformMesh()` matrices as affine and finite, and validate that the resulting normal matrix remains finite and representable. Keep the documented restriction on intersecting rings unless the generator must accept arbitrary input; a complete polygon-intersection validator is a larger feature, not a cheap safety check.

### 4. Medium — Define what happens when a frame callback throws

**Evidence:** `webgl/stage.ts:248-271`.

`Stage.frame()` requests its next animation frame only after model update, rendering, and logging finish. If any of those operations throws, no next frame is requested. The browser reports an uncaught callback error and the stage silently stops until a caller explicitly restarts it. This can happen for invalid frame data or a non-context-loss GL allocation failure.

**Recommendation:** Choose and document one policy. For fail-fast behavior, stop the stage deliberately and expose the error through a callback, state, or promise-like error channel. If the stage should recover, catch only errors that have a defined recovery path and schedule the next frame in a controlled `finally` block. Do not blindly continue after a partially completed render.

### 5. Medium — Keep generated design relationships unambiguous

**Evidence:** `watch/design.ts:196-223,228-233`; `watch/state.ts:37-50`; `webgl/scene.ts:183-228`.

Wheel links and stack entries resolve by name. `stageState()` also resolves view and subject names with `.find()`. The code does not reject duplicate wheel names, duplicate view names, or duplicate subject names. With duplicate wheel names, a `driven` reference silently selects the first wheel. Duplicate view or subject names make slide state resolution depend on array order.

**Recommendation:** Check uniqueness at the parsing/scene boundary. Continue to use names at the JSON and frontmatter boundary, then use object references internally. This keeps the existing design while removing ambiguous input.

### 6. Medium — Validate Slidev metadata before it reaches the animation loop

**Evidence:** `watch/state.ts:20-33`; `webgl/stage.ts:143-178`.

`watchState()` coerces `watchTilt` and `watchSettle` with `Number()`. This accepts values such as empty strings and booleans, and converts an invalid tilt string to `NaN`. A `NaN` tilt is rejected later by the renderer's finite-value check, but that error occurs during `requestAnimationFrame` and stops the stage. An invalid `watchSettle` value silently evaluates false.

**Recommendation:** Check the metadata type and finiteness in `watchState()`. Require the intended numeric form and report the field name in the error. Keep defaulting only for fields that are actually absent.

### 7. Medium — Make partial WebGL allocation failure local and visible

**Evidence:** `webgl/renderer.ts:536-603,614-684,792-853`; context restoration at `webgl/renderer.ts:492-493`.

The renderer tracks GL objects and cleans up objects made during `initialise()`, which is good. However, `target()` creates color/depth textures and a framebuffer in separate steps. If creation or framebuffer validation fails partway through, the `Target` may not be recorded as a usable target; the partial objects remain owned until broader cleanup or disposal. In addition, `compile()` treats a null shader as `ContextLost`, and `initialise()` turns that into a quiet `null` resource set. A null shader can indicate allocation failure, not only context loss. The renderer may then retry on every frame without explaining why it cannot draw. A restoration event also calls `initialise()` directly; an ordinary initialization error becomes an uncaught event-handler exception.

**Recommendation:** Treat each multi-object allocation as a small transaction: release its partial objects immediately if the operation fails. Distinguish actual context loss (`gl.isContextLost()`) from allocation or shader errors. Preserve retry behavior only for actual context loss; surface other errors through the renderer's normal error path.

### 8. Low–medium — Make the immutability/ownership contract stronger in types

**Evidence:** `webgl/scene.ts:70-136`; `watch/design.ts:18-89`; `watch/generate.ts:189-229`; `watch/instance.ts:1-8`.

The comments correctly warn that `readonly` does not make typed-array contents immutable. There are also mutable collections in the shared `WATCH` object: for example, `Design.wheels` is an array and `WatchGroups.wheels` is a `Map`. `WATCH` is a singleton shared by presentation code, and the renderer retains references to scene and mesh data. A mutation through another alias can make CPU scene data disagree with uploaded GPU buffers or cause context restoration to rebuild from changed data.

**Recommendation:** Use `ReadonlyArray` and `ReadonlyMap` for data that consumers should not change, and keep renderer-owned references private where possible. Document typed-array ownership clearly. Copying every geometry array may cost memory and is not automatically the best answer; first make accidental mutation difficult through the API.

### 9. Low–medium — Keep browser checks independent when one check fails

**Evidence:** `webgl/probe/checks.ts:211-237,241-284,288-351,354-426`.

The browser probe is a strength: it checks output pixels, context restoration, dynamic updates, and disposal. Most checks dispose their renderer only at the end of the successful path. If an assertion fails first, the renderer and WebGL context can remain live while the harness continues to the next check. A failed cleanup can then cause later checks to fail for unrelated context/resource reasons. `expected()` has the same issue if rendering or pixel readback throws before `fresh.dispose()`.

**Recommendation:** Put renderer disposal in `finally` blocks or use a small helper that owns and always disposes a renderer. This keeps one failure from contaminating the next result.

### 10. Low — Split large modules by stable responsibility, not by line count alone

**Evidence:** `webgl/renderer.ts` is 1,160 lines; `watch/generate.ts` is 1,376 lines; `watch/model.ts` is 512 lines.

The comments and section headers make these files navigable, and their current logic is not arbitrary. Still, `renderer.ts` combines shader source, program compilation, buffer setup, render targets, state management, and drawing. `generate.ts` combines parts, solid construction, height assignment, case construction, view generation, and scene assembly. A change to one concern requires reading a large file and makes focused tests harder.

**Recommendation:** If these areas will change further, split along current boundaries: shader/program and GL resource setup from the draw coordinator; watch solid/height assignment from scene assembly; and balance-clock behavior from keyframe/motion construction. Keep the extracted modules narrow and explicit. Do not split purely to reduce line counts or introduce a generic rendering framework.

## TypeScript and WebGL practices

### TypeScript

**Good practices:** The code uses strict domain types, `unknown` for JSON input, discriminated unions for path commands and balance modes, and object references for most internal relationships. `check()` provides a consistent assertion mechanism. The side tables in height assignment keep computed algorithm state out of the geometry objects.

**Opportunities:** Some exported functions accept structural types whose invariants are not checked (`stepper`, `angleAt`, `transformMesh`, `extrude`, `ribbon`). Several public data shapes remain mutable. Metadata parsing relies on broad coercion. These are more important than adding more annotations: validate at the points where untrusted or caller-provided values enter.

### WebGL

**Good practices:** The renderer uses WebGL2 VAOs and instancing, explicit shader interfaces, depth textures, screen-space line expansion, and analytic line coverage. It owns created resources, configures the state needed for its passes, handles context loss, and has browser checks that compare actual pixel output. The implementation also documents the unusual hidden-line and fade rules.

**Opportunities:** Resource allocation should be transactional, and allocation failure should not be mislabeled as context loss. The shader interface still uses repeated string keys for uniforms and attributes; typed constants/accessors could reduce spelling errors without adding a shader framework. The renderer's exclusive-context ownership contract is important; keep it explicit because it relies on no other code changing GL state between frames.

## What is especially good

- The renderer's header is a valuable behavioral specification, including its painter-order line rule and fade composition.
- `webgl/probe/checks.ts` tests rendered pixels, not only internal call paths. Its context-loss and dispose checks are particularly useful.
- Geometry tests check area, holes, normals, stacking, and finite generated values.
- `BalanceClock` tests use sampled numerical limits around transitions. This is much stronger than checking only a few expected angles.
- The `Watch`/`Scene` boundary keeps the renderer unaware of watch-specific meanings.

## Alternatives considered and final ranking

1. **Validate contracts at input boundaries and fix subject-transition composition.** Best first step. It addresses the concrete hang, malformed-input behavior, and visible transition discontinuity with limited architectural change.
2. **Make GL allocation transactional and define stage error reporting.** Next highest value. These changes improve failure behavior and make context/resource problems diagnosable without changing normal rendering.
3. **Strengthen collection ownership and split the large modules at existing seams.** Valuable for future changes, but broader and less urgent than correctness defects. Start with read-only collection types and extract only modules with a clear contract.
4. **Optimize dynamic geometry or introduce a general WebGL abstraction.** Not recommended without performance data. The spring uses 480 sampled points, but this review did not measure frame time. The current renderer is specialized, and a general framework would add cost without demonstrated benefit.

## Validation limits

The TypeScript check and all 27 Node tests passed. I did not run the browser probe, so I cannot confirm its rendering checks on the current machine or browser. I found no evidence from the source review that the current valid watch design fails to render; the highest-risk findings concern malformed/custom input, multiple subjects, and failure paths.

# Plan: act on the review of `watches/webgl/`

Started 2026-09-29. The review is `inputs/review.md` (a copy of
`../2026-09-29-webgl-watch/review/review.md`). The code before this task is
commit `0af598d`.

**The user's rule for this task:** `webgl/` must be correct and must not leak,
whatever program uses it. It must not depend on the talk (one stage for the
whole talk, one stills renderer for the page). It checks or asserts what it
must assume. This is defensive programming.

## Evaluation of the review

| #     | Point                                    | Verdict                           | Why                                                                                                                                                                                                                                                                         |
| ----- | ---------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Vertex attribute state and buffer delete | Agree (latent)                    | `drawLines` leaves 7 attributes enabled, and `updateMesh` deletes a buffer each frame. It is latent: the spring's lines are not the last drawn (the stud's `lineOrder` is higher).                                                                                           |
| 2     | Mutation model                           | Agree, stronger than the review   | Two renderers (stage, stills) share one `Mesh`, and `updateMesh` writes the geometry into it. Each renderer's geometry belongs in the renderer.                                                                                                                              |
| 3     | Silent fallbacks                         | Agree, all six                    | The house rule (`checked.ts`) already says: assert what is a bug.                                                                                                                                                                                                           |
| 4     | Tests                                    | Agree                             | The first test is a tautology: `capVertices = total − 48`, so `(total − capVertices)/3 = 16` always. The normal test checks one matrix element.                                                                                                                             |
| 5     | Input validation                         | Agree, cheap checks only          | The watch's geometry is authored. General SVG path clean-up is not worth it.                                                                                                                                                                                                |
| 6     | Resource lifecycle                       | Agree (the user: no leaks at all) | Today the talk makes one stage and one stills renderer, so nothing leaks in the talk. Another program could. Also found: `webgl/stills.ts` keys its cache by a string without the scene, and never revokes its object URLs; `Stage.stop()` then `start()` can run two loops. |
| 7     | Documentation of limits                  | Agree                             | The header says "a nearer line covers a farther one"; the code gives painter order by `lineOrder`.                                                                                                                                                                          |
| small | `at`, `math.ts`, names, layout, spreads  | Agree                             |                                                                                                                                                                                                                                                                             |

Not done: "reject zero-sized frames" in the stage (`deviceSize` already
clamps to 1 px). The renderer itself now checks the frame's size.

## Options

### Where each renderer keeps a dynamic mesh's geometry

1. **Write it into the `Mesh`, as now.** Two renderers share the mesh, so each
   overwrites the other's geometry. After a context loss, each rebuilds from
   the last geometry that any renderer wrote. Rejected.
2. **A side table in the renderer: `Map<Mesh, MeshGeometry>`.** The `Mesh`
   holds the geometry that it was made with, and is read-only. Each renderer
   keeps the last geometry that it was given, and rebuilds from it after a
   context loss. Chosen: it follows the house rule (data of one run in a side
   table), and it makes the `Mesh` immutable.

### How the renderer owns its vertex state

1. **Disable the line attributes after the lines** (the review's small
   alternative). Each pass still depends on what the last pass left.
2. **Vertex array objects: one for each mesh's faces, one for each mesh's
   lines, one empty one for the mix.** Each VAO is set up once, when its
   buffers are made; a draw binds it. The renderer binds `null` at the end of
   each frame, so it leaves no state to other code on the context. Chosen.

For a dynamic mesh, `bufferData` into the same buffers (no delete, no new
buffer each frame).

### Where the browser checks run

The renderer's contract (context loss, dispose, a dynamic mesh drawn last,
fade endpoints) needs WebGL, and `node --test` has none.

1. **A new house check in `stem/tools/validate.py`.** A change to a house item,
   for one talk. Rejected for now.
2. **The probe page gives `window.webglChecks()`, and `art/watch_stills.py`
   runs it** after it draws the stills. `validate.py` already runs
   `art:stills`. Chosen. The checks use small scenes of their own, not the
   watch.

### Stills without module state

1. **Keep the module maps, and key by scene too.** Still global state: nothing
   can free it.
2. **A `Stills` class: one renderer and one cache, with `dispose()`.** The talk
   decides how many to make (one, in `watch/instance.ts`). Chosen.

## Order of work

1. Record the pixels before (`tools/pixel_regression.py`, `evidence/before/`).
2. Tests (#4), then the rest, in the order of the review evaluation.
3. Check: the frames after are pixel-identical to before; `validate.py` passes.

## Log

### 2026-09-29

**Baseline.** `tools/pixel_regression.py` draws 10 frames with the probe page
(the three views, tilts, the spring's update, a fade at rest 0, 0.5 and 1),
one after another on one page. Two runs before the change were
byte-identical: `evidence/before/`.

**Bug #1 is real in Chromium.** The old renderer, with a dynamic mesh drawn
last (`tools/old_renderer_last_dynamic.ts`), gives `INVALID_OPERATION: no
buffer is bound to enabled attribute` on each frame after the first update:
its faces are not drawn. See `evidence/old_renderer_last_dynamic.txt`. The
watch never showed it only because the stud's lines are drawn after the
spring's.

**What changed** (in `watches/`):

- `webgl/math.ts` (new): matrices, `checkAffine`; `normalMatrix` throws for a
  singular matrix. `mesh.ts` no longer exports them, and the renderer no
  longer imports earcut through `mesh.ts`.
- `webgl/checked.ts`: `at` rejects non-integer indices and empty slots;
  `check` and `checkFinite`.
- `webgl/scene.ts`: read-only types; `MeshGeometry` defined once; `hexRgb`
  validates `#rrggbb`; `checkScene` and `checkGeometry` state the contract.
  Comments: disc coordinates are world x, y; `Group.parent` is for reports;
  matrices are world and affine; line widths are px of the slide.
- `webgl/mesh.ts`: `checkRing` (counts, flags, finite, no zero-length edge);
  `sortRings` throws for crossing rings instead of dropping a hole;
  `edgeNormal` throws instead of dividing by 1; no argument spreads; the
  simple-ring contract and the two-sided faces are documented.
- `webgl/renderer.ts`: a VAO for each mesh's faces and lines, and an empty one
  for the mix; a dynamic mesh's buffers are reused (`bufferData`, no delete);
  the geometry of each mesh is in a side table of the renderer, not written
  into the shared `Mesh`; `updateMesh` refuses a mesh not in the scene or not
  dynamic; every GL object is registered and `dispose()` deletes them, as a
  failed initialisation does; shaders are deleted after linking; each program
  must have exactly the uniforms and attributes that the renderer sets
  (built-ins `gl_*` skipped: Chromium lists `gl_VertexID`); framebuffer
  completeness is checked; frames are checked (size, view, matrices of every
  drawn group, `rest` in 0..1, `keep` in the scene); the renderer sets the
  state that it needs and leaves the default bindings; one live renderer per
  canvas, and a canvas's earlier context must have the same settings; the
  instance layout is one table. A missing `keep` with `rest` < 1 now fades
  everything (it was ignored). Header comments: painter order, joins,
  orthographic.
- `webgl/stage.ts`: `dispose()`; `stop()` cancels the pending frame, so a
  stop and start cannot run two loops; the frame log keeps at most 2 × 36 000
  frames.
- `webgl/stills.ts`: a `Stills` class (one renderer, one cache, its URLs)
  with `dispose()`, which revokes the URLs and loses its own canvas's
  context. The module has no state. `stillsInfo` was unused: deleted.
- Callers: `watch/generate.ts` builds the scene in one literal;
  `watch/stills.ts` owns a `Stills`; `global-bottom.vue` disposes the stage
  on unmount and stops its timers.
- Tests: `mesh.test.ts` rewritten (cap area 336, walls span 0..5, no cap
  triangle in the hole, either winding, bad rings, crossing rings, shear
  keeps normals perpendicular); `math.test.ts`, `checked.test.ts`,
  `scene.test.ts` new. 27 unit tests.
- Browser checks: `webgl/probe/checks.ts`, run by `art/watch_stills.py` (so by
  `validate.py`): a dynamic mesh drawn last, default bindings left, the fade,
  context loss and restoration, dispose, the contract of each input, one
  stage loop, stills and their URLs. Each has a 10 s limit. A check that
  restores a lost context must wait one task after the lost event: an
  `await` resumes before Chromium allows the restoration.

**Checks.** `evidence/after/`: the 10 frames are byte-identical to
`evidence/before/`, and `info.json` is the same. `uv run ../tools/validate.py`
in `watches/`: all 18 checks pass.

### Close

Closed 2026-09-29 by the user.

- `stem/docs/webgl.md`: link to this task; the file table (`math.ts`,
  `checked.ts`, `probe/checks.ts`); "The renderer's contract", with the
  "not an oversight" note on vertex arrays; the browser checks and the pixel
  comparison under "Checks".
- `tasks/2026-09-29-webgl-watch/README.md` (new): a dated line for this
  change.
- Copied into the project: `watches/art/pixel_regression.py` (imports
  `watch_stills` from its own directory).

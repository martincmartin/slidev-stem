# Live 3D art in WebGL

**Status (2026-09-29):** built, in `watches/webgl/` and `watches/watch/`. The
`watches` talk has no watch SVG.

The skeleton watch of `watches` is drawn live, in WebGL, for the whole talk:
one canvas under every slide, which moves its camera, fades parts, tilts the
watch in 3D and runs the mechanism. Use the same approach for any illustration
that must turn in 3D, zoom, or move by rules (a train at relativistic speed, an
interferometer, a lunar module). Draw a small, still or simply looping card in
SVG, as [illustrations.md](illustrations.md) says: the timekeeper cards stay
SVG.

The decision and its evidence:
[`watches/tasks/2026-09-28-webgl-planning/`](../watches/tasks/2026-09-28-webgl-planning/PLAN.md).
The build, its plan, and the measurements:
[`watches/tasks/2026-09-29-webgl-watch/`](../watches/tasks/2026-09-29-webgl-watch/PLAN.md).
The renderer's contract (checks, `dispose`, vertex arrays):
[`watches/tasks/2026-09-29-webgl-review-fixes/`](../watches/tasks/2026-09-29-webgl-review-fixes/PLAN.md).

## How it is built

| Layer                      | Where                                                                                 | What it knows                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| The design                 | Python, in the talk: `watches/art/watch_design.py` writes `watches/watch/design.json` | The numbers that a search or a check needs: arbors, tooth counts, radii, timing. Slow searches (the layout of the wheels) stay offline in Python. |
| The model                  | TypeScript, in the talk: `watches/watch/`                                             | Turns the design into meshes, line styles, heights and views at load, and moves the parts at each frame (the balance's swing, its settle)         |
| The renderer and the stage | TypeScript: `watches/webgl/`                                                          | Meshes, lines, the camera, fades. **No watch names.** It moves to a house package in `stem/` when a second talk needs it.                         |
| The slides                 | Slidev: `global-bottom.vue`, `slide-bottom.vue`, the frontmatter                      | Which view, tilt and state each slide and click asks for                                                                                          |

The files, in `watches/`:

| Path                                                     | What it holds                                                                                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webgl/scene.ts`                                         | the types of a scene: meshes, lines, silhouette edges, clip discs, groups, views, subjects; `checkScene`, the contract                                                |
| `webgl/renderer.ts`, `mesh.ts`, `stage.ts`, `stills.ts`  | the renderer; extrusions, ribbons and their triangles (earcut); the stage that runs the camera, fade and tilt one at a time; the stills                               |
| `webgl/math.ts`, `checked.ts`                            | matrices; `at` and `check`, for what is a bug if it is false                                                                                                          |
| `webgl/probe/`                                           | a page with one canvas and `window.watchProbe.render(options)`, for the pixel and fade checks; `checks.ts`: `window.webglChecks()`, the renderer's browser checks     |
| `watch/design.json`                                      | written by `art/watch_design.py`; never edit by hand                                                                                                                  |
| `watch/design.ts`, `path.ts`, `shapes.ts`, `generate.ts` | read and check the design; outlines; the meshes, heights and views                                                                                                    |
| `watch/model.ts`, `state.ts`, `stills.ts`, `instance.ts` | the mechanism and the balance's settle; frontmatter to state; the watch's stills; the shared instance                                                                 |
| `global-bottom.vue`, `slide-bottom.vue`                  | the live canvas; the still on each printed page                                                                                                                       |
| `types/`                                                 | two small `.d.ts` files, mapped by `tsconfig.json` `paths` to `@slidev/client`. `vue-tsc` would otherwise check Slidev's own source, which fails our strict settings. |

**A new talk with WebGL art** copies `webgl/`, `types/`, `tsconfig.json`,
`eslint.config.js` and the scripts of `watches/package.json` (`typecheck`,
`lint`, `test`, `art:scene`, `art:stills`); `validate.py` then runs the WebGL
checks by the presence of the scripts. Keep the talk's names out of `webgl/`.

**The renderer's contract.** `webgl/` must be correct in any program, not only
in this talk. It checks what it assumes, and throws with a message when an
assumption is false:

- A scene is read-only once it is made. The `Renderer` checks it
  (`checkScene`) when it starts.
- Only a mesh with `dynamic: true` changes, through `Renderer.updateMesh`.
  Each renderer keeps its own copy of that geometry; the `Mesh` does not
  change. The stage and the stills draw the same spring at different angles.
- Each frame gives a world matrix (affine) for every group of a drawn mesh.
  There is no identity matrix by default.
- A canvas has one live renderer. `Renderer`, `Stage` and `Stills` each have
  `dispose()`, which frees all that they hold (GL objects, listeners, frames,
  object URLs). After a context loss, the renderer makes its GL objects again.
- If a stage's frame throws, the loop stops, and the error goes to the
  console. `start()` runs the loop again. The stage does not continue after a
  frame that it could not finish.
- Each mesh has its own vertex arrays, and a dynamic mesh reuses its buffers.
  This is not an oversight: with the default vertex array, a buffer deleted
  after the last line draw broke every later face draw in Chromium. The
  evidence is in the review-fixes task.

**Slidev's first block is the headmatter.** Its `transition` is the default of
every slide, so `watches` starts with a hidden slide (`hide: true`, no
content), and only the cover has `transition: watch-zoom`. Do not merge them.

Geometry is made in TypeScript at load, not ahead of time in Python, because
the parts that move by rules (a spring that winds, a ruler that bends, a
contracted train) must be TypeScript anyway: then each shape has one copy.
Making the whole watch's geometry at load takes about 10 ms in Chromium and
20 ms in Firefox. This is not an oversight; see the planning task, section
13.3.

## The house style in 3D

The 3D art follows the same grammar as the SVG art
([illustrations.md](illustrations.md)), with these additions.

- **Colours:** the four art colours, and only those, for lines and fills. A
  wash (the case, the strap) is a palette colour at an opacity over the paper;
  the renderer blends it into an opaque fill. `tools/scenecheck.py` checks the
  scene.
- **Line widths are CSS px on the screen, at every zoom:** 2, 2.5, 3 or 4, the
  stroke ladder. When the camera zooms 4.46×, a 2 px line stays 2 px. So parts
  must not meet only through their ink: they touch in the model.
- **Which edges have a line.** An outline's top and bottom edges, and its
  corners, always. A curved wall's vertical edges only on its silhouette,
  where the surface turns from the camera. Lines on a face (the minute ticks)
  are drawn on it.
- **Hidden lines:** a line is drawn at its full width where its centre is
  visible, and not at all where its centre is hidden: the painter's rule of
  the 2D art. Other ways to hide lines were measured and are worse at our
  widths (a constant depth bias hides up to half a 4 px line wrongly).
- **Heights:** parts sit where they touch: a wheel on the pinion it drives, the
  pallet fork at the escape wheel's teeth, each hand just clear of what it
  sweeps over. A part that floats above another looks wrong when the view
  tilts.
- **Faces:** flat fills, no lighting, no textures. A curved surface reads
  through its silhouette lines.
- **Clip discs:** a part can be hidden inside a disc, at every height. The
  watch uses them as the 2D art did: each lower wheel is hidden inside the root
  circle of the wheel above it, even behind its spoke openings. Each disc has
  the exact root radius, from the design (the fourth wheel's is 41.05); the
  2D art's SVG rounding had 42.37.
- **Curved surfaces:** make them fine enough that the silhouette does not jump
  as the view turns: for a cylinder of screen radius $R$ px with $N$ facets,
  the jump is about $R\pi^2/2N^2$. For $R = 200$ px, 64 facets give 0.24 px.

## Motion and slides

- **One live canvas for the whole talk.** Each slide names what it shows in its
  frontmatter. In `watches`:

  | Key                              | Meaning                                                                      |
  | -------------------------------- | ---------------------------------------------------------------------------- |
  | `watch: cover`                   | the view: `cover`, `hairspring` or `crown`; no key hides the watch           |
  | `watchTilt: 20`                  | degrees, towards the viewer's side (default 0)                               |
  | `watchOnly: hairspring and stud` | the rest of the watch fades out                                              |
  | `watchSettle: 1`                 | at this click, the balance waits for its next extreme and then comes to rest |

  A key of the wrong kind (`watchTilt: "20"`, an empty `watchOnly`) throws
  when the deck loads, with the key's name. `design.json` is checked the same
  way, including the timing's ranges.

- **Changes run one at a time:** towards a subject, the camera moves (1.8 s),
  then the rest fades (0.8 s), then the view tilts (1.5 s); away from it, the
  reverse. From one subject to another, the rest first fades back in around
  the old subject. A key press during a change starts from what is on the
  screen.
- **A fade fades the rest as one picture**, as SVG's group opacity does: the
  fading parts never show their own hidden lines.
- **The settle:** the balance waits for its next extreme (at most half a
  period, 1 s), then moves to rest in 0.78 s with no jump in angle, speed or
  acceleration where it starts. The rest of the mechanism stops with it.
- **The mechanism's time only goes forward.** A resume swings on to the
  opposite extreme.
- **Stills:** the export, the overview and the presenter's "next" pane show a
  picture of each slide's watch, drawn by one hidden renderer for the page.
  The PDF export is a bitmap of the watch at twice the slide's size: good for
  a projector, not for a zoomed-in PDF.
- **Make a PDF before each talk** (`pnpm export` in the talk) as the fallback
  if the live art fails.

## Budgets and numbers

Measured on the speaker's laptop (120 Hz), 2026-09-29, on the real talk
(`watches/tasks/2026-09-29-webgl-watch/evidence/`):

| What                                                    | Chromium   | Firefox                                 |
| ------------------------------------------------------- | ---------- | --------------------------------------- |
| JS per frame, the whole watch at the laptop's full size | 1.0–1.2 ms | about 1 ms                              |
| GPU per frame (with `gl.finish()`)                      | 0.7–0.9 ms | 2–3 ms                                  |
| A fade frame (two pictures and a mix)                   | the same   | the same                                |
| Frames over 25 ms on the watch slides, after load       | 0          | 0                                       |
| Frames over 12.5 ms in the opening (the 120 Hz gate)    | 0          | 2 in a laptop run, 0 in a projector run |
| WebGL contexts: a slide, the presenter view, the export | 1, 2, 1    | 1, 2, 1                                 |

A frame at 120 Hz has 8.3 ms. If a new model costs much more, measure it in a
visible window with `tools/deck_check.py` and `tools/fade_check.py` (their
docstrings give the commands). `deck_check.py` opens visible windows: do not
use the computer while it runs.

## Checks

In the talk's directory, `uv run ../tools/validate.py` runs, besides the
checks of [talks.md](talks.md):

- `art/validate_watch_design.py` on the design (clearances, the layout).
- `pnpm typecheck` (`vue-tsc`, strict), `pnpm lint` (ESLint with
  typescript-eslint's strict, type-aware rules; Prettier formats), and
  `pnpm test` (`node --test`: the geometry's rules, the settle's jumps).
- `tools/scenecheck.py` on the scene (`pnpm art:scene`): palette and stroke
  ladder.
- `tools/barroom.py` and `tools/motion.py` on PNG stills of the watch
  (`pnpm art:stills`): the back row sees it, and sees it move.
  `art:stills` also runs the renderer's browser checks
  (`webgl/probe/checks.ts`): context loss, `dispose`, the fade, a dynamic mesh
  drawn last, and the contract of each input.

A change to `webgl/` that must not change the picture: draw the frames with
`uv run art/pixel_regression.py OUT_DIR` before and after, then compare with
`--compare BEFORE AFTER`. Two runs of the same code are byte-identical.

## Mistakes that were made once

- **Size the drawing from the canvas's bounding box**, not `clientWidth`:
  Slidev scales the slide with a CSS transform. A drawing sized from
  `clientWidth` was stretched 1.76× on the laptop and 2× on a projector.
- **A still per printed page must share one renderer**: one WebGL context per
  page passes the browser's limit.
- **A positioned still paints over the slide's text** unless the slide's layout
  is positioned too.
- **Keep the talk's names out of the renderer**, so that the next talk can use
  it.

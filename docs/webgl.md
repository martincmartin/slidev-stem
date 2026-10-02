# Live 3D art in WebGL

**Covers:** when to draw art live in WebGL, how the renderer is built and what
it promises, the house style in 3D, and how slides drive it. True for any talk.
**Read before** you change the WebGL renderer (`webgl/`), or plan art that
turns in 3D, zooms, or moves by rules. For `watches`' own watch (its files,
frontmatter keys and measurements), read
[`watches/docs/watch.md`](../watches/docs/watch.md).
**Tasks:**
[`watches/tasks/2026-09-28-webgl-planning/`](../watches/tasks/2026-09-28-webgl-planning/PLAN.md)
(why WebGL, drawn live; §13.3 geometry at load),
[`watches/tasks/2026-09-29-webgl-watch/`](../watches/tasks/2026-09-29-webgl-watch/PLAN.md)
(the build and its measurements),
[`watches/tasks/2026-09-29-webgl-review-fixes/`](../watches/tasks/2026-09-29-webgl-review-fixes/PLAN.md)
(the renderer's contract),
[`watches/tasks/2026-09-30-flash/`](../watches/tasks/2026-09-30-flash/PLAN.md)
(inks as a uniform, the recolour, the flash phase).

## When to use it

Use WebGL for art that must turn in 3D, zoom, or move by rules: the skeleton
watch, a train at relativistic speed, an interferometer, a lunar module. Draw a
small, still or simply looping picture as an SVG
([illustrations.md](illustrations.md)): the timekeeper cards stay SVG.

**Why live WebGL, with no SVG of the watch:** one 3D model is the only source
and one renderer draws every view, so there are no two outputs to keep equal.
The mechanism can run while the view tilts, lines keep the house widths
exactly at every zoom, and a frame costs about 1 ms. The renderer lives in `watches/webgl/`
until a second talk needs it; then it moves to a house package in `stem/`.

## How it is built

| Layer                      | In `watches`                                                 | What it knows                                                                                                          |
| -------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| The design                 | Python: `art/watch_design.py` writes `watch/design.json`     | The numbers that a search or a check needs: arbors, tooth counts, radii, timing. Slow searches stay offline in Python. |
| The model                  | TypeScript: `watch/`                                         | Turns the design into meshes, line styles, heights and views at load, and moves the parts at each frame                |
| The renderer and the stage | TypeScript: `webgl/`                                         | Meshes, lines, the camera, fades. **No names from the talk.**                                                          |
| The slides                 | Slidev: `global-bottom.vue`, `slide-bottom.vue`, frontmatter | Which view, tilt and state each slide and click asks for                                                               |

**A new talk with WebGL art** copies `webgl/`, `types/`, `tsconfig.json`,
`eslint.config.js` and the scripts of `watches/package.json` (`typecheck`,
`lint`, `test`, `art:scene`, `art:stills`, and `art:generated` if the talk
writes files with scripts). `validate.py` runs the WebGL checks when it finds
the scripts. Keep the talk's names out of `webgl/`.

**Geometry is made in TypeScript at load**, not ahead of time in Python. The
parts that move by rules must be TypeScript anyway, so each shape has one copy.
The whole watch takes about 10 ms in Chromium and 20 ms in Firefox. This is not
an oversight: see the planning task, §13.3.

## The renderer's contract

`webgl/` must be correct in any program, not only in this talk. It checks what
it assumes, and throws with a message when an assumption is false:

- A scene is read-only once it is made. The `Renderer` checks it
  (`checkScene`) when it starts.
- Only a mesh with `dynamic: true` changes, through `Renderer.updateMesh`. Each
  renderer keeps its own copy of that geometry; the `Mesh` does not change.
- Each frame gives a world matrix (affine) for every group of a drawn mesh.
  There is no identity matrix by default.
- A canvas has one live renderer. `Renderer`, `Stage` and `Stills` each have
  `dispose()`, which frees all that they hold (GL objects, listeners, frames,
  object URLs). After a context loss, the renderer makes its GL objects again.
- If a stage's frame throws, the loop stops, and the error goes to the
  console. `start()` runs the loop again.
- Each mesh has its own vertex arrays, and a dynamic mesh reuses its buffers.
  This is not an oversight: with the default vertex array, a buffer deleted
  after the last line draw broke every later face draw in Chromium (the
  review-fixes task).

## The house style in 3D

The 3D art follows the grammar of [illustrations.md](illustrations.md), with
these additions.

- **Colours:** the four art colours, and only those, for lines and fills. A
  wash (the case, the strap) is an ink at an opacity over the paper; the
  renderer blends it into an opaque fill. `tools/scenecheck.py` checks the
  scene.
- **A scene holds inks, not colours.** An `Ink` is one of the objects in
  `INKS` (`webgl/scene.ts`): `line`, `frame`, `detail` and `knockout` for the
  scene, and `second` and `secondKnockout` for a flash. Each is an art role of
  the theme ([theme.md](theme.md), "The roles"). `new
Renderer(canvas, scene, palette)` takes a `Palette` (the paper, and one
  `#rrggbb` for each ink) and turns the inks into colours once, when it
  starts. `InkName` is the one list of the inks: `Palette` is a `Record` over
  it, so a palette that lacks an ink does not compile.
- **A frame can draw meshes in other inks.** A line instance holds the index
  of its ink, and each draw sets the colour of every ink as a uniform. So
  `Frame.recolour` (some meshes, and a map from ink to ink) changes their
  colours with no new buffers. A flash uses it with `FLASH_INKS`
  ([illustrations.md](illustrations.md), "Flash"). Without a recolour, the
  pixels are the same as when the colours were in the buffers:
  `watches/art/pixel_regression.py` checks it.
- **The page gives the palette.** The talk reads it from the theme's
  `--palette-*` variables when the page loads (in `watches`,
  `themePalette()` in `watch/palette.ts`, which says which variable gives each
  ink). So a new theme reaches the art with no other step. The renderer does
  not see a later change: to change colours while a talk runs, make a new
  stage.
- **Not an oversight: `Ink` is an object with a typed name**, not an `enum` or
  a bare string. Node runs `.ts` files by removing types, so `enum` does not
  run (`erasableSyntaxOnly`), and a bare string would be a name to look up.
- **Not an oversight: the palette is not in the design file.** It was once,
  and the art kept old colours until someone ran the script again.
- **Line widths are CSS px on the screen, at every zoom:** 2, 2.5, 3 or 4, the
  stroke ladder. When the camera zooms, a 2 px line stays 2 px. So parts must
  not meet only through their ink: they touch in the model.
- **Which edges have a line.** An outline's top and bottom edges, and its
  corners, always. A curved wall's vertical edges only on its silhouette. Lines
  on a face (minute ticks) are drawn on it.
- **Hidden lines:** a line is drawn at its full width where its centre is
  visible, and not at all where its centre is hidden, as in the 2D art. Other
  methods were measured and are worse at these widths (a constant depth bias
  hides up to half a 4 px line wrongly).
- **Heights:** parts sit where they touch. A part that floats above another
  looks wrong when the view tilts.
- **Faces:** flat fills, no lighting, no textures. A curved surface reads
  through its silhouette lines.
- **Clip discs:** a part can be hidden inside a disc, at every height (in the
  watch, each lower wheel inside the root circle of the wheel above it).
- **Curved surfaces:** make them fine enough that the silhouette does not jump
  as the view turns. For a cylinder of screen radius $R$ px with $N$ facets,
  the jump is about $R\pi^2/2N^2$. For $R = 200$ px, 64 facets give 0.24 px.

## Motion and slides

- **One live canvas for the whole talk**, under every slide
  (`global-bottom.vue`). Each slide names what it shows in its frontmatter; a
  slide with no key hides the canvas. A key of the wrong kind throws when the
  deck loads, with the key's name.
- **Changes run one at a time:** towards a subject, the camera moves, then the
  view tilts, then the rest fades; away from it, the reverse. A key press
  during a change starts from what is on the screen. The order, the durations
  and the flash are the timeline's (`webgl/timeline.ts`): it has no DOM and no
  WebGL, so its tests (`timeline.test.ts`) drive it with made-up times.
  `Stage` (`webgl/stage.ts`) holds the renderer, the model and the frame loop.
- **A state can flash a subject during a change** (`StageState.flash`).
  The flash and the first channel start together. It flashes only in a transition that changes a channel,
  not in a state shown at once. A key press during the flash does not start
  it again. `Stage.show` (from `Timeline.show`) returns the seconds until the flash ends. The flash does not delay the channels.
- **A fade fades the rest as one picture**, as SVG's group opacity does: the
  fading parts never show their own hidden lines.
- **Stills:** the export, the overview and the presenter's "next" pane show a
  picture of each slide's art, drawn by one hidden renderer for the page. The
  PDF export is a bitmap at twice the slide's size: good for a projector, not
  for a zoomed-in PDF.
- **Make a PDF before each talk** (`pnpm export`) as the fallback if the live
  art fails.

## Budgets

A frame at 120 Hz has 8.3 ms. The watch uses about 1 ms of JS and 1–3 ms of
GPU a frame (the numbers are in
[`watches/docs/watch.md`](../watches/docs/watch.md)). If a new model costs much
more, measure it in a visible window with `tools/deck_check.py` and
`tools/fade_check.py` (their docstrings give the commands). `deck_check.py`
opens visible windows: do not use the computer while it runs.

## Checks

In the talk's directory, `uv run ../tools/validate.py` runs, besides the checks
of [talks.md](talks.md):

- `pnpm typecheck` (`vue-tsc`, strict), `pnpm lint` (ESLint, typescript-eslint
  strict and type-aware), and `pnpm test` (`node --test`).
- `tools/scenecheck.py` on the scene (`pnpm art:scene`): inks, stroke ladder
  and opacities.
- `tools/barroom.py` and `tools/motion.py` on PNG stills (`pnpm art:stills`):
  the back row sees the art, and sees it move. `art:stills` also runs the
  renderer's browser checks (`webgl/probe/checks.ts`): context loss,
  `dispose`, the fade, a dynamic mesh drawn last, and each input's contract.

A change to `webgl/` that must not change the picture: draw frames with
`uv run art/pixel_regression.py OUT_DIR` before and after, and compare them
with `--compare BEFORE AFTER`. Two runs of the same code are byte-identical.

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

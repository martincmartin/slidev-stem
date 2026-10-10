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
(inks as a uniform, the recolour, the flash phase),
[`watches/tasks/2026-10-07-watch-primitives/`](../watches/tasks/2026-10-07-watch-primitives/PLAN.md)
(pieces, fitted views, one rule for every change).

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
`lint`, `test`, `art:scene`, `art:stills`, `art:print`, and `art:generated` if
the talk writes files with scripts). `validate.py` runs the WebGL checks when it finds
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

- **Colours:** the art colours, and only those, for lines and fills. A face
  (the case, the strap, a wheel) is its wash, solid. A fill in a line colour
  (the impulse jewel) is at 0.60–1.0; the renderer blends a fill below 1 with
  the paper into an opaque fill. A mark on part of a part is a fill in the
  second, solid, with the part's own outline (`watches`, the Gears slide's
  teeth). `tools/scenecheck.py` checks the scene.
- **A scene holds inks, not colours.** An `Ink` is one of the objects in
  `INKS` (`webgl/scene.ts`): `subject`, `subjectWash`, `muted`, `mutedWash`
  and `ink` for the scene, `second` for a mark's fill, and `second` and
  `secondWash` for a flash. Each is
  an art role of the theme ([theme.md](theme.md), "The roles"). A role may be
  a recipe (`color-mix()`): `watch/palette.ts` resolves each one with computed
  CSS style, converts it to sRGB, and makes its hexadecimal value. Canvas
  pixel reads cannot give exact theme colours under fingerprinting protection. `new
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
  `--palette-*` variables, as the current slide's classes change them (in
  `watches`, `slidePalette()` in `watch/palette.ts`, which says which variable
  gives each ink). So a new theme, or a slide's palette class
  ([theme.md](theme.md), "Palette classes"), reaches the art with no other
  step. `Renderer.setPalette` (and `Stage.setPalette`) changes the colours
  from the next frame: no colour is in a GL buffer, so only the ink uniforms
  are made again. The stills share one renderer, and a still's palette is
  part of its key.
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
  A face hides a line only if it is more than the tolerance in front of the
  line's centre (`HIDDEN_LINE_TOLERANCE` in `renderer.ts`). So a part that
  sits on a face, and must hide that face's lines, stands higher than the
  tolerance.
- **Heights:** parts sit where they touch. A part that floats above another
  looks wrong when the view tilts.
- **Faces:** flat fills, no lighting, no textures. A curved surface reads
  through its silhouette lines.
- **An overlay** (`Mesh.overlay`) is a mark on another mesh's surface, at the
  same place as its faces. The renderer draws its faces with a polygon offset
  toward the camera, so its own show where the two are at the same place, and
  do not flicker. Without the flag, two faces at the same place fight in the
  depth test. Its lines are drawn in the usual order: give it the
  `lineOrder` of the mesh it covers, and put it after that mesh, so its
  lines cover the other's.
- **Clip discs:** a part can be hidden inside a disc, at every height (in the
  watch, each lower wheel inside the root circle of the wheel above it). A
  disc names the group of the part that covers it (`Disc.by`). It hides only
  in a picture that draws a mesh of that group, so when the covering part
  fades out, the whole part under it shows.
  So do not put a part in the covering part's group if it can show
  without the covering part: its disc then hides with nothing over it.
- **A dim** (`Frame.dim`) draws a mesh with its colours mixed toward the
  paper, faces and lines, by a weight from 0 to 1. It is not an opacity: a
  dimmed mesh still hides what is under it, and shows none of its own hidden
  lines, so it needs no extra picture.
- **Curved surfaces:** make them fine enough that the silhouette does not jump
  as the view turns. For a cylinder of screen radius $R$ px with $N$ facets,
  the jump is about $R\pi^2/2N^2$. For $R = 200$ px, 64 facets give 0.24 px.

## Motion and slides

- **One live canvas for the whole talk**, under every slide
  (`global-bottom.vue`). Each slide names what it shows in its frontmatter: a
  list of the scene's pieces (`Scene.pieces`, named sets of meshes), and a
  view, or none for a view that fits the pieces. A new slide needs no code. A
  slide with no key hides the canvas. A key of the wrong kind throws when the
  deck loads, with the key's name.
- **One rule for every change**, one channel at a time (`webgl/timeline.ts`).
  From the shown meshes A to B, with D the meshes on the screen while the
  camera moves (`StageState.moveWith`: those of both by default, all of
  either, or none): A becomes D (fade out, then fade in), the camera moves
  and tilts (zooming in: move, then tilt; otherwise the reverse), and D
  becomes B. Of the meshes that fade in as D becomes B, those in
  `StageState.later` fade in after the others. The meshes in
  `StageState.cut` go or come at once, with no fade. The meshes in
  `StageState.goLater` stay on the screen while the camera moves, and go
  after it. A dim (`StageState.dim`) eases in step 3, after the meshes that
  go have faded out and before the others fade in. With nothing on the screen,
  the camera jumps. A key press
  during a change starts from what is on the screen: a fade cut short ends
  first. The timeline has no DOM and no WebGL, so its tests
  (`timeline.test.ts`) drive it with made-up times. `Stage`
  (`webgl/stage.ts`) holds the renderer, the model and the frame loop. The
  watch talk's slides are the examples
  ([`watches/docs/watch.md`](../watches/docs/watch.md), "The one rule").
- **A state can flash meshes during a change** (`StageState.flash`). If they
  are on the screen, the flash plays first, and the change starts as soon as
  it ends; if they fade in, it plays when they are in. A delayed text cue can flash without changing a channel (`StageState.flashDelay`).
  It starts after both the text delay and any watch change have ended.
  An inverse cue (`StageState.flashInverse`) uses subject inks first for meshes already in second inks.
  A state shown at once never flashes. A key
  press during the flash does not start it again. `Stage.show` (from
  `Timeline.show`) returns the seconds until the flash ends.
  The caller passes a flash only on the step forward into the slide or the
  click that names it ([navigation.md](navigation.md)); the timeline itself never asks which way
  the viewer went. `viewEndAt` says when the camera's move ends, for text that
  waits for it.
- **A model can tell a story of its own at a change** (`Model` in
  `webgl/stage.ts`; the watch's winding key). It starts when the stage's
  change ends (`show`'s `after`). The model knows from where its story is
  whether a step goes forward or back, so nothing asks which way the viewer
  went. The story may show meshes that no
  state names, at an opacity (`extra`). The renderer has one fade, so the
  story fades them only while the timeline does not fade; if both fade at
  once, the story's meshes show whole, or not at all. `Stage.endAt` and
  `movingAt` include the story.
- **A fade fades its meshes as one picture**, as SVG's group opacity does:
  the fading parts never show their own hidden lines.
- **Stills:** the export, the overview and the presenter's "next" pane show a
  picture of each slide's art, drawn by one hidden renderer for the page. The
  PDF export is a bitmap at twice the slide's size: good for a projector, not
  for a zoomed-in PDF.
- **Make a PDF before each talk** (`pnpm export`) as the fallback if the live
  art fails. It has one page for each click, not for each slide
  (`--with-clicks`): the audience cannot tell a click from a new slide, so the
  PDF must not either.

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
- `art/privacy_check.py` (`pnpm art:privacy DECK`, on the built deck):
  Chromium, Firefox, and WebKit must start the live watch with canvas pixel
  reads blocked. This catches a palette error that can leave a slide blank.
- `art/print_check.py` (`pnpm art:print DECK`, on the built deck): for each
  slide and click, the state that the printed page's still shows must equal the
  live slide's. It compares states, not pixels, and it opens a slide in print
  mode, not Slidev's `/print` route (a build has none). `--browser firefox` or
  `webkit` runs it in another engine. Copy it with the
  layers; it reads the `data-watch` attribute that `global-bottom.vue` and
  `slide-bottom.vue` write.

A change to `webgl/` that must not change the picture: draw frames with
`uv run art/pixel_regression.py OUT_DIR` before and after, and compare them
with `--compare BEFORE AFTER`. Two runs of the same code are byte-identical.

## Mistakes that were made once

- **Size the drawing from the canvas's bounding box**, not `clientWidth`:
  Slidev scales the slide with a CSS transform. A drawing sized from
  `clientWidth` was stretched 1.76× on the laptop and 2× on a projector.
- **A still shows the art at the click of its page, not at click 0.** Each
  printed page is one click of a slide. Take the click from that page, never
  from a constant. Only the overview and the presenter's "next" pane show
  click 0. A still that ignores the click makes the page disagree with itself:
  the text is at click 3 and the art at click 0. `art:print` finds this.
- **A still per printed page must share one renderer**: one WebGL context per
  page passes the browser's limit.
- **A positioned still paints over the slide's text** unless the slide's layout
  is positioned too.
- **Keep the talk's names out of the renderer**, so that the next talk can use
  it.

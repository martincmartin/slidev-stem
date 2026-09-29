# Implement the WebGL watch, and remove the watch's SVG

Written 2026-09-29, when the planning task
[`watches/tasks/2026-09-28-webgl-planning/`](../2026-09-28-webgl-planning/PLAN.md)
closed. These are the instructions for the implementation. The reader can be a
person or an AI model. Do every step in order. Do not skip a check.

## 0. Before you start

1. Read these files completely:
   - `stem/AGENTS.md` and `~/.claude/AGENTS.md` (the house rules).
   - `stem/docs/webgl.md` (the decision, and the rules for 3D art).
   - The planning task's `PLAN.md`, sections 1, 4, 5, 10, 10.1, 11, 12 and 13.
     You do not need the other sections.
2. Write `PLAN.md` in this directory (the house rule for a task). It holds
   your plan for each stage below, and any option that you consider. Update it
   as you work: what you did, the numbers that you measured, what failed.
3. **Ask the user** (do not guess) when:
   - a check in this file fails, and the fix changes how the watch looks;
   - a step in this file is not possible, or is wrong;
   - you want to add a dependency that this file does not name;
   - you want to commit. **Never commit without the user's approval.** Before
     a push: `git pull --rebase && git push`.
   - you must run a check that opens visible browser windows (stage 10):
     the user must not use the computer while it runs.
4. Work in the directories that each stage names. Do not change a file in
   another talk, or in a task directory, except this one.

## 1. What is done at the end

- The talk `watches/` shows the skeleton watch live, in WebGL, on the cover and
  on slide 2. There is no watch SVG in the talk, and no code that writes one.
- Slide 2 is the opening sequence of the planning task (section 10.1): zoom to
  the hairspring, fade the rest of the watch (keep the hairspring and its stud),
  tilt 20° while it swings, then at a click settle the balance at rest.
- The renderer and the stage are TypeScript, in `watches/webgl/`. They have no
  watch names in them, so that another talk can use them later.
- The watch's geometry is made in TypeScript, in `watches/watch/`, at load,
  from a small design file that Python writes (`watches/watch/design.json`).
- `uv run ../tools/validate.py` in `watches/` runs, and passes, these checks
  in addition to today's: TypeScript types (`vue-tsc`), ESLint, the unit tests
  (`node --test`), and the art checks of the WebGL watch (palette and stroke
  ladder on its scene; `barroom.py` and `motion.py` on pictures of it).
- The 13 reference pictures in `reference/` are drawn again by the new code,
  with a solid error of at most 5 CSS px² each (stage 5).
- `docs/` and `watches/docs/` describe what was built.

## 2. Decisions that are made.

Do not open them again without good reason, and ask the user first.

| Decision | Where the reason is |
| --- | --- |
| WebGL2 for the watch, for the whole talk; no SVG of the watch | planning `PLAN.md` sections 9 and 11 |
| Lines: screen-space instanced quads; the centre-line test for hidden lines (a line is drawn where its centre is visible) | section 4 |
| Line widths are CSS px on the screen, at every zoom | section 4 |
| Faces: flat fills, no lighting, no textures | section 5 |
| The fade: draw the frame with and without the rest of the watch, and mix the two pictures | section 10.1 |
| The settle: smoothstep in angle, $D = \sqrt6/\omega = 0.78$ s, from the next extreme; the rest of the mechanism follows by the time map; resume on to the opposite extreme | section 10.1 |
| The hairspring's stud is a new part; the balance and its staff fade | section 10.1 |
| Keep the clip discs: a part is hidden inside the root circle of each wheel above it, at any height, as in the 2D art | user, 2026-09-29; figure `evidence/figures/clips-on-off.png` of the planning task |
| The renderer takes general triangle meshes; an extrusion is one way to make a mesh | section 13.2 |
| Geometry is made in TypeScript at load; Python keeps the design (the layout search, the clearance checks) and writes `design.json` | section 13.3 |
| TypeScript, strict; ESLint with typescript-eslint; Prettier | section 12 |
| The renderer lives in the talk (`watches/webgl/`) until a second talk needs it | user, 2026-09-29 |
| The timekeeper cards stay SVG, with their checks | user, 2026-09-29 |
| `barroom.py` and `motion.py` get a PNG input | user, 2026-09-29 |
| Slide 2's title shows after the zoom | user, 2026-09-29 |

## 3. What you start from

This directory has frozen copies. Read them; do not edit them.

| Path | What it is |
| --- | --- |
| `inputs/spike/tools/webgl/renderer.js` | The spike's renderer: port it to TypeScript (stage 3) |
| `inputs/spike/tools/webgl/stage.js` | The spike's stage and balance clock: port it (stage 6) |
| `inputs/spike/tools/webgl/index.html` | The spike's probe page: the model for the new probe page (stage 5) |
| `inputs/spike/out/scene.json` | The spike's scene: every solid's outline, heights, fill, line styles, clip discs. **The table of truth for the generator** (stage 4) |
| `inputs/spike/tools/cover_model.py`, `depth_order.py`, `watch_svg.py`, `scene_export.py` | How the spike made the scene from the 2D SVG: the height rules, the stud, the styles, the spiral |
| `inputs/spike/deck/` | The spike's Slidev files: `global-bottom.vue`, `slide-bottom.vue`, `watch-state.ts`, `slides-opening.md` |
| `inputs/spike/tools/deck_check.py`, `fade_check.py`, `settle_check.mjs`, `pixel_check.py`, `export_server.mjs` | The spike's checks: port what stages 6 and 10 need |
| `inputs/art/` | The talk's Python art code, as it was: `skeleton_watch.py` (the design and the SVG writer), `watch_geometry.py`, `search_skeleton_watch_layout.py`, `validate_skeleton_watch.py`, `favicon.py`, and the SVG |
| `reference/*.png`, `reference/stills.json` | 13 pictures that the spike drew (Chromium, GPU, 1960 × 1104 px). The target of stage 5 |
| `tools/reference_stills.py` | Makes the references (done; do not run `make` again) and compares a new page with them (`compare --url`) |

## 4. The files at the end

```text
watches/
  package.json            scripts: dev, build, export, format, typecheck, lint, test, art:scene, art:stills
  tsconfig.json           strict TypeScript for webgl/, watch/, the .vue files
  eslint.config.js        ESLint flat config (stage 1)
  slides.md               the cover and slide 2 use the live watch (stage 8)
  global-bottom.vue       the live watch layer under every slide (from the spike)
  slide-bottom.vue        the stills for print, export, overview, presenter "next" (from the spike)
  webgl/                  shared-to-be: no watch names in it
    scene.ts              the types of a scene: meshes, lines, groups, views, subjects
    mesh.ts               helpers: extrude an outline into a mesh; triangulate caps (earcut)
    renderer.ts           the renderer (port of renderer.js, for general meshes)
    stage.ts              the stage: channels one at a time, fades, camera, the model's clock
    stills.ts             one shared hidden renderer for all stills of a page
    probe/index.html      the probe page (stage 5) and its probe.ts; built by Vite for the checks
    *.test.ts             unit tests (node --test)
  watch/                  the watch's own code
    design.json           written by art/watch_design.py: do not edit by hand
    design.ts             the types of design.json, and its check at load
    shapes.ts             2D outlines: gear, escape wheel, openings, pinion, dagger, spiral, fork
    generate.ts           design -> scene: the parts, their heights, styles, discs, views, subjects
    model.ts              the watch's motion: steppers, fork, balance clock (settle, resume), spring
    state.ts              slide frontmatter -> stage state (from the spike's watch-state.ts)
    dump.ts               Node command: write the scene as JSON (for scenecheck.py)
    *.test.ts             unit tests
  art/
    watch_design.py       was skeleton_watch.py, without the SVG writer: writes watch/design.json
    watch_geometry.py     unchanged except its imports
    search_watch_layout.py  was search_skeleton_watch_layout.py
    validate_watch_design.py  was validate_skeleton_watch.py: layout checks, then writes design.json
    watch_stills.py       renders PNG stills of the watch for barroom.py and motion.py
    favicon.py            imports its colours from watch_design.py
  public/cover/           removed
stem/tools/
  barroom.py, motion.py   also take PNG input (stage 7)
  scenecheck.py           new: palette and stroke ladder of a scene JSON (stage 7)
  validate.py             runs the talk's TypeScript and art checks (stage 7)
```

## 5. The data

### 5.1 `watch/design.json` (Python writes it, TypeScript reads it)

It holds every number that the layout search and the clearance checks use, and
nothing that only the drawing uses. `art/watch_design.py` writes it with
`json.dumps(..., indent=1)` and a final newline, so that git diffs are readable.
Names are strings in the file; `design.ts` turns each name into a reference to
its object once, at load.

```ts
interface DesignFile {
  format: 1
  canvas: { width: 980; height: 552 }       // CSS px of the slide
  watchCentre: [number, number]             // (798, 276): the cover's watch centre
  palette: {                                // from the theme, by theme_palette()
    line: string; frame: string; detail: string; knockout: string; background: string
  }
  timing: {
    period: number        // 2 s: one swing of the balance
    amplitude: number     // 150 degrees
    pinArc: number        // 25 degrees
    bank: number          // 9 degrees
    fourthLoop: number    // 60 s
    hourRatio: number     // 12
  }
  wheels: Array<{         // TRAIN order: barrel, centre, third, fourth, escape
    name: string
    teeth: number
    pitchRadius: number
    inner: number         // Wheel.inner (root circle)
    outer: number         // Wheel.outer (tip circle)
    depth: number         // Wheel.depth
    pitch: number         // Wheel.pitch
    spokes: number
    leaves: number
    pinionRadius: number | null
    step: number          // degrees a beat (Wheel.step)
    arbor: [number, number]      // Placement.arbor, from the watch centre
    driven: string | null        // the wheel whose pinion it turns
    toothPhase: number           // build()'s tooth_phase(wheel)
    pinionPhase: number | null   // build()'s pinion phase: direction to the driver + 180/leaves
  }>
  escapeSolid: boolean
  escapePhase: number            // ESCAPE_PHASE + LAYOUT.lever_angle, as build() uses it
  balance: {
    radius: number; arbor: [number, number]; impulsePinRadius: number
    pinDirection: number         // direction(balance arbor, fork arbor)
    studAngle: number            // direction(balance arbor, centre arbor) + 150
  }
  fork: {
    pivot: [number, number]; heading: number   // direction(fork arbor, balance arbor)
    outline: Array<[number, number]>          // fork_outline(mouth): (along, across)
  }
  stack: string[]                // STACK order, back to front, by name
  case: { caseRadius: 250; bezelRadius: 228; ringRadius: 192 }
  hands: { hour: 2; minute: 35 }
}
```

### 5.2 The scene (TypeScript objects, made at load; `webgl/scene.ts`)

The scene is not a file. `watch/generate.ts` makes it at load. `watch/dump.ts`
writes it as JSON for the checks, with each object reference written as the
index of that object.

```ts
type Vec3 = [number, number, number]
interface Colour { hex: string; opacity: number }   // a palette colour; opacity over the paper
interface LineStyle { colour: string; opacity: number; width: number }  // width: CSS px
interface Line { points: Vec3[]; closed: boolean; style: LineStyle }    // always drawn
interface SilhouetteEdge {                           // drawn only where the view turns the surface
  start: Vec3; end: Vec3; normalBefore: Vec3; normalAfter: Vec3; style: LineStyle
}
interface Disc { centre: [number, number]; radius: number }  // in plan, slide px
interface Group { name: string; parent: Group | null }       // its matrix comes each frame
interface Mesh {
  name: string
  part: string            // the part's name, for reports only
  group: Group | null
  fill: Colour | null     // null: lines only (a decal)
  triangles: Float32Array // x, y, z of each vertex, three vertices a triangle
  lines: Line[]
  silhouetteEdges: SilhouetteEdge[]
  hiddenInside: Disc[]    // the clip discs: not drawn inside, at any height
  lineOrder: number       // lines are drawn in increasing lineOrder (the spike's zTop)
  inDrawing: boolean      // false for the stud: the 2D drawing did not have it
  dynamic: boolean        // true for the hairspring: its geometry changes each frame
}
interface View { name: string; scale: number; shift: [number, number]; pivot: Vec3 }
interface Subject { name: string; meshes: Set<Mesh> }
interface Scene {
  slide: [number, number]; paper: string
  meshes: Mesh[]; groups: Group[]; views: View[]; subjects: Subject[]
}
```

The renderer takes, for each frame:

```ts
interface Frame {
  view: View                        // or an eased mix of two views
  tilt: number                      // degrees
  groupMatrices: Map<Group, Float32Array>  // 4 x 4, column-major; the model computes them
  keep?: Set<Mesh>                  // a fade: these stay
  rest?: number                     // the opacity of all other meshes, 0 to 1 (default 1)
  size: [number, number]            // device px
  drawingOnly?: boolean             // leave out meshes with inDrawing false
}
```

and `renderer.updateMesh(mesh, geometry)` for a dynamic mesh.

## 6. Stages

Each stage ends with its checks. Do not start the next stage until they pass.
Record the results in `PLAN.md`.

### Stage 1. Tools and settings for TypeScript (about 0.5 day)

In `watches/`:

1. Add the development packages:
   ```bash
   pnpm add -D typescript vue-tsc eslint @eslint/js typescript-eslint eslint-plugin-vue eslint-config-prettier globals @types/node
   pnpm add earcut
   ```
   TypeScript is in the lockfile today only because Slidev depends on it.
   `earcut` has its own types.
2. Write `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2023",
       "module": "ESNext",
       "moduleResolution": "Bundler",
       "lib": ["ES2023", "DOM", "DOM.Iterable"],
       "types": ["node"],
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "exactOptionalPropertyTypes": true,
       "noImplicitOverride": true,
       "noFallthroughCasesInSwitch": true,
       "noPropertyAccessFromIndexSignature": true,
       "erasableSyntaxOnly": true,
       "verbatimModuleSyntax": true,
       "allowImportingTsExtensions": true,
       "resolveJsonModule": true,
       "noEmit": true,
       "skipLibCheck": true
     },
     "include": ["webgl/**/*.ts", "watch/**/*.ts", "*.vue", "components/**/*.vue"]
   }
   ```
   - `erasableSyntaxOnly`: Node runs `.ts` files by removing their types. It
     cannot run `enum`, `namespace` or class parameter properties.
   - `allowImportingTsExtensions`: Node needs the `.ts` extension in each
     relative import (`import { x } from "./mesh.ts"`). Vite accepts it too.
3. Write `eslint.config.js`: `@eslint/js` recommended;
   `typescript-eslint`'s `strictTypeChecked` and `stylisticTypeChecked` with
   `parserOptions.projectService: true`; `eslint-plugin-vue`'s
   `flat/recommended`, with `tseslint.parser` as the parser inside `<script>`
   and `extraFileExtensions: [".vue"]`; `eslint-config-prettier` last (Prettier
   formats; ESLint must not). Ignore `dist/`, `tasks/`, `node_modules/`,
   `components.d.ts`, `.venv/`. Add the browser and Node globals from
   `globals`.
4. In `package.json`, add the scripts:
   ```json
   "typecheck": "vue-tsc --noEmit",
   "lint": "eslint .",
   "test": "node --test \"webgl/**/*.test.ts\" \"watch/**/*.test.ts\"",
   "art:scene": "node watch/dump.ts",
   "art:stills": "uv run art/watch_stills.py"
   ```
5. Add `tsconfig.json` and `eslint.config.js` to the list of files to copy for
   a new talk (`stem/AGENTS.md`, "A new talk needs its own
   `pnpm-workspace.yaml`", and `docs/talks.md`).

**Checks:** add a first file, `webgl/scene.ts` with the types of section 5.2.
Then `pnpm typecheck` and `pnpm lint` pass. Plant an error (an unused
variable, a missing argument) and see each of them fail; remove it.

### Stage 2. Python writes the design (about 0.5 day)

In `watches/art/`:

1. `git mv skeleton_watch.py watch_design.py`. Remove from it: `build()`,
   `main()`'s SVG writing, the SVG helpers (`attrs`, `element`, `wrap`,
   `circle`, `rotor`, `turning`, `under`, `Placement.hole`), and every
   function that only makes SVG path strings (`gear`, `escape_outline`,
   `openings`, `disc`, `ring`, `spiral`, `wheel`, `pinion`, `dagger`). Keep:
   the parts (`Wheel`, `Balance`, `Fork`), the constants, `Layout`,
   `LAYOUT`, `Placement` (without `hole`), `fork_outline`, `polar`,
   `direction`, `clock`, `balance_angle`, `tick_window`, `theme_palette`.
   Keep anything that `watch_geometry.py` and the search import.
2. Add `design()` (returns the dict of section 5.1) and a `main()` that
   writes `watches/watch/design.json`. Compute each value with the same
   code that `build()` used (the frozen copy is `inputs/art/skeleton_watch.py`).
3. `git mv search_skeleton_watch_layout.py search_watch_layout.py` and
   `git mv validate_skeleton_watch.py validate_watch_design.py`. Change
   their imports. The validator keeps its layout checks; then it writes
   `design.json`. Remove its steps that write and check the SVG (stage 7 moves
   the art checks to `validate.py`).
4. `favicon.py`: import its colours from `watch_design`.
5. In `watches/pyproject.toml`, nothing changes (`files = ["art"]`).

**Checks:** `uv run art/validate_watch_design.py` passes and writes
`watch/design.json`. Run it twice: the file is byte-identical. `ruff`,
`mypy --strict` and `pyright` pass on `art/`. The arbors in the file equal
the spike's (compare `wheels[].arbor` with the group translations in
`inputs/spike/out/scene.json`, to 0.05 px).

### Stage 3. The renderer in TypeScript, for general meshes (about 1.5 days)

In `watches/webgl/`:

1. `scene.ts`: the types of section 5.2.
2. `mesh.ts`:
   - `extrude(rings, bottom, top, style, options)`: a closed outline with
     holes (even-odd, as SVG fills) becomes a mesh. Sort the rings by
     containment: a ring inside an odd number of rings is a hole of the
     smallest ring around it. Triangulate each outer ring with its holes by
     `earcut`, at `bottom` and at `top`. Each outline edge becomes a wall of
     two triangles. Lines, as the spike's `lineInstances`: every top and
     bottom edge is a `Line`; each vertical edge at a corner, or at the end of
     an open outline, is a `Line`; each other vertical edge is a
     `SilhouetteEdge` whose normals are the outline normals of the edges
     before and after it, with z = 0.
   - `ribbon(polyline, bottom, top, style)`: an open outline with walls only
     (the hairspring, the mainspring), the same lines.
   - The crown is an extrusion along x: transform its vertices and normals by
     the spike's `placement()` matrix once, when you make it.
3. `renderer.ts`: port `renderer.js`. Keep every shader, the centre-line
   test, the tolerance, the two render targets and the mix of the fade, the
   capsule lines, and context loss. Change:
   - faces: draw the mesh's triangles with the depth test. Remove
     stencil-then-cover (the triangles do its job).
   - silhouette edges: the vertex shader tests two 3D normals. Turn them by
     the inverse transpose of the model matrix's upper 3 × 3 (a
     non-uniform scale needs it).
   - lines are drawn in increasing `lineOrder`, then in scene order (a
     stable sort), as the spike drew them by `zTop`.
   - clip discs become `hiddenInside`, in the same shader test.
   - fills: a `Colour` over the paper, blended in the renderer:
     `opacity × colour + (1 − opacity) × paper`.
   - no keyframes, no swing, no spiral, no time: the model gives the group
     matrices and updates the dynamic meshes (stage 6).
   - the canvas size: from `size` in the frame. The caller computes it from
     the canvas's bounding box (see gotcha 1).
4. Unit tests (`webgl/*.test.ts`, no WebGL): `extrude` of a square with a
   square hole makes 16 cap triangles or fewer, 16 wall triangles, 16 lines
   and no silhouette edges; a circle of 64 points makes 64 silhouette edges;
   the ring sort finds a hole inside a hole.

**Checks:** `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.

### Stage 4. The watch's generator (about 3 days)

In `watches/watch/`:

1. `design.ts`: read `design.json` (`import design from "./design.json" with { type: "json" }`),
   check its `format` and the type of each value at load (types do not check
   JSON), and turn names into object references.
2. `shapes.ts`: port the outline functions of `inputs/art/skeleton_watch.py`
   (`gear`, `escape_outline`, `openings`, `disc`, `pinion`, `dagger`,
   `spiral`, `fork_outline` points) to functions that return polylines, not
   SVG strings. Flatten each arc and curve to points no more than 0.01 px from
   the true curve at the cover's scale (the hairspring view zooms 4.46×).
   Mark a point as a corner where two segments meet at an angle (the spike's
   `corners`).
3. `generate.ts`: make every part of `build()` (lines 759–1176 of the frozen
   `skeleton_watch.py`) as meshes, with:
   - the heights of the spike's model: `cover_model.py` (`movement()`,
     `frame()`, `stud_for()`) on top of `depth_order.py` (`build_solids()`
     with `MESHING`). Port the rules, not the numbers: they depend on the
     layout.
   - the fills and line styles of each 2D element: the colour, the opacity
     and the stroke width that `build()` gives it. The case, lugs, strap and
     crown are the frame colour at opacity 0.18.
   - the minute ticks and hour marks as lines on the chapter ring's top face
     (the spike's "decals").
   - the clip discs (`hiddenInside`): for each round part, the inner disc of
     each part above it in `stack` that overlaps it (`build()`'s `above`),
     on each mesh of that part.
   - the stud (`cover_model.py`, `stud_for()`), with `inDrawing: false`.
   - the balance staff (`depth_order.py`, the end of `build_solids()`).
   - the views of `scene_export.py` (`views()`, `crown_view()`) and the
     subject "hairspring and stud".
   - groups: one per turning part, as the spike's groups (see
     `inputs/spike/out/scene.json`, `groups`).
4. **Compare with the spike's scene.** Write `tools/compare_scene.ts` in this
   task. It imports the generator and `inputs/spike/out/scene.json`. For each
   solid in the spike's scene, it finds the generated mesh with the same part,
   bottom, top and fill, and reports the largest distance between their
   outlines (both ways), and any difference in line styles, clip discs or
   `lineOrder`. Run it with `node tools/compare_scene.ts`.
5. `dump.ts`: write the scene as JSON, for `scenecheck.py` (stage 7).
6. Unit tests: each wheel's arbor is one mesh distance from the pinion it
   drives; the tooth counts; no mesh has a NaN.

**Checks:** `compare_scene.ts` finds a mesh for each of the spike's 44 solids
and 2 decals; heights equal to 1e-6; outlines within 0.15 px; styles and discs
equal. Record any difference in `PLAN.md` and ask the user if it is not a
flattening difference.

### Stage 5. The probe page and the pixel check (about 0.5 day)

1. `webgl/probe/index.html` and `webgl/probe/probe.ts`: a page with one
   canvas (980 × 552 CSS px) that builds the scene and a `Renderer` with
   `preserveDrawingBuffer: true`, and sets `window.watchProbe` and
   `window.watchProbeReady` as `tools/reference_stills.py` describes. `time`
   drives the model's steppers; `swing` overrides the balance's angle (and
   the spring's shape).
2. Serve it with Vite: `pnpm exec vite webgl/probe --port 3150` in `watches/`.
3. Run `uv run --project ../../.. python reference_stills.py compare --url
   http://localhost:3150/` in this task's `tools/`.

**Checks:** every still has a solid error of at most 5 CSS px² (the tool
exits 0). If one fails, look at `out/compare/<still>-wrong.png`. Do not raise
the limit; ask the user.

### Stage 6. The stage and the watch's model (about 1 day)

1. `webgl/stage.ts`: port `stage.js` without the balance. The stage runs the
   channels (view, rest, tilt) one at a time, eased, in the order of the spike
   (towards a subject: view, rest, tilt; away: the reverse), from the values
   on the screen now. It takes a model:
   ```ts
   interface Model {
     show(state: ModelState, now: number, instantly: boolean): void
     frame(now: number, renderer: Renderer): Map<Group, Float32Array>  // group matrices; updates dynamic meshes
   }
   ```
2. `watch/model.ts`: the watch's motion, from `stage.js` (`Balance`) and the
   SVG's keyframes (`stepper()`, `tick_window()`, the fork's flips, the
   seconds hand's loop, the hands, `accumulate`): each group's angle at
   mechanism time, interpolated linearly between keyframes as SMIL does; the
   balance's angle and the spring's spiral from the `Balance` clock. The
   spring's spiral has 480 points (`SPIRAL_POINTS`).
3. `watch/state.ts`: the spike's `watch-state.ts` (frontmatter `watch`,
   `watchTilt`, `watchOnly`, `watchSettle`).
4. `webgl/stills.ts`: the spike's `stillOf` (one hidden renderer for the page).
5. Tests: port `settle_check.mjs` to `watch/model.test.ts`, with the same
   numbers as limits (section 10.1 of the planning task): the settle starts
   at the next extreme; at the extreme, no acceleration jump over 1°/s² per
   0.1 ms step; the mechanism time never goes back; resume from rest joins the
   free swing with no acceleration jump.

**Checks:** `pnpm test` passes. The probe page still passes stage 5.

### Stage 7. The house checks (about 1 day)

In `stem/tools/` (house items: see `stem/AGENTS.md`, "House items have one
live copy"):

1. `barroom.py`: accept `.png` files as well as SVG files and directories. A
   PNG is a picture at `DEVICE_SCALE` (2) device px per CSS px, on its own
   background; score it as is. Update the docstring and `--json` output.
2. `motion.py`: add `--png-pair FIRST SECOND` (repeatable): the two frames of
   one animation, as PNGs at `DEVICE_SCALE`. Score each pair as the tool
   scores its SVG frames.
3. `scenecheck.py` (new, stdlib and `lib.py` only): read a scene JSON (from
   `pnpm art:scene`). Check: every fill colour and line colour is one of the
   four art colours of `lib.py`; every line width is on the stroke ladder
   (2, 2.5, 3, 4 CSS px, within 5 %); opacities follow
   `docs/illustrations.md` (a line of the detail colour is at 0.5; a fill is a
   knockout or a wash). Exit non-zero on a failure, with `--json` for programs.
4. `validate.py`, for a talk: run `pnpm typecheck`, `pnpm lint`, `pnpm test`.
   If the talk's `package.json` has the script `art:scene`, run it into a
   temporary file and run `scenecheck.py` on it. If it has `art:stills`, run
   it into a temporary directory; it writes `*.png` and `pairs.json` (a list
   of `[first, second]` file names). Run `barroom.py` on the PNGs and
   `motion.py --png-pair` on each pair.
5. `watches/art/watch_stills.py`: build the probe page with Vite into a
   temporary directory, serve it, and write PNGs of the cover (tilt 0, at the
   size the slide shows it) and one motion pair: two frames half a balance
   period apart (1 s: the escapement moves). Name them so that
   `barroom.py`'s table is readable.
6. Update `tools/README.md` and the docstrings.

**Checks:** `uv run tools/validate.py` in `stem/` passes. `uv run
../tools/validate.py` in `watches/` passes. The cover's `barroom.py` numbers
are near the SVG's (`watches/docs/measurements.md`: hold 3.64, p90 6.90); a
large change needs a reason in `PLAN.md`. Plant an error (a line width of
2.25) and see `scenecheck.py` fail; remove it.

### Stage 8. The talk's slides (about 0.5 day)

In `watches/`:

1. `global-bottom.vue` and `slide-bottom.vue` from the spike, with the new
   stage, model and `state.ts`. Remove the spike's `vite.config.ts` fix: the
   theme's `vite.config.mts` does that now.
2. `slides.md`:
   - The cover: remove `<img class="cover-watch-art" …>` and its CSS. Add
     `watch: cover` to the headmatter. Keep the title's layout.
   - Slide 2 ("Hairspring and Balance Wheel"): `watch: hairspring`,
     `watchOnly: hairspring and stud`, `watchTilt: 20`, `watchSettle: 1`,
     `clicks: 1`. Its title fades in after the zoom.
   - The transition from slide 1 to slide 2: the spike's `watch-zoom` (the
     title leaves in 0.9 s; the new slide's text comes in after 1.8 s). Only
     this transition: the other slides keep the default. Find in Slidev's
     docs which slide's frontmatter sets the transition between two slides,
     and test it.
   - The title of slide 2 must not overlap the hairspring: at least 16 px
     between the title's box and the spring (the spring is about 535 to 875
     px across). Check it in a screenshot.
3. Speaker notes: add `[click]` for the settle (`watches/docs/slide-patterns.md`).

**Checks:** `pnpm dev`: the sequence works as in the planning task's figure
`evidence/figures/deck-opening.png`. `pnpm build` passes. `pnpm export` makes
a PDF with the watch on the cover and slide 2 (a still; see gotcha 6).
`uv run ../tools/validate.py` passes (`offline_check.py --walk` walks every
click).

### Stage 9. Remove the SVG (about 0.5 day)

1. `git rm watches/public/cover/skeleton-watch.svg` (the timekeeper SVGs stay).
2. Search the talk and `stem/docs/`, `stem/tools/`, `stem/AGENTS.md` for
   `skeleton-watch.svg`, `skeleton_watch`, `cover-watch-art`,
   `validate_skeleton_watch`, `search_skeleton_watch_layout`. Change each
   live reference. Do not change a task directory.
3. The favicon stays (`favicon.py` draws it by hand).

**Checks:** the searches find nothing outside `tasks/`. `validate.py` passes
in `stem/` and in `watches/`.

### Stage 10. The browser tests (about 1 day; ask the user first)

Port the planning task's `deck_check.py` parts `windows`, `presenter`,
`export`, `overview` and `opening`, and `fade_check.py`, into this task's
`tools/`, for the real talk (`watches/slides.md`, its slides and clicks). Run
them. **Visible windows open: ask the user before you run them, and ask them
not to use the computer.**

**Checks:** as the planning task measured (sections 10 and 10.1): no gap
over 25 ms on the watch slides after page load; the fade has 0 missed frames
at 120 Hz in Chromium; 2 WebGL contexts at most in the presenter view, 1 in the
export; the drawing's size equals the canvas's size on the screen (gotcha 1).
Record the numbers in `PLAN.md` and `evidence/`.

### Stage 11. Docs, and close (about 0.5 day)

1. Make `stem/docs/webgl.md`, `stem/docs/README.md`,
   `stem/docs/illustrations.md`, `watches/docs/*` and `watches/README.md`
   match what you built: the file names, the commands, the checks, the
   measured numbers. Remove their "in progress" notes.
2. Add a dated line to the planning task's `README.md`: this task
   implemented it.
3. Ask the user to close the task and to approve a commit.

## 7. Gotchas: what the planning task learned

1. **Size the drawing from the bounding box.** Slidev scales the slide with a
   CSS transform. `clientWidth` leaves it out; `getBoundingClientRect()` has
   it. The spike drew 1960 px wide on a 3456 px slide until this was fixed.
2. **The first frames are 1 × 1.** Before layout, the canvas's box is empty.
   Do not treat it as an error; do not allocate large targets for it.
3. **Detach the depth texture before the lines read it.** Else WebGL has a
   feedback loop and draws no lines, with no error unless you call
   `getError()`.
4. **A finished eased move must end on its target object**, not a copy with
   the same numbers. The spike compared views by identity and ran a second
   1.8 s "move" between two equal views.
5. **Time only goes forward.** Evaluate each phase from its exact start time
   (a late frame lands on the curve, never past it). A test that samples
   backwards in time finds false jumps.
6. **Stills:** one hidden renderer for every still of a page. Slidev mounts
   the global layer once per printed page, and one WebGL context per page
   passes the browser's limit. Each still sets `data-waitfor` so that
   `slidev export` waits for it. A printed page's render context is
   `"slide"`: read print mode from `useNav().isPrintMode`.
7. **The still paints over the slide's text** unless the slide's layout is
   positioned too (`.watch-marker ~ .slidev-layout { position: relative }`).
8. **The presenter view** draws the "next" pane from stills. Draw them all
   once when the page is idle after load (`requestIdleCallback`): slide changes
   are then smoother.
9. **Headless Chromium uses SwiftShader** (no GPU) unless you pass
   `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`. The export runs on
   SwiftShader, and that is fine.
10. **Playwright artefacts that the talk will not have:** a Playwright
    screenshot stalls the page (a missed frame); Chromium with an emulated page
    larger than its window, after a screenshot, flashes the page small in its
    corner at each URL change. Firefox in kiosk mode sometimes does not start
    the stage; run it again.
11. **Slidev's console errors** "Failed to patch FloatingVue" and "Wake Lock
    permission request denied" are Slidev's, and harmless.
12. **Prettier and deck files:** a deck file that is not `slides.md`,
    `slides-*.md` or `pages/*.md` needs an entry in `stem/.prettierrc` first.
    Prettier does not format `tasks/`.
13. **Keep watch names out of `webgl/`.** Another talk will use it (a train, an
    interferometer, a lunar module). Only `watch/` and the slides know the
    parts.
14. **Refer to objects, not names**, except at the file boundary
    (`design.json`, the frontmatter): turn a name into its object once.
15. **The spring's formula exists once**: in `watch/model.ts`. The planning
    task had it twice (Python and JS); that is what this design removes.
16. **Firefox's timer** has a resolution of 1 ms: its JS times are coarse.
17. **`node --test` and `.ts`:** Node 26 runs `.ts` files directly, but only
    erasable syntax (`tsconfig.json`'s `erasableSyntaxOnly` enforces it), and
    relative imports need the `.ts` extension.

# Plan: implement the WebGL watch

Started 2026-09-29. The steps and the decisions are in
[instructions.md](instructions.md). This file holds my plan for each stage,
the options that I consider, and the results. The planning task
([`../2026-09-28-webgl-planning/`](../2026-09-28-webgl-planning/PLAN.md)) holds
the reasons for the decisions in section 2 of the instructions.

## Order of work

I do the stages in the order of the instructions (1 to 11). A stage starts
only when the checks of the stage before it pass. Stage 10 needs visible
windows, so I ask the user first.

## Options

### Stage 1: which ESLint parser setup for `.vue` files

| Option | For | Against |
| --- | --- | --- |
| `eslint-plugin-vue` `flat/recommended` and `tseslint.parser` in `<script>` (the instructions) | One config; type-aware rules in `.vue` | The `.vue` files need `extraFileExtensions` |
| `vue-eslint-parser` with no type-aware rules on `.vue` | Simpler | The `.vue` files are unchecked by the strict rules |

Chosen: the first, as the instructions say.

## Log

### Stage 1

Done 2026-09-29.

- Packages added as the instructions say. `pnpm add -D typescript` took
  TypeScript 7.0.2; typescript-eslint 8.71 accepts `>=4.8.4 <6.1.0`
  (`pnpm peers check` failed). Pinned `typescript@~6.0.3`, the version that
  Slidev already had in the lockfile. Peer check is clean.
- `tsconfig.json` as the instructions give it. `eslint.config.js`: the
  instructions' setup, plus `"@typescript-eslint/no-unsafe-call": "off"` for
  `.vue` files: typescript-eslint types `defineProps` as unresolved (it does
  not know Vue's compiler macros); `vue-tsc` checks those calls.
  The `*.js` files are not linted (the config itself).
- Scripts `typecheck`, `lint`, `test`, `art:scene`, `art:stills` added.
- `webgl/scene.ts` has the types of section 5.2.
- Checks: `pnpm typecheck` and `pnpm lint` pass. A planted error (unused
  variable; a missing argument) fails `lint` and `typecheck`; removed.
- `tsconfig.json` and `eslint.config.js` are in the new-talk copy list
  (`stem/AGENTS.md`, `docs/talks.md`).

### Stage 2

Done 2026-09-29.

- `git mv` of the three scripts. `watch_design.py` keeps the parts, constants,
  `Layout`, `Placement` (without `hole`; `fork_polygon` stays, the geometry
  checks use it), `fork_outline`, `polar`, `direction`, `clock`,
  `balance_angle`, `tick_window`, `theme_palette`. Removed: `build()`, the
  SVG writer and helpers, the shape functions, and also `stepper`, `rotor`,
  `turning`, `under`, `num`, `decimal`, `coords` (they only made SVG or
  SMIL keyframes; `watch/model.ts` makes the keyframes in stage 6).
- `design()` returns the dict of section 5.1; `main()` writes
  `watch/design.json`. `favicon.py`, `watch_geometry.py` and the search import
  from `watch_design`. `validate_watch_design.py` checks style, types and
  layout, then writes the JSON; the SVG art checks are gone (stage 7).
- Checks: the validator passes. Two runs: `design.json` byte-identical.
  Ruff, mypy strict and pyright pass. The arbors are within 0.045 px of the
  spike's group translations (the centre wheel is at the origin).

### Stage 3

Done 2026-09-29. The renderer is not run in a browser yet: stage 5 does that.

- `webgl/mesh.ts`: `extrude` (rings, even-odd containment sort, earcut caps,
  walls, lines and silhouette edges), `ribbon`, `ribbonGeometry` (for
  `updateMesh`), `transformMesh` and `normalMatrix` (for the crown).
  A `Ring` carries its own line style (or `null`) and its corner flags, since
  in the 2D art a fill path and the stroke paths of one part have different
  widths. `webgl/checked.ts`: `at()`, because `noUncheckedIndexedAccess` and
  the lint rules for `!` and `as` leave no other clean way to index.
- `webgl/renderer.ts`: the spike's shaders and centre-line test, ported.
  Changed as the instructions say: faces are triangles with the depth test (no
  stencil; the depth target is `DEPTH_COMPONENT24`), silhouette edges take
  two 3D normals turned by the model's inverse transpose (`normalMatrix`
  uniform), lines are sorted by `lineOrder` (stable), clip discs are
  `hiddenInside` in the same shader test, fills are blended over the paper in
  the renderer, canvas size comes from `frame.size`. Removed: keyframes, swing,
  spiral, time.
- Deviation: the instructions' unit test says a square with a square hole
  makes "16 lines". My `Line` is a polyline, so it has 12: a top and a bottom
  polyline for each of the 2 rings, plus 8 vertical lines at the corners. A
  one-segment `Line` would make 24. The test checks 12.
- ESLint: `no-floating-promises` is off for `*.test.ts` (node:test's `test`
  returns a promise that the runner awaits).
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` (6 tests) pass.

### Stage 4

Done 2026-09-29 (one question for the user, below).

- `watch/path.ts`: SVG-style `Path` (M L A Q C Z) flattened to polylines with
  corners, as the spike's `watch_svg.flatten`; arcs and curves are flattened
  to at most 0.01 px from the true curve (the spike used 3° steps and 16
  steps a curve). `watch/shapes.ts`: the outline functions, ported from the
  frozen `skeleton_watch.py`, exact (no rounding to 0.1 px as the SVG had).
  `watch/design.ts`: reads and checks `design.json`, turns names into objects.
  `watch/model.ts`: only the spring's formula so far (`springPoints`, 480
  points); stage 6 adds the motion.
- `watch/generate.ts`: the parts as solids (in the drawing's order, each with
  its role: body, circle, other, stroke), `assignHeights` (the ports of
  `build_solids`, `train_heights` and `movement`), then the frame, the crown
  (an extrusion along z, turned by a placement matrix), the stud, the decals,
  the views and the subject. One group per turning part; a fixed part (the
  frame, the staff, the stud) is in the root group. `watch/dump.ts` writes the
  scene as JSON (object references as indices; only triangle counts).
- Result: 46 meshes (44 solids and 2 decals), 20,510 wall and cap triangles,
  generated in 23 ms in Node (the plan measured about 10 ms in Chromium).
- `tools/compare_scene.ts` (output: `evidence/compare_scene.txt`): every one of
  the spike's 44 solids and 2 decals has a mesh; **all heights and all line
  orders are equal to 1e-6**; all styles equal; outlines within 0.15 px,
  worst 0.11 px, except three explained cases:
  - **the clip disc of the fourth wheel: radius 41.05 here, 42.37 in the
    spike.** Not a flattening difference. The spike measured the clip circle
    from the SVG's two arcs, whose end points the SVG rounded to 0.1 px; for
    the third wheel's root circle (2 × 41.1 = 82.2 px across, end points
    82.1 px apart) that rounding moves the fitted radius by 1.3 px. The
    exact root circle is $44 - 2.95 = 41.05$ px, and it is what the drawing's
    `A41.1` arcs draw. The other four discs match to 0.01 px. **Ask the user.**
  - the barrel's mainspring: 0.152 px (the spike's 16 steps a Bezier and the
    SVG's rounding);
  - the hairspring at its start pose: 0.43 px. The drawing's 13 Beziers bulge
    off the exact spiral by up to 0.91 px (spike's `scene_export.py`); the
    spiral is the more accurate.
- Views: the cover and the crown views equal the spike's. The hairspring view's
  shift is computed to put the balance's arbor at (705, 276): it differs from
  the spike's hard-coded (-3067.8, -450.3) by (0.2, 0.1) px, because the spike's
  arbor was rounded to 0.1 px.
- Unit tests (`watch/generate.test.ts`, 7): arbor to pinion distance; four
  corners a tooth; a pinion level with its driver; the ring flush with the case
  and the minute hand on it; the spring and the stud; no NaN; the views.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` (13 tests) pass;
  `node tools/compare_scene.ts` exits 0.

### Stage 5

Done 2026-09-29. First run in a browser: all 13 stills pass.

- `webgl/probe/index.html` and `probe.ts`: one canvas, a `Renderer` with
  `preserveDrawingBuffer`, `window.watchProbe.render(options)` and
  `window.watchProbeReady`. To draw at a mechanism time and a balance angle
  the probe needs the motion, so I wrote the mechanism's keyframes in
  `watch/model.ts` now (stage 6 item 2): `stepper`, `forkFlips`, `angleAt`,
  `Motion.matrices(time, swing)` and `Motion.springGeometry(swing)`. Stage 6
  adds the balance's clock (settle, resume) and the `Model` interface.
- Served with `pnpm exec vite webgl/probe --port 3150` (Vite finds `watch/`
  outside its root, because `pnpm-workspace.yaml` is in `watches/`, and reads
  `design.json` with its import attribute; no config file).
- `reference_stills.py compare --url http://localhost:3150/`, Chromium with
  the GPU, 1960 x 1104 px, limit 5 CSS px² of solid error
  (`evidence/compare.json`):

  | Still | Wrong px² | Solid px² |
  | --- | --- | --- |
  | cover-0, 30, 60, 85 | 33.8, 17.5, 10.0, 2.8 | 0 |
  | cover-45-moving | 12.8 | 0 |
  | hairspring-0, 20, 45 | 2400.5, 2410.0, 1904.5 | 0 |
  | crown-0, 45 | 192.5, 49.8 | 0, 0.2 |
  | opening-faded, mid-fade, at-rest | 1.8, 92.0, 1.8 | 0 |

  The large "wrong" areas of the hairspring stills are not solid: the whole
  picture is shifted by about 0.2 px at 4.46 × zoom, because the spike's
  arbor was rounded to 0.1 px (section on views in stage 4) and the spring is
  the exact spiral (up to 0.9 px from the drawing's Beziers). No page errors.

### Stage 6

Done 2026-09-29.

- `webgl/stage.ts`: the stage, without the balance. It takes a `Model<ModelState>`
  (`show`, `frame`, and `phase` for the measurement scripts) and a `StageState`
  of objects (`view`, `tilt`, `subject`). Channels run one at a time, eased, in
  the spike's order; a finished move ends on its target object (gotcha 4).
  `webgl/stills.ts`: one hidden renderer for all stills of a page, keyed by a
  string; the drawing is the caller's closure.
- `watch/model.ts`: `BalanceClock` (the spike's `Balance`: settle, resume, the
  time map) and `WatchModel` (the clock, the `Motion` of stage 5, the spring's
  geometry sent to the renderer each frame). The spring's formula is still only
  there (gotcha 15).
- `watch/state.ts`: the frontmatter as a `WatchState`, and `stageState` turns
  its names into the scene's view and subject once. `watch/stills.ts`:
  `WatchStills` draws a slide's still at time 0.37 s or at rest.
- Tests (`watch/model.test.ts`, 6, from `settle_check.mjs`; limits as in
  section 10.1): the free swing (control: 0.15 deg/s speed jump a step, none in
  acceleration); a settle asked at 7 phases starts at the next extreme with
  no jump in angle, and speed and acceleration jumps under 0.2 deg/s and
  1 deg/s² there; it stops in 0.78 s with no speed jump (acceleration
  under 1000 deg/s² there: the curve's one jump); a resume from rest starts as
  the settle mirrored (acceleration under 1000) and joins the free swing with
  none (under 1); a resume during a settle has no jump in angle or speed; the
  mechanism time never goes back. One assertion of mine was too tight (the
  angle 1 ms before and after an extreme tie to rounding): it now allows 0.01°.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` (19 tests) pass, and the
  probe page still passes stage 5 (13 of 13, the same numbers).

### Stage 7

Done 2026-09-29. House items changed: `tools/barroom.py`, `motion.py`,
`lib.py`, `validate.py`, `README.md`, and the new `scenecheck.py`. The only
talk in progress that uses them is `watches` (no other talk directory exists),
so no talk was held back.

- `barroom.py`: a PNG given as a file is scored as it is (at DEVICE_SCALE 2, on
  its own background); a directory still means its SVGs only, so the favicon
  and other PNGs of a talk's `public/` are not scored by accident. `render`
  returns one picture for each file; `--save` needs at least one SVG.
- `motion.py`: `--png-pair FIRST SECOND`, repeatable. `MotionScore` and the new
  `PairScore` share `Change` (peak, p99, bands, `in_wash`). `--json` gives a
  pair as an entry with a `pair` list.
- `scenecheck.py` (stdlib and `lib.py`): the four art colours; the ladder within
  5%; a line is solid except the detail colour at 0.5; a fill is a wash
  (0.07-0.18) or the subject (0.60-1.0). The opacity constants went into
  `lib.py`. `--json` for programs.
- `validate.py`, for a talk: `pnpm typecheck`, `lint`, `test` if the scripts
  exist; if `art:scene`: the scene into a temporary file, then `scenecheck.py`;
  if `art:stills`: the PNGs and `pairs.json` into a temporary directory, then
  `barroom.py` on the PNGs and `motion.py --png-pair` on each pair (checks made
  when reached, since they need files that the check before them writes).
- `watches/art/watch_stills.py`: builds the probe page with Vite into a
  temporary directory, serves it, draws in Chromium (SwiftShader) `cover.png`
  (tilt 0, 1960 x 1104 px) and `motion-a.png`, `motion-b.png` (time 0 and 1 s:
  the balance at its two ends; the fork and escape wheel move), and writes
  `pairs.json`.
- Results: `uv run ../tools/validate.py` in `watches/` runs 18 checks and
  passes; `uv run tools/validate.py` in `stem/` passes. The cover's
  `barroom.py` numbers at the design venue: **hold 4.13, p90 8.04** (the SVG's:
  3.64, 6.90), Fmax 0.134. Higher, for a reason: the PNG is drawn on the
  slide's paper (#FAF7F0), which is lighter than the card (#F2EEE4) that the
  SVG was scored on, so every mark has more contrast against it; and the 3D
  cover has the strap and lugs. Motion (`motion-a` to `motion-b`): dPeak
  10.2, 3,346 px² change by 3:1 or more (the SVG's floor was 1 px²).
- Planted error: a wheel's line width of 2.25 (in `generate.ts`, and in the
  scene JSON) makes `scenecheck.py` list each wheel at 2.25 CSS px as off the
  ladder, and exit 1. Removed.

### Stage 8

Done 2026-09-29. Screenshots in `evidence/figures/` (`deck-*.png` from
`pnpm dev` in Chromium with the GPU at 1400 x 788; `export-page-*.png` from the
PDF).

- `global-bottom.vue` and `slide-bottom.vue`: the spike's, with the new stage
  (`Stage` with `WatchModel`), `watch/state.ts` and `WatchStills`. `watch/instance.ts`
  makes the watch and its stills once for both. The spike's `vite.config.ts` is
  not needed: the theme's does it.
- **Type checking Slidev's client:** `vue-tsc` checks the sources of
  `@slidev/client` once a `.vue` file imports it, and they do not pass our strict
  settings. `tsconfig.json` maps `@slidev/client` and `@slidev/client/constants.ts`
  to `types/slidev-client.d.ts` and `types/slidev-constants.d.ts`, which declare
  only what the two layers use. (An ambient `declare module` did not work: the
  real file resolves first. `paths` does.)
- **Which frontmatter sets the transition between two slides.** Slidev's
  `logic/transition.ts`: going forward, the transition is
  `prevRoute.meta.transition`, else the global `configs.transition`. So the
  *earlier* slide's frontmatter sets it. But the first slide's frontmatter is
  also the headmatter (`parser/fs.mjs`: `headmatter = slides[0].frontmatter`),
  and a `transition` in it becomes the default of every slide. I first put a
  second `---` block after the headmatter, hoping that it would be slide 1's own;
  it made an *empty slide 1* and the cover slide 2. The fix that keeps the
  cover's transition its own: the headmatter is a first slide with no content,
  `hide: true` (hidden slides are out of the navigation, the overview and the
  export), and the cover is the second block, with `transition: watch-zoom`.
  Tested: the PDF has 2 pages (cover and slide 2, no blank page); `--walk`
  passes. The hidden block is left out of Slidev's numbering (found later): the cover is /1, and there is no cost.
  **Not an oversight:** do not merge the two blocks.
- `slides.md`: the cover has `watch: cover` (no `<img>`, no art CSS); slide 2 has
  `watch: hairspring`, `watchOnly: hairspring and stud`, `watchTilt: 20`,
  `watchSettle: 1`, `clicks: 1`, and speaker notes with a `[click]` line (my
  words for the notes are placeholders: the talk's text is the user's).
- Checked in `pnpm dev`: the cover shows the live watch with the title in the
  left half; a key press zooms to the hairspring while the cover's title
  fades; slide 2's title comes in after the zoom; the rest of the watch fades,
  leaving the spring and its stud; the view tilts 20° while the spring swings
  (a ribbon, with the stud); a click at rest settles the balance (the spring's
  inner end stops at rest). Console: only Slidev's "Failed to patch
  FloatingVue" and "Wake Lock", both harmless (gotcha 11).
- **The gap between slide 2's title and the spring** (tilted 20°, at 1960 x 1104):
  the title's text box ends at x = 600 slide px, the spring starts at x = 542,
  and the nearest spring pixel is **52 px** from the box (limit 16).
- `pnpm export` (3 s): a PDF of 2 pages, the watch on the cover and on slide 2 as
  stills (SwiftShader-free, from the shared renderer).
- `uv run ../tools/validate.py`: 18 checks pass, including `pnpm build` and
  `offline_check.py --walk` (0 outside requests).
- Not done here: measured timing of the sequence (stage 10).

### Stage 9

Done 2026-09-29.

- `git rm watches/public/cover/skeleton-watch.svg`. `public/` now holds
  `favicon.ico` and `timekeepers/`.
- Live references changed: `stem/tools/capture_outputs.sh` (three cover lines
  removed), `stem/docs/illustrations.md`, `stem/docs/webgl.md`,
  `watches/docs/README.md`, `watches/docs/measurements.md` (the SVG table is
  kept as a dated record of the SVG, to be replaced in stage 11), and two
  comments in `watch/shapes.ts` and `watch/generate.ts`.
- What remains under a search for the old names: the row label in that table,
  and other task directories (not changed, by rule).
- `uv run ../tools/validate.py`: 18 of 18 pass.

### Stage 10

Done 2026-09-29. The user agreed to the visible windows, and stayed off the
computer. Ported to `tools/`: `deck_check.py` (parts `windows`, `presenter`,
`export`, `overview`, `opening`), `export_server.mjs`, `fade_check.py`. Run:
`uv run tasks/2026-09-29-webgl-watch/tools/deck_check.py <parts>` from
`watches/`. Numbers are in `evidence/deck_check-*.json` and
`evidence/fade_check.json`. Pictures are in `out/deck/` and `out/fade/`.

**Two faults in my checks (not in the watch), found in the first run.**
1. The on-screen size test read the canvas's layout size (980 × 552), not its
   size after the slide's scale. It now reads the bounding box.
2. The opening test mixed the page-load gap (58 ms, 1.8 s before the first
   key: the canvas goes from 1 × 1 to full size) with later gaps. It now counts
   gaps after the first key apart. The first run's files are in
   `evidence/first-run/`. I ran `windows` and `opening` again.

**Results** (Chromium 153 and Firefox 155, Apple M1, screen 120 Hz):

| Check | Target | Result |
| --- | --- | --- |
| Gaps over 25 ms on the two watch slides, after load (windows: laptop and projector, both browsers) | 0 | 0 in all 4 windows; largest gap 9.4 ms (Chromium), 16.6 ms (Firefox) |
| Opening in Chromium (zoom, fade, tilt, settle, resume, back): gaps over 12.5 ms after the first key | 0 | 0 in every phase, laptop and projector; largest gap 9.4 ms |
| The fade in the opening ("rest" phase) | 0 missed frames at 120 Hz | 0 (192 frames in each Chromium run) |
| Opening in Firefox | (no target) | laptop: 2 gaps over 12.5 ms (16.7 and 25.0 ms), one of them 25.0 ms; projector: 0 |
| WebGL contexts, presenter view | at most 2 | presenter 2, audience 1, both browsers; 0 lost |
| WebGL contexts, export | 1 | 1; 2 pages, PDF 280 kB, 2.8 s until the stills are drawn; no page errors |
| WebGL contexts, overview | (none set) | 1; both stills drawn |
| Drawing size equals canvas size on the screen | equal | laptop 3456 × 1947 for a 1728 × 973.3 px box at ratio 2; projector 1917 × 1080 for 1917.4 × 1080; true in all windows and in the opening |
| JS time a frame | (none set) | median 1.0–1.2 ms, largest 3.5 ms (Chromium), 8 ms (Firefox) |
| Fade picture (`fade_check.py`) | at most 1 level; 0 at the ends | rest 1 against none 0; steps at the ends 0; middle against the mean 0.5, in both views and both browsers |
| Fade GPU time, with `gl.finish` | below 8.33 ms | Chromium: 0.7–0.95 ms median (one outlier of 14.2 ms in 60 draws); Firefox 2–3 ms |

- The next pane of the presenter view shows a still (1 of 1 drawn on slide 2).
- Firefox's one gap of 25.0 ms is at the limit and is not repeated in the
  projector run. Firefox is not the target; I did not look for its cause.
- The page-load gap (about 58 ms in Chromium) happens once, before the first
  frame is drawn at full size. The instructions ask for no gaps after load.

### Stage 11

Done 2026-09-29. **Decision (user, 2026-09-29):** the fourth wheel's clip disc
keeps the exact root radius, 41.05, not the spike's 42.37 (from SVG rounding).

- `stem/docs/webgl.md`: status, the file table, `types/`, the hidden
  headmatter block, the new-talk copy list, the clip radius, measured numbers
  (this task's), the tools to copy.
- `watches/docs/measurements.md`: the cover, measured on PNG stills at
  `TV 55in @7m`: ink 6.6 %, hold 4.13, p90 8.04, Fmax 0.134, dPeak 10.17,
  3346 px² at 3:1 (the SVG had hold 3.64, Fmax 0.080).
- `watches/docs/slide-patterns.md`, `watches/README.md`: commands, the hidden
  first block. `stem/docs/illustrations.md`, `docs/README.md`: no "in
  progress" notes remain.
- Planning task's `README.md`: dated line "implemented".
- Not done, until the user closes the task: copy `deck_check.py`,
  `fade_check.py` and `export_server.mjs` into the project.

### Close

Closed 2026-09-29 by the user. Copied into the project: `stem/tools/deck_check.py`
(takes the talk and `--slides` as arguments; the export server is inline) and
`stem/tools/fade_check.py` (takes the talk, `--subject`, `--view`), both listed
in `stem/tools/README.md`. Checked: ruff, mypy, pyright pass; `overview`,
`export` and `fade_check` gave the same numbers as this task's copies. The
visible parts (`windows`, `presenter`, `opening`) of the new copy were not run
again; this task's `tools/deck_check.py` is what ran them.

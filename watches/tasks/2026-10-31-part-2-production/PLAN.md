# Part 2's opening slides: the plan for the talk

**Status: planning, 2026-10-31. Decided the same day: option 2,** the
globe in WebGL and the story in SVG (section 3). Nothing outside this
directory changed.
The request is in [instructions.md](instructions.md). The design comes from
the mockup of the visual-language task
([`../2026-10-30-part-2-visual-language/`](../2026-10-30-part-2-visual-language/PLAN.md),
"the spike" here), with the choices of its round 7 (its section 17). The
globe's renderer comes from the globe task
([`../2026-10-28-globe-planning/`](../2026-10-28-globe-planning/PLAN.md)).

## Summary

- **Recommendation: option 2.** The globe is drawn in WebGL, in the house
  renderer, in the one live canvas with the watch. The story maps and their
  marks are SVG, in a layer above the canvas, as the diving board is. All
  words are HTML. The talk gets no 2D canvas of its own. The article's
  figures already copy WebGL pictures to 2D canvases (`webgl/shared.ts`),
  and nothing changes there.
- **Why:** the globe needs what the renderer already gives: one camera for
  the watch and the globe, stills for print and the overview, figures in the
  article, the privacy check, and lines at the house widths at every zoom.
  The marks need what SVG gives with no new code: dashes, lines that draw
  themselves, a mask to the sea, and CSS transitions. Section 3 compares
  three options, with data.
- **The new seam is the camera.** During a flight, a story map rides the
  globe's camera for the last 10% and the first 10% (the hand-over). So
  the SVG layer must take the stage's camera at each frame. The stage has
  no such hook now. It is a small, general addition to `webgl/stage.ts`.
- **The new renderer work, all general:** a disc that faces the camera
  (the globe task, section 13), the land's fill (the globe task's design B,
  with `earcut`, a new dependency), a mesh that shows only in a range of
  scales (the levels of detail), and a flight that zooms out and in (van
  Wijk and Nuij) as a move of the timeline.
- **The work is in 8 phases** (section 6). The first is the rename of the
  frontmatter keys to `art…`, decided in the globe task. Each phase ends
  with full validation.
- **Decisions** are in section 7. All are made.

## 1. What the talk's version must do

The house rules that decide the design. Each one comes from a doc; the doc
holds the rule, and this list says only why it matters here.

- **One element across slides** (the `slidev-practices` skill, "Clicks,
  slides and going back"). The camera flies from South America to Cape
  Noir, to Juan Fernández, and across the Atlantic to Scilly: three slides,
  one picture. So the globe and the story maps live in a global layer
  (`global-bottom.vue`), not on a slide.
- **A target for each click, never a move**
  ([`docs/navigation.md`](../../../docs/navigation.md)). A step animates; a
  jump shows the target at once; a key press during a change is a jump. The
  mockup steps back at once, with no motion, so this is new for every mark.
- **One printed page for each click** (`slidev export --with-clicks`), and
  a still that shows that click's state: the count at that click's number,
  the gusts drawn, the ship at its place.
- **The article** ([`docs/article.md`](../../docs/article.md)). A figure is
  the slide, live, at one click, cropped to its picture and its labels (the
  class `in-figure`).
- **Offline, in Chrome, Firefox and Safari, also in private windows**
  ([`docs/talks.md`](../../../docs/talks.md), "Browser support"). The map
  data is bundled. No canvas pixel reads: the privacy check starts the live
  art with them blocked.
- **The frame budget** ([`docs/webgl.md`](../../../docs/webgl.md),
  "Budgets"): 8.3 ms a frame at 120 Hz; the speaker's laptop is 120 Hz.
- **Every color is a role of the theme**
  ([`docs/theme.md`](../../../docs/theme.md)), and every line is on the
  stroke ladder ([`docs/illustrations.md`](../../../docs/illustrations.md)).
- **Data comes from the slide** (the house's "Code design"): each slide's
  frontmatter names its view, its marks and its texts. A new slide needs no
  code.

## 2. What the picture holds, and how the mockup draws it

| Part           | What it does                                                                                                                                          | The mockup                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| The globe      | turns and zooms from the whole globe to 0.9 km a px; 1:110m, 1:50m or 1:10m by the zoom                                                               | a 2D canvas, drawn again at each frame (`mockup/globe.ts`, 556 lines) |
| The flights    | out, across and in, along a great circle                                                                                                              | `mockup/geo.ts` (van Wijk and Nuij, $\rho = \sqrt{2}$)                |
| The story maps | Cape Noir, Anson and Scilly, flat, with straight parallels                                                                                            | SVG, 87 KB, 6 KB and 2 KB, fitted to the globe and riding its camera  |
| The marks      | tracks that draw themselves, day dots, the ships, the dashed ship, the dashed parallel, the error bar, the gusts, the scale bar, the leader to Scilly | SVG                                                                   |
| The words      | the titles, the labels (paper on the sea, ink on the land), the count, the punchline's screen                                                         | HTML                                                                  |

The mockup's code is 3,932 lines, with its tools (`maps.ts`, `shots.ts`,
`speed.ts`). Its globe data is 2,542,015 bytes of JSON.

## 3. The options

### Option 1: the mockup, moved into the talk

A 2D canvas for the globe, SVG for the story maps and the marks, HTML for
the words: the mockup's own split.

- For: it exists and works. Its globe ran at 8.3 ms a frame (median) in
  Chromium and Firefox windows at 120 Hz, and at 17 ms in WebKit's window,
  which runs at 60 Hz (the spike, section 14, "Why a canvas").
- Against: **it is a second motion system beside the stage.** The globe
  would need its own stills for print and the overview, its own figures in
  the article, its own state for the print check, and its own rule for
  every change. The watch's stage has all of these. The step from the
  watch at the end of Part 1 to the globe would be two pictures that fade,
  not one camera move.
- Against: in Firefox, the 95th percentile was 16.7 ms: frames drop at 120
  Hz. In Safari at 120 Hz, the median would be over the budget, if WebKit's
  17 ms holds there (not measured).
- Against: the globe projects about 60,000 points in JS at each frame at
  1:50m, and cuts each shape at the limb. On a phone, for the article, this
  is not measured.

### Option 2: the globe in WebGL, the story in SVG (recommended)

The globe is a model in the house renderer, in the one scene with the
watch. The story maps and the marks are an SVG layer above the canvas, in
`global-bottom.vue`, as the diving board is. The words are HTML.

- For: **the globe gets the house's machinery with no new copy**: the one
  camera and its moves, the fades, the stills, the print check, the article's
  shared renderer and figures, the privacy check, and lines at the house
  widths at every zoom.
- For: **the speed is measured.** The globe task's spike drew the globe at
  1:50m, at full screen, in 0.3 ms in Chromium and 4–5 ms in Firefox (with
  `gl.finish()`), and no engine dropped a frame at 60 Hz. The whole 1:10m
  coast took 0.3 ms and 8 ms.
- For: **SVG does what the marks need, with no new code**: dashes
  (`stroke-dasharray`), a line that draws itself (`stroke-dashoffset`), a
  mask to the sea, and CSS transitions. The marks are small and are still
  while the camera moves. The SVG that was slow in Firefox was the whole
  globe, 968 KB, drawn again at each zoom (42 ms a frame); the story maps
  are at most 87 KB.
- For: a precedent. The diving board is an SVG in the same layer, with its
  targets in the frontmatter, and the article already shows it in figures.
- Against: **two layers must share the camera** during the hand-over (10%
  of each flight) and the zoom from the Channel to Scilly. The stage needs a
  hook that gives the camera at each frame, and the stills and the article
  need the same camera for each click. If the two disagree, the coast shows
  twice; the spike measured this at about 15 px with a 40% hand-over.
- Against: the land's fill costs a triangulation at load: 106,003
  triangles in 44 ms at 1:50m (the globe task, section 4, a 3° grid), plus
  the 1:10m boxes. Not measured with the boxes.
- Against: `earcut` is a new dependency (ISC licence, no dependencies of its
  own). The globe task found no way to fill the land without a
  triangulation.

### Option 3: everything in WebGL but the words

As option 2, and the story maps and the marks are meshes too: each story
map is a flat mesh in the plane that touches the globe at the map's
center, with its fitted turn and scale.

- For: one picture. The hand-over and the Scilly zoom need no hook: the
  story map is in the scene, and the one camera draws it. The stills and
  the article need nothing new.
- Against: **the renderer has no dashes and no line that draws itself**
  (`webgl/` today). Both are new shader work, or a dynamic mesh that
  changes at each frame. A mask to the sea is new too (the stencil buffer,
  or gusts placed only on the sea).
- Against: each story map's land needs its own triangulation, and the
  ships, the dots and the error bar become meshes: more code, for marks
  that SVG draws in a line each.
- Against: the gusts loop by themselves on every story slide: the
  renderer's `Model` story runs once, at a change.

### Ranking

1. **Option 2, decided.** It puts each part where the house already draws that kind
   of thing: 3D art that turns and zooms in WebGL, small and simple
   drawings in SVG ([`docs/webgl.md`](../../../docs/webgl.md), "When to use
   it"), words in HTML. Its one new seam, the camera hook, is small and
   general.
2. **Option 3.** One picture is cleaner, but it builds in WebGL what SVG
   already does: dashes, lines that draw themselves, masks and loops. Pick
   it only if the camera hook of option 2 turns out to be hard (phase 3
   finds out early).
3. **Option 1.** The least new code at first, but a second copy of the
   stage's machinery for the life of the talk, and frames that drop in
   Firefox at 120 Hz.

So, to answer the request: **WebGL** for the globe only (and the watch, as
now). **SVG** for the story maps and every mark on them. **HTML** for every
word. **A 2D canvas** only where the article already copies its WebGL
figures; the talk draws nothing of its own on one.

## 4. What the spike taught

Each lesson has its evidence in the spike's `PLAN.md`; the section is in
brackets.

**The globe and the camera**

- **A story map must keep straight parallels.** On the globe, a parallel
  bows 23 px across the Anson map and 34 px across Cape Noir's, and you
  asked for the west leg level. So each story map has its own flat
  projection, fitted to the globe (section 14).
- **Fit each story map to the globe by least squares** (Procrustes), not at
  its center: the gaps fell from 16.5 / 25.1 / 26.3 px to 3.0 / 5.9 /
  12.7 px (median / 95th percentile / most) for Anson, and Scilly's are
  0.3 / 0.8 / 1.0 px (sections 14, 15). The talk's tool writes the fit;
  the slide does not compute it.
- **The hand-over is 10% of the flight, with the story map clipped to its
  slide.** Not an oversight: at 40%, the coast showed twice, about 15 px
  apart; without the clip, the cut land drew a straight line (section 14).
- **The level of detail goes with the zoom**: 1:110m, 1:50m or 1:10m, by
  the camera's km a px, with 1:10m only in two boxes near the story
  (section 14). A level change pops; the talk can cross-fade it, with the
  renderer's fades (section 14, "Limits").
- **The globe turns, so each view has its own center.** A globe with a
  fixed center does not fit the story maps (gaps up to 52.8 px; section 14,
  "The first view").
- **Flights out, across and in** ($\rho = \sqrt{2}$), 1 s for each unit of
  the flight's length, held within 1–3.5 s; the Atlantic flight takes 7 s,
  at your request (section 15). The house's `together` move does not zoom
  out on the way, so this is a new move of the timeline.
- **The first view is South America** (round 7), and the Cape Noir title
  is over Central America there: its outline keeps it legible (section 14,
  "Limits").

**The words**

- **Few words, and a picture that carries the story** (round 6). A label
  that stays dims to the paper; a dimmed paper label on the sea dims toward
  the sea. One label leaves later than the others, when the next words come
  (`lingers`). The house's "Text dims" pattern
  ([`docs/slide-patterns.md`](../../docs/slide-patterns.md)) and the stage's
  `viewEndAt` cover both.
- **A label's look depends on what is under it**: paper words on the sea,
  ink with the paper's outline on the land. The mockup tests the label's
  box against the land's path, where the label shows, not where its CSS
  first put it (section 15, the fix to the land test).
- **No emphasis in a paper label on the sea**: the accent is 1.74:1 on the
  water's wash (section 14, "Limits"). Today, only the punchlines have an
  emphasis, and they are on the paper screen.
- **The count ticks with the day dots**, so its number comes from the same
  clock as the dots. A printed page shows the number at its click.
- **Each slide ends on a punchline, a click of its own, on a paper screen**
  (round 7).

**The marks**

- **The gusts take turns**: each draws itself from west to east, curls and
  fades, every 3.6 s, masked to the sea. They draw in on the east leg, and
  sit about 45 px from the leg labels (round 7).
- **A callout to small islands has a leader**, as the house draws one
  (`WatchCallout.vue`), not a ring (section 15).
- **Scilly needs its own scale**, 600 px a degree, 8 times the other story
  maps': at their scale, the gap is less than a ship's length (section 15).

**The checks and the tools**

- **A mockup page needs a settled state for its pictures** (`settle=1`)
  and a hook that measures it (`window.mock.measure`). In the talk, the
  print check and the stills take that role.
- **The 2D canvas was fast enough; the SVG globe was not** (42 ms a frame in
  Firefox). Do not draw anything large in SVG that zooms.
- **Keep the choices in one list**, read by the page and the tools: a
  dropdown that was coded by hand went missing with no error (round 6).

## 5. Where each part goes in the talk

- **The globe**: a model in `watch/`'s scene, or a model beside it (the
  globe task, section 11: one scene, keys `art…`). Its data: a file that
  the talk's tool writes from Natural Earth, checked by `art:generated`.
- **The story maps and the marks**: one Vue component in the global layer,
  with an SVG for each story map, from the talk's tool (as
  `art/diving_board.py` writes the board). It takes the camera at each
  frame from the stage, and its targets from the frontmatter.
- **The words**: in the slide's Markdown, with `v-click` ranges for when
  they show and leave, and a component for a label at a place on the map
  (in degrees, or in slide px). The labels have the class `in-figure`, so
  the article's crop holds them.
- **The frontmatter**: the view (`artView`), the story map's marks for each
  click, and the words. The mockup's `story.ts` is the first draft of this
  data.

## 6. The work, in phases

Each phase ends with full validation in the talk, and a commit you approve.

1. **The rename of the keys to `art…`** (the globe task, section 11), in
   its own commit. No picture changes: `art/pixel-regression.ts` compares
   frames before and after.
2. **The data.** The spike's `tools/maps.ts` into the talk's `art/`, writing
   the globe's levels and the story maps, with Natural Earth's source in
   the README ("License"). Make the file smaller than the spike's 2.5 MB
   (fewer decimals, as the globe task says: 4, or 11 m).
3. **The camera hook, first** (the risk of option 2): the stage gives each
   frame's camera to a listener, and the stills give each click's. A test
   SVG rides the watch's camera in the deck, in the stills and in an
   article figure. If this is hard, stop and compare with option 3.
4. **The globe in WebGL**: the disc, the coast, the land's fill (`earcut`),
   the levels by scale, and the new flight move, with tests. The
   renderer's list of inks gets the sea's role, `water-wash` (section 7).
   The disc is a face in the paper, which `tools/scenecheck.py` refuses
   today: it gets a rule for a paper face, and
   [`docs/webgl.md`](../../../docs/webgl.md) a line (the globe task, sections
   5 and 9).
5. **The story layer**: the story maps, their fit, the hand-over, and the
   marks, each with a target for each click and a jump when the viewer
   jumps.
6. **The words**: the label component (paper or ink by what is under it),
   the dims, the count and the punchline's screen.
7. **The article**: narration for the three slides, the figures' crops,
   and the motion of the gusts and the count in a figure. The gusts loop,
   and stop when the reader pauses the figure. The narration
   says each punchline, and no figure shows its screen. The default figure
   of a slide's last run is at the punchline's click
   ([`docs/article.md`](../../docs/article.md), "Which clicks get a
   figure"); the screen is not `in-figure`, so the figure hides it and shows
   the map and its labels. Check that figure.
8. **The checks**: the print check, the three engines in private windows,
   the frame budget in visible windows (`tools/deck_check.py`), and a
   phone for the article.

### The docs that the build adds

In the same change as each phase, as the house's "With each change" asks:

- **`watches/docs/globe.md`**, new: the globe, the story maps and their
  marks, their frontmatter keys, and the data's tool. An entry in
  `watches/AGENTS.md` ("before you change the globe or a story map") and in
  `watches/docs/README.md`.
- **[`docs/webgl.md`](../../../docs/webgl.md)**: the camera hook, the
  scale range of a mesh, the flight move and the paper face, because they
  are the renderer's, not the talk's.
- **[`docs/article.md`](../../docs/article.md)**: the story layer in a
  figure, and the gusts' pause.
- **`watches/docs/slide-patterns.md`**: the map label, the count and the
  punchline's screen, as patterns for later slides.
- **The `art…` keys** (phase 1): each doc that names a `watch…` key of the
  stage.

## 7. Decisions

All made, 2026-10-31.

- **The colors of the new marks: no new roles.** Each mark reuses a role
  that every palette already has ([`docs/theme.md`](../../../docs/theme.md),
  "The roles"), as the mockup does: ink for the track, the day dots and the
  error bar; the paper for the wind; the subject for the ship and the
  coast, with the subject's wash for its sails and `second` for its
  pennant; the water's wash for the sea. In WebGL, the renderer reads each
  role through its list of inks (`INKS` in `webgl/scene.ts`). The sea's
  role, `water-wash`, is not in that list yet, so the list gets one entry;
  the land is the paper, which the renderer has.
- **Each line on the sea must hold 3:1 on the water's wash in every house
  palette** ([`docs/theme.md`](../../../docs/theme.md), "The pairs"): the
  track, the dots, the ship, the coast and the paper of the gusts. No gate
  checks this yet; phase 5 measures it with `tools/lib.py`.
- **The punchline in the article** is in the narration only, with no
  figure of its screen and no large type.
- **The gusts in the article** loop, and stop when the reader pauses their
  figure.
- **The camera hook (phase 3) comes first** among the build phases, so that
  the riskiest part is known before the rest is built.
- **Units:** statute miles throughout. **"2 a.m."** stays on Cape Noir's
  label. **Scilly's coast** is Natural Earth 1:10m, as in the mockup.

## 8. Limits

- I did not measure option 2's hook or option 3's dashes; the costs are
  estimates from reading `webgl/`.
- The canvas times are from Playwright's windows on this laptop, and the
  WebGL times from the globe task's spike, in a different page. Neither is
  measured on a phone, or in Safari itself.
- The land's fill at 1:10m in the boxes is not measured.

## 9. Progress

- **2026-10-31, phase 1:** the stage's keys are `art…`, the watch model's
  `watch…`. Every slide's parsed state, at every click, was byte-identical
  before and after (a dump of `watchState`, `moveWithBefore`,
  `tickTockState` and `timeScaleState`). A slide key that starts with `art`
  or `watch` and is not a key now throws (`checkNames`).
- **2026-10-31, phase 3, the hook:** `Stage.onFrame` and
  `SharedView.onFrame` give each frame's pose; `planeOnSlide` and
  `slidePoint` (`webgl/renderer.ts`) map a plane or a point to slide px. A
  browser check draws a box tilted and turned, and reads the face's wash and
  its edge's ink where `slidePoint` says; with slide y flipped, it fails. A
  still's pose is its state's. So option 2's risk is answered: the camera
  maps exactly, in the same animation frame. The wiring to the deck's
  layer, the stills and the figures is phase 5's, with the story layer.
- **2026-10-31, phase 2, the land:** `globe/earth.json` (1.26 MB, 0.41 MB
  compressed), from `art/earth-data.ts`, with `art/fetch-earth.sh` at the
  globe task's Natural Earth commit. It holds only the land's polygons: the
  globe takes the coast from the rings at load, and cuts the levels at the
  1:10m boxes in its geometry, not with a clip. 1:110m: 5,001 points;
  1:50m: 59,221; 1:10m, in the two boxes: 28,107. The story maps are not
  files: phase 5 projects them from this land at load, as the house makes
  geometry ("Geometry is made in TypeScript at load", `docs/webgl.md`).
- **2026-10-31, phase 4, the globe:** `globe/globe.ts` makes the sea's
  disc, the land in the paper and the coast, at three levels by the view's
  scale (`Mesh.scales`), with 1:10m in its boxes and 1:50m outside them;
  `globe/views.ts` the five views (South America, Cape Noir, Juan
  Fernández, the Channel, Scilly), each with the angles that face its place
  (`View.angles`); `webgl/flight.ts` the flight (`artMove: fly`), with
  `artMoveSeconds` for the Atlantic's 7 s. The globe joins the watch's
  scene (`watch/art.ts`); the deck's instance is now `ART`, and
  `withPoseGroups` adds the disc's matrix to each frame of the stage, the
  views and the stills. A test slide, not committed, showed each view in
  Chromium as the mockup did: Robinson Crusoe Island at x = 230, St Mary's
  at (471, 226) where `slidePoint` puts it at (471, 228). It also found that
  `artMoveSeconds` must be a key of one step, not of a click and those after
  it: the 7 s carried on to the flight to Scilly. Three choices differ from
  the mockup: the flight eases with the house's `ease`, not the mockup's
  smoothstep; a level change pops, with no cross-fade; the globe costs
  130–220 ms at load in Node (162,000 triangles), not yet measured in the
  browsers.
- **2026-10-31, phase 5, the story maps' data:** `globe/maps.ts` makes
  each story map's land at load, as an SVG path in its own projection, and
  fits its globe view. The plan's fit (section 4: least squares, as the
  mockup's tool did) turns the camera in the slide's plane, and the house
  camera has no such turn. A fit with no turn, but with the place that the
  camera looks down at free, is as good (median / 95th percentile / most,
  slide px): Juan Fernández 2.7 / 6.8 / 12.8 against the mockup's
  3.0 / 5.9 / 12.7, Scilly 0.4 / 0.8 / 0.9 against 0.3 / 0.8 / 1.0, Cape
  Noir 2.6 / 7.3 / 14.0. The fit runs at load, not in a tool: on a sample of
  500 coast points it takes about 50 ms in Node. The earth tool's clip is
  now `globe/clip.ts`, which the maps share; `earth.json` is byte-identical
  (`--check`).
- **2026-11-01, phase 5, the maps over the globe:** `components/StoryMaps.vue`
  draws the story maps over the canvas, in the live layer, the article's
  figures and the printed stills. A map rides the camera on the plane that
  touches the globe at its view's place, and its fade depends on the pose
  alone (zoom 1.25 times or pan 80 px), not on the flight's clock as the
  mockup's did: at 10% of each flight's progress the camera has zoomed
  1.23–1.79 times or panned 12–82 px, so the hand-over is about the
  mockup's. With the house's ease, that is about the first 30% of the
  flight's time. A test slide, not committed, showed each map whole at its
  click (the groups' opacities 1 0 0, 0 1 0, 0 0 0, 0 0 1 over the four
  clicks), and the globe alone in flight.
- **2026-11-01, phase 5, the marks:** `globe/stories.ts` holds each story
  map's marks, ported from the mockup's places: the voyage's legs (a track
  that draws itself, a dot a day, the ship) and the other marks (the dashed
  ship, the parallel, the bracket, the scale, the wind, the islands). A
  slide names each click's target with two new click keys, `globeLeg` and
  `globeMarks`; the three Part 2 slides follow "Changed The World", with a
  first draft of their narration so that each figure has alt text (phase 7
  rewrites it). What a frame shows is a pure function of the step and the
  clock (`globe/voyage.ts`): the new legs sail once the camera has come,
  and a step back sails them back, from the last (`stem/docs/navigation.md`,
  a story animation), where the mockup cut at once. A press during a voyage
  is a jump. Chromium showed every click of the three slides, mid-leg and
  mid-flight, and two steps back, as the mockup draws them. Section 7's
  contrast on the water's wash (`tools/lib.py`, `contrast`): in ledger, the
  talk's palette, ink 4.09, the subject 3.00 and the paper 3.47, all at 3:1
  or more. In other house palettes, the paper (the gusts, the dashed ship)
  is 2.19–2.54 in electric-terracotta, field-notes and kraft-ink, and the
  subject (the ship, the coast) is 2.93 in beacon: below 3:1. The slug of a
  title now drops accents (`Fernández` was `ferna-ndez`).

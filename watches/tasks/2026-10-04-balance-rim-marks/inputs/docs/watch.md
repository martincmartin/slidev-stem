# The live watch and the diving board

**Covers:** this talk's live art: the skeleton watch in WebGL (its files, its
design, the frontmatter keys that drive it, line widths when zooming, its
measured budgets) and the diving board on slide 2.
**Read before** you change `watch/`, `art/`, the watch's frontmatter,
`global-bottom.vue`, `slide-bottom.vue`, the diving board, or the slides that show
them. The rules for WebGL art in any talk are in
[`stem/docs/webgl.md`](../../docs/webgl.md); read it first for `webgl/`.
**Tasks:**
[`2026-10-04-rest-shape-final-review`](../tasks/2026-10-04-rest-shape-final-review/README.md) (final selection, cleanup, and review),
[`selection-and-layering`](../tasks/2026-10-04-leader-path-comparison/selection-and-layering/README.md) (the selected leader and reference paint order),
[`2026-09-24-cover-watch`](../tasks/2026-09-24-cover-watch/PLAN.md) (a skeleton
watch on the cover),
[`2026-09-25-eta-6497-orientation`](../tasks/2026-09-25-eta-6497-orientation/PLAN.md)
(the layout of the movement),
[`2026-09-25-zoom-to-hairspring`](../tasks/2026-09-25-zoom-to-hairspring/PLAN.md)
(the opening: zoom, fade, tilt),
[`2026-09-26-zoom-line-contacts`](../tasks/2026-09-26-zoom-line-contacts/README.md)
(parts touch in the model, not through ink),
[`2026-09-28-webgl-planning`](../tasks/2026-09-28-webgl-planning/PLAN.md),
[`2026-09-29-webgl-watch`](../tasks/2026-09-29-webgl-watch/PLAN.md) (the build,
the budgets),
[`2026-09-29-geometry-problems`](../tasks/2026-09-29-geometry-problems/instructions.md)
(pallet stones, the balance's rim),
[`2026-09-30-flexing-ruler`](../tasks/2026-09-30-flexing-ruler/PLAN.md) (the
ruler that the diving board replaced),
[`2026-09-30-flash`](../tasks/2026-09-30-flash/PLAN.md) (the balance flash),
[`2026-10-01-raised-escapement`](../tasks/2026-10-01-raised-escapement/README.md)
(the lower oscillator and upper roller),
[`2026-10-03-pool-edge`](../tasks/2026-10-03-pool-edge/PLAN.md) (how the pool
ends: a fade), and
[`2026-10-03-rest-shape`](../tasks/2026-10-03-rest-shape/PLAN.md) (the rest outline and its callout), and
[`leader-correction`](../tasks/2026-10-03-rest-shape/leader-correction/PLAN.md) (the leader's contrast), and
[`2026-10-04-leader-path-comparison`](../tasks/2026-10-04-leader-path-comparison/PLAN.md) (whole-path routing, the single curl edge, and the original-path comparison).

## The files

| Path                                                     | What it holds                                                                                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webgl/scene.ts`                                         | the types of a scene: `INKS`, meshes, lines, silhouette edges, clip discs, groups, views, subjects, the palette; `checkScene`, `checkPalette`                         |
| `webgl/renderer.ts`, `mesh.ts`, `stage.ts`, `stills.ts`  | the renderer; extrusions, ribbons and their triangles (earcut); the stage (renderer, model and frame loop); the stills                                                |
| `webgl/timeline.ts`                                      | the choreography, with no DOM: the camera, fade and tilt one at a time, and the flash; the durations                                                                  |
| `webgl/math.ts`, `checked.ts`                            | matrices; `at` and `check`, for what is a bug if it is false                                                                                                          |
| `webgl/probe/`                                           | a page with one canvas and `window.watchProbe.render(options)`, for the pixel and fade checks; `checks.ts`: `window.webglChecks()`, the renderer's browser checks     |
| `watch/design.json`                                      | written by `art/watch_design.py`; never edit by hand. `art/watch_design.py --check` compares what the file means, not its bytes (`pnpm format` rewrites its spacing)  |
| `watch/design.ts`, `path.ts`, `shapes.ts`, `generate.ts` | read and check the design; outlines; the meshes, heights, views and subjects                                                                                          |
| `watch/palette.ts`                                       | which theme variable colours each ink; `themePalette()` reads them from the page                                                                                      |
| `watch/model.ts`, `state.ts`, `stills.ts`, `instance.ts` | the mechanism and the balance's settle; frontmatter to state; the watch's stills; the shared instance                                                                 |
| `global-bottom.vue`, `slide-bottom.vue`                  | the live canvas and the live diving board, and the kind of each move; the still and the posed board on each printed page                                              |
| `watch/board.ts`, `components/DivingBoard.vue`           | the board's frontmatter to its target, and its clock (`BoardClock`); the component that inlines the SVG and sets its time                                             |
| `watch/navigation.ts`, `slide-state.ts`                  | a step forward, a step back or a jump; `window.slideState()` for `tools/navcheck.py` ([`navigation.md`](../../docs/navigation.md))                                    |
| `types/`                                                 | two small `.d.ts` files, mapped by `tsconfig.json` `paths` to `@slidev/client`. `vue-tsc` would otherwise check Slidev's own source, which fails our strict settings. |

## Changing the design

Edit `art/watch_design.py`, then run `uv run art/validate_watch_design.py`. It
checks the Python and the layout (meshing, clearances), and writes
`watch/design.json`. To move the wheels, run `art/search_watch_layout.py`
first. `uv run ../tools/validate.py` does not run it: run it yourself after
each change to the design.

## The layout of the movement

**The main focus of a slide is on its left.** The audience looks left first, so
a slide's picture goes on the left and its callouts and text go on the right.
Slide 2 follows it: the hairspring is at slide x 275 (`HAIRSPRING_TARGET` in
`watch/generate.ts`), and the diving board is shifted left with it.

Therefore the train runs from the hairspring to the fourth wheel from left to
right, so that the image stays on the left of each slide and the callouts on
the right. The centre wheel is at the watch's centre. The third wheel, fourth
wheel, escape wheel, fork and balance are the mirror image of an ETA 6497's
layout about the vertical line through the centre, then turned about the centre
until the balance is at 11 o'clock. The barrel is at `BARREL_ANGLE`, as near
5 o'clock as the third wheel allows: the third-barrel gap must stay 12 +/- 1 px.
The hands still turn clockwise: the layout moves the arbors, not the turning
directions. `art/watch_design.py` holds the numbers, and `LAYOUT` the angles.

The cover has the watch case on the right and the title on the left, as it did
before: the layout changed only what is inside the case.

## Oscillator geometry and framing

The balance wheel sits below the hairspring. The roller sits above the spring.
The jewel rises from the roller to meet the pallet fork at escape-wheel height.
The staff connects the balance hub, collet, and roller. The spring's outer end attaches to the fixed stud.
The case extends below the balance. The train and fork keep their meshing heights.
`watch/generate.ts` computes these heights from the fork and the parts' thicknesses.

The hairspring view keeps its on-slide target and zoom when the oscillator height changes.
Its camera pivot uses the spring's midpoint in height. Thus the spring stays at its target as the view tilts.
`watch/generate.ts` holds the target and zoom.

On slide 2, the roller flashes with the oscillator during the zoom and tilt.
Then it fades with the balance, jewel, staff, fork, and other mechanism parts.
Only the hairspring, collet, and stud remain visible, so the roller does not cover the coils.
The subject sets in `watch/generate.ts` control this fade.

## Slide 3: the balance wheel joins

Slide 3 has the same view, tilt and swinging hairspring as the end of slide 2,
with `watchOnly: balance wheel and hairspring`. Entering it, the balance wheel
and its staff fade in (not the roller or the jewel) (a swap) while the rest
shape of slide 2 (the dashed line, the callout and its leader) fades out.
Slide 3 has no code for this. It has no `board` key, so the live board's
target there is "off", and the board's layer fades its rest shape out in
`FADE_SECONDS`, as long as the swap (`--watch-fade`, set by
`global-bottom.vue`). Going back from 3 to 2 fades it in again while the wheel
fades out, and from 4 to 3 nothing changes
([`navigation.md`](../../docs/navigation.md)). A printed page of slide 3 has
no board.

## The frontmatter keys

A slide asks for a view of the watch in its frontmatter. A slide with no
`watch:` key hides it. Slide 2 is the example:

```yaml
watch: hairspring
watchFlash: balance and hairspring # flashes while the camera moves
watchOnly: hairspring and stud # the rest of the watch fades out
watchTilt: 20 # degrees: shows that the spring is a ribbon
watchHide: 1 # at click 1 the watch fades out, still swinging
watchSettle: 2 # the balance comes to rest while the watch is hidden
watchShow: 3 # at click 3 it fades back in, at rest
watchResume: 4 # at click 4 it starts to swing again
clicks: 4
```

| Key                                  | Meaning                                                                                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `watch: cover`                       | the view: `cover`, `hairspring` or `crown`; no key hides the watch                                                                                                       |
| `watchTilt: 20`                      | degrees, towards the viewer's side (default 0)                                                                                                                           |
| `watchFlash: balance and hairspring` | the name of a subject: it flashes while the camera moves, on the step forward into the slide only ([`stem/docs/illustrations.md`](../../docs/illustrations.md), "Flash") |
| `watchOnly: hairspring and stud`     | the name of a subject: the rest of the watch fades out                                                                                                                   |
| `watchSettle: 1`                     | at this click, the balance waits for its next extreme and then comes to rest                                                                                             |
| `watchResume: 4`                     | at this click, a settled balance starts to swing again (it needs `watchSettle` before it)                                                                                |
| `watchHide: 2`                       | at this click, the watch fades out, as on a slide with no `watch`                                                                                                        |
| `watchShow: 3`                       | at this click, a hidden watch fades back in, in the state of that click: a settled balance is at rest, with no settling (it needs `watchHide` before it)                 |

`watch/state.ts` checks each key, and a key of the wrong kind stops the deck
at load with the key's name. The subjects are made in `watch/generate.ts`:

- `hairspring and stud`: the spring, its collet and the stud.
- `balance and hairspring`: the balance, the spring with its collet and the
  balance staff, the stud, roller and impulse jewel. Not the pallet fork.
- `balance wheel and hairspring`: the balance, the spring with its collet and
  the balance staff, and the stud. Not the roller, the impulse jewel or the
  pallet fork. It holds `hairspring and stud`: slide 3 shows it.

- **The order of a change:** the camera moves (1.8 s), then the view tilts
  (1.5 s), then the rest fades (0.8 s); going back runs it in reverse. The
  tilt happens with the whole watch still in view. From one subject to
  another, the rest first fades back in around the old subject. Exception, a
  swap: if one subject holds the other and the view and tilt are the same
  (slide 2's `hairspring and stud` to slide 3's `balance wheel and hairspring`), only
  the difference fades, in 0.8 s, and the rest of the watch stays out
  (`Frame.fade` in `webgl/scene.ts`, `swap` in `webgl/timeline.ts`). Going back
  fades it out the same way.
  With `watchFlash`, the flash and camera move start together. The flash ends
  during the tilt. The change from the cover to slide 2 takes 4.1 s.
- **A step animates, a jump does not** (`watch/navigation.ts`,
  [`navigation.md`](../../docs/navigation.md)). A step is one click, or the
  next or the previous slide. A jump (a reload, a link, the overview) shows
  the slide's state at once.
- **The flash plays only on the step forward into its slide.** It points to
  where the camera goes. Going back to the cover zooms out with no flash, and
  so does going back from slide 3 to slide 2.
- **The settle:** the balance waits for its next extreme (at most half a
  period, 1 s), then moves to rest in 0.78 s, with no jump in angle, speed or
  acceleration where it starts. The rest of the mechanism stops with it.
- **The mechanism's time only goes forward.** A resume swings on to the
  opposite extreme.
- **Keep text out of the watch's way.** On slide 2 the hairspring is about 105
  to 445 px across, on the left. Callouts go on the right.
- **The cover's title fades as the watch flashes**: the `watch-zoom`
  transition, between the cover and slide 2 only. The new slide's text comes
  in after the camera's move, in either direction: `global-bottom.vue` sets
  `--watch-text-delay` from the stage (`viewEndAt` in `webgl/timeline.ts`).
  Forward, the camera moves first (1.8 s); back to the cover it moves last,
  so the cover's title waits 4.1 s.
- **The first block of `slides.md` is a hidden slide with no content.** Slidev
  takes the headmatter from the first slide's frontmatter, and a `transition`
  there becomes the default of every slide. The cover has the only
  `watch-zoom`, so the headmatter has its own block, with `hide: true`. Do not
  merge it with the cover's block.
- **A click that changes the watch needs a `[click]` line** in the speaker
  notes, as for any click.
- **The watch's layer paints the paper behind a `watch:` slide**, because that
  slide is see-through. When the watch hides (no `watch:`, or `watchHide`), only
  the canvas fades; the layer stays. Fading the whole layer left the page's
  white behind slide 2 after its `watchHide` click.
- **The slide's text paints over the watch** because the slide's layout is
  positioned. A slide with its own layout must keep that.

## Line widths when the view zooms

When the camera zooms into the watch (to the hairspring, $s = 250/56 \approx
4.46$), each line keeps its width on the screen. So parts must not meet only
through their ink. Where two parts touch, one is painted over the other (the
pallet fork over the escape wheel, each wheel's teeth over the pinion it
drives), or their outlines meet on their centre lines (tooth tips on the root
circle). Keep it so when you change `art/watch_design.py` or `watch/`.

Not an oversight: the lines do not scale with the zoom. At 4.46× they would be
9–18 px, and no contact in the hairspring view needed it. To check the art
again, run the contact check in the zoom-line-contacts task.

## Budgets, as measured

On the speaker's laptop (120 Hz), 2026-09-29, on the real talk
(the webgl-watch task, `evidence/`):

| What                                                    | Chromium   | Firefox                                 |
| ------------------------------------------------------- | ---------- | --------------------------------------- |
| JS per frame, the whole watch at the laptop's full size | 1.0–1.2 ms | about 1 ms                              |
| GPU per frame (with `gl.finish()`)                      | 0.7–0.9 ms | 2–3 ms                                  |
| A fade frame (two pictures and a mix)                   | the same   | the same                                |
| Frames over 25 ms on the watch slides, after load       | 0          | 0                                       |
| Frames over 12.5 ms in the opening (the 120 Hz gate)    | 0          | 2 in a laptop run, 0 in a projector run |
| WebGL contexts: a slide, the presenter view, the export | 1, 2, 1    | 1, 2, 1                                 |

This timing sample predates the lower oscillator adopted on 2026-10-01.
The current art's back-row measurements are in [measurements.md](measurements.md).

## The diving board

Slide 2 ends with the diving board: `components/DivingBoard.vue`, which inlines
`public/diving-board.svg`. There is one live board for the whole talk, in the
watch's layer (`global-bottom.vue`), above the canvas. Slide 2's frontmatter
names its targets, as it names the watch's (below), and the layer moves the
board from what is on the screen to each target, in either direction
([`navigation.md`](../../docs/navigation.md)). `art/diving_board.py` writes the SVG: edit the
script, not the SVG. It is a straight diving board over the edge of a pool,
which stands for the hairspring without its coils: the talk says why a spring
swings, and the spiral would distract. Ground on the left, pool on the right,
running off the slide. The board is over the pool for two thirds of its length.
The ground and the stand are washes of muted (warm); the water is a wash of the
art line (blue) at 0.6 with light ripples, and the pool's walls are a darker
muted. The pool has no near wall, and the ground has no front: both go on in
front, as if they ran far past the bottom of the slide, and the drawing is
cropped there (it is 452 px tall, so its bottom is the slide's). The drawing is the
slide's whole width (980 px, its viewBox starting at x 50, so the drawing's x 0
is the slide's x -50). The ground and the stand run off the slide's left edge.

**The pool and the ground fade to the paper at the right.** They are all paper
at 60% of the slide's width (`fade_end` in the script), so the left of the
slide holds the picture. The fade makes the pool seem to go on to the right. A
pool that ended in a drawn wall would be about as wide as the board, and read
as a small pool. The fade adds no hard edge in the middle of the slide, so it
does not pull the eye from the picture. It is an alpha mask on the group of the
pool, the ground and the stand. Over `FADE_LENGTH` px, the blend to the paper
is smootherstep, $6t^5 - 15t^4 + 10t^3$. The edges that were compared, their
measurements and a deck that shows them are in
[`2026-10-03-pool-edge`](../tasks/2026-10-03-pool-edge/PLAN.md).

- **Not an oversight: the ramp is not linear.** A linear ramp, in sRGB or in
  linear light, shows a sharp band where it starts (a Mach band). Smootherstep
  has zero slope and curvature at both ends.
- **Not an oversight: 256 stops, at 5 decimals.** An SVG gradient is piecewise
  linear. With the offsets rounded to 0.1, the fade showed about ten wide steps.

The board ends on the
hairspring's rest shape, at the hairspring's place on the left (`SLIDE_ORIGIN`
and `SPRING_CENTRE` in the script). Nothing is hidden by paper (it is not an
art colour): the ground is clipped round the stand's outline. The component sets `overflow: visible` on the SVG: the curling board rises above
the drawing's top edge, into the slide title's space, and must not be cropped
there. Ground and water
are not the same colour on purpose: a blue ground beside white water read as a
pool of the wrong colours.

```yaml
board: 1 # the board and the rest shape fade in; the board bends, holds, lets go and swings at 1 Hz
boardCurl: 2 # the pool and the stand fade, and the board winds into the spiral
boardHide: 3 # the board fades out; the rest shape stays to the slide's end
```

`watch/board.ts` checks the keys (`boardState`), as `watch/state.ts` checks the
watch's: each is a click number, in this order.

| Click | The slide                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------- |
| 1     | `watchHide: 1` fades the watch; `board: 1` fades the board in, and it bends, holds, lets go, swings |
| 2     | `boardCurl: 2` fades the pool and the stand, and the board winds into the spiral                    |
| 3     | `boardHide: 3` fades the board out, the rest outline stays, and `watchShow` fades the watch in      |
| 4     | `watchResume`: the balance starts to swing again                                                    |

The `Rest Shape` callout appears with the board at click 1.
It uses the theme's IBM Plex Sans at weight 600.
Dashed, unfilled outlines show the board at zero deflection.
They stay fixed during the bend, hold, and swing.
The full 3D outline helps the audience see the straight board's depth.
At the actual curl start, the ghost becomes one open line along the edge that becomes the viewer-facing ribbon edge.
Parallel thick dashed edges clutter the shallow view during the curl and on the final spring.
The single line retains the rest shape with less clutter. This is a deliberate choice, not a missing edge.
It curls on the board's clock into the spring ribbon's upper edge, closest to the viewer.

Before the curl, the leader ends near the straight board's right tip.
At the switch to one edge, optimization starts at that edge's closest point to the elbow.
The generator then selects a path across the entire curl with dynamic programming.
It integrates leader length, bend angle, and squared endpoint velocity perpendicular to the final segment.
Each step uses the physical frame duration and the midpoint segment direction.
Contacts lie on the exact cubic edge, sampled by rays from the elbow.
The selected path is globally minimal on that sampled contact graph.
The weights favor lower perpendicular speed and allow longer lines.
Motion along the leader has no movement penalty.
Stronger movement weighting can therefore increase rapid movement along the line.
The [weight-tuning task](../tasks/2026-10-04-leader-path-comparison/weight-tuning/README.md) compares this tradeoff.
`LeaderDesign` in `art/diving_board.py` holds the weights, angular sampling, and stroke width.
The [quarter-bend task](../tasks/2026-10-04-leader-path-comparison/selection-and-layering/quarter-bend/README.md) records the selected bend coefficient.
The label stays on the right.

At clicks 3 and 4, the rest shape stays while `boardHide` fades the moving board out.
The ghost does not change during the crossfade because the two rest outlines match.
The real spring swings against this fixed reference at click 4.
The component stops its frame loop when the clock holds still.
A jump to click 3 or 4 (a reload, a link) shows the completed rest spring at once.
The ghost fades out when the audience leaves slide 2, with the balance's swap on slide 3.
The generator writes its paths, leader, and curl duration; do not edit the SVG by hand.

The SVG draws the rest outline and callout after the board.
The dashed reference therefore stays above the board during bending and curling.
The board's layer is above the canvas, so the reference also stays above the live hairspring.
The slide's text paints above both: the curling board rises behind the title.
Slide 2 is see-through at every click, also while the watch hides, because it has a board (`slide-bottom.vue`'s marker).
The crossfade changes the subject below the reference; its stacking order stays fixed.
The component selects visible layers with `data-layer` attributes.
`uv run art/diving_board.py` writes the SVG; its `--check` verifies it.
Run `uv run art/test_leader_path.py` for the mathematical path checks.
`pnpm test` runs these checks with the TypeScript tests.
The canonical validator runs both through this script.

A click back from 2 uncurls the board: the curl plays backwards, as long as it
took, to the bottom of the swing, and the swing goes on. The pool and the stand
fade in at once. A click back from 1 fades the board out in its pose; the next
click 1 bends it from 0 again. `BoardClock` in `watch/board.ts` holds these
moves, and `watch/board.test.ts` tests them.
The balance settles at click 2 (`watchSettle`), while the watch is hidden: a
hidden watch gets no new state, so at click 3 it appears at rest (`place`, at
once). At click 4 the clock's `resume` starts it: the cubic from rest to the
opposite extreme, which is the settle mirrored, so there is no jump in angle,
speed or acceleration where it meets the free swing. A click back from 4 to 3
settles it again. The board's end and the hairspring at rest are the same
shape: laid over each other (a screenshot of slide 2 at click 3, and the
board's last frame) they agree to about a pixel, except for the real spring's
stud and collet.
The swing never damps, on purpose.

- **The component runs the clock, not the SVG.** A self-playing `<img>` cannot
  start on a click or play backwards on a click back.
- **Not an oversight: one board in the watch's layer, not one on each slide.**
  A copy on each slide cannot move between slides: Slidev mounts a slide before
  it shows it, and each copy starts a change from its own last state. Slide 3
  had its own copy, and its rest shape showed at once and then faded, going
  back from slide 4
  ([`2026-10-04-backward-navigation`](../tasks/2026-10-04-backward-navigation/PLAN.md)).
- **The curl waits for the bottom of the swing**, where the board is still, so
  it has no jump in position or speed (up to one period, 1 s, after the click).
  The pool and the stand fade at once, through a class on the SVG root and a
  CSS transition in the file. While it waits, the component keeps the SVG's
  time inside the swing's one cycle, so the jump to the curl is between two
  equal poses. The times are the root's `data-` attributes (`swing-start`,
  `swing-period`, `curl-start`, `curl-duration`).
- **The end of the curl is the hairspring at rest** (swing 0, the middle of its
  swing), at the hairspring's place and size on slide 2, with the view's tilt.
  Its numbers are copied from `watch/model.ts` and `watch/generate.ts` into
  `art/diving_board.py`: change them there when the spring or its view changes.
  The spring is a ribbon (a wall 8 units high), and the tilt shows it as two
  copies of its curve, one a little above the other, joined by a vertical line
  at each end. The board's near edge becomes the ribbon's top edge, the one
  nearer the viewer, and its far edge (the plank's width, going back) becomes
  the bottom edge (the ribbon's height, going down). The plank turns edge-on to
  the view and opens again: no edge changes sides. The thickness under the
  near edge shrinks to nothing. The ribbon's height and the pivot are copied
  from `springHeights` and the hairspring view (`RIBBON_BOTTOM` and
  `RIBBON_TOP` in the script: 6.1 px below the spring's centre line and 6.1 px
  above it; `watch/generate.test.ts` fails if the heights or the pivot change). The curl mixes each segment's angle and length between
  the bent board and the spiral, not each point's position: the free end turns
  round and round, like a stiff strip winding up, with no kink and no crossing.
  (A mix of positions folded and crossed.) Every edge is a cubic curve through
  sample points, not a line of segments, so no corner shows: the curl has 40
  points, within 0.06 px of the spring (`smooth_data` in `art/diving_board.py`). The segments grow, late, because the
  spiral is five times longer than the board.
- **Not an oversight: the SVG is sampled** (30 frames a
  second of a path), from the first vibration mode of a fixed-end beam at
  constant length. The rest outline adds samples for the curl only.
- **`art/diving_board.py --check`** fails if the SVG on disk differs. `pnpm
art:generated` runs it with the `--check` of `watch_design.py` and
  `favicon.py`, and `validate.py` runs that script: a change to the theme or to
  a generator fails until the file is written again.
- **The SVG takes its colours from the theme** through namespaced classes
  ([`stem/docs/illustrations.md`](../../docs/illustrations.md), "The page's
  theme paints the drawing").
- **The watch's still follows the click of its page.** `slide-bottom.vue` reads
  the slide's `$clicks`, not the global nav (a printed page has a nav of its
  own), and the PDF has a page for each click (`pnpm export`).
  `pnpm art:print DECK` compares each page's state with the live slide's. It
  runs in Chromium; `--browser firefox` and `--browser webkit` (Playwright's
  WebKit, not Safari itself) pass too, as of 2026-10-04.
  Why: [`tasks/2026-10-03-narrated-export/`](../../tasks/2026-10-03-narrated-export/PLAN.md),
  "The watches talk: what the still forms need".
- **The board is posed in print.** A page that does not run the clock (print,
  export, the overview) sets the SVG's time to the pose of its click
  (`boardPoseTime` in `watch/board.ts`; the posed board is `slide-bottom.vue`'s): bent, at the bottom of the swing, at click 1, and half
  way through the curl at click 2 (`CURL_SHOWN`). Half way, not the end: the
  end is the hairspring at rest, the same picture as click 3's. Print mode never
  runs the clock, so the pose does not drift. `art:print` checks the board too:
  its classes against the live slide's, and its clock against the pose. The
  component's `data-waitfor` makes `slidev export` wait until the SVG is posed.

## The browser-tab icon

`art/favicon.py` owns the icon. Edit its pixel maps and run the script.
It draws each pixel instead of scaling down the cover.
Its `--check` fails if the file on disk differs.

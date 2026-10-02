# The live watch and the diving board

**Covers:** this talk's live art: the skeleton watch in WebGL (its files, its
design, the frontmatter keys that drive it, line widths when zooming, its
measured budgets) and the diving board on slide 2.
**Read before** you change `watch/`, `art/`, the watch's frontmatter,
`global-bottom.vue`, `slide-bottom.vue`, the diving board, or the slides that show
them. The rules for WebGL art in any talk are in
[`stem/docs/webgl.md`](../../docs/webgl.md); read it first for `webgl/`.
**Tasks:**
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
(the lower oscillator and upper roller).

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
| `global-bottom.vue`, `slide-bottom.vue`                  | the live canvas; the still on each printed page                                                                                                                       |
| `types/`                                                 | two small `.d.ts` files, mapped by `tsconfig.json` `paths` to `@slidev/client`. `vue-tsc` would otherwise check Slidev's own source, which fails our strict settings. |

## Changing the design

Edit `art/watch_design.py`, then run `uv run art/validate_watch_design.py`. It
checks the Python and the layout (meshing, clearances), and writes
`watch/design.json`. To move the wheels, run `art/search_watch_layout.py`
first. `uv run ../tools/validate.py` does not run it: run it yourself after
each change to the design.

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

| Key                                  | Meaning                                                                                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `watch: cover`                       | the view: `cover`, `hairspring` or `crown`; no key hides the watch                                                                                       |
| `watchTilt: 20`                      | degrees, towards the viewer's side (default 0)                                                                                                           |
| `watchFlash: balance and hairspring` | the name of a subject: it flashes while the camera moves, in a transition only ([`stem/docs/illustrations.md`](../../docs/illustrations.md), "Flash")    |
| `watchOnly: hairspring and stud`     | the name of a subject: the rest of the watch fades out                                                                                                   |
| `watchSettle: 1`                     | at this click, the balance waits for its next extreme and then comes to rest                                                                             |
| `watchResume: 4`                     | at this click, a settled balance starts to swing again (it needs `watchSettle` before it)                                                                |
| `watchHide: 2`                       | at this click, the watch fades out, as on a slide with no `watch`                                                                                        |
| `watchShow: 3`                       | at this click, a hidden watch fades back in, in the state of that click: a settled balance is at rest, with no settling (it needs `watchHide` before it) |

`watch/state.ts` checks each key, and a key of the wrong kind stops the deck
at load with the key's name. The subjects are made in `watch/generate.ts`:

- `hairspring and stud`: the spring, its collet and the stud.
- `balance and hairspring`: the balance, the spring with its collet and the
  balance staff, the stud, roller and impulse jewel. Not the pallet fork.

- **The order of a change:** the camera moves (1.8 s), then the view tilts
  (1.5 s), then the rest fades (0.8 s); going back runs it in reverse. The
  tilt happens with the whole watch still in view. From one subject to
  another, the rest first fades back in around the old subject.
  With `watchFlash`, the flash and camera move start together. The flash ends
  during the tilt. The change from the cover to slide 2 takes 4.1 s.
- **The settle:** the balance waits for its next extreme (at most half a
  period, 1 s), then moves to rest in 0.78 s, with no jump in angle, speed or
  acceleration where it starts. The rest of the mechanism stops with it.
- **The mechanism's time only goes forward.** A resume swings on to the
  opposite extreme.
- **Keep text out of the watch's way.** On slide 2 the hairspring is about 535
  to 875 px across.
- **The cover's title fades as the watch flashes**: the `watch-zoom`
  transition, from the cover to slide 2 only. Slide 2's text comes in after
  the zoom: `global-bottom.vue` sets `--watch-text-delay` from `MOVE_SECONDS`
  in `webgl/timeline.ts`.
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

Slide 2 ends with `components/DivingBoard.vue`, which inlines
`public/diving-board.svg`. `art/diving_board.py` writes the SVG: edit the
script, not the SVG. It is a straight diving board over the edge of a pool,
which stands for the hairspring without its coils: the talk says why a spring
swings, and the spiral would distract. Ground on the left, pool on the right,
running off the slide. The board is over the pool for two thirds of its length.
The ground and the stand are washes of muted (warm); the water is a wash of the
art line (blue) at 0.6 with light ripples, and the pool's walls are a darker
muted. The pool has no near wall, and the ground has no front: both go on in
front, as if they ran far past the bottom of the slide, and the drawing is
cropped there (it is 452 px tall, so its bottom is the slide's). The ground's
left edge slants down and to the left as it comes forward, so the drawing is
the slide's whole width (980 px, its viewBox starting at x -380): a narrower one
would cut that edge in the middle of the slide. The board, the stand and the pool
are where they are on the slide's right, and the board ends on the hairspring's
rest shape, where the hairspring was. Nothing is hidden by paper (it is not an
art colour): the ground is clipped round the stand's outline. Ground and water
are not the same colour on purpose: a blue ground beside white water read as a
pool of the wrong colours.

| Click | The slide                                                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `watchHide: 1` fades the watch; the component's `visible` fades the board in, and `playing` bends it, holds it, lets go and swings it at 1 Hz |
| 2     | `curling` fades the pool and the stand, and the board winds into the spiral                                                                   |
| 3     | the board fades out (`visible` goes false; the clock goes on, so it does not reset) and `watchShow` fades the watch in, at rest               |
| 4     | `watchResume`: the balance starts to swing again                                                                                              |

A click back from 2 returns to the bend from 0, and from 1 hides the board.
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
  start on a click or reset on a click back. The clock runs only while the
  slide is the current one: Slidev keeps a left slide mounted and gives it its
  last click, so `playing` alone would keep it running off-screen.
- **The curl waits for the bottom of the swing**, where the board is still, so
  it has no jump in position or speed (up to one period, 1 s, after the click).
  The pool and the stand fade at once, through a class on the SVG root and a
  CSS transition in the file. While it waits, the component keeps the SVG's
  time inside the swing's one cycle, so the jump to the curl is between two
  equal poses. The times are the root's `data-` attributes.
- **The end of the curl is the hairspring at rest** (swing 0, the middle of its
  swing), at the hairspring's place and size on slide 2, with the view's tilt.
  Its numbers are copied from `watch/model.ts` and `watch/generate.ts` into
  `art/diving_board.py`: change them there when the spring or its view changes.
  The spring is a ribbon (a wall 8 units high), and the tilt shows it as two
  copies of its curve, one a little above the other, joined by a vertical line
  at each end. The board's near edge becomes the ribbon's bottom edge, and its
  far edge (the plank's width, going back) becomes the top edge (the ribbon's
  height, going up): the top face turns into the wall. The thickness under the
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
- **Not an oversight: the SVG is 640 KB because it is sampled** (30 frames a
  second of a path), from the first vibration mode of a fixed-end beam at
  constant length.
- **`art/diving_board.py --check`** fails if the SVG on disk differs. `pnpm
art:generated` runs it with the `--check` of `watch_design.py` and
  `favicon.py`, and `validate.py` runs that script: a change to the theme or to
  a generator fails until the file is written again.
- **The SVG takes its colours from the theme** through namespaced classes
  ([`stem/docs/illustrations.md`](../../docs/illustrations.md), "The page's
  theme paints the drawing").
- **Print and export show no board still.** The overview thumbnail shows the
  hairspring still under the board; this is known and left alone.

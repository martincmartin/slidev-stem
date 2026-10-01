# The live watch and the flexing ruler

**Covers:** this talk's live art: the skeleton watch in WebGL (its files, its
design, the frontmatter keys that drive it, line widths when zooming, its
measured budgets) and the flexing ruler on slide 2.
**Read before** you change `watch/`, `art/`, the watch's frontmatter,
`global-bottom.vue`, `slide-bottom.vue`, the ruler, or the slides that show
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
[`2026-09-30-flexing-ruler`](../tasks/2026-09-30-flexing-ruler/PLAN.md),
[`2026-09-30-flash`](../tasks/2026-09-30-flash/PLAN.md) (the balance flashes
before the zoom).

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

## The frontmatter keys

A slide asks for a view of the watch in its frontmatter. A slide with no
`watch:` key hides it. Slide 2 is the example (it does not use `watchSettle`, which a slide can still
ask for):

```yaml
watch: hairspring
watchFlash: balance and hairspring # flashes before the camera moves
watchOnly: hairspring and stud # the rest of the watch fades out
watchTilt: 20 # degrees: shows that the spring is a ribbon
watchHide: 1 # at click 1 the watch fades out, still swinging
clicks: 2
```

| Key                                  | Meaning                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `watch: cover`                       | the view: `cover`, `hairspring` or `crown`; no key hides the watch                                                                                     |
| `watchTilt: 20`                      | degrees, towards the viewer's side (default 0)                                                                                                         |
| `watchFlash: balance and hairspring` | the name of a subject: it flashes before the camera moves, in a transition only ([`stem/docs/illustrations.md`](../../docs/illustrations.md), "Flash") |
| `watchOnly: hairspring and stud`     | the name of a subject: the rest of the watch fades out                                                                                                 |
| `watchSettle: 1`                     | at this click, the balance waits for its next extreme and then comes to rest                                                                           |
| `watchHide: 2`                       | at this click, the watch fades out, as on a slide with no `watch`                                                                                      |

`watch/state.ts` checks each key, and a key of the wrong kind stops the deck
at load with the key's name. The subjects are made in `watch/generate.ts`:

- `hairspring and stud`: the spring, its collet and the stud.
- `balance and hairspring`: the balance, the spring with its collet and the
  balance staff, the stud and the impulse jewel. Not the pallet fork.

- **The order of a change:** the camera moves (1.8 s), then the view tilts
  (1.5 s), then the rest fades (0.8 s); going back runs it in reverse. The
  tilt happens with the whole watch still in view. From one subject to
  another, the rest first fades back in around the old subject.
  With `watchFlash`, the subject flashes first (2.5 s), so the change from the
  cover to slide 2 takes 6.6 s.
- **The settle:** the balance waits for its next extreme (at most half a
  period, 1 s), then moves to rest in 0.78 s, with no jump in angle, speed or
  acceleration where it starts. The rest of the mechanism stops with it.
- **The mechanism's time only goes forward.** A resume swings on to the
  opposite extreme.
- **Keep text out of the watch's way.** On slide 2 the hairspring is about 535
  to 875 px across.
- **The cover's title fades as the watch flashes**: the `watch-zoom`
  transition, from the cover to slide 2 only. Slide 2's text comes in after
  the flash and the zoom: `global-bottom.vue` sets `--watch-text-delay` from
  what `Stage.show` returns.
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

The back-row numbers of the watch are in [measurements.md](measurements.md).

## The flexing ruler

Slide 2 ends with `components/FlexingRuler.vue`, which inlines
`public/flexing-ruler.svg`. `art/flexing_ruler.py` writes the SVG: edit the
script, not the SVG. The slide's `watchHide: 1` fades the watch at click 1, and
the component's `visible` fades the ruler in. `playing` (click 2) runs the
SVG's timeline from 0. A click back returns to the face-on ruler. The swing
never damps, on purpose.

- **The component runs the clock, not the SVG.** A self-playing `<img>` cannot
  start on a click or reset on a click back. The clock runs only while the
  slide is the current one: Slidev keeps a left slide mounted and gives it its
  last click, so `playing` alone would keep it running off-screen.
- **Not an oversight: the SVG is 85 KB because it is sampled** (30 frames a
  second of a path), from the first vibration mode of a fixed-end beam at
  constant length. The options are in the flexing-ruler task.
- **`art/flexing_ruler.py --check`** fails if the SVG on disk differs, or if
  the frame rate changes any `begin` or `dur`. `pnpm art:generated` runs it
  with the `--check` of `watch_design.py` and `favicon.py`, and `validate.py`
  runs that script: a change to the theme or to a generator fails until the
  file is written again.
- **The SVG takes its colours from the theme** through namespaced classes
  ([`stem/docs/illustrations.md`](../../docs/illustrations.md), "The page's
  theme paints the drawing").
- **Print and export show no ruler still.** The ruler's overview thumbnail
  shows the hairspring still under the ruler; this is known and left alone.

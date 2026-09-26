# From cover zoom to hairspring — plan (Stage 1)

The request is in [instructions.md](instructions.md). Stage 1 only: the cover's
text fades, the camera zooms in to the balance and hairspring, and then the rest
of the watch fades. The mechanism keeps its motion through all of this. Stage 2
(a 3D hairspring) is out of scope. One section below checks that this plan does
not block it.

Step 1, the spike, is done: [spike/README.md](spike/README.md) has the results,
and [INVESTIGATION.md](INVESTIGATION.md) the full account of every experiment.
Its findings changed three parts of this plan: the camera (a JS loop, not a CSS
transition), where the SVG file lives (not in `public/`), and how the layer
reads the slide. "Step 1 results" below lists what changed. Nothing outside this
directory changes until you approve steps 2 to 5.

## Step 1 results (2026-09-25)

| Finding | What it changes |
| --- | --- |
| The mechanism's motion is continuous through a zoom in and out, in both browsers. | Nothing: option B works as planned. |
| `non-scaling-stroke` keeps lines in slide px, also under Slidev's slide scaling. | Nothing: decided line widths work. |
| `non-scaling-stroke` does not undo a transform on an HTML wrapper. | The camera must be inside the SVG. |
| Firefox paints every camera mode sharp mid-zoom. Chromium softens edges by about 1 px mid-zoom in every mode (headless). At rest, all are sharp. (An early claim that the JS loop was the least soft was withdrawn: [INVESTIGATION.md](INVESTIGATION.md), F9.) | **The camera becomes a JS loop** (sub-decision 2). Please look at it in a real Chrome (see the spike README, "Try it"). |
| A zoom linear in scale is 2.5 to 2.7 times faster at a quarter than at three quarters. ~~The camera moves linearly in $\ln s$.~~ Round 2: you watched both and prefer linear in scale, so it is linear in scale. |
| One decimal is enough at 4.46 times. | Nothing: the generator keeps `num()`. |
| Vite cannot `?raw`-import a file in `public/`. | **The SVG moves out of `public/`** (step 2). |
| A global layer cannot use `useSlideContext()`. `inject(injectionSlidevContext)` from `@slidev/client/constants.ts` works, in play and in print. | Step 3. |
| The class `slidev-layout` gives the layer the page colour. It also makes `tools/offline_check.py` report the layer instead of the slide. | Step 3, and a one-line fix to `offline_check.py` (question 2). |
| The marker makes watch slides see-through. The build makes 0 outside requests. | Nothing: works as planned. |
| **Round 2, by eye:** Chrome blinked parts during the zoom in; Firefox halted. The causes, measured: the fade's pending `transition-delay` (Chromium drops 134 of 414 frames) and `non-scaling-stroke` (Firefox drops about 1 frame in 5). You prefer a zoom linear in scale. | **The fade starts from JS when the camera stops. Stroke widths are divided by the scale in CSS instead of `non-scaling-stroke`. The camera is linear in scale**, eased in and out. Measured: 0 dropped frames in Chromium, 1 in 995 in Firefox; lines stay 2.0 px. |
| **Round 3, by eye and in visible windows:** Chrome is smooth. Firefox still stalls, because it re-rasterizes the whole SVG on the CPU at each frame while anything animates. It gets worse with more screen pixels: 17 slow frames per zoom at about projector size. | Nothing in steps 2–5 depends on it. Making Firefox smooth means making the drawing cheaper to rasterize, or not animating during the zoom (question 4). |

## Decisions (2026-09-25)

| Question | Decision |
| --- | --- |
| Design | Option B: a persistent watch layer (see "Options"). |
| What stays after the fade? | The hairspring only. The balance wheel and the impulse jewel can come back later: add them to the view's `shown` set. |
| Line widths during the zoom | They keep the same width. (After round 2: by dividing each stroke width by the scale in CSS, not with `vector-effect: non-scaling-stroke`, which makes Firefox drop frames.) |
| Where the zoomed balance sits | Fully on the canvas: the balance circle, radius 56, becomes radius 250 at (705, 276). The drawing then spans x 455 to 955, and the left 450 px stay free for text. |
| Key presses | One press for the whole sequence. |
| Cover text fade | `transition: fade-out` on the cover. It becomes the deck default. A slide that wants a different transition sets its own (see "Slide transitions"). |
| Hairspring stud | Not drawn. |
| Browsers | Every test runs in Chrome **and** Firefox. A test in one browser is not complete until it also runs in the other. |

## What is there now

| Fact | Where | Consequence |
| --- | --- | --- |
| The cover shows the watch with `<img src="/cover/skeleton-watch.svg">`. | `slides.md` | The page cannot reach inside an `<img>`: not with CSS, and not with JS. |
| All motion is SMIL (`<animateTransform>`, `<animate>`) with `repeatCount="indefinite"`. The balance period is 2 s. | `art/skeleton_watch.py` | Each SVG document has its own SMIL clock. An inline `<svg>` has an API for its clock (`setCurrentTime()`, `pauseAnimations()`). An `<img>` has none. |
| The drawing is a flat list of groups. Nothing marks which part a group draws. | `build()` | To fade "all but the hairspring", each group must say which part it draws. |
| Paint order: the balance body, then the hairspring, then the impulse jewel, then the pallet fork. The fork's horns reach to 8.5 px from the balance arbor, so they lie **over** the inner coils of the hairspring (radius 8 to 38). | `build()`, `fork_outline()` | A split into separate files must keep this order (see option D). |
| Lower wheels are clipped inside the root circle of each wheel above them. Each clip is a circle computed from the upper wheel's arbor and radius. | `Placement.hole()` | The clip needs geometry, not the upper wheel's element. Any file can carry its own copy. |
| Slidev renders `global-bottom.vue` one time, under all the slides and outside the slide transition group. It does not remount when the slide changes. | `@slidev/client/internals/SlidesShow.vue`, line 78 | A watch in this layer is one DOM node for the whole talk, so its clock never restarts. |
| Slidev keeps each slide that you visited mounted, and hides it with `v-show`. | same file, `loadedRoutes` | A watch on each slide would put many copies of the SVG in the page, all with the same `id`s. |
| The theme gives every slide an opaque background, and defines the palette variables only on `.slidev-layout`. Behind the slides, Slidev paints black (`--slidev-slide-container-background`). | `themes/ledger/styles/ledger.css`, line 7; `@slidev/client/styles/vars.css`, line 13 | A slide that shows the watch layer must be transparent, and the layer must paint the page colour itself (see step 3). |

The geometry, in canvas px (980 × 552):

- The case: a circle of radius 250 at (798, 276). It goes 68 px past the right edge.
- The balance: radius 56, arbor at (845.1, 162.7). The hairspring: radius 8 to 38, 3.25 turns.
- The zoom factor is $s = 250 / 56 \approx 4.46$. The zoomed hairspring has a
  radius of $38 \times 4.46 \approx 170$ px.

## Is smooth motion expensive?

No. In the recommended design (option B), the watch is one DOM node for the whole
talk, so its motion continues with zero code. In options C and D′, each copy calls
`svg.setCurrentTime(sharedClock())` when it loads. This is one line. Continuity
is not a reason to choose one design over another.

## Options: where the watch lives

| | Design | Motion stays smooth? | Code (estimate) | Scales to many zoom slides? | Main risk |
| --- | --- | --- | --- | --- | --- |
| **A** | One slide, many clicks. The cover inlines the SVG. Each click changes the view. The hairspring slide's text is a later click on the same slide. | yes, one DOM node | ~50 lines | **No.** Every slide that shows the watch becomes one large slide. | Poor structure for a talk that zooms many times |
| **B** | **A persistent watch layer.** `global-bottom.vue` inlines the SVG one time. Each slide names a view in its frontmatter (`watch: hairspring`). The layer sets `data-view` on the `<svg>`. CSS in the SVG fades the parts and holds the camera's numbers; a JS loop moves the camera (after step 1). | yes, one DOM node | ~70 lines of Vue, ~100 lines of Python | **Yes.** A new zoom is one `View` in Python and one frontmatter line. | The watch is not in the slide file. The frontmatter line points to it. |
| **C** | A `<Watch view="…">` component on each slide. Each copy syncs its clock on mount. The entering copy animates from the view of the slide you left. | yes, with `setCurrentTime` | ~120 lines of Vue | yes | One copy for each visited slide, with duplicate `id`s. The component must know which slide you came from. |
| **D** | Split the SVG into files, one `<img>` for each, stacked. Zoom the stack with one CSS transform. | **not guaranteed** (see below) | ~40 lines, plus the split | poorly | No clock API; the paint order forces extra cuts |
| **D′** | As D, but with `<object>` instead of `<img>`. | yes, with `setCurrentTime` on each document | ~100 lines, plus the split | poorly | Three documents to load, sync and drive, and more cuts for each new view |
| **E** | Slidev's `transition: view-transition`. | **no** | ~20 lines | yes | The browser freezes the old slide as a bitmap, so the mechanism stops during the morph, and the bitmap blurs as it is scaled by 4.46. |
| **F** | Render the zoom to a video. | no, across slides | a render script | no | Several MB for each clip. Each change to the art means a new render. |

### Why not split the SVG into files (options D and D′)?

You asked whether we could split it into the hairspring and the rest, and stack
them. That is option D. Answers to each part of the question:

- **Does transparency work?** Yes. An SVG has no background unless it draws one,
  so the files stack cleanly.
- **Do they zoom together?** Yes. Every file is the full 980 × 552 canvas, so one
  CSS transform on a wrapper keeps their relative positions. One risk: a CSS
  transform on an HTML element can make the browser scale a bitmap during the
  animation. That is blurry at 4.46 times. Step 1 would test it in both browsers.
- **Two files are not enough.** The fork's horns lie over the hairspring, and the
  impulse jewel is painted over it too. With "hairspring on top of the rest", the
  fork would slide under the spring. To keep the paint order, Stage 1 needs three
  files: what is under the spring, the spring, and what is over it. Each later
  view that fades a different set of parts needs more cuts.
- **Clip paths across files.** My first plan was wrong here. Each clip is a
  circle computed from geometry, so each file can carry its own copy. Clips are
  not the problem. The paint order is.
- **Won't they load at the same time?** Probably, to within a few milliseconds,
  but nothing guarantees it. The page has no API for the clock of an SVG in an
  `<img>`. It cannot read it, set it or pause it. I do not know whether Chrome
  and Firefox start that clock at load, at first paint or when the image first
  shows. Slidev also preloads the images of nearby slides, at times of its own
  choosing.
- **How much does an offset matter?** The balance turns at up to
  $150° \times \frac{2\pi}{2\,\text{s}} \approx 471°/\text{s}$. At that speed, a
  lag of one frame (17 ms) between the spring's file and the balance's file is 8°.
  That moves the spring's inner end off the collet by about 5 px on the zoomed
  screen. A lag of 50 ms is 24°, which is plainly broken.
- **Can `setCurrentTime(sharedClock())` sync them?** Not with `<img>`. With
  `<object>` (option D′), yes: the page can reach `object.contentDocument` and
  call `setCurrentTime()` on each file. The camera can then move inside each
  document too, which keeps the drawing sharp. But D′ is option B spread across
  three documents. There are three loads to wait for, three clocks to align, and
  a camera and fade CSS in each file.

**What a split does better:** each file is its own document, so its `id`s and CSS
cannot collide with another copy. That helps in the presenter view, the overview
and print (see below). Option B gets the same result with about 5 lines that give
each inline copy its own `id` prefix.

### Ranking

1. **B.** Continuity is free. There is one document and one source of truth. The
   "zoom to a part" pattern costs one line for each slide.
2. **D′.** It works, and it isolates the copies. But the extra files and cuts
   grow with each view, and three clocks must be kept aligned.
3. **C.** It keeps each slide self-contained. But it must run a zoom across two
   copies, and it must know which slide you came from and in which direction.
4. **A.** It is a good throwaway prototype, but a poor structure for the rest of
   the talk.
5. **D, E, F.** Each can break the smooth motion, and that is the requirement you
   gave.

## Sub-decisions for option B

### 1. Views are defined in Python

A view is the part that sets the zoom, where that part lands on the canvas, and
which parts stay visible. `skeleton_watch.py` already knows every arbor and
radius, so it writes each view as CSS inside the SVG: the camera's numbers, and
the fade. (Changed after step 1: the camera's numbers are custom properties
that the JS camera reads, not a `transform` rule. The spike page did the same.)

```css
svg[data-view="hairspring"] { --camera-x: -3067.77; --camera-y: -450.34; --camera-scale: 4.4643; }
svg[data-view="hairspring"] [data-part]:not([data-part="hairspring"]) { opacity: 0; }
```

The camera arithmetic is in one place. For a still, the generator writes the
same numbers as the camera group's `transform` attribute and sets
`data-view="hairspring"`, so `barroom.py` and `motion.py` can measure it as they
are. The slide says only `watch: hairspring`. The timing (durations and delays)
is in the Vue code, so you can tune it without a new SVG.

The alternative is to define views in each slide's frontmatter
(`watch: {focus: balance, show: [hairspring]}`). This moves the camera arithmetic
to TypeScript, the geometry must be exported to it, and no SVG file shows the
zoomed state for the tools.

### 2. How the camera moves

Measured in step 1 ([spike/README.md](spike/README.md)). Sharpness mid-zoom is
the ratio against the same frame at rest: 1 is perfect. "Extent" is how many
pixels a 2 px hairspring line covers: about 3 px when sharp.

| Method | Firefox sharpness | Chromium sharpness (stopped / running) | Chromium extent mid-zoom | Zoom speed | Code |
| --- | --- | --- | --- | --- | --- |
| CSS `transition` on `transform` of the SVG `<g class="camera">` | 1.00 | 0.94 / 0.82 | 3.7 – 4.0 px | linear in $s$: 2.7 times faster at ¼ than at ¾ | CSS only |
| CSS `transition` of an `@property` number, `scale(exp(var(--z)))` | 1.00 | 0.79 / 0.82 | 3.0 px | linear in $\ln s$ | CSS only, but only between the cover and one view: the translation depends on both views |
| **JS `requestAnimationFrame` loop that writes the camera's `transform` attribute** | 1.00 | 0.79 / 0.82 (the first page gave 0.94 / 0.88; see INVESTIGATION.md, F9) | 3.0 px | linear in $\ln s$ (or any curve) | ~40 lines |
| CSS `transform` on the HTML wrapper of the `<svg>` | 1.00 | 0.99 | — | linear | CSS only, but **rejected**: the lines scale to 8.9 px, because `non-scaling-stroke` does not undo an HTML transform |

Why the zoom speed matters: the eye sees the rate of zoom as
$\frac{d \ln s}{dt}$. If $s$ goes linearly from 1 to 4.46, that rate is
$\frac{3.46}{1 + 3.46\,t}$: a lurch, then a crawl. The spike measured it.

**Round 2 (after you watched it):** the JS loop stays, but **linear in scale**
(your preference), with the fade started when the camera stops and the strokes
compensated in CSS instead of `non-scaling-stroke`. See "Step 1 results". The
paragraph below is the round-1 reasoning; its point about zooming between two
views still holds, with $s(u)$ linear.

**Decision after step 1: the JS loop.** (Its first reason below, "the sharpest in Chromium", was withdrawn after a rerun: INVESTIGATION.md, F9. The other reasons stand.) It is the sharpest in Chromium, it is
sharp in Firefox, and it is symmetric in $\ln s$. It is also the only method that
works between any two views: it zooms about the one point that the two cameras
share, with $s(u) = s_a^{1-u} s_b^{u}$. It can also start from wherever the camera
is, if you press a key during a zoom. In all methods, Chromium softens edges by
about 1 px while the camera moves, and every method is sharp at rest. This was
measured headless, with software raster. Please look at it in a real Chrome.

### 3. Line widths

Decided: they keep their width. All strokes get
`vector-effect: non-scaling-stroke`. At $s = 4.46$ the hairspring stays 2 px,
the coils' gap grows from 9.2 to 41 px, and the drawing stays on the house stroke
ladder. Step 1 verified, in both browsers and in Slidev, that "non-scaling"
means slide px: the hairspring is 2 px times Slidev's slide scale on screen.

### 4. Slide transitions

Verified in the Slidev 53 source (`logic/transition.ts`, line 42;
`composables/useNav.ts`, lines 115 to 119):

- **The transition between slides N and N+1 is the `transition:` of slide N**,
  in both directions. Going forward, Slidev uses the transition of the slide you
  leave. Going back, it uses the transition of the slide you arrive at. In both
  cases that is slide N.
- If slide N has no `transition:`, Slidev uses the deck default.
- The cover's frontmatter is the headmatter. So `transition: fade-out` there sets
  the deck default, and it also applies from the cover to slide 2.
- **Yes, any other slide can override it** with its own `transition:`, for
  example `transition: none` for a cut. `none` is a non-empty string, so it
  replaces the default. It names no CSS classes, so I expect an instant change.
  Step 5 checks this.
- One quirk: a jump (for example, typing a slide number) uses the transition of
  the slide before the destination, not of the slide you left.

With `fade-out` and the default 0.5 s duration, the cover's text fades in 0.3 s.
Slide 2's content then fades in from 0.3 s to 0.7 s. Slide 2's text therefore
needs its own delay if it is to wait for the zoom (see the sequence below).

### 5. The sequence (one key press, about 3 s)

| t (s) | What happens |
| --- | --- |
| 0 – 0.3 | The cover's text fades out (the slide transition). |
| 0.3 – 2.1 | The camera zooms in on the balance. All parts stay visible, so the escape wheel and the fork pass across the screen. |
| 2.1 – 2.9 | All parts except the hairspring fade out. |
| 2.9 | Slide 2's text fades in. |

When you go back, the sequence runs in reverse. The fades are CSS transitions,
and the JS camera waits for them. Each change of view follows these rules:

- a part that becomes visible fades in with no delay;
- the camera moves after that fade-in;
- a part that becomes hidden fades out after the camera move.

The frontmatter can also take a list with one view for each click, for example
`watch: [cover, hairspring]`. This costs about 5 lines. I will add it only when a
slide needs it.

## The presenter view, the overview and print

Verified in the Slidev 53 source. Each context renders the slides differently:

| Context | What Slidev renders | Does the live layer (option B) appear? | What we must add |
| --- | --- | --- | --- |
| Audience window (`/1`) | `SlidesShow`: `global-bottom` one time, then every slide | yes | nothing |
| Presenter window (`/presenter/1`), current slide | `SlidesShow` with `render-context="presenter"` | yes: it zooms as the audience view does | nothing. It is a separate browser document, so its clock is not in phase with the audience window's. The audience does not see this. |
| Presenter window, next slide | only `SlideWrapper`, with `render-context="previewNext"` | **no** | a still copy (below) |
| Overview (`/overview`) and quick overview (`o`) | only `SlideWrapper` for each slide, with `render-context="overview"` | **no** | a still copy (below) |
| Print and `slidev export` | `PrintSlideClick`: `global-bottom` **for each page**, with that page's own `nav` context | yes, one copy on each page | read the slide from the injected slide context, not the global `nav`, so each page shows its own view. No transitions. Pause each copy at $t = 0$, so the PDF is the same each time. |

Slidev renders `slide-bottom.vue` inside every `SlideWrapper`, in every context.
So `slide-bottom.vue` does two jobs:

1. On every slide that has `watch:`, it renders a small marker element. The
   slide's layout is the next sibling of that marker, so one CSS rule,
   `.watch-marker ~ .slidev-layout { background: transparent }`, makes that
   slide see-through. The fact "this slide shows the watch" stays in one place:
   the `watch:` line.
2. In the `previewNext` and `overview` contexts only, it renders a still copy of
   the watch in that slide's view, with its clock paused.

Several inline copies can then be in one document (the presenter window, the
overview, print). Each copy gets its own `id` prefix when it is inlined, so a
`url(#…)` reference always finds its own copy's clip path. The view CSS in the
SVG is keyed by `data-view` on each `<svg>`, so the copies do not disturb one
another.

## Data model (for your approval: `skeleton_watch.py` grows by about 100 lines)

**Fixed data, on objects (new or changed):**

| Class | Kind | Fields | Links |
| --- | --- | --- | --- |
| `Wheel`, `Balance`, `Fork` | unchanged | | |
| `Hairspring` (new) | `@dataclass(eq=False)` | `name`, `inner_radius` 8, `outer_radius` 38, `turns` 3.25. These numbers are literals in `build()` now. | `balance: Balance`. Its centre is the balance's arbor, so the arbor is not stored twice. |
| `Hand` (new) | `@dataclass(eq=False)` | `name` | `wheel: Wheel`, the arbor that carries it (`FOURTH` for the seconds hand, `CENTRE` for the hour and minute hands) |
| `Frame` (new) | `@dataclass(eq=False)` | `name` | none. `CASE` (strap, lugs, crown, band, bezel) and `DIAL` (the chapter ring). The radii stay constants. |
| `Part` | type alias | `Wheel \| Balance \| Fork \| Hairspring \| Hand \| Frame` | |
| `View` (new) | `@dataclass(frozen=True)`, a value | `name` (for export only); `focus: Round \| None` (`None` is the whole watch); `shown: frozenset[Part]`; `target_centre: Point` and `target_radius: float`, where the focus lands on the canvas | `focus` and `shown` refer to part objects |
| `VIEWS` (new constant) | list | `COVER = View("cover", None, ALL_PARTS, …)` and `HAIRSPRING_VIEW = View("hairspring", BALANCE, frozenset({HAIRSPRING}), (705, 276), 250)` | |

The balance, not the hairspring, sets the zoom of `HAIRSPRING_VIEW`. The zoom
then does not change when the balance comes back into the `shown` set.

**Computed for each run (side tables, as today):**

- `Placement.arbor` is unchanged. The new `Placement.circle(part)` returns the
  arbor and the outer radius of the focus.
- `camera(view, placement, at)` returns the scale and the translation. It is
  computed when the CSS (or a still's `transform`) is written, and it is not
  stored.

**What the SVG gains:**

- `data-part="{part.name}"` on each group that draws a part. A part in several
  groups (for example the balance) has the same value on each group.
- One `<g class="camera">` around the drawing.
- One `<style>` with one rule set for each view (the camera's numbers as custom
  properties, and the fade), and `vector-effect: non-scaling-stroke` on the
  strokes.
- The CLI option `--stills DIR` writes one SVG for each view, with `data-view`
  set and the camera's `transform` written in, for the measurement tools. It
  writes one file for each view, so nothing looks up a view by its name.

**Where the SVG goes** (changed after step 1): out of `public/`, because Vite
cannot import a file in `public/` as text. I propose `art/skeleton-watch.svg`,
next to its generator (question 1). `validate_skeleton_watch.py` then passes
that path to `artcheck.py`, because the default scan covers only `public/`.

Parts are named by strings in two places, and both are export boundaries: the
`data-part` attribute and the `watch:` value in the frontmatter. The Vue code
only copies the string to `data-view`. It never looks up an object by name.

## Steps

Every browser test in these steps runs in Chrome and in Firefox: by hand in the
desktop browsers, and headless with Playwright's Chromium and Firefox (both are
installed).

1. **Done: the spike.** See [spike/README.md](spike/README.md) and "Step 1
   results" above. The CPU load on the talk's laptop is not measured yet:
   headless, the median frame gap is 16.7 ms (60 frames a second). It moves to
   step 5.
2. `skeleton_watch.py`: add the data model above: the part tags, the camera
   group, the view CSS, and `--stills`. Move its output to
   `art/skeleton-watch.svg` (question 1), and update the paths in
   `validate_skeleton_watch.py`, `docs/README.md` and `docs/measurements.md`.
   Then run `validate_skeleton_watch.py`. For the cover view, the SVG must render
   the same as before, pixel for pixel, in both browsers. The file changes,
   because it gains the tags and the style.
3. Add the Vue code:
   - `components/SkeletonWatch.vue`: imports the SVG with `?raw`, inlines it
     with its own `id` prefix, and takes a view and a "live" or "still" mode.
     In live mode, it runs the JS camera: it sets `data-view` (which starts the
     fades), reads the camera's numbers from the SVG's custom properties, and
     moves the camera linearly in $\ln s$, with the delays of "The sequence".
   - `global-bottom.vue`: the live copy. It takes the view from the current
     slide's `watch:` value, through `inject(injectionSlidevContext)` from
     `@slidev/client/constants.ts` (not `useSlideContext()`, which needs a
     slide). Its root has the class `slidev-layout`, so the theme paints it
     with the page colour. When the slide has no `watch:`, it fades out with the
     slide transition. It hides with `visibility`, not `display: none`, so the
     clock and the `url(#…)` references keep working. In print, it has no
     transitions and is paused at $t = 0$.
   - `slide-bottom.vue`: the marker, and the still copies for `previewNext` and
     `overview`.
   - `stem/tools/offline_check.py`, if you approve (question 2): look for the
     slide's layout inside `#slideshow`, so that it reports the slide, not the
     watch layer.
4. `slides.md`:
   - The cover: remove the `<img>`, and add `watch: cover` and
     `transition: fade-out`.
   - The hairspring slide: add `watch: hairspring`, and delay its text until the
     sequence ends.
5. Checks, in both browsers:
   - `validate_skeleton_watch.py`.
   - `barroom.py` and `motion.py --sep 1` on the hairspring still.
   - `pnpm format`, `pnpm build`, `tools/offline_check.py`.
   - By hand: forward and back through the first three slides; a slide with
     `transition: none`; the presenter window (both panes); `/overview` and the
     `o` overview; `slidev export`.
   - On the talk's laptop, if you can: the frame rate during the zoom, in each
     browser's performance panel.
6. When you say the task is complete: update `docs/slide-patterns.md` (how a
   slide uses the watch layer) and `docs/README.md`. Add the new still to
   `docs/measurements.md`.

## Risks

| Risk | How we find it | What we do |
| --- | --- | --- |
| Chromium's 1 px softening while the camera moves is visible in a real Chrome | you look at the spike page, and at the deck in step 5 | a shorter zoom, so the soft frames pass sooner. Firefox and the end frame are sharp. |
| The CPU load of the zoomed drawing, which is repainted at every frame | step 5, both browsers' performance panels, on the talk's laptop | fewer keyframes, or a smaller painted area |
| The subpath `@slidev/client/constants.ts` is not public API, and a Slidev update may move it | `pnpm build` after each Slidev update | inject the context by its key string, `'$$slidev-context'` |
| The marker's sibling rule depends on how `SlideWrapper` orders its children | step 5, all contexts | put the marker inside the slide instead |
| Several still copies make the overview slow | step 5 | the copies are paused, so they cost only one paint each. If it is still slow, use an `<img>` of each view's still file. |

## Later views (not Stage 1, but the design must allow them)

- **More parts** (for example the minute and hour wheels). Add the parts to the
  generator, tag their groups, and add a `View` if the talk zooms to them.
  Nothing changes in the Vue code.
- **The balance and the impulse jewel after the fade.** Add them to the view's
  `shown` set. The zoom stays the same, because the balance sets it.
- **A view that hides a wheel that is above another wheel** (for example "the
  escapement only", which hides the fourth wheel). The static clip keeps a hole in
  the escape wheel where the fourth wheel was. To fix this, draw a second copy of
  the part of each lower wheel that is under the upper wheel, tagged
  `data-under="fourth"`, and show it only when the upper wheel is hidden. I will
  do this when a view needs it, not now.
- **Stage 2 (3D, and easing the motion to a stop).** SMIL has
  `pauseAnimations()` and `setCurrentTime()`. A small driver can pause the SMIL
  clock and advance it at a slowing rate until it stops. The motion stays defined
  in one place, the generator. The 3D look is a separate question for later.

## Questions for you (after step 1)

1. **Where the SVG goes.** It must leave `public/`. I propose
   `art/skeleton-watch.svg`, next to its generator. The alternative is
   `components/skeleton-watch.svg`, next to the Vue code that imports it.
2. **A one-line change to `stem/tools/offline_check.py`**, which all talks
   share: look for the slide's layout inside `#slideshow`. Without it, the tool
   reports the watch layer's classes and fonts instead of the slide's, on every
   slide that shows the watch.
3. **Please look at the zoom in a real Chrome and a real Firefox** (the spike
   README, "Try it"). Headless Chromium softens edges by about 1 px during the
   zoom. I cannot tell from here whether a real Chrome with GPU raster does too,
   or whether you would notice it during a 1.8 s zoom.
4. **Firefox (after round 3).** Chrome is smooth. Firefox stalls because it
   re-rasterizes the whole drawing on the CPU at each frame while anything
   moves, and the cost grows with the screen's pixels. The choices:
   - (a) present in Chrome, and accept a stutter in Firefox;
   - (b) find which drawing features cost Firefox most (big translucent fills,
     the gears' many arcs, the fill and stroke drawn as two paths), and make
     the drawing cheaper. The payoff is not certain: at projector size, even
     with nothing moving, Firefox drops 4–6 frames per zoom;
   - (c) stop the mechanism smoothly before the zoom and restart it after. In
     Firefox that is the smoothest variant measured, but it gives up the
     motion through the zoom that you asked for.

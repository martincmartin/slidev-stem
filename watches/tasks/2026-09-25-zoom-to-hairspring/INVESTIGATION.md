# Zooming an animated SVG in Slidev: an investigation

Martin C. Martin and Claude (Opus 5.5), 2026-09-25.
Task: [PLAN.md](PLAN.md), step 1. Code and raw results: [spike/](spike/).

## Abstract

The cover slide of the watches talk shows a skeleton watch drawn as one SVG,
animated with SMIL. The next slide must zoom 4.46 times into the balance and
hairspring, fade out everything but the hairspring, and keep the mechanism
moving without a jump. We built a test page and a three-slide Slidev deck,
measured them headless in Chromium and Firefox, observed them by eye in
desktop Chrome and Firefox, and then measured them in visible browser windows.

We observed:
- the mechanism's motion stays continuous;
- `vector-effect: non-scaling-stroke` keeps line widths but makes Firefox drop
  frames, and dividing stroke widths by the scale does not;
- a CSS opacity transition pending on the clipped wheels during the zoom makes
  Chromium drop a third of its frames, and in desktop Chrome, parts blinked;
- Firefox stalls while any part of the drawing animates, and the stall grows
  with the number of screen pixels.

With the fade started after the zoom and compensated strokes, Chrome was smooth
by eye and by measurement. Firefox still stuttered.

Sections 2 to 5 give methods and results. Section 6 lists faults in our own
measurement tools. Interpretation is in section 7 only.

## 1. The question

**The requirement.** On a key press:
1. the cover's text fades;
2. a camera zooms in until the balance circle (radius 56 px on the 980 × 552
   slide canvas) becomes a circle of radius 250 px centred at (705, 276), a
   scale of $s = 250/56 \approx 4.464$;
3. every part of the watch except the hairspring fades out.

The following conditions apply:
- **Continuity:** the mechanism (balance, hairspring, fork, gear train, hands)
  must not jump back to time zero at any point.
- **Line widths:** lines keep their width on screen during the zoom (Martin's
  decision). The house stroke ladder is 2, 2.5, 3 and 4 px.
- **Browsers:** it must work in Chrome and in Firefox
  (`~/Develop/slidev/AGENTS.md`).

**The design under test** (PLAN.md, option B):
- one inline copy of the SVG in Slidev's `global-bottom.vue` layer, which stays
  mounted for the whole talk;
- each slide names a view (`watch: hairspring`);
- CSS in the SVG, keyed on `svg[data-view=…]`, holds each view's camera
  numbers and its fade;
- a camera group, `<g class="camera">`, moves the view.

## 2. Materials

### 2.1 Hardware and software

| Item | Value |
| --- | --- |
| Machine | MacBook Pro, Apple M3 Pro, 36 GB, on mains power throughout |
| Display | built-in Liquid Retina XDR, 3456 × 2234; desktop browsers at `devicePixelRatio` 2 |
| OS | macOS 26.6.2 (25G83) |
| Slidev | 53.0.0 (`@slidev/cli`, `@slidev/client`) |
| Playwright (Python) | 1.63.0 |
| Headless browsers | Chromium 153.0.8010.12 (Playwright's headless shell, the default launch); full Chromium 153.0.8010.12 (`channel="chromium"`); Google Chrome 153.0.8010.53 (`channel="chrome"`); Firefox 155.0 (Playwright's build) |
| Headed browsers | Playwright's Firefox 155.0 and Chromium 153.0.8010.12 with `headless=False`, in windows on the laptop's screen. `window.devicePixelRatio` read 1 in these windows. |
| Martin's browsers | desktop Firefox, `about:support` "Compositing: WebRender" (no "Software"); desktop Chrome, one incognito window. Versions not recorded. |

### 2.2 The drawing

- **Copies of the generator.** `spike/mirror/` holds copies, as of
  2026-09-25, of `art/skeleton_watch.py`, `slides.md` and the theme's
  `ledger.css`.
- **Two variants.** The copy writes one decimal per coordinate (`num()` uses
  `.1f`). `skeleton_watch_2dp.py` differs from it in that one line (`.2f`).
- **Tagging.** `spike/make_svgs.py` runs both variants, then post-processes
  each SVG with `xml.etree`:
  - every top-level group gets `data-part="hairspring"` if it contains the
    `<animate attributeName="d">` of the hairspring, else `data-part="rest"`
    (1 and 26 groups);
  - the drawing is wrapped in `<g class="camera">`;
  - a `<style>` is added that sets, under `svg[data-view=hairspring]`, the
    camera numbers as custom properties, and `opacity: 0` on every
    `[data-part]` except the hairspring.
- **Camera numbers.** The balance centre on the canvas is read from the
  balance's clip path: (845.1, 162.7) at one decimal. The camera is
  `translate(X, Y) scale(S)` with $S = 4.4643$, $X = 705 - S \cdot 845.1$ and
  $Y = 276 - S \cdot 162.7$. At one decimal, $X = -3067.768$ and
  $Y = -450.339$. At two decimals, $X = -3067.589$ and $Y = -450.205$.
- **The mechanism** (unchanged from production):
  - balance period 2 s, amplitude 150°;
  - 24 linear keyframes per period for the balance angle and the hairspring's
    `d`;
  - the gear train and hands use `accumulate="sum"` over one 2 s period;
  - the fourth wheel and seconds hand use a 60 s loop.

### 2.3 The test page, `spike/site/zoom.html`

The page fetches an SVG and inlines it in a 980 × 552 stage with the page
colour `#FAF7F0`. The stage sits in a host `<div>` that can be scaled, like a
Slidev slide. A button toggles the zoom. Query parameters select the variant:

| Parameter | Values | Effect |
| --- | --- | --- |
| `mode` | `svg` (default), `html`, `js` | camera as a CSS `transition` on the SVG camera group; as a CSS transition on an HTML `<div>` around the `<svg>`; or a JS `requestAnimationFrame` loop that writes the camera group's `transform` attribute at each frame |
| `ease` | `linear` (default), `exp` | `linear`: the scale moves linearly. `exp`: its logarithm does; in CSS modes, through an `@property`-registered number `--z` and `scale(exp(var(--z)))` |
| `stroke` | `fixed` (default), `scaled`, `compensated` | `fixed`: `vector-effect: non-scaling-stroke` on every element. `scaled`: nothing, so lines grow with the zoom. `compensated` (JS only): four CSS rules, `[stroke-width="2"] { stroke-width: calc(2px / var(--s)) }` and likewise for 2.5, 3 and 4, with `--s` set on the `<svg>` by the JS camera at each frame |
| `host` | number (default 1) | CSS `scale()` on the host, as Slidev scales a slide to the window |
| `dur`, `fade` | seconds (defaults 1.8, 0.8) | zoom and fade durations |
| `smil` | `paused` + `t` | `pauseAnimations()` and `setCurrentTime(t)` |
| `only` | `hairspring` | hide the rest from the start |
| `fadelater` | `1` | start the fade from JS when the camera stops (a `setTimeout` of `dur`), instead of a CSS `transition-delay` of `dur` that is pending during the move |
| `clips` | `off` | remove every `clip-path` attribute |
| `drop` | any of `spring`, `balance`, `fork`, `train`, `seconds` | remove those SMIL animation elements |

- **CSS modes.** Each CSS mode uses `ease-in-out`. The translation grows in
  step with the scale, so one canvas point stays still: a dolly, not a pan
  plus a zoom.
- **The JS mode changed during the investigation:**
  - first page: it interpolated $\ln s$ only, eased with `easeInOutCubic`;
  - from round 2 on: it interpolates $s$ (`ease=linear`) or $\ln s$
    (`ease=exp`), eased with CSS's `cubic-bezier(0.42, 0, 0.58, 1)`, solved by
    bisection.

  Results from the first page are marked "superseded" (section 5.3).
- **Order on zoom in:** the camera moves at once, and the fade follows after
  `dur`. On zoom out, the parts fade in at once, and the camera moves after
  `fade`.

### 2.4 The spike deck, `spike/deck/`

The deck is three slides, with theme `ledger` and headmatter
`transition: fade-out`:
1. `watch: cover`, with a title;
2. `watch: hairspring`, with a title and one line of text;
3. no `watch:`.

It has two layer components:
- `global-bottom.vue`:
  - imports the tagged one-decimal SVG with `?raw` and inlines it with
    `v-html`, in a root `<div class="slidev-layout watch-layer">`;
  - reads the current slide's `watch:` through
    `inject(injectionSlidevContext)`, and sets `data-view` on the `<svg>`
    (removed for `cover`);
  - sets `visibility: hidden` when the slide has no `watch:`;
  - has a CSS `transform` transition on the camera (linear) and
    `vector-effect: non-scaling-stroke`.
- `slide-bottom.vue` renders `<i class="watch-marker">` on each slide with
  `watch:`. The rule `.watch-marker ~ .slidev-layout { background: transparent }`
  makes that slide see-through.

## 3. Measures

| Measure | Definition |
| --- | --- |
| **Sharpness ratio** | Mean $\lvert\nabla^2 I\rvert$ / mean $\lvert\nabla I\rvert$ of the grey image $I$ (4-neighbour Laplacian, central-difference gradient) over a 300 × 300 px square around the balance, in the capture during the zoom, divided by the same for a reference capture: the same camera matrix set as a static CSS `transform` with no transition. About 1 means the same edges; lower means softer. |
| **Ink** | Per pixel, $(L_{bg} - L)/(L_{bg} - L_{line})$ clipped to [0, 1], with Rec. 709 luminance, background `#FAF7F0`, line `#143C6B`. |
| **Crossing width and extent** | Along the pixel row through the hairspring's centre, from the centre rightwards, each run of pixels with ink > 0.05 is one line crossing. Its **width** is the sum of its ink (px); its **extent** is its length in pixels. Blur keeps the width and increases the extent. Reported: the median width and the mean extent of the crossings. |
| **Frame gap** | The difference between consecutive `requestAnimationFrame` timestamps. A gap over 25 ms is at least one dropped frame at 60 Hz. |
| **Continuity** | At each frame: the SMIL clock (`svg.getCurrentTime()`), the wall clock, and the balance angle (`animVal.getItem(0).angle` of the balance's rotating group). The step error is the SMIL clock's step minus the wall clock's step. The angle error is the difference from the keyframed angle at that SMIL time (150 cos, 24 linear pieces). |
| **Zoom curve** | $\ln s$ at each frame, from the camera's matrix. The rate is its finite difference over the total $\ln S$. Reported: the fraction of the zoom at which the rate peaks, and the rate at 1/4 over the rate at 3/4. |

## 4. Experiments before Martin's first look

### E1. Reading Slidev's source

**Method.** We read `@slidev/client` 53.0.0 and `@slidev/parser` 53.0.0 in
`node_modules`.

**Observations:**
- **Global layers.**
  - `internals/SlidesShow.vue` renders `<GlobalBottom />` once, before and
    outside the slide `TransitionGroup` (line 78).
  - Each loaded slide is a `SlideWrapper` with `v-show`. Slides stay mounted
    once visited (`loadedRoutes`).
  - `internals/SlideWrapper.vue` renders `<SlideBottom />` before the slide's
    layout component in every `SlideWrapper`.
- **Where each context renders slides:**
  - The presenter page (`pages/presenter.vue`) renders the current slide with
    `SlidesShow` (`render-context="presenter"`). It renders the next slide
    with a bare `SlideWrapper` (`previewNext`).
  - `pages/overview.vue` and `internals/QuickOverview.vue` use bare
    `SlideWrapper`s (`overview`).
  - `internals/PrintSlideClick.vue` renders `GlobalBottom` for each printed
    page, and provides that page's own `nav` with `provideLocal`.
- **Transitions:**
  - `logic/transition.ts` line 42 uses the `transition` of `prevRoute` going
    forward and of `currentRoute` going back.
  - `composables/useNav.ts` line 115: `prevRoute` is the slide numbered one
    less than the current slide.
  - `styles/vars.css`: `--slidev-transition-duration: 0.5s`, and
    `--slidev-slide-container-background: black`.
  - `styles/transitions.css`: `fade-out` fades the old slide out over
    0.6 × 0.5 s, then the new one in over 0.8 × 0.5 s after a 0.3 s delay.
- **Theme.** `themes/ledger/styles/ledger.css` sets the palette variables
  and an opaque `background` only on `.slidev-layout`.
- **Context API.**
  - `context.ts`: `useSlideContext()` reads the click context, which only a
    `SlideWrapper` provides.
  - `@slidev/client`'s exports map lists `./constants`.
- **Another element with the layout class.** `internals/InfoDialog.vue` puts
  `slidev-layout` on an element that is not a slide.

### E2. Fidelity of the copies

**Method.** Run the mirror copy and `cmp` its output with
`public/cover/skeleton-watch.svg`. Compare the sizes of the two variants.

**Result:**
- The copy's output is byte-identical to the production SVG.
- Sizes: 46,104 bytes at one decimal and 52,169 bytes at two (+13%).
- After tagging: 46,767 bytes. That tagged file is also the one in the deck,
  byte-identical.

### E3. Stroke width at rest (`measure_static.py`)

**Method.** Headless, viewport 1500 × 900.

**Variants:** the camera group (`svg`) or the HTML wrapper (`html`); host
scale 1 or 1.5; `stroke=fixed` or `scaled`.

For each variant:
1. zoom with `dur=0&fade=0`;
2. wait 300 ms;
3. capture the host;
4. measure the median crossing width of the hairspring.

**Result**, in screen px (Chromium / Firefox):

| Camera | Host 1, fixed | Host 1, scaled | Host 1.5, fixed | Host 1.5, scaled |
| --- | --- | --- | --- | --- |
| SVG group | 2.01 / 1.98 | 8.97 / 8.94 | 3.03 / 2.99 | 13.49 / 13.49 |
| HTML wrapper | 8.96 / 8.91 | 8.97 / 8.97 | 13.50 / 13.46 | 13.49 / 13.48 |

For reference: $2 \times 4.464 = 8.93$, and $2 \times 4.464 \times 1.5 = 13.39$.

### E4. One against two decimals (`measure_static.py`)

**Method.**
1. Load the zoomed view with the mechanism stopped at $t$ = 0.1, 0.35, 0.6,
   0.85 and 1.3 s.
2. Capture the stage once with each SVG.
3. Take the per-pixel maximum channel difference.

**Result:**

| $t$ (s) | Largest difference (of 255), Chromium / Firefox | Pixels differing by > 32 | Pixels with ink |
| --- | --- | --- | --- |
| 0.1 | 160 / 160 | 511 / 548 | 5346 / 5355 |
| 0.35 | 112 / 108 | 585 / 577 | 5731 / 5722 |
| 0.6 | 115 / 116 | 445 / 411 | 6259 / 6258 |
| 0.85 | 131 / 132 | 689 / 681 | 6770 / 6756 |
| 1.3 | 154 / 154 | 425 / 442 | 6449 / 6465 |

Close-ups of the largest difference (`out/rounding-*.png`) show the same
curve in both files, displaced by a fraction of a pixel. We saw no change of
shape.

### E5. Sharpness in the middle of the zoom (`measure_zoom.py` and controls)

**Method.** Headless, viewport 1500 × 900, host 1, `stroke=fixed`,
`dur=400`.

For each run:
1. Start the zoom.
2. Move it to its middle:
   - in the CSS modes, set `currentTime` = 200,000 ms on the transition
     (`document.getAnimations()`);
   - in the JS mode, move the tween's start time.
3. Let it run 500 ms, then capture while it runs.
4. Capture the reference in a new page.

**Variants:** mechanism stopped at 0.5 s (`paused`) or running (`running`).

**Controls:**
- **Repeats** (`repeat_sharpness.py`): five repeats of each variant.
- **Other Chromium builds** (`channel_sharpness.py`): full Chromium and Google
  Chrome.
- **Attribute against CSS** (`check_reference.py`): with nothing moving, the
  camera set as the SVG `transform` attribute against the CSS `transform`
  property.

**Result**, on the current page (mean of five repeats; range in brackets):

| Camera | Chromium, stopped | Chromium, running | Firefox, stopped | Firefox, running |
| --- | --- | --- | --- | --- |
| CSS `transform`, linear | 0.944 [0.944–0.944] | 0.821 [0.818–0.822] | 0.997 [0.997–0.997] | 0.996 [0.993–0.998] |
| CSS `--z`, exp | 0.789 [0.786–0.799] | 0.819 [0.814–0.823] | 1.001 [1.000–1.001] | 0.998 [0.997–1.001] |
| JS attribute, exp | 0.792 [0.787–0.798] | 0.817 [0.814–0.823] | 1.001 [0.999–1.002] | 0.998 [0.996–1.000] |

**Other builds:**

| Camera | Full Chromium, stopped / running | Google Chrome, stopped / running |
| --- | --- | --- |
| CSS linear | 0.944 / 0.871 | 0.911 / 0.867 |
| CSS exp | 0.805 / 0.829 | 0.807 / 0.831 |
| JS exp | 0.806 / 0.830 | 0.805 / 0.829 |

**Control:** attribute against CSS at rest, 1.000 in both browsers.

**Superseded** (the first page's JS mode, `easeInOutCubic`), in the headless
shell: JS exp 0.941 / 0.878 in Chromium, and 1.003 / 1.003 in Firefox.

The mid-zoom scale was:
- CSS linear: 2.739;
- CSS exp and current JS exp: 2.119–2.120;
- superseded JS: 2.125.

**By eye.** In `out/mid-*.png`, Chromium's captures during the zoom look
softer at the edges than their references. Firefox's look the same.

A variant with the camera on the HTML wrapper had scored 0.99 in Chromium in
an earlier run. E3 rejected it (strokes grow), and it is not in the final
table.

### E6. Hairspring width and extent during the zoom (`measure_zoom.py`)

**Method.** As in E5, with `only=hairspring` and the mechanism stopped at
0.5 s. Capture at 1/4, 1/2 and 3/4 of the zoom. The reference is the same
matrix at rest.

**Result**, as scale: width (extent moving / extent at rest):

| Camera | Chromium | Firefox |
| --- | --- | --- |
| CSS linear | 1.45: 2.00 (3.67 / 2.67); 2.74: 2.02 (4.00 / 3.00); 4.02: 1.97 (3.67 / 3.00) | 1.45: 2.01 (2.67 / 2.67); 2.74: 2.02 (3.00 / 3.00); 4.02: 2.02 (3.00 / 3.00) |
| CSS exp | 1.22: 1.99 (3.00 / 2.67); 2.12: 2.01 (3.00 / 2.67); 3.69: 2.02 (3.00 / 3.00) | 1.22: 1.98 (3.00 / 2.67); 2.12: 2.02 (3.00 / 2.67); 3.69: 2.02 (3.00 / 3.00) |
| JS exp | 1.22: 1.99 (3.00 / 2.67); 2.12: 2.00 (3.00 / 2.67); 3.69: 2.02 (3.00 / 3.00) | 1.22: 1.98 (3.00 / 2.67); 2.12: 2.01 (3.00 / 2.67); 3.69: 2.02 (3.00 / 3.00) |

### E7. Continuity (`measure_timing.py`)

**Method.** Headless, `mode=js`, mechanism running. Sample every animation
frame for 7.5 s. Zoom in at 1.0 s and out at 4.2 s.

**Result:**

| | Frames | Largest step error | SMIL clock ever went back | Largest balance-angle error |
| --- | --- | --- | --- | --- |
| Chromium | 411 | 0.000 s | no | 0.031° |
| Firefox | 425 | 0.0008 s | no | 0.029° |

### E8. Zoom curve (`measure_timing.py`)

**Method.** Headless. Sample each frame for 2.4 s from the start of a
1.8 s zoom in.

**Result:**

| Camera | Peak rate at fraction, Chromium / Firefox | Rate at ¼ over rate at ¾, Chromium / Firefox |
| --- | --- | --- |
| CSS linear | 0.333 / 0.328 | 2.63 / 2.69 |
| CSS exp | 0.509 / 0.514 | 0.96 / 0.89 |
| JS exp | 0.500 / 0.493 | 0.99 / 1.00 |

**Frame gaps during these zooms:**
- median 16.7 ms in both browsers;
- longest 33.4 ms (Chromium) and 50.4 ms (Firefox).

### E9. The spike deck (`deck_check.py`, `slidev build`, `offline_check.py`)

**Method.**
1. Start the deck with `slidev slides.md --port 3131`.
2. In each browser, with windows of 1280 × 720 and 1920 × 1080: load slide 1,
   wait 1.5 s, and record the state; press → and wait 3.5 s; press → and
   wait 1.5 s.
3. On slide 2, measure the hairspring's crossing width against
   $2 \times$ the slide scale.
4. Then run `slidev build`, and run the house tool
   `tools/offline_check.py <build> 1:0 2:0 3:0`.

**Result:**

| | Layer background | Slide 1 and 2 layout background | Slide 3 layout background | Layer on slide 3 | Hairspring on slide 2 (expected) |
| --- | --- | --- | --- | --- | --- |
| Chromium 1280 | `#FAF7F0` | transparent | `#FAF7F0` | hidden | 2.64 px (2.61) |
| Chromium 1920 | `#FAF7F0` | transparent | `#FAF7F0` | hidden | 3.93 px (3.91) |
| Firefox 1280 | `#FAF7F0` | transparent | `#FAF7F0` | hidden | 2.59 px (2.61) |
| Firefox 1920 | `#FAF7F0` | transparent | `#FAF7F0` | hidden | 3.92 px (3.91) |

**Other observations:**
- **The SVG's first location failed.** In `public/cover/`, the import
  `./public/cover/skeleton-watch.svg?raw` failed. Vite's message: "Assets in
  public directory cannot be imported from JavaScript." From `deck/watch/` it
  loaded.
- **The context import failed without its extension.** `import … from
  '@slidev/client/constants'` failed in dev ("Failed to load url …
  /@slidev/client/constants … Does the file exist?"). With `.ts` appended it
  loaded.
- **Console errors from Slidev itself:**
  - "Failed to patch FloatingVue TypeError … reading 'Popper'", from
    `@shikijs/vitepress-twoslash`;
  - in Chromium, "Wake Lock permission request denied".
- **The build** succeeded, with the SVG bundled into a JS chunk.
  `offline_check.py` reported 0 outside requests.
- **`offline_check.py` misreported every slide:** "classes": "slidev-layout
  watch-layer", "h1": null. It reports the first visible `.slidev-layout`.
- **`artcheck.py` allows only the panel colour as a drawing's field.**
  `stem/tools/lib.py` sets `ART_FIELD = LEDGER["panel"]` (`#F2EEE4`), not the
  page colour.

## 5. Martin's observations, and the experiments they led to

### 5.1 Round 1 by eye (desktop browsers, `devicePixelRatio` 2)

Martin's report, lightly edited:
- `mode=js&ease=exp` in Firefox: "mostly smooth, but some halting and jumps".
- `mode=svg&ease=linear` in Firefox: "also mostly smooth, but some halting
  and jumps. Maybe a little smoother than js, but probably in the noise."
- `mode=js&ease=exp` in Chrome: "motion is smooth, but parts of the mechanism
  (other than the hairspring) blink in and out, it looks really bad. That
  happens during zoom in, but not during zoom out."
- `mode=svg&ease=linear` in Chrome: "same blinking in and out on zoom in, but
  not on zoom out."
- "I definitely prefer linear to exp, in all browsers and modes."

### E10. Looking for the blinks (`blink_check.py`)

**Method.**
- Headless Chromium, viewport 1500 × 900.
- Stream every compositor frame through the DevTools
  `Page.startScreencast` (PNG, every frame) from 300 ms before a zoom in to
  2.2 s after it.
- In each frame, count the pixels within 8 levels of the knockout colour
  `#D3DCE3`.
- Flag a frame whose count is under 80% of the median of the five frames on
  each side.

**Result** (current page):

| Variant | Frames | Flagged frames |
| --- | --- | --- |
| `mode=svg&ease=linear` | 115 | 106, 109, 112 |
| `mode=js&ease=exp` | 118 | 109, 113, 114, 116 |
| `…&fadelater=1` (svg) | 140 | 132, 136, 137, 138 |
| `…&fadelater=1` (js) | 139 | 131, 133, 136 |

All flagged frames fall in the last 8% of the recording. We inspected one
pair (`out/blink-*.png`): the parts are fading out as a whole, the planned
fade. We saw no frame where one part disappeared and came back.

### E11. Dropped frames, headless (`jank_check.py`)

**Method.**
- Headless, viewport 1500 × 900, host 1, mechanism running unless stated.
- Five zooms in per variant, each in a fresh page 300 ms after load.
- Record the frame gaps over 1.8 s.
- The table is the third run. The first two runs of the first five variants
  gave: Chromium baseline 134 and 139 slow frames; Firefox baseline 99 and
  100.

**Result**, as slow frames (> 25 ms) / frames, and the longest gap:

| Variant | Chromium | Firefox |
| --- | --- | --- |
| `mode=svg&ease=linear` | 134 / 414, 33.5 ms | 88 / 439, 66.7 ms |
| … `&clips=off` | 1 / 545, 33.3 ms | 98 / 457, 66.7 ms |
| … `&smil=paused` | 130 / 421, 33.5 ms | 78 / 470, 66.7 ms |
| … `&fadelater=1` | **0** / 545, 16.8 ms | 92 / 599, 42.6 ms |
| `mode=js&ease=exp` | 115 / 432, 50.0 ms | 79 / 476, 67.3 ms |
| `…&fadelater=1&stroke=scaled` (svg) | 0 / 545, 16.8 ms | **1** / 1056, 25.4 ms |
| `…&fadelater=1&clips=off` (svg) | 0 / 545, 16.8 ms | 103 / 585, 50.0 ms |
| `…&fadelater=1&only=hairspring` (svg) | 0 / 545, 16.8 ms | 0 / 1085, 9.3 ms |
| `…&fadelater=1&smil=paused&clips=off&stroke=scaled` (svg) | 0 / 550, 16.8 ms | 0 / 1086, 9.3 ms |
| `mode=js&ease=linear&fadelater=1&stroke=compensated` | **0** / 545, 16.8 ms | **1** / 995, 34.2 ms |
| `mode=js&ease=linear&fadelater=1&stroke=fixed` | 0 / 545, 16.8 ms | 108 / 588, 42.5 ms |

Headless Firefox's median gap was 8.3 ms in some variants and 16.7 ms in
others. Headless Chromium's was always 16.7 ms.

### E12. Compensated strokes (`check_compensated.py`)

**Method.** As E6, with
`mode=js&ease=linear&stroke=compensated&only=hairspring`, at 1/4, 1/2, 3/4
and the end of the zoom.

**Result**, as scale: width (extent), Chromium / Firefox:
- 1.45: 2.01 (2.67) / 2.01 (2.67)
- 2.74: 2.01 (3.00) / 2.02 (3.00)
- 4.02: 2.01 (3.00) / 2.02 (3.00)
- 4.46: 2.02 (3.00) / 2.02 (3.00)

### 5.2 Rounds 2 and 3 by eye

The page was `mode=js&ease=linear&fadelater=1&stroke=compensated`.

**Round 2, Martin's report:**
- **Chrome:** "Buttery smooth and no flickering/drop outs."
- **Firefox:** "Maybe better, but still some pausing/jumping."
- **System load:** `top` had shown Firefox's GPU process at about 300% CPU.
  After Martin closed the other Firefox windows, that process left the top
  lines of `top`. The page "still stuttered a little".

**Round 3, Martin's report, in desktop Firefox:**
- `about:support` Compositing: "WebRender", with nothing in parentheses.
- `&clips=off`: "didn't seem to make a difference".
- The baseline: "smooth at first, then when around 1/3 of the
  mainspring/barrel is below the screen, it freezes for maybe 100 to 200
  msec. So it's not a 'dropping every Xth frame' thing."
- `&smil=paused`: "much smoother, but I did notice what looked like a small
  'bump' or two in the motion, too short to measure the duration."

### E13. Dropped frames in visible windows (`headed_check.py`)

**Method.**
- Playwright browsers with `headless=False`, windows on the laptop screen
  (`devicePixelRatio` 1).
- Base page: `mode=js&ease=linear&fadelater=1&stroke=compensated`.
- For each zoom in: load, wait 1 s, and record each frame's gap and camera
  scale for 2 s.
- Four rounds:

| Round | Browsers | Viewport | Zooms per variant |
| --- | --- | --- | --- |
| 1 | Firefox, Chromium | 1100 × 700 | 5 |
| 2 | Firefox | 1600 × 1000 | 3 |
| 3 | Firefox | 2000 × 1150 | 3 |
| 4 | Chromium | 2000 × 1150 | 3 |

**Result**, as slow frames per zoom, and the worst gaps with the scale at
which they fell. Round 1's JSON file was overwritten by round 2, so its
numbers are from the console output:

| Round | Browser, host | Variant | Slow frames per zoom | Worst gaps (ms @ scale) |
| --- | --- | --- | --- | --- |
| 1 | Firefox, 1 | baseline | 3, 3, 3, 3, 3 | 42.6 @ 2.17, 42.3 @ 2.28, 41.7 @ 2.16 … all within 2.15–2.41 |
| 1 | Firefox, 1 | `smil=paused` | 0 × 5 | 17.3 |
| 1 | Firefox, 1 | `clips=off` | 3–4 | 58.3 @ 2.34, 50.7 @ 2.32 … within 2.16–2.54 |
| 1 | Firefox, 1 | `only=hairspring` | 0 × 5 | 9.3 |
| 1 | Chromium, 1 | baseline | 1, 0, 0, 0, 0 | 149.9 @ 4.46 (once), otherwise ≤ 10.5 |
| 1 | Chromium, 1 | the other three | 0 × 15 | ≤ 9.4 |
| 2 | Firefox, 1 | baseline | 5, 4, 5 | 33–43 @ 2.14–2.53 |
| 2 | Firefox, 1 | `smil=paused` | 0, 0, 0 | 17.3 |
| 2 | Firefox, 1 | `clips=off` | 6, 8, 7 | up to 50.9 @ 2.15–2.57 |
| 2 | Firefox, 1 | `only=hairspring` | 0, 0, 0 | 9.3 |
| 2 | Firefox, 1.5 | baseline | 10, 10, 12 | 50–58 @ 1.45–2.10 |
| 2 | Firefox, 1 | `drop=spring` | 4, 5, 5 | 33–42 @ 2.16–2.53 |
| 2 | Firefox, 1 | `drop=balance` | 5, 4, 4 | 33–43 @ 2.16–2.51 |
| 2 | Firefox, 1 | `drop=fork` | 6, 4, 4 | 42 @ 2.15–2.53 |
| 2 | Firefox, 1 | `drop=train` | 2, 2, 2 | 25–42 @ 2.15–2.45 |
| 2 | Firefox, 1 | `drop=seconds` | 5, 4, 5 | 33–42 @ 2.16–2.70 |
| 3 | Firefox, 1 | `drop=train,seconds` | 4, 1, 2 | 25–33 @ 2.13–2.65 |
| 3 | Firefox, 1 | `drop=spring,balance,fork` | 5, 4, 5 | 33–43 @ 2.16–2.48 |
| 3 | Firefox, 2 | baseline | 17, 17, 17 (of about 136 frames) | 83.3 @ 1.03, 75.0 @ 1.02, 66.7 @ 1.06 … from 1.02 to 1.68 |
| 3 | Firefox, 2 | `smil=paused` | 6, 4, 4 (of about 193 frames) | 50.0 @ 1.01, 41.6 @ 1.01, 33.3 @ 1.02–1.31 |
| 4 | Chromium, 2 | baseline | 1, 1, 0 | 150.0 @ 4.46, 25.1 @ 4.46, otherwise ≤ 9.4 |
| 4 | Chromium, 2 | `smil=paused` | 0, 0, 0 | ≤ 25.0 @ 4.46 |

**Frames per zoom** (2 s of samples):
- Firefox at host 1: 207–217 with the mechanism running; 226–228 with it
  stopped; 241 with only the hairspring.
- Chromium: 223–242.

## 6. Faults in our own measurements

Each fault below gave a wrong number before it was found. We found each one by
looking at the captured images or at an impossible value, not by the metric
alone.

| # | Fault | Effect | How found | Fix |
| --- | --- | --- | --- | --- |
| F1 | The page read its camera numbers by setting `data-view` on the real `<svg>` and then removing it. This started and reversed the fade transitions. | The first sharpness captures were taken mid-fade (parts at about 0–25% opacity). | Image inspection: parts pale in the reference, missing in the capture. | Read the numbers from a throwaway `<svg data-view>`. |
| F2 | The first sharpness metric, mean $\lvert\nabla^2 I\rvert$ alone, depends on how much is drawn. | Captures with the mechanism running (different part positions) could not be compared. | Reasoning after F1. | Divide by the mean gradient. |
| F3 | The pages were never closed. | Later pages were hidden behind earlier ones. The browser throttled their animation frames, so the JS camera never moved: the matrix was the identity, and the mean difference was 48. | An identity matrix during a zoom. | `open_page` is a context manager that closes the page. |
| F4 | The crossing width (total ink) cannot see blur. | The "2.0 px" widths during the zoom did not show the softness visible in E5's images. | Image inspection of a Chromium pair. | Added the extent. |
| F5 | `animVal.consolidate()` throws on the read-only list. | The exception stopped the frame loop inside a promise. `page.evaluate` waited until our 10-minute limit. | The process hung. | Read `getItem(0).angle`, catch errors, and set a page timeout. |
| F6 | The first sample after a zoom starts can read `transform: none`. | A crash in one of three runs. | The exception. | Parse `none` as scale 1. |
| F7 | The blink detector flagged the planned fade. | Every variant "blinked" near its end. | Image inspection. | None needed: it is recorded as a negative result (E10). |
| F8 | `headed_check.py` wrote one file for every round. | Round 1's JSON was overwritten. | Noticed when writing up. | One file per round. Round 1 comes from the console output. |
| F9 | The JS camera's easing changed between rounds (`easeInOutCubic`, then `cubic-bezier(0.42, 0, 0.58, 1)`). | The JS rows of E5, E7, E8 and E10 were measured on the old page. On the new page, the Chromium JS sharpness fell from 0.941 / 0.878 to 0.792 / 0.817. | Rerunning before this write-up. | All four were rerun on the current page. The old files are in `out/superseded/`. |

## 7. Interpretation

**I1. Continuity (E7).** One inline SVG kept mounted keeps one SMIL clock:
- the clock ran at wall-clock rate through a zoom in and out, and never went
  back;
- the balance stayed on its keyframes to within 0.03°.

So the persistent layer meets the continuity requirement with no clock code.

**I2. Line widths (E3, E6, E9, E12).**
- **`non-scaling-stroke`:**
  - inside the SVG, it measures in slide px, also under Slidev's own slide
    scaling;
  - it does not undo a transform on an HTML ancestor. A camera on an HTML
    wrapper cannot keep line widths with it.
- **Dividing each ladder width by the current scale:** holds the widths just
  as well (2.01–2.02 px) at no measurable cost (I4).

**I3. Chrome's blinking (5.1, E10, E11, 5.2).** We did not capture the
blinking itself. Headless compositing (E10) did not show it. We attribute it
to the fade's CSS `transition-delay`, pending on 26 groups (many of them
clipped) while the camera moves. The evidence:
- it happened only on zoom in, the only direction with a pending delayed
  transition;
- headless, the pending transition cost Chromium a third of its frames, and
  removing it (or the clip paths) removed the cost;
- by eye, the variant without it had no blinking.

The mechanism inside Chrome's GPU path is a guess.

**I4. Firefox's per-frame cost of `non-scaling-stroke` (E11).**
- With the pending fade removed, Firefox dropped about 1 frame in 6 with
  `non-scaling-stroke`, and 1 in 1000 without it.
- Compensated strokes gave the same result as no compensation.

**I5. Firefox's remaining stutter (5.2, E13).**
- **Every zoom, at a fixed device scale.** In visible windows the stall
  happened in every zoom. It began at a camera scale of about 2.15 at host 1
  and about 1.45 at host 1.5. Both are a device-pixel scale of about 2.2.
- **It grew with pixels:** 3–5 slow frames at host 1, 10–12 at 1.5, 17 at 2.
- **It needs animation.** With the mechanism stopped it was gone at host 1,
  and reduced (4–6) at host 2.
- **No single moving part causes it.** Removing the gear-train animations
  helped most (5 to 2). Removing the balance, hairspring and fork animations
  helped little. Removing the clip paths did not help.

This fits a renderer that re-rasterizes the whole SVG at the current scale at
each frame while any of it animates, and does so on the CPU. It is consistent
with the 300% CPU Martin saw. The "about a third of the way in" of Martin's
freeze matches the 2.15–2.5 band. His screen has four times the pixels of the
test windows, which fits one long freeze instead of several short ones.

We have not looked inside Firefox. "Rasterizes on the CPU" and "reuses the
raster when nothing animates" are inferences from the pattern, not
observations.

**I6. Sharpness in Chromium (E5, E6).**
- **During the zoom:** in headless Chromium, captures were softer than at rest
  by about 1 px of extent, in every camera method (0.79–0.94). That includes
  the JS attribute loop once F9 was fixed. So we withdraw an earlier
  conclusion that the JS loop is sharpest in Chromium.
- **At rest:** all methods were sharp.
- **By eye:** Martin saw no softness in desktop Chrome ("buttery smooth").
- **Firefox:** was sharp during the zoom in every method.

**I7. Rounding (E4).** One decimal moves lines by a fraction of a pixel at
4.46 times, with no change of shape. Two decimals cost 13% more file.

**I8. The zoom curve (E8, 5.1).** A zoom linear in scale is measurably uneven
in $\ln s$: its rate at ¼ is 2.6–2.7 times its rate at ¾. Martin still
preferred it to the symmetric one, in every browser. The metric did not predict
his preference, so we follow the preference.

**I9. Slidev integration (E1, E9).**
- **Mechanics that work:**
  - a `global-bottom.vue` layer;
  - a `slide-bottom.vue` marker with a sibling rule for see-through slides;
  - `inject(injectionSlidevContext)`;
  - the class `slidev-layout` for the page colour;
  - an SVG outside `public/` imported with `?raw`.
- **Constraints found:**
  - the extension `.ts` on the constants import;
  - the SVG cannot stay in `public/`;
  - `offline_check.py` mistakes the layer for the slide;
  - `artcheck.py` would reject a background rectangle in the page colour.

**Limitations:**
- one machine;
- no projector;
- Playwright's visible windows ran at `devicePixelRatio` 1, while Martin's
  browsers ran at 2;
- by-eye reports come from one observer, who knew which variant he was
  watching;
- CPU and GPU load were not measured directly;
- the versions of Martin's desktop browsers were not recorded;
- host scale 2 stands in for a 1920 × 1080 projector, but no projector was
  used.

## 8. Decisions and open questions

Decided or recommended, as recorded in PLAN.md:
- the persistent layer (option B);
- a JS camera, linear in scale and eased like CSS `ease-in-out`;
- the fade started from JS when the camera stops;
- stroke widths divided by the scale instead of `non-scaling-stroke`;
- one decimal;
- the SVG moved out of `public/`;
- the one-line fix to `offline_check.py` (approved).

With this, Chrome is smooth by eye and by measurement.

Open, for Martin (PLAN.md, question 4): Firefox. Options:
- present in Chrome;
- make the drawing cheaper to rasterize (untested; uncertain, since Firefox
  drops frames at host 2 even with the mechanism stopped);
- ease the mechanism to a stop for the zoom (smoothest in Firefox, but it
  gives up the motion through the zoom).

## 9. How to reproduce

In `spike/`, with `P=../../../../.venv/bin/python3`:

```bash
$P make_svgs.py                    # E2: SVGs into site/, raw output into out/
$P measure_static.py               # E3, E4
$P measure_zoom.py                 # E5, E6
$P repeat_sharpness.py             # E5 repeats
$P channel_sharpness.py            # E5 other Chromium builds
$P check_reference.py              # E5 control
$P measure_timing.py               # E7, E8
$P blink_check.py                  # E10
$P jank_check.py                   # E11
$P check_compensated.py            # E12
$P headed_check.py 1               # E13, round 1 (opens windows); also 2, 3, 4
# E9: in deck/, ../../../../node_modules/.bin/slidev slides.md --port 3131, then
$P deck_check.py http://localhost:3131
# to look by eye: in site/, python3 -m http.server 8000, then open zoom.html
```

The headless results depend on the headless renderers. The E13 results depend
on the screen. Martin's observations cannot be rerun by a script.

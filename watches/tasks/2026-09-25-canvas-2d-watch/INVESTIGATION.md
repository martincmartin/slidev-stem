# Drawing the skeleton watch with Canvas 2D: an investigation

Claude (Opus 5.5), overnight on 2026-09-25, working alone at Martin's request
([CONTEXT.md](CONTEXT.md)). C20–C22 were added on 2026-09-26, at Martin's
request. Plan: [PLAN.md](PLAN.md). Code and raw results:
[spike/](spike/). The SVG investigation that led here:
[../2026-09-25-zoom-to-hairspring/INVESTIGATION.md](../2026-09-25-zoom-to-hairspring/INVESTIGATION.md)
(experiments E1–E13).

## Abstract

The zoom from the cover to the hairspring stuttered in Firefox when the watch
was an animated SVG (E13). We wrote a small player that reads the same SVG,
draws it with Canvas 2D at each frame, and plays its SMIL animations itself.
We then measured it against the SVG in the same conditions.

We observed:
- the canvas draws the same picture as the SVG, to within anti-aliasing, at
  every time, camera position and pixel ratio we tried;
- in visible Firefox windows, 54 canvas zooms and slide changes (C2–C10) had
  2 gaps over 25 ms in all (33 ms each). The SVG had 4–18 per zoom;
- on a quiet laptop, the canvas deck ran 10 minutes in Firefox with no gap
  over 25 ms, and Chromium's heap stayed flat;
- in Martin's installed Firefox 156, full screen on this laptop, the SVG
  zoom had 12–14 gaps over 25 ms, and the canvas zoom 0. The canvas deck in
  Slidev also had 0;
- Chromium and Chrome were smooth with the canvas in every test;
- at 120 Hz and full screen, Firefox still misses some single frames with
  the canvas: 3–18 gaps per zoom, almost all of about 16.7 ms. Clip paths
  cause most of them;
- drawing each clipped wheel and then erasing its clip's hole gives the same
  picture here, and cuts that to 0–2 per zoom or slide change in the
  installed Firefox 156;
- Firefox 157 (C21) has fewer slow SVG frames than 156: 1–7 per zoom against
  9–17 (C6, C20, C22). That still fails the pass mark. The canvas has 0 in
  both;
- zooming the SVG with a CSS transform on the `<svg>` element (C22) gave as
  many slow frames in Firefox as the SVG's own camera. With
  `will-change: transform`, Chromium stretched a bitmap, which was blurry
  on screen during and after the zoom;
- on the real screen, Firefox draws the SVG slightly soft while the camera
  moves, with every camera tried. The canvas stays sharp (C22). Headless
  screenshots do not show this.

The canvas deck made no outside request.

Sections 2 to 4 give methods and results. Section 5 lists faults in our own
work. Interpretation starts in section 6.

## 1. The question

**Pass mark** (CONTEXT.md): in visible Firefox windows at host scales 1 and
2, the zoom drawn with Canvas 2D has about 0 slow frames (gaps over 25 ms),
measured like E13. The same must hold in Chromium. Martin looks by eye in his
desktop browsers.

**Before any speed test:** show that the canvas draws what the SVG draws.

**The zoom** is the one decided in the zoom task:
- one key press;
- the camera goes linear in scale from 1 to $s = 250/56 \approx 4.464$, eased
  like CSS `ease-in-out`, in 1.8 s;
- the translation grows with the scale, so one point stays still;
- the fade (0.8 s) starts when the camera stops;
- line widths stay constant on screen (each width is divided by the scale).

## 2. Materials

### 2.1 Hardware and software

| Item | Value |
| --- | --- |
| Computer | MacBook Pro, Apple M3 Pro, 36 GB, on mains power |
| OS | macOS 26.6.2 (Darwin 25.6.0) |
| Screen | built-in Retina, 3456 × 2234 px, `devicePixelRatio` 2, 1728 × 1117 CSS px. The idle frame gap was 8.33 ms, so the screen ran at 120 Hz. |
| Playwright (Python) | 1.63.0, with its Chromium 153.0.8010.12 and Firefox 155.0 |
| Installed browsers | Firefox 156.0.1 and Google Chrome 153.0.8010.53, the versions Martin uses. On 2026-09-26, also Firefox 157.0, installed by Martin as `FirefoxBeta.app` (C21, C22). |
| Slidev | 53.0.0 |
| Sleep and screen saver | `pmset displaysleep 0`. The screen saver was on for part of the evening; see F2. |

Martin's own Firefox and Chrome were running, with his windows, during all the
tests.

### 2.2 The drawing

`spike/site/watch-1dp.svg` is the zoom task's test SVG. The zoom task's
mirror of the generator makes it, and it is byte-identical to production
(`public/cover/skeleton-watch.svg`, checked again tonight). `make_svgs.py`
tags each top-level part (`data-part="hairspring"` or `"rest"`), wraps the
drawing in `<g class="camera">`, and adds a `<style>` with the camera numbers
of the hairspring view. The file is 45 KB. It draws 37 paths, 18 circles and
1 rounded rectangle, in 28 groups (29 with the camera group). It has 5 clip
paths, each with one path (4 in use), 11 `animateTransform` and 1
`animate`.

### 2.3 The player, `spike/site/watch_player.js`

- `readDrawing(svgText)` parses the SVG with `DOMParser` into fixed objects.
  The data model is in PLAN.md.
- The reader knows only the elements and attributes that the generator
  writes, and throws on anything else.
- Static paths go to the browser's own parser, `new Path2D(d)`.
- `draw(context, drawing, state, options)` draws one frame:
  - it clears the canvas and sets the device-pixel transform and the camera;
  - it walks the tree with `save`, `transform` or `rotate`, `clip`, `fill`,
    `stroke`, `restore`;
  - it computes each animated rotation and the hairspring's morph for the
    frame's time.
- Line widths are divided by the camera's scale. `miterLimit` is 4, SVG's
  default.
- A part's fade multiplies each shape's alpha. SVG instead fades each part
  as one layer (PLAN.md, "One known difference").
- The draw option `clips: "erase"` (added for C16) draws a clipped group
  with no clip, then erases its clip's hole.

### 2.4 The test page, `spike/site/zoom.html`

It is a copy of the zoom task's page with one new option, `renderer=canvas`.
The SVG renderer is unchanged, so E13's variants still run. In canvas mode:
- a single `requestAnimationFrame` loop moves the camera, then the fade, and
  draws;
- the backing store is the canvas's on-screen size times `devicePixelRatio`;
- `spike.drawTimes` records the JS time of each `draw` call.

Other options added tonight:
- `spike.jump(along)`: put the camera a fraction of the way along the zoom
  at once;
- `auto=N`: zoom in and out N times without help, and POST the frames to
  `/report`;
- `spike.fadeTo(opacity)`: set every part but the hairspring to an opacity
  at once (C14);
- `clips=erase`: the canvas's erase option (C16).

Added on 2026-09-26:
- `mode=js-css` (C22): the JS camera writes the CSS `transform` of the
  `<svg>` element itself, which has `will-change: transform`;
  `willchange=0` leaves that out.

### 2.5 The spike deck, `spike/deck/`

The same three slides as the zoom task's deck:
- slide 1: `watch: cover`;
- slide 2: `watch: hairspring`;
- slide 3: no watch.

Its `global-bottom.vue` holds one `<canvas>` and a `WatchStage`
(`site/watch_stage.js`). The stage changes views in three phases:
- the parts that the new view shows fade in;
- the camera moves;
- the parts that the view hides fade out.

A phase that has nothing to do is skipped. The mechanism's clock is the time
since the stage was made, so the stage stops drawing while the layer is
hidden. `site/watch_self_test.js` lets the deck measure itself (`?auto=N`),
for browsers that Playwright cannot drive. `?clips=erase` switches the
stage to the erase option (C17). The deck was served by
`slidev slides.md --port 3132`.

### 2.6 The harness

These are copied from the zoom task, and changed where noted:
- `spike_browser.py`: now takes a `device_scale_factor`;
- `spike_pixels.py`: unchanged;
- `headed_check.py`: adds the canvas, an idle check, Firefox preferences,
  native windows, and a wait for the window size to settle.

New tonight: `pixel_check.py`, `frame_gaps.py`, `real_browsers.py`,
`deck_check.py`, `deck_frames.py`, `deck_views.py`, `mid_zoom_sharpness.py`,
`long_run.py`, `fade_check.py` and `summarize.py`. All pass `ruff`, `mypy --strict` and
`pyright`.

Changed on 2026-09-26:
- `real_browsers.py`: Firefox 157, the CSS-camera pages, and each page's
  camera and stroke option in its own query;
- `mid_zoom_sharpness.py`: the CSS camera, the end of the zoom, and
  `fadelater=1` (F13);
- new: `screen_sharpness.py`, the same check read from screen captures.

## 3. Measures

- **Frame gap:** the time between two `requestAnimationFrame` callbacks.
  - At 120 Hz a normal gap is 8.3 ms.
  - A gap over **12.5 ms** misses at least one 120 Hz frame.
  - A gap over **25 ms** ("slow") misses a frame even at 60 Hz. This is the
    E13 measure, and the pass mark.
- **Draw time:** JS time inside `draw()`. Firefox reports `performance.now()`
  in whole milliseconds here, so its draw times are integers.
- **Pixel difference:** for two captures of the same still, the largest
  channel difference per pixel (0–255). We report:
  - its mean;
  - the fraction of pixels over 32;
  - its largest value;
  - **areas**: pixels over 64 whose 8 neighbours are also over 64. An
    anti-aliased edge differs along a thin line, so it gives no areas. A
    wrong or missing shape does.
- **Sharpness ratio** (E5): mean $|\nabla^2 I|$ / mean $|\nabla I|$ of a
  capture taken during the zoom, divided by the same for the same camera at
  rest. For the CSS camera (C22), the reference is the SVG's own camera at
  rest. In C22 the captures are also taken from the screen itself
  (`screencapture`), over the whole stage.
- **Line width** (E6, `crossings`): the total ink of a line along a ray.
- **Windows:**
  - "DPR 1" is a Playwright viewport with `devicePixelRatio` 1, as in E13.
  - "native" is a window with no emulation at the screen's
    `devicePixelRatio` 2: Firefox in kiosk mode (1728 × 1000 CSS px), and
    Chromium with `--window-size=1728,1117` (1728 × 997).
  - With `host=1.7`, the test page's stage is 1666 × 938 CSS px, or 3332 ×
    1877 device px. That is about Martin's full-screen Slidev on this laptop.

## 4. Experiments

The tools write to `out/`, which is not committed. `spike/keep_evidence.py`
copies every JSON result and log, and the images this file cites, to
`evidence/`; the paths below are there unless they say `out/`. The frame
counts of C2–C10, C16 and C17 come from `spike/summarize.py`, which reads the
JSON files in `evidence/`. C13's come from `evidence/long-run-*.json`.

### C1. Does the canvas draw what the SVG draws? (`pixel_check.py`)

**Method.**
- For each of 16 stills, the page was loaded once with `renderer=svg` and once
  with `renderer=canvas`. The mechanism was paused at time $t$, and the
  camera was set with `spike.jump`. Each `#stage` was captured.
- The times were 0, 0.25, 0.5, 1.3, 2.9, 17.25 and 61.3 s. Past 2 s the
  `accumulate="sum"` repeats matter. Past 60 s the seconds hand has looped
  once, and the gear train has repeated 30 times.
- The camera was at 0, 0.35 and 1 of the zoom.
- The view was either everything or the hairspring alone.
- The device pixel ratio was 1 or 2.
- The control was the SVG in Chromium against the SVG in Firefox.
- We looked at every difference image (`out/pixels/`), amplified 4 times:
  a few at full size, and all of them on contact sheets with the contrast
  raised 3 times more (`evidence/pixels/sheet-*.png`).

**Result.**

| Pair | Mean difference | Pixels over 32 | Largest | Areas |
| --- | --- | --- | --- | --- |
| Chromium, canvas against SVG | 0.025–0.210 | ≤ 0.07% | 64–188 | 0 in all 16 |
| Firefox, canvas against SVG | 0.002–0.078 | 0 | 2–34 | 0 in all 16 |
| Control: SVG, Chromium against Firefox | 0.027–0.302 | ≤ 0.18% | 61–188 | 0 in all 16 |

- The difference images show only faint outlines along edges, strongest on
  the large circles of the case.
- Stills at different times differ from each other as expected: the balance,
  the hairspring and the fork move. So the match is not the same frame
  captured twice.
- The first load of the player stopped with an exception: a bug in the
  player (F1), which the strict reader caught.

### C2. Frame gaps in DPR 1 windows (`headed_check.py svg-canvas`)

**Method.** This is E13's method and window (2000 × 1150 CSS px). For each
zoom:
- load the page;
- wait 1 s;
- press "zoom in";
- record each frame for 2 s.

The page was `mode=js&ease=linear&fadelater=1&stroke=compensated`, with or
without `renderer=canvas`, at host 1 and host 2. Each variant ran 3 zooms per
browser. The round was run twice: the first run before Martin reported the
screen saver (F2), and the rerun after it was disabled. The table shows the
rerun. The first run is in `evidence/superseded/`, and its numbers agree.

**Result** (per zoom):

| Browser, host | Renderer | Gaps > 25 ms | Gaps > 12.5 ms | Largest gap | Draw time (median) |
| --- | --- | --- | --- | --- | --- |
| Firefox, 1 | SVG | 4–8 | 19–21 | 41.8 ms | — |
| Firefox, 1 | canvas | **0** | 0–1 | 16.5 ms | 2 ms |
| Firefox, 2 | SVG | 16–18 | 41–43 | 83.3 ms | — |
| Firefox, 2 | canvas | **0** | 0 | 9.3 ms | 4 ms |
| Chromium, 1 | SVG | 0 | 0 | 9.4 ms | — |
| Chromium, 1 | canvas | 0 | 0 | 9.4 ms | 0.2 ms |
| Chromium, 2 | SVG | 0 | 1 | 17.2 ms | — |
| Chromium, 2 | canvas | 0 | 0 | 9.4 ms | 0.2 ms |

In the first run, the first canvas zoom in Firefox (the first after the
browser started) had one gap of 116.7 ms, at scale 1.24. No later zoom had
one.

### C3. Frame gaps full screen at DPR 2 (`headed_check.py native`)

**Method.** As C2, in native windows, with `host=1.7`. The first run measured
Firefox before kiosk mode had grown its window (F3). After a fix, the round
ran again. Then Martin reported the screen saver (F2), so, to be safe, it ran
a third time. The table shows the third run.

**Result** (per zoom):

| Browser | Renderer | Gaps > 25 ms | Gaps > 12.5 ms | Largest gap | Draw time (median) |
| --- | --- | --- | --- | --- | --- |
| Firefox | SVG | 11 | 24–27 | 66.7 ms | — |
| Firefox | canvas | **0–1** (1, 0, 1) | 11–16 | 33.8 ms | 7–8 ms |
| Chromium | SVG | 0 | 0 | 9.4 ms | — |
| Chromium | canvas | 0 | 0 | 9.4 ms | 0.1 ms |

- In the second run, Firefox's canvas had 0 gaps over 25 ms in 3 zooms (8–10
  over 12.5 ms), and Chromium's SVG had 1 gap of 16.7–17.6 ms at the end of
  each zoom.
- Firefox's draw time grew with pixels: 2 ms at host 1 and DPR 1, 4 ms at
  host 2 and DPR 1, and 6–8 ms at host 1.7 and DPR 2. Chromium's stayed at
  0.1–0.2 ms.

### C4. Firefox's canvas acceleration (`headed_check.py firefox-accelerated`, `firefox-unaccelerated`)

**Method.** Firefox's `about:support` would not load under Playwright: the
navigation timed out in both headless and headed modes. So we launched
Firefox with the preferences set at start:
- `gfx.canvas.accelerated` and `gfx.canvas.accelerated.force-enabled` both
  true;
- or `gfx.canvas.accelerated` false.

In each, the canvas page at `host=1.7` ran for 3 zooms, full screen.

**Result:**

| Preferences | Gaps > 25 ms | Gaps > 12.5 ms | Draw time (median) |
| --- | --- | --- | --- |
| acceleration forced on | 0 | 6–15 | 6–7 ms |
| acceleration off | 0 | 6–7 | 8 ms |
| default (C3) | 0–1 | 11–16 | 7–8 ms |

### C5. Where Firefox's time goes (`headed_check.py firefox-cost`)

**Method.** As C3, canvas only, with one part of the work removed at a time.

**Result** (per zoom):

| Variant | Gaps > 25 ms | Gaps > 12.5 ms | Largest | Draw time (median) |
| --- | --- | --- | --- | --- |
| `clips=off` | 0 | 0–1 | 16.7 ms | 6 ms |
| `smil=paused` (mechanism stopped) | 0 | 29–36 | 17.6 ms | 1 ms |
| `only=hairspring` | 0 | 0 | 9.4 ms | 0 ms |
| `host=1` (1960 × 1104 device px) | 0 | 0 | 9.3 ms | 3–4 ms |

- With the mechanism stopped, the draw time fell from about 7 ms to 1 ms.
  But more frames went over 12.5 ms (29–36, against 11–16). This happened
  in both the first run and the rerun.

### C6. The installed browsers, test page (`real_browsers.py svg canvas`)

**Method.**
- Playwright cannot drive the installed Firefox or Chrome. So each one was
  started full screen (`-kiosk` or `--kiosk`) with a new, empty profile in
  a temporary directory. The page ran `zoom.html?auto=3&host=1.7`: after
  2 s of idle frames, it zoomed in and out 3 times and recorded 2.6 s of
  frames each way.
- Firefox's profile had a `user.js` that turns off first-run pages.
- Martin's own profiles were not read or changed. His running browsers were
  not touched, because `-no-remote` and a separate `--user-data-dir` give a
  separate instance.

**Result** (per zoom, 3 zooms each way):

| Browser | Renderer | Direction | Gaps > 25 ms | Gaps > 12.5 ms | Largest gap |
| --- | --- | --- | --- | --- | --- |
| Firefox 156 | SVG | in | 12–14 | 28–32 | 58.3 ms |
| Firefox 156 | SVG | out | 12–13 | 29–35 | 66.7 ms |
| Firefox 156 | canvas | in | **0** | 4–7 | 16.9 ms |
| Firefox 156 | canvas | out | **0** | 3–6 | 17.4 ms |
| Chrome 153 | SVG | in | 0–2 | 0–3 | 151.0 ms |
| Chrome 153 | SVG | out | 0–2 | 0–2 | 133.4 ms |
| Chrome 153 | canvas | in | 0 | 0 | 10.5 ms |
| Chrome 153 | canvas | out | 0 | 0 | 10.4 ms |

- Each zoom (2.6 s) had 307–313 frames: 120 Hz.
- In Firefox with the canvas, the idle frames right after load had one gap of
  116.7 ms.

### C7. Limiting each clip to its group's box (`headed_check.py firefox-limits`)

**Idea (from C5):** each clip path is a ±400 px square with a hole. So a
browser that builds a clip mask may build one about the size of the canvas,
4 times per frame. If the player first clips each clipped group to a box
that holds all it draws, the mask shrinks and the picture stays the same.

**Method.**
- The player computed a conservative box for every shape at read time:
  - ends and control points of the path;
  - arcs: their end ± twice the radius;
  - margin: twice the stroke width;
  - for a rotating group: a circle around its origin.
- It clipped to that box before the clip path, behind a `limits` option.
- It ran the pixel check. Then it compared `limits=on` with `limits=off`
  directly, at two camera positions.
- It measured 3 zooms each: `limits=off`, `limits=on` and `clips=off`, in
  full-screen Firefox and Chromium.

**Result:**
- 4 clipped groups got a box. On against off: largest pixel difference 0 in
  both browsers. The C1 numbers were unchanged.
- Frame gaps per zoom, Firefox:

| Variant | Gaps > 25 ms | Gaps > 12.5 ms |
| --- | --- | --- |
| `limits=off` | 0 | 6–10 |
| `limits=on` | 0 | 9–12 |
| `clips=off` | 0 | 0–2 |

- Chromium: 0 and 0 in all three.
- Because the limits did not help, we removed them. The version with limits
  is kept as `evidence/superseded/watch_player-with-limits.js`.

### C8. The deck, headless (`deck_check.py`)

**Method.** Chromium and Firefox, in windows of 1280 × 720 and 1920 × 1080:
1. slide 1;
2. → slide 2, then wait 3.5 s;
3. → slide 3;
4. ← slide 2.

At each step we recorded the stage's view, whether its loop ran, its clock
start, the canvas's backing size, the layer's colour and visibility, and the
slide's own background. On slide 2 we measured the hairspring's width and the
ink outside the hairspring.

**Result**, in all four runs:
- **Views:** cover, hairspring, hairspring (hidden), hairspring.
- **Clock start:** one value per run, so the clock never restarted.
- **Backing store:** 1278 × 720 and 1917 × 1080, the slide's size in device
  px.
- **Hairspring width:**

| Browser, window | Measured | Expected ($2 \times$ slide scale) |
| --- | --- | --- |
| Chromium, 1280 | 2.62 px | 2.61 px |
| Chromium, 1920 | 3.93 px | 3.91 px |
| Firefox, 1280 | 2.62 px | 2.61 px |
| Firefox, 1920 | 3.93 px | 3.91 px |

- **Layer:** `#FAF7F0`. On slides 1 and 2 the slide's layout was
  transparent. On slide 3 the layer was hidden, the loop stopped, and the
  layout was opaque.
- **Page errors:** none, except Chromium's usual headless "Wake Lock
  permission request denied".
- **Screenshots** (`out/deck/`; two in `evidence/deck/`) show the cover watch under the cover text,
  and only the hairspring beside the slide 2 text.
- **Ink outside the hairspring** on slide 2 (the slide's right half, beyond
  200 slide px from the spring's centre): 0.0 in all four runs, after the fix
  of F4.
- The widths above are from the rerun after F4. The first run gave 2.60 and
  3.97 px (Chromium), and 2.64 and 3.92 px (Firefox).

### C9. The deck's frame gaps, full screen (`deck_frames.py`)

**Method.**
- Native windows, as in C3.
- The slide is 1728 × 975 CSS px, or 3456 × 1950 device px.
- Load slide 1, wait for the window to settle, and record 240 idle frames.
- Three times: press →, record 3 s; press ←, record 3 s.

This measures the whole page: Slidev's own slide transition (`fade-out`) and
the canvas.

**Result** (per slide change):

| Browser | Direction | Gaps > 25 ms | Gaps > 12.5 ms | Largest |
| --- | --- | --- | --- | --- |
| Firefox 155 | in | **0** | 7–8 | 17.8 ms |
| Firefox 155 | out | **0** | 16–18 | 17.9 ms |
| Chromium 153 | in | 0 | 0 | 10.4 ms |
| Chromium 153 | out | 0 | 0 | 10.4 ms |

### C10. The deck in the installed browsers (`real_browsers.py --deck … deck`)

**Method.** As C6, with the deck at `/1?auto=3`
(`site/watch_self_test.js`): 2 s of idle frames, then three times: next
slide, record 3 s, previous slide, record 3 s.

**Result** (per slide change):

| Browser | Direction | Gaps > 25 ms | Gaps > 12.5 ms | Largest |
| --- | --- | --- | --- | --- |
| Firefox 156 | in | **0** | 3–4 | 18.1 ms |
| Firefox 156 | out | **0** | 5–6 | 17.6 ms |
| Chrome 153 | in | 0 | 0 | 10.4 ms |
| Chrome 153 | out | 0 | 0 | 10.4 ms |

### C11. Slidev's other views (`deck_views.py`, and by hand)

**Method.** Headless screenshots, 1600 × 900, of `/presenter/1`,
`/presenter/2`, `/overview`, `/print`, `/print?print` and `/export`. We
counted the watch canvases in the print views. We compared `/print?print`
with the zoom task's SVG deck, which was still running on port 3131.

**Result:**
- **Presenter:** the current slide shows the watch in the right view. The
  "next" pane shows the slide without the watch.
- **Overview:** the watch slides show without the watch, on a white
  (transparent) background.
- **`/export`:** one watch canvas per page. Page 1 shows the cover view.
  Page 2 shows only the hairspring, at once. Page 3's layer is hidden.
- **`/print` and `/print?print`:** one layer and 3 `.slidev-page`
  elements; the page is 900 px high and shows slide 1. The SVG deck gives
  the same counts.
- **Page errors:** only the known "Wake Lock" message.

### C12. Sharpness during the zoom (`mid_zoom_sharpness.py`)

**Method.** E5's method, headless:
- a zoom of 400 s, moved to its middle with `spike.seek(0.5)`;
- a capture while it runs, of 300 × 300 px around the balance;
- the reference is the same camera at rest (`spike.jump`);
- the mechanism is paused or running.

**Result** (sharpness ratio):

| Browser | SVG, paused | SVG, running | Canvas, paused | Canvas, running |
| --- | --- | --- | --- | --- |
| Chromium | 0.911 | 0.833 | **0.999** | **0.998** |
| Firefox | 0.999 | 0.997 | 0.999 | 1.000 |

In the side-by-side images (`evidence/superseded/mid-zoom-c12/`), Chromium's
SVG captures are slightly soft at the edges, and its canvas captures are not.

**Correction (2026-09-26, F13).** This run left the fade's CSS transition
pending while the camera moved, unlike every frame test. That caused the
SVG's softness in Chromium. Without it, the SVG was as sharp as the canvas
(C22). The data above is in `evidence/superseded/mid-zoom-c12.json`;
`evidence/mid-zoom.json` and `evidence/mid-zoom/` now hold C22's run.

### C13. A talk's length (`long_run.py`)

**Method.**
- Native full-screen windows, the deck on slide 1 (the cover, the mechanism
  running).
- Every frame gap was recorded, in blocks of one minute, for 10 minutes. In
  Chromium, `performance.memory.usedJSHeapSize` was read at the end of each
  minute; Firefox does not report it.
- Then three slide changes each way, as in C9.
- **Run 1** (`--label first`): Firefox then Chromium. During Firefox's first
  7 minutes, we were working on the same laptop: writing files, running
  short scripts, and the editor showing large files.
- **Run 2** (`--label quiet-canvas`): Firefox only, with nothing else run on
  the laptop.
- **Control** (`--label quiet-svg`): Firefox, the zoom task's SVG deck on the
  cover, 5 minutes, with nothing else run.

**Result**, per minute of about 7200 frames:

| Run | Minutes | Gaps > 25 ms | Gaps > 12.5 ms | Largest |
| --- | --- | --- | --- | --- |
| Firefox, canvas, run 1 | 1–7 | 2–11 | 17–62 | 41.7 ms |
| Firefox, canvas, run 1 | 8–10 | 0 | 1 | 16.7 ms |
| Firefox, canvas, run 2 (quiet) | 1–10 | **0** | 0–3 | 18.0 ms |
| Firefox, SVG, control (quiet) | 1–5 | 0 | 1–4 | 18.1 ms |
| Chromium, canvas, run 1 | 1–10 | 0 | 0 | 10.5 ms |

- **Chromium's JS heap:** 28.6–29.2 MB, with no upward trend.
- **Slide changes after 10 minutes:**
  - Firefox: 0 gaps over 25 ms, in both runs. Gaps over 12.5 ms were 10–14
    on the way in and 18–21 on the way out.
  - Chromium: 0 and 0.

### C14. The fade: per shape against per part (`fade_check.py`)

**Method.**
- The mechanism was paused at 0.5 s, and the camera was at the cover (0) or
  at the balance (1).
- Every part but the hairspring was set to the same opacity in both
  renderers with a new page hook, `spike.fadeTo`.
  - In the SVG, this is each tagged element's CSS `opacity`, so each part
    is one layer.
  - In the canvas, it is each shape's alpha.
- The opacities were 1, 0.75, 0.5, 0.25 and 0. At 1 and 0 the two must match
  as in C1: these are the controls.
- The pixel difference was measured as in C1. The images are in
  `out/fade/`; `evidence/fade/` has opacity 0.5 at the balance.

**Result** (at the balance; at the cover the differences were smaller):

| Opacity | Chromium mean | Chromium over 32 | Firefox mean | Firefox over 32 | Areas |
| --- | --- | --- | --- | --- | --- |
| 1 (control) | 0.165 | 0.07% | 0.014 | 0 | 0 |
| 0.75 | 0.766 | 0.16% | 0.681 | 0.12% | 0 |
| 0.5 | 0.969 | 0.26% | 0.910 | 0.22% | 0 |
| 0.25 | 0.806 | 0.23% | 0.788 | 0.20% | 0 |
| 0 (control) | 0.053 | 0.03% | 0.005 | 0 | 0 |

At the cover, opacities 0.5 and 0.25 gave 1 area pixel in each browser.

In the images at opacity 0.5, the canvas shows some edges that the SVG hides
under a part:
- the balance rim's outline under its spokes;
- the two circles of a pinion's arbor;
- a pinion's fill over its wheel;
- the hands' outlines at the centre.

### C15. Offline (`stem/tools/offline_check.py`)

**Method.**
- `slidev build` of the spike deck, into a temporary directory.
- `offline_check.py <build> 1:0 2:0 3:0`: it loads the build with every
  outside request blocked, and lists them.

**Result:**
- Outside requests: **0**.
- The tool reported `slidev-layout watch-layer` as each slide's classes:
  the known mistake of taking the layer for the slide (zoom task, E9). The
  one-line fix is approved, but not made.

### C16. Erasing each clip's hole instead of clipping (`pixel_check.py --canvas "&clips=erase"`, `headed_check.py erase`, `erase-interleaved`, `real_browsers.py … canvas canvas-erase`)

**Idea (from C5 and C7):** clips cause most of Firefox's missed 120 Hz frames,
but not through the size of their mask. Each of the drawing's 4 clips hides a
wheel inside the disc of the wheel above it. So the player can:
1. draw the clipped group with no clip;
2. then fill the clip's hole with `globalCompositeOperation =
   "destination-out"`, which erases what is under the hole.

This gives the same picture only while nothing drawn before the group reaches
into the hole. From the wheels' positions and radii we expected that to be
true for all 4 clips. The pixel check tests it.

**Method.**
- The player reads each clip's hole: the part of its path after the first
  subpath, when that subpath is a rectangle and the rule is even-odd. With
  `clips=erase` it draws as above; a clip with no such hole is clipped as
  before.
- Pixel check: the 16 stills of C1, SVG against canvas with `clips=erase`.
- Firefox (Playwright) full screen, `host=1.7`: 3 zooms each of clip, erase
  and no clips (`erase`). Then 8 zooms each with the variants in turn (clip,
  erase, off, clip, …) so that drift cannot favour one (`erase-interleaved`).
  Chromium: 3 zooms each.
- The installed browsers, as in C6: the test page with clips and with erase,
  3 zooms each way, run twice, alternating (`--suffix=-c16a`, `-c16b`).

**Result.**
- **Pixel check:** 0 area pixels in all 32 pairs. Chromium mean 0.128–0.215
  (C1: 0.025–0.210); Firefox mean 0.002–0.080, largest 78 (C1: 0.002–0.078,
  largest 34). The first try failed (F9).
- **Playwright's Firefox, gaps over 12.5 ms per zoom** (none over 25 ms,
  except one of 25.0 ms with no clips):

| Round | clip | erase | no clips |
| --- | --- | --- | --- |
| `erase`, 3 zooms each | 9, 4, 5 | 0, 3, 6 | 0, 3, 2 |
| `erase-interleaved`, 8 each | 5–14, mean 8.75 | 0–6, mean 3.0 | 0–4, mean 1.5 |

- Firefox's JS draw time was 5–7 ms in all three. Chromium: 0 and 0 in all.
- **Installed Firefox 156, gaps over 12.5 ms per zoom** (6 per run: 3 in and
  3 out; none over 25 ms):

| Run | clip | erase |
| --- | --- | --- |
| a | 5, 4, 2, 2, 3, 3 | 1, 0, 0, 0, 0, 0 |
| b | 24, 3, 3, 5, 4, 5 | 0, 0, 0, 0, 0, 0 |

  With erase, the largest gap was 16.7 ms in run a and 10.3 ms in run b.
- **Installed Chrome 153:** 0 in all 24 zooms; the largest gap was 10.4 ms.

### C17. The deck with erase, in the installed browsers (`real_browsers.py --deck … deck deck-erase`)

**Method.** The deck's `global-bottom.vue` passes `?clips=erase` to the
stage's draw options (a spike-only switch). As C10: 3 slide changes each way,
run twice, alternating.

**Result**, gaps over 12.5 ms per slide change (none over 25 ms):

| Run | Firefox 156, clip | Firefox 156, erase | Chrome 153, either |
| --- | --- | --- | --- |
| a | 3, 8, 5, 7, 8, 7 | 0, 1, 0, 1, 1, 1 | 0 |
| b | 3, 7, 4, 8, 7, 6 | 0, 1, 0, 1, 0, 2 | 0 |

With erase, Firefox's missed frames were all on the way out (the fade in and
the move) except one, and the largest gap was 16.7 ms.

### C18. With the presenter view open (`presenter_check.py`)

**Method.**
- When Martin presents with Slidev's presenter view, two stages animate: the
  audience window's, and the presenter's current-slide pane.
- On one screen, two windows would overlap, and the browser would throttle
  the hidden one. So one visible full-screen window held two iframes side by
  side, each half the window:
  - the presenter view (`/presenter/1`) on the left;
  - the audience view (`/1`) on the right.
- The wrapper page was served as if from the deck's own origin (F11).
- The arrow keys went to the presenter view, and Slidev moved both views.
- Frames were recorded in both iframes for 3 s after each key, 3 changes
  each way.
- The control was the audience view alone, in the same half of the window.
  Then the pair again with `?clips=erase` in both.

**Result**, the audience view's gaps over 12.5 ms per slide change:

| Setup | Firefox 155 | Chromium 153 |
| --- | --- | --- |
| presenter and audience, clip | 8, 6, 6, 2, 4, 3 (one gap of 26.0 ms) | 0 × 6 |
| audience alone, clip | 0 × 6 | 0 × 6 |
| presenter and audience, erase | 1, 1, 3, 1, 0, 1 | 0 × 6 |

- The presenter view's gaps were the same as the audience view's (one
  window, one frame clock).
- Earlier runs of the clip pair in Firefox:
  - runs 1 and 2, before F11 was fixed, stopped at Chromium before they
    wrote a file, and each run's log replaced the one before. Their numbers
    come from the console output: 6, 4, 6, 4, 7, 8 per change, with 2 gaps
    over 25 ms (49.7 and 33.2 ms), and 5, 6, 5, 4, 6, 7, with none;
  - run 3, after the fix, without the erase setup:
    `evidence/superseded/presenter-clip-only/`. The pair: 6, 3, 6, 5, 5, 2;
    alone: 1, 1, 0, 0, 0, 0; no gap over 25 ms.

### C19. CPU on the cover (`cpu_check.py`)

**Method.**
- Visible full-screen windows at `devicePixelRatio` 2, 120 Hz, the cover
  view (no zoom), in Playwright's Firefox and Chromium.
- After the page had loaded and run for 5 s, the CPU time of every process
  in the browser's application bundle was read from `ps` at the start and
  end of about 30 s. The difference, divided by the wall time, is in cores
  (1.0 is one core busy).
- The last 240 frames of each period were checked for smoothness.
- Pages:
  - the canvas deck, with clip and with erase;
  - the zoom task's SVG deck, which still uses `non-scaling-stroke`;
  - the fair pair: the test page's best SVG version against its canvas, both
    at `host=1.7`.
- The decks were measured twice (the first run is in
  `evidence/superseded/cpu-decks-only/`).

**Result** (cores; the first run in brackets):

| Page | Firefox 155 | Chromium 153 |
| --- | --- | --- |
| canvas deck | 1.04 (1.05) | 0.42 (0.40) |
| canvas deck, erase | 1.04 (1.04) | 0.42 (0.42) |
| SVG deck (zoom task) | 1.29 (1.29) | 0.67 (0.64) |
| test page, SVG | 0.97 | 0.41 |
| test page, canvas | 0.77 | 0.53 |

In all periods, the last 240 frames had no gap over 25 ms and at most 1 over
12.5 ms.

### C20. Firefox 156's stroke-bounds regression (`real_browsers.py --firefox-pref …`), 2026-09-26

**Background.** Martin found
[bug 2073778](https://bugzilla.mozilla.org/show_bug.cgi?id=2073778): "Severe
SVG viewBox pan/zoom performance regression in Firefox 156". Bug 1914345
added `svg.Moz2D.strokeBounds.enabled` in 156; the extra reflow work can be
turned off with that pref, and 157 and 158 are fixed. Our SVG measurements
used Playwright's Firefox 155 (E13, C2, C3), which predates the pref, and the
installed Firefox 156.0.1 (C6).

**Method.**
- The installed Firefox 156.0.1, as in C6: the SVG test page
  (`renderer=svg`), full screen, 3 zooms each way.
- Four runs, alternating: the default, then
  `user_pref("svg.Moz2D.strokeBounds.enabled", false)` in the fresh
  profile's `user.js`, twice each.
- Two checks that the pref took effect: the name is in the browser's `XUL`
  library, and a profile started with that `user.js` wrote the value to its
  `prefs.js`.

**Result**, gaps over 25 ms per zoom (the largest gap in brackets):

| Pref | Run | Zoom in | Zoom out |
| --- | --- | --- | --- |
| default | a | 16, 17, 10 (83.7 ms) | 12, 12, 13 (157.9 ms) |
| default | b | 13, 12, 12 (58.4 ms) | 12, 13, 14 (75.1 ms) |
| false | a | 15, 14, 11 (59.1 ms) | 15, 13, 14 (75.0 ms) |
| false | b | 14, 15, 11 (66.4 ms) | 16, 13, 14 (116.5 ms) |

Both checks passed: the pref exists in 156.0.1 and was applied.

C21 tries Firefox 157.

### C21. Firefox 157 (`real_browsers.py --browsers firefox-beta`), 2026-09-26

**Background.** Bug 2073778 is fixed in Firefox 157 and 158 (C20). Martin
installed Firefox 157.0 as `FirefoxBeta.app`.

**Method.** As C6 and C16: a fresh profile, kiosk full screen, the test page,
3 zooms each way, for the SVG, the canvas, and the canvas with erase. The SVG
ran once more as C22's control.

**Result**, per zoom: gaps over 25 ms; gaps over 12.5 ms; the largest gap:

| Page | Zoom in | Zoom out |
| --- | --- | --- |
| SVG | 5, 1, 4; 34, 40, 27; 41.6 ms | 3, 2, 4; 35, 36, 26; 66.4 ms |
| SVG (C22's control) | 3, 1, 7; 37, 38, 30; 41.7 ms | 2, 1, 4; 33, 33, 27; 82.9 ms |
| canvas | 0, 0, 0; 5, 2, 2; 16.7 ms | 0, 0, 0; 7, 2, 8; 16.7 ms |
| canvas, erase | 0, 0, 0; 2, 0, 0; 16.7 ms | 0, 0, 0; 1, 2, 0; 16.7 ms |

The canvas run's idle check had one gap of 33.3 ms, before any zoom. For
comparison, the installed Firefox 156 had 12–14 slow SVG frames per zoom in
C6, and 9–15 in C22's control run.

### C22. The SVG zoomed with a CSS transform on the `<svg>` element (`real_browsers.py`, `mid_zoom_sharpness.py`, `screen_sharpness.py`), 2026-09-26

**Background.** Martin suggested a different camera for the SVG:
- put the `<svg>` in an HTML wrapper with `overflow: hidden`;
- zoom the `<svg>` element with a CSS transform,
  `translate(x px, y px) scale(zoom)`, with `transform-origin: 0 0` and
  `will-change: transform`.

The reasoning was that a change to the `viewBox` changes the SVG's
coordinate system and can force SVG layout and paint work. A transform on a
separately composited element can be done mostly by the compositor.

Two facts about our pages before this test:
- No page changes the `viewBox`. The SVG camera (`mode=js`) writes the
  `transform` attribute of a `<g>` inside the SVG.
- The zoom task tried a camera on an HTML wrapper (`mode=html`, a CSS
  transition on a `<div>`). It rejected that camera only because the lines
  grew: `non-scaling-stroke` does not undo an HTML ancestor's transform (E3,
  and I2 there). Dividing each stroke width by the scale came later (E12),
  and works under any camera. That camera's frame gaps were never measured.

**The page.** With `mode=js-css`, the JS camera writes
`svg.style.transform = translate(X px, Y px) scale(s)` at each frame. The
`viewBox` is `0 0 980 552` on a 980 × 552 px `<svg>`, so the numbers are
those of the SVG camera. The `<svg>` has `will-change: transform` unless
`willchange=0`. The stage already had `overflow: hidden`, and the `<svg>`
had `transform-origin: 0 0`.

**Variants:**
- `svg-css`: the CSS camera, with each stroke width divided by the scale;
- `svg-css-no-will-change`: the same, with no `will-change`;
- `svg-css-scaled`: with `will-change`, and the stroke widths not divided.
  The lines grow 4.46× during the zoom. This is the suggestion exactly. Only
  the mechanism changes the SVG's content;
- control: `svg`, the SVG camera, as in C6.

**Method, frames.** As C6: the installed Firefox 156.0.1, Firefox 157.0 and
Chrome 153, with fresh profiles, in kiosk mode, 3 zooms each way. One browser
at a time, and the four pages in turn.

**Method, sharpness.**
- **Headless** (`mid_zoom_sharpness.py`): C12's method, with `fadelater=1`
  (F13), at the middle of the zoom and at its end. At both, every part is
  set to full opacity first (`spike.fadeTo(1)`), because the canvas starts
  its fade when the camera stops. The CSS camera's reference is the SVG
  camera at rest, because a reference drawn by the same camera could be
  stretched too.
- **On the screen** (`screen_sharpness.py`): the same steps in visible,
  full-screen windows of Playwright's Chromium 153 and Firefox 155, at
  `devicePixelRatio` 2 and `host=1.7`. Each capture is of the whole screen
  (`screencapture`). The page gives the stage's position on the screen, and
  the ratio is over the whole stage (3316 × 1861 px). The script ran twice.

**Result, frames**, per zoom: gaps over 25 ms, and the largest gap:

| Browser, direction | SVG camera | CSS camera | CSS, no `will-change` | CSS, lines grow |
| --- | --- | --- | --- | --- |
| Firefox 156, in | 14, 15, 9 (58 ms) | 12, 14, 12 (58 ms) | 16, 15, 11 (60 ms) | 5, 3, 3 (75 ms) |
| Firefox 156, out | 14, 15, 14 (83 ms) | 15, 13, 16 (99 ms) | 16, 14, 14 (91 ms) | 2, 3, 3 (100 ms) |
| Firefox 157, in | 3, 1, 7 (42 ms) | 1, 4, 4 (42 ms) | 5, 3, 9 (42 ms) | 2, 2, 2 (50 ms) |
| Firefox 157, out | 2, 1, 4 (83 ms) | 1, 4, 4 (75 ms) | 1, 1, 1 (83 ms) | 1, 1, 1 (83 ms) |
| Chrome 153, in | 0, 0, 0 (25 ms) | 0, 0, 0 (17 ms) | 0, 0, 0 (17 ms) | 0, 0, 0 (10 ms) |
| Chrome 153, out | 0, 0, 0 (10 ms) | 0, 0, 0 (10 ms) | 0, 0, 0 (10 ms) | 0, 0, 0 (10 ms) |

Gaps over 12.5 ms per zoom in Firefox:
- 26–38 with every camera that keeps the line widths, in both versions;
- with the lines growing, 5–26 in Firefox 156 and 2–5 in Firefox 157.

Two idle checks had one gap over 25 ms, before any zoom: Chrome's CSS
camera (26.5 ms), and Firefox 157's CSS camera with no `will-change`
(46.2 ms).

**Result, sharpness**, the mechanism stopped (middle of the zoom / end):

| Camera | Chromium, headless | Chromium, screen | Firefox, headless | Firefox, screen |
| --- | --- | --- | --- | --- |
| SVG camera | 1.001 / 1.000 | 1.000 / 1.000 | 0.999 / 1.000 | **0.701** / 1.000 |
| canvas | 0.999 / 1.000 | 1.000 / 1.000 | 0.999 / 1.000 | 1.000 / 1.000 |
| CSS camera | **0.795 / 0.798** | **0.341 / 0.231** | 0.999 / 1.000 | **0.701** / 0.999 |
| CSS, no `will-change` | 1.003 / 1.001 | 1.000 / 1.000 | 0.999 / 1.000 | **0.701** / 0.999 |

- The second screen run gave the same ratios as the first, to within 0.004.
- With the mechanism running, the pattern was the same. But the capture then
  shows the mechanism at a different time from the stopped reference, so the
  ratio also measures a change of content. The canvas gave 1.00–1.03.
  - Chromium's CSS camera: 0.34 / 0.23 on the screen, and 0.75 / 0.80
    headless.
  - Firefox on the screen: 0.70 in the middle and 0.90 at the end, with every
    SVG camera. We cannot tell how much of the 0.90 is blur and how much is
    the change of content.
- Chromium's end capture was taken 0.5 s after the camera stopped.

**By eye** (`evidence/screen-sharpness/*-detail.png`: 600 × 600 screen px
at the stage's centre, the capture on the left and its reference on the
right):
- Chromium, CSS camera, at rest after the zoom: stretched pixels, with soft,
  stair-stepped edges. With no `will-change`, it is the same as the
  reference.
- Firefox, SVG camera, in the middle of the zoom: the edges are softer by
  about one screen pixel. It is clear at 3× enlargement, and hard to see at
  1×. The canvas is the same as its reference.
- `evidence/mid-zoom/chromium-svg-css-paused-end.png` shows the headless
  Chromium case.

## 5. Faults in our own work

| # | Fault | Effect | How found | Fix |
| --- | --- | --- | --- | --- |
| F1 | The player split `keyTimes` on spaces. It uses `;`. | The first load threw "keyTimes must run from 0 to 1". Nothing was drawn wrong, because the reader stops on anything it does not expect. | The exception. | Split on `;`, and check for NaN. |
| F2 | The laptop's screen saver was on for part of the evening. Martin reported it. `pmset` showed `displaysleep 0`, but the screen saver is a separate setting. | Unknown. Every idle check read 120 Hz, and every zoom had 2 s of frames at about 120 Hz, so the windows were probably not throttled. | Martin's message. | He turned it off (`idleTime` 0, no screen saver process). We ran every headed round again. The first runs are in `evidence/superseded/` and agree with the reruns. |
| F3 | The first native round started before Firefox's kiosk mode had grown the window. The window was 1280 × 891, not 1728 × 1000. The idle check had 10 slow frames, probably from the window's animation. | The stage was partly outside the window, and some frames were disturbed. | The window size in the report. | `settle()` waits until the size has not changed for 2 s. Every zoom records its window size. |
| F4 | `deck_check.py` counted ink outside the hairspring over the whole window, including Slidev's 1–3 px black letterbox. | 720 and 1080 units of "ink", exactly 1 per row. | The value equals the window height. | The measure now covers only the slide. In the rerun, the ink outside the hairspring was 0.0 in all four runs, and the widths were 2.62 / 3.93 px against 2.61 / 3.91 expected. The first run is in `evidence/superseded/deck-check-letterbox/`. |
| F5 | The fourth variant of the first `firefox-cost` round had `host` twice. `URLSearchParams.get` returns the first value. | That variant repeated host 1.7. | Reading the log. | The rerun used `host=1` alone. |
| F6 | Firefox's `about:support` cannot be loaded under Playwright. | We could not read which Canvas 2D back end Firefox uses. | Two timeouts. | C4 tests the preference instead; the question stays open (section 7). |
| F7 | The first `spike.fade` hook had the same name as the page's fade duration, `fade`. | The page's module did not load, so `spike` was undefined. | The error. | Renamed to `fadeTo`. |
| F8 | In C13's run 1, we used the laptop while Firefox was measured. | Minutes 1–7 had slow frames that a quiet rerun did not have. | Comparing the two runs. | Run 2 on a quiet laptop. We report both runs. |
| F9 | The first erase (C16) filled the hole with whatever fill style was current. Each child group's `restore()` had put back the style of before the group: the case's `rgba(…, 0.18)`. `destination-out` removes only as much as the fill covers. | Only 18% of each wheel under a hole was erased: 100–4000 area pixels per still, faint teeth under the wheels above. | The pixel check, then the images. | Set an opaque fill style before the erase. |
| F10 | `WatchStage.stop()` only cleared a flag. A `start()` before the pending frame fired (within about 8 ms) would have left two draw loops running. | None measured: no run changed slides that fast (the layer stops 400 ms after a slide without the watch). | Reading the code. | `stop()` cancels the pending frame; `running` is now whether a frame is pending. C1 and C8 were rerun after this fix and the renames of short names: C1's numbers were identical, and C8 gave the same views, clock, ink and loop states, with widths of 2.55–3.91 px (the width depends on where the coil crosses the ray at that moment). |
| F11 | The first presenter check (C18) put the two Slidev iframes in an `about:blank` page. Headed Chromium denies `localStorage` to such third-party iframes, and Slidev did not start. | Chromium's stage never ran; the script timed out. Firefox and headless Chromium allowed it. | A page error: "Failed to read the 'localStorage' property". | Serve the wrapper page as if from the deck's own origin (`page.route`). |
| F12 | In the first screen-capture run (C22), a macOS permission dialog covered the middle of every capture. Chromium's window was also behind VS Code's. The stage was found by its colour, which also matched Firefox's toolbar. | Every Chromium ratio was 1.000, because both captures showed VS Code. Firefox's ratios included the dialog and the toolbar. | Exact 1.000 values in a case that headless called blurry; then the images. | Martin allowed the permission. The script brings the browser to the front (`open -a`), and the page gives the stage's position. The spoiled run is in `evidence/superseded/screen-sharpness-dialog/`. |
| F13 | C12 ran without `fadelater=1`, unlike every frame test. The SVG page then leaves the fade's CSS transition pending while the camera moves. | Chromium drew the SVG soft (0.911 / 0.833). I4 and the README said that the canvas was sharper than the SVG during the zoom. | C22's rerun set each part's opacity with no transition (`spike.fadeTo(1)`), which removes the pending transition. The SVG then measured 1.002 / 0.999 (console output, not kept). | `mid_zoom_sharpness.py` uses `fadelater=1`. With it, the SVG is as sharp as the canvas, headless, in both browsers (C22). C12's first run is in `evidence/superseded/mid-zoom-c12.json` and `…/mid-zoom-c12/`. |
| F14 | The test page scales the stage with a CSS transform (`host`), which takes no room in the layout. For any `host` above 1, the scaled stage covered the "Zoom in" button. The README's by-eye steps were wrong, including "use `host=1.2` so that the button shows". | Martin could not find the button (2026-09-26). No measurement was affected: every test zooms by script, and the stage did not move. | Martin's report. | The page gives the host a bottom margin equal to what the scale adds. Checked in Chromium and Firefox at `host` 1, 1.2 and 1.7: the button is the top element at its place, and a click zooms. |

## 6. Interpretation

**I1. The port is faithful (C1, C7, C8, C16).**
- The canvas differs from the SVG less than the two browsers' SVG renderers
  differ from each other.
- No still had an area difference.
- The morph, the stepped and accumulating keyframes, the 60 s loop, the
  clips, the camera, the compensated line widths and the device pixel ratio
  all check out.
- One difference is on purpose: the fade is per shape, not per part
  (PLAN.md). C14 measures it (I7); only Martin's eyes can judge it.

**I2. Canvas 2D removes Firefox's stalls (C2, C3, C6, C9, C10).**
- Across C2–C10, the canvas had 2 slow frames in 54 Firefox zooms and slide
  changes (32.9 and 33.8 ms, both in C3's third run). C13, C16 and C17 added
  more with no slow frame, except one gap of 25.0 ms with no clips (C16). The
  superseded first run of C2 had one more: 116.7 ms in the first zoom after
  the browser started.
- The SVG had 4–18 per zoom in Playwright's Firefox, and 12–14 in the
  installed Firefox 156.
- The pass mark is met, in Playwright's Firefox and in Martin's own Firefox
  build.

The SVG's stall grew with pixels and needed a running animation (E13). The
canvas does not stall, because each frame is one explicit draw at the
frame's own scale. There is no cached raster for the browser to throw away.

**I3. What still costs Firefox time at 120 Hz (C3, C4, C5, C7).**
Full screen at DPR 2, Firefox's canvas misses some single 120 Hz frames:
- 11–16 per zoom in Playwright's Firefox;
- 3–7 per zoom in the installed Firefox 156;
- in the deck: 7–18 in Playwright's Firefox, 3–6 in Firefox 156.

Each such gap is about 16.7 ms: one missed frame. The only longer ones were
the two 33 ms gaps in C3.
- **The clips cause most of them.** Without clips, 0–2 per zoom.
- **Mask size is not the cause.** Limiting the clip's area (C7) did not
  help.
- **The JS draw time (6–8 ms) is not the whole cost.** With the mechanism
  stopped, it fell to 1 ms, but more frames were missed (C5).
- So part of the work happens outside our JS, probably where Firefox
  rasterizes the canvas.
- Forcing canvas acceleration on or off made no clear difference (C4). So we
  do not know which back end Playwright's Firefox used. The installed
  Firefox 156, with default preferences, did a little better.

These are inferences. We did not profile inside Firefox.

At 60 Hz, a projector's usual rate, a frame lasts 16.7 ms. None of these
gaps would miss a frame at 60 Hz. On the laptop's own 120 Hz screen, some
frames show for 16.7 ms instead of 8.3 ms. Whether anyone can see that is for
Martin's eyes.

**I3b. Erasing instead of clipping (C16, C17).**
- For this drawing, erasing each clip's hole draws the same picture as the
  clip (0 area pixels).
- It removes most of what clipping costs Firefox:
  - Playwright's Firefox: 3.0 missed 120 Hz frames per zoom on average,
    against 8.75 with clips and 1.5 with none;
  - the installed Firefox 156: 0–1 per zoom on the test page, and 0–2 per
    slide change in the deck, against 2–24 and 3–8 with clips.
- The JS draw time did not change. So the saving, like the clip's cost, is
  outside our JS.
- **The condition:** nothing drawn before a clipped group may reach into its
  hole. The pixel check found that true for this drawing. A change to the
  art could break it without warning, so a check would have to guard it:
  either the generator asserts it from the geometry, or the pixel check
  runs as a project check.

**I4. Chromium and Chrome (C2, C3, C6, C9, C10, C12, C22).**
- The canvas had no missed frame at all.
- It is as sharp during the zoom as at rest, headless and on the screen.
  So is the SVG, when no fade transition is pending (F13). C12's first run
  had found the SVG soft (0.83–0.91). The zoom task's E5 found the same
  softness, also with a transition pending, so it probably had the same
  cause. That is an inference; we did not rerun E5.
- The SVG's occasional long gaps in Chrome (83–151 ms) did not happen with
  the canvas. In C6 they fell where the fade and the camera move meet: just
  after the camera stopped on the way in (as in E13), and just as it started
  on the way out.
- Chrome's JS draw time was 0.1–0.2 ms per frame.

**I5. Slidev integration (C8–C11).**
- The persistent layer design (option B) carries over unchanged:
  - one stage for the whole talk;
  - the clock is never reset;
  - the view comes from the slide's frontmatter;
  - the layer hides on slides without a watch.
- The canvas also allows two things the SVG did not:
  - the stage stops drawing while it is hidden, and the clock is still right
    when it comes back;
  - export (`/export`) gets each page's view at once, with no transition to
    wait for.
- The presenter's "next" pane and the overview still show no watch. That is
  the same as with the SVG, and still needs the stills planned in the zoom
  task. With the canvas, a still is a one-off `draw()` at a given time and
  view. It needs no second copy of the drawing.

**I6. A talk's length (C13).**
- On a quiet laptop, the canvas ran 10 minutes in Firefox with no slow frame.
  The zooms at the end were as smooth as the first ones (0 slow).
- Chromium ran 10 minutes with no missed frame and a flat heap. So the
  per-frame `Path2D` and `Map` do not cause garbage-collection pauses, or a
  memory leak, at this scale.
- In run 1, Firefox had slow frames in its first 7 minutes while we were
  using the laptop, and none in its last 3 minutes. The quiet run had none.
  So we think other work on the laptop, probably its GPU, caused them. That
  is an inference: we did not record what ran when.
- **A practical point:** present with other applications closed. It is
  probably good advice for the SVG too.

**I7. The fade (C14).**
- The per-shape fade differs from the SVG's per-part fade by about 1 level
  in 255 on average at mid-fade, and in 0.2–0.26% of pixels by more than 32.
- The difference is structural, not noise: while half faded, the canvas
  shows edges that each part hides under itself.
- It lasts 0.8 s. Whether it matters is for Martin's eyes. If it does,
  drawing each run of fading parts into an off-screen layer during the fade
  would match the SVG. That is not tested.

**I7b. Presenter mode (C18).** A second animating stage costs Firefox a few
more missed 120 Hz frames per change (2–8 with clips, 0–3 with erase), and
Chromium nothing. With erase, Firefox stays close to the single-view numbers.

**I7c. CPU (C19).** On the cover, the canvas costs about as much CPU as
the SVG: 0.2 core less in Firefox, and 0.1 core more in Chromium, on the
test page. The canvas deck and the canvas test page differ by 0.27 core in
Firefox and −0.11 in Chromium; we did not look into why (the deck's canvas is
also 8% larger). GPU time was not measured.

**I7d. The 156 regression (C20).** Turning the regressed code off made no
measurable difference to our SVG zoom, and Firefox 155, which predates it,
stalled about as much (C3: 11–12 per zoom, against 12–14 here). So that bug
is not what makes our SVG stall; the per-frame drawing of the animated SVG
(E13, I5 of the zoom task) remains the likely cause. The bug is about
stroke-bounds reflow during viewBox pan and zoom; our zoom moves a group's
transform while SMIL animates, which may take a different path. C21 then
tried Firefox 157 (I9). The canvas does not use SVG stroke bounds, so its
results are not affected either way.

**I8. Offline (C15).** The canvas adds no outside request. The player and
the stage are plain local modules.

**I9. Firefox 157 (C21).**
- With the SVG, Firefox 157 does better than 156: 1–7 slow frames per zoom
  against 9–17. It still fails the pass mark. The largest gaps were 42–83 ms,
  and it missed 26–40 frames per zoom at 120 Hz.
- In 156, the pref alone made no difference (C20). So the gain in 157 comes
  from other changes, or from more than that pref. We do not know which.
- The canvas: 0 slow frames in 157, as in 156. With erase, 0–2 missed 120 Hz
  frames per zoom, as in 156.

**I10. The CSS-transform camera (C22).**
- **In Firefox, it costs as much as the SVG camera.** With the line widths
  kept, it had 11–16 slow frames per zoom in 156 (the SVG camera 9–15), and
  1–9 in 157 (the SVG camera 1–7). `will-change` made no difference.
- **The compositor cannot take this work,** because the SVG's content
  changes at every frame: the mechanism runs, and each stroke width is
  divided by the scale. So the browser paints the SVG at every frame,
  whatever moves it, and the layer's transform is only the last step. This
  is an inference from the numbers. We did not profile inside Firefox.
- **With the lines growing** (the suggestion exactly), only the mechanism
  changes the content. Firefox missed fewer frames, but still had 1–5 slow
  frames per zoom, with gaps up to 100 ms. And the lines then grow 4.46×,
  which the zoom must not do.
- **In Chromium, `will-change` stretches a bitmap.** Chromium drew the
  `<svg>` at the scale it had before the zoom, and stretched it: on the
  screen, 0.34 during the zoom and 0.23 after it. The hairspring view was
  still blurry 0.5 s after the camera stopped. We did not wait longer.
  - Without `will-change`, Chromium was sharp and smooth. But Chrome was
    already smooth with the SVG camera.
- So the CSS camera fixes nothing that the SVG camera does not already do.
  With `will-change`, it makes Chrome's picture worse. The canvas stays the
  recommendation.

**I11. Firefox blurs the moving SVG on the screen (C22).**
- On the screen, Firefox drew the SVG about one screen pixel soft while the
  camera moved (0.70), with every SVG camera. It was sharp again once the
  camera stopped. The canvas stayed sharp throughout.
- Headless screenshots did not show this (0.999). So they do not tell what
  Firefox shows on the screen. That applies to C12 and to the zoom task's E5.
- We do not know the cause. Perhaps Firefox draws a moving SVG from a raster
  at a lower resolution, but we did not look inside Firefox.
- It is one more point for the canvas. Whether the SVG's softness can be
  seen in a 1.8 s zoom is for Martin's eyes; it is hard to see at 1×.

## 7. Limitations

- **One machine, no projector.** Host 2 at DPR 1 stands in for a 1920 × 1080
  projector.
- **Fresh profiles.** The installed browsers ran with empty profiles, not
  Martin's. His extensions, settings and open tabs could change the numbers.
  In the zoom task, his Firefox's GPU process was once at 300% CPU.
- **Martin's own browsers were running** in the background during every
  measurement.
- **The Canvas 2D back end is unknown.** We could not read which one Firefox
  used (F6).
- **Not measured:** GPU load and power. CPU was measured once or twice per
  page, for 30 s (C19).
- **Not judged by eye:** the look of the fade. C14 measures the
  per-shape alpha difference, but not how it looks in motion.
- **Presenter mode, measured in one window only** (C18). A real setup has
  two windows on two screens, the projector's often at 60 Hz. Two iframes
  in one window share one frame clock, which a two-screen setup does not.
- **Playwright's Firefox is 155; Martin's is 156.** The installed Firefox 156
  did a little better than Playwright's 155 in every comparable test.
- **The erase option depends on the drawing** (I3b). It is checked for
  today's SVG only.
- **The screen captures (C22) used Playwright's Chromium 153 and Firefox
  155,** because the script drives the page. The installed browsers were
  measured for frames only.
- **Firefox 157 ran on the test page only,** not in the deck.
- **No eyes yet.** Nobody has looked at the canvas zoom in motion. The by-eye
  check is in [README.md](README.md).

## 8. Conclusions and recommendation

See [README.md](README.md): the short version, the URLs to look at, and what
we recommend next.

## 9. How to reproduce

```bash
cd spike
../../../../.venv/bin/python3 pixel_check.py                     # C1
../../../../.venv/bin/python3 headed_check.py svg-canvas          # C2 (visible windows)
../../../../.venv/bin/python3 headed_check.py native              # C3
../../../../.venv/bin/python3 headed_check.py firefox-accelerated # C4, and firefox-unaccelerated
../../../../.venv/bin/python3 headed_check.py firefox-cost        # C5
../../../../.venv/bin/python3 real_browsers.py svg canvas         # C6 (installed browsers)
# C7 needs ../evidence/superseded/watch_player-with-limits.js as site/watch_player.js
# and the page's `limits` option; see headed_check.py
(cd deck && ../../../../node_modules/.bin/slidev slides.md --port 3132)   # then:
../../../../.venv/bin/python3 deck_check.py http://localhost:3132         # C8
../../../../.venv/bin/python3 deck_frames.py http://localhost:3132        # C9
../../../../.venv/bin/python3 real_browsers.py --deck http://localhost:3132 deck   # C10
../../../../.venv/bin/python3 deck_views.py http://localhost:3132         # C11
../../../../.venv/bin/python3 mid_zoom_sharpness.py                       # C12 (now with fadelater=1: F13)
../../../../.venv/bin/python3 long_run.py http://localhost:3132 --label quiet-canvas   # C13
../../../../.venv/bin/python3 fade_check.py                               # C14
../../../../.venv/bin/python3 pixel_check.py --canvas "&clips=erase" --label erase   # C16
../../../../.venv/bin/python3 headed_check.py erase-interleaved           # C16
../../../../.venv/bin/python3 real_browsers.py --suffix=-c16a canvas canvas-erase    # C16
../../../../.venv/bin/python3 real_browsers.py --deck http://localhost:3132 --suffix=-c17a deck deck-erase  # C17
../../../../.venv/bin/python3 presenter_check.py http://localhost:3132    # C18
../../../../.venv/bin/python3 cpu_check.py http://localhost:3132 http://localhost:3131 http://127.0.0.1:8001  # C19
../../../../.venv/bin/python3 real_browsers.py --browsers firefox --suffix=-c20a-off \
    --firefox-pref svg.Moz2D.strokeBounds.enabled=false svg                 # C20
../../../../.venv/bin/python3 real_browsers.py svg canvas canvas-erase \
    --suffix=-c21 --browsers firefox-beta                                    # C21
../../../../.venv/bin/python3 real_browsers.py svg svg-css svg-css-no-will-change \
    svg-css-scaled --suffix=-c22 --browsers firefox firefox-beta chrome     # C22
../../../../.venv/bin/python3 mid_zoom_sharpness.py                       # C22 (and C12's variants)
../../../../.venv/bin/python3 screen_sharpness.py    # C22: needs Screen Recording; do not touch the laptop
(cd deck && ../../../../node_modules/.bin/slidev build --out /tmp/deck-build)
(cd ../../../.. && .venv/bin/python3 tools/offline_check.py /tmp/deck-build 1:0 2:0 3:0)  # C15
../../../../.venv/bin/python3 keep_evidence.py                            # out/ -> evidence/
../../../../.venv/bin/python3 summarize.py                                # the tables
```

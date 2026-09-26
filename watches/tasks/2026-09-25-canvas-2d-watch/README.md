# Canvas 2D for the skeleton watch: results and recommendation

Written overnight on 2026-09-25 for Martin's morning review. C20–C22 were
added on 2026-09-26. Details:
[INVESTIGATION.md](INVESTIGATION.md) (methods, results, faults,
interpretation). Plan and data model: [PLAN.md](PLAN.md). Code and raw data:
[spike/](spike/).

## The result

**Canvas 2D passes.** It removes Firefox's stutter, and Chrome stays
perfect. The picture is the same as the SVG's.

Full screen on this laptop (`devicePixelRatio` 2, 120 Hz), in **your
installed browsers** (fresh profiles), 3 zooms each way:

| Browser | Drawing | Gaps over 25 ms per zoom | Largest gap |
| --- | --- | --- | --- |
| Firefox 156 | SVG (the best SVG page of the zoom task) | 12–14 | 58–67 ms |
| Firefox 156 | **canvas** | **0** | 17 ms |
| Firefox 156 | **canvas, in the Slidev deck** | **0** | 18 ms |
| Firefox 156 | **canvas, erase instead of clip** (see below), page and deck | **0** | 10–17 ms |
| Firefox 157 | SVG | 1–7 | 42–83 ms |
| Firefox 157 | **canvas, with clip or erase** (test page) | **0** | 17 ms |
| Chrome 153 | SVG | 0–2 | 133–151 ms (where the fade and the camera move meet) |
| Chrome 153 | **canvas, page and deck** | **0** | 10 ms |

Also:
- **Pixels:** the canvas matches the SVG to within anti-aliasing at 16
  stills. The stills cover times up to 61 s, three camera positions, and
  pixel ratios 1 and 2. The canvas differs from the SVG less than Chrome's
  SVG differs from Firefox's (C1).
- **Sharpness:** the canvas is as sharp during the zoom as at rest, in both
  browsers and on the real screen (C12, C22).
  - On the screen, Firefox draws the SVG about one screen pixel soft while
    the camera moves, with any camera. It is hard to see at 1× (C22).
  - Correction: C12 first found Chromium's SVG soft during the zoom. That
    came from a fade transition that the test left pending (F13). Without
    it, Chromium's SVG is sharp too.
- **Slidev:** the persistent-layer design (option B) works unchanged with a
  canvas. The clock never restarts. The layer hides and stops drawing on
  slides without the watch. Export draws each page's view at once (C8–C11).
- **A talk's length:** on a quiet laptop, the canvas deck ran 10 minutes in
  Firefox with no slow frame. The zooms after that were as smooth as the
  first. Chromium's memory stayed flat (C13).
  - In an earlier run, while I was using the laptop, Firefox dropped a few
    frames in the first 7 minutes. So **close other applications when you
    present.**
- **Offline:** the built deck made no outside request (C15).
- **Firefox 156's SVG regression** (bug 2073778, found by Martin): turning
  it off (`svg.Moz2D.strokeBounds.enabled` = false) did not change our SVG
  zoom: 10–17 slow frames per zoom either way (C20). Firefox 155, from before
  the regression, stalled about as much.
  - **Firefox 157**, with the fix, does better with the SVG: 1–7 slow frames
    per zoom, with gaps up to 83 ms (C21). That still fails the pass mark.
  - The canvas has 0 in both, and erase misses 0–2 frames per zoom at
    120 Hz in both.
- **Your CSS-transform camera** (the `<svg>` in a wrapper, moved by
  `transform: translate() scale()` with `will-change: transform`, C22):
  - Our pages never changed the `viewBox`. The SVG camera writes a `<g>`'s
    `transform` attribute.
  - **Firefox:** as many slow frames as the SVG camera: 11–16 per zoom in
    156 and 1–9 in 157, against 9–15 and 1–7. The compositor cannot take
    the work, because the SVG's content changes at every frame (the
    mechanism, and the divided line widths). So Firefox paints it at every
    frame, whatever moves it.
  - With the lines left to grow (your CSS exactly), Firefox still had 1–5
    slow frames per zoom, with gaps up to 100 ms, and the lines grow 4.46×.
  - **Chrome:** smooth either way. But `will-change` makes it stretch a
    bitmap, which is clearly blurry in the hairspring view, during and after
    the zoom. See `evidence/screen-sharpness/chromium-svg-css-paused-end-detail.png`.
- **CPU:** on the cover, the canvas costs about the same CPU as the SVG: 0.2
  core less in Firefox, 0.1 core more in Chromium (C19). GPU not measured.
- **The fade:** the canvas fades each shape, and the SVG fades each part as
  a layer. At mid-fade they differ by about 1 level in 255 on average. But
  the canvas briefly shows edges that a part hides under itself, for example
  the balance rim under its spokes (C14, images in `evidence/fade/`).
- **What is left in Firefox, and a fix:**
  - At 120 Hz full screen, Firefox with clips still shows some single
    frames for 16.7 ms instead of 8.3 ms: 2–8 per zoom or slide change in
    your Firefox 156 (once 24).
    On a 60 Hz projector that would miss nothing.
  - The clip paths cause most of it (C5). Making the clip area smaller did
    not help (C7).
  - What helped (C16, C17): draw each clipped wheel, then **erase** its
    clip's hole (`destination-out`). For this drawing the picture is the
    same (pixel check: 0 differences in shape).
  - In your Firefox 156 that gives **0–1 missed frames per zoom** on the
    test page, and **0–2 per slide change** in the deck.
  - It holds only while nothing drawn before a clipped wheel reaches into
    its hole, so it needs a guard (see the recommendation).
- **With the presenter view open** (two stages animating, C18): Firefox
  missed 2–8 frames per change with clips and 0–3 with erase, with no gap over
  25 ms. Chromium missed none. Measured in one window with two iframes side
  by side, not with two screens.

## Please look (your desktop browsers)

The servers were left running. If they have stopped, see "Servers" below.

1. **The test page, canvas.** Use full screen (Firefox and Chrome: ⌃⌘F),
   then press "Zoom in" and "Zoom out" (under the drawing):
   <http://localhost:8001/zoom.html?renderer=canvas&mode=js&ease=linear&fadelater=1&stroke=compensated&host=1.7>
   In a smaller window, scroll down to the button, or use a smaller `host`.
   (Until 2026-09-26 the drawing covered the button whenever `host` was
   above 1: F14.)
2. **The same page with the SVG,** for comparison (the zoom task's best
   SVG version):
   <http://localhost:8001/zoom.html?renderer=svg&mode=js&ease=linear&fadelater=1&stroke=compensated&host=1.7>
3. **The spike deck, canvas:** <http://localhost:3132/1>. Press → and ←.
   For full screen, press `f` in Slidev.
4. **The same two with erase** (the smoothest in Firefox):
   <http://localhost:8001/zoom.html?renderer=canvas&clips=erase&mode=js&ease=linear&fadelater=1&stroke=compensated&host=1.7>
   and <http://localhost:3132/1?clips=erase> (the deck reads the option once,
   when it loads; reload after you change it).
5. **The presenter view:** <http://localhost:3132/presenter/>. The current
   slide has the watch. The "next" pane has no watch; that is known, and it
   needs the stills planned in the zoom task.
6. **Your CSS-transform camera** (C22), best in Chrome. Zoom in, then look
   at the hairspring view:
   <http://localhost:8001/zoom.html?renderer=svg&mode=js-css&ease=linear&fadelater=1&stroke=compensated&host=1.7>
   Add `&willchange=0` to compare without `will-change`.

Check each in **Firefox and in Chrome**. Look for these:
- any freeze, jump or stutter in the zoom in and in the zoom out;
- any part blinking in or out;
- the mechanism keeps moving through the zoom, and never jumps back;
- line widths stay the same during the zoom;
- **the fade.** The canvas fades each shape, not each part as a layer. In
  the middle of the fade, some hidden edges show for a moment: the balance
  rim under its spokes, a pinion's arbor circles. See whether you notice it
  in motion. `evidence/fade/chromium-at1-opacity0.5.png` shows a still,
  with the SVG on the left and the canvas on the right.
- in Firefox, full screen on the laptop: do you see a difference between
  clip and erase (items 1 and 4)?

## Recommendation

1. **Adopt Canvas 2D (option O2) for the live watch.** Keep the generated
   SVG as the single source: the art checks check it, and the player reads
   it (PLAN.md, choice (a)).
2. **Rewrite steps 2–5 of the zoom task's PLAN.md around the canvas.** Its
   data model and option B stay. What changes:
   - The generator writes each view's camera and kept parts as data (for
     example a small JSON file, or attributes on the SVG), not as CSS. The
     spike parses the CSS; see `viewsFrom` in `spike/site/watch_stage.js`.
   - `watch_player.js` and `watch_stage.js` move into the talk (for example
     `watches/watch/`). The deck's `global-bottom.vue` is the spike's.
   - The stills for the overview and the presenter's "next" pane become a
     one-off `draw()` of the slide's view, in `slide-bottom.vue`.
   - The fade: keep the per-shape alpha if you do not notice it. Otherwise,
     during the 0.8 s fade, draw each run of fading parts to an off-screen
     layer. Here that is two runs: the parts drawn before the hairspring,
     and those drawn after it. Two layers are not exactly the SVG either
     (parts in one run hide each other), and this is not tested.
3. **Draw the clips as erased holes** (`clips: "erase"`), with a guard for
   its one condition: nothing drawn before a clipped wheel may reach into
   its hole. Either the generator asserts that from the geometry it already
   knows, or the canvas-against-SVG pixel check (`spike/pixel_check.py`)
   becomes a project check, run when the art changes. I recommend both: the
   assertion is cheap and exact, and the pixel check also guards everything
   else the player copies from the SVG.
4. **Do not do CanvasKit (O3) now.** It was the next option only if Canvas 2D
   failed in Firefox, and it did not fail.
5. **Do not move the SVG with a CSS transform instead** (C22). In Firefox it
   is as slow as the SVG camera. With `will-change`, Chrome shows a stretched
   bitmap.

## Decisions for you

- Is the canvas smooth enough by eye, in both browsers?
- Is the per-shape fade acceptable?
- Erase instead of clip, with the guard?
- Should I update the zoom task's PLAN.md (steps 2–5) around the canvas? I
  did not change anything outside this directory.
- Still open from the zoom task: where the SVG lives (`art/skeleton-watch.svg`
  was proposed), and the approved one-line fix to `offline_check.py`.

## Servers left running

| Port | What | Started by |
| --- | --- | --- |
| 8001 | this task's test page (`spike/site/`) | tonight |
| 3132 | this task's spike deck (`spike/deck/`, canvas) | tonight |
| 8000 | the zoom task's test page (SVG) | the earlier session |
| 3131 | the zoom task's spike deck (SVG, the first CSS camera) | the earlier session |

To start this task's two again:

```bash
cd spike/site && ../../../../../.venv/bin/python3 -m http.server 8001 --bind 127.0.0.1
cd spike/deck && ../../../../node_modules/.bin/slidev slides.md --port 3132
```

To stop one: `lsof -ti :8001 | xargs kill` (with its port).

## What is where

| Path | What |
| --- | --- |
| [PLAN.md](PLAN.md) | the options for where the player gets the drawing, the data model, the steps |
| [INVESTIGATION.md](INVESTIGATION.md) | every experiment (C1–C22), faults (F1–F14), interpretation |
| [CONTEXT.md](CONTEXT.md) | what this session started from, and Martin's overnight instructions |
| `spike/site/watch_player.js` | the player: reads the SVG, draws a frame |
| `spike/site/watch_stage.js` | views, camera, fades and the frame loop, for Slidev |
| `spike/site/zoom.html` | the test page (`renderer=svg` or `canvas`) |
| `spike/deck/` | the three-slide spike deck with the canvas layer |
| `spike/*.py` | the measurements; each file's docstring says how to run it |
| `evidence/` | the results the documents cite: every JSON result and log, and the images named in `spike/keep_evidence.py`, which copies them; `superseded/` holds replaced runs |
| `out/` | everything the tools write (about 35 MB, mostly images). Not committed, by the talk's `.gitignore` (`tasks/*/out/`); rerun a tool to get it back |

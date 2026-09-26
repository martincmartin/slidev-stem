# Spike: step 1 of PLAN.md (2026-09-25)

This spike answers the open questions of step 1 before any project file
changes. It measures in Chromium and in Firefox (Playwright: Chromium
153.0.8010.12 headless shell, Firefox 155.0). Some checks also ran in full
Chromium and in the installed Google Chrome 153.0.8010.53, both headless.

Nothing here is used by the talk. The talk keeps no link to this directory.

The full account, with every experiment's method and result before any
interpretation, is [../INVESTIGATION.md](../INVESTIGATION.md). This README is
the summary.

## Results

| Question | Answer | Evidence |
| --- | --- | --- |
| Does the mechanism keep its motion through a zoom in and a zoom out? | **Yes.** The SMIL clock ran at 1 s a second (largest step error 0.8 ms). It never went back. The balance was within 0.03° of its keyframes at every frame. | `out/timing.json`, `continuity` |
| Does `non-scaling-stroke` keep lines in slide px when the slide is scaled? | **Yes**, in both browsers. The hairspring is 2.0 px at host scale 1 and 3.0 px at host scale 1.5. In the Slidev deck, it is 2.6 px at slide scale 1.304 and 3.9 px at 1.957. | `out/static.json`, `out/deck.json` |
| Can the camera be a CSS transform on an HTML wrapper? | **No.** `non-scaling-stroke` does not undo an HTML transform. The hairspring is 8.9 px (4.46 × 2), with or without it. | `out/static.json`, the `html` rows |
| Is the drawing sharp during the zoom? | **Firefox: yes**, in every mode (sharpness ratio 0.996 to 1.003). **Chromium: a little soft** in every mode (0.79 to 0.94). The softening is about 1 px at the edges, not a stretched bitmap: line widths stay 2.0 px. At rest, every mode is sharp. | `out/zoom.json`, `out/mid-*.png` |
| Which camera mode is sharpest in Chromium? | **None clearly.** On the current page (after the JS easing changed in round 2), sharpness ratios, mechanism stopped / running: CSS `transform` 0.94 / 0.82; CSS `--z` 0.79 / 0.82; JS 0.79 / 0.82. The first page's JS mode gave 0.94 / 0.88, which made us call it the sharpest: withdrawn, see ../INVESTIGATION.md, F9. | `out/zoom.json`, `out/repeat_sharpness.json`, `out/superseded/` |
| Is that a headless artefact? | **Not only.** Full Chromium and Google Chrome give the same ratios to within 0.08, and the JS loop's to within 0.02. All of them are headless, with software raster. A real Chrome with GPU raster may differ. Look with your own eyes (see "Try it"). | `out/channel_sharpness.json` |
| Is the test fair? | **Yes.** With nothing moving, the camera as an SVG attribute and as a CSS property paint identically (ratio 1.000 in both browsers). Five repeats vary by at most ±0.02. | `out/check_reference.json`, `out/repeat_sharpness.json` |
| Does a zoom linear in scale feel uneven? | **Yes, measurably.** It is fastest a third of the way in. The rate of $\ln s$ at a quarter is 2.5 to 2.7 times the rate at three quarters. Linear in $\ln s$, it is fastest at the middle (0.49 to 0.51), and the ratio is 0.89 to 1.00. | `out/timing.json`, `zoom curve` |
| Does rounding to 0.1 px show at 4.46 times? | **No.** The difference to two decimals is a sub-pixel shift of the line (≤ 0.45 px), not a change of shape. Two decimals make the file 13% larger (46.1 → 52.2 KB). | `out/static.json`, `out/rounding-*.png` |
| Can Vite import the SVG from `public/` with `?raw`? | **No.** Vite refuses: "Assets in public directory cannot be imported from JavaScript." From outside `public/` it works, in dev and in `slidev build`. The built deck makes 0 outside requests (`tools/offline_check.py`). | `out/slidev-dev.log`, `out/slidev-build.log` |
| Can a global layer use `useSlideContext()`? | **No.** It needs a slide's click context. `inject(injectionSlidevContext)` works. Import it from `@slidev/client/constants.ts`: the subpath without `.ts` does not resolve in dev. | the deck |
| Does the class `slidev-layout` give the layer the theme's page colour? | **Yes** (`#FAF7F0` in both browsers). Slidev's own info dialog uses the same trick. One side effect: `tools/offline_check.py` takes the first visible `.slidev-layout` as the slide, and reports the layer instead. | `out/deck.json`, offline check output |
| Does the marker make watch slides see-through? | **Yes.** `.watch-marker ~ .slidev-layout` is transparent on slides 1 and 2. Slide 3 (no `watch:`) is opaque, and the layer is hidden. | `out/deck.json`, `out/deck-*.png` |
| Can a background rectangle in the SVG replace the class trick? | **No**, not without a change to the house tools: `artcheck.py` allows only the panel colour (`#F2EEE4`) as a drawing's field, not the page colour. | `stem/tools/lib.py`, `ART_FIELD` |
| Frame pacing | Median frame gap 16.7 ms. The longest gap is 33 ms (Chromium) or 50 ms (Firefox). Headless numbers only: the talk's laptop must be checked by hand. | `out/timing.json` |

The sharpness ratio is mean |Laplacian| / mean |gradient| of a 300 px square
around the balance, captured mid-zoom, divided by the same for the same
transform at rest. A ratio near 1 means the same edges. Blur spreads a line's
ink over more pixels but keeps its total. So the "width" of a line (its total
ink) stays, and its "extent" (pixels with any ink) grows.

## Round 2: what Martin saw in real browsers (2026-09-25)

By eye, on his Mac: in **Chrome**, parts of the mechanism other than the
hairspring blinked in and out during the zoom in, not the zoom out, in both
`mode=js&ease=exp` and `mode=svg&ease=linear`. It was unusable. In **Firefox**,
both were mostly smooth, with some halting and jumps. He prefers a zoom
**linear in scale** to one linear in log scale, in every browser and mode.

The headless screencast (`blink_check.py`) does not show the blinking: its GPU
raster path is not reachable headless. The frame gaps (`jank_check.py`, five
zooms each, gaps over 25 ms = dropped frames) found both causes:

| Variant | Chromium: frames over 25 ms | Firefox: frames over 25 ms |
| --- | --- | --- |
| CSS linear (what Martin saw) | 134 of 414 | 88 of 439 |
| the same, no clip paths | 1 of 545 | 98 of 457 |
| the same, mechanism stopped | 130 of 421 | 78 of 470 |
| **the fade starts when the camera stops** (`fadelater=1`) | **0** of 545 | 92 of 599 |
| … and strokes not constant (`stroke=scaled`) | 0 of 545 | **1** of 1056 |
| **JS linear, fade after, strokes divided by the scale** (`stroke=compensated`) | **0** of 545 | **1** of 995 |
| JS linear, fade after, `non-scaling-stroke` | 0 of 545 | 108 of 588 |

- **Chromium:** the cost is the fade's pending `transition-delay` on the clipped
  groups, while the camera moves. It is gone when the fade starts after the
  camera stops. The blinking is very likely the same fault in the GPU path: it
  happens only on the zoom in, the only direction with a pending fade.
- **Firefox:** the cost is `vector-effect: non-scaling-stroke`, which must
  recompute every stroke at each new scale. Dividing each of the four stroke
  widths by the scale, in CSS (`calc(2px / var(--s))`), keeps the lines 2.0 px
  at every point of the zoom in both browsers, and the edges stay sharp (extent
  3.0 px, as at rest). See `out/compensated.json`.

The recommended page is now:
`zoom.html?mode=js&ease=linear&fadelater=1&stroke=compensated`.

## Round 3: Firefox still stutters on Martin's screen (2026-09-25)

By eye, in Martin's Firefox (Compositing: WebRender, not software): **Chrome is
now "buttery smooth", with no drop-outs.** Firefox is better, but it still
freezes once for about 100–200 ms, about a third of the way into the zoom.
`clips=off` makes no difference. `smil=paused` is much smoother, with one or two
small bumps.

Headless Firefox no longer drops frames, so `headed_check.py` ran the page in
**visible** browser windows on Martin's laptop (Playwright's Firefox 155 and
Chromium 153, `devicePixelRatio` 1; his own Firefox has 2). The recommended
page, three to five zooms each (`out/headed-round2.json` to `-round4.json`;
round 1's file was overwritten, so its numbers are here):

| Browser, host scale | Variant | Slow frames (> 25 ms) per zoom | Worst gaps, and the zoom scale where they fall |
| --- | --- | --- | --- |
| Firefox, 1 | baseline | 3–5 | 33–43 ms, at scale 2.15–2.55, every time |
| Firefox, 1 | mechanism stopped | 0 | — |
| Firefox, 1 | no clip paths | 3–8 | up to 58 ms, at 2.15–2.57 |
| Firefox, 1 | hairspring only | 0 | — |
| Firefox, 1 | no gear-train animations | 2 | 25–42 ms |
| Firefox, 1 | no balance, hairspring or fork animations | 4–5 | 33–43 ms |
| Firefox, 1.5 | baseline | 10–12 | 50–58 ms, at 1.45–2.1 |
| Firefox, 2 | baseline | 17 | **67–83 ms**, from the start |
| Firefox, 2 | mechanism stopped | 4–6 | 33–50 ms |
| Chromium, 1 | baseline | 0 (one run: 1) | one 150 ms gap in 25 zooms, at 4.46: when the fade starts |
| Chromium, 2 | baseline and stopped | 0–1 | the same: one gap of 25–150 ms at 4.46, as the fade starts |

What this shows:

- **Firefox's cost is rasterizing the SVG on the CPU at the current scale.**
  The stall starts at the same device-pixel scale, about 2.2, whatever the host
  scale (2.15 at host 1, 1.45 at host 1.5). It grows with the pixels on screen.
  Any animation in the drawing makes Firefox re-rasterize all of it. No single
  moving part is the cause. With nothing animating, Firefox can rescale without
  re-rasterizing every frame, until the screen is large (host 2).
- At host scale 2, about full-screen Slidev on a 1920 × 1080 projector, Firefox
  drops 17 frames per zoom even with the best page. On Martin's Retina screen
  (four times the pixels at host 1) the three short stalls become one long
  freeze, as he saw.
- **Chromium is smooth at both sizes.** The one hitch it shows is when the fade
  starts, on 26 groups at once, and only in 2 of 28 zooms.

## Mistakes made on the way

These are recorded because each one gave a wrong number first.

- **The first reading of the camera numbers set `data-view` on the real SVG.**
  This started its fade transitions, so both captures were taken mid-fade. The
  page now reads the numbers from a throwaway `<svg>`.
- **The pages were not closed.** A page behind another page is hidden, and the
  browser throttles its animation frames. The JS camera then never moved.
  `spike_browser.open_page` now closes each page.
- **`SVGTransformList.consolidate()` on `animVal` throws**, because `animVal`
  is read-only. The exception stopped the frame loop, and the evaluation hung
  for 10 minutes. The loop now reads `getItem(0).angle`, and it fails fast.
- **A first sample can read `transform: none`** before the zoom starts.

## Try it

```bash
# in spike/site/
python3 -m http.server 8000
# then open, in Chrome and in Firefox:
#   http://localhost:8000/zoom.html?mode=js&ease=linear&fadelater=1&stroke=compensated
#                                                          (the recommended camera, round 2)
#   http://localhost:8000/zoom.html?mode=js&ease=exp       (the round-1 recommendation)
#   http://localhost:8000/zoom.html?mode=svg&ease=linear   (a CSS transition, linear in scale)
#   http://localhost:8000/zoom.html?mode=svg&ease=exp      (a CSS transition, linear in log scale)
# and press "Zoom in" and "Zoom out". zoom.html lists every option.
```

The spike deck:

```bash
# in spike/deck/
../../../../node_modules/.bin/slidev slides.md --port 3131
```

## Files

| File | What it is |
| --- | --- |
| `mirror/` | Copies of `art/skeleton_watch.py`, `slides.md` and `ledger.css` as they were on 2026-09-25. The one-decimal copy writes the production SVG byte for byte. `skeleton_watch_2dp.py` differs in one line (`num()`). |
| `make_svgs.py` | Runs both copies (raw output in `out/`), and writes tagged copies to `site/`: part tags, a camera group, and the view's CSS. A stand-in for step 2. |
| `site/zoom.html` | The test page. Its comment lists the query options. |
| `spike_browser.py`, `spike_pixels.py` | Shared: the local server, the two browsers, page handling; pixel arithmetic. |
| `measure_static.py` | Stroke widths at rest; one against two decimals. |
| `measure_zoom.py` | Sharpness and line widths mid-zoom. |
| `repeat_sharpness.py`, `channel_sharpness.py`, `check_reference.py` | The controls: repeats, other Chromium builds, attribute against CSS at rest. |
| `measure_timing.py` | Continuity, the zoom curve, frame pacing. |
| `blink_check.py`, `jank_check.py`, `check_compensated.py` | Round 2: blinking frames (Chromium screencast), dropped frames per variant, and the compensated strokes' width. |
| `headed_check.py` | Round 3: frame gaps and their zoom scale, in visible browser windows (`headed_check.py <round>`). |
| `deck/`, `deck_check.py` | A three-slide Slidev deck with `global-bottom.vue` and `slide-bottom.vue`, and its check. |
| `out/` | Every result: JSON, screenshots, logs. |

To run them again, in `spike/`:

```bash
P=../../../../.venv/bin/python3
$P make_svgs.py && $P measure_static.py && $P measure_zoom.py && $P measure_timing.py
$P repeat_sharpness.py && $P channel_sharpness.py && $P check_reference.py
# with the spike deck running on port 3131:
$P deck_check.py http://localhost:3131
```

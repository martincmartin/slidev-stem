# The article's figures in Firefox for Android

## The problem

The user's report, 2026-10-27, on GitHub Pages, Firefox for Android on a Pixel
10 Pro:

- **Gear Train, the click 4 figure** ("The minute hand on the center wheel's
  arbor"): the case, the chapter ring, the crown and the minute hand blink in
  and out. The train stays solid. It happens as soon as the page loads at
  `#gear-train` and the reader scrolls to the end of the section. It happens
  in a regular Firefox window and in a private one. It does not happen in
  Brave (Chromium) in a private window.
- **Mainspring, the figures of the spring**: the spring uncoils at 2 or 3
  frames a second. In the next figure (the whole train), the hairspring also
  looks slow.

## How the figures draw now

One `Renderer` draws every figure of the article on one hidden canvas
(`webgl/shared.ts`). At each animation frame, for each figure on or within
200 px of the screen, it draws the figure's picture, and the figure copies it
to its own 2D canvas with `drawImage`. Each figure's canvas covers the whole
slide, and the figure shows its crop of it (`ArticleFigure.vue`, a CSS scale
and translate in a box with `overflow: hidden`).

## Measurements

All on this Mac (M-series), in Playwright's engines. The scripts are in
`evidence/`; each says what it measures.

**The springs' geometry is not the cause.** `springtime.ts` (Node) and
`run-browsers.ts` (the same code in each engine), ms for each spring, each
frame:

- Node: hairspring 2.2, mainspring 2.6.
- Firefox: 1.3 and 1.3. Chromium: 1.6 and 1.5. WebKit: 1.4 and 1.3.

At 5 times slower on a phone, both take 13 ms: 40 frames a second, not 2–3.

**The copy is a readback in Firefox.** `copycost.ts`, a 412 x 915 viewport at
2.6 device px per CSS px. It wraps `drawImage` and times `gl.finish()` and
the copy apart. For each copy: Firefox 2.3–2.8 ms, Chromium 0.0 ms (the copy
stays on the GPU). The rAF numbers in its output are for each callback, and
the page has more than one callback a frame.

**Most of a figure's canvas is not seen.** `crop.ts`: the area of each
figure's canvas over the area that the figure shows. On a 412 px viewport,
the Mainspring slide's first three figures are 2.8x (2149 x 1210 device px,
about 10 MB a copy), the Gear Train figures 1.3x, the Ticks and Turns figure
2.8x, and the others 1.0–1.8x.

**The blink does not show on the Mac.** `blink.ts` and `blink2.ts` count the
click 4 figure's ink pixels at each frame, in Firefox headless and in a
visible window, with the 2–3 figure near the screen too, and while scrolling
down from `#gear-train`: 0 frames of 240 and of 510 differ by more than 10%
from the median.

## The likely cause of the blink

The click 2–3 figure and the click 4 figure share a crop, so their canvases
have the same size. In each frame, the one hidden canvas draws the 2–3 figure
(at click 3) and then the click 4 figure, and each copies it. The 2–3
picture at click 3 is the click 4 picture without the case, the chapter ring,
the crown and the minute hand: just what blinks. So Firefox for Android
probably copies, at times, the picture before the last one. This is a guess:
it does not happen on the Mac, so only the phone can confirm it.

## Options

1. **One copy source for all the figures of a frame (an atlas).** Each
   figure that the frame draws gets its own place on the hidden canvas. The
   renderer draws them all, and then each figure copies its own place. A
   stale copy then shows the same figure's last frame, which no one can see.
   Firefox reads the canvas back once a frame, not once for each figure. Cost:
   the renderer draws into a place on its canvas, given by the caller.
2. **Draw only the crop.** The figure's canvas covers its crop, not the
   whole slide, and the renderer's camera maps the crop to the canvas. The
   pixels to draw, read back, copy and composite fall by the ratios above:
   2.8x on the Mainspring figures. Every engine gains. Cost: a crop in the
   frame, and the canvas placed at the crop in the figure.
3. **Draw each frame only the figures on the screen.** A figure within 200 px
   of the screen, but off it, is drawn once when it comes near, so that it
   has a picture when it comes in, and then not until it is on the screen.
   This takes the frame from three figures to two, or from two to one, in
   much of the scroll.
4. **Draw the figures at most at 2 device px per CSS px.** Up to 2.25x fewer
   pixels on a phone at 3x, with softer lines. Not now: options 1–3 first,
   and this only if the phone is still slow.
5. **One WebGL canvas over the page, with no copies.** The fastest, but the
   pictures lag the page when a phone scrolls, and the labels must be
   layered over a canvas that is not in the figure. Not now.

The user chose 1, 2 and 3, to test on the phone from a build that this Mac
serves on the local network.

## Result

Options 1–3 are in `webgl/shared.ts`, `webgl/atlas.ts`, `Frame.crop` and
`cropCamera` (`webgl/renderer.ts`), and `components/FigureLayer.vue`.

- **On this Mac:** `crop.ts` gives 1.0x for every figure. In Firefox,
  `blink2.ts` gives 0 frames of 510 that differ by more than 10% from the
  median. Screenshots show the labels on their parts.
- **On the phone** (the user, 2026-10-27, Firefox for Android, Pixel 10 Pro,
  a build served on the local network): the case, the chapter ring and the
  crown of the Gear Train slide's click 4 figure are solid. The Mainspring
  slide's uncoil is smooth, and so is the hairspring in the next figure.

The phone does not say which of the three options stopped the blink. The
sheet (option 1) makes a stale copy show the same figure's last frame, so it
is the one to keep if a later change must remove one.

## Follow-ups to measure if the phone is slow again

- `Renderer.target` makes the pictures (colour, holdout numbers, depth) again
  each time the size changes. The figures of a frame have different sizes,
  so the frame makes them again for each figure. Pictures that only grow,
  with each figure drawn in a corner of them, would not.
- Option 4.

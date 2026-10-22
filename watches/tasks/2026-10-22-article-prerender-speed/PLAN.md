# Why the article's prerender is slow, and how to make it fast

`pnpm prerender` (`addons/narration/prerender.ts`) takes a still of each of
the article's 22 figures. On a 12-core Mac it took about 4 minutes; on
GitHub's 4-core runner, with no GPU, a screenshot passed Playwright's 30 s
limit and the publish run failed (fixed for now with a 180 s limit, commit
32d39cb). The time of each still grew down the page: 4–6 s near the top,
24 s in the Hour Hand section.

The question: is work wasted, and how do we remove it? The first guess was
that figures already scrolled past keep drawing, so that each still competes
with all the figures before it (time that grows with the square of the
number of figures).

## Tools

All in `tools/`, run in the talk's directory on a deck built with base `/`
(`out/dist`, `pnpm exec slidev build --out …`):

- `measure.ts`: for each figure, over its 2.5 s settle: frames, long
  animation frames and their scripts, `requestAnimationFrame` callbacks by
  caller, running animations (CSS, SVG SMIL); and the screenshot's time.
  Output: `out/before.json`.
- `profile.ts`: a CPU profile (Chrome DevTools Protocol) of 3 s after the
  settle of chosen figures: self time by function. Output:
  `out/profile-before.json`.
- `draws.ts`: `drawImage` calls by figure canvas and size, over each
  settle. Output: `out/draws-before.json`.
- `prerender-before.ts`: the prerender at the start of this task.
- `prerender-paused.ts`, `prerender-paused-dispatch.ts`: the trials (below).

## Findings

**No work is wasted on figures off the screen.** The shared renderer
(`webgl/shared.ts`) draws only the views that are on or within 200 px of
the screen. In each frame it draws 1 to 3 figures: the one on the screen and
its neighbours (`out/draws-before.json`). The number of
`requestAnimationFrame` callers stays at 3, and running CSS animations at
about 2, down the whole page. The square-law guess is wrong.

**The frame time is the scene, drawn in software.** Almost every frame is a
long frame, and almost all its time is `drawImage`: 2.5 s of each 3 s
profile at figure 1, 3.7 s at figure 19 (`out/profile-before.json`).
`drawImage` copies the shared WebGL canvas into the figure's 2D canvas. With
no GPU (headless Chromium here, the CI runner), WebGL draws in software, and
the copy waits for that drawing, so the profile puts the scene's cost on
`drawImage`. The scene's cost grows with what it shows, at 2× scale (2 to 3
megapixels):

- Hairspring (figure 1): 44 frames in 2.5 s, 2 figures drawn: about 28 ms a
  figure.
- Gear Train, Mainspring, Hour Hand (figures 12–20): 4 to 8 frames in
  2.5 s, 1 to 3 figures drawn: 200 to 400 ms a figure.

**The screenshot pays the frame time again.** `locator.screenshot` waits
until the element is stable: the same box in two animation frames. Then it
captures at 2×. At 300 to 600 ms a frame, a still took 5 to 20 s
(`out/before.json`, `screenshotMs`). The wasted work is this: the figure is
drawn again and again while the prerender needs one picture.

## Options

- **A. Pause the page before each still (chosen).** After the settle, press
  the page's "Pause them all" button; take the still; press it again. A
  paused view is not drawn and keeps its last picture (`webgl/shared.ts`),
  so the screenshot's frames are cheap. It uses the page's own control: no
  new code in the page, and the still is the picture the reader saw at that
  moment.
- **B. Draw only the target figure.** Pause the neighbours during the
  settle. It saves the 1 to 2 neighbours' draws (up to about 2× on the
  settle's frames), but the settle is a fixed 2.5 s, so it saves no time;
  and it needs a per-figure pause from outside the page.
- **C. A GPU in the prerender's Chromium** (`--use-angle=metal` on a Mac).
  Faster on a Mac; no help on the CI runner, which has no GPU.
- **D. Smaller stills** (`STILL_SCALE` 1.5 or 1). About 2× to 4× fewer
  pixels to draw, but the stills are less sharp on a high-density screen.
- **E. A shorter settle.** The settle is the time for a step's moves to end;
  a shorter one can catch a figure mid-move.

## Results

On the same build, one run after the other, with nothing else running
(except the first trial):

- `prerender-before.ts`: 235 s. Each still 0.5 to 20 s.
- `prerender-paused.ts` (A, with Playwright's `click`): 139 s, part of it
  with full validation running. Each still 77 to 131 ms.
- `prerender-paused-dispatch.ts` (A, with `dispatchEvent`, which does not
  wait for frames): 126 s. Each still 87 to 129 ms.
- **The change** (`addons/narration/prerender.ts`): A with `dispatchEvent`,
  and the page also paused while it scrolls, because a scroll waits for
  frames too (up to 9 s before): **64 s**, 3.7× faster. The 22 settles are
  55 s of it. Its log is not kept: it prints only the total.

**The stills.** Compared with `prerender-before.ts`'s, pixel by pixel
(channels that differ by more than 16): the figures that stand still are
the same (0 %); a figure whose watch runs differs in 1 to 16 % of its
pixels, because the watch runs on its own clock, so each run shows another
moment. The Recap figure plays a tour, and differs in 66 %: each run shows
another moment of the tour, before the change as after it. The article's
HTML differs only in the Recap tour's caption, for the same reason.

**Chosen: A, as in the change.** B, C, D and E are not needed: what is left
is the settle, which E would shorten at a risk to the stills.

**The 180 s step limit** (32d39cb) is removed: with the page paused, no step
waits for a slow frame. Playwright's 30 s default is enough.

**Not done:** a playing tour's still (Recap) is a moment chosen by the
settle's end, and it can catch a fade (for example, two values of the time
scale over each other). This was so before the change.

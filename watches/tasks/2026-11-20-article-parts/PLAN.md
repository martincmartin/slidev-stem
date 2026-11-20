# The article in three pages, each with only the art it needs

The article is one page for the whole talk, and it is too long. This task
splits it into one page for each part, and makes each page load, build and
upload only the art that its figures show. The request is in
`instructions.md`.

## 1. What every page pays for now

Measured on 2026-11-20, on the built deck (`pnpm build`) and in Node 26 on the
author's Mac:

- **Download.** The deck's entry script, `dist/assets/index-*.js`, is
  1,721 KB, 565 KB gzipped. Of that, `globe/earth.json` is 1,318 KB, 426 KB
  gzipped: about 75%. `globe/model.ts` imports it statically, and
  `watch/art.ts`, `watch/instance.ts` and the layers that Slidev loads on
  every page (`global-bottom.vue`, `slide-bottom.vue`) import that. So every
  page loads it: the slides, and the article.
- **CPU.** `watch/instance.ts` makes the art when it loads (`makeArt`): the
  watch (`generate`, 120–160 ms in Node, warm and cold) and the globe
  (`makeGlobe`, 240–270 ms warm, 334 ms cold with the module's load). The
  browsers' times are not measured: `docs/globe.md` says so for the globe, and
  `../../docs/webgl.md` gives about 10 ms for the watch in Chromium, a number
  from before the motion works and the one-step wheels.
- **RAM and GPU.** Importing `globe/model.ts` adds about 21 MB of heap in
  Node. The scene is 103 watch meshes (92,353 triangles, 2,899 lines) and 13
  globe meshes (166,283 triangles, 1,907 lines). The article's one renderer
  (`sharedStage`, `webgl/shared.ts`) takes the whole scene, so every article
  page uploads both.
- **The watch's pieces.** The cover's picture (`art: all`) is 37,388
  triangles. The Gear Train slide's `one-step wheel`, a mark that `art: all`
  leaves out, is 36,713: 40% of the watch. The other marks with more than
  2,000 are the `one-step hour wheel` (8,320), the `hour wheel` (3,248) and
  the `minute wheel` (2,608).
- **The diving board.** `diving-board.svg` is 751 KB. Each article figure
  mounts a `DivingBoard` (`components/FigureLayer.vue`), which fetches it and
  puts a copy in the page, also in a figure that does not show the board. Not
  measured in a browser.

The figures of each part (`pnpm article:text`): Part 1, the watch and the
diving board; Part 2, six figures of the globe and the story maps, two of the
watch's case (World War I), and photos; Part 3, none yet.

## 2. Options for the pages

- **A. One deck, a page for each part, and the art made for each page.**
  Routes `/article/1`, `/article/2`, `/article/3`; the prerender writes one
  static page for each. The globe's module is a dynamic import, loaded only
  where a slide or a figure shows it.
- **B. The pages only.** The cheapest, and it fixes the length; but the globe
  is still downloaded and made on every page.
- **C. A build for each part** (three decks, or three Vite entries). The
  layers import the globe statically, so each build needs A's changes too,
  and there are three or four builds to keep in step.
- **D. `manualChunks` for `earth.json`.** A chunk that is imported statically
  still loads at the start: it is only a separate file.

Ranked: A, B, C, D. A is the only one that does what the request asks. B is
A's first half. C costs more than A for no more. D saves nothing.

## 3. Options for leaving out the watch's unused parts

- **E1. Upload only the meshes that the page's figures show.** The page knows
  its figures, so it knows the meshes that each step shows (`stageState`):
  their union is exact. The renderer gets a scene of those meshes. Part 1
  leaves out the globe; Part 2 leaves out the one-step wheels and the other
  marks. No change to the generator.
- **E2. Do not build the unused pieces.** `watch/generate.ts` is 3,400 lines,
  and its parts depend on each other: the paper discs and holdouts of one
  piece are made from another's shape. A piece filter in it is the surgery
  to avoid. It would save part of the watch's 120–160 ms (Node), which is
  not yet measured in a browser.
- **E3. Leave out the sides and backs of parts that face the camera.** A
  view that tilts (Part 1) needs them, so it would be a second model for
  pages that do not tilt. The cover's 37,388 triangles take a fraction of a
  frame's 1–3 ms of GPU (`docs/watch.md`), and about 1.3 MB of positions.
  Not worth a second model.

Chosen first: E1. E2 only if a browser measurement shows that the watch's
build matters; E3 not.

**After the measurements (section 7): none.** Once a page without the globe
does not load it, E1 would save the unused watch marks' GPU buffers on Parts
2 and 3: 92,353 − 37,388 = 54,965 triangles at 36 bytes, about 2 MB, and the
upload of a few ms. The cheap way to E1, a renderer that makes a mesh's
buffers at its first draw, would also do so in the slides: the one-step
wheel's 36,713 triangles would upload at the Gear Train slide, in the
middle of the live talk, where a dropped frame shows. A scene for each page
needs the page's figures in the talk's code. Neither is worth 2 MB.

## 4. Decisions

- **The pages.** Each section slide starts a part, and each part is a page:
  `/article/1/`, `/article/2/`, `/article/3/`. The slides before the first
  section (the cover) are on page 1. `/article/` is a static redirect to
  `/article/1/`, and the router redirects `/article` too.
- **Each page** starts with the talk's title, the author and "Pause them
  all", then a line of links to the other parts, then its contents.
  Page 1 keeps the cover's narration and its figure. A section slide that
  starts a page after the first has a figure if its narration asks for one
  (`[figure: …]`): the watch, at the cover's view.
- **A part that is not ready** has `articleLinked: false` on its section
  slide: the page is built, but no other page links to it. Part 3, now.
- **The credits** are on every page: a slide with `articleEveryPage: true`
  (the Questions slide) goes at the end of each page. Its photos are in
  Part 2, and a CC BY photo needs its credit where it shows.
- **The text export** prints every page in order, as before; `--part N`
  prints one.
- **The art** (section 5) is made for each page.

## 5. The art for each page

`watch/instance.ts` makes the art at load today, and eight modules import it.
After the change:

- `watch/art.ts` makes the watch, with the globe only if asked.
  `globe/model.ts` is imported only with `import()`, so Vite makes it, and
  `earth.json`, a chunk of their own.
- The deck (the slides) asks for the globe at the start: the talk uses it.
- An article page asks for it only if one of its slides names the globe.
- The renderer of an article page gets the meshes of its figures (E1).

Measure each page before and after, in Chromium, Firefox and WebKit: bytes
downloaded, the JS heap, and the time to the first figure.

## 6. Steps

1. The pages (section 4), with tests, the prerender and the docs.
2. The art for each page (section 5), with the measurements. The baseline
   (section 7) found two more costs, fixed in this step:
   - **The diving board in every figure.** Each figure mounted a
     `DivingBoard`, which fetched `diving-board.svg` (751 KB; the browser's
     cache served all but the first) and put a copy in the page: 7,431
     elements on Part 1. Now a figure mounts it only if its slide has a
     `board` key, and the page fetches it once.
   - **The static stills.** A reader with JavaScript loaded every still
     (7.1 MB on Part 1, 9.5 MB on Part 2) before the live figures took their
     place. Now they load lazily.
3. E1: not done (section 3).

## 7. Results

Measured on 2026-11-20 with `evidence/measure.py`, on the build that
`tools/pages_preview.py watches --article` serves (as GitHub Pages does, but
not compressed): the median of three loads of each page, each in a fresh
context. `kB` is what the network transferred (`transferSize`); WebKit does
not report it, so its numbers count cache hits too, and are left out here.
The JS heap is Chromium's, after a garbage collection. Before:
`evidence/before.jsonl`, after: `evidence/after.jsonl`.

- **Part 1.** Transferred: 11,350 → 3,357 kB (Chromium), 11,351 → 3,051 kB (Firefox); JS 2,123 → 811 kB. Elements: 7,431 → 1,754. JS heap (Chromium): 35.2 → 22.0 MB. First figure's canvas: 1877 → 1703 ms (Chromium), 1382 → 679 (Firefox), 1146 → 610 (WebKit).
- **Part 2.** Transferred: 14,483 → 4,301 kB (Chromium), 14,484 → 4,205 kB (Firefox); JS 2,127 → 2,136 kB. Elements: 4,994 → 3,835. JS heap (Chromium): 30.0 → 29.6 MB. First figure's canvas: 1378 → 698 ms (Chromium), 1162 → 1148 (Firefox), 1038 → 953 (WebKit).
- **Part 3.** Transferred: 4,318 → 2,254 kB (Chromium), 4,319 → 2,255 kB (Firefox); JS 2,089 → 777 kB. Elements: 363 → 121. JS heap (Chromium): 28.9 → 16.8 MB. First figure's canvas: 655 → 281 ms (Chromium), 909 → 373 (Firefox), 913 → 457 (WebKit).
- **The slides.** Transferred: 4,695 → 4,709 kB (Chromium), 4,698 → 4,712 kB (Firefox); JS 2,249 → 2,262 kB. Elements: 845 → 854. JS heap (Chromium): 30.9 → 31.0 MB. First figure's canvas: 1085 → 1081 ms (Chromium), 939 → 907 (Firefox), 923 → 882 (WebKit).

The slides are as before: they show the globe. Part 2's JS is as before: it
shows the globe too; its smaller download is the lazy stills. Every page
loads with no error in Chromium, Firefox and WebKit, with and without
JavaScript (`evidence/check_pages.py`).

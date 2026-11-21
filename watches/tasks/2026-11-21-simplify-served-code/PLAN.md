# Plan and results

## Method

Four reviewers read the served code, each from one angle: reuse (code that
a helper already does), simplification (state that can be computed, copies,
dead code), efficiency (work at each frame, measured in Chromium) and
altitude (a fix at the right depth). Their findings were merged where they
pointed at the same code. The rule for each finding: do it, unless it
changes behavior, or it is a large refactor, or its cost is more than its
value.

## Done

- **Shared math** (`webgl/math.ts`): `radians`, `clamp`, `mixPoint`, `dot`,
  `angleBetween`. About 30 copies written out by hand now call them,
  including two `smoothstep`s, two local `radians` and a local `clamp`.
  `routeLength` (`globe/voyage.ts`) replaces a sum in `globe/stories.ts`.
- **One copy of each computation:** a point turned about the origin
  (`turned` in `watch/teeth.ts`, for `generate.ts` and `callouts.ts`);
  `toward` (moved to `watch/shapes.ts`, also for `recap.ts`); `tipCircle`
  (three copies in `callouts.ts`); the view's axes (`viewRotation`, for
  `towardCamera` and the noon clock); `showState` and `changeEndAt`
  (`webgl/stage.ts`, for `Stage` and `SharedView`).
- **The deck's layer and the article's figures** share `tickTockAt`,
  `timeScaleAt` and `voyageStepTo`.
- **Pieces by name:** `piecesNamed`, `meshesOf` and `shownPieces` in
  `watch/state.ts`. A figure's `mark` setting with an unknown name now
  throws; before, the name was dropped.
- **Small:** `frontmatterOf(route)` (6 copies), `clickOfKey` (2),
  `isRecord` in `design.ts`, a table of the figure's sliders, the drag as
  one ref, `coveringBox` (`addons/narration/figure.ts`), the still's size in
  `WatchStills`, the board's `rest` and `curling` computed from `place`, the
  "run down" label made from `LAPSE_HOURS` and `LAPSE_SECONDS`, and no
  dead `cameraMove` branch or watch-layer transition.
- **Build plugins** (`themes/house/`): the licence list is made from Vite's
  JSON, not by parsing its Markdown; the meta tags' quotes come off any
  `<meta>`. `licenses.txt` and the meta tags are byte-identical.
- **Efficiency:**
  - The renderer keeps its pictures (render targets) for the last 4 sizes.
    Two figures of different sizes on the screen made new ones at each
    frame. Part 1 of the article, in Chromium, a second, before → after
    (`counts-*.txt`):
    - scroll 3000: framebuffers 43.8 → 0, textures 131.5 → 0, `bufferData`
      175.4 → 100, frames 43.8 → 50.
    - scroll 4500: framebuffers 31.8 → 0, textures 95.4 → 0, `bufferData`
      127.2 → 70.5, frames 15.9 → 17.6.
    - scroll 9000: framebuffers 32.2 → 0, textures 96.6 → 0, `bufferData`
      128.8 → 70.3, frames 32.2 → 35.2.

  - `springPoints` measures the spiral's length with no arrays, and finds
    each angle's sine and cosine once: 1.747 ms a call before, 0.379 after,
    with the same points (the same hash, `springhash-*.txt`).
  - One `Motion` for each watch keeps the springs' geometry for the last 4
    swings and poses. Views that show the same pose give the renderer the
    same object, which it does not upload again. One entry was not enough:
    two figures with different poses then made their geometry at each
    frame (the test "models that share a renderer each draw their own
    mainspring" failed).
  - `lineInstances` writes into one `Float32Array`; `StoryMaps.vue` sets an
    attribute only if it changes; the board reads its timing once.

**Checks:** each slide's crop, frame key and marks at each click are the
same as before (`boxes.ts`). The full validation of the talk and of the
root passed. Part 1 of the article loaded with no error in Chromium,
Firefox and WebKit.

**Size:** 41 files changed (not tests): code lines 15,807 → 15,977 (+170),
comment lines 3,537 → 3,607 (+70) (`sloc.py`). The simplifications removed
lines (`global-bottom.vue` −19, `stories.ts` −13, `FigureLayer.vue` −11);
the speed-ups added them (`model.ts` +70, `renderer.ts` +27). The built
JavaScript, all files: 2,311,758 → 2,308,028 bytes; gzipped 773,933 →
774,351 (the chunks are split another way); the JavaScript that
`index.html` loads at once: 719,325 → 717,951.

## Not done: tried, or thought through, and worse

- **Set `--watch-fade` on every page,** and drop the `0.8s` fallback in
  `DivingBoard.vue`. The article has no watch layer, so the variable is not
  set there, and the slides' `after-watch-fade` text uses its `0s`
  fallback. Set on every page, that text in the article would wait 0.8 s.
- **One variable for the paper's outline** (`-webkit-text-stroke: 6px
  var(--palette-background)`, in 9 rules). A custom property whose value
  holds `var(--palette-background)` takes the value where it is declared
  (`:root`), so a dark slide, which sets its own background on its
  `.slidev-layout`, would get the light paper's outline. A variable of the
  width only would save almost nothing.

## Not done: open

In [`docs/cleanups.md`](../../docs/cleanups.md), with their costs: the list
of what does not show in `showWatch`, one list of the layers, the clock and
the pause given to each layer, the board's `busy` and `ends`, `BOARD_BOX`,
the globe's land data, `deviceSize`, the board's SVG fetch, and the `img`
sizes.

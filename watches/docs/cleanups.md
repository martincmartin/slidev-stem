# Cleanups not yet done

**Covers:** the cleanups, refactors and speed-ups of this talk's code that a
review found and that nobody has done yet: for each, what it is, what it
costs, what it gives, and why it waits. When you do one, delete its entry.
When a review finds a new one that you do not do, add it.
**Read before** you simplify, refactor or speed up the talk's code, or
review it for any of these.
**Tasks:** [`tasks/2026-11-21-simplify-served-code/`](../tasks/2026-11-21-simplify-served-code/README.md)
has the review that found them, and the evidence.

## Check first

- **The list of what does not show, in `showWatch`** (`global-bottom.vue`).
  A step that changes only what is not part of the picture does not show
  the watch again. The list is written by hand: it takes out `flash`,
  `later`, `cut`, `goLater` and `linger`. It keeps `move`,
  `flashAfterMove` and `wind`, which say how the step moves or what it
  does, not what shows. So a click that changes only one of those shows
  the watch again. For `wind` that can be the intent: it winds the spring
  at its click. Find out on the slides that set these keys, before you
  change the list. If it is a bug, write the list of what shows, not
  of what does not (a `pictureOf(state)` in `watch/state.ts`), so that a new
  key does not show by default.

## Larger refactors

- **One list of the layers.** `global-bottom.vue`, `components/FigureLayer.vue`,
  `slide-bottom.vue` and `watch/slide-state.ts` each name the layers (the
  story maps, the diving board, the tick-tock words, the time scale) and
  give each its state. So a new layer changes all four
  ([`watch.md`](watch.md), "A new layer"). A registry of the layers, or one
  composable that the three components share, would put each layer in one
  place. Cost: a change of the four files, and a check of each slide and
  figure that has a layer. It waits because the four still agree, and the
  doc lists the steps.
- **The clock and the pause, given to each layer.** Each layer component
  takes `paused`, and all but `StoryMaps.vue` take `now`, as props from its
  parent. A `provide` of the
  frame's clock would remove the props. Cost: medium. It gives less code
  in each parent, and no new behavior.
- **The diving board's `busy` and `ends`.** `DivingBoard.vue` emits
  `busy` while a story animation runs, and `ends` with the time when its
  change ends. They are two signals for nearly one fact. Merging them changes when a press in a burst jumps
  (`pressJumps` in `global-bottom.vue`), so it needs a check of the
  Hairspring slide's clicks in each direction.
- **`BOARD_BOX`** (`watch/article.ts`) is the diving board's box, measured
  by hand. Made from the drawing (`art/diving_board.py`), it would follow a
  change of the drawing. Cost: the drawing's script must export the box.
- **The globe's land data** (1.3 MB of JSON) is in the JavaScript as an
  object literal. A fetch at run time would load it only on a page that
  shows the globe, and parse it faster. Cost: an asynchronous load of the
  globe, and a still that waits for it.

## Small speed-ups

The efficiency review rated these as low value. Do one only if a profile
shows it.

- **`deviceSize`** (`webgl/stage.ts`) reads the canvas's box for each view
  at each frame, and that can make the browser do its layout. A
  `ResizeObserver` would keep the size.
- **The board's SVG** is fetched when `DivingBoard.vue` mounts, also on a
  page that does not show the board yet.
- **`width` and `height` on each `img`** would keep the page from moving
  as the pictures load.

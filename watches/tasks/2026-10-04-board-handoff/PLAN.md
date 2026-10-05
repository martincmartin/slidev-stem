# 2026-10-04 board handoff: no click between the curl and the hairspring

## The request

On slide 2, remove click 3. When the diving board has curled into the
hairspring, the real hairspring takes its place with no click and no wait.

Before: click 2 curls the board, click 3 fades the board out and the watch in
(`boardHide: 3`, `watchShow: 3`), click 4 resumes the balance.
After: click 2 curls the board, and the swap follows at the curl's end. Click 3
resumes the balance. The slide has 3 clicks.

## The problem

The curl does not start at the click. It waits for the next bottom of the
swing (0 to 1 s), and then takes `curlDuration` (2.4 s, an example from the
SVG). So the time of the swap is known only to the board's clock. A frontmatter
key that names a click cannot give it.

## Options

### A. The board's clock decides when its picture shows; the picture covers the watch (chosen)

- The board's picture (the board, the pool, the stand) shows while the board is
  on and its clock is before the curl's end. One function, `pictureShown` in
  `watch/board.ts`, used by the live board and by the posed board in print.
- While the picture shows, it covers the watch: the board's component emits
  `cover`, and the layer hides the canvas (live) or the still (print).
- `watchHide` and `watchShow` are no longer needed: the cover hides the watch
  at clicks 1 and 2. Nothing else uses them, so they are deleted.

Pros:

- Back is the move forward reversed, with no code for it
  (`docs/navigation.md`, rule 1). Back from click 2 to 1: the clock plays the
  edit backward (1.2 s) with the hairspring still on the screen, then crosses
  the curl's end, the board fades in over the hairspring, and the board
  uncurls. A threshold on the clock gives this order in both directions.
- One fact in one place: the time of the swap is the curl's end on the board's
  clock.

Cons:

- The watch now has a state at clicks 1 and 2 (it was `null`). At click 2 it
  settles while covered. The settle takes at most 1 s + 0.78 s = 1.78 s
  (`docs/watch.md`, "The settle"). The cover lasts at least 2.4 s after the
  click (the curl alone). So the watch is at rest when it shows.
- The stage would draw under the cover. The layer stops it after the canvas's
  fade while it is covered, as it did for a hidden watch.
- Going back, the board fades in during the first 0.4 s of the uncurl, not
  before it. The uncurl's start is slow (eased), so this is small.

### B. Keep `watchHide`/`watchShow`, and set both swaps to click 2 with a delay

A CSS delay cannot know when the curl ends (0 to 1 s of wait). A delay sent
from the clock to the watch's layer would be a move, not a target, and going
back would fade the watch out at the click, 1.2 s before the board fades in:
nothing but the dashed outline would show for that time. Rejected.

### C. Swap after the edit, not after the curl

Keeps "one thing moves at a time" (the edit waits for the curl). But it adds
1.2 s between the curl and the swap, which the request asks to remove. The swap
is a crossfade of two pictures of the same shape, so it moves nothing; it can
run with the edit. Rejected.

## Ranking

1. A: no new keys, symmetric back, one threshold.
2. C: same mechanism, a 1.2 s wait the request does not want.
3. B: wrong on the way back.

## Print

A printed page still shows click 2 half way through the curl (`CURL_SHOWN`),
so it differs from click 3. The board's state now says whether the click is
the curl's own (`curlsHere`): only then is the page posed in the curl. Later
clicks show the end, with the picture off and the watch's still showing.

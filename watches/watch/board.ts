// The diving board's pose on a page that does not run its clock: print and
// export, the overview, the presenter's "next" pane. components/DivingBoard.vue
// sets the SVG's time to the one that this gives. The times come from the
// SVG's root (art/diving_board.py writes them).

/** The root's `data-` times, in seconds. */
export interface BoardTiming {
  /** The bottom of the swing: the board is bent and still. */
  swingStart: number;
  /** When the curl starts, and how long it lasts. */
  curlStart: number;
  curlDuration: number;
}

/** How far through the curl a page shows it: the board is a spiral that has
 *  not yet wound in to the hairspring, so the page differs from the next click's
 *  (the hairspring at rest). */
export const CURL_SHOWN = 0.5;

/** The SVG's time (s) for a page, from the props that the slide gives the
 *  board. `playing` starts at the click that shows the board; `curling` is the
 *  next click. Before the board plays, the picture is faded out, so time 0. */
export function boardPoseTime(
  timing: BoardTiming,
  playing: boolean,
  curling: boolean,
): number {
  if (!playing) return 0;
  if (curling) return timing.curlStart + CURL_SHOWN * timing.curlDuration;
  return timing.swingStart;
}

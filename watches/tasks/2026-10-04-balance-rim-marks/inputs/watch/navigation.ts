// What kind of move the viewer made: one step forward, one step back, or a
// jump (../../docs/navigation.md). A step is one click within a slide, or a
// move to the next or the previous slide. A step animates; a jump (a reload,
// a link, the overview, a slide that is not a neighbour) shows the target at
// once. The layers decide from this, so a slide names only its targets.

/** A slide and a click on it. */
export interface Place {
  slide: number;
  clicks: number;
}

export type Move = "forward" | "back" | "jump";

export function moveOf(from: Place | undefined, to: Place): Move {
  if (!from) return "jump";
  const difference =
    from.slide === to.slide ? to.clicks - from.clicks : to.slide - from.slide;
  if (difference === 1) return "forward";
  if (difference === -1) return "back";
  return "jump";
}

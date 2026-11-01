// A closed ring cut to a rectangle, as Sutherland and Hodgman cut a polygon:
// the earth's tool cuts the 1:10m land to its boxes (art/earth-data.ts), and
// a story map cuts its land to the slide (globe/maps.ts). A concave ring
// can come out with edges along the rectangle's sides: each use puts the
// rectangle outside what shows.

type Point = [number, number];

/** The part of a closed ring inside one half-plane. */
function clipEdge(
  points: readonly (readonly [number, number])[],
  inside: (point: readonly [number, number]) => boolean,
  cross: (
    from: readonly [number, number],
    to: readonly [number, number],
  ) => Point,
): Point[] {
  const kept: Point[] = [];
  points.forEach((current, index) => {
    const previous = points.at(index - 1) ?? current;
    if (inside(current)) {
      if (!inside(previous)) kept.push(cross(previous, current));
      kept.push([current[0], current[1]]);
    } else if (inside(previous)) {
      kept.push(cross(previous, current));
    }
  });
  return kept;
}

/** The part of a closed ring inside the rectangle from `low` to `high`
 *  (the least and the most x and y). */
export function clipToRect(
  ring: readonly (readonly [number, number])[],
  low: readonly [number, number],
  high: readonly [number, number],
): Point[] {
  const atX =
    (x: number) =>
    (from: readonly [number, number], to: readonly [number, number]): Point => [
      x,
      from[1] + ((to[1] - from[1]) * (x - from[0])) / (to[0] - from[0]),
    ];
  const atY =
    (y: number) =>
    (from: readonly [number, number], to: readonly [number, number]): Point => [
      from[0] + ((to[0] - from[0]) * (y - from[1])) / (to[1] - from[1]),
      y,
    ];
  let kept = clipEdge(ring, ([x]) => x >= low[0], atX(low[0]));
  kept = clipEdge(kept, ([x]) => x <= high[0], atX(high[0]));
  kept = clipEdge(kept, ([, y]) => y >= low[1], atY(low[1]));
  return clipEdge(kept, ([, y]) => y <= high[1], atY(high[1]));
}

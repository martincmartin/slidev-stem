// Where a title slide puts its text: `side: left` beside an illustration on
// the right, or centred (the default, with no `side`). The cover and section
// layouts read it from the slide's frontmatter. It is not in layouts/, because
// Slidev would take a file there for a layout.
export type Side = "center" | "left";

const SIDES: readonly Side[] = ["center", "left"];

/** The class that places a title slide's text on `side`. An unknown side
 *  throws: the slide shows nothing, and the console says why. (Vue logs the
 *  error, so the smoke walk, which fails on page errors only, does not see
 *  it.) */
export function sideClass(side: unknown): string {
  if (side === undefined) return "side-center";
  if (!SIDES.includes(side as Side)) {
    throw new Error(
      `side: ${String(side)} is not a side; use ${SIDES.join(" or ")}`,
    );
  }
  return `side-${String(side)}`;
}

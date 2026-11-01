// The Earth's land for the globe, at Natural Earth's three scales:
// globe/earth.json, which art/earth-data.ts writes. Its types, and a parser
// that checks the file where the globe reads it (docs/globe.md, "The data").

export type LonLat = readonly [number, number];
/** A closed ring of points, without the first point again at its end. */
export type Ring = readonly LonLat[];
/** An outline, then its holes. */
export type Polygon = readonly Ring[];

/** A box of longitude and latitude, in degrees. */
export interface Box {
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}

/** Natural Earth's scales, from the coarsest. */
export const SCALES = ["110m", "50m", "10m"] as const;
export type Scale = (typeof SCALES)[number];

/** One scale's land. A level with boxes has land only near them: in each
 *  box and a margin around it. With none, it has the whole Earth. */
export interface Level {
  readonly scale: Scale;
  readonly boxes: readonly Box[];
  readonly polygons: readonly Polygon[];
}

/** The levels, one for each of SCALES, in its order. */
export interface Earth {
  readonly levels: readonly Level[];
}

function fail(what: string): never {
  throw new Error(`globe/earth.json: ${what}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown, what: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fail(`${what} is not a number`);
  }
  return value;
}

function boxOf(value: unknown, what: string): Box {
  if (!isRecord(value)) return fail(`${what} is not a box`);
  const box = {
    west: finite(value["west"], `${what}.west`),
    east: finite(value["east"], `${what}.east`),
    south: finite(value["south"], `${what}.south`),
    north: finite(value["north"], `${what}.north`),
  };
  if (box.west >= box.east || box.south >= box.north) {
    return fail(`${what} is empty`);
  }
  return box;
}

/** A ring written flat: lon, lat, lon, lat, ... */
function ringOf(value: unknown, what: string): Ring {
  if (!Array.isArray(value) || value.length < 6 || value.length % 2 !== 0) {
    return fail(`${what} is not a flat list of 3 or more points`);
  }
  const ring: LonLat[] = [];
  for (let index = 0; index < value.length; index += 2) {
    const lon = finite(value[index], `${what}[${String(index)}]`);
    const lat = finite(value[index + 1], `${what}[${String(index + 1)}]`);
    if (Math.abs(lon) > 180 || Math.abs(lat) > 90) {
      return fail(`${what} has a point off the Earth: ${String([lon, lat])}`);
    }
    ring.push([lon, lat]);
  }
  return ring;
}

/** The file's JSON as an Earth. Throws, with the place, if it is not one. */
export function parseEarth(json: unknown): Earth {
  if (!isRecord(json) || !Array.isArray(json["levels"])) {
    return fail("no levels");
  }
  const levels: unknown[] = json["levels"];
  if (levels.length !== SCALES.length) {
    return fail(
      `${String(levels.length)} levels, not ${String(SCALES.length)}`,
    );
  }
  return {
    levels: SCALES.map((scale, index): Level => {
      const level = levels[index];
      const what = `levels[${String(index)}]`;
      if (!isRecord(level) || level["scale"] !== scale) {
        return fail(`${what} is not the ${scale} level`);
      }
      const { boxes, polygons } = level;
      if (!Array.isArray(boxes) || !Array.isArray(polygons)) {
        return fail(`${what} has no boxes or polygons`);
      }
      return {
        scale,
        boxes: boxes.map((box: unknown, at) =>
          boxOf(box, `${what}.boxes[${String(at)}]`),
        ),
        polygons: polygons.map((polygon: unknown, at): Polygon => {
          const where = `${what}.polygons[${String(at)}]`;
          if (!Array.isArray(polygon) || polygon.length === 0) {
            return fail(`${where} has no rings`);
          }
          return polygon.map((ring: unknown, ringAt) =>
            ringOf(ring, `${where}[${String(ringAt)}]`),
          );
        }),
      };
    }),
  };
}

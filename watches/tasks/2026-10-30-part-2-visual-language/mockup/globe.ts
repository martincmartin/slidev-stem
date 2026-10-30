// The globe on a canvas, drawn again at each frame: the sea's disc, the land
// of the near side, the coast and the limb. Its detail goes with the zoom,
// as a web map's does: Natural Earth at the scale made for the camera's km
// to a px (LEVELS), and only the shapes on the slide. tools/maps.ts writes
// the data, maps/globe.json. Not an oversight: an SVG of the globe took 42 ms
// a frame in Firefox, and under 1 s in a private window, because Firefox
// draws every path again at each zoom (PLAN.md, section 14).
import { axesOf, SLIDE } from "./geo.ts";
import type { Axes, Box, Camera, Point, Vector } from "./geo.ts";

/** Natural Earth's scales, each with the km to a slide px that it is made
 *  for: 1:110M, 1:50M and 1:10M, at 0.26 mm to a px. The camera draws the
 *  level whose km to a px is nearest its own, on a log scale. */
export const LEVELS = [
  { scale: "110m", kmPerPx: 29 },
  { scale: "50m", kmPerPx: 13 },
  { scale: "10m", kmPerPx: 2.6 },
] as const;
export type Scale = (typeof LEVELS)[number]["scale"];

/** maps/globe.json: for each level of LEVELS, in order, its land's rings
 *  and its coast's lines, each a flat list of longitudes and latitudes. A
 *  level with a box has data only in it; the coarser level draws outside. */
export interface GlobeData {
  readonly levels: readonly {
    readonly scale: Scale;
    readonly box: Box | null;
    readonly land: readonly (readonly number[])[];
    readonly coast: readonly (readonly number[])[];
  }[];
}

/** Slide px: the coast's line, as a story map's (style.css, `.land`). */
export const COAST = 3;
/** Slide px: a point this near the last one drawn is skipped. */
const MIN_GAP = 0.5;
/** Degrees between the points of the limb's arc. */
const ARC_STEP = 2;
/** Degrees: a level's land fills this far past its box, under the coarser
 *  land's edge, so the two fills overlap and no seam of sea shows between
 *  them. The coasts meet at the box. */
const OVERLAP = 0.5;
/** Degrees between the points of a box's outline. */
const BOX_STEP = 1;

/** The colors, from style.css (`.globe`). */
export interface Colours {
  readonly sea: string;
  readonly land: string;
  readonly coast: string;
}

/** A ring or a line, as unit vectors, with the cap that holds it. */
interface Shape {
  /** three numbers a point */
  readonly points: Float64Array;
  /** the cap: its centre, and the cosine of its radius */
  readonly cap: Vector;
  readonly cosRadius: number;
  /** a ring's way round, north up: the land is on its left when it runs
   *  counterclockwise */
  readonly counterclockwise: boolean;
}

interface Level {
  readonly kmPerPx: number;
  readonly land: readonly Shape[];
  readonly coast: readonly Shape[];
  /** where it has data, and that box grown by OVERLAP */
  readonly box: { readonly edge: Shape; readonly grown: Shape } | null;
}

/** Checks globe.json. */
export function globeData(json: unknown): GlobeData {
  const fail = (what: string): never => {
    throw new Error(`globe.json: ${what}`);
  };
  const lists = (value: unknown, name: string): number[][] =>
    Array.isArray(value)
      ? value.map((list: unknown) =>
          Array.isArray(list) &&
          list.length >= 4 &&
          list.length % 2 === 0 &&
          list.every((number: unknown) => typeof number === "number")
            ? (list as number[])
            : fail(`${name}: not a list of longitudes and latitudes`),
        )
      : fail(`${name}: not a list`);
  const box = (value: unknown): Box | null => {
    if (value === null) return null;
    if (
      typeof value === "object" &&
      "west" in value &&
      "east" in value &&
      "south" in value &&
      "north" in value &&
      typeof value.west === "number" &&
      typeof value.east === "number" &&
      typeof value.south === "number" &&
      typeof value.north === "number"
    )
      return {
        west: value.west,
        east: value.east,
        south: value.south,
        north: value.north,
      };
    return fail("a box that is not a box");
  };
  if (
    typeof json !== "object" ||
    json === null ||
    !("levels" in json) ||
    !Array.isArray(json.levels) ||
    json.levels.length !== LEVELS.length
  )
    return fail(`not ${String(LEVELS.length)} levels`);
  return {
    levels: LEVELS.map(({ scale }, index) => {
      const level: unknown = (json.levels as unknown[])[index];
      if (
        typeof level !== "object" ||
        level === null ||
        !("scale" in level) ||
        level.scale !== scale ||
        !("box" in level) ||
        !("land" in level) ||
        !("coast" in level)
      )
        return fail(`level ${String(index)} is not ${scale}`);
      return {
        scale,
        box: box(level.box),
        land: lists(level.land, `${scale} land`),
        coast: lists(level.coast, `${scale} coast`),
      };
    }),
  };
}

const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Twice the signed area of a ring in longitude and latitude: positive when
 *  it runs counterclockwise, with north up. A view of the globe's near side
 *  keeps the sign. */
function shoelace(flat: readonly number[]): number {
  let sum = 0;
  for (let index = 0; index < flat.length; index += 2) {
    const next = (index + 2) % flat.length;
    sum +=
      (flat[index] ?? 0) * (flat[next + 1] ?? 0) -
      (flat[next] ?? 0) * (flat[index + 1] ?? 0);
  }
  return sum;
}

function shape(flat: readonly number[]): Shape {
  const count = flat.length / 2;
  const points = new Float64Array(3 * count);
  const sum = [0, 0, 0];
  for (let index = 0; index < count; index += 1) {
    const lon = ((flat[2 * index] ?? 0) * Math.PI) / 180;
    const lat = ((flat[2 * index + 1] ?? 0) * Math.PI) / 180;
    const values = [
      Math.cos(lat) * Math.cos(lon),
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
    ];
    for (const [axis, value] of values.entries()) {
      points[3 * index + axis] = value;
      sum[axis] = (sum[axis] ?? 0) + value;
    }
  }
  const length = Math.hypot(sum[0] ?? 0, sum[1] ?? 0, sum[2] ?? 0);
  const cap: Vector =
    length > 1e-9
      ? [(sum[0] ?? 0) / length, (sum[1] ?? 0) / length, (sum[2] ?? 0) / length]
      : [0, 0, 1];
  let cosRadius = length > 1e-9 ? 1 : -1;
  for (let index = 0; index < count; index += 1)
    cosRadius = Math.min(
      cosRadius,
      cap[0] * (points[3 * index] ?? 0) +
        cap[1] * (points[3 * index + 1] ?? 0) +
        cap[2] * (points[3 * index + 2] ?? 0),
    );
  return {
    points,
    cap,
    cosRadius,
    counterclockwise: shoelace(flat) > 0,
  };
}

/** A box's outline, clockwise, as a flat list of longitudes and latitudes. */
function outline(box: Box): number[] {
  const flat: number[] = [];
  for (let lon = box.west; lon < box.east; lon += BOX_STEP)
    flat.push(lon, box.north);
  for (let lat = box.north; lat > box.south; lat -= BOX_STEP)
    flat.push(box.east, lat);
  for (let lon = box.east; lon > box.west; lon -= BOX_STEP)
    flat.push(lon, box.south);
  for (let lat = box.south; lat < box.north; lat += BOX_STEP)
    flat.push(box.west, lat);
  return flat;
}

// The near side. Points here are [x, y, z]: slide px from the limb's centre,
// and how far the point faces the camera (below 0: the far side).
type Seen = readonly [number, number, number];

/** Where the segment from a to b crosses the limb, on the limb. */
function limbCrossing(a: Seen, b: Seen, radius: number): Point {
  const t = a[2] / (a[2] - b[2]);
  const x = a[0] + (b[0] - a[0]) * t;
  const y = a[1] + (b[1] - a[1]) * t;
  const length = Math.hypot(x, y);
  return [(x / length) * radius, (y / length) * radius];
}

/** How far along the limb, in radians, from one point on it to another:
 *  counterclockwise (as the slide shows it) or clockwise. */
function limbSweep(from: Point, to: Point, counterclockwise: boolean): number {
  const angle = ([x, y]: Point) => Math.atan2(-y, x);
  const turn = 2 * Math.PI;
  const sweep = counterclockwise
    ? angle(to) - angle(from)
    : angle(from) - angle(to);
  return ((sweep % turn) + turn) % turn;
}

/** The limb's arc from one point on it to another, without its ends. */
function limbArc(
  from: Point,
  to: Point,
  counterclockwise: boolean,
  radius: number,
): Point[] {
  const start = Math.atan2(-from[1], from[0]);
  const sweep =
    limbSweep(from, to, counterclockwise) * (counterclockwise ? 1 : -1);
  const count = Math.ceil(Math.abs(sweep) / ((ARC_STEP * Math.PI) / 180));
  const arc: Point[] = [];
  for (let index = 1; index < count; index += 1) {
    const at = start + (sweep * index) / count;
    arc.push([radius * Math.cos(at), -radius * Math.sin(at)]);
  }
  return arc;
}

/** The near-side parts of a land ring. Where the ring goes behind the
 *  globe, the limb closes it. From where the ring leaves, the arc runs the
 *  way the ring does (the land is on its left as it runs counterclockwise),
 *  to the first place along the limb where the ring comes back. That place
 *  can be on another run of the ring: a coast that dips behind the limb and
 *  comes back makes runs that the ring's order does not join (Australia and
 *  the Americas, seen from 76° W). */
function nearSide(
  points: readonly Seen[],
  counterclockwise: boolean,
  radius: number,
): Point[][] {
  const shown = (index: number) =>
    (points[index % points.length]?.[2] ?? -1) >= 0;
  const back = points.findIndex(
    (_, index) => !shown(index) && shown(index + 1),
  );
  if (back === -1)
    return points.every((_, index) => shown(index))
      ? [points.map(([x, y]) => [x, y])]
      : [];
  // Each run starts where the ring comes back and ends where it leaves.
  const runs: Point[][] = [];
  let run: Point[] = [];
  for (let step = 0; step < points.length; step += 1) {
    const a = points[(back + step) % points.length];
    const b = points[(back + step + 1) % points.length];
    if (a === undefined || b === undefined) continue;
    if (a[2] >= 0) run.push([a[0], a[1]]);
    if (a[2] >= 0 === b[2] >= 0) continue;
    const crossing = limbCrossing(a, b, radius);
    if (a[2] >= 0) {
      run.push(crossing);
      runs.push(run);
    } else run = [crossing];
  }
  const nextRun = (leaves: Point): Point[] => {
    let best: Point[] | undefined;
    let least = Infinity;
    for (const candidate of runs) {
      const [comes] = candidate;
      if (comes === undefined) continue;
      const sweep = limbSweep(leaves, comes, counterclockwise);
      if (sweep < least) [best, least] = [candidate, sweep];
    }
    if (best === undefined) throw new Error("a ring with no run");
    return best;
  };
  const unjoined = new Set(runs);
  const parts: Point[][] = [];
  for (const first of runs) {
    if (!unjoined.has(first)) continue;
    const part: Point[] = [];
    let current = first;
    for (;;) {
      unjoined.delete(current);
      part.push(...current);
      const leaves = current.at(-1);
      if (leaves === undefined) throw new Error("an empty run");
      const next = nextRun(leaves);
      const [comes] = next;
      if (comes === undefined) throw new Error("an empty run");
      part.push(...limbArc(leaves, comes, counterclockwise, radius));
      if (next === first) break;
      if (!unjoined.has(next)) throw new Error("runs that cross");
      current = next;
    }
    parts.push(part);
  }
  return parts;
}

/** The near-side runs of a line. */
function nearRuns(points: readonly Seen[], radius: number): Point[][] {
  const runs: Point[][] = [];
  let run: Point[] = [];
  for (const [index, point] of points.entries()) {
    const previous = points[index - 1];
    if (previous !== undefined && previous[2] >= 0 !== point[2] >= 0) {
      const crossing = limbCrossing(previous, point, radius);
      run.push(crossing);
      if (point[2] < 0) {
        runs.push(run);
        run = [];
      } else run = [crossing];
    }
    if (point[2] >= 0) run.push([point[0], point[1]]);
  }
  runs.push(run);
  return runs.filter((kept) => kept.length >= 2);
}

/** How a shape shows through the axes: not at all (on the far side, or off
 *  the slide), all on the near side, or cut by the limb. */
function sight(axes: Axes, { cap, cosRadius }: Shape): "none" | "near" | "cut" {
  const sinRadius = Math.sqrt(Math.max(0, 1 - cosRadius * cosRadius));
  const facing = dot(axes.z, cap);
  if (cosRadius >= 0 && facing < -sinRadius) return "none";
  // The cap's points are within this many slide px of its centre's.
  const reach = axes.radius * Math.sqrt(Math.max(0, 2 - 2 * cosRadius)) + COAST;
  const x = axes.at[0] + dot(axes.x, cap);
  const y = axes.at[1] + dot(axes.y, cap);
  if (
    x + reach < 0 ||
    x - reach > SLIDE.width ||
    y + reach < 0 ||
    y - reach > SLIDE.height
  )
    return "none";
  return cosRadius >= 0 && facing >= sinRadius ? "near" : "cut";
}

/** Adds a shape's near side to a path (a context's, or a Path2D): a ring's
 *  parts closed along the limb, or a line's runs. */
function trace(
  context: CanvasPath,
  axes: Axes,
  shape: Shape,
  closed: boolean,
): void {
  const how = sight(axes, shape);
  if (how === "none") return;
  const { points } = shape;
  const count = points.length / 3;
  const [ax, ay, az] = axes.x;
  const [bx, by, bz] = axes.y;
  const [atX, atY] = axes.at;
  if (how === "near") {
    let [lastX, lastY] = [0, 0];
    for (let index = 0; index < count; index += 1) {
      const px = points[3 * index] ?? 0;
      const py = points[3 * index + 1] ?? 0;
      const pz = points[3 * index + 2] ?? 0;
      const x = atX + ax * px + ay * py + az * pz;
      const y = atY + bx * px + by * py + bz * pz;
      if (index === 0) context.moveTo(x, y);
      else if (
        index === count - 1 ||
        Math.abs(x - lastX) + Math.abs(y - lastY) >= MIN_GAP
      )
        context.lineTo(x, y);
      else continue;
      [lastX, lastY] = [x, y];
    }
    if (closed) context.closePath();
    return;
  }
  const seen: Seen[] = [];
  for (let index = 0; index < count; index += 1) {
    const direction: Vector = [
      points[3 * index] ?? 0,
      points[3 * index + 1] ?? 0,
      points[3 * index + 2] ?? 0,
    ];
    seen.push([
      dot(axes.x, direction),
      dot(axes.y, direction),
      dot(axes.z, direction),
    ]);
  }
  const parts = closed
    ? nearSide(seen, shape.counterclockwise, axes.radius)
    : nearRuns(seen, axes.radius);
  for (const part of parts) {
    for (const [index, [x, y]] of part.entries()) {
      if (index === 0) context.moveTo(atX + x, atY + y);
      else context.lineTo(atX + x, atY + y);
    }
    if (closed) context.closePath();
  }
}

/** The globe's data, ready to draw at any zoom. */
export class Globe {
  private readonly levels: readonly Level[];

  constructor(data: GlobeData) {
    this.levels = data.levels.map((level, index) => {
      const { box } = level;
      if (box !== null && data.levels[index - 1]?.box !== null)
        throw new Error(
          `the ${level.scale} level has a box, and no coarser level for outside it`,
        );
      return {
        kmPerPx: LEVELS[index]?.kmPerPx ?? 0,
        land: level.land.map(shape),
        coast: level.coast.map(shape),
        box:
          box === null
            ? null
            : {
                edge: shape(outline(box)),
                grown: shape(
                  outline({
                    west: box.west - OVERLAP,
                    east: box.east + OVERLAP,
                    south: box.south - OVERLAP,
                    north: box.north + OVERLAP,
                  }),
                ),
              },
      };
    });
  }

  /** The level that a camera draws, and the level outside its box. */
  private levelsFor(camera: Camera): {
    level: Level;
    coarser: Level | undefined;
  } {
    const nearest = (level: Level) =>
      Math.abs(Math.log(camera.kmPerPx / level.kmPerPx));
    const level = this.levels.reduce((best, each) =>
      nearest(each) < nearest(best) ? each : best,
    );
    return { level, coarser: this.levels[this.levels.indexOf(level) - 1] };
  }

  /** The land that a camera shows, as a path in slide px: to test a point
   *  with `isPointInPath`. A level with a box adds the coarser level's land,
   *  so that the test is right outside the box, and near enough inside it. */
  land(camera: Camera): Path2D {
    const axes = axesOf(camera);
    const { level, coarser } = this.levelsFor(camera);
    const path = new Path2D();
    for (const from of level.box === null || coarser === undefined
      ? [level]
      : [coarser, level])
      for (const ring of from.land) trace(path, axes, ring, true);
    return path;
  }

  /** Draws the globe through a camera, on a context in slide px. */
  draw(
    context: CanvasRenderingContext2D,
    camera: Camera,
    colours: Colours,
  ): void {
    const axes = axesOf(camera);
    const { level, coarser } = this.levelsFor(camera);
    context.clearRect(0, 0, SLIDE.width, SLIDE.height);
    context.lineWidth = COAST;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.fillStyle = colours.sea;
    context.beginPath();
    context.arc(axes.at[0], axes.at[1], axes.radius, 0, 2 * Math.PI);
    context.fill();
    const fill = (from: Level) => {
      context.fillStyle = colours.land;
      context.beginPath();
      for (const ring of from.land) trace(context, axes, ring, true);
      context.fill();
    };
    const stroke = (from: Level) => {
      context.strokeStyle = colours.coast;
      context.beginPath();
      for (const line of from.coast) trace(context, axes, line, false);
      context.stroke();
    };
    const clip = (to: Shape, outside: boolean) => {
      context.beginPath();
      if (outside)
        context.rect(
          -COAST,
          -COAST,
          SLIDE.width + 2 * COAST,
          SLIDE.height + 2 * COAST,
        );
      trace(context, axes, to, true);
      context.clip("evenodd");
    };
    if (level.box === null || coarser === undefined) {
      fill(level);
      stroke(level);
    } else {
      context.save();
      clip(level.box.edge, true);
      fill(coarser);
      stroke(coarser);
      context.restore();
      context.save();
      clip(level.box.grown, false);
      fill(level);
      context.restore();
      context.save();
      clip(level.box.edge, false);
      stroke(level);
      context.restore();
    }
    context.strokeStyle = colours.coast;
    context.beginPath();
    context.arc(axes.at[0], axes.at[1], axes.radius, 0, 2 * Math.PI);
    context.stroke();
  }
}

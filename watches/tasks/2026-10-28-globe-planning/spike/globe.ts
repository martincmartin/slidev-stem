// The globe as a scene for the house renderer (a copy, in webgl/): a sphere
// of faces that hides the far side, its limb, the coast lines, and the
// meridians on the water. With `water`, the sphere is filled and the land is
// a second layer of faces over it, in the paper's colour. No DOM: the tests
// run it in Node.
import earcut, { refine } from "earcut";
import type {
  Colour,
  Group,
  Line,
  LineStyle,
  Mesh,
  Scene,
  SilhouetteEdge,
  Vec3,
  View,
} from "./webgl/scene.ts";
import { INKS } from "./webgl/scene.ts";

export type LonLat = readonly [number, number];
export type Ring = readonly LonLat[];
/** The outline, then its holes. */
export type Polygon = readonly Ring[];

/** World units. The measurements (tools/measure.ts) use the same radius, so
 *  their sags and tolerances hold here. */
export const RADIUS = 500;
/** The talk's slide, in slide px (watch/design.json's canvas): line widths
 *  are in these px, as the watch's are. At scale 0.5 the globe is 500 px
 *  high. */
export const SLIDE: readonly [number, number] = [980, 552];

export interface GlobeOptions {
  /** The grid of the sphere's faces and of the land's cut, in degrees. It
   *  divides 15, so each 15-degree meridian is on a grid line. */
  readonly step: number;
  /** The sphere in the water's wash, and the land over it in the paper's. */
  readonly water: boolean;
  /** Degrees between the meridians. */
  readonly meridianSpacing: number;
  /** What hides the far side: a sphere of flat cells, with its edges as
   *  silhouette edges for the limb; or a disc through the center that faces
   *  the camera (its group's matrix, `discMatrix`), with its rim as the limb.
   *  With an orthographic camera, the disc hides exactly the far hemisphere,
   *  and its rim is the true limb. */
  readonly occluder: "sphere" | "disc";
}

/** The disc's group: its matrix turns the disc to face the camera. */
export const DISC_GROUP: Group = { name: "disc", parent: null };
/** Sides of the disc: its rim is within R(1 - cos(180/N degrees)) of a
 *  circle, 0.02 px at the whole-globe size. */
const DISC_SIDES = 360;

/** The lines' styles. The spike maps the globe's roles onto the renderer's
 *  inks (main.ts): `muted` is the ground (the coast), `mutedWash` the water's
 *  wash, `subject` the limb, `ink` the meridians. */
const COAST: LineStyle = { ink: INKS.muted, opacity: 1, width: 2 };
const LIMB: LineStyle = { ink: INKS.subject, opacity: 1, width: 2.5 };
/** Opaque: a line below 1 darkens where its segments' round ends overlap,
 *  a dot at each joint. The palette makes `ink` lighter instead (main.ts). */
const MERIDIAN: LineStyle = { ink: INKS.ink, opacity: 1, width: 2 };
/** The paper: a fill at opacity 0 is mixed all the way to the paper. */
const PAPER: Colour = { ink: INKS.mutedWash, opacity: 0 };
const WATER: Colour = { ink: INKS.mutedWash, opacity: 1 };

/** A point on the sphere of radius `radius`. East is counterclockwise seen
 *  from above the North Pole, as on the Earth: the slide's y goes down. */
export function toSphere([lon, lat]: LonLat, radius = RADIUS): Vec3 {
  const lambda = (lon * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  return [
    radius * Math.cos(phi) * Math.cos(lambda),
    -radius * Math.cos(phi) * Math.sin(lambda),
    radius * Math.sin(phi),
  ];
}

/** The camera's angles that put (lon, lat) at the middle, facing the
 *  viewer, with north up. */
export function facing([lon, lat]: LonLat): { tilt: number; turn: number } {
  return { tilt: 90 - lat, turn: 90 + lon };
}

/** How far the middle of a chord of `degrees` is under the sphere. */
export function chordSag(degrees: number, radius = RADIUS): number {
  return radius * (1 - Math.cos((degrees * Math.PI) / 360));
}

/** The most that a face of the grid sags: at the middle of a cell on the
 *  equator, half its diagonal from each corner. */
export function cellSag(step: number): number {
  return chordSag(2 * Math.hypot(step / 2, step / 2));
}

// ---------------------------------------------------------------- the data

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function point(value: unknown): LonLat {
  if (!Array.isArray(value) || value.length < 2) throw new Error("not a point");
  const [lon, lat]: unknown[] = value;
  if (typeof lon !== "number" || typeof lat !== "number") throw new Error("not numbers");
  return [lon, lat];
}

function rings(value: unknown): Polygon {
  if (!Array.isArray(value)) throw new Error("not a list of rings");
  return value.map((ring: unknown) => {
    if (!Array.isArray(ring)) throw new Error("not a ring");
    return ring.map(point);
  });
}

/** Natural Earth's land layer (GeoJSON) as polygons. */
export function parseLand(data: unknown): Polygon[] {
  if (!isRecord(data) || !Array.isArray(data["features"])) throw new Error("no features");
  const polygons: Polygon[] = [];
  for (const feature of data["features"] as unknown[]) {
    if (!isRecord(feature) || !isRecord(feature["geometry"])) throw new Error("no geometry");
    const { type, coordinates } = feature["geometry"];
    if (!Array.isArray(coordinates)) throw new Error("no coordinates");
    if (type === "Polygon") polygons.push(rings(coordinates));
    else if (type === "MultiPolygon") for (const item of coordinates as unknown[]) polygons.push(rings(item));
    else throw new Error(`not a polygon: ${String(type)}`);
  }
  return polygons;
}

// ------------------------------------------------------- the coast and water

/** Natural Earth cuts the land along 180 degrees and along the South Pole.
 *  Those edges are cuts, not coasts. */
function isCut([lonA, latA]: LonLat, [lonB, latB]: LonLat): boolean {
  return (Math.abs(lonA) === 180 && lonA === lonB) || (latA <= -89.99 && latB <= -89.99);
}

/** Each ring as coast lines: closed if it has no cut, else the open runs
 *  between its cuts. GeoJSON repeats a ring's first point last. */
export function coastLines(polygons: readonly Polygon[]): { points: LonLat[]; closed: boolean }[] {
  const lines: { points: LonLat[]; closed: boolean }[] = [];
  for (const polygon of polygons) {
    for (const ring of polygon) {
      const count = ring.length - 1; // without the repeated point
      const cutAfter = (index: number): boolean =>
        isCut(ring[index] ?? [0, 0], ring[(index + 1) % count] ?? [0, 0]);
      const first = [...Array(count).keys()].findIndex(cutAfter);
      if (first < 0) {
        lines.push({ points: ring.slice(0, count), closed: true });
        continue;
      }
      // start after a cut, so that no run is split at the ring's start
      let run: LonLat[] = [];
      for (let step = 1; step <= count; step++) {
        const index = (first + step) % count;
        run.push(ring[index] ?? [0, 0]);
        if (cutAfter(index)) {
          if (run.length >= 2) lines.push({ points: run, closed: false });
          run = [];
        }
      }
    }
  }
  return lines;
}

/** The latitudes where the meridian `lon` crosses the rings, from north to
 *  south. */
function crossings(allRings: readonly Ring[], lon: number): number[] {
  const found: number[] = [];
  for (const ring of allRings) {
    for (let index = 0; index + 1 < ring.length; index++) {
      const [lonA, latA] = ring[index] ?? [0, 0];
      const [lonB, latB] = ring[index + 1] ?? [0, 0];
      if (lonA > lon === lonB > lon) continue;
      found.push(latA + ((lon - lonA) / (lonB - lonA)) * (latB - latA));
    }
  }
  return found.sort((a, b) => b - a);
}

/** The meridian's stretches on water, [north, south]: the North Pole is on
 *  water, and each crossing of a coast toggles. */
export function waterStretches(allRings: readonly Ring[], lon: number): [number, number][] {
  // -180 and 180 are the data's cut: take the meridian a hair east of it
  const edges = [90, ...crossings(allRings, Math.abs(lon) === 180 ? -180 + 1e-9 : lon), -90];
  const stretches: [number, number][] = [];
  for (let index = 0; index + 1 < edges.length; index += 2) {
    const north = edges[index] ?? 0;
    const south = edges[index + 1] ?? 0;
    if (north > south) stretches.push([north, south]);
  }
  return stretches;
}

/** The points of a stretch of meridian: its ends, and each grid line
 *  between, so that each segment is at most `step` degrees. */
function meridianPoints(lon: number, [north, south]: [number, number], step: number): Vec3[] {
  const points: Vec3[] = [toSphere([lon, north])];
  for (let lat = Math.floor(north / step) * step; lat > south; lat -= step) {
    if (lat < north) points.push(toSphere([lon, lat]));
  }
  points.push(toSphere([lon, south]));
  return points;
}

// ------------------------------------------------------------- the sphere

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** The outward normal of a cell: its diagonals' cross product. A cell
 *  between two meridians and two parallels is flat. */
function cellNormal(corners: readonly Vec3[]): Vec3 {
  const [a, b, c, d] = corners as [Vec3, Vec3, Vec3, Vec3];
  const normal = cross(subtract(c, a), subtract(d, b));
  const middle = corners.reduce<Vec3>((sum, p) => [sum[0] + p[0], sum[1] + p[1], sum[2] + p[2]], [0, 0, 0]);
  const outward = normal[0] * middle[0] + normal[1] * middle[1] + normal[2] * middle[2] > 0;
  return outward ? normal : [-normal[0], -normal[1], -normal[2]];
}

/** A sphere of flat cells on a grid of `step` degrees, and the cells' edges
 *  as silhouette edges: the limb. */
export function sphere(step: number): { triangles: number[]; edges: SilhouetteEdge[] } {
  const columns = Math.round(360 / step);
  const rows = Math.round(180 / step);
  const at = (column: number, row: number): Vec3 => toSphere([-180 + column * step, -90 + row * step]);
  const normals: Vec3[][] = [];
  const triangles: number[] = [];
  for (let column = 0; column < columns; column++) {
    normals.push([]);
    for (let row = 0; row < rows; row++) {
      const corners = [at(column, row), at(column + 1, row), at(column + 1, row + 1), at(column, row + 1)];
      normals[column]?.push(cellNormal(corners));
      const [a, b, c, d] = corners as [Vec3, Vec3, Vec3, Vec3];
      if (row > 0) triangles.push(...a, ...b, ...c); // the pole's corners are one point
      if (row < rows - 1) triangles.push(...a, ...c, ...d);
    }
  }
  const normal = (column: number, row: number): Vec3 => normals[(column + columns) % columns]?.[row] ?? [0, 0, 1];
  const edges: SilhouetteEdge[] = [];
  for (let column = 0; column < columns; column++) {
    for (let row = 0; row < rows; row++) {
      // the meridian edge on the cell's west side
      edges.push({ start: at(column, row), end: at(column, row + 1), normalBefore: normal(column - 1, row), normalAfter: normal(column, row), style: LIMB });
      // the parallel edge on its south side (not at the pole: a point)
      if (row > 0) {
        edges.push({ start: at(column, row), end: at(column + 1, row), normalBefore: normal(column, row - 1), normalAfter: normal(column, row), style: LIMB });
      }
    }
  }
  return { triangles, edges };
}

/** A disc of radius RADIUS in its own xy plane, as triangles, and its rim. */
export function disc(): { triangles: number[]; rim: Vec3[] } {
  const rim: Vec3[] = [];
  for (let side = 0; side < DISC_SIDES; side++) {
    const angle = (2 * Math.PI * side) / DISC_SIDES;
    rim.push([RADIUS * Math.cos(angle), RADIUS * Math.sin(angle), 0]);
  }
  const triangles: number[] = [];
  rim.forEach((corner, side) => triangles.push(0, 0, 0, ...corner, ...(rim[(side + 1) % DISC_SIDES] ?? corner)));
  return { triangles, rim };
}

/** The disc's matrix (4 x 4, column-major): its z axis along `toCamera`,
 *  about the globe's center. The turn of the disc in its plane does not
 *  matter. */
export function discMatrix(toCamera: Vec3): Float32Array {
  const length = Math.hypot(...toCamera);
  const z: Vec3 = [toCamera[0] / length, toCamera[1] / length, toCamera[2] / length];
  const helper: Vec3 = Math.abs(z[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const xRaw = cross(helper, z);
  const xLength = Math.hypot(...xRaw);
  const x: Vec3 = [xRaw[0] / xLength, xRaw[1] / xLength, xRaw[2] / xLength];
  const y = cross(z, x);
  return Float32Array.from([...x, 0, ...y, 0, ...z, 0, 0, 0, 0, 1]);
}

// --------------------------------------------------------------- the land

type Piece = LonLat[];

/** Where the edge meets the line where coordinate `axis` is `value`: the
 *  same for either order of its ends, so two triangles that share the edge
 *  cut it at the same point. */
function meet(first: LonLat, second: LonLat, axis: 0 | 1, value: number): LonLat {
  const [from, to] = first[0] < second[0] || (first[0] === second[0] && first[1] < second[1]) ? [first, second] : [second, first];
  const along = (value - from[axis]) / (to[axis] - from[axis]);
  const result: [number, number] = [from[0] + along * (to[0] - from[0]), from[1] + along * (to[1] - from[1])];
  result[axis] = value;
  return result;
}

/** A convex piece cut by a grid line: the parts below and above it. */
function cut(piece: Piece, axis: 0 | 1, value: number): Piece[] {
  const below: Piece = [];
  const above: Piece = [];
  piece.forEach((corner, index) => {
    const next = piece[(index + 1) % piece.length] ?? corner;
    if (corner[axis] <= value) below.push(corner);
    if (corner[axis] >= value) above.push(corner);
    if ((corner[axis] < value && next[axis] > value) || (corner[axis] > value && next[axis] < value)) {
      const crossing = meet(corner, next, axis, value);
      below.push(crossing);
      above.push(crossing);
    }
  });
  return [below, above].filter((part) => part.length >= 3);
}

/** A triangle cut along the grid: convex pieces, each in one cell. */
function cutToGrid(triangle: Piece, step: number): Piece[] {
  let pieces = [triangle];
  for (const axis of [0, 1] as const) {
    const values = triangle.map((corner) => corner[axis]);
    const first = Math.floor(Math.min(...values) / step) + 1;
    const last = Math.ceil(Math.max(...values) / step) - 1;
    for (let line = first; line <= last; line++) pieces = pieces.flatMap((piece) => cut(piece, axis, line * step));
  }
  return pieces;
}

/** The land's faces: earcut, its `refine`, then a cut along the sphere's
 *  own grid. Each piece is then inside one cell, and its corners are on the
 *  sphere inside that cell, so the piece is in front of the cell's flat
 *  face, or on it at the cell's edges (an overlay wins there). So the land
 *  needs no lift over the water. A lift would be worse: it leaves a ring
 *  outside the water's limb where nothing hides the far side's coast. */
export function landTriangles(polygons: readonly Polygon[], step: number, radius = RADIUS): number[] {
  const out: number[] = [];
  for (const polygon of polygons) {
    const flat: number[] = [];
    const holes: number[] = [];
    polygon.forEach((ring, index) => {
      if (index > 0) holes.push(flat.length / 2);
      for (const [lon, lat] of ring.slice(0, -1)) flat.push(lon, lat);
    });
    const indices = earcut(flat, holes, 2);
    refine(indices, flat, 2);
    const vertex = (index: number): LonLat => [flat[2 * index] ?? 0, flat[2 * index + 1] ?? 0];
    for (let index = 0; index < indices.length; index += 3) {
      const triangle = [0, 1, 2].map((corner) => vertex(indices[index + corner] ?? 0));
      for (const piece of cutToGrid(triangle, step)) {
        const apex = toSphere(piece[0] ?? [0, 0], radius);
        for (let corner = 1; corner + 1 < piece.length; corner++) {
          out.push(...apex, ...toSphere(piece[corner] ?? [0, 0], radius), ...toSphere(piece[corner + 1] ?? [0, 0], radius));
        }
      }
    }
  }
  return out;
}

// -------------------------------------------------------------- the scene

function mesh(name: string, fill: Colour | null, triangles: number[], lines: Line[], silhouetteEdges: SilhouetteEdge[], lineOrder: number, overlay = false): Mesh {
  return {
    name,
    part: "globe",
    group: null,
    fill,
    holdout: false,
    lineOrder,
    inDrawing: true,
    overlay,
    dynamic: false,
    triangles: new Float32Array(triangles),
    lines,
    silhouetteEdges,
  };
}

export interface GlobeCounts {
  readonly triangles: number;
  readonly lineSegments: number;
  readonly silhouetteEdges: number;
  readonly meridianStretches: number;
  /** ms to make each part. */
  readonly times: Readonly<Record<string, number>>;
}

/** The views of the spike: the globe's center is the pivot, at the
 *  slide's middle. */
export function view(name: string, scale: number): View {
  return { name, scale, shift: [SLIDE[0] / 2, SLIDE[1] / 2], pivot: [0, 0, 0] };
}

export function globeScene(polygons: readonly Polygon[], options: GlobeOptions): { scene: Scene; counts: GlobeCounts } {
  const times: Record<string, number> = {};
  const timed = <T>(name: string, make: () => T): T => {
    const start = performance.now();
    const result = make();
    times[name] = performance.now() - start;
    return result;
  };
  const useDisc = options.occluder === "disc";
  const ball = useDisc ? { triangles: [], edges: [] } : timed("sphere", () => sphere(options.step));
  const plate = useDisc ? disc() : null;
  const coast = timed("coast", () =>
    coastLines(polygons).map(({ points, closed }): Line => ({
      points: points.map((lonLat) => toSphere(lonLat)),
      closed,
      style: COAST,
    })),
  );
  const allRings = polygons.flat();
  const meridians = timed("meridians", () => {
    const lines: Line[] = [];
    for (let lon = -180; lon < 180; lon += options.meridianSpacing) {
      for (const stretch of waterStretches(allRings, lon)) {
        lines.push({ points: meridianPoints(lon, stretch, options.step), closed: false, style: MERIDIAN });
      }
    }
    return lines;
  });
  const land = options.water ? timed("land", () => landTriangles(polygons, options.step)) : [];
  const occluder =
    plate === null
      ? mesh("sphere", options.water ? WATER : PAPER, ball.triangles, [], ball.edges, 0)
      : { ...mesh("disc", options.water ? WATER : PAPER, plate.triangles, [{ points: plate.rim, closed: true, style: LIMB }], [], 0), group: DISC_GROUP };
  const meshes = [
    occluder,
    mesh("meridians", null, [], meridians, [], 1),
    mesh("land", PAPER, land, coast, [], 2, true),
  ];
  const segments = (lines: readonly Line[]): number =>
    lines.reduce((sum, line) => sum + line.points.length - (line.closed ? 0 : 1), 0);
  return {
    scene: { slide: SLIDE, meshes, groups: useDisc ? [DISC_GROUP] : [], views: [], pieces: [] },
    counts: {
      triangles: (occluder.triangles.length + land.length) / 9,
      lineSegments: segments(coast) + segments(meridians) + segments(occluder.lines),
      silhouetteEdges: ball.edges.length,
      meridianStretches: meridians.length,
      times,
    },
  };
}

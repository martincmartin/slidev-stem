// The globe as meshes of the house renderer (docs/globe.md, "The globe"):
// the sea, a disc that faces the camera and so hides the far side; the land
// in the paper, over it; the coast; and the limb, the disc's rim. Each of
// Natural Earth's scales is drawn in its own range of the view's scale
// (`Mesh.scales`), and the finest only in its boxes, with the scale before it
// outside them. No DOM: the tests run it in Node.

import earcut, { refine } from "earcut";
import { INKS } from "../webgl/scene.ts";
import type {
  CameraAngles,
  Colour,
  Group,
  Line,
  LineStyle,
  Mesh,
  Piece,
  Vec3,
} from "../webgl/scene.ts";
import type { Matrix4 } from "../webgl/math.ts";
import type { Box, Earth, Level, LonLat, Polygon, Scale } from "./earth.ts";

/** World units: the globe's radius, and its centre, far from the watch's
 *  parts, so that neither is in the other's views. */
export const RADIUS = 500;
export const CENTRE: Vec3 = [800, 5000, 0];
/** km: the Earth's radius, and the length of a degree of a great circle. */
export const EARTH_RADIUS = 6371;
export const KM_PER_DEGREE = (Math.PI * EARTH_RADIUS) / 180;

/** The km to a slide px that each of Natural Earth's scales is made for, at
 *  0.26 mm to a px. A view draws the scale whose km to a px is nearest its
 *  own, on a log scale. */
export const KM_PER_PX: Readonly<Record<Scale, number>> = {
  "110m": 29,
  "50m": 13,
  "10m": 2.6,
};

/** Degrees: the grid that the land's faces are cut along, so that each face
 *  stays near the sphere at the limb (the globe task, section 13). It
 *  divides 90, so the poles and the equator are on it. */
const GRID_STEP = 3;
/** Sides of the disc: its rim is within R(1 - cos(180/N degrees)) of a
 *  circle, 0.02 px when the globe is 500 px high. */
const DISC_SIDES = 360;

/** The coast is the subject's line, as a story map's; the limb is the
 *  same line. The sea is the water's wash, and the land the paper
 *  (docs/globe.md, "The globe"). */
const COAST: LineStyle = { ink: INKS.subject, opacity: 1, width: 3 };
const SEA: Colour = { ink: INKS.waterWash, opacity: 1 };
const LAND: Colour = { ink: INKS.paper, opacity: 1 };

/** The disc's group: its matrix turns the disc to face the camera. */
export const DISC_GROUP: Group = { name: "the globe's disc", parent: null };

/** The view's scale (slide px for a world unit) at `kmPerPx` km to a px. */
export function scaleOf(kmPerPx: number): number {
  return EARTH_RADIUS / RADIUS / kmPerPx;
}

/** A point on the globe. East is counterclockwise seen from above the North
 *  Pole, as on the Earth: the slide's y goes down. */
export function toSphere([lon, lat]: LonLat): Vec3 {
  const lambda = (lon * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  return [
    CENTRE[0] + RADIUS * Math.cos(phi) * Math.cos(lambda),
    CENTRE[1] - RADIUS * Math.cos(phi) * Math.sin(lambda),
    CENTRE[2] + RADIUS * Math.sin(phi),
  ];
}

/** A camera over the globe: it looks straight down at `centre`, which
 *  shows at the slide point `at`, with `kmPerPx` km to a slide px. */
export interface GlobeCamera {
  readonly name: string;
  readonly centre: LonLat;
  readonly at: readonly [number, number];
  readonly kmPerPx: number;
}

/** Where a place is on the globe seen from straight above `centre`, north
 *  up: km east, and km south (down the slide). */
export function onGlobe(
  [lon, lat]: LonLat,
  [centreLon, centreLat]: LonLat,
): [number, number] {
  const radians = Math.PI / 180;
  const across = (lon - centreLon) * radians;
  const [phi, phiCentre] = [lat * radians, centreLat * radians];
  return [
    EARTH_RADIUS * Math.cos(phi) * Math.sin(across),
    -EARTH_RADIUS *
      (Math.cos(phiCentre) * Math.sin(phi) -
        Math.sin(phiCentre) * Math.cos(phi) * Math.cos(across)),
  ];
}

/** The camera's angles that put a place nearest the viewer, at the globe's
 *  middle on the slide, with north up. */
export function facing([lon, lat]: LonLat): CameraAngles {
  return { tilt: 90 - lat, turn: 90 + lon };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function unit(vector: Vec3): Vec3 {
  const length = Math.hypot(...vector);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

/** The disc's matrix (4 x 4, column-major): its z axis along `toCamera`,
 *  about the globe's centre. The turn of the disc in its own plane does not
 *  matter. With an orthographic camera, the disc hides exactly the far
 *  half of the globe, and its rim is the true limb. */
export function discMatrix(toCamera: Vec3): Matrix4 {
  const z = unit(toCamera);
  const helper: Vec3 = Math.abs(z[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const x = unit(cross(helper, z));
  const y = cross(z, x);
  return Float32Array.from([...x, 0, ...y, 0, ...z, 0, ...CENTRE, 1]);
}

/** The disc of radius RADIUS in its own xy plane, as triangles, and its
 *  rim. */
function disc(): { triangles: number[]; rim: Vec3[] } {
  const rim: Vec3[] = [];
  for (let side = 0; side < DISC_SIDES; side++) {
    const angle = (2 * Math.PI * side) / DISC_SIDES;
    rim.push([RADIUS * Math.cos(angle), RADIUS * Math.sin(angle), 0]);
  }
  const triangles: number[] = [];
  rim.forEach((corner, side) => {
    triangles.push(
      0,
      0,
      0,
      ...corner,
      ...(rim[(side + 1) % DISC_SIDES] ?? corner),
    );
  });
  return { triangles, rim };
}

// ---------------------------------------------------------------- the coast

/** Natural Earth cuts the land along 180 degrees and along the South Pole.
 *  Those edges are cuts, not coasts. */
function isCut([lonA, latA]: LonLat, [lonB, latB]: LonLat): boolean {
  return (
    (Math.abs(lonA) === 180 && lonA === lonB) ||
    (latA <= -89.99 && latB <= -89.99)
  );
}

/** A line of the coast, in degrees. */
export interface CoastLine {
  readonly points: readonly LonLat[];
  readonly closed: boolean;
}

/** Each ring as coast lines: closed if it has no cut, else the open runs
 *  between its cuts. */
export function coastLines(polygons: readonly Polygon[]): CoastLine[] {
  const lines: CoastLine[] = [];
  for (const ring of polygons.flat()) {
    const count = ring.length;
    const point = (index: number): LonLat => ring[index % count] ?? [0, 0];
    const cutAfter = (index: number): boolean =>
      isCut(point(index), point(index + 1));
    const first = [...Array(count).keys()].findIndex(cutAfter);
    if (first < 0) {
      lines.push({ points: ring, closed: true });
      continue;
    }
    // start after a cut, so that no run is split at the ring's start
    let run: LonLat[] = [];
    for (let step = 1; step <= count; step++) {
      const index = first + step;
      run.push(point(index));
      if (cutAfter(index)) {
        if (run.length >= 2) lines.push({ points: run, closed: false });
        run = [];
      }
    }
  }
  return lines;
}

function inBox([lon, lat]: LonLat, box: Box): boolean {
  return (
    lon >= box.west && lon <= box.east && lat >= box.south && lat <= box.north
  );
}

const inBoxes = (point: LonLat, boxes: readonly Box[]): boolean =>
  boxes.some((box) => inBox(point, box));

const between = (from: LonLat, to: LonLat, along: number): LonLat => [
  from[0] + (to[0] - from[0]) * along,
  from[1] + (to[1] - from[1]) * along,
];

/** The parts of the coast inside the boxes (`inside`), or outside them all.
 *  Each segment is split where it crosses a box's edge, and each part is
 *  kept or left out by its middle. */
export function coastIn(
  lines: readonly CoastLine[],
  boxes: readonly Box[],
  inside: boolean,
): CoastLine[] {
  if (boxes.length === 0) return inside ? [] : [...lines];
  const edges = boxes.flatMap(
    (box) =>
      [
        [0, box.west],
        [0, box.east],
        [1, box.south],
        [1, box.north],
      ] as const,
  );
  const kept: CoastLine[] = [];
  for (const { points, closed } of lines) {
    const runs: LonLat[][] = [];
    let run: LonLat[] = [];
    const end = (): void => {
      if (run.length >= 2) runs.push(run);
      run = [];
    };
    let whole = true;
    const segments = closed ? points.length : points.length - 1;
    for (let index = 0; index < segments; index++) {
      const from = points[index] ?? [0, 0];
      const to = points[(index + 1) % points.length] ?? from;
      const alongs = [0, 1];
      for (const [axis, value] of edges) {
        const span = to[axis] - from[axis];
        const along = span === 0 ? -1 : (value - from[axis]) / span;
        if (along > 0 && along < 1) alongs.push(along);
      }
      alongs.sort((a, b) => a - b);
      for (let part = 0; part + 1 < alongs.length; part++) {
        const start = alongs[part] ?? 0;
        const stop = alongs[part + 1] ?? 1;
        if (inBoxes(between(from, to, (start + stop) / 2), boxes) === inside) {
          if (run.length === 0) run.push(between(from, to, start));
          run.push(between(from, to, stop));
        } else {
          whole = false;
          end();
        }
      }
    }
    end();
    if (whole) kept.push({ points, closed });
    else kept.push(...runs.map((points) => ({ points, closed: false })));
  }
  return kept;
}

// ----------------------------------------------------------------- the land

type Piece2 = LonLat[];

/** Where the edge meets the line where coordinate `axis` is `value`: the
 *  same for either order of its ends, so two pieces that share the edge cut
 *  it at the same point. */
function meet(
  first: LonLat,
  second: LonLat,
  axis: 0 | 1,
  value: number,
): LonLat {
  const [from, to] =
    first[0] < second[0] || (first[0] === second[0] && first[1] < second[1])
      ? [first, second]
      : [second, first];
  const along = (value - from[axis]) / (to[axis] - from[axis]);
  const result: [number, number] = [
    from[0] + along * (to[0] - from[0]),
    from[1] + along * (to[1] - from[1]),
  ];
  result[axis] = value;
  return result;
}

/** A convex piece cut by a line of the grid: the parts below and above. */
function cut(piece: Piece2, axis: 0 | 1, value: number): Piece2[] {
  const below: Piece2 = [];
  const above: Piece2 = [];
  piece.forEach((corner, index) => {
    const next = piece[(index + 1) % piece.length] ?? corner;
    if (corner[axis] <= value) below.push(corner);
    if (corner[axis] >= value) above.push(corner);
    if (
      (corner[axis] < value && next[axis] > value) ||
      (corner[axis] > value && next[axis] < value)
    ) {
      const crossing = meet(corner, next, axis, value);
      below.push(crossing);
      above.push(crossing);
    }
  });
  return [below, above].filter((part) => part.length >= 3);
}

/** A triangle cut along the grid, and along `lines` (longitudes, then
 *  latitudes): convex pieces, each in one cell and on one side of each
 *  line. */
function cutToGrid(
  triangle: Piece2,
  lines: readonly [readonly number[], readonly number[]],
): Piece2[] {
  let pieces = [triangle];
  for (const axis of [0, 1] as const) {
    const values = triangle.map((corner) => corner[axis]);
    const [low, high] = [Math.min(...values), Math.max(...values)];
    const grid: number[] = [];
    const first = Math.floor(low / GRID_STEP) + 1;
    const last = Math.ceil(high / GRID_STEP) - 1;
    for (let line = first; line <= last; line++) grid.push(line * GRID_STEP);
    const extra = lines[axis].filter((value) => value > low && value < high);
    for (const value of [...grid, ...extra]) {
      pieces = pieces.flatMap((piece) => cut(piece, axis, value));
    }
  }
  return pieces;
}

/** The land as convex pieces in degrees: earcut, its `refine`, then a cut
 *  along the grid and along the edges of `boxes`, so that each piece is
 *  inside a box or outside them all. With no lift: every piece of the near
 *  half is in front of the disc. */
export function landPieces(
  polygons: readonly Polygon[],
  boxes: readonly Box[],
): Piece2[] {
  const lines: [number[], number[]] = [
    boxes.flatMap((box) => [box.west, box.east]),
    boxes.flatMap((box) => [box.south, box.north]),
  ];
  const pieces: Piece2[] = [];
  for (const polygon of polygons) {
    const flat: number[] = [];
    const holes: number[] = [];
    polygon.forEach((ring, index) => {
      if (index > 0) holes.push(flat.length / 2);
      for (const [lon, lat] of ring) flat.push(lon, lat);
    });
    const indices = earcut(flat, holes, 2);
    refine(indices, flat, 2);
    const vertex = (index: number): LonLat => [
      flat[2 * index] ?? 0,
      flat[2 * index + 1] ?? 0,
    ];
    for (let index = 0; index < indices.length; index += 3) {
      const triangle = [0, 1, 2].map((corner) =>
        vertex(indices[index + corner] ?? 0),
      );
      pieces.push(...cutToGrid(triangle, lines));
    }
  }
  return pieces;
}

function middleOf(piece: Piece2): LonLat {
  const sum = piece.reduce<[number, number]>(
    (total, [lon, lat]) => [total[0] + lon, total[1] + lat],
    [0, 0],
  );
  return [sum[0] / piece.length, sum[1] / piece.length];
}

/** The pieces on the sphere, as a fan of triangles each. */
function triangles(pieces: readonly Piece2[]): Float32Array {
  const out: number[] = [];
  for (const piece of pieces) {
    const apex = toSphere(piece[0] ?? [0, 0]);
    for (let corner = 1; corner + 1 < piece.length; corner++) {
      out.push(
        ...apex,
        ...toSphere(piece[corner] ?? [0, 0]),
        ...toSphere(piece[corner + 1] ?? [0, 0]),
      );
    }
  }
  return new Float32Array(out);
}

// ---------------------------------------------------------------- the meshes

/** The range of the view's scale in which each level is drawn: from the
 *  coarsest, each up to where the next one's km to a px is nearer. */
export function scaleRanges(
  scales: readonly Scale[],
): ReadonlyMap<Scale, readonly [number, number]> {
  const ranges = new Map<Scale, readonly [number, number]>();
  scales.forEach((scale, index) => {
    const edge = (other: Scale | undefined): number =>
      other === undefined
        ? Infinity
        : scaleOf(Math.sqrt(KM_PER_PX[scale] * KM_PER_PX[other]));
    const coarser = scales[index - 1];
    ranges.set(scale, [
      coarser === undefined ? 0 : edge(coarser),
      edge(scales[index + 1]),
    ]);
  });
  return ranges;
}

function landMesh(
  name: string,
  pieces: readonly Piece2[],
  coast: readonly CoastLine[],
  scales: readonly [number, number],
): Mesh {
  return {
    name,
    part: "globe",
    group: null,
    fill: LAND,
    holdout: false,
    lineOrder: 1,
    inDrawing: false,
    overlay: true,
    dynamic: false,
    scales,
    triangles: triangles(pieces),
    lines: coast.map(({ points, closed }): Line => ({
      points: points.map(toSphere),
      closed,
      style: COAST,
    })),
    silhouetteEdges: [],
  };
}

/** The globe's meshes, and its piece: `globe`, which `art: all` leaves
 *  out. A level with boxes has land only near them: it is drawn in them,
 *  and the level before it outside them, at its scales and at its own. */
export function globeMeshes(earth: Earth): { meshes: Mesh[]; piece: Piece } {
  const { triangles: discTriangles, rim } = disc();
  const sea: Mesh = {
    name: "the sea",
    part: "globe",
    group: DISC_GROUP,
    fill: SEA,
    holdout: false,
    lineOrder: 0,
    inDrawing: false,
    overlay: false,
    dynamic: false,
    triangles: new Float32Array(discTriangles),
    lines: [{ points: rim, closed: true, style: COAST }],
    silhouetteEdges: [],
  };
  const ranges = scaleRanges(earth.levels.map((level) => level.scale));
  const rangeOf = (level: Level | undefined): readonly [number, number] => {
    const range = level && ranges.get(level.scale);
    if (!range) throw new Error("a level without a range");
    return range;
  };
  const meshes: Mesh[] = [sea];
  earth.levels.forEach((level, index) => {
    const finer = earth.levels[index + 1];
    const own = rangeOf(level);
    const boxes = finer?.boxes ?? [];
    const pieces = landPieces(level.polygons, [...boxes, ...level.boxes]);
    const coast = coastLines(level.polygons);
    const label = `land 1:${level.scale}`;
    if (level.boxes.length > 0) {
      if (index === 0)
        throw new Error(`${label} has boxes and no level before it`);
      const inside = pieces.filter((piece) =>
        inBoxes(middleOf(piece), level.boxes),
      );
      meshes.push(
        landMesh(label, inside, coastIn(coast, level.boxes, true), own),
      );
      return;
    }
    if (boxes.length === 0 || finer === undefined) {
      meshes.push(landMesh(label, pieces, coast, own));
      return;
    }
    const near = pieces.filter((piece) => inBoxes(middleOf(piece), boxes));
    const away = pieces.filter((piece) => !inBoxes(middleOf(piece), boxes));
    meshes.push(
      landMesh(
        `${label} near the stories`,
        near,
        coastIn(coast, boxes, true),
        own,
      ),
      landMesh(
        `${label} away from the stories`,
        away,
        coastIn(coast, boxes, false),
        [own[0], rangeOf(finer)[1]],
      ),
    );
  });
  return {
    meshes,
    piece: { name: "globe", meshes: new Set(meshes), inAll: false },
  };
}

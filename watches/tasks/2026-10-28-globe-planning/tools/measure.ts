// Measures Natural Earth's coastlines and land at 1:110m, 1:50m and 1:10m for
// a globe drawn by the watches talk's renderer: counts, segment lengths, two
// islands, the meridians on water, and the land triangulated by earcut at
// load, with its time and how far its triangles sag below the sphere.
//   node tasks/2026-10-28-globe-planning/tools/measure.ts [--step DEGREES] NE_DIR OUT_JSON
// Run it from the talk's directory, so that `earcut` resolves to the talk's
// copy. NE_DIR holds ne_{110m,50m,10m}_{coastline,land}.geojson.
import earcut, { deviation, refine } from "earcut";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { gzipSync } from "node:zlib";

/** The globe's radius in world units (slide px at scale 1): a whole globe
 *  about 1,000 px high on the 1920 x 1080 slide. */
const RADIUS = 500;
/** `HIDDEN_LINE_TOLERANCE` in watches/webgl/renderer.ts, world units. */
const TOLERANCE = 0.25;
/** For the `steiner` triangulation: the spacing of the extra points inside
 *  the land, and the longest ring edge before it is split, in degrees. */
const STEINER_STEP = 2;
/** For the `grid` triangulation: the default spacing of the grid lines, in
 *  degrees. It divides 15, so the meridians every 15 degrees are on grid
 *  lines. */
const STEP = 1.5;
const SCALES = ["110m", "50m", "10m"] as const;
const MERIDIAN_SPACING = 15;

type LonLat = readonly [number, number];
type Ring = readonly LonLat[];
type Polygon = readonly Ring[]; // the outline, then its holes

interface Region {
  readonly name: string;
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}

const REGIONS: readonly Region[] = [
  { name: "Isles of Scilly", west: -6.5, east: -6.2, south: 49.85, north: 50.0 },
  { name: "Land's End to the Lizard", west: -5.8, east: -5.0, south: 49.9, north: 50.2 },
  { name: "Robinson Crusoe Island", west: -79.0, east: -78.7, south: -33.75, north: -33.55 },
  { name: "Alejandro Selkirk Island", west: -80.85, east: -80.7, south: -33.82, north: -33.7 },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function lonLat(value: unknown, where: string): LonLat {
  if (!Array.isArray(value) || value.length < 2) throw new Error(`${where}: not a point`);
  const [lon, lat]: unknown[] = value;
  if (typeof lon !== "number" || typeof lat !== "number") throw new Error(`${where}: not numbers`);
  return [lon, lat];
}

function ring(value: unknown, where: string): Ring {
  if (!Array.isArray(value)) throw new Error(`${where}: not a list of points`);
  return value.map((point, index) => lonLat(point, `${where}[${String(index)}]`));
}

function polygon(value: unknown, where: string): Polygon {
  if (!Array.isArray(value)) throw new Error(`${where}: not a list of rings`);
  return value.map((item, index) => ring(item, `${where}[${String(index)}]`));
}

/** Each feature's geometry, as LineStrings or Polygons. */
async function readGeometries(path: string): Promise<{ lines: Ring[]; polygons: Polygon[] }> {
  const data: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!isRecord(data) || !Array.isArray(data["features"])) throw new Error(`${path}: no features`);
  const lines: Ring[] = [];
  const polygons: Polygon[] = [];
  data["features"].forEach((feature: unknown, index) => {
    const where = `${path} feature ${String(index)}`;
    if (!isRecord(feature) || !isRecord(feature["geometry"])) throw new Error(`${where}: no geometry`);
    const { type, coordinates } = feature["geometry"];
    if (!Array.isArray(coordinates)) throw new Error(`${where}: no coordinates`);
    if (type === "LineString") lines.push(ring(coordinates, where));
    else if (type === "MultiLineString") coordinates.forEach((item: unknown) => lines.push(ring(item, where)));
    else if (type === "Polygon") polygons.push(polygon(coordinates, where));
    else if (type === "MultiPolygon") coordinates.forEach((item: unknown) => polygons.push(polygon(item, where)));
    else throw new Error(`${where}: unknown type ${String(type)}`);
  });
  return { lines, polygons };
}

function toSphere([lon, lat]: LonLat): [number, number, number] {
  const lambda = (lon * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  return [RADIUS * Math.cos(phi) * Math.cos(lambda), RADIUS * Math.cos(phi) * Math.sin(lambda), RADIUS * Math.sin(phi)];
}

/** The angle between two points on the sphere, in degrees. */
function arc(first: LonLat, second: LonLat): number {
  const [ax, ay, az] = toSphere(first);
  const [bx, by, bz] = toSphere(second);
  const cosine = (ax * bx + ay * by + az * bz) / RADIUS ** 2;
  return (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI;
}

/** How far the middle of a chord of `degrees` is below the sphere. */
function chordSag(degrees: number): number {
  return RADIUS * (1 - Math.cos((degrees * Math.PI) / 360));
}

function quantile(sorted: readonly number[], fraction: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))] ?? 0;
}

/** The latitudes where the meridian `lon` crosses the rings, from north to
 *  south. */
function crossings(rings: readonly Ring[], lon: number): number[] {
  const found: number[] = [];
  for (const points of rings) {
    for (let index = 0; index + 1 < points.length; index++) {
      const [lonA, latA] = points[index] ?? [0, 0];
      const [lonB, latB] = points[index + 1] ?? [0, 0];
      if (lonA > lon === lonB > lon) continue;
      found.push(latA + ((lon - lonA) / (lonB - lonA)) * (latB - latA));
    }
  }
  return found.sort((a, b) => b - a);
}

/** The meridian's stretches on water, [north, south] in degrees of latitude:
 *  the North Pole is on water, and each crossing of a coast toggles. */
function waterStretches(allRings: readonly Ring[], lon: number): [number, number][] {
  const edges = [90, ...crossings(allRings, lon), -90];
  const stretches: [number, number][] = [];
  for (let index = 0; index + 1 < edges.length; index += 2) {
    const north = edges[index] ?? 0;
    const south = edges[index + 1] ?? 0;
    if (north > south) stretches.push([north, south]);
  }
  return stretches;
}

/** Splits each edge longer than `step` degrees of longitude or latitude. */
function splitRing(points: Ring, step: number): LonLat[] {
  const out: LonLat[] = [];
  for (let index = 0; index + 1 < points.length; index++) {
    const [lonA, latA] = points[index] ?? [0, 0];
    const [lonB, latB] = points[index + 1] ?? [0, 0];
    const parts = Math.max(1, Math.ceil(Math.max(Math.abs(lonB - lonA), Math.abs(latB - latA)) / step));
    for (let part = 0; part < parts; part++) {
      out.push([lonA + ((lonB - lonA) * part) / parts, latA + ((latB - latA) * part) / parts]);
    }
  }
  return out; // GeoJSON repeats the first point last; earcut needs it once
}

interface Triangulation {
  readonly triangles: number;
  readonly milliseconds: number;
  /** How far the worst triangle's centroid is below the sphere. */
  readonly worstSag: number;
  readonly overTolerance: number;
  /** The largest of earcut's `deviation` over the polygons: the relative
   *  difference between the triangles' area and the polygon's. */
  readonly worstDeviation: number;
}

type Piece = LonLat[];

/** Where the edge from `first` to `second` meets the line where coordinate
 *  `axis` is `value`. The same for either order of the two points, so two
 *  triangles that share the edge get the same point, and no crack. */
function meet(first: LonLat, second: LonLat, axis: 0 | 1, value: number): LonLat {
  const [from, to] = first[0] < second[0] || (first[0] === second[0] && first[1] < second[1]) ? [first, second] : [second, first];
  const along = (value - from[axis]) / (to[axis] - from[axis]);
  const point: [number, number] = [from[0] + along * (to[0] - from[0]), from[1] + along * (to[1] - from[1])];
  point[axis] = value;
  return point;
}

/** A convex piece cut by the line where coordinate `axis` is `value`: the
 *  parts below and above it (either may be empty). */
function cut(piece: Piece, axis: 0 | 1, value: number): [Piece, Piece] {
  const below: Piece = [];
  const above: Piece = [];
  piece.forEach((point, index) => {
    const next = piece[(index + 1) % piece.length] ?? point;
    if (point[axis] <= value) below.push(point);
    if (point[axis] >= value) above.push(point);
    if ((point[axis] < value && next[axis] > value) || (point[axis] > value && next[axis] < value)) {
      const crossing = meet(point, next, axis, value);
      below.push(crossing);
      above.push(crossing);
    }
  });
  return [below.length >= 3 ? below : [], above.length >= 3 ? above : []];
}

/** A triangle cut along the grid lines every `step` degrees: convex pieces,
 *  each inside one cell of the grid. */
function cutToGrid(triangle: Piece, step: number): Piece[] {
  let pieces = [triangle];
  for (const axis of [0, 1] as const) {
    const values = triangle.map((point) => point[axis]);
    const first = Math.floor(Math.min(...values) / step) + 1;
    const last = Math.ceil(Math.max(...values) / step) - 1;
    for (let line = first; line <= last; line++) {
      pieces = pieces.flatMap((piece) => cut(piece, axis, line * step).filter((part) => part.length > 0));
    }
  }
  return pieces;
}

/** How far the centroid of the triangle is below the sphere. */
function sag(corners: readonly LonLat[]): number {
  const sum = [0, 0, 0];
  for (const corner of corners) toSphere(corner).forEach((value, index) => (sum[index] = (sum[index] ?? 0) + value / 3));
  return RADIUS - Math.hypot(...sum);
}

/** Earcut on each polygon in longitude and latitude, and each triangle on
 *  the sphere. `steiner`: with a point every `step` degrees inside the
 *  polygon and its long edges split first. `grid`: each triangle is cut
 *  along the grid lines every `step` degrees afterwards, and each convex
 *  piece is a fan. `refined`: earcut's `refine` flips the edges toward a
 *  constrained Delaunay triangulation before the sag or the cut. */
function triangulate(polygons: readonly Polygon[], step: number, method: "steiner" | "grid", refined: boolean): Triangulation {
  let triangles = 0;
  let worstSag = 0;
  let overTolerance = 0;
  let worstDeviation = 0;
  const count = (corners: readonly LonLat[]): void => {
    const depth = sag(corners);
    triangles++;
    worstSag = Math.max(worstSag, depth);
    if (depth > TOLERANCE) overTolerance++;
  };
  const start = performance.now();
  for (const rings of polygons) {
    const flat: number[] = [];
    const holes: number[] = [];
    rings.forEach((points, index) => {
      if (index > 0) holes.push(flat.length / 2);
      const kept = method === "steiner" ? splitRing(points, step) : points.slice(0, -1);
      for (const [lon, lat] of kept) flat.push(lon, lat);
    });
    if (method === "steiner") {
      const lons = rings[0]?.map(([lon]) => lon) ?? [];
      const west = Math.ceil(Math.min(...lons) / step) * step;
      const east = Math.max(...lons);
      for (let lon = west; lon <= east; lon += step) {
        const edges = crossings(rings, lon + 1e-9);
        for (let index = 0; index + 1 < edges.length; index += 2) {
          const north = edges[index] ?? 0;
          const south = edges[index + 1] ?? 0;
          for (let lat = Math.floor(north / step) * step; lat > south; lat -= step) {
            if (north - lat < step / 4 || lat - south < step / 4) continue; // too near the coast
            holes.push(flat.length / 2); // a hole of one point: a Steiner point
            flat.push(lon, lat);
          }
        }
      }
    }
    const indices = earcut(flat, holes, 2);
    if (refined) refine(indices, flat, 2);
    worstDeviation = Math.max(worstDeviation, deviation(flat, holes, 2, indices));
    const point = (vertex: number): LonLat => [flat[2 * vertex] ?? 0, flat[2 * vertex + 1] ?? 0];
    for (let index = 0; index < indices.length; index += 3) {
      const triangle = [0, 1, 2].map((corner) => point(indices[index + corner] ?? 0));
      if (method === "steiner") count(triangle);
      else
        for (const piece of cutToGrid(triangle, step)) {
          const apex = piece[0] ?? [0, 0];
          for (let corner = 1; corner + 1 < piece.length; corner++) count([apex, piece[corner] ?? apex, piece[corner + 1] ?? apex]);
        }
    }
  }
  return { triangles, milliseconds: performance.now() - start, worstSag, overTolerance, worstDeviation };
}

function inside(region: Region, [lon, lat]: LonLat): boolean {
  return lon >= region.west && lon <= region.east && lat >= region.south && lat <= region.north;
}

/** The bytes of the coastline as Float32 longitude and latitude, raw and
 *  gzipped. */
function sizes(lines: readonly Ring[]): { float32: number; float32Gzip: number } {
  const values = new Float32Array(lines.flatMap((points) => points.flatMap(([lon, lat]) => [lon, lat])));
  const bytes = new Uint8Array(values.buffer);
  return { float32: bytes.length, float32Gzip: gzipSync(bytes, { level: 9 }).length };
}

async function measure(directory: string, scale: string, step: number): Promise<Record<string, unknown>> {
  const coast = await readGeometries(join(directory, `ne_${scale}_coastline.geojson`));
  const land = await readGeometries(join(directory, `ne_${scale}_land.geojson`));
  const segments = coast.lines.flatMap((points) => points.slice(1).map((point, index) => arc(points[index] ?? point, point)));
  segments.sort((a, b) => a - b);
  const longestLine = (2 * Math.acos(1 - TOLERANCE / RADIUS) * 180) / Math.PI;
  const allRings = land.polygons.flat();
  const meridians = [];
  for (let lon = -180; lon < 180; lon += MERIDIAN_SPACING) {
    // -180 is the cut of the data: take the meridian a hair east of it
    const stretches = waterStretches(allRings, lon === -180 ? -180 + 1e-9 : lon);
    meridians.push({ lon, stretches: stretches.length, waterDegrees: stretches.reduce((sum, [north, south]) => sum + north - south, 0) });
  }
  return {
    scale,
    coastline: {
      lines: coast.lines.length,
      vertices: coast.lines.reduce((sum, points) => sum + points.length, 0),
      segments: segments.length,
      segmentDegrees: { median: quantile(segments, 0.5), p99: quantile(segments, 0.99), max: segments.at(-1) ?? 0 },
      longestLineDegrees: longestLine,
      segmentsOverLongest: segments.filter((degrees) => degrees > longestLine).length,
      worstLineSag: chordSag(segments.at(-1) ?? 0),
      ...sizes(coast.lines),
    },
    land: {
      polygons: land.polygons.length,
      rings: allRings.length,
      vertices: allRings.reduce((sum, points) => sum + points.length, 0),
      steiner: triangulate(land.polygons, STEINER_STEP, "steiner", false),
      steinerRefined: triangulate(land.polygons, STEINER_STEP, "steiner", true),
      grid: triangulate(land.polygons, step, "grid", false),
      gridRefined: triangulate(land.polygons, step, "grid", true),
    },
    regions: REGIONS.map((region) => {
      const lines = coast.lines.filter((points) => points.some((point) => inside(region, point)));
      return { name: region.name, lines: lines.length, vertices: lines.reduce((sum, points) => sum + points.filter((point) => inside(region, point)).length, 0) };
    }),
    meridians: {
      count: meridians.length,
      stretches: meridians.reduce((sum, meridian) => sum + meridian.stretches, 0),
      each: meridians,
    },
  };
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { step: { type: "string" } } });
  const [directory, output] = positionals;
  const step = values.step === undefined ? STEP : Number(values.step);
  if (positionals.length !== 2 || directory === undefined || output === undefined || !(step > 0)) {
    console.error("usage: node measure.ts [--step DEGREES] NE_DIR OUT_JSON");
    process.exitCode = 2;
  } else {
    const results = [];
    for (const scale of SCALES) results.push(await measure(directory, scale, step));
    await writeFile(output, `${JSON.stringify({ radius: RADIUS, tolerance: TOLERANCE, steinerStep: STEINER_STEP, step, results }, null, 2)}\n`);
    for (const result of results) {
      console.log(JSON.stringify(result, (key, value: unknown) => (key === "each" ? undefined : value), 1));
    }
  }
}

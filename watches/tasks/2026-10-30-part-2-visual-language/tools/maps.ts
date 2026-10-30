// Draws the mockup's maps from Natural Earth. A story's map is an SVG at
// the slide's size: the sea, the land with its coast, and the islands that
// the picture shows later (MapView.islands), from 1:10m land. The globe's
// data (globe.json) has the land and the coast at each level of
// mockup/globe.ts (LEVELS): 1:110m and 1:50m for the whole Earth, and 1:10m
// near the story (FINE). In watches/:
//   node tasks/2026-10-30-part-2-visual-language/tools/maps.ts NE_DIR
// NE_DIR holds ne_{110m,50m,10m}_{land,coastline}.geojson (the globe task's
// tools/fetch.sh). The results go to mockup/maps/. Each story map carries the
// camera that shows the globe as the map shows it (data-camera); it prints
// how far the map's coast is from the globe's through that camera.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  ANSON,
  cameraFor,
  KM_PER_DEGREE,
  NEW_ENGLAND,
  NOIR,
  onGlobe,
  project,
  seen,
  SLIDE,
} from "../mockup/geo.ts";
import type { Box, Camera, LonLat, MapView, Point } from "../mockup/geo.ts";
import { LEVELS } from "../mockup/globe.ts";
import type { GlobeData, Scale } from "../mockup/globe.ts";

/** Slide px outside the slide where the land is cut: the cut's edges do not
 *  show, so its stroke is only the coast. */
const MARGIN = 20;
/** Drop a point closer than this (slide px) to the last kept one. */
const MIN_STEP = 0.4;

type Ring = readonly LonLat[];

/** Where the 10m level has data: near the story, so that globe.json stays
 *  small. At 10m's zooms the 50m level draws outside it (mockup/globe.ts).
 *  The data is cut at FINE's margin, outside the box. */
const FINE: Box = { west: -100, east: -50, south: -62, north: -12 };
const FINE_MARGIN = 2;

/** How each level is written: decimals of a degree (0.01° is 1.1 km), km
 *  between kept points (0: every point), and the box of its data (null:
 *  the whole Earth). */
const WRITE: Readonly<
  Record<
    Scale,
    {
      readonly decimals: number;
      readonly step: number;
      readonly box: Box | null;
    }
  >
> = {
  "110m": { decimals: 2, step: 0, box: null },
  "50m": { decimals: 2, step: 0, box: null },
  "10m": { decimals: 3, step: 0.5, box: FINE },
};

/** The features' geometries of a GeoJSON FeatureCollection. */
function geometries(json: unknown): { type: unknown; coordinates: unknown }[] {
  if (
    typeof json !== "object" ||
    json === null ||
    !("features" in json) ||
    !Array.isArray(json.features)
  ) {
    throw new Error("not a GeoJSON FeatureCollection");
  }
  const found: { type: unknown; coordinates: unknown }[] = [];
  for (const feature of json.features as unknown[]) {
    if (
      typeof feature !== "object" ||
      feature === null ||
      !("geometry" in feature)
    )
      continue;
    const geometry = feature.geometry;
    if (
      typeof geometry === "object" &&
      geometry !== null &&
      "type" in geometry &&
      "coordinates" in geometry
    )
      found.push(geometry);
  }
  return found;
}

/** The lines of a coastline file. */
function lines(json: unknown): Ring[] {
  const found: Ring[] = [];
  for (const { type, coordinates } of geometries(json)) {
    const parts =
      type === "LineString"
        ? [coordinates]
        : type === "MultiLineString"
          ? coordinates
          : [];
    if (!Array.isArray(parts)) continue;
    for (const part of parts as unknown[])
      if (Array.isArray(part)) found.push(part as Ring);
  }
  return found;
}

function rings(json: unknown): Ring[] {
  const found: Ring[] = [];
  for (const geometry of geometries(json)) {
    const polygons =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates
          : [];
    if (!Array.isArray(polygons)) continue;
    for (const polygon of polygons as unknown[]) {
      if (!Array.isArray(polygon)) continue;
      for (const ring of polygon as unknown[]) {
        if (Array.isArray(ring)) found.push(ring as Ring);
      }
    }
  }
  return found;
}

/** Sutherland–Hodgman: the part of a closed ring inside one half-plane. */
function clipEdge(
  points: readonly Point[],
  inside: (point: Point) => boolean,
  cross: (from: Point, to: Point) => Point,
): Point[] {
  const kept: Point[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const previous = points[(index + points.length - 1) % points.length];
    if (current === undefined || previous === undefined) continue;
    if (inside(current)) {
      if (!inside(previous)) kept.push(cross(previous, current));
      kept.push(current);
    } else if (inside(previous)) {
      kept.push(cross(previous, current));
    }
  }
  return kept;
}

function clip(points: readonly Point[]): Point[] {
  const [left, top, right, bottom] = [
    -MARGIN,
    -MARGIN,
    SLIDE.width + MARGIN,
    SLIDE.height + MARGIN,
  ];
  const atX =
    (x: number) =>
    (from: Point, to: Point): Point => [
      x,
      from[1] + ((to[1] - from[1]) * (x - from[0])) / (to[0] - from[0]),
    ];
  const atY =
    (y: number) =>
    (from: Point, to: Point): Point => [
      from[0] + ((to[0] - from[0]) * (y - from[1])) / (to[1] - from[1]),
      y,
    ];
  let kept = clipEdge(points, (point) => point[0] >= left, atX(left));
  kept = clipEdge(kept, (point) => point[0] <= right, atX(right));
  kept = clipEdge(kept, (point) => point[1] >= top, atY(top));
  return clipEdge(kept, (point) => point[1] <= bottom, atY(bottom));
}

const inside = (ring: Ring, box: Box) =>
  ring.every(
    ([lon, lat]) =>
      box.west <= lon &&
      lon <= box.east &&
      box.south <= lat &&
      lat <= box.north,
  );

/** A ring, enlarged about the centre of its bounding box. */
function enlarged(ring: Ring, by: number): Ring {
  const lons = ring.map(([lon]) => lon);
  const lats = ring.map(([, lat]) => lat);
  const centre: LonLat = [
    (Math.min(...lons) + Math.max(...lons)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
  return ring.map(([lon, lat]) => [
    centre[0] + (lon - centre[0]) * by,
    centre[1] + (lat - centre[1]) * by,
  ]);
}

function pathData(view: MapView, land: readonly Ring[]): string {
  const parts: string[] = [];
  for (const ring of land) {
    const clipped = clip(ring.map((place) => project(view, place)));
    const kept: Point[] = [];
    for (const point of clipped) {
      const last = kept.at(-1);
      if (
        last === undefined ||
        Math.hypot(point[0] - last[0], point[1] - last[1]) >= MIN_STEP
      )
        kept.push(point);
    }
    if (kept.length < 3) continue;
    parts.push(
      `M${kept.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}Z`,
    );
  }
  return parts.join("");
}

const within = ([lon, lat]: LonLat, box: Box, margin = 0) =>
  box.west - margin <= lon &&
  lon <= box.east + margin &&
  box.south - margin <= lat &&
  lat <= box.north + margin;

/** A ring cut to a box, in longitude and latitude (Sutherland–Hodgman). */
function ringInBox(ring: Ring, box: Box, margin: number): LonLat[] {
  const atLon =
    (lon: number) =>
    (from: Point, to: Point): Point => [
      lon,
      from[1] + ((to[1] - from[1]) * (lon - from[0])) / (to[0] - from[0]),
    ];
  const atLat =
    (lat: number) =>
    (from: Point, to: Point): Point => [
      from[0] + ((to[0] - from[0]) * (lat - from[1])) / (to[1] - from[1]),
      lat,
    ];
  const [west, east] = [box.west - margin, box.east + margin];
  const [south, north] = [box.south - margin, box.north + margin];
  let kept = clipEdge(ring, ([lon]) => lon >= west, atLon(west));
  kept = clipEdge(kept, ([lon]) => lon <= east, atLon(east));
  kept = clipEdge(kept, ([, lat]) => lat >= south, atLat(south));
  return clipEdge(kept, ([, lat]) => lat <= north, atLat(north));
}

/** The runs of a line inside a box. */
function linesInBox(line: Ring, box: Box, margin: number): LonLat[][] {
  const runs: LonLat[][] = [[]];
  for (const place of line) {
    if (within(place, box, margin)) runs.at(-1)?.push(place);
    else if ((runs.at(-1)?.length ?? 0) > 0) runs.push([]);
  }
  return runs.filter((run) => run.length >= 2);
}

/** A ring or a line as a flat list of longitudes and latitudes, rounded,
 *  with no point within `step` km of the last kept one, but the last. */
function flatten(
  points: readonly LonLat[],
  decimals: number,
  step: number,
): number[] {
  const round = (value: number) => Number(value.toFixed(decimals));
  const flat: number[] = [];
  let last: LonLat | undefined;
  for (const [index, [lon, lat]] of points.entries()) {
    const kept: LonLat = [round(lon), round(lat)];
    if (last !== undefined && index !== points.length - 1) {
      const km =
        Math.hypot(
          (kept[0] - last[0]) * Math.cos((lat * Math.PI) / 180),
          kept[1] - last[1],
        ) * KM_PER_DEGREE;
      if (km === 0 || km < step) continue;
    }
    flat.push(...kept);
    last = kept;
  }
  return flat;
}

/** The globe's data: each level's land and coast, with no hidden land. */
async function globeData(
  read: (name: string) => Promise<unknown>,
  hidden: Box,
): Promise<GlobeData> {
  const levels: GlobeData["levels"][number][] = [];
  for (const { scale } of LEVELS) {
    const { decimals, step, box } = WRITE[scale];
    const shown = (shape: Ring) => !inside(shape, hidden);
    const land = rings(await read(`ne_${scale}_land`))
      .filter(shown)
      .map((ring) => (box === null ? ring : ringInBox(ring, box, FINE_MARGIN)))
      .map((ring) => flatten(ring, decimals, step))
      .filter((flat) => flat.length >= 6);
    const coast = lines(await read(`ne_${scale}_coastline`))
      .filter(shown)
      .flatMap((line) =>
        box === null ? [line] : linesInBox(line, box, FINE_MARGIN),
      )
      .map((line) => flatten(line, decimals, step))
      .filter((flat) => flat.length >= 4);
    levels.push({ scale, box, land, coast });
  }
  return { levels };
}

/** The places of the story map's coast on the slide, and where it draws
 *  them. */
function coastPairs(view: MapView, land: readonly Ring[]): [LonLat, Point][] {
  const pairs: [LonLat, Point][] = [];
  for (const ring of land)
    for (const place of ring) {
      const [x, y] = project(view, place);
      if (x < 0 || x > SLIDE.width || y < 0 || y > SLIDE.height) continue;
      pairs.push([place, [x, y]]);
    }
  return pairs;
}

/** The camera over the view's centre that brings the globe's coast nearest
 *  to the map's, by least squares over scale, turn and place (Procrustes). */
function bestCamera(view: MapView, pairs: readonly [LonLat, Point][]): Camera {
  const globe = pairs.map(([place]) => onGlobe(place, view.centre));
  const mean = (points: readonly (readonly number[])[]): Point => [
    points.reduce((sum, point) => sum + (point[0] ?? 0), 0) / points.length,
    points.reduce((sum, point) => sum + (point[1] ?? 0), 0) / points.length,
  ];
  const look = mean(globe);
  const at = mean(pairs.map(([, map]) => map));
  let dot = 0;
  let cross = 0;
  let size = 0;
  for (const [index, [, [mx, my]]] of pairs.entries()) {
    const [gx, gy] = globe[index] ?? [0, 0];
    const [ax, ay] = [gx - look[0], gy - look[1]];
    const [bx, by] = [mx - at[0], my - at[1]];
    dot += ax * bx + ay * by;
    cross += ax * by - ay * bx;
    size += ax * ax + ay * ay;
  }
  const angle = Math.atan2(cross, dot);
  const kmPerPx = size / (Math.cos(angle) * dot + Math.sin(angle) * cross);
  // where the view's centre, 0 km from itself, shows
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  return {
    centre: view.centre,
    at: [
      at[0] - (cos * look[0] - sin * look[1]) / kmPerPx,
      at[1] - (sin * look[0] + cos * look[1]) / kmPerPx,
    ],
    kmPerPx,
    angle,
  };
}

/** How far the globe's coast, through a camera, is from the map's: the
 *  median, 95th percentile and most, in slide px. */
function gaps(camera: Camera, pairs: readonly [LonLat, Point][]): string {
  const sorted = pairs
    .map(([place, [x, y]]) => {
      const [sx, sy] = seen(camera, place);
      return Math.hypot(sx - x, sy - y);
    })
    .sort((a, b) => a - b);
  const at = (share: number) =>
    (
      sorted[Math.min(sorted.length - 1, Math.floor(share * sorted.length))] ??
      0
    ).toFixed(1);
  return `${at(0.5)} / ${at(0.95)} / ${at(1)} px`;
}

async function main(): Promise<void> {
  const { positionals } = parseArgs({ allowPositionals: true });
  const [directory] = positionals;
  if (positionals.length !== 1 || directory === undefined) {
    console.error("usage: node tools/maps.ts NE_DIR");
    process.exitCode = 2;
    return;
  }
  // the story maps and the globe's 10m level read the same file
  const files = new Map<string, Promise<unknown>>();
  const read = (name: string): Promise<unknown> => {
    const file =
      files.get(name) ??
      readFile(`${directory}/${name}.geojson`, "utf8").then((text): unknown =>
        JSON.parse(text),
      );
    files.set(name, file);
    return file;
  };
  const land = rings(await read("ne_10m_land"));
  const hidden = ANSON.islands?.box;
  if (hidden === undefined) throw new Error("ANSON has no islands");
  const globe = JSON.stringify(await globeData(read, hidden));
  const globeOut = fileURLToPath(
    new URL("../mockup/maps/globe.json", import.meta.url),
  );
  await writeFile(globeOut, globe);
  console.log(`${globeOut}: ${String(globe.length)} bytes`);
  // Each story map's camera on the globe: the one that fits its coast best.
  const cameras = new Map<MapView, Camera>();
  for (const view of [ANSON, NOIR]) {
    const pairs = coastPairs(view, land);
    const best = bestCamera(view, pairs);
    cameras.set(view, best);
    console.log(
      `${view.name}, ${String(pairs.length)} points of the coast, the globe's gap (median / 95th percentile / most): at the view's centre ${gaps(cameraFor(view), pairs)}; best fit ${gaps(best, pairs)}`,
    );
  }
  for (const view of [ANSON, NOIR, NEW_ENGLAND]) {
    const camera = cameras.get(view);
    const { islands: shown } = view;
    const islands =
      shown === undefined ? [] : land.filter((ring) => inside(ring, shown.box));
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(SLIDE.width)} ${String(SLIDE.height)}" width="${String(SLIDE.width)}" height="${String(SLIDE.height)}"${
        camera === undefined
          ? ""
          : ` data-camera="${[...camera.centre, ...camera.at, camera.kmPerPx, camera.angle].map((value) => value.toFixed(6)).join(" ")}"`
      }>`,
      `<rect class="sea" width="${String(SLIDE.width)}" height="${String(SLIDE.height)}"/>`,
      `<path class="land" d="${pathData(
        view,
        land.filter((ring) => !islands.includes(ring)),
      )}"/>`,
      ...(shown === undefined
        ? []
        : [
            `<path class="land islands" d="${pathData(
              view,
              islands.map((ring) => enlarged(ring, shown.enlarge)),
            )}"/>`,
          ]),
      "</svg>",
      "",
    ].join("\n");
    const out = fileURLToPath(
      new URL(`../mockup/maps/${view.name}.svg`, import.meta.url),
    );
    await writeFile(out, svg);
    console.log(`${out}: ${String(svg.length)} bytes`);
  }
}

if (import.meta.main) await main();

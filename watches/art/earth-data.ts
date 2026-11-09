// Writes globe/earth.json, the globe's land, from Natural Earth's land at
// 1:110m, 1:50m and 1:10m, and the state lines of its story maps that show
// them, from its 1:10m admin-1 lines (docs/globe.md, "The data"). In
// watches/:
//
//     sh art/fetch-earth.sh NE_DIR        # downloads, and writes NE_DIR/SHA
//     node art/earth-data.ts NE_DIR       # writes globe/earth.json
//     node art/earth-data.ts NE_DIR --check
//
// `--check` fails if globe/earth.json is not what the files make. Validation
// cannot run it: it needs the downloads. The 1:10m level keeps only the land
// near the stories (FINE, with MARGIN): the whole Earth at 1:10m is 10 MB.
// The state lines are only near the stories that show them (BORDERED).

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { clipToRect } from "../globe/clip.ts";
import { SCALES, inBox } from "../globe/earth.ts";
import type { LonLatBox, LonLat, Scale } from "../globe/earth.ts";

const OUT = fileURLToPath(new URL("../globe/earth.json", import.meta.url));

/** Southern New England: the railroad crash of 1853, at Valley Falls. */
const NEW_ENGLAND: LonLatBox = { west: -74, east: -69, south: 40, north: 44 };

/** Where the 1:10m level has land: near each story. The globe draws 1:50m
 *  outside them at 1:10m's zooms. Their edges are whole degrees; the globe
 *  cuts its land along them, as along its grid (`landPieces` in
 *  globe/globe.ts). */
export const FINE: readonly LonLatBox[] = [
  // Cape Noir and Juan Fernández
  { west: -100, east: -50, south: -62, north: -12 },
  // the English Channel, with the Isles of Scilly
  { west: -13, east: 5, south: 46, north: 54 },
  NEW_ENGLAND,
];
/** Where the file has state lines: near each story whose map shows them. */
const BORDERED: readonly LonLatBox[] = [NEW_ENGLAND];
/** The admin-1 lines that are a border on land: Natural Earth names the
 *  state on each side. A line with no names is in the water (Long Island
 *  Sound, Mount Hope Bay), and an "indicator" is a line over the sea. */
const BORDER_CLASSES = new Set([
  "Admin-1 boundary",
  "Admin-1 statistical boundary",
]);
/** Degrees: the 1:10m land is cut this far outside each box, so that the
 *  cut's edges are not on the box's; the globe cuts again at the box. */
const MARGIN = 2;

/** How each level is written: decimals of a degree (0.01° is 1.1 km), the
 *  km between kept points (0: every point), and its boxes (none: the whole
 *  Earth). */
const WRITE: Readonly<
  Record<
    Scale,
    {
      readonly decimals: number;
      readonly step: number;
      readonly boxes: readonly LonLatBox[];
    }
  >
> = {
  "110m": { decimals: 2, step: 0, boxes: [] },
  "50m": { decimals: 2, step: 0, boxes: [] },
  "10m": { decimals: 3, step: 0.5, boxes: FINE },
};

const KM_PER_DEGREE = 111.2;

type Point = [number, number];

function fail(what: string): never {
  throw new Error(what);
}

/** The polygons of a GeoJSON FeatureCollection of land: each an outline,
 *  then its holes, each ring as GeoJSON writes it (its first point again at
 *  its end). */
function polygonsOf(json: unknown): Point[][][] {
  if (
    typeof json !== "object" ||
    json === null ||
    !("features" in json) ||
    !Array.isArray(json.features)
  ) {
    return fail("not a GeoJSON FeatureCollection");
  }
  const point = (value: unknown): Point => {
    if (!Array.isArray(value)) return fail("not a point");
    const [lon, lat] = value as unknown[];
    if (typeof lon !== "number" || typeof lat !== "number") {
      return fail("not a point of numbers");
    }
    return [lon, lat];
  };
  const polygon = (value: unknown): Point[][] => {
    if (!Array.isArray(value)) return fail("not a polygon");
    return value.map((ring: unknown) => {
      if (!Array.isArray(ring)) return fail("not a ring");
      return ring.map(point);
    });
  };
  const found: Point[][][] = [];
  for (const feature of json.features as unknown[]) {
    if (typeof feature !== "object" || feature === null) continue;
    const geometry = (feature as { geometry?: unknown }).geometry;
    if (typeof geometry !== "object" || geometry === null) continue;
    const { type, coordinates } = geometry as {
      type?: unknown;
      coordinates?: unknown;
    };
    if (type === "Polygon") found.push(polygon(coordinates));
    else if (type === "MultiPolygon" && Array.isArray(coordinates)) {
      for (const each of coordinates as unknown[]) found.push(polygon(each));
    } else return fail(`not a polygon: ${String(type)}`);
  }
  return found;
}

/** The state lines of a GeoJSON FeatureCollection of Natural Earth's
 *  admin-1 lines: those on land (BORDER_CLASSES, and a name on each side),
 *  each as a list of points. */
function bordersOf(json: unknown): Point[][] {
  if (
    typeof json !== "object" ||
    json === null ||
    !("features" in json) ||
    !Array.isArray(json.features)
  ) {
    return fail("not a GeoJSON FeatureCollection");
  }
  const line = (value: unknown): Point[] => {
    if (!Array.isArray(value)) return fail("not a line");
    return value.map((point: unknown): Point => {
      if (!Array.isArray(point)) return fail("not a point");
      const [lon, lat] = point as unknown[];
      if (typeof lon !== "number" || typeof lat !== "number") {
        return fail("not a point of numbers");
      }
      return [lon, lat];
    });
  };
  const found: Point[][] = [];
  for (const feature of json.features as unknown[]) {
    if (typeof feature !== "object" || feature === null) continue;
    const { geometry, properties } = feature as {
      geometry?: unknown;
      properties?: unknown;
    };
    if (typeof properties !== "object" || properties === null) continue;
    const { FEATURECLA, NAME_L, NAME_R } = properties as Record<
      string,
      unknown
    >;
    if (
      typeof FEATURECLA !== "string" ||
      !BORDER_CLASSES.has(FEATURECLA) ||
      typeof NAME_L !== "string" ||
      typeof NAME_R !== "string"
    ) {
      continue;
    }
    if (typeof geometry !== "object" || geometry === null) continue;
    const { type, coordinates } = geometry as {
      type?: unknown;
      coordinates?: unknown;
    };
    if (type === "LineString") found.push(line(coordinates));
    else if (type === "MultiLineString" && Array.isArray(coordinates)) {
      for (const each of coordinates as unknown[]) found.push(line(each));
    } else return fail(`not a line: ${String(type)}`);
  }
  return found;
}

/** The runs of a line that are in a box grown by `margin` degrees, each
 *  with the point before it and the point after it, so that it reaches the
 *  grown box's edge. A run of fewer than 2 points is dropped. */
function lineInBox(
  line: readonly Point[],
  box: LonLatBox,
  margin: number,
): Point[][] {
  const grown: LonLatBox = {
    west: box.west - margin,
    east: box.east + margin,
    south: box.south - margin,
    north: box.north + margin,
  };
  const runs: Point[][] = [];
  let run: Point[] = [];
  line.forEach((point, index) => {
    const before = line[index - 1];
    const after = line[index + 1];
    const near =
      inBox(point, grown) ||
      (before !== undefined && inBox(before, grown)) ||
      (after !== undefined && inBox(after, grown));
    if (near) run.push(point);
    else if (run.length > 0) {
      runs.push(run);
      run = [];
    }
  });
  if (run.length > 0) runs.push(run);
  return runs.filter((each) => each.length >= 2);
}

/** A ring cut to a box grown by `margin` degrees. */
function ringInBox(
  ring: readonly Point[],
  box: LonLatBox,
  margin: number,
): Point[] {
  return clipToRect(
    ring,
    [box.west - margin, box.south - margin],
    [box.east + margin, box.north + margin],
  );
}

/** A function that rounds a degree to `decimals`. */
function rounding(decimals: number): (value: number) => number {
  const unit = 10 ** decimals;
  return (value) => Math.round(value * unit) / unit;
}

/** Km from one point to the next, on a flat chart at the second's
 *  latitude: near enough between neighbours. */
function kmBetween(from: Point, to: Point): number {
  const across = (to[0] - from[0]) * Math.cos((to[1] * Math.PI) / 180);
  return Math.hypot(across, to[1] - from[1]) * KM_PER_DEGREE;
}

/** A ring rounded to `decimals`, without a point that is the last kept one
 *  again or within `step` km of it, nor the first point again at its end.
 *  Empty if fewer than 3 points are left. */
function written(
  ring: readonly Point[],
  decimals: number,
  step: number,
): LonLat[] {
  const round = rounding(decimals);
  const kept: Point[] = [];
  for (const [lon, lat] of ring) {
    const point: Point = [round(lon), round(lat)];
    const last = kept.at(-1);
    if (last !== undefined) {
      const km = kmBetween(last, point);
      if (km === 0 || km < step) continue;
    }
    kept.push(point);
  }
  if (kept.length > 1 && kept[0]?.join() === kept.at(-1)?.join()) {
    kept.pop();
  }
  return kept.length >= 3 ? kept : [];
}

/** A line rounded as `written` rounds a ring, but open: its last point is
 *  always kept, so that it reaches where it ends. Empty if fewer than 2
 *  points are left. */
function writtenLine(
  line: readonly Point[],
  decimals: number,
  step: number,
): LonLat[] {
  const round = rounding(decimals);
  const kept: Point[] = [];
  line.forEach(([lon, lat], index) => {
    const point: Point = [round(lon), round(lat)];
    const last = kept.at(-1);
    if (last !== undefined) {
      const km = kmBetween(last, point);
      if (km === 0 || (km < step && index < line.length - 1)) return;
    }
    kept.push(point);
  });
  return kept.length >= 2 ? kept : [];
}

/** The level's polygons, each ring written flat (lon, lat, lon, lat, ...). */
function level(polygons: readonly Point[][][], scale: Scale): number[][][] {
  const { decimals, step, boxes } = WRITE[scale];
  const out: number[][][] = [];
  const add = (rings: readonly (readonly Point[])[]): void => {
    const [outline, ...holes] = rings.map((ring) =>
      written(ring, decimals, step),
    );
    if (outline === undefined || outline.length === 0) return;
    out.push(
      [outline, ...holes.filter((hole) => hole.length > 0)].map((ring) =>
        ring.flat(),
      ),
    );
  };
  for (const polygon of polygons) {
    if (boxes.length === 0) add(polygon);
    for (const box of boxes) {
      add(polygon.map((ring) => ringInBox(ring, box, MARGIN)));
    }
  }
  return out;
}

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { check: { type: "boolean", default: false } },
  });
  const [dir] = positionals;
  if (dir === undefined || positionals.length !== 1) {
    console.error("usage: node art/earth-data.ts NE_DIR [--check]");
    process.exitCode = 2;
    return;
  }
  const commit = (await readFile(join(dir, "SHA"), "utf8")).trim();
  const levels = [];
  for (const scale of SCALES) {
    const file = join(dir, `ne_${scale}_land.geojson`);
    const json: unknown = JSON.parse(await readFile(file, "utf8"));
    levels.push({
      scale,
      boxes: WRITE[scale].boxes,
      polygons: level(polygonsOf(json), scale),
    });
  }
  const lines = bordersOf(
    JSON.parse(
      await readFile(
        join(dir, "ne_10m_admin_1_states_provinces_lines.geojson"),
        "utf8",
      ),
    ),
  );
  const { decimals, step } = WRITE["10m"];
  const borders = lines
    .flatMap((line) => BORDERED.flatMap((box) => lineInBox(line, box, MARGIN)))
    .map((line) => writtenLine(line, decimals, step).flat())
    .filter((line) => line.length > 0);
  const text = `${JSON.stringify({
    source: {
      data: "Natural Earth, land, 1:110m, 1:50m and 1:10m, and admin-1 lines, 1:10m",
      url: "https://github.com/nvkelso/natural-earth-vector",
      commit,
      licence: "public domain",
    },
    levels,
    borders,
  })}\n`;
  if (values.check) {
    const now = await readFile(OUT, "utf8");
    if (now !== text) {
      console.error(`${OUT} is not what ${dir} makes: run without --check`);
      process.exitCode = 1;
    }
    return;
  }
  await writeFile(OUT, text);
  const points = levels.map(
    ({ scale, polygons }) =>
      `${scale}: ${String(polygons.length)} polygons, ${String(
        polygons.flat().reduce((sum, ring) => sum + ring.length / 2, 0),
      )} points`,
  );
  console.log(
    `wrote ${OUT} (${String(text.length)} bytes)\n${points.join("\n")}\nborders: ${String(borders.length)} lines, ${String(
      borders.reduce((sum, line) => sum + line.length / 2, 0),
    )} points`,
  );
}

if (import.meta.main) await main();

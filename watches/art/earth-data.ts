// Writes globe/earth.json, the globe's land, from Natural Earth's land at
// 1:110m, 1:50m and 1:10m (docs/globe.md, "The data"). In watches/:
//
//     sh art/fetch-earth.sh NE_DIR        # downloads, and writes NE_DIR/SHA
//     node art/earth-data.ts NE_DIR       # writes globe/earth.json
//     node art/earth-data.ts NE_DIR --check
//
// `--check` fails if globe/earth.json is not what the files make. Validation
// cannot run it: it needs the downloads. The 1:10m level keeps only the land
// near the stories (FINE, with MARGIN): the whole Earth at 1:10m is 10 MB.

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { clipToRect } from "../globe/clip.ts";
import { SCALES } from "../globe/earth.ts";
import type { Box, LonLat, Scale } from "../globe/earth.ts";

const OUT = fileURLToPath(new URL("../globe/earth.json", import.meta.url));

/** Where the 1:10m level has land: near each story. The globe draws 1:50m
 *  outside them at 1:10m's zooms. Their edges are whole degrees, on the
 *  grid that the globe cuts its land along (globe/model.ts). */
export const FINE: readonly Box[] = [
  // Cape Noir and Juan Fernández
  { west: -100, east: -50, south: -62, north: -12 },
  // the English Channel, with the Isles of Scilly
  { west: -13, east: 5, south: 46, north: 54 },
];
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
      readonly boxes: readonly Box[];
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

/** A ring cut to a box grown by `margin` degrees. */
function ringInBox(ring: readonly Point[], box: Box, margin: number): Point[] {
  return clipToRect(
    ring,
    [box.west - margin, box.south - margin],
    [box.east + margin, box.north + margin],
  );
}

/** A ring rounded to `decimals`, without a point that is the last kept one
 *  again or within `step` km of it, nor the first point again at its end.
 *  Empty if fewer than 3 points are left. */
function written(
  ring: readonly Point[],
  decimals: number,
  step: number,
): LonLat[] {
  const unit = 10 ** decimals;
  const round = (value: number): number => Math.round(value * unit) / unit;
  const kept: Point[] = [];
  for (const [lon, lat] of ring) {
    const point: Point = [round(lon), round(lat)];
    const last = kept.at(-1);
    if (last !== undefined) {
      const across = (point[0] - last[0]) * Math.cos((lat * Math.PI) / 180);
      const km = Math.hypot(across, point[1] - last[1]) * KM_PER_DEGREE;
      if (km === 0 || km < step) continue;
    }
    kept.push(point);
  }
  if (kept.length > 1 && kept[0]?.join() === kept.at(-1)?.join()) {
    kept.pop();
  }
  return kept.length >= 3 ? kept : [];
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
  const text = `${JSON.stringify({
    source: {
      data: "Natural Earth, land, 1:110m, 1:50m and 1:10m",
      url: "https://github.com/nvkelso/natural-earth-vector",
      commit,
      licence: "public domain",
    },
    levels,
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
    `wrote ${OUT} (${String(text.length)} bytes)\n${points.join("\n")}`,
  );
}

if (import.meta.main) await main();

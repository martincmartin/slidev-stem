// Draws the mockup's maps from Natural Earth's 1:10m land, as SVGs at the
// slide's size: the sea, the land with its coast, and the islands that the
// picture shows later (MapView.islands). In watches/:
//   node tasks/2026-10-30-part-2-visual-language/tools/maps.ts NE_DIR
// NE_DIR holds ne_10m_land.geojson (the globe task's tools/fetch.sh). The
// result goes to mockup/maps/<name>.svg.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { ANSON, NEW_ENGLAND, project, SLIDE } from "../mockup/geo.ts";
import type { Box, LonLat, MapView, Point } from "../mockup/geo.ts";

/** Slide px outside the slide where the land is cut: the cut's edges do not
 *  show, so its stroke is only the coast. */
const MARGIN = 20;
/** Drop a point closer than this (slide px) to the last kept one. */
const MIN_STEP = 0.4;

type Ring = readonly LonLat[];

function rings(json: unknown): Ring[] {
  if (
    typeof json !== "object" ||
    json === null ||
    !("features" in json) ||
    !Array.isArray(json.features)
  ) {
    throw new Error("not a GeoJSON FeatureCollection");
  }
  const found: Ring[] = [];
  for (const feature of json.features as unknown[]) {
    if (
      typeof feature !== "object" ||
      feature === null ||
      !("geometry" in feature)
    )
      continue;
    const geometry = feature.geometry;
    if (
      typeof geometry !== "object" ||
      geometry === null ||
      !("type" in geometry) ||
      !("coordinates" in geometry)
    )
      continue;
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

async function main(): Promise<void> {
  const { positionals } = parseArgs({ allowPositionals: true });
  const [directory] = positionals;
  if (positionals.length !== 1 || directory === undefined) {
    console.error("usage: node tools/maps.ts NE_DIR");
    process.exitCode = 2;
    return;
  }
  const land = rings(
    JSON.parse(await readFile(`${directory}/ne_10m_land.geojson`, "utf8")),
  );
  for (const view of [ANSON, NEW_ENGLAND]) {
    const { islands: shown } = view;
    const islands =
      shown === undefined ? [] : land.filter((ring) => inside(ring, shown.box));
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(SLIDE.width)} ${String(SLIDE.height)}" width="${String(SLIDE.width)}" height="${String(SLIDE.height)}">`,
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

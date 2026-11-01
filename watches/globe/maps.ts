// Part 2's story maps (docs/globe.md, "The story maps"): a flat map of each
// story's place, drawn over the globe at rest, made at load from the
// globe's land. A map's parallels are straight, and the globe's are not: on
// the globe, a leg due west would curve. Each map has its own projection,
// plate carrée with longitude shortened by the cosine of its centre's
// latitude, so that shapes near its centre are true; and the globe's view
// for it is the camera, north up, that fits its coast best (`fitCamera`).
// No DOM: the tests run it in Node.

import { planeOnSlide, towardCamera } from "../webgl/renderer.ts";
import type { Affine2, CameraPose, Plane, Vec3, View } from "../webgl/scene.ts";
import { clipToRect } from "./clip.ts";
import { inBox } from "./earth.ts";
import type { LonLatBox, LonLat, Polygon, Ring } from "./earth.ts";
import { RADIUS, globeView, onGlobe, toSphere } from "./globe.ts";
import type { GlobeCamera } from "./globe.ts";

export interface StoryMap {
  /** Also the name of its view on the globe. */
  readonly name: string;
  /** A place, and the slide px where it shows. */
  readonly centre: LonLat;
  readonly at: readonly [number, number];
  /** Slide px for one degree of latitude. */
  readonly pxPerDegree: number;
  /** Small islands that the map draws apart (`MapLand.islands`), larger
   *  about their own centre, as a map draws a small island so that it
   *  shows: each ring inside the box. */
  readonly islands?: { readonly box: LonLatBox; readonly enlarge: number };
}

/** The most coast points that a fit uses: an even sample of those on the
 *  slide. */
const FIT_POINTS = 500;

/** Slide px: a map's land is cut this far outside the slide, so that the
 *  cut's edges, and their coast line, do not show at the map's view. As
 *  the map leaves, it can show smaller than the slide: StoryMaps.vue clips
 *  the land at half this margin, so the cut's line never shows. */
export const MARGIN = 20;

/** Slide px for a longitude difference at the map's centre. */
export function longitudeOffset(map: StoryMap, degrees: number): number {
  return degrees * map.pxPerDegree * Math.cos((map.centre[1] * Math.PI) / 180);
}

/** Where a place is on the map, in slide px. */
export function project(map: StoryMap, [lon, lat]: LonLat): [number, number] {
  return [
    map.at[0] + longitudeOffset(map, lon - map.centre[0]),
    map.at[1] - (lat - map.centre[1]) * map.pxPerDegree,
  ];
}

/** The place at a slide point: the inverse of `project`. */
export function unproject(
  map: StoryMap,
  [x, y]: readonly [number, number],
): LonLat {
  return [
    map.centre[0] + (x - map.at[0]) / longitudeOffset(map, 1),
    map.centre[1] - (y - map.at[1]) / map.pxPerDegree,
  ];
}

/** A ring as a closed subpath of an SVG path, to 0.1 px. */
function subpath(points: readonly (readonly [number, number])[]): string {
  return `${points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`,
    )
    .join("")}Z`;
}

/** A map's land as SVG paths, in slide px: an outline and its holes, so the
 *  path fills by the even-odd rule. */
export interface MapLand {
  readonly land: string;
  /** The islands of `StoryMap.islands`, enlarged, or "": a picture can show
   *  them later than the rest. */
  readonly islands: string;
}

/** The map's land on a slide of `slide` px, cut to the slide and MARGIN. */
export function mapLand(
  map: StoryMap,
  polygons: readonly Polygon[],
  slide: readonly [number, number],
): MapLand {
  const low = [-MARGIN, -MARGIN] as const;
  const high = [slide[0] + MARGIN, slide[1] + MARGIN] as const;
  const land: string[] = [];
  const islands: string[] = [];
  const { islands: apart } = map;
  for (const ring of polygons.flat()) {
    const points = ring.map((place) => project(map, place));
    if (apart && ring.every((place) => inBox(place, apart.box))) {
      const x = points.reduce((sum, [px]) => sum + px, 0) / points.length;
      const y = points.reduce((sum, [, py]) => sum + py, 0) / points.length;
      islands.push(
        subpath(
          points.map(([px, py]) => [
            x + (px - x) * apart.enlarge,
            y + (py - y) * apart.enlarge,
          ]),
        ),
      );
      continue;
    }
    const kept = clipToRect(points, low, high);
    if (kept.length >= 3) land.push(subpath(kept));
  }
  return { land: land.join(""), islands: islands.join("") };
}

/** How far the globe's coast, through a camera, is from the map's, at each
 *  of the fit's coast points: slide px, from the least. */
export interface Fit {
  readonly camera: GlobeCamera;
  readonly gaps: readonly number[];
}

/** The camera, north up, whose globe brings the coast nearest to the map's:
 *  by least squares over the place that the camera looks down at, where it
 *  shows, and the scale. For a place, the best slide point and scale are a
 *  linear fit; the place is found by a pattern search. The globe's
 *  parallels bow and the map's do not, so the best place is not the map's
 *  centre: it is where the bow is least over the coast that shows. A turn
 *  of the camera in the slide's plane would fit no better (the production
 *  task's progress, phase 5), and the house camera has none. */
export function fitCamera(
  map: StoryMap,
  rings: readonly Ring[],
  slide: readonly [number, number],
): Fit {
  const pairs: [LonLat, [number, number]][] = [];
  for (const ring of rings) {
    for (const place of ring) {
      const [x, y] = project(map, place);
      if (x >= 0 && x <= slide[0] && y >= 0 && y <= slide[1]) {
        pairs.push([place, [x, y]]);
      }
    }
  }
  if (pairs.length < 3) throw new Error(`${map.name}: no coast on the slide`);
  // an even sample: the fit is the same, and a load stays fast
  const stride = Math.ceil(pairs.length / FIT_POINTS);
  const sample = pairs.filter((_, index) => index % stride === 0);
  const count = sample.length;
  const mapMean = [0, 1].map(
    (axis) =>
      sample.reduce((sum, [, point]) => sum + (point[axis] ?? 0), 0) / count,
  );
  const solve = (centre: LonLat): { fit: Fit; squares: number } => {
    const globe = sample.map(([place]) => onGlobe(place, centre));
    const globeMean = [0, 1].map(
      (axis) =>
        globe.reduce((sum, point) => sum + (point[axis] ?? 0), 0) / count,
    );
    let dot = 0;
    let size = 0;
    globe.forEach(([gx, gy], index) => {
      const [mx, my] = sample[index]?.[1] ?? [0, 0];
      const [ax, ay] = [gx - (globeMean[0] ?? 0), gy - (globeMean[1] ?? 0)];
      dot += ax * (mx - (mapMean[0] ?? 0)) + ay * (my - (mapMean[1] ?? 0));
      size += ax * ax + ay * ay;
    });
    const pxPerKm = dot / size;
    const at: [number, number] = [
      (mapMean[0] ?? 0) - pxPerKm * (globeMean[0] ?? 0),
      (mapMean[1] ?? 0) - pxPerKm * (globeMean[1] ?? 0),
    ];
    const gaps = globe
      .map(([gx, gy], index) => {
        const [mx, my] = sample[index]?.[1] ?? [0, 0];
        return Math.hypot(at[0] + pxPerKm * gx - mx, at[1] + pxPerKm * gy - my);
      })
      .sort((a, b) => a - b);
    return {
      fit: {
        camera: { name: map.name, centre, at, kmPerPx: 1 / pxPerKm },
        gaps,
      },
      squares: gaps.reduce((sum, gap) => sum + gap * gap, 0),
    };
  };
  let best = solve(map.centre);
  // degrees: the pattern search's first step, and where it stops
  for (let step = 1; step > 1e-4;) {
    const [lon, lat] = best.fit.camera.centre;
    const trials = [
      [lon + step, lat],
      [lon - step, lat],
      [lon, lat + step],
      [lon, lat - step],
    ] as const;
    const better = trials
      .map((centre) => solve(centre))
      .find((trial) => trial.squares < best.squares);
    if (better) best = better;
    else step /= 2;
  }
  return best.fit;
}

/** The sea west of Tierra del Fuego: Cape Noir at x ≈ 620, and room on the
 *  west for where the squadron thought it was, 10° of longitude (400 miles)
 *  away. Cape Horn is near the right edge. */
export const CAPE_NOIR: StoryMap = {
  name: "cape noir",
  centre: [-76, -55],
  at: [490, 300],
  pxPerDegree: 75,
};
/** The sea off Chile, with Robinson Crusoe Island at x = 230: room on the
 *  west for the labels. The coast of Chile is at x ≈ 680. At this scale
 *  Robinson Crusoe Island is 15 px long, a smudge, so the Juan Fernández
 *  Islands (Robinson Crusoe and Santa Clara, and Alejandro Selkirk, 1.9° to
 *  the west) are drawn at twice their size. */
export const JUAN_FERNANDEZ: StoryMap = {
  name: "juan fernandez",
  centre: [-78.83, -33.64],
  at: [230, 300],
  pxPerDegree: 75,
  islands: {
    box: { west: -81.5, east: -78.5, south: -34.2, north: -33.4 },
    enlarge: 2,
  },
};
/** The mouth of the English Channel, at eight times the others' scale: the
 *  Isles of Scilly near the middle, about 40 px across, Cornwall at the top
 *  right, and room on the west for where the fleet thought it was. At the
 *  others' scale, the two places would be one ship's length apart. */
export const SCILLY: StoryMap = {
  name: "scilly",
  centre: [-6.25, 49.8],
  at: [490, 300],
  pxPerDegree: 600,
};

/** The story maps of Part 2. */
export const STORY_MAPS: readonly StoryMap[] = [
  CAPE_NOIR,
  JUAN_FERNANDEZ,
  SCILLY,
];

/** A story map placed on the globe: its land, its view (the camera that
 *  fits it), and the plane that touches the globe at the view's place, with
 *  (u, v) the slide px at the view. So the map, drawn in slide px, rides the
 *  camera on the plane (`mapOnSlide`). */
export interface PlacedMap {
  readonly map: StoryMap;
  readonly land: MapLand;
  readonly view: View;
  readonly plane: Plane;
}

/** The map's land, its view and its plane, for a slide of `slide` px. */
export function placeMap(
  map: StoryMap,
  polygons: readonly Polygon[],
  slide: readonly [number, number],
): PlacedMap {
  const { camera } = fitCamera(map, polygons.flat(), slide);
  const view = globeView(camera);
  const [lon, lat] = [
    (camera.centre[0] * Math.PI) / 180,
    (camera.centre[1] * Math.PI) / 180,
  ];
  const step = 1 / view.scale;
  // east and south, as `toSphere` turns them, a slide px long
  const u: Vec3 = [-Math.sin(lon) * step, -Math.cos(lon) * step, 0];
  const v: Vec3 = [
    Math.sin(lat) * Math.cos(lon) * step,
    -Math.sin(lat) * Math.sin(lon) * step,
    -Math.cos(lat) * step,
  ];
  const place = toSphere(camera.centre);
  return {
    map,
    land: mapLand(map, polygons, slide),
    view,
    plane: {
      // the world point at the slide's top left, at the view: the camera
      // looks down at its place, which shows at its `at`
      origin: [
        place[0] - camera.at[0] * u[0] - camera.at[1] * v[0],
        place[1] - camera.at[0] * u[1] - camera.at[1] * v[1],
        place[2] - camera.at[0] * u[2] - camera.at[1] * v[2],
      ],
      u,
      v,
    },
  };
}

/** How near the camera must be to a map's view for the map to show: within
 *  this zoom, and this pan (slide px at the map's view). The map fades out
 *  as the camera leaves, and is gone at either. So a flight hands over from
 *  the map to the globe in about its first tenth, and back in its last: the
 *  map fits the globe only near its own view (the production task, section
 *  4). A still at rest shows the map whole: this depends on the pose
 *  alone. */
const NEAR = { zoom: 1.25, pan: 80 } as const;

/** Where the map shows through `pose`, and how much: the SVG matrix that
 *  takes the map's slide px to the slide's, and its opacity, from 0 to 1. */
export function mapOnSlide(
  placed: PlacedMap,
  pose: CameraPose,
  slide: readonly [number, number],
): { readonly matrix: Affine2; readonly opacity: number } {
  const { view, plane } = placed;
  const toward = towardCamera(pose);
  const own = towardCamera(view.angles ?? { tilt: 0, turn: 0 });
  const cosine = toward[0] * own[0] + toward[1] * own[1] + toward[2] * own[2];
  const pan = Math.acos(Math.min(1, cosine)) * RADIUS * view.scale;
  const zoom = Math.abs(Math.log(pose.view.scale / view.scale));
  const far = Math.min(1, Math.max(zoom / Math.log(NEAR.zoom), pan / NEAR.pan));
  return {
    matrix: planeOnSlide(pose, slide, plane),
    opacity: 1 - far * far * (3 - 2 * far),
  };
}

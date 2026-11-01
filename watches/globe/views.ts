// The globe's views, which a slide names in `artView` (docs/globe.md, "The
// views"). Each looks straight down at a place, north up, as a map does: the
// story maps (Cape Noir, Juan Fernández, Scilly) have the same place, slide
// point and scale, so a map drawn over the globe fits it there.

import type { View } from "../webgl/scene.ts";
import type { LonLat } from "./earth.ts";
import {
  CENTRE,
  EARTH_RADIUS,
  KM_PER_DEGREE,
  RADIUS,
  facing,
  scaleOf,
} from "./globe.ts";

/** A camera over the globe: it looks straight down at `centre`, which
 *  shows at the slide point `at`, with `kmPerPx` km to a slide px. */
export interface GlobeCamera {
  readonly name: string;
  readonly centre: LonLat;
  readonly at: readonly [number, number];
  readonly kmPerPx: number;
}

/** A story map's camera: `pxPerDegree` slide px for a degree of latitude. */
function mapCamera(
  name: string,
  centre: LonLat,
  at: readonly [number, number],
  pxPerDegree: number,
): GlobeCamera {
  return { name, centre, at, kmPerPx: KM_PER_DEGREE / pxPerDegree };
}

/** The camera as a view: the globe's centre is the pivot, at `at` on the
 *  slide, and the angles face `centre`. */
export function globeView(camera: GlobeCamera): View {
  const scale = scaleOf(camera.kmPerPx);
  return {
    name: camera.name,
    scale,
    shift: [camera.at[0] - scale * CENTRE[0], camera.at[1] - scale * CENTRE[1]],
    pivot: CENTRE,
    angles: facing(camera.centre),
    ball: RADIUS,
  };
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

/** The slide's band under the title, in slide px, that a fitted camera
 *  fills. */
export interface Band {
  readonly width: number;
  readonly top: number;
  readonly bottom: number;
}

/** The camera, north up, over the middle of the places' longitudes and
 *  latitudes, that fits them in the band. */
export function fitting(
  name: string,
  places: readonly LonLat[],
  band: Band,
): GlobeCamera {
  const lons = places.map(([lon]) => lon);
  const lats = places.map(([, lat]) => lat);
  const centre: LonLat = [
    (Math.min(...lons) + Math.max(...lons)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
  const points = places.map((place) => onGlobe(place, centre));
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const [west, east] = [Math.min(...xs), Math.max(...xs)];
  const [north, south] = [Math.min(...ys), Math.max(...ys)];
  const kmPerPx = Math.max(
    (east - west) / band.width,
    (south - north) / (band.bottom - band.top),
  );
  return {
    name,
    centre,
    at: [
      band.width / 2 - (west + east) / 2 / kmPerPx,
      (band.top + band.bottom) / 2 - (north + south) / 2 / kmPerPx,
    ],
    kmPerPx,
  };
}

/** The views of Part 2, for a slide `width` px wide. */
export function globeViews(width: number): View[] {
  const band: Band = { width, top: 78, bottom: 540 };
  return [
    // South America: its northern, eastern, western and southern ends
    fitting(
      "south america",
      [
        [-71.7, 12.4],
        [-34.8, -7.2],
        [-81.3, -5.1],
        [-67.3, -56],
      ],
      band,
    ),
    // The sea west of Tierra del Fuego: Cape Noir at x ≈ 620, and room on
    // the west for where the squadron thought it was, 10° of longitude
    // away
    mapCamera("cape noir", [-76, -55], [490, 300], 75),
    // The sea off Chile, with Robinson Crusoe Island at x = 230: room on
    // the west for the labels
    mapCamera("juan fernandez", [-78.83, -33.64], [230, 300], 75),
    // The English Channel and both of its coasts, from west of the Isles
    // of Scilly to the Strait of Dover, and from Brittany to the Bristol
    // Channel
    fitting(
      "channel",
      [
        [-7.5, 49.9],
        [2.5, 51],
        [-3, 47.8],
        [-3, 51.6],
      ],
      band,
    ),
    // The Isles of Scilly, at eight times the scale of the others: at
    // theirs, the two places would be one ship's length apart
    mapCamera("scilly", [-6.25, 49.8], [490, 300], 600),
  ].map(globeView);
}

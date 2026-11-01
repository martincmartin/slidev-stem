// The globe's views, which a slide names in `artView` (docs/globe.md, "The
// views"). Each looks straight down at a place, north up. A story map's
// view (Cape Noir, Juan Fernández, Scilly) is the camera that fits the map
// best (`fitCamera` in maps.ts), so the map drawn over the globe fits it
// there.

import type { View } from "../webgl/scene.ts";
import type { LonLat, Ring } from "./earth.ts";
import { CENTRE, RADIUS, facing, onGlobe, scaleOf } from "./globe.ts";
import type { GlobeCamera } from "./globe.ts";
import { CAPE_NOIR, JUAN_FERNANDEZ, SCILLY, fitCamera } from "./maps.ts";
import type { StoryMap } from "./maps.ts";

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

/** The views of Part 2, for a slide of `slide` px, with the land's `rings`
 *  for the story maps' fits. */
export function globeViews(
  slide: readonly [number, number],
  rings: readonly Ring[],
): View[] {
  const band: Band = { width: slide[0], top: 78, bottom: 540 };
  const map = (story: StoryMap): GlobeCamera =>
    fitCamera(story, rings, slide).camera;
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
    map(CAPE_NOIR),
    map(JUAN_FERNANDEZ),
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
    map(SCILLY),
  ].map(globeView);
}

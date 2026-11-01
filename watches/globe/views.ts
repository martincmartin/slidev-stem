// The globe's views, which a slide names in `artView` (docs/globe.md, "The
// views"). Each looks straight down at a place, north up. A story map's
// view (Cape Noir, Juan Fernández, Scilly) is the camera that fits the map
// best (`fitCamera` in maps.ts), so the map drawn over the globe fits it
// there.

import type { LonLat } from "./earth.ts";
import { onGlobe } from "./globe.ts";
import type { GlobeCamera } from "./globe.ts";

/** The slide's band under the title, in slide px, that a fitted camera
 *  fills. */
interface Band {
  readonly width: number;
  readonly top: number;
  readonly bottom: number;
}

/** The camera, north up, over the middle of the places' longitudes and
 *  latitudes, that fits them in the band. */
function fitting(
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

/** The cameras of Part 2's views that are not a story map's, for a slide
 *  of `slide` px: two that fit places. */
export function globeCameras(slide: readonly [number, number]): GlobeCamera[] {
  const band: Band = { width: slide[0], top: 78, bottom: 540 };
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
  ];
}

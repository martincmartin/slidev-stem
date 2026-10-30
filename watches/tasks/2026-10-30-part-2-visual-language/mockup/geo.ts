// The mockup's maps: where each one is, and the projection from a place
// (longitude and latitude, in degrees) to slide px. tools/maps.ts draws the
// coasts with it, and the story places its marks with it.

export type LonLat = readonly [number, number];
export type Point = readonly [number, number];

/** Slidev's canvas, in CSS px. */
export const SLIDE = { width: 980, height: 552 } as const;

export interface Box {
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}

export interface MapView {
  readonly name: string;
  /** a place, and the slide px where it shows */
  readonly centre: LonLat;
  readonly at: Point;
  /** slide px for one degree of latitude */
  readonly scale: number;
  /** Land that the picture shows later: each ring inside this box is drawn
   *  apart, as the path `.islands`, enlarged about its own centre, as a map
   *  draws a small island so that it shows. */
  readonly islands?: { readonly box: Box; readonly enlarge: number };
}

/** Plate carrée, with longitude shortened by the cosine of the centre's
 *  latitude, so that shapes near the centre are true. */
export function project(view: MapView, [lon, lat]: LonLat): Point {
  const shorten = Math.cos((view.centre[1] * Math.PI) / 180);
  return [
    view.at[0] + (lon - view.centre[0]) * view.scale * shorten,
    view.at[1] - (lat - view.centre[1]) * view.scale,
  ];
}

/** The Juan Fernández Islands: Robinson Crusoe and Santa Clara, and
 *  Alejandro Selkirk, 1.9° to the west. */
const JUAN_FERNANDEZ: Box = {
  west: -81.5,
  east: -78.5,
  south: -34.2,
  north: -33.4,
};

/** The sea off Chile, with Robinson Crusoe Island at x = 230: room on the
 *  west for the labels of May 28 and June 9. The coast of Chile is at
 *  x ≈ 680, and the land east of it is blank paper. At this scale Robinson
 *  Crusoe Island is 15 px long, a smudge, so the islands are drawn at twice
 *  their size. */
export const ANSON: MapView = {
  name: "anson",
  centre: [-78.83, -33.64],
  at: [230, 300],
  scale: 75,
  islands: { box: JUAN_FERNANDEZ, enlarge: 2 },
};

/** The sea west of Tierra del Fuego, at ANSON's scale: Cape Noir at
 *  x ≈ 620, and room on the west for where the squadron thought it was, 10°
 *  of longitude (400 miles) away. Cape Horn is near the right edge. */
export const NOIR: MapView = {
  name: "noir",
  centre: [-76, -55],
  at: [490, 300],
  scale: 75,
};

/** New England, with Somerville (the venue) at the slide's centre: one
 *  degree of latitude, 60 nautical miles, is 300 px. */
export const NEW_ENGLAND: MapView = {
  name: "new-england",
  centre: [-71.0995, 42.3876],
  at: [490, 300],
  scale: 300,
};

// The globe: the Earth seen from far away, as a globe on a desk looks (an
// orthographic projection). A camera looks straight down at a place, its
// centre, and the globe turns under it as the camera flies (globe.ts draws
// it). A story's map (MapView) keeps its own projection, whose parallels are
// straight. On the globe, a parallel bows 23 px across the Anson map and
// 34 px across Cape Noir's: a leg due west would curve.

/** km: the Earth's radius, and the length of a degree of a great circle. */
export const EARTH_RADIUS = 6371;
export const KM_PER_DEGREE = (Math.PI * EARTH_RADIUS) / 180;

/** A direction from the Earth's centre: x to 0° E on the equator, y to
 *  90° E, z to the North Pole. */
export type Vector = readonly [number, number, number];

const RADIANS = Math.PI / 180;

/** A place as a unit vector. */
export function unit([lon, lat]: LonLat): Vector {
  const cosLat = Math.cos(lat * RADIANS);
  return [
    cosLat * Math.cos(lon * RADIANS),
    cosLat * Math.sin(lon * RADIANS),
    Math.sin(lat * RADIANS),
  ];
}

/** The place of a direction. */
export function place([x, y, z]: Vector): LonLat {
  const length = Math.hypot(x, y, z);
  return [
    Math.atan2(y, x) / RADIANS,
    Math.asin(Math.max(-1, Math.min(1, z / length))) / RADIANS,
  ];
}

/** A camera over the globe: it looks straight down at the place `centre`,
 *  which shows at the slide point `at`, with `kmPerPx` km to a slide px,
 *  turned `angle` radians clockwise. */
export interface Camera {
  readonly centre: LonLat;
  readonly at: Point;
  readonly kmPerPx: number;
  readonly angle: number;
}

/** A camera's axes, for many places at once: a place p (a unit vector)
 *  shows at slide x = at[0] + x · p and y = at[1] + y · p, and z · p is how
 *  far it faces the camera, from 1 to -1 (below 0: the far side). The limb
 *  is the circle of `radius` slide px about `at`. */
export interface Axes {
  readonly x: Vector;
  readonly y: Vector;
  readonly z: Vector;
  readonly at: Point;
  readonly radius: number;
}

export function axesOf(camera: Camera): Axes {
  const [lon, lat] = camera.centre;
  const [sinLon, cosLon] = [Math.sin(lon * RADIANS), Math.cos(lon * RADIANS)];
  const [sinLat, cosLat] = [Math.sin(lat * RADIANS), Math.cos(lat * RADIANS)];
  const east: Vector = [-sinLon, cosLon, 0];
  const north: Vector = [-sinLat * cosLon, -sinLat * sinLon, cosLat];
  const radius = EARTH_RADIUS / camera.kmPerPx;
  const [cos, sin] = [Math.cos(camera.angle), Math.sin(camera.angle)];
  // slide y is down, so north counts against it
  const along = (a: number, b: number): Vector => [
    radius * (a * east[0] + b * north[0]),
    radius * (a * east[1] + b * north[1]),
    radius * (a * east[2] + b * north[2]),
  ];
  return {
    x: along(cos, sin),
    y: along(sin, -cos),
    z: [cosLat * cosLon, cosLat * sinLon, sinLat],
    at: camera.at,
    radius,
  };
}

const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Where a place shows on the slide, and how far it faces the camera (z,
 *  from 1 to -1; below 0: the far side). */
export function seen(
  camera: Camera,
  where: LonLat,
): readonly [number, number, number] {
  const axes = axesOf(camera);
  const direction = unit(where);
  return [
    axes.at[0] + dot(axes.x, direction),
    axes.at[1] + dot(axes.y, direction),
    dot(axes.z, direction),
  ];
}

/** A place on the globe seen from above `centre`: km east (x) and south (y,
 *  down the slide) of it, and how far it faces the viewer (z). */
export const onGlobe = (where: LonLat, centre: LonLat) =>
  seen({ centre, at: [0, 0], kmPerPx: 1, angle: 0 }, where);

/** The camera that shows the globe as a map shows its region: the view's
 *  centre at the same slide point and scale, with north up there. */
export const cameraFor = (view: MapView): Camera => ({
  centre: view.centre,
  at: view.at,
  kmPerPx: KM_PER_DEGREE / view.scale,
  angle: 0,
});

/** The slide's area under the title, for the views of the whole globe. */
const UNDER_TITLE = { top: 78, bottom: 540 } as const;
const UNDER_TITLE_CENTRE: Point = [
  SLIDE.width / 2,
  (UNDER_TITLE.top + UNDER_TITLE.bottom) / 2,
];

/** The camera, north up, over the middle of places' longitudes and
 *  latitudes, that fits them in the slide under the title. */
function fitting(places: readonly LonLat[]): Camera {
  const lons = places.map(([lon]) => lon);
  const lats = places.map(([, lat]) => lat);
  const centre: LonLat = [
    (Math.min(...lons) + Math.max(...lons)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
  const points = places.map((where) => onGlobe(where, centre));
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const [west, east] = [Math.min(...xs), Math.max(...xs)];
  const [north, south] = [Math.min(...ys), Math.max(...ys)];
  const kmPerPx = Math.max(
    (east - west) / SLIDE.width,
    (south - north) / (UNDER_TITLE.bottom - UNDER_TITLE.top),
  );
  return {
    centre,
    at: [
      UNDER_TITLE_CENTRE[0] - (west + east) / 2 / kmPerPx,
      UNDER_TITLE_CENTRE[1] - (north + south) / 2 / kmPerPx,
    ],
    kmPerPx,
    angle: 0,
  };
}

/** South America: its northern, eastern, western and southern ends. */
export const SOUTH_AMERICA: Camera = fitting([
  [-71.7, 12.4],
  [-34.8, -7.2],
  [-81.3, -5.1],
  [-67.3, -56],
]);

/** The whole globe under the title, turned to the middle of South America:
 *  a little of Antarctica shows at the bottom. */
export const WHOLE_GLOBE: Camera = {
  centre: SOUTH_AMERICA.centre,
  at: UNDER_TITLE_CENTRE,
  kmPerPx: (2 * EARTH_RADIUS) / (UNDER_TITLE.bottom - UNDER_TITLE.top),
  angle: 0,
};

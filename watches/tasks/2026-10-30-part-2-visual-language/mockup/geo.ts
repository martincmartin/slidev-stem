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

/** New England, with Somerville (the venue) at the slide's centre: one
 *  degree of latitude, 60 nautical miles, is 300 px. */
export const NEW_ENGLAND: MapView = {
  name: "new-england",
  centre: [-71.0995, 42.3876],
  at: [490, 300],
  scale: 300,
};

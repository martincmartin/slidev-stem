// Where a label of Part 2 goes, and what is under it (docs/globe.md, "The
// words"). Each of the globe's views is a picture: a map from a place to a
// slide point and back, and the land that it draws. On a story map's view,
// that is the map's own projection, which the map is drawn in; on the other
// views, the globe's camera. A label is at a place, a mark or a leg, with an
// offset in px, and its words are in the paper where only the sea is under
// them. No DOM: the tests run it in Node.

import type { View } from "../webgl/scene.ts";
import { inBox } from "./earth.ts";
import type { LonLat, LonLatBox, Polygon, Ring } from "./earth.ts";
import { EARTH_RADIUS, globeView, onGlobe } from "./globe.ts";
import type { GlobeCamera } from "./globe.ts";
import { project, unproject } from "./maps.ts";
import type { Point, Story } from "./stories.ts";

/** Land, with each ring's box, so that a test skips the rings far from a
 *  place. */
export interface Land {
  readonly rings: readonly {
    readonly ring: Ring;
    readonly box: LonLatBox;
  }[];
}

export function landOf(polygons: readonly Polygon[]): Land {
  return {
    rings: polygons.flat().map((ring) => {
      const lons = ring.map(([lon]) => lon);
      const lats = ring.map(([, lat]) => lat);
      return {
        ring,
        box: {
          west: Math.min(...lons),
          east: Math.max(...lons),
          south: Math.min(...lats),
          north: Math.max(...lats),
        },
      };
    }),
  };
}

/** Whether a place is on the land, by the even-odd rule over every ring, so
 *  a hole in a ring is not land. */
export function onLand(land: Land, [lon, lat]: LonLat): boolean {
  let inside = false;
  for (const { ring, box } of land.rings) {
    if (!inBox([lon, lat], box)) continue;
    for (
      let index = 0, last = ring.length - 1;
      index < ring.length;
      last = index++
    ) {
      const [x1, y1] = ring[index] ?? [0, 0];
      const [x2, y2] = ring[last] ?? [0, 0];
      if (
        y1 > lat !== y2 > lat &&
        lon < x1 + ((lat - y1) * (x2 - x1)) / (y2 - y1)
      )
        inside = !inside;
    }
  }
  return inside;
}

/** A view of the globe as a picture: where a place shows, where a slide
 *  point is (null off the globe), and the land that it draws. */
export interface Picture {
  readonly view: View;
  readonly point: (place: LonLat) => Point | null;
  readonly place: (point: Point) => LonLat | null;
  readonly land: Land;
  /** The story drawn over it, for a story map's view. */
  readonly story?: Story;
}

/** The place at `point` through a globe camera, or null off the globe: the
 *  inverse of `onGlobe`, the orthographic projection. */
export function offGlobe(camera: GlobeCamera, [x, y]: Point): LonLat | null {
  const east = (x - camera.at[0]) * camera.kmPerPx;
  const north = -(y - camera.at[1]) * camera.kmPerPx;
  const far = Math.hypot(east, north);
  if (far > EARTH_RADIUS) return null;
  const radians = Math.PI / 180;
  const [lon0, lat0] = [camera.centre[0] * radians, camera.centre[1] * radians];
  if (far === 0) return camera.centre;
  const angle = Math.asin(far / EARTH_RADIUS);
  const lat = Math.asin(
    Math.cos(angle) * Math.sin(lat0) +
      (north * Math.sin(angle) * Math.cos(lat0)) / far,
  );
  const lon =
    lon0 +
    Math.atan2(
      east * Math.sin(angle),
      far * Math.cos(angle) * Math.cos(lat0) -
        north * Math.sin(angle) * Math.sin(lat0),
    );
  return [lon / radians, lat / radians];
}

/** A globe camera's view as a picture. */
export function globePicture(camera: GlobeCamera, land: Land): Picture {
  const radians = Math.PI / 180;
  return {
    view: globeView(camera),
    point: (place) => {
      // the far side does not show
      const [lon, lat] = [place[0] * radians, place[1] * radians];
      const [lon0, lat0] = [
        camera.centre[0] * radians,
        camera.centre[1] * radians,
      ];
      const facing =
        Math.sin(lat0) * Math.sin(lat) +
        Math.cos(lat0) * Math.cos(lat) * Math.cos(lon - lon0);
      if (facing < 0) return null;
      const [east, south] = onGlobe(place, camera.centre);
      return [
        camera.at[0] + east / camera.kmPerPx,
        camera.at[1] + south / camera.kmPerPx,
      ];
    },
    place: (point) => offGlobe(camera, point),
    land,
  };
}

/** A story's map, its view as a picture, in the map's projection. */
export function mapPicture(story: Story, land: Land): Picture {
  const { placed } = story;
  return {
    view: placed.view,
    point: (place) => project(placed.map, place),
    place: (point) => unproject(placed.map, point),
    land,
    story,
  };
}

/** Slide px between the points of a box that `overSea` tests. */
const SEA_STEP = 6;

/** The box of a label's words on the slide, in slide px. */
export interface WordsBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Whether only the sea is under `box` in `picture`: no point of it on the
 *  land, or off the globe (where the paper is under it). */
export function overSea(picture: Picture, box: WordsBox): boolean {
  const columns = Math.max(1, Math.ceil(box.width / SEA_STEP));
  const rows = Math.max(1, Math.ceil(box.height / SEA_STEP));
  for (let column = 0; column <= columns; column++) {
    for (let row = 0; row <= rows; row++) {
      const place = picture.place([
        box.left + (box.width * column) / columns,
        box.top + (box.height * row) / rows,
      ]);
      if (!place || onLand(picture.land, place)) return false;
    }
  }
  return true;
}

/** What a label is placed from: a place, a mark of the view's story (a
 *  dashed ship), the end of one of its legs, or the slide's top left. */
export interface Anchor {
  readonly on?: LonLat | undefined;
  readonly mark?: string | undefined;
  readonly leg?: string | undefined;
}

/** The slide point of `anchor` in `picture`. Throws if it names more than
 *  one thing, a mark or a leg that the view's story does not have, or a
 *  place on the far side of the globe. */
export function anchorPoint(picture: Picture, anchor: Anchor): Point {
  const { on, mark, leg } = anchor;
  const named = [on, mark, leg].filter((each) => each !== undefined);
  if (named.length > 1) throw new Error("a label: on, mark or leg, not two");
  const where = `on the view ${picture.view.name}`;
  if (on) {
    const point = picture.point(on);
    if (!point) throw new Error(`a label: [${on.join(", ")}] is not ${where}`);
    return point;
  }
  if (mark !== undefined) {
    const found = picture.story?.marks.find((each) => each.name === mark);
    if (!found?.ghost)
      throw new Error(`a label: no dashed ship "${mark}" ${where}`);
    return found.ghost;
  }
  if (leg !== undefined) {
    const found = picture.story?.legs.find((each) => each.name === leg);
    const end = found?.route.at(-1);
    if (!end) throw new Error(`a label: no leg "${leg}" ${where}`);
    return end;
  }
  return [0, 0];
}

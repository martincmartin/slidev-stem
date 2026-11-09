// The globe of the talk, made once at load from globe/earth.json, and the
// matrices that each frame needs: the disc turns to face the camera
// (docs/globe.md, "The globe"), and the Longitude From Time slide's noon line and
// clock follow it.

import { towardCamera } from "../webgl/renderer.ts";
import type { CameraAngles, Group, Mesh, Piece, View } from "../webgl/scene.ts";
import type { Matrix4 } from "../webgl/math.ts";
import earthFile from "./earth.json" with { type: "json" };
import { parseEarth } from "./earth.ts";
import type { Polygon } from "./earth.ts";
import { DISC_GROUP, discMatrix, globeMeshes } from "./globe.ts";
import { STORY_MAPS, placeMap } from "./maps.ts";
import { globePicture, landOf, mapPicture } from "./labels.ts";
import type { Picture } from "./labels.ts";
import {
  DIAL_GROUP,
  HOUR_GROUP,
  MINUTE_GROUP,
  NOON_GROUP,
  noonMatrices,
  noonPiece,
} from "./noon.ts";
import { makeStories } from "./stories.ts";
import type { Story } from "./stories.ts";
import { globeCameras } from "./views.ts";

const EARTH = parseEarth(earthFile);
/** The finest level's land: the story maps' land, and the coast that
 *  their views fit. */
const FINEST: readonly Polygon[] = EARTH.levels.at(-1)?.polygons ?? [];
/** The land under a label: the story maps', and the whole Earth's at
 *  1:50m for the other views (`overSea`). */
const MAP_LAND = landOf(FINEST);
const GLOBE_LAND = landOf(EARTH.levels[1]?.polygons ?? []);

/** The globe's part of a scene. */
export interface Globe {
  readonly meshes: readonly Mesh[];
  readonly groups: readonly Group[];
  readonly views: readonly View[];
  /** `globe`, and `noon`, a mark on it for one slide. */
  readonly pieces: readonly Piece[];
  /** The stories, each on its story map (`Story.placed`), placed on the
   *  globe: drawn over it in SVG, with the story's marks. */
  readonly stories: readonly Story[];
  /** Each view as a picture: where its labels go, and what is under them. */
  readonly pictures: readonly Picture[];
}

/** The globe, for a slide of `slide` px. */
export function makeGlobe(slide: readonly [number, number]): Globe {
  const { meshes, piece } = globeMeshes(EARTH);
  const noon = noonPiece();
  const maps = STORY_MAPS.map((map) =>
    placeMap(map, FINEST, EARTH.borders, slide),
  );
  const stories = makeStories(maps, slide);
  const pictures = [
    ...globeCameras(slide).map((camera) => globePicture(camera, GLOBE_LAND)),
    ...stories.map((story) => mapPicture(story, MAP_LAND)),
  ];
  return {
    meshes: [...meshes, ...noon.meshes],
    groups: [DISC_GROUP, NOON_GROUP, DIAL_GROUP, HOUR_GROUP, MINUTE_GROUP],
    views: pictures.map(({ view }) => view),
    pieces: [piece, noon.piece],
    stories,
    pictures,
  };
}

/** The matrix of each of the globe's groups, for a frame whose camera is at
 *  `angles`. */
export function globeMatrices(angles: CameraAngles): Map<Group, Matrix4> {
  return new Map([
    [DISC_GROUP, discMatrix(towardCamera(angles))],
    ...noonMatrices(angles),
  ]);
}

// The globe of the talk, made from globe/earth.json when this module loads.
// It is the only module that imports the Earth's data, so a page loads it
// with `import()`, and only if it shows the globe (watch/instance.ts,
// docs/globe.md, "The globe in the deck"). The matrices that each frame
// needs are in matrices.ts.

import type { Group, Mesh, Piece, View } from "../webgl/scene.ts";
import earthFile from "./earth.json" with { type: "json" };
import { parseEarth } from "./earth.ts";
import type { Polygon } from "./earth.ts";
import { DISC_GROUP, globeMeshes } from "./globe.ts";
import { STORY_MAPS, placeMap } from "./maps.ts";
import { globePicture, landOf, mapPicture } from "./labels.ts";
import type { Picture } from "./labels.ts";
import {
  DIAL_GROUP,
  HOUR_GROUP,
  MINUTE_GROUP,
  NOON_GROUP,
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

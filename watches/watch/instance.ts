// The art of the page, the watch and, if the page shows it, the globe
// (art.ts), made once when the page starts; its stills; and the renderer that
// the article's figures share. The Vue layers (global-bottom.vue,
// slide-bottom.vue and components/FigureLayer.vue) share them.
//
// `loadArt` makes the art. The app's setup (setup/main.ts) calls it, and
// waits, before the app mounts: the slides ask for the globe, and an article
// page asks for it only if one of its slides shows it. globe/model.ts, with
// the Earth's data, is loaded with `import()`, so a page without the globe
// never downloads it (docs/globe.md, "The globe in the deck").

import type { Globe } from "../globe/model.ts";
import { globeMatrices } from "../globe/matrices.ts";
import { FIGURE_CLOCK_AT, NOON_CLOCK } from "../globe/noon.ts";
import type { SlidePoint } from "../globe/noon.ts";
import { SharedStage } from "../webgl/shared.ts";
import { withPoseGroups } from "../webgl/stage.ts";
import type { Model, PoseGroups } from "../webgl/stage.ts";
import { makeArt } from "./art.ts";
import type { Watch } from "./generate.ts";
import type { WatchModel, WatchModelState } from "./model.ts";
import { slidePalette } from "./palette.ts";
import { WatchStills } from "./stills.ts";

let made: { readonly art: Watch; readonly globe: Globe | null } | undefined;

/** Makes the page's art, with the globe if `withGlobe`: only then does the
 *  page load globe/model.ts and the Earth's data. Call it once, and wait,
 *  before anything asks for the art. A second call with the same choice
 *  does nothing; a call for the globe after the art was made without it
 *  throws. */
export async function loadArt(withGlobe: boolean): Promise<void> {
  const makeGlobe = withGlobe
    ? (await import("../globe/model.ts")).makeGlobe
    : null;
  if (made && withGlobe && made.globe === null) {
    throw new Error("the art was made without the globe");
  }
  made ??= makeArt(makeGlobe);
}

/** The page's art. Throws before `loadArt`. */
export function loadedArt(): Watch {
  if (!made) throw new Error("no art yet: setup/main.ts calls loadArt");
  return made.art;
}

/** The page's globe, with its story maps, or `null` if the page does not
 *  show it. Throws before `loadArt`. */
export function loadedGlobe(): Globe | null {
  if (!made) throw new Error("no art yet: setup/main.ts calls loadArt");
  return made.globe;
}

/** The globe's matrices with the Longitude From Time slide's clock at
 *  `clockAt`; none without the globe. */
function globeGroups(clockAt: SlidePoint): PoseGroups {
  return loadedGlobe() === null
    ? () => new Map()
    : (angles) => globeMatrices(angles, clockAt);
}

/** The watch's model, with the globe's disc turned to each frame's camera:
 *  the model of the slides' stage. */
export function artModel(watch: WatchModel): Model<WatchModelState> {
  return withPoseGroups(watch, globeGroups(NOON_CLOCK.at));
}

/** The model of an article's figure: as `artModel`, with the clock where a
 *  figure has it (`FIGURE_CLOCK_AT`). */
export function figureModel(watch: WatchModel): Model<WatchModelState> {
  return withPoseGroups(watch, globeGroups(FIGURE_CLOCK_AT));
}

let stills: WatchStills | undefined;

/** The stills that all pages share, made at the first call. Call it only in
 *  the browser. */
export function watchStills(): WatchStills {
  stills ??= new WatchStills(loadedArt(), globeGroups(NOON_CLOCK.at));
  return stills;
}

let shared: SharedStage<WatchModelState> | undefined;

/** The one renderer that the article's live figures share
 *  (webgl/shared.ts), made at the first call. Call it only in the browser. */
export function sharedStage(): SharedStage<WatchModelState> {
  shared ??= new SharedStage(loadedArt().scene, slidePalette().palette);
  return shared;
}

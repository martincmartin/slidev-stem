// The art of the talk, the watch and the globe (art.ts), made once at load,
// its stills, and the renderer that the article's figures share: the Vue
// layers (global-bottom.vue, slide-bottom.vue and components/FigureLayer.vue)
// share them.

import { globeMatrices } from "../globe/model.ts";
import { FIGURE_CLOCK_AT, NOON_CLOCK } from "../globe/noon.ts";
import type { SlidePoint } from "../globe/noon.ts";
import { SharedStage } from "../webgl/shared.ts";
import { withPoseGroups } from "../webgl/stage.ts";
import type { Model, PoseGroups } from "../webgl/stage.ts";
import { makeArt } from "./art.ts";
import type { WatchModel, WatchModelState } from "./model.ts";
import { slidePalette } from "./palette.ts";
import { WatchStills } from "./stills.ts";

const MADE = makeArt();
export const ART = MADE.art;
/** The globe in ART's scene, with its story maps. */
export const GLOBE = MADE.globe;

/** The globe's matrices with the Longitude From Time slide's clock at
 *  `clockAt`. */
function globeGroups(clockAt: SlidePoint): PoseGroups {
  return (angles) => globeMatrices(angles, clockAt);
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
  stills ??= new WatchStills(ART, globeGroups(NOON_CLOCK.at));
  return stills;
}

let shared: SharedStage<WatchModelState> | undefined;

/** The one renderer that the article's live figures share
 *  (webgl/shared.ts), made at the first call. Call it only in the browser. */
export function sharedStage(): SharedStage<WatchModelState> {
  shared ??= new SharedStage(ART.scene, slidePalette().palette);
  return shared;
}

// The art of the talk, the watch and the globe (art.ts), made once at load,
// its stills, and the renderer that the article's figures share: the Vue
// layers (global-bottom.vue, slide-bottom.vue and components/FigureLayer.vue)
// share them.

import { globeMatrices } from "../globe/model.ts";
import { SharedStage } from "../webgl/shared.ts";
import { withPoseGroups } from "../webgl/stage.ts";
import type { Model } from "../webgl/stage.ts";
import { makeArt } from "./art.ts";
import type { WatchModel, WatchModelState } from "./model.ts";
import { slidePalette } from "./palette.ts";
import { WatchStills } from "./stills.ts";

export const ART = makeArt();

/** The watch's model, with the globe's disc turned to each frame's camera:
 *  the model of a stage or a view of ART. */
export function artModel(watch: WatchModel): Model<WatchModelState> {
  return withPoseGroups(watch, globeMatrices);
}

let stills: WatchStills | undefined;

/** The stills that all pages share, made at the first call. Call it only in
 *  the browser. */
export function watchStills(): WatchStills {
  stills ??= new WatchStills(ART, globeMatrices);
  return stills;
}

let shared: SharedStage<WatchModelState> | undefined;

/** The one renderer that the article's live figures share
 *  (webgl/shared.ts), made at the first call. Call it only in the browser. */
export function sharedStage(): SharedStage<WatchModelState> {
  shared ??= new SharedStage(ART.scene, slidePalette().palette);
  return shared;
}

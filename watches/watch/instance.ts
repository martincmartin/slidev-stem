// The watch of the talk, made once at load, its stills, and the renderer that
// the article's figures share: the Vue layers (global-bottom.vue,
// slide-bottom.vue and components/FigureLayer.vue) share them.

import { SharedStage } from "../webgl/shared.ts";
import { generate } from "./generate.ts";
import type { WatchModelState } from "./model.ts";
import { slidePalette } from "./palette.ts";
import { WatchStills } from "./stills.ts";

export const WATCH = generate();

let stills: WatchStills | undefined;

/** The stills that all pages share, made at the first call. Call it only in
 *  the browser. */
export function watchStills(): WatchStills {
  stills ??= new WatchStills(WATCH);
  return stills;
}

let shared: SharedStage<WatchModelState> | undefined;

/** The one renderer that the article's live figures share
 *  (webgl/shared.ts), made at the first call. Call it only in the browser. */
export function sharedStage(): SharedStage<WatchModelState> {
  shared ??= new SharedStage(WATCH.scene, slidePalette().palette);
  return shared;
}

// The watch of the talk, made once at load, and its stills: the two Vue
// layers (global-bottom.vue and slide-bottom.vue) share them.

import { SharedStage } from "../webgl/shared.ts";
import { generate } from "./generate.ts";
import type { WatchModelState } from "./model.ts";
import { themePalette } from "./palette.ts";
import { WatchStills } from "./stills.ts";

export const WATCH = generate();

let shared: SharedStage<WatchModelState> | undefined;

/** The one renderer that the page's live figures share (the follow-up's
 *  prototype: webgl/shared.ts), made at the first call. Browser only. */
export function sharedStage(): SharedStage<WatchModelState> {
  shared ??= new SharedStage(WATCH.scene, themePalette());
  return shared;
}

let stills: WatchStills | undefined;

/** The stills that all pages share, made at the first call, with the colours
 *  of the theme that is on the page then. Call it only in the browser. */
export function watchStills(): WatchStills {
  stills ??= new WatchStills(WATCH, themePalette());
  return stills;
}

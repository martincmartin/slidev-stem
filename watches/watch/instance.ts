// The watch of the talk, made once at load, and its stills: the two Vue
// layers (global-bottom.vue and slide-bottom.vue) share them.

import { generate } from "./generate.ts";
import { WatchStills } from "./stills.ts";

export const WATCH = generate();
export const WATCH_STILLS = new WatchStills(WATCH);

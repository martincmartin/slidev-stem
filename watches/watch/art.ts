// The deck's live art: the watch and the globe in one scene, seen by one
// camera, so that a slide names either with the same keys (`art: [globe]`,
// `artView: cape noir`; docs/globe.md, "The globe in the deck"). No DOM: the
// scene's dump (dump.ts) and the tests make it in Node.

import type { Globe } from "../globe/model.ts";
import { makeGlobe } from "../globe/model.ts";
import { generate } from "./generate.ts";
import type { Watch } from "./generate.ts";

/** The watch, with the globe's meshes, groups, views and pieces in its
 *  scene. The globe's pieces have no extent: a slide that shows one names its
 *  view. */
export function withGlobe(watch: Watch, globe: Globe): Watch {
  const { scene } = watch;
  return {
    ...watch,
    scene: {
      ...scene,
      meshes: [...scene.meshes, ...globe.meshes],
      groups: [...scene.groups, ...globe.groups],
      views: [...scene.views, ...globe.views],
      pieces: [...scene.pieces, ...globe.pieces],
    },
  };
}

/** The art of the talk, and its globe (for the story maps over it). */
export function makeArt(): { readonly art: Watch; readonly globe: Globe } {
  const watch = generate();
  const globe = makeGlobe(watch.scene.slide);
  return { art: withGlobe(watch, globe), globe };
}

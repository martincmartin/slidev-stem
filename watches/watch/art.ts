// The deck's live art: the watch and the globe in one scene, seen by one
// camera, so that a slide names either with the same keys (`art: [globe]`,
// `artView: cape noir`; docs/globe.md, "The globe in the deck"). No DOM: the
// scene's dump (dump.ts) and the tests make it in Node.
//
// The globe is made only if the caller gives `makeGlobe`: in the browser, a
// page imports globe/model.ts, and the Earth's data, only if it shows the
// globe (instance.ts).

import { GLOBE_PIECE } from "../globe/globe.ts";
import type { Globe } from "../globe/model.ts";
import { NOON_PIECE } from "../globe/noon.ts";
import { generate } from "./generate.ts";
import type { Watch } from "./generate.ts";
import { watchState } from "./state.ts";

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

/** Makes the globe for a slide of the given size (`makeGlobe` in
 *  globe/model.ts). */
export type GlobeMaker = (slide: readonly [number, number]) => Globe;

/** The art of the talk: the watch, and the globe (for the story maps over
 *  it) if `makeGlobe` is given; else the watch alone, and `globe` is
 *  `null`. */
export function makeArt(makeGlobe: GlobeMaker | null): {
  readonly art: Watch;
  readonly globe: Globe | null;
} {
  const watch = generate();
  if (makeGlobe === null) return { art: watch, globe: null };
  const globe = makeGlobe(watch.scene.slide);
  return { art: withGlobe(watch, globe), globe };
}

/** The pieces of the globe's part of the scene. */
const GLOBE_PIECES: readonly string[] = [GLOBE_PIECE, NOON_PIECE];

/** Whether a slide shows a piece of the globe at any of its clicks, from its
 *  frontmatter alone: a page decides so whether to load the globe, before
 *  any art is made. `art: all` leaves the globe out. */
export function showsGlobe(frontmatter: Record<string, unknown>): boolean {
  const total = Number(frontmatter["clicks"] ?? 0);
  for (let clicks = 0; clicks <= total; clicks++) {
    const state = watchState(frontmatter, clicks);
    if (
      state !== undefined &&
      state.show !== "all" &&
      state.show.some((name) => GLOBE_PIECES.includes(name))
    ) {
      return true;
    }
  }
  return false;
}

// The deck's watch states, read in the browser from slides.md and the pages
// that it imports (`src:`): for the explorer, so that it offers the deck's
// own poses and speed-ups, not a copy of them. watch/deck.ts reads the same
// in Node, for the tests, with Slidev's file loader.

import { parseSync } from "@slidev/parser/core";
import { watchState } from "../state.ts";
import type { WatchState } from "../state.ts";
import deckSource from "../../slides.md?raw";

/** Each page that a slide can import, by its path from this file. */
const PAGES = import.meta.glob<string>("../../pages/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** A slide's watch at a click. */
export interface DeckPose {
  readonly title: string;
  readonly click: number;
  readonly state: WatchState;
}

interface Slide {
  title: string;
  frontmatter: Record<string, unknown>;
}

/** The deck's slides, with each `src:` page's slides in its place. The
 *  importing slide's frontmatter goes over the page's first slide's. */
function deckSlides(): Slide[] {
  return parseSync(deckSource, "slides.md").slides.flatMap((slide) => {
    const { src, ...frontmatter } = slide.frontmatter as Record<
      string,
      unknown
    >;
    if (typeof src !== "string") {
      return [{ title: slide.title ?? "", frontmatter }];
    }
    const path = `../../${src.replace(/^\.\//, "")}`;
    const page = PAGES[path];
    if (page === undefined)
      throw new Error(`slides.md imports ${src}: no page`);
    return parseSync(page, path).slides.map((imported, index) => ({
      title: (index === 0 ? slide.title : undefined) ?? imported.title ?? "",
      frontmatter:
        index === 0
          ? {
              ...(imported.frontmatter as Record<string, unknown>),
              ...frontmatter,
            }
          : (imported.frontmatter as Record<string, unknown>),
    }));
  });
}

/** Every click of every slide that shows the watch, in the deck's order. */
export function deckPoses(): DeckPose[] {
  return deckSlides().flatMap(({ title, frontmatter }) => {
    const clicks = Number(frontmatter["clicks"] ?? 0);
    const poses: DeckPose[] = [];
    for (let click = 0; click <= clicks; click++) {
      const state = watchState(frontmatter, click);
      if (state) poses.push({ title, click, state });
    }
    return poses;
  });
}

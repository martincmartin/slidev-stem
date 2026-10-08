// The deck's slides as Slidev reads them, with each `src:` import merged: for
// the tests, which read a slide's frontmatter from slides.md, not from a copy.

import { fileURLToPath } from "node:url";
import { load } from "@slidev/parser/fs";

const TALK = fileURLToPath(new URL("..", import.meta.url));

export interface DeckSlide {
  title: string;
  frontmatter: Record<string, unknown>;
}

/** Every slide of slides.md, hidden ones too, in order. */
export async function deckSlides(): Promise<DeckSlide[]> {
  const deck = await load(
    { roots: [TALK], userRoot: TALK, allowedRoots: [TALK] },
    `${TALK}/slides.md`,
  );
  return deck.slides.map((slide) => ({
    title: slide.title ?? "",
    frontmatter: slide.frontmatter as Record<string, unknown>,
  }));
}

/** The frontmatter of the first slide with this title. Throws if none has. */
export async function slideFrontmatter(
  title: string,
): Promise<Record<string, unknown>> {
  const found = (await deckSlides()).find((slide) => slide.title === title);
  if (!found) throw new Error(`no slide titled ${title}`);
  return found.frontmatter;
}

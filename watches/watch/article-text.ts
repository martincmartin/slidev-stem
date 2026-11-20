// The article as Markdown, on standard output: `pnpm article:text`, all of
// it, or `pnpm article:text --part 2`, one of its pages. For a reader that
// takes text, such as a chatbot asked for feedback (docs/article.md, "Export
// the text"). It reads slides.md as the tests do: no build and no browser.

import { parseArgs } from "node:util";
import {
  narrationText,
  parseNarration,
} from "../addons/narration/narration.ts";
import {
  articlePages,
  pageInput,
  pagePlan,
  slideInput,
} from "../addons/narration/plan.ts";
import type {
  FigureBlock,
  PageBlock,
  RenderedBlock,
  SlideInput,
} from "../addons/narration/plan.ts";
import { articleMarkdown } from "../addons/narration/text.ts";
import {
  BUTTON_WORDS,
  defaultFigures,
  figureSettings,
  pictureKey,
  SLIDER_WORDS,
} from "./article.ts";
import { deckSlides } from "./deck.ts";
import type { DeckSlide } from "./deck.ts";
import { makeGlobe } from "../globe/model.ts";
import { makeArt } from "./art.ts";
import type { Watch } from "./generate.ts";

/** The slides that the page shows: Slidev leaves the hidden ones out. */
function shownSlides(slides: readonly DeckSlide[]): DeckSlide[] {
  return slides.filter((slide) => slide.frontmatter["hide"] !== true);
}

/** The article's page for part `part` (from 1), as the page plans it, with
 *  its text in Markdown; `null`: the whole article, as one page. A figure's
 *  `slide` is its slide's place in `shownSlides`, from 1. Throws if the
 *  article has no such part. */
export function markdownPage(
  slides: readonly DeckSlide[],
  watch: Watch,
  part: number | null = null,
): PageBlock[] {
  const inputs = slideInputs(slides, watch);
  if (part === null) return pagePlan(inputs);
  const page = articlePages(inputs)[part - 1];
  if (!page) throw new Error(`the article has no part ${String(part)}`);
  return pagePlan(
    page.slides.map(({ slide, titleOnly }) => pageInput(slide, titleOnly)),
  );
}

/** The shown slides as the page reads them, with their text in Markdown. */
function slideInputs(slides: readonly DeckSlide[], watch: Watch): SlideInput[] {
  return shownSlides(slides).map((slide, index) => {
    const text = narrationText(slide.content);
    const parts =
      text === null
        ? null
        : parseNarration(text).map((part) => ({
            ...part,
            blocks: part.blocks.map((block): RenderedBlock =>
              block.kind === "figure" || block.kind === "quote"
                ? block
                : { ...block, text: block.markdown },
            ),
          }));
    return slideInput(
      {
        no: index + 1,
        title: slide.title || null,
        frontmatter: slide.frontmatter,
        parts,
      },
      {
        defaultFigures: (frontmatter, total) =>
          defaultFigures(watch, frontmatter, total),
        pictureKey,
      },
    );
  });
}

/** The article as Markdown: part `part`'s page, or all of it (`null`). A
 *  figure's controls are its slider and its button, at any of its steps, in
 *  their own words. */
export function articleText(
  slides: readonly DeckSlide[],
  watch: Watch,
  part: number | null = null,
): string {
  const shown = shownSlides(slides);
  const controlsOf = (figure: FigureBlock): string[] => {
    const frontmatter = shown[figure.slide - 1]?.frontmatter ?? {};
    const phrases = new Set<string>();
    for (const clicks of figure.steps) {
      const { slider, button } = figureSettings(frontmatter, clicks);
      if (slider) {
        const words = SLIDER_WORDS[slider];
        phrases.add(
          `a slider, "${words.label}", from "${words.start}" to "${words.end}"`,
        );
      }
      if (button) {
        const words = BUTTON_WORDS[button];
        phrases.add(
          `a button, "${words.label}"; a second press: "${words.undo}"`,
        );
      }
    }
    return [...phrases];
  };
  return articleMarkdown(markdownPage(slides, watch, part), controlsOf);
}

const USAGE = "usage: node watch/article-text.ts [--part N]";

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    options: { part: { type: "string" } },
    allowPositionals: true,
  });
  const part = values.part === undefined ? null : Number(values.part);
  if (positionals.length > 0 || (part !== null && !(part >= 1))) {
    console.error(USAGE);
    process.exitCode = 2;
  } else {
    process.stdout.write(
      articleText(await deckSlides(), makeArt(makeGlobe).art, part),
    );
  }
}

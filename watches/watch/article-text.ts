// The article as Markdown, on standard output: `pnpm article:text`. For a
// reader that takes text, such as a chatbot asked for feedback
// (docs/article.md, "Export the text"). It reads slides.md as the tests do:
// no build and no browser.

import {
  narrationText,
  parseNarration,
} from "../addons/narration/narration.ts";
import { pagePlan, slideInput } from "../addons/narration/plan.ts";
import type {
  FigureBlock,
  PageBlock,
  RenderedBlock,
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
import { generate } from "./generate.ts";
import type { Watch } from "./generate.ts";

/** The slides that the page shows: Slidev leaves the hidden ones out. */
function shownSlides(slides: readonly DeckSlide[]): DeckSlide[] {
  return slides.filter((slide) => slide.frontmatter["hide"] !== true);
}

/** The article's page, as the page plans it, with its text in Markdown. A
 *  figure's `slide` is its slide's place in `shownSlides`, from 1. */
export function markdownPage(
  slides: readonly DeckSlide[],
  watch: Watch,
): PageBlock[] {
  return pagePlan(
    shownSlides(slides).map((slide, index) => {
      const text = narrationText(slide.content);
      const parts =
        text === null
          ? null
          : parseNarration(text).map((part) => ({
              ...part,
              blocks: part.blocks.map((block): RenderedBlock =>
                block.kind === "figure"
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
    }),
  );
}

/** The article as Markdown. A figure's controls are its slider and its
 *  button, at any of its steps, in their own words. */
export function articleText(
  slides: readonly DeckSlide[],
  watch: Watch,
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
  return articleMarkdown(markdownPage(slides, watch), controlsOf);
}

if (import.meta.main) {
  process.stdout.write(articleText(await deckSlides(), generate()));
}

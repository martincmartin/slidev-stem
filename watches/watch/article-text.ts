// The article as Markdown, on standard output: `pnpm article:text`, all of
// it, or `pnpm article:text --part 2`, one of its pages. For a reader that
// takes text, such as a chatbot asked for feedback (docs/article.md, "Export
// the text"). `pnpm article:text --count`: the words of each part, and the
// time to read them, with and without the asides. It reads slides.md as the
// tests do: no build and no browser.

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
import {
  articleMarkdown,
  pageWords,
  READING_WORDS_PER_MINUTE,
  SPEAKING_WORDS_PER_MINUTE,
} from "../addons/narration/text.ts";
import type { PageWords } from "../addons/narration/text.ts";
import {
  BUTTON_WORDS,
  speedUpWords,
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
      const { slider, button, speedUp } = figureSettings(frontmatter, clicks);
      if (slider) {
        const words = SLIDER_WORDS[slider];
        phrases.add(
          `a slider, "${words.label}", from "${words.start}" to "${words.end}"`,
        );
      }
      for (const words of [
        ...(button ? [BUTTON_WORDS[button]] : []),
        ...(speedUp ? [speedUpWords(speedUp)] : []),
      ]) {
        phrases.add(
          `a button, "${words.label}"; a second press: "${words.undo}"`,
        );
      }
    }
    return [...phrases];
  };
  return articleMarkdown(markdownPage(slides, watch, part), controlsOf);
}

/** The words of each part's page that a reader reads (`pageWords`), in
 *  order, with the part's title. */
export function articleWords(
  slides: readonly DeckSlide[],
  watch: Watch,
): { readonly title: string; readonly words: PageWords }[] {
  const parts = articlePages(slideInputs(slides, watch)).length;
  return Array.from({ length: parts }, (_, index) => {
    const page = markdownPage(slides, watch, index + 1);
    const title = page.find((block) => block.kind === "title");
    return {
      title: title?.kind === "title" ? title.text : "",
      words: pageWords(page),
    };
  });
}

/** `articleWords` as a table: words and minutes to read them, without and
 *  with the asides, and minutes to say them without the asides, a row for
 *  each part and one for all. */
function wordTable(
  parts: readonly { readonly title: string; readonly words: PageWords }[],
): string {
  const number = new Intl.NumberFormat("en-US");
  const minutes = (words: number): string =>
    `${String(Math.round(words / READING_WORDS_PER_MINUTE))} min`;
  const { slow, fast } = SPEAKING_WORDS_PER_MINUTE;
  const speaking = (words: number): string =>
    `${String(Math.round(words / fast))}–${String(Math.round(words / slow))} min`;
  const row = (name: string, words: PageWords, title: string): string[] => {
    const all = words.body + words.asides;
    return [
      name,
      number.format(words.body),
      minutes(words.body),
      number.format(all),
      minutes(all),
      speaking(words.body),
      title,
    ];
  };
  const total = parts.reduce(
    (sum, { words }) => ({
      body: sum.body + words.body,
      asides: sum.asides + words.asides,
    }),
    { body: 0, asides: 0 },
  );
  const rows = [
    ["", "Words", "Reading", "With asides", "Reading", "Speaking", ""],
    ...parts.map(({ title, words }, index) =>
      row(`Part ${String(index + 1)}`, words, title),
    ),
    row("All", total, ""),
  ];
  const widths = rows[0]?.map((_, column) =>
    Math.max(...rows.map((cells) => (cells[column] ?? "").length)),
  );
  const lines = rows.map((cells) =>
    cells
      .map((cell, column) => {
        const width = widths?.[column] ?? 0;
        // the name and the title go left; the numbers right
        return column === 0 || column === cells.length - 1
          ? cell.padEnd(width)
          : cell.padStart(width);
      })
      .join("  ")
      .trimEnd(),
  );
  return [
    lines.join("\n"),
    "",
    `Reading: at ${String(READING_WORDS_PER_MINUTE)} words a minute. Speaking: the words without the asides, at ${String(slow)} to ${String(fast)} words a minute; the narration is close to what the talk says, but a rehearsal with a clock gives the real time.`,
    "Not counted: the figures' alt text, their controls and the photo credits.",
    "",
  ].join("\n");
}

const USAGE = "usage: node watch/article-text.ts [--part N | --count]";

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    options: { part: { type: "string" }, count: { type: "boolean" } },
    allowPositionals: true,
  });
  const part = values.part === undefined ? null : Number(values.part);
  if (
    positionals.length > 0 ||
    (part !== null && !(part >= 1)) ||
    (part !== null && values.count === true)
  ) {
    console.error(USAGE);
    process.exitCode = 2;
  } else if (values.count === true) {
    process.stdout.write(
      wordTable(articleWords(await deckSlides(), makeArt(makeGlobe).art)),
    );
  } else {
    process.stdout.write(
      articleText(await deckSlides(), makeArt(makeGlobe).art, part),
    );
  }
}

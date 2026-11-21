// The article as Markdown: for a reader that takes text, such as a chatbot
// asked for feedback. The headings, the history lines, the prose, the asides
// (each after its paragraph) and the pull quotes, in order, and each figure in
// its place, as its alt
// text and what a reader can do with it. Also the count of the words that a
// reader reads (`pageWords`). No Slidev and no DOM here: the talk's script gives
// the page, with its text in Markdown, and the words for a figure's controls
// (../../docs/article.md, "Export the text").

import type { FigureBlock, PageBlock } from "./plan.ts";

/** `text` as a Markdown quote: each line after "> ". */
function quote(text: string): string {
  return text
    .split("\n")
    .map((line) => (line === "" ? ">" : `> ${line}`))
    .join("\n");
}

/** A figure, in square brackets: its alt text, then what a reader can do
 *  with it. A playing figure's captions follow, one for each step that
 *  changes it. */
function figureText(figure: FigureBlock, controls: readonly string[]): string {
  const sentences = [figure.alt ?? "(no alt text)"];
  if (figure.play) {
    sentences.push(
      `It plays by itself, in ${String(figure.steps.length)} steps, with a caption at each.`,
    );
  } else if (figure.steps.length > 1) {
    sentences.push(
      `The reader steps through it, in ${String(figure.steps.length)} steps.`,
    );
  }
  if (controls.length > 0) sentences.push(`Controls: ${controls.join("; ")}.`);
  const chunks = [`[Figure: ${sentences.join(" ")}]`];
  let previous: string | null = null;
  for (const [step, caption] of figure.captions.entries()) {
    if (caption === null || caption === previous) continue;
    previous = caption;
    chunks.push(
      quote(`**Caption, step ${String(step + 1)}:** ${caption.trim()}`),
    );
  }
  return chunks.join("\n\n");
}

/** The page as Markdown. The page's text must be Markdown: the plan passes
 *  it through. `controlsOf` gives what a reader can do with a figure, apart
 *  from its steps, as phrases. */
export function articleMarkdown(
  page: readonly PageBlock[],
  controlsOf: (figure: FigureBlock) => readonly string[],
): string {
  const chunks: string[] = [];
  for (const block of page) {
    switch (block.kind) {
      case "title":
        if (block.series) {
          chunks.push(
            `_${block.series}${block.eyebrow ? ` · ${block.eyebrow}` : ""}_`,
          );
        }
        chunks.push(`# ${block.text}`);
        if (block.subtitle) chunks.push(`_${block.subtitle}_`);
        break;
      case "part":
        chunks.push(
          `## ${block.eyebrow ? `${block.eyebrow}: ` : ""}${block.text}`,
        );
        break;
      case "heading":
        chunks.push(`### ${block.text}`);
        if (block.history) chunks.push(`_${block.history}_`);
        break;
      case "prose":
        chunks.push(block.text.trim());
        for (const aside of block.asides) {
          chunks.push(
            quote(`**Aside: ${aside.title}**\n\n${aside.text.trim()}`),
          );
        }
        break;
      case "credit":
        chunks.push(`**Credit:** ${block.text.trim()}`);
        break;
      case "quote":
        // a backslash at a line's end is Markdown's line break
        chunks.push(quote(block.lines.join("\\\n")));
        break;
      case "figure":
        chunks.push(figureText(block, controlsOf(block)));
        break;
    }
  }
  return `${chunks.join("\n\n")}\n`;
}

/** Words a minute: adults' silent reading of English non-fiction, the
 *  average of a meta-analysis of 190 studies (Brysbaert, "How many words do
 *  we read per minute?", Journal of Memory and Language 109, 2019). */
export const READING_WORDS_PER_MINUTE = 238;

/** Words a minute, the slow and the fast end: the usual range of a speaker
 *  who explains to a room, from slides. An estimate: a talk's real time
 *  comes from a rehearsal with a clock. */
export const SPEAKING_WORDS_PER_MINUTE = { slow: 130, fast: 160 } as const;

/** The words of a page that a reader reads, by where they are. */
export interface PageWords {
  /** The titles, headings, history lines, prose, pull quotes and a playing
   *  figure's captions. */
  readonly body: number;
  /** The asides' titles and text. */
  readonly asides: number;
}

/** The words in Markdown `text`: a link counts as its text, and an HTML
 *  tag as nothing; a word is a run with a letter or a digit in it. */
export function wordCount(text: string): number {
  const plain = text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ");
  return plain.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token))
    .length;
}

/** The words of `page` that a reader reads. Not the figures' alt text, which
 *  only a screen reader reads, their controls' words, or the photo credits. */
export function pageWords(page: readonly PageBlock[]): PageWords {
  let body = 0;
  let asides = 0;
  for (const block of page) {
    switch (block.kind) {
      case "title":
        for (const text of [block.text, block.subtitle ?? ""]) {
          body += wordCount(text);
        }
        break;
      case "part":
        body += wordCount(block.text);
        break;
      case "heading":
        body += wordCount(block.text) + wordCount(block.history ?? "");
        break;
      case "prose":
        body += wordCount(block.text);
        for (const aside of block.asides) {
          asides += wordCount(aside.title) + wordCount(aside.text);
        }
        break;
      case "quote":
        body += wordCount(block.lines.join("\n"));
        break;
      case "figure":
        // a caption that stays from one step to the next is read once
        block.captions.forEach((caption, step) => {
          if (caption !== block.captions[step - 1]) {
            body += wordCount(caption ?? "");
          }
        });
        break;
      case "credit":
        break;
    }
  }
  return { body, asides };
}

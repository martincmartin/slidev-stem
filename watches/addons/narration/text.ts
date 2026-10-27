// The article as Markdown: for a reader that takes text, such as a chatbot
// asked for feedback. The headings, the history lines, the prose and the
// asides, in order, and each figure in its place, as its alt text and what a
// reader can do with it. No Slidev and no DOM here: the talk's script gives
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
        chunks.push(`# ${block.text}`);
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
        break;
      case "aside":
        chunks.push(quote(`**Aside: ${block.title}**\n\n${block.text.trim()}`));
        break;
      case "figure":
        chunks.push(figureText(block, controlsOf(block)));
        break;
    }
  }
  return `${chunks.join("\n\n")}\n`;
}

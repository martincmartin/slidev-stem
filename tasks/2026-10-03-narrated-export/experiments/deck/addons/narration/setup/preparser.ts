// The narration of each slide: a `<!-- narration ... -->` comment in the slide,
// before its speaker notes (the notes must stay the slide's last comment).
// `[click]` and `[click:N]` split it, as in the notes. This extension renders
// each part to HTML and puts the parts in the slide's frontmatter, as
// `narration: [{ clicks, html }, ...]`, so the client gets them in dev and in a
// build. The comment stays in the slide's content: Vue drops comments from a
// production build, and the content written back by Slidev's editor is
// unchanged.
import { definePreparserSetup } from "@slidev/types";
import MarkdownExit from "markdown-exit";

const NARRATION = /<!--\s*narration\s*\n([\s\S]*?)-->/;
const CLICK = /\[click(?::(\d+))?\]/gi;

interface NarrationPart {
  /** The click from which this part is said. */
  clicks: number;
  html: string;
}

const markdown = MarkdownExit({ html: true });

function parts(text: string): NarrationPart[] {
  const result: NarrationPart[] = [];
  let clicks = 0;
  let start = 0;
  const add = (end: number): void => {
    const source = text.slice(start, end).trim();
    if (source) result.push({ clicks, html: markdown.render(source) });
  };
  for (const match of text.matchAll(CLICK)) {
    add(match.index);
    clicks += Number(match[1] ?? 1);
    start = match.index + match[0].length;
  }
  add(text.length);
  return result;
}

export default definePreparserSetup(() => [
  {
    name: "narration",
    transformSlide(content, frontmatter: Record<string, unknown>) {
      const match = NARRATION.exec(content);
      if (match?.[1] !== undefined) frontmatter["narration"] = parts(match[1]);
      return Promise.resolve(undefined);
    },
  },
]);

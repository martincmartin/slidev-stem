// Each slide's narration (../narration.ts), rendered to HTML, into the slide's
// frontmatter as `narration` (`RenderedPart[]`, ../plan.ts): the client gets
// it in the dev server and in a build, where Vue has dropped the comments.
// The comment stays in the slide's content, unchanged, so Slidev's editor
// writes it back as it was. A slide with no narration gets no key.
import { definePreparserSetup } from "@slidev/types";
import { MARKDOWN, narrationText, parseNarration } from "../narration.ts";
import type { NarrationPart } from "../narration.ts";
import type { RenderedPart } from "../plan.ts";

function rendered(part: NarrationPart): RenderedPart {
  return {
    clicks: part.clicks,
    noFigure: part.noFigure,
    blocks: part.blocks.map((block) => {
      switch (block.kind) {
        case "prose":
          return { kind: "prose", text: MARKDOWN.render(block.markdown) };
        case "aside":
          return {
            kind: "aside",
            title: MARKDOWN.renderInline(block.title),
            text: MARKDOWN.render(block.markdown),
          };
        case "credit":
          return {
            kind: "credit",
            text: MARKDOWN.renderInline(block.markdown),
          };
        case "quote":
          return {
            ...block,
            lines: block.lines.map((line) => MARKDOWN.renderInline(line)),
          };
        case "figure":
          return block;
      }
    }),
  };
}

export default definePreparserSetup(() => [
  {
    name: "narration",
    transformSlide(content: string, frontmatter: Record<string, unknown>) {
      const text = narrationText(content);
      if (text !== null) {
        frontmatter["narration"] = parseNarration(text).map(rendered);
      }
      return Promise.resolve(undefined);
    },
  },
]);

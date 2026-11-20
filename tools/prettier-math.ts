// A Prettier plugin that refuses a Markdown file or a deck with `*` in its
// math, before Prettier changes it. Prettier reads two `*` in one paragraph
// as emphasis, also inside `$…$` (`$a^*$ and $b^*$`), and writes them as `_`,
// with no error. The Slidev parser formats a slide's prose the same way.
// Write `\ast` instead: it renders the same.
//
// The root's .prettierrc loads it, so every run of Prettier checks first: the
// root's and each talk's `pnpm format` and `format:check`, a direct
// `prettier`, and an editor's format on save. The config names it twice: at
// the top level, for Prettier's Markdown parser, and in the deck override,
// after prettier-plugin-slidev, for the Slidev parser (an override's
// `plugins` replace the top-level list). A copy of the Bogleheads survey
// deck's scripts/prettier-math.ts.
import type { Parser } from "prettier";
import { parsers as markdownParsers } from "prettier/plugins/markdown";
import slidevPlugin from "prettier-plugin-slidev";

/** A formula that holds `*`, and the line where it starts (from 1). */
export interface StarInMath {
  readonly line: number;
  readonly formula: string;
}

// Code spans and fenced blocks: their `$` and `*` are not math.
const CODE =
  /^( {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[`~]*[ \t]*$|`+[^`\n]*`+/gm;
// Display math, `$$…$$`, over one line or more.
const DISPLAY_MATH = /\$\$[\s\S]*?\$\$/g;
// Inline math, as remark-math reads it: the opening `$` is not followed by a
// space, the closing `$` is not after a space or before a digit (so "$5 and
// $10" is not math), and a formula does not cross a blank line.
const INLINE_MATH =
  /(?<![\\$])\$(?![\s$])((?:[^$\n]|\n(?![ \t]*\n))*?[^\s\\$])\$(?!\d)/g;

/** Each formula in a Markdown text that holds `*`. */
export function starsInMath(text: string): StarInMath[] {
  // Blank out what is not math, keeping each newline so that line numbers hold.
  const blank = (match: string): string => match.replace(/[^\n]/g, " ");
  const withoutCode = text.replace(CODE, blank);
  const found: { index: number; formula: string }[] = [];
  const withoutDisplay = withoutCode.replace(
    DISPLAY_MATH,
    (formula, index: number) => {
      found.push({ index, formula });
      return blank(formula);
    },
  );
  for (const match of withoutDisplay.matchAll(INLINE_MATH)) {
    found.push({ index: match.index, formula: match[0] });
  }
  return found
    .filter((entry) => entry.formula.includes("*"))
    .sort((first, second) => first.index - second.index)
    .map((entry) => ({
      line: text.slice(0, entry.index).split("\n").length,
      formula: entry.formula,
    }));
}

/** The parser, but it first refuses a text with `*` in its math. */
function refusingStarsInMath(parser: Parser<unknown>): Parser<unknown> {
  return {
    ...parser,
    parse(text, options) {
      const stars = starsInMath(text);
      if (stars.length > 0) {
        const where = stars
          .map((star) => `  line ${String(star.line)}: ${star.formula}`)
          .join("\n");
        throw new Error(
          `\`*\` in math. Write \\ast instead (it renders the same): Prettier reads two \`*\` in one paragraph as emphasis, also inside $…$, and changes them to \`_\`.\n${where}`,
        );
      }
      return parser.parse(text, options);
    },
  };
}

const slidevParser = slidevPlugin.parsers?.["slidev"];
if (slidevParser === undefined) {
  throw new Error("prettier-plugin-slidev has no slidev parser");
}

export const parsers: Record<string, Parser<unknown>> = {
  markdown: refusingStarsInMath(markdownParsers.markdown),
  slidev: refusingStarsInMath(slidevParser),
};

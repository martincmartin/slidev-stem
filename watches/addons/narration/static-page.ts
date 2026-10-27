// The static article's page: the deck's index.html, with the article's HTML
// in it. prerender.ts makes the article and its stills; this puts them in
// the page.

import { parse } from "parse5";
import type { ParserError } from "parse5";

/** The class that ArticlePage.vue puts on <html>, here before any code runs. */
const ARTICLE_CLASS = "article-mode";

/** What the prerender puts in the deck's index.html. */
export interface ArticleParts {
  /** The article's HTML: the page's `<main>`, with stills for figures. */
  readonly article: string;
  /** The `<link>` elements of the styles that index.html does not load. */
  readonly head: string;
  readonly title: string;
}

/** `tag` (`<html …>`) with `name` added to its classes. A palette addon puts
 *  its class on <html> (stem/themes/palettes/README.md). A tag with two
 *  `class` attributes keeps only the first, so the page would lose the
 *  palette, and each figure's watch would throw. */
function withClass(tag: string, name: string): string {
  const classes = /\sclass="([^"]*)"/.exec(tag);
  if (classes === null) return tag.replace(/^<html/, `<html class="${name}"`);
  const [attribute, value = ""] = classes;
  return tag.replace(attribute, () => ` class="${`${value} ${name}`.trim()}"`);
}

/** The static article: `index` (the deck's index.html) with the article in
 *  `<div id="app">`, its title, its styles, and the article's class on
 *  <html>. */
export function staticPage(index: string, parts: ArticleParts): string {
  const tag = /<html\b[^>]*>/.exec(index)?.[0];
  if (tag === undefined) throw new Error("the deck's index.html has no <html>");
  // each replacement is a function: a string's `$&` and `$'` are patterns,
  // and the article has dollars in it
  const html = index
    .replace(tag, () => withClass(tag, ARTICLE_CLASS))
    .replace(/<title>[^<]*<\/title>/, () => `<title>${parts.title}</title>`)
    .replace("</head>", () => `${parts.head}\n</head>`)
    .replace(
      '<div id="app"></div>',
      () => `<div id="app">${parts.article}</div>`,
    );
  if (!html.includes(parts.article)) {
    throw new Error('the deck\'s index.html has no <div id="app"></div>');
  }
  const errors = parseErrors(html);
  if (errors.length > 0) {
    const where = errors.map(
      (error) =>
        `${error.code} at line ${String(error.startLine)}, column ${String(error.startCol)}`,
    );
    throw new Error(`the static page is not valid HTML: ${where.join("; ")}`);
  }
  return html;
}

/** The errors that the HTML standard's tokenizer finds in `html` (parse5
 *  does not report the tree builder's, such as a misnested tag). A browser
 *  reads such a page with no error, but in its own way: of two `class`
 *  attributes, it keeps the first. */
export function parseErrors(html: string): ParserError[] {
  const errors: ParserError[] = [];
  parse(html, {
    onParseError: (error) => {
      errors.push(error);
    },
  });
  return errors;
}

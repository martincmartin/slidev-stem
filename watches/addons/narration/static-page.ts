// The static article's page: the deck's index.html, with the article's HTML
// in it. prerender.ts makes the article and its stills; this puts them in
// the page.

import { parse } from "parse5";
import type { ParserError } from "parse5";

/** The class that ArticlePage.vue puts on <html>, here before any code runs. */
const ARTICLE_CLASS = "article-mode";

/** A page's preview image: a still, at its absolute URL, and its size in
 *  px. */
export interface PreviewImage {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

/** What a link's preview and a search engine read of a page, apart from its
 *  title. A URL is absolute, so it needs the site's origin; without one, it
 *  is `null`, and the page has no such tag. */
export interface PageMeta {
  readonly description: string | null;
  readonly url: string | null;
  readonly image: PreviewImage | null;
}

/** What the prerender puts in the deck's index.html. */
export interface ArticleParts {
  /** The article's HTML: the page's `<main>`, with stills for figures. */
  readonly article: string;
  /** The `<link>` elements of the styles that index.html does not load. */
  readonly head: string;
  readonly title: string;
  readonly meta: PageMeta;
}

/** `text` safe in an attribute's quotes, or in an element's text. */
function escaped(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The page's `<meta>` tags: its description, and the Open Graph tags of a
 *  link's preview (https://ogp.me). */
function metaTags(title: string, meta: PageMeta): string {
  const tags: [string, string, string][] = [["property", "og:type", "article"]];
  tags.push(["property", "og:title", title]);
  if (meta.description !== null) {
    tags.push(["name", "description", meta.description]);
    tags.push(["property", "og:description", meta.description]);
  }
  if (meta.url !== null) tags.push(["property", "og:url", meta.url]);
  if (meta.image !== null) {
    tags.push(["property", "og:image", meta.image.url]);
    tags.push(["property", "og:image:width", String(meta.image.width)]);
    tags.push(["property", "og:image:height", String(meta.image.height)]);
  }
  return tags
    .map(
      ([kind, name, content]) =>
        `<meta ${kind}="${name}" content="${escaped(content)}">`,
    )
    .join("\n");
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
 *  `<div id="app">`, its title, its `<meta>` tags in place of the deck's
 *  (Slidev writes an `og:title` of its own), its styles, and the article's
 *  class on <html>. */
export function staticPage(index: string, parts: ArticleParts): string {
  const tag = /<html\b[^>]*>/.exec(index)?.[0];
  if (tag === undefined) throw new Error("the deck's index.html has no <html>");
  // each replacement is a function: a string's `$&` and `$'` are patterns,
  // and the article has dollars in it
  const html = index
    .replace(tag, () => withClass(tag, ARTICLE_CLASS))
    .replace(
      /<title>[^<]*<\/title>/,
      () => `<title>${escaped(parts.title)}</title>`,
    )
    .replace(/<meta (?:property="og:|name="description")[^>]*>\n?/g, "")
    .replace(
      "</head>",
      () => `${metaTags(parts.title, parts.meta)}\n${parts.head}\n</head>`,
    )
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

/** A page that sends its reader to `target`, a URL relative to the page:
 *  the article's address with no part (`article/`) goes to the first part.
 *  A static host has no redirect rules, so the page does it: a refresh, and
 *  a link for a browser that does not follow it. */
export function redirectPage(target: string): string {
  const href = target.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${href}">
<meta name="robots" content="noindex">
<title>The article</title>
</head>
<body>
<p><a href="${href}">Go to the article.</a></p>
</body>
</html>
`;
}

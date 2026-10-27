// The static article's page, from the deck's index.html.

import assert from "node:assert/strict";
import { test } from "node:test";
import { staticPage } from "./static-page.ts";

const PARTS = {
  article: "<main>The article</main>",
  head: '<link rel="stylesheet" href="/a.css">',
  title: "The talk",
};

function index(htmlTag: string): string {
  return `<!DOCTYPE html>\n${htmlTag}<head><title>Slidev</title></head><body><div id="app"></div></body></html>`;
}

test("the article's class joins the palette's on <html>", () => {
  const page = staticPage(
    index('<html lang="en" class="palette-ledger">'),
    PARTS,
  );
  assert.match(page, /<html lang="en" class="palette-ledger article-mode">/);
  assert.equal(page.match(/\sclass=/g)?.length, 1);
});

test("an <html> with no class gets the article's", () => {
  const page = staticPage(index('<html lang="en">'), PARTS);
  assert.match(page, /<html class="article-mode" lang="en">/);
});

test("the page has the article, its title and its styles", () => {
  const page = staticPage(index("<html>"), PARTS);
  assert.match(page, /<title>The talk<\/title>/);
  assert.match(page, /<link rel="stylesheet" href="\/a.css">\n<\/head>/);
  assert.match(page, /<div id="app"><main>The article<\/main><\/div>/);
});

test("the article's dollar signs are its own text", () => {
  const article = "<main>It costs $100, not $&amp; or $' or $`.</main>";
  const page = staticPage(index("<html>"), { ...PARTS, article });
  assert.ok(page.includes(`<div id="app">${article}</div>`));
});

test("an index.html with no app element is an error", () => {
  assert.throws(
    () => staticPage("<html><head></head><body></body></html>", PARTS),
    /no <div id="app">/,
  );
});

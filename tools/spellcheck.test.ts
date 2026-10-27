import assert from "node:assert/strict";
import { test } from "node:test";
import { visibleText, type SlideLines } from "./spellcheck.ts";

/** The words that show in `source`, one slide from its first line to its
 *  last, with its frontmatter up to `contentStart`. */
function shownWords(source: string, contentStart: number): string[] {
  const slide: SlideLines = {
    start: 0,
    contentStart,
    end: source.split("\n").length,
  };
  return visibleText(source, [slide]).split(/\s+/).filter(Boolean);
}

test("each line and column stays where it was", () => {
  const source =
    '---\ntitle: Gears\nwatch: [centre wheel]\n---\n\n# Gears\n<div class="a">Hi</div>\n';
  const shown = visibleText(source, [{ start: 0, contentStart: 4, end: 8 }]);
  assert.equal(shown.length, source.length);
  assert.deepEqual(
    shown.split("\n").map((line) => line.trim()),
    ["", "Gears", "", "", "", "# Gears", "Hi", ""],
  );
  assert.equal(
    shown.split("\n")[6]?.indexOf("Hi"),
    source.split("\n")[6]?.indexOf("Hi"),
  );
});

test("a frontmatter value shows only for a shown key", () => {
  const source =
    '---\ntitle: Gears\nhistory: "c. 1675"\nwatchFlash: [centre wheel]\nclass: colour\n---\n';
  assert.deepEqual(shownWords(source, 6), ["Gears", "c.", "1675"]);
});

test("the narration shows, but not its markers; a figure's alt text shows", () => {
  const source = [
    "<!-- narration",
    "Start here.",
    "[nofigure]",
    "",
    "[click:2] Then this.",
    "",
    "[figure 2-3: The wheel turns.]",
    "",
    "> [!aside] Why?",
    "> Because.",
    "-->",
    "",
    "<!-- The note. -->",
  ].join("\n");
  assert.deepEqual(shownWords(source, 0), [
    "Start",
    "here.",
    "Then",
    "this.",
    "The",
    "wheel",
    "turns.",
    ">",
    "Why?",
    ">",
    "Because.",
    "The",
    "note.",
  ]);
});

test("a comment that is neither the narration nor the note does not show", () => {
  const source =
    "<!-- a colour for the code -->\n# Title\n<!-- The note. -->\nText\n";
  // the last comment has text after it, so it is not the note
  assert.deepEqual(shownWords(source, 0), ["#", "Title", "Text"]);
});

test("code, styles, tags, attributes and expressions do not show", () => {
  const source = [
    "<style>",
    ".a { colour: red }",
    "</style>",
    '<div v-click :class="{ on: $clicks >= 4 }">Shown</div>',
    "`centre` and {{ colour }}",
    "```ts",
    "const colour = 1;",
    "```",
  ].join("\n");
  assert.deepEqual(shownWords(source, 0), ["Shown", "and"]);
});

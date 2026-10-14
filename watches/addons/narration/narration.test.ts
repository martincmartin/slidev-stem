// The narration comment: its parts, its figure markers and its asides.

import assert from "node:assert/strict";
import { test } from "node:test";
import { noteIsNarration, narrationText, parseNarration } from "./narration.ts";

test("the comment's text is found, and other comments are not it", () => {
  const content = "# Title\n\n<!--\na note\n-->\n<!-- narration\nSaid.\n-->\n";
  assert.equal(narrationText(content), "Said.\n");
  assert.equal(narrationText("# Title\n<!--\nnote\n-->"), null);
});

test("a note that is the narration is found: the comment was the last", () => {
  assert.equal(noteIsNarration("narration\nSaid.\n"), true);
  assert.equal(noteIsNarration(" narration\nSaid."), true);
  assert.equal(noteIsNarration("A cue about the narration.\n"), false);
});

test("[click] splits the narration into parts, as in the notes", () => {
  const parts = parseNarration(
    "First.\n\n[click] Second.\n\n[click:2] Fourth.",
  );
  assert.deepEqual(
    parts.map((part) => part.clicks),
    [0, 1, 3],
  );
  assert.deepEqual(parts[1]?.blocks, [{ kind: "prose", markdown: "Second." }]);
});

test("an empty part is left out", () => {
  const parts = parseNarration("[click] After the first click.");
  assert.deepEqual(
    parts.map((part) => part.clicks),
    [1],
  );
});

test("a figure marker stays in its place in the prose", () => {
  const [part] = parseNarration(
    "Before.\n[figure: The wheel, spinning.]\nAfter.",
  );
  assert.deepEqual(part?.blocks, [
    { kind: "prose", markdown: "Before." },
    {
      kind: "figure",
      from: null,
      to: null,
      play: false,
      alt: "The wheel, spinning.",
    },
    { kind: "prose", markdown: "After." },
  ]);
});

test("a figure can show a range of clicks, and play them", () => {
  const [steps] = parseNarration("[figure 2-3]");
  assert.deepEqual(steps?.blocks, [
    { kind: "figure", from: 2, to: 3, play: false, alt: null },
  ]);
  const [plays] = parseNarration("[figure 0-8 play: The tour.]");
  assert.deepEqual(plays?.blocks, [
    { kind: "figure", from: 0, to: 8, play: true, alt: "The tour." },
  ]);
  const [one] = parseNarration("[figure 4]");
  assert.deepEqual(one?.blocks, [
    { kind: "figure", from: 4, to: 4, play: false, alt: null },
  ]);
});

test("a range that runs backward is an error", () => {
  assert.throws(() => parseNarration("[figure 3-2]"), /runs backward/);
});

test("[nofigure] marks the part, and keeps it with no text", () => {
  const [first, second] = parseNarration("Said. [nofigure]\n[click][nofigure]");
  assert.ok(first && second);
  assert.equal(first.noFigure, true);
  assert.deepEqual(first.blocks, [{ kind: "prose", markdown: "Said." }]);
  assert.equal(second.noFigure, true);
  assert.equal(second.clicks, 1);
});

test("a quote block that starts [!aside] is an aside, with its title", () => {
  const [part] = parseNarration(
    "Prose.\n\n> [!aside] Why a wheel?\n> Mass at the rim.\n> It counts most.\n\nMore prose.",
  );
  assert.deepEqual(part?.blocks, [
    { kind: "prose", markdown: "Prose." },
    {
      kind: "aside",
      title: "Why a wheel?",
      markdown: "Mass at the rim.\nIt counts most.",
    },
    { kind: "prose", markdown: "More prose." },
  ]);
});

test("an ordinary quote block stays prose", () => {
  const [part] = parseNarration("> A quotation.");
  assert.deepEqual(part?.blocks, [
    { kind: "prose", markdown: "> A quotation." },
  ]);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import type { FigureBlock, PageBlock } from "./plan.ts";
import { articleMarkdown } from "./text.ts";

function figure(overrides: Partial<FigureBlock> = {}): FigureBlock {
  return {
    kind: "figure",
    id: "gears-4",
    slide: 1,
    steps: [4],
    play: false,
    alt: "Two gears, turning.",
    captions: [null],
    ...overrides,
  };
}

test("headings, history lines, prose and asides, in order", () => {
  const page: PageBlock[] = [
    { kind: "title", text: "Watches" },
    { kind: "part", id: "a", eyebrow: "PART 1", text: "Marvels" },
    { kind: "heading", id: "b", text: "Gears", history: "c. 1670" },
    { kind: "prose", text: "A _pinion_ drives it.\n" },
    { kind: "aside", title: "Why?", text: "Because.\n\nAnd so." },
  ];
  assert.equal(
    articleMarkdown(page, () => []),
    [
      "# Watches",
      "## PART 1: Marvels",
      "### Gears",
      "_c. 1670_",
      "A _pinion_ drives it.",
      "> **Aside: Why?**\n>\n> Because.\n>\n> And so.",
    ].join("\n\n") + "\n",
  );
});

test("a figure is its alt text, its steps and its controls", () => {
  assert.equal(
    articleMarkdown([figure()], () => ["a slider"]),
    "[Figure: Two gears, turning. Controls: a slider.]\n",
  );
  assert.equal(
    articleMarkdown(
      [figure({ steps: [2, 3], captions: [null, null] })],
      () => [],
    ),
    "[Figure: Two gears, turning. The reader steps through it, in 2 steps.]\n",
  );
  assert.equal(
    articleMarkdown([figure({ alt: null })], () => []),
    "[Figure: (no alt text)]\n",
  );
});

test("a playing figure's captions follow it, once each", () => {
  const playing = figure({
    steps: [0, 1, 2],
    play: true,
    captions: ["The barrel.", "The barrel.", "The wheel."],
  });
  assert.equal(
    articleMarkdown([playing], () => []),
    [
      "[Figure: Two gears, turning. It plays by itself, in 3 steps, with a caption at each.]",
      "> **Caption, step 1:** The barrel.",
      "> **Caption, step 3:** The wheel.",
    ].join("\n\n") + "\n",
  );
});

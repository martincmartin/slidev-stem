// The article's page model: headings, prose, and where the figures go.

import assert from "node:assert/strict";
import { test } from "node:test";
import { cropGroups, pagePlan, slug } from "./plan.ts";
import type {
  FigureBlock,
  PageBlock,
  RenderedPart,
  SlideInput,
} from "./plan.ts";

function slide(overrides: Partial<SlideInput>): SlideInput {
  return {
    no: 2,
    title: "Escapement",
    layout: null,
    eyebrow: null,
    history: null,
    parts: null,
    defaults: [],
    keyOf: (clicks) => `escapement ${String(clicks)}`,
    ...overrides,
  };
}

function prose(clicks: number, text: string, noFigure = false): RenderedPart {
  return { clicks, blocks: [{ kind: "prose", text }], noFigure };
}

/** Each block as a short string, to compare the order. */
function outline(blocks: readonly PageBlock[]): string[] {
  return blocks.map((block) => {
    switch (block.kind) {
      case "figure":
        return `figure ${block.steps.join(",")}`;
      case "prose":
        return block.text;
      case "aside":
        return `aside ${block.title}`;
      default:
        return `${block.kind} ${block.text}`;
    }
  });
}

function figures(blocks: readonly PageBlock[]): FigureBlock[] {
  return blocks.filter((block) => block.kind === "figure");
}

test("slug makes a fragment from a title", () => {
  assert.equal(slug("Changed The World"), "changed-the-world");
  assert.equal(slug("Gear Train!"), "gear-train");
});

test("the cover's title is the page's; a section is a part; others are headings", () => {
  const page = pagePlan([
    slide({ no: 1, title: "Watches", layout: "cover" }),
    slide({
      no: 2,
      title: "Mechanical Marvels",
      layout: "section",
      eyebrow: "PART 1",
    }),
    slide({ no: 3, title: "Hairspring" }),
  ]);
  assert.deepEqual(outline(page), [
    "title Watches",
    "part Mechanical Marvels",
    "heading Hairspring",
  ]);
  assert.equal(page[1]?.kind === "part" && page[1].eyebrow, "PART 1");
});

test("a heading carries its slide's history line", () => {
  const [heading] = pagePlan([slide({ title: "Hairspring", history: "1675" })]);
  assert.equal(heading?.kind === "heading" && heading.history, "1675");
});

test("a default figure goes at the start of its click's part", () => {
  const page = pagePlan([
    slide({
      parts: [prose(0, "zero"), prose(1, "one"), prose(2, "two")],
      defaults: [0, 2],
    }),
  ]);
  assert.deepEqual(outline(page), [
    "heading Escapement",
    "figure 0",
    "zero",
    "one",
    "figure 2",
    "two",
  ]);
});

test("a default with no part of its own goes after the part before it", () => {
  const page = pagePlan([
    slide({ parts: [prose(0, "zero"), prose(3, "three")], defaults: [2] }),
  ]);
  assert.deepEqual(outline(page).slice(1), ["zero", "figure 2", "three"]);
});

test("a slide with no narration shows its default figures", () => {
  const page = pagePlan([slide({ defaults: [0, 4] })]);
  assert.deepEqual(outline(page).slice(1), ["figure 0", "figure 4"]);
});

test("[nofigure] drops the default, and [figure] adds one where it stands", () => {
  const page = pagePlan([
    slide({
      parts: [
        prose(0, "zero", true),
        {
          clicks: 1,
          blocks: [
            { kind: "prose", text: "before" },
            {
              kind: "figure",
              from: null,
              to: null,
              play: false,
              alt: "The wheel.",
            },
            { kind: "prose", text: "after" },
          ],
          noFigure: false,
        },
      ],
      defaults: [0, 1],
    }),
  ]);
  assert.deepEqual(outline(page).slice(1), [
    "zero",
    "before",
    "figure 1",
    "after",
  ]);
  assert.equal(figures(page)[0]?.alt, "The wheel.");
});

test("a figure with steps takes the place of the defaults in its range", () => {
  const page = pagePlan([
    slide({
      parts: [
        {
          clicks: 2,
          blocks: [
            { kind: "figure", from: 2, to: 3, play: false, alt: null },
            { kind: "prose", text: "two" },
          ],
          noFigure: false,
        },
        prose(3, "three"),
        prose(4, "four"),
      ],
      defaults: [3, 4],
    }),
  ]);
  assert.deepEqual(outline(page).slice(1), [
    "figure 2,3",
    "two",
    "three",
    "figure 4",
    "four",
  ]);
});

test("a playing figure's parts are its captions, not prose", () => {
  const page = pagePlan([
    slide({
      parts: [
        {
          clicks: 0,
          blocks: [
            { kind: "prose", text: "intro" },
            { kind: "figure", from: 0, to: 3, play: true, alt: "The tour." },
            { kind: "prose", text: "stop 0" },
          ],
          noFigure: false,
        },
        prose(1, "stop 1"),
        prose(3, "stop 3"),
        prose(4, "after the tour"),
      ],
      defaults: [0, 1, 2, 3],
    }),
  ]);
  assert.deepEqual(outline(page).slice(1), [
    "intro",
    "figure 0,1,2,3",
    "after the tour",
  ]);
  assert.deepEqual(figures(page)[0]?.captions, [
    "stop 0",
    "stop 1",
    "stop 1",
    "stop 3",
  ]);
});

test("a section slide has no default figure", () => {
  const page = pagePlan([slide({ layout: "section", defaults: [0] })]);
  assert.equal(figures(page).length, 0);
});

test("a slide's first default figure is dropped if the last slide's figure is the same picture", () => {
  const same = (): string => "the whole watch";
  const page = pagePlan([
    slide({
      no: 1,
      title: "Cover",
      layout: "cover",
      defaults: [0],
      keyOf: same,
    }),
    slide({ no: 2, title: "Next", defaults: [0], keyOf: same }),
    slide({ no: 3, title: "Other", defaults: [0] }),
  ]);
  assert.deepEqual(
    figures(page).map((figure) => figure.slide),
    [1, 3],
  );
});

test("each figure has its own id, from its slide's title and its click", () => {
  const page = pagePlan([
    slide({ defaults: [0, 3] }),
    slide({ no: 3, defaults: [0] }),
  ]);
  assert.deepEqual(
    figures(page).map((figure) => figure.id),
    ["escapement-0", "escapement-3", "escapement-0-2"],
  );
});

test("within a slide, a default figure of the same picture stays", () => {
  const page = pagePlan([slide({ defaults: [0, 4], keyOf: () => "the same" })]);
  assert.deepEqual(outline(page).slice(1), ["figure 0", "figure 4"]);
});

test("the figures of a slide that share a camera share a crop", () => {
  const figure = (slide: number, steps: number[]): FigureBlock => ({
    kind: "figure",
    id: `${String(slide)}-${steps.join("-")}`,
    slide,
    steps,
    play: false,
    alt: null,
    captions: steps.map(() => null),
  });
  // slide 1: the camera zooms out at click 1, and back in at click 2; the
  // figure of clicks 2 to 3 joins the figure of click 4 by click 3's camera
  const frames = new Map([
    [0, "near"],
    [1, "far"],
    [2, "near"],
    [3, "close"],
    [4, "close"],
  ]);
  const zero = figure(1, [0]);
  const one = figure(1, [1]);
  const twoToThree = figure(1, [2, 3]);
  const four = figure(1, [4]);
  // slide 2 has the same camera, but its figure is its own
  const other = figure(2, [0]);
  const groups = cropGroups([zero, one, twoToThree, four, other], (each) =>
    each.steps.flatMap((clicks) => frames.get(clicks) ?? []),
  );
  assert.deepEqual(groups.get(zero), [zero, twoToThree, four]);
  assert.deepEqual(groups.get(four), [zero, twoToThree, four]);
  assert.deepEqual(groups.get(one), [one]);
  assert.deepEqual(groups.get(other), [other]);
});

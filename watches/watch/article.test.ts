// The article's rules for the watch talk (watch/article.ts), on the real
// slides: the default figures, the marks, the picture's box and the
// `article` settings; and every slide's narration.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  noteIsNarration,
  narrationText,
  parseNarration,
} from "../addons/narration/narration.ts";
import {
  defaultFigures,
  figureMarks,
  figureSettings,
  pictureBox,
  pictureKey,
} from "./article.ts";
import { historyOf } from "../addons/narration/history.ts";
import { pagePlan, slideInput } from "../addons/narration/plan.ts";
import type { RenderedBlock } from "../addons/narration/plan.ts";
import { deckSlides, slideFrontmatter } from "./deck.ts";
import { generate } from "./generate.ts";

const watch = generate();
const slides = await deckSlides();

function totalClicks(frontmatter: Record<string, unknown>): number {
  return Number(frontmatter["clicks"] ?? 0);
}

async function defaultsOf(title: string): Promise<number[]> {
  const frontmatter = await slideFrontmatter(title);
  return defaultFigures(watch, frontmatter, totalClicks(frontmatter));
}

test("the default figures are the end of each build-up", async () => {
  // the board comes (1), the board curls (2), and the spring swings again
  // (3): the curl and the swing are one run
  assert.deepEqual(await defaultsOf("Hairspring"), [0, 1, 3]);
  // text only after click 0: one figure, at the end
  assert.deepEqual(await defaultsOf("Balance Wheel"), [3]);
  assert.deepEqual(await defaultsOf("Ticks and Turns"), [3]);
  // the escape wheel alone (1) takes pieces away; then they come back
  assert.deepEqual(await defaultsOf("Escapement"), [0, 4]);
  // the camera zooms in at 3 and out at 6
  assert.deepEqual(await defaultsOf("Hour Hand"), [2, 5, 6]);
});

test("a slide with no watch and no board is one run, with no box", () => {
  const frontmatter = { clicks: 5 };
  assert.deepEqual(defaultFigures(watch, frontmatter, 5), [5]);
  assert.equal(pictureBox(watch, frontmatter, 5), null);
  assert.equal(pictureKey(frontmatter, 5), null);
});

test("the cover's figure shows the whole watch, which the slide cuts", () => {
  const cover = slides.find((slide) => slide.frontmatter["layout"] === "cover");
  assert.ok(cover);
  const [width] = watch.scene.slide;
  const talk = { ...cover.frontmatter, article: undefined };
  assert.equal(pictureBox(watch, talk, 0)?.right, width);
  const box = pictureBox(watch, cover.frontmatter, 0);
  assert.ok(box && box.left > 0 && box.right < width);
  assert.notEqual(pictureKey(cover.frontmatter, 0), pictureKey(talk, 0));
});

test("where the slide cuts the watch, the crop centres it up and down", async () => {
  // the strap and the one-step wheel run past the slide's top and bottom;
  // the case (the view's fit) sits below the title's space
  const gearTrain = await slideFrontmatter("Gear Train");
  const box = pictureBox(watch, gearTrain, 1);
  assert.ok(box);
  const [, height] = watch.scene.slide;
  assert.equal(box.bottom, height);
  assert.ok(box.top > 100, `top ${String(box.top)}`);
});

test("a figure marks what its run flashed, but not when that is everything", async () => {
  // flashed at click 0, marked at the run's end
  const balance = await slideFrontmatter("Balance Wheel");
  assert.deepEqual(figureMarks(watch, balance, 3), [
    "balance wheel",
    "balance staff",
  ]);
  // the Hairspring slide flashes the whole oscillator, and shows only the
  // spring: no mark
  assert.deepEqual(
    figureMarks(watch, await slideFrontmatter("Hairspring"), 0),
    [],
  );
  // both stages of the motion works
  assert.deepEqual(figureMarks(watch, await slideFrontmatter("Hour Hand"), 5), [
    "cannon pinion",
    "minute wheel",
    "minute pinion",
    "hour wheel",
  ]);
});

test("an article setting replaces the default mark", () => {
  const frontmatter = {
    watch: ["balance wheel", "hairspring"],
    watchFlash: ["balance wheel"],
    article: { 0: { mark: ["hairspring"] } },
  };
  assert.deepEqual(figureMarks(watch, frontmatter, 0), ["hairspring"]);
  const none = { ...frontmatter, article: { 0: { mark: false } } };
  assert.deepEqual(figureMarks(watch, none, 0), []);
});

test("the article settings are checked", () => {
  assert.deepEqual(figureSettings({}, 0), {
    mark: null,
    slider: null,
    button: null,
    view: null,
  });
  assert.deepEqual(figureSettings({ article: { 2: { slider: "curl" } } }, 2), {
    mark: null,
    slider: "curl",
    button: null,
    view: null,
  });
  assert.equal(
    figureSettings({ article: { 2: { button: "release" } } }, 2).button,
    "release",
  );
  assert.deepEqual(
    figureSettings({ article: { 0: { view: ["case band"] } } }, 0).view,
    { fit: ["case band"] },
  );
  assert.throws(() => figureSettings({ article: { x: {} } }, 0), /article/);
  assert.throws(
    () => figureSettings({ article: { 1: { zoom: 2 } } }, 1),
    /mark, or slider, or button, or view/,
  );
  assert.throws(
    () => figureSettings({ article: { 1: { view: 3 } } }, 1),
    /article\.1\.view/,
  );
  assert.throws(
    () => figureSettings({ article: { 1: { slider: "spin" } } }, 1),
    /curl or twist or wind/,
  );
  assert.throws(
    () => figureSettings({ article: { 1: { button: "go" } } }, 1),
    /article\.1\.button/,
  );
  assert.throws(
    () => figureSettings({ article: { 0: { button: "release" } } }, 0),
    /click after 0/,
  );
});

test("every picture's box is inside the slide, and holds something", () => {
  const [width, height] = watch.scene.slide;
  for (const { title, frontmatter } of slides) {
    for (let clicks = 0; clicks <= totalClicks(frontmatter); clicks++) {
      const box = pictureBox(watch, frontmatter, clicks);
      if (!box) continue;
      const where = `${title} @${String(clicks)}`;
      assert.ok(box.left >= 0 && box.top >= 0, where);
      assert.ok(box.right <= width && box.bottom <= height, where);
      assert.ok(
        box.right - box.left > 100 && box.bottom - box.top > 100,
        where,
      );
    }
  }
});

test("every slide's narration parses, comes before the note, and names real pieces", () => {
  const names = new Set(watch.scene.pieces.map((piece) => piece.name));
  for (const { title, frontmatter, content, note } of slides) {
    assert.ok(
      !noteIsNarration(note),
      `${title}: the narration is the last comment`,
    );
    const text = narrationText(content);
    const clicks = totalClicks(frontmatter);
    if (text !== null) {
      for (const part of parseNarration(text)) {
        assert.ok(
          part.clicks <= clicks,
          `${title}: a part after the last click`,
        );
        for (const block of part.blocks) {
          if (block.kind !== "figure" || block.to === null) continue;
          assert.ok(
            block.to <= clicks,
            `${title}: a figure after the last click`,
          );
        }
      }
    }
    for (let click = 0; click <= clicks; click++) {
      for (const name of figureSettings(frontmatter, click).mark ?? []) {
        assert.ok(
          names.has(name),
          `${title} @${String(click)}: no piece ${name}`,
        );
      }
    }
  }
});

test(`every slide's history line is text, with "c." before each year`, () => {
  for (const { title, frontmatter } of slides) {
    const history = historyOf(frontmatter);
    for (const year of history?.matchAll(/(\S*\s*)\b(\d{3,4})\b/g) ?? []) {
      assert.equal(
        year[1],
        "c. ",
        `${title}: "${history ?? ""}": a bare ${year[2] ?? ""} reads as any number`,
      );
    }
  }
});

test("every figure of the article has alt text", () => {
  // the page's slides: Slidev leaves the hidden ones out of its list. The
  // Markdown stands for the HTML, which the plan does not read.
  const page = pagePlan(
    slides
      .filter((slide) => slide.frontmatter["hide"] !== true)
      .map((slide, index) => {
        const text = narrationText(slide.content);
        const parts =
          text === null
            ? null
            : parseNarration(text).map((part) => ({
                ...part,
                blocks: part.blocks.map((block): RenderedBlock =>
                  block.kind === "figure"
                    ? block
                    : { ...block, html: block.markdown },
                ),
              }));
        return slideInput(
          {
            no: index + 1,
            title: slide.title || null,
            frontmatter: slide.frontmatter,
            parts,
          },
          {
            defaultFigures: (frontmatter, total) =>
              defaultFigures(watch, frontmatter, total),
            pictureKey,
          },
        );
      }),
  );
  const figures = page.filter((block) => block.kind === "figure");
  assert.ok(figures.length > 0, "the article has no figures");
  assert.deepEqual(
    figures.filter((figure) => !figure.alt).map((figure) => figure.id),
    [],
    "each figure needs alt text: a [figure: …] marker (docs/article.md)",
  );
});

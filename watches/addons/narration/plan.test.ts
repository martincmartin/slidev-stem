// The article's page model: headings, prose, and where the figures go.

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_HOOKS } from "./figure.ts";
import {
  articlePages,
  cropGroups,
  pageInput,
  pagePlan,
  slideInput,
  slug,
} from "./plan.ts";
import type {
  FigureBlock,
  PageBlock,
  RenderedBlock,
  RenderedPart,
  SlideInput,
} from "./plan.ts";

function slide(overrides: Partial<SlideInput>): SlideInput {
  return {
    no: 2,
    title: "Escapement",
    documentTitle: null,
    layout: null,
    eyebrow: null,
    history: null,
    parts: null,
    defaults: [],
    keyOf: (clicks) => `escapement ${String(clicks)}`,
    hidden: false,
    linked: true,
    description: null,
    subtitle: null,
    ...overrides,
  };
}

function prose(clicks: number, text: string, noFigure = false): RenderedPart {
  return { clicks, blocks: [{ kind: "prose", text }], noFigure };
}

/** Each block as a short string, to compare the order. */
function outline(blocks: readonly PageBlock[]): string[] {
  return blocks.flatMap((block) => {
    switch (block.kind) {
      case "figure":
        return [`figure ${block.steps.join(",")}`];
      case "prose":
        // each aside after its paragraph, as the text export shows it
        return [
          block.text,
          ...block.asides.map(({ title }) => `aside ${title}`),
        ];
      case "quote":
        return [`quote ${block.lines.join(" / ")}`];
      default:
        return [`${block.kind} ${block.text}`];
    }
  });
}

function aside(title: string): RenderedBlock {
  return { kind: "aside", title, text: `${title}, answered.` };
}

function figures(blocks: readonly PageBlock[]): FigureBlock[] {
  return blocks.filter((block) => block.kind === "figure");
}

test("slug makes a fragment from a title", () => {
  assert.equal(slug("Changed The World"), "changed-the-world");
  assert.equal(slug("Gear Train!"), "gear-train");
});

test("the part's title is the page's, under the cover's; others are headings", () => {
  const page = pagePlan([
    slide({ no: 1, title: "Watches", layout: "cover" }),
    slide({
      no: 2,
      title: "Mechanical Marvels",
      layout: "section",
      eyebrow: "PART 1",
      subtitle: "Piece by piece",
    }),
    slide({ no: 3, title: "Hairspring" }),
    slide({ no: 4, title: "Part Two", layout: "section" }),
  ]);
  assert.deepEqual(outline(page), [
    "title Mechanical Marvels",
    "heading Hairspring",
    "part Part Two",
  ]);
  assert.deepEqual(page[0], {
    kind: "title",
    text: "Mechanical Marvels",
    series: "Watches",
    eyebrow: "PART 1",
    subtitle: "Piece by piece",
  });
});

test("a page with no part has the cover's title; with no cover, a part", () => {
  const cover = slide({ no: 1, title: "Watches", layout: "cover" });
  assert.deepEqual(pagePlan([cover, slide({ no: 2, title: "Gears" })])[0], {
    kind: "title",
    text: "Watches",
    series: null,
    eyebrow: null,
    subtitle: null,
  });
  assert.deepEqual(
    outline(pagePlan([slide({ no: 2, title: "Part", layout: "section" })])),
    ["part Part"],
  );
});

test("a slide's articleTitle is its title in the article", () => {
  const titleOf = (frontmatter: Record<string, unknown>): string | null =>
    slideInput(
      { no: 9, title: "Questions?", frontmatter, parts: null },
      DEFAULT_HOOKS,
    ).title;
  assert.equal(
    titleOf({ articleTitle: " Credits & Sources " }),
    "Credits & Sources",
  );
  assert.equal(titleOf({}), "Questions?");
  assert.throws(
    () => titleOf({ articleTitle: 2026 }),
    /articleTitle: 2026 is not a line of text/,
  );
});

test("a document title leaves the article's heading and subtitle separate", () => {
  const input = (frontmatter: Record<string, unknown>): SlideInput =>
    slideInput(
      { no: 2, title: "Short title", frontmatter, parts: null },
      DEFAULT_HOOKS,
    );
  const section = input({
    layout: "section",
    articleTitle: "Article heading",
    articleSubtitle: "Article subtitle",
    articleDocumentTitle: " Subtitle: Article heading ",
  });
  assert.equal(section.documentTitle, "Subtitle: Article heading");
  const [header] = pagePlan([
    slide({ no: 1, title: "Watches", layout: "cover" }),
    section,
  ]);
  assert.equal(header?.kind === "title" && header.text, "Article heading");
  assert.equal(header?.kind === "title" && header.subtitle, "Article subtitle");
  assert.equal(input({}).documentTitle, null);
  assert.throws(
    () => input({ articleDocumentTitle: 2026 }),
    /articleDocumentTitle: 2026 is not a line of text/,
  );
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

test("an aside goes with the next paragraph of its slide, past a click and a figure", () => {
  const page = pagePlan([
    slide({
      parts: [
        {
          clicks: 0,
          blocks: [{ kind: "prose", text: "zero" }, aside("Why?")],
          noFigure: false,
        },
        prose(1, "one"),
      ],
      defaults: [1],
    }),
  ]);
  assert.deepEqual(outline(page).slice(1), [
    "zero",
    "figure 1",
    "one",
    "aside Why?",
  ]);
});

test("an aside at the end of its slide goes with the slide's last paragraph", () => {
  const page = pagePlan([
    slide({
      parts: [
        {
          clicks: 0,
          blocks: [
            { kind: "prose", text: "zero" },
            aside("Why?"),
            { kind: "prose", text: "last" },
            aside("How?"),
          ],
          noFigure: false,
        },
      ],
    }),
    slide({ no: 3, title: "Gears", parts: [prose(0, "next")] }),
  ]);
  assert.deepEqual(outline(page), [
    "heading Escapement",
    "zero",
    "last",
    "aside Why?",
    "aside How?",
    "heading Gears",
    "next",
  ]);
});

test("an aside in a slide with no paragraph is an error", () => {
  assert.throws(
    () =>
      pagePlan([
        slide({
          parts: [{ clicks: 0, blocks: [aside("Why?")], noFigure: false }],
        }),
      ]),
    /the aside "Why\?" has no paragraph in its slide/,
  );
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

/** Each page's slides, by title. */
function pageTitles(slides: readonly SlideInput[]): (string | null)[][] {
  return articlePages(slides).map((page) =>
    page.slides.map((each) => each.slide.title),
  );
}

test("each section starts a page; the cover is on page 1, whole", () => {
  const cover = slide({
    no: 1,
    title: "Watches",
    layout: "cover",
    parts: [prose(0, "Why watches.")],
    defaults: [0],
  });
  const slides = [
    cover,
    slide({ no: 2, title: "Part One", layout: "section" }),
    slide({ no: 3, title: "Hairspring" }),
    slide({ no: 4, title: "Part Two", layout: "section" }),
    slide({ no: 5, title: "Longitude" }),
  ];
  assert.deepEqual(pageTitles(slides), [
    ["Watches", "Part One", "Hairspring"],
    ["Watches", "Part Two", "Longitude"],
  ]);
  const [first, second] = articlePages(slides);
  assert.deepEqual(
    [first?.number, first?.section?.title, second?.section?.title],
    [1, "Part One", "Part Two"],
  );
  // a later page has the cover's title, and not its narration or figure
  const plan = (page: typeof second) =>
    pagePlan(
      (page?.slides ?? []).map(({ slide, titleOnly }) =>
        pageInput(slide, titleOnly),
      ),
    );
  const later = plan(second);
  assert.deepEqual(outline(later), ["title Part Two", "heading Longitude"]);
  assert.deepEqual(outline(plan(first)).slice(0, 3), [
    "title Part One",
    "figure 0",
    "Why watches.",
  ]);
});

test("a hidden slide is on no page; an unlinked part has its page", () => {
  const slides = [
    slide({ no: 1, title: "Part One", layout: "section" }),
    slide({ no: 2, title: "Part Two", layout: "section" }),
    slide({ no: 3, title: "Longitude" }),
    slide({ no: 4, title: "Part Three", layout: "section", linked: false }),
    slide({ no: 5, title: "Questions?", hidden: true }),
  ];
  assert.deepEqual(pageTitles(slides), [
    ["Part One"],
    ["Part Two", "Longitude"],
    ["Part Three"],
  ]);
  assert.deepEqual(
    articlePages(slides).map((page) => page.section?.linked),
    [true, true, false],
  );
  // and the whole article as one page leaves it out too
  assert.ok(
    !outline(pagePlan(slides)).includes("heading Questions?"),
    "the hidden slide is in the plan",
  );
});

test("a talk with no section is one page", () => {
  assert.deepEqual(
    pageTitles([slide({ title: "Hairspring" }), slide({ title: "Gears" })]),
    [["Hairspring", "Gears"]],
  );
});

test("slideInput reads the keys for hidden slides and for links", () => {
  const read = (frontmatter: Record<string, unknown>) =>
    slideInput(
      { no: 1, title: "Credits", frontmatter, parts: null },
      DEFAULT_HOOKS,
    );
  assert.deepEqual([read({}).hidden, read({}).linked], [false, true]);
  assert.equal(read({ articleHidden: true }).hidden, true);
  assert.equal(read({ articleLinked: false }).linked, false);
  assert.equal(read({}).description, null);
  assert.equal(
    read({ articleDescription: " How it ticks. " }).description,
    "How it ticks.",
  );
  assert.throws(() => read({ articleDescription: 1675 }), /articleDescription/);
});

test("a credit goes where the narration puts it, and takes no aside", () => {
  const page = pagePlan([
    slide({
      parts: [
        {
          clicks: 0,
          noFigure: false,
          blocks: [
            {
              kind: "figure",
              from: null,
              to: null,
              play: false,
              alt: "A photo.",
            },
            { kind: "credit", text: "Photo by someone." },
            { kind: "aside", title: "Why?", text: "Because." },
            { kind: "prose", text: "The story." },
          ],
        },
      ],
    }),
  ]);
  assert.deepEqual(outline(page), [
    "heading Escapement",
    "figure 0",
    "credit Photo by someone.",
    "The story.",
    "aside Why?",
  ]);
});

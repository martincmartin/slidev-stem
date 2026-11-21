// The article's page model: what the page shows, in order, from each slide's
// narration (narration.ts, rendered by setup/preparser.ts) and the talk's
// rule for default figures. No Slidev and no DOM here, so a test can drive
// it with made-up slides.
//
// THE FIGURES. A slide's default figures are the clicks that the talk's rule
// gives (`SlideInput.defaults`; ../../docs/article.md). The narration's markers
// override them: `[figure]` puts the part's figure where the marker is, and
// adds it if the default has none; `[nofigure]` drops the part's default;
// `[figure 2-3]` is one figure with steps, which takes the place of the
// defaults in its range. A default figure goes at the start of the part said
// from its click, or at the end of the part before it. A section slide gets
// no default figure: it is a heading. A slide's first default figure is
// dropped if it would show the same picture as the page's figure before it,
// on the slide before (`SlideInput.keyOf`).
//
// THE ASIDES. Each aside goes with one paragraph (a prose block): the next
// one of its slide, or the slide's last one if none comes after it. The
// paragraph holds it (`ProseBlock.asides`): the page and the text export show
// it after the paragraph, or beside it in the margin.

import type { ArticleHooks } from "./figure.ts";
import { frontmatterText } from "./frontmatter.ts";
import { historyOf } from "./history.ts";
import type { FigureMarker, QuoteBlock } from "./narration.ts";

/** The frontmatter key for a slide's title in the article, in place of its
 *  title on the screen (../../docs/article.md, "A title for the article"). */
const ARTICLE_TITLE_KEY = "articleTitle";
/** An optional title for the browser's tab and the static page's preview. */
const DOCUMENT_TITLE_KEY = "articleDocumentTitle";
/** The frontmatter key for a section's page's description: what a link's
 *  preview and a search engine show (../../docs/article.md, "The pages"). */
const DESCRIPTION_KEY = "articleDescription";
/** The frontmatter key for a section's line under its page's title
 *  (../../docs/article.md, "The pages"). */
const SUBTITLE_KEY = "articleSubtitle";
/** The frontmatter key that leaves a slide out of the article, and the one
 *  that keeps a section's page unlinked (../../docs/article.md, "The
 *  pages"). */
const HIDDEN_KEY = "articleHidden";
const LINKED_KEY = "articleLinked";

/** A part of a slide's narration, rendered for the plan's output: as
 *  `NarrationPart`, with each block's `text` in the output's format. The plan
 *  passes the text through: HTML on the page (setup/preparser.ts renders
 *  it), Markdown in the text export. */
export interface RenderedPart {
  readonly clicks: number;
  readonly blocks: readonly RenderedBlock[];
  readonly noFigure: boolean;
}

/** Whether `value` is a slide's parts as the preparser writes them in its
 *  frontmatter (`narration`): each with its clicks, its blocks and its
 *  `noFigure`. */
export function isRenderedParts(value: unknown): value is RenderedPart[] {
  return (
    Array.isArray(value) &&
    value.every(
      (part: unknown) =>
        typeof part === "object" &&
        part !== null &&
        "clicks" in part &&
        typeof part.clicks === "number" &&
        "blocks" in part &&
        Array.isArray(part.blocks) &&
        "noFigure" in part &&
        typeof part.noFigure === "boolean",
    )
  );
}

/** An aside, in the output's format. */
export interface Aside {
  readonly title: string;
  readonly text: string;
}

export type RenderedBlock =
  | { readonly kind: "prose"; readonly text: string }
  | { readonly kind: "credit"; readonly text: string }
  | ({ readonly kind: "aside" } & Aside)
  | QuoteBlock
  | FigureMarker;

/** What the split into pages reads of a slide: its frontmatter's keys, and
 *  no talk's rules (`SlideInput` has them too). So a page can find its
 *  slides before it makes anything that the talk's rules need. */
export interface PagedSlide {
  /** The slide's number (1-based). */
  readonly no: number;
  /** The slide's title in the article: its `articleTitle`, or its own. */
  readonly title: string | null;
  readonly layout: string | null;
  /** A section's browser tab title (`articleDocumentTitle`), or `null`. */
  readonly documentTitle: string | null;
  /** `true`: the slide is in the talk, but not in the article
   *  (`articleHidden`). */
  readonly hidden: boolean;
  /** `false` on a section whose page no other page links to yet
   *  (`articleLinked: false`). */
  readonly linked: boolean;
  /** A section's page's description (`articleDescription`), or `null`. */
  readonly description: string | null;
}

export interface SlideInput extends PagedSlide {
  /** A section slide's small line above its title ("PART 1"). */
  readonly eyebrow: string | null;
  /** A section's line under its page's title (`articleSubtitle`), or
   *  `null`. */
  readonly subtitle: string | null;
  /** The slide's history line (history.ts), or `null`. */
  readonly history: string | null;
  /** The narration, or `null` if the slide has none. */
  readonly parts: readonly RenderedPart[] | null;
  /** The clicks that get a figure by default, in order. */
  readonly defaults: readonly number[];
  /** A key for the picture at a click: two equal keys draw the same picture. */
  readonly keyOf: (clicks: number) => string;
}

/** A slide as the split into pages reads it, from its frontmatter. */
export function pagedSlide(slide: {
  readonly no: number;
  readonly title: string | null;
  readonly frontmatter: Record<string, unknown>;
}): PagedSlide {
  const { frontmatter } = slide;
  const layout = frontmatter["layout"];
  return {
    no: slide.no,
    title: frontmatterText(frontmatter, ARTICLE_TITLE_KEY) ?? slide.title,
    documentTitle: frontmatterText(frontmatter, DOCUMENT_TITLE_KEY),
    layout: typeof layout === "string" ? layout : null,
    hidden: frontmatter[HIDDEN_KEY] === true,
    linked: frontmatter[LINKED_KEY] !== false,
    description: frontmatterText(frontmatter, DESCRIPTION_KEY),
  };
}

/** A slide as the page reads it, from its number, its title, its
 *  frontmatter, and its narration, rendered (`null`: none). The talk's
 *  `hooks` give its default figures and its pictures' keys. The page and the
 *  talk's tests both call this, so both see the same figures. */
export function slideInput(
  slide: {
    readonly no: number;
    readonly title: string | null;
    readonly frontmatter: Record<string, unknown>;
    readonly parts: readonly RenderedPart[] | null;
  },
  hooks: Pick<ArticleHooks, "defaultFigures" | "pictureKey">,
): SlideInput {
  const { no, frontmatter } = slide;
  const text = (key: string): string | null => {
    const value = frontmatter[key];
    return typeof value === "string" ? value : null;
  };
  // the slide's clicks, as its frontmatter says; 0 if it does not
  const total = Number(frontmatter["clicks"] ?? 0);
  return {
    ...pagedSlide(slide),
    eyebrow: text("eyebrow"),
    subtitle: frontmatterText(frontmatter, SUBTITLE_KEY),
    history: historyOf(frontmatter),
    parts: slide.parts,
    defaults: hooks.defaultFigures(frontmatter, total),
    keyOf: (clicks) =>
      hooks.pictureKey(frontmatter, clicks) ??
      `slide ${String(no)} @${String(clicks)}`,
  };
}

/** One page of the article: a part of the talk. */
export interface ArticlePage<S extends PagedSlide = PagedSlide> {
  /** The part's number, from 1: the page is at `article/<number>/`. */
  readonly number: number;
  /** The part's section slide, or `null` for a talk with no section. */
  readonly section: S | null;
  /** What the page plans, in order: the cover, for its title only on a
   *  page after the first (`titleOnly`), whole on page 1; then the part's
   *  slides. */
  readonly slides: readonly PageSlide<S>[];
}

/** A slide on a page; the cover, on a page after the first, for its title
 *  only. */
export interface PageSlide<S extends PagedSlide = PagedSlide> {
  readonly slide: S;
  readonly titleOnly: boolean;
}

/** The article's pages: one for each section slide, which starts a part,
 *  from the section up to the next one. The slides before the first section
 *  (the cover) are on page 1. A page after the first starts with the cover's
 *  title only. A slide with `articleHidden` is on no page. */
export function articlePages<S extends PagedSlide>(
  all: readonly S[],
): ArticlePage<S>[] {
  const slides = all.filter((slide) => !slide.hidden);
  const whole = (slide: S): PageSlide<S> => ({ slide, titleOnly: false });
  const [cover] = slides;
  const titleOnly: PageSlide<S>[] =
    cover?.layout === "cover" ? [{ slide: cover, titleOnly: true }] : [];
  interface Building {
    section: S | null;
    slides: PageSlide<S>[];
  }
  const pages: Building[] = [];
  let current: Building = { section: null, slides: [] };
  for (const slide of slides) {
    if (slide.layout === "section" && current.section !== null) {
      pages.push(current);
      current = { section: slide, slides: [...titleOnly, whole(slide)] };
    } else {
      if (slide.layout === "section") current.section = slide;
      current.slides.push(whole(slide));
    }
  }
  pages.push(current);
  return pages.map((page, index) => ({
    number: index + 1,
    section: page.section,
    slides: page.slides,
  }));
}

/** A slide as Slidev's routes give it: the part of a route that the split
 *  into pages reads. */
export interface RoutedSlide {
  readonly no: number;
  readonly meta: {
    readonly slide?: {
      readonly title?: string;
      readonly frontmatter?: Record<string, unknown>;
    };
  };
}

/** The article's pages, from Slidev's routes. The split reads only the
 *  frontmatter, so it needs none of the talk's rules: the page and the
 *  talk's setup (which loads what a page needs) split alike. */
export function routePages(routes: readonly RoutedSlide[]): ArticlePage[] {
  return articlePages(
    routes.map((route) =>
      pagedSlide({
        no: route.no,
        title: route.meta.slide?.title ?? null,
        frontmatter: route.meta.slide?.frontmatter ?? {},
      }),
    ),
  );
}

/** What `pagePlan` plans for one of a page's slides: the slide, or the
 *  cover with its title only. */
export function pageInput(input: SlideInput, titleOnly: boolean): SlideInput {
  return titleOnly ? { ...input, parts: null, defaults: [] } : input;
}

export interface FigureBlock {
  readonly kind: "figure";
  readonly id: string;
  /** The slide's number. */
  readonly slide: number;
  /** The clicks that the figure shows, in order: one, or its steps. */
  readonly steps: readonly number[];
  readonly play: boolean;
  readonly alt: string | null;
  /** A playing figure's caption at each step (in the output's format), or
   *  `null`. */
  readonly captions: readonly (string | null)[];
}

export type PageBlock =
  | {
      /** The page's title: its part's, or the cover's on a page with no
       *  part. */
      readonly kind: "title";
      readonly text: string;
      /** The talk's title, over a part's: the series that the page is in. */
      readonly series: string | null;
      /** The part's eyebrow ("PART 1"), with the series. */
      readonly eyebrow: string | null;
      readonly subtitle: string | null;
    }
  | {
      readonly kind: "part";
      readonly id: string;
      readonly eyebrow: string | null;
      readonly text: string;
    }
  | {
      readonly kind: "heading";
      readonly id: string;
      readonly text: string;
      /** The slide's history line, under the heading. */
      readonly history: string | null;
    }
  | PageProse
  | { readonly kind: "credit"; readonly text: string }
  | QuoteBlock
  | FigureBlock;

/** A paragraph (or a table, or a list), with the asides that go with it. */
export interface PageProse {
  readonly kind: "prose";
  readonly text: string;
  readonly asides: readonly Aside[];
}

/** A slide's blocks as the plan places them, before the asides join their
 *  paragraphs. */
type PlacedBlock = Exclude<RenderedBlock, FigureMarker> | FigureBlock;

/** `placed` with each aside in its paragraph: the next one, or the slide's
 *  last one if none comes after it. Throws on an aside in a slide with no
 *  paragraph. */
function withAsides(placed: readonly PlacedBlock[]): PageBlock[] {
  const blocks: PageBlock[] = [];
  let waiting: Aside[] = [];
  for (const block of placed) {
    if (block.kind === "aside") {
      waiting.push({ title: block.title, text: block.text });
    } else if (block.kind === "prose") {
      blocks.push({ ...block, asides: waiting });
      waiting = [];
    } else {
      blocks.push(block);
    }
  }
  if (waiting.length === 0) return blocks;
  const last = blocks.findLastIndex((block) => block.kind === "prose");
  const paragraph = blocks[last];
  if (paragraph?.kind !== "prose") {
    throw new Error(
      `narration: the aside "${waiting[0]?.title ?? ""}" has no paragraph in its slide`,
    );
  }
  blocks[last] = { ...paragraph, asides: [...paragraph.asides, ...waiting] };
  return blocks;
}

/** A name for a URL's fragment: lower case, words joined by `-`. */
export function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      // the marks that NFKD splits off a letter: "á" is "a" and an accent
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "slide"
  );
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/** What one slide puts on the page after its heading: its prose (with its
 *  asides), quotes and figures, in order. `previousKey` is the key of the
 *  page's last figure. */
function slideBlocks(
  slide: SlideInput,
  idOf: (base: string) => string,
  previousKey: string | null,
): { blocks: PageBlock[]; lastKey: string | null } {
  const parts = slide.parts ?? [];
  const name = slug(slide.title ?? `slide-${String(slide.no)}`);
  const ranges = parts.flatMap((part) =>
    part.blocks.flatMap((block) =>
      block.kind === "figure" && block.from !== null && block.to !== null
        ? [[block.from, block.to] as const]
        : [],
    ),
  );
  const placedHere = new Set(
    parts
      .filter((part) =>
        part.blocks.some(
          (block) => block.kind === "figure" && block.from === null,
        ),
      )
      .map((part) => part.clicks),
  );
  const dropped = new Set(
    parts.filter((part) => part.noFigure).map((part) => part.clicks),
  );
  const defaults =
    slide.layout === "section"
      ? []
      : slide.defaults.filter(
          (clicks) =>
            !dropped.has(clicks) &&
            !placedHere.has(clicks) &&
            !ranges.some(([from, to]) => clicks >= from && clicks <= to),
        );
  // a playing figure's captions: the text after its marker, and the parts
  // said in its range after the marker's part
  const captionOf = new Map<number, string>();
  const captioned = new Set<RenderedPart>();
  // a blank line between the blocks: in HTML it shows nothing, and in
  // Markdown it keeps two paragraphs apart
  const captionText = (blocks: readonly RenderedBlock[]): string =>
    blocks
      .flatMap((block) => (block.kind === "prose" ? [block.text] : []))
      .join("\n\n");
  for (const part of parts) {
    const index = part.blocks.findIndex(
      (block) => block.kind === "figure" && block.play,
    );
    const marker = part.blocks[index];
    if (marker?.kind !== "figure" || marker.from === null || marker.to === null)
      continue;
    const { from, to } = marker;
    captionOf.set(from, captionText(part.blocks.slice(index + 1)));
    for (const other of parts) {
      if (other !== part && other.clicks > from && other.clicks <= to) {
        captionOf.set(other.clicks, captionText(other.blocks));
        captioned.add(other);
      }
    }
  }

  const placed: PlacedBlock[] = [];
  let lastKey = previousKey;
  const addFigure = (
    steps: readonly number[],
    play: boolean,
    alt: string | null,
    isDefault: boolean,
  ): void => {
    const last = steps.at(-1) ?? 0;
    const key = slide.keyOf(last);
    const first = !placed.some((block) => block.kind === "figure");
    if (isDefault && first && key === lastKey) return;
    lastKey = key;
    let caption: string | null = null;
    placed.push({
      kind: "figure",
      id: idOf(`${name}-${String(steps[0] ?? 0)}`),
      slide: slide.no,
      steps,
      play,
      alt,
      captions: steps.map((clicks) => {
        caption = captionOf.get(clicks) ?? (play ? caption : null);
        return caption;
      }),
    });
  };
  const pending = [...defaults];
  /** The defaults before `clicks`, at the end of the part before. */
  const flushBefore = (clicks: number): void => {
    while (pending.length > 0 && (pending[0] ?? 0) < clicks) {
      addFigure([pending.shift() ?? 0], false, null, true);
    }
  };
  for (const part of parts) {
    flushBefore(part.clicks);
    if (pending[0] === part.clicks) {
      pending.shift();
      addFigure([part.clicks], false, null, true);
    }
    if (captioned.has(part)) continue;
    let playing = false;
    for (const block of part.blocks) {
      if (playing) continue; // the rest of the part is the first caption
      if (block.kind === "figure") {
        const steps =
          block.from === null || block.to === null
            ? [part.clicks]
            : range(block.from, block.to);
        addFigure(steps, block.play, block.alt, false);
        playing = block.play;
      } else {
        placed.push(block);
      }
    }
  }
  flushBefore(Infinity);
  return { blocks: withAsides(placed), lastKey };
}

/** The page: its title, then each slide's heading and blocks. On a page
 *  with the cover and a section, the section's title is the page's, under
 *  the cover's as the series, and the section has no heading of its own: a
 *  reader comes to the page for the part. */
export function pagePlan(slides: readonly SlideInput[]): PageBlock[] {
  const used = new Map<string, number>();
  const idOf = (base: string): string => {
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}-${String(count + 1)}`;
  };
  const page: PageBlock[] = [];
  let lastKey: string | null = null;
  const shown = slides.filter((slide) => !slide.hidden);
  const cover =
    shown[0]?.layout === "cover" && shown[0].title ? shown[0] : null;
  // the page's part: its first section, if it has a title
  const part =
    cover === null
      ? null
      : (shown.find((slide) => slide.layout === "section" && slide.title) ??
        null);
  for (const slide of shown) {
    const title = slide.title;
    if (slide === cover && title) {
      page.push(
        part?.title
          ? {
              kind: "title",
              text: part.title,
              series: title,
              eyebrow: part.eyebrow,
              subtitle: part.subtitle,
            }
          : {
              kind: "title",
              text: title,
              series: null,
              eyebrow: null,
              subtitle: slide.subtitle,
            },
      );
    } else if (slide === part) {
      // its title is the page's
    } else if (slide.layout === "section" && title) {
      page.push({
        kind: "part",
        id: idOf(slug(title)),
        eyebrow: slide.eyebrow,
        text: title,
      });
    } else if (title) {
      page.push({
        kind: "heading",
        id: idOf(slug(title)),
        text: title,
        history: slide.history,
      });
    }
    const result = slideBlocks(slide, idOf, lastKey);
    page.push(...result.blocks);
    lastKey = result.lastKey;
  }
  return page;
}

/** The figures that share each figure's crop, the figure too: the figures
 *  of one slide, joined by a camera that they share. `framesOf` gives the
 *  keys of a figure's cameras, one for each step (none: a crop of its own).
 *  So the picture keeps its place and size from one figure to the next, as
 *  on the slide, and an earlier figure keeps room for what comes later. */
export function cropGroups(
  figures: readonly FigureBlock[],
  framesOf: (figure: FigureBlock) => readonly string[],
): Map<FigureBlock, readonly FigureBlock[]> {
  let groups: {
    slide: number;
    frames: Set<string>;
    figures: FigureBlock[];
  }[] = [];
  for (const figure of figures) {
    const frames = new Set(framesOf(figure));
    const joined = groups.filter(
      (group) =>
        group.slide === figure.slide &&
        [...frames].some((frame) => group.frames.has(frame)),
    );
    groups = groups.filter((group) => !joined.includes(group));
    groups.push({
      slide: figure.slide,
      frames: new Set([
        ...frames,
        ...joined.flatMap((group) => [...group.frames]),
      ]),
      figures: [...joined.flatMap((group) => group.figures), figure],
    });
  }
  return new Map(
    groups.flatMap((group) =>
      group.figures.map((figure): [FigureBlock, readonly FigureBlock[]] => [
        figure,
        group.figures,
      ]),
    ),
  );
}

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

import type { ArticleHooks } from "./figure.ts";
import { historyOf } from "./history.ts";
import type { FigureMarker } from "./narration.ts";

/** A part of a slide's narration, rendered: as `NarrationPart`, with HTML
 *  in place of Markdown. */
export interface RenderedPart {
  readonly clicks: number;
  readonly blocks: readonly RenderedBlock[];
  readonly noFigure: boolean;
}

export type RenderedBlock =
  | { readonly kind: "prose"; readonly html: string }
  | { readonly kind: "aside"; readonly title: string; readonly html: string }
  | FigureMarker;

export interface SlideInput {
  /** The slide's number (1-based). */
  readonly no: number;
  readonly title: string | null;
  readonly layout: string | null;
  /** A section slide's small line above its title ("PART 1"). */
  readonly eyebrow: string | null;
  /** The slide's history line (history.ts), or `null`. */
  readonly history: string | null;
  /** The narration, or `null` if the slide has none. */
  readonly parts: readonly RenderedPart[] | null;
  /** The clicks that get a figure by default, in order. */
  readonly defaults: readonly number[];
  /** A key for the picture at a click: two equal keys draw the same picture. */
  readonly keyOf: (clicks: number) => string;
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
    no,
    title: slide.title,
    layout: text("layout"),
    eyebrow: text("eyebrow"),
    history: historyOf(frontmatter),
    parts: slide.parts,
    defaults: hooks.defaultFigures(frontmatter, total),
    keyOf: (clicks) =>
      hooks.pictureKey(frontmatter, clicks) ??
      `slide ${String(no)} @${String(clicks)}`,
  };
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
  /** A playing figure's caption at each step (HTML), or `null`. */
  readonly captions: readonly (string | null)[];
}

export type PageBlock =
  | { readonly kind: "title"; readonly text: string }
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
  | { readonly kind: "prose"; readonly html: string }
  | { readonly kind: "aside"; readonly title: string; readonly html: string }
  | FigureBlock;

/** A name for a URL's fragment: lower case, words joined by `-`. */
export function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "slide"
  );
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/** What one slide puts on the page after its heading: its prose, asides and
 *  figures, in order. `previousKey` is the key of the page's last figure. */
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
  const captionText = (blocks: readonly RenderedBlock[]): string =>
    blocks
      .flatMap((block) => (block.kind === "prose" ? [block.html] : []))
      .join("");
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

  const blocks: PageBlock[] = [];
  let lastKey = previousKey;
  const addFigure = (
    steps: readonly number[],
    play: boolean,
    alt: string | null,
    isDefault: boolean,
  ): void => {
    const last = steps.at(-1) ?? 0;
    const key = slide.keyOf(last);
    const first = !blocks.some((block) => block.kind === "figure");
    if (isDefault && first && key === lastKey) return;
    lastKey = key;
    let caption: string | null = null;
    blocks.push({
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
        blocks.push(block);
      }
    }
  }
  flushBefore(Infinity);
  return { blocks, lastKey };
}

/** The page: the cover's title, then each slide's heading and blocks. */
export function pagePlan(slides: readonly SlideInput[]): PageBlock[] {
  const used = new Map<string, number>();
  const idOf = (base: string): string => {
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}-${String(count + 1)}`;
  };
  const page: PageBlock[] = [];
  let lastKey: string | null = null;
  for (const [index, slide] of slides.entries()) {
    const title = slide.title;
    if (index === 0 && slide.layout === "cover" && title) {
      page.push({ kind: "title", text: title });
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

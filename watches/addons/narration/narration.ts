// The narration of a slide: the text of the talk for readers, in a comment
// before the speaker notes (`<!-- narration ... -->`). Slidev takes only a
// slide's last comment as its note, so the narration shows neither in the
// presenter view nor on the slide (../../../docs/export.md).
//
// `[click]` (or `[click:N]`, N clicks) splits it into parts, as in the notes:
// each part is said from its click on. In a part:
//   [figure]            a figure of the part's click goes here
//   [figure: alt text]  the same, with the figure's alt text
//   [figure 2-3]        one figure with steps, from click 2 to click 3
//   [figure 0-8 play]   a figure that plays its steps by itself; the parts of
//                       those clicks are its captions, not prose
//   [nofigure]          the part's click has no figure, even by default
// A quote block whose first line is `> [!aside] Title` is an aside.
//
// No Slidev and no DOM here: the preparser (setup/preparser.ts) and the
// tests use it.

/** A figure placed in the narration. */
export interface FigureMarker {
  readonly kind: "figure";
  /** The first and the last click that the figure shows, or `null`: the
   *  part's own click. */
  readonly from: number | null;
  readonly to: number | null;
  /** The figure plays its steps by itself, with captions. */
  readonly play: boolean;
  readonly alt: string | null;
}

export interface ProseBlock {
  readonly kind: "prose";
  readonly markdown: string;
}

export interface AsideBlock {
  readonly kind: "aside";
  readonly title: string;
  readonly markdown: string;
}

export type NarrationBlock = ProseBlock | AsideBlock | FigureMarker;

export interface NarrationPart {
  /** The click from which the part is said. */
  readonly clicks: number;
  readonly blocks: readonly NarrationBlock[];
  /** `[nofigure]`: no figure for the part's click, even by default. */
  readonly noFigure: boolean;
}

const NARRATION = /<!--\s*narration\s*\n([\s\S]*?)-->/;
const CLICK = /\[click(?::(\d+))?\]/gi;
const FIGURE =
  /\[figure(?:\s+(\d+)(?:-(\d+))?)?(?:\s+(play))?(?::\s*([^\]]*?))?\s*\]|\[nofigure\]/g;
const ASIDE = /^>\s*\[!aside\]\s*(.*)$/i;

/** The narration comment's text, or `null` if the slide has none. */
export function narrationText(content: string): string | null {
  return NARRATION.exec(content)?.[1] ?? null;
}

/** Whether a speaker note is a narration: the narration comment was the
 *  slide's last, so Slidev took it as the note, and the presenter view would
 *  show it. */
export function noteIsNarration(note: string): boolean {
  return /^\s*narration\s*\n/.test(note);
}

/** The prose and the asides of `text`, in order. */
function textBlocks(text: string): (ProseBlock | AsideBlock)[] {
  const blocks: (ProseBlock | AsideBlock)[] = [];
  const prose: string[] = [];
  const flush = (): void => {
    const markdown = prose.join("\n").trim();
    if (markdown) blocks.push({ kind: "prose", markdown });
    prose.length = 0;
  };
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    const aside = ASIDE.exec(line.trim());
    if (!aside) {
      prose.push(line);
      continue;
    }
    flush();
    const body: string[] = [];
    while (index + 1 < lines.length && /^\s*>/.test(lines[index + 1] ?? "")) {
      index++;
      body.push((lines[index] ?? "").replace(/^\s*>\s?/, ""));
    }
    blocks.push({
      kind: "aside",
      title: (aside[1] ?? "").trim(),
      markdown: body.join("\n").trim(),
    });
  }
  flush();
  return blocks;
}

function clickNumber(text: string | undefined): number | null {
  return text === undefined ? null : Number(text);
}

/** One part's blocks and its `[nofigure]`. Throws on a figure whose range
 *  runs backward. */
function partOf(clicks: number, text: string): NarrationPart {
  const blocks: NarrationBlock[] = [];
  let noFigure = false;
  let start = 0;
  for (const match of text.matchAll(FIGURE)) {
    blocks.push(...textBlocks(text.slice(start, match.index)));
    start = match.index + match[0].length;
    if (match[0] === "[nofigure]") {
      noFigure = true;
      continue;
    }
    const from = clickNumber(match[1]);
    const to = match[2] === undefined ? from : clickNumber(match[2]);
    if (from !== null && to !== null && to < from) {
      throw new Error(`narration: ${match[0]} runs backward`);
    }
    const alt = match[4]?.trim() ?? "";
    blocks.push({
      kind: "figure",
      from,
      to,
      play: match[3] !== undefined,
      alt: alt === "" ? null : alt,
    });
  }
  blocks.push(...textBlocks(text.slice(start)));
  return { clicks, blocks, noFigure };
}

/** The parts of a narration, in order of their clicks. A part with no text
 *  and no marker is left out. */
export function parseNarration(text: string): NarrationPart[] {
  const parts: NarrationPart[] = [];
  let clicks = 0;
  let start = 0;
  const add = (end: number): void => {
    const part = partOf(clicks, text.slice(start, end));
    if (part.blocks.length > 0 || part.noFigure) parts.push(part);
  };
  for (const match of text.matchAll(CLICK)) {
    add(match.index);
    clicks += Number(match[1] ?? 1);
    start = match.index + match[0].length;
  }
  add(text.length);
  return parts;
}

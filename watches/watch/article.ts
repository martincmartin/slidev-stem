// What the article (addons/narration) needs from the watch talk: which clicks
// of a slide get a figure by default, a key for each click's picture, where
// the picture is on the slide (the figure is cropped to it), the pieces that
// a figure marks, and a figure's slider. docs/article.md has the rules and
// the reasons.
//
// THE DEFAULT: THE END OF EACH BUILD-UP. A slide's clicks make runs. A run
// ends where the next click moves the camera, makes a piece go, or changes
// the diving board's place. Within a run, clicks only add pieces, change
// text, or change the motion (a rest, a spin, tick and tock). The last click
// of each run gets a figure: it shows all that the run built.
//
// THE MARK. A figure does not flash: a reader's eyes are on the words, and
// nobody can tell when they reach the part's name. The figure marks the
// pieces that the run's clicks flash, up to its click, in the flash's
// colours, for as long as it shows (a steady flash). Not when the mark would
// be everything that shows: that marks nothing.

import { boardState } from "./board.ts";
import type { BoardState } from "./board.ts";
import { onSlide } from "./callouts.ts";
import type { Watch } from "./generate.ts";
import { stageState, watchState, wrong } from "./state.ts";
import type { WatchState } from "./state.ts";

/** A box on the slide, in px. */
export interface SlideBox {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** What a figure can scrub with a slider: the diving board's curl, or the
 *  mainspring's winding and release. */
export const SLIDERS = ["curl", "wind"] as const;
export type SliderKind = (typeof SLIDERS)[number];

/** A figure's settings at a click, from the slide's `article` block. */
export interface FigureSettings {
  /** The pieces that the figure marks, in place of the default; `[]`:
   *  none. `null`: the default. */
  readonly mark: readonly string[] | null;
  readonly slider: SliderKind | null;
}

/** px: room around the picture, for the lines' width and the words that
 *  show beside it ("tick", "tock"). */
export const BOX_MARGIN = 16;

/** Where the diving board draws, in slide px: the slide's width, from above
 *  the board's raised end to the slide's bottom (art/diving_board.py: the
 *  drawing is 452 px tall). While it curls, it rises into the title's
 *  space, to the slide's top. */
const BOARD_BOX: SlideBox = { left: 0, top: 70, right: 980, bottom: 552 };
const CURLING_BOARD_BOX: SlideBox = { ...BOARD_BOX, top: 0 };

const NO_SETTINGS: FigureSettings = { mark: null, slider: null };

function isMap(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The slide's `article` settings at `clicks`: the block whose key is that
 *  click. Throws on a key or a value of the wrong kind. */
export function figureSettings(
  frontmatter: Record<string, unknown>,
  clicks: number,
): FigureSettings {
  const article = frontmatter["article"];
  if (article === undefined) return NO_SETTINGS;
  if (!isMap(article)) {
    return wrong("article", article, "a map from a click to settings");
  }
  for (const key of Object.keys(article)) {
    const click = Number(key);
    if (!Number.isInteger(click) || click < 0 || String(click) !== key) {
      return wrong("article", key, "a click number");
    }
  }
  const block = article[String(clicks)];
  if (block === undefined) return NO_SETTINGS;
  if (!isMap(block)) {
    return wrong(`article.${String(clicks)}`, block, "a map of settings");
  }
  for (const key of Object.keys(block)) {
    if (key !== "mark" && key !== "slider") {
      return wrong(
        `article.${String(clicks)}.${key}`,
        block[key],
        "mark or slider",
      );
    }
  }
  const mark = block["mark"];
  const slider = block["slider"];
  if (
    mark !== undefined &&
    mark !== false &&
    !(Array.isArray(mark) && mark.every((name) => typeof name === "string"))
  ) {
    return wrong(
      `article.${String(clicks)}.mark`,
      mark,
      "a list of pieces, or false",
    );
  }
  if (slider !== undefined && !SLIDERS.some((kind) => kind === slider)) {
    return wrong(
      `article.${String(clicks)}.slider`,
      slider,
      SLIDERS.join(" or "),
    );
  }
  return {
    mark: mark === undefined ? null : mark === false ? [] : mark,
    slider: (slider as SliderKind | undefined) ?? null,
  };
}

/** What a click's picture is, for comparing two clicks. */
interface Picture {
  readonly watch: WatchState | undefined;
  readonly board: BoardState | undefined;
}

function pictureAt(
  frontmatter: Record<string, unknown>,
  clicks: number,
): Picture {
  return {
    watch: watchState(frontmatter, clicks),
    board: boardState(frontmatter, clicks),
  };
}

/** What the camera frames: a change moves it. */
function frameOf(state: WatchState | undefined): string {
  if (!state) return "none";
  const { view, fit, right, band, tilt, turn } = state;
  return JSON.stringify({ view, fit, right, band, tilt, turn });
}

/** The pieces that show, by name, with `all` resolved. */
function shownNames(watch: Watch, state: WatchState | undefined): Set<string> {
  if (!state) return new Set();
  const { shown } = stageState(watch, state);
  return new Set(
    watch.scene.pieces
      .filter((piece) => [...piece.meshes].some((mesh) => shown.has(mesh)))
      .map((piece) => piece.name),
  );
}

/** Whether a new run starts at `clicks` (> 0): the camera moves, a piece
 *  goes, or the board's place changes. */
function startsRun(
  watch: Watch,
  frontmatter: Record<string, unknown>,
  clicks: number,
): boolean {
  const before = pictureAt(frontmatter, clicks - 1);
  const now = pictureAt(frontmatter, clicks);
  if (frameOf(before.watch) !== frameOf(now.watch)) return true;
  if (before.board?.place !== now.board?.place) return true;
  const shown = shownNames(watch, now.watch);
  return [...shownNames(watch, before.watch)].some((name) => !shown.has(name));
}

/** The first click of the run that holds `clicks`. */
function runStart(
  watch: Watch,
  frontmatter: Record<string, unknown>,
  clicks: number,
): number {
  let start = clicks;
  while (start > 0 && !startsRun(watch, frontmatter, start)) start--;
  return start;
}

/** The clicks of a slide with `total` clicks that get a figure by default:
 *  the last click of each run. A slide with no watch and no board is one
 *  run. */
export function defaultFigures(
  watch: Watch,
  frontmatter: Record<string, unknown>,
  total: number,
): number[] {
  const figures: number[] = [];
  for (let clicks = 0; clicks <= total; clicks++) {
    if (clicks === total || startsRun(watch, frontmatter, clicks + 1)) {
      figures.push(clicks);
    }
  }
  return figures;
}

/** A key for the picture at `clicks`: two clicks, of any slides, with the
 *  same key draw the same picture. `null` for a slide with no watch and no
 *  board. */
export function pictureKey(
  frontmatter: Record<string, unknown>,
  clicks: number,
): string | null {
  const { watch: state, board } = pictureAt(frontmatter, clicks);
  if (!state && !board) return null;
  return JSON.stringify({
    frame: frameOf(state),
    show: state?.show,
    hide: state?.hide,
    dim: state?.dim,
    settled: state?.settled,
    mainspring: state?.mainspring,
    board: board?.place,
  });
}

/** The pieces that a figure at `clicks` marks: its `article` setting, or
 *  the pieces flashed in its run up to `clicks`, but none if they are all
 *  that shows. */
export function figureMarks(
  watch: Watch,
  frontmatter: Record<string, unknown>,
  clicks: number,
): string[] {
  const setting = figureSettings(frontmatter, clicks).mark;
  if (setting !== null) return [...setting];
  const state = watchState(frontmatter, clicks);
  if (!state) return [];
  const flashed = new Set<string>();
  for (
    let click = runStart(watch, frontmatter, clicks);
    click <= clicks;
    click++
  ) {
    for (const name of watchState(frontmatter, click)?.flash ?? []) {
      flashed.add(name);
    }
  }
  const shown = shownNames(watch, state);
  const marked = [...flashed].filter((name) => shown.has(name));
  return marked.length === shown.size ? [] : marked;
}

function union(first: SlideBox | null, second: SlideBox): SlideBox {
  if (!first) return second;
  return {
    left: Math.min(first.left, second.left),
    top: Math.min(first.top, second.top),
    right: Math.max(first.right, second.right),
    bottom: Math.max(first.bottom, second.bottom),
  };
}

/** Where the picture at `clicks` is on the slide, in px, with BOX_MARGIN
 *  around it and inside the slide: the shown pieces' extents as the view
 *  shows them, and the diving board where it shows. `null` for a slide with
 *  no watch and no board: its figure is the whole slide. */
export function pictureBox(
  watch: Watch,
  frontmatter: Record<string, unknown>,
  clicks: number,
): SlideBox | null {
  const { watch: state, board } = pictureAt(frontmatter, clicks);
  let box: SlideBox | null = !board?.rest
    ? null
    : board.curling
      ? CURLING_BOARD_BOX
      : BOARD_BOX;
  if (state) {
    const stage = stageState(watch, state);
    for (const piece of watch.scene.pieces) {
      if (![...piece.meshes].some((mesh) => stage.shown.has(mesh))) continue;
      const extent = watch.extents.get(piece);
      // a piece that the model draws (the mainspring's rest shape) has no
      // triangles in the scene, so no finite extent: it lies inside another
      if (!extent || !Number.isFinite(extent.box.left)) continue;
      for (const x of [extent.box.left, extent.box.right]) {
        for (const y of [extent.box.top, extent.box.bottom]) {
          for (const z of [extent.bottom, extent.top]) {
            const [left, top] = onSlide(stage.view, stage, watch.scene.slide, [
              x,
              y,
              z,
            ]);
            box = union(box, { left, top, right: left, bottom: top });
          }
        }
      }
    }
  }
  if (!box) return null;
  const [width, height] = watch.scene.slide;
  return {
    left: Math.max(0, box.left - BOX_MARGIN),
    top: Math.max(0, box.top - BOX_MARGIN),
    right: Math.min(width, box.right + BOX_MARGIN),
    bottom: Math.min(height, box.bottom + BOX_MARGIN),
  };
}

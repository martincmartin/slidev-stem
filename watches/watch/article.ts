// What the article (addons/narration) needs from the watch talk: which clicks
// of a slide get a figure by default, a key for each click's picture and
// camera, where the picture is on the slide (the figure is cropped to it),
// the pieces that a figure marks, and a figure's control. docs/article.md has
// the rules and the reasons.
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
import { stageState, viewOf, watchState, wrong } from "./state.ts";
import type { WatchState } from "./state.ts";
import type { Piece } from "../webgl/scene.ts";
import type { StageState } from "../webgl/timeline.ts";

/** A box on the slide, in px. */
export interface SlideBox {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** What a figure can scrub with a slider: the diving board's curl, the
 *  hairspring's twist (let go, it swings), or the mainspring's winding. */
export const SLIDERS = ["curl", "twist", "wind"] as const;
export type SliderKind = (typeof SLIDERS)[number];

/** What a figure's button does: `release` shows the click before the
 *  figure's, and plays the step to the figure's click when pressed (the
 *  mainspring's release). */
export const BUTTONS = ["release"] as const;
export type ButtonKind = (typeof BUTTONS)[number];

/** A figure's settings at a click, from the slide's `article` block. */
export interface FigureSettings {
  /** The pieces that the figure marks, in place of the default; `[]`:
   *  none. `null`: the default. */
  readonly mark: readonly string[] | null;
  readonly slider: SliderKind | null;
  readonly button: ButtonKind | null;
  /** The figure's camera, in place of the slide's: a named view, or the
   *  pieces that a fitted view fits (as `watchView`). `null`: the slide's. */
  readonly view: { view: string } | { fit: readonly string[] } | null;
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

const NO_SETTINGS: FigureSettings = {
  mark: null,
  slider: null,
  button: null,
  view: null,
};
const SETTING_KEYS = ["mark", "slider", "button", "view"];

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
    if (!SETTING_KEYS.includes(key)) {
      return wrong(
        `article.${String(clicks)}.${key}`,
        block[key],
        SETTING_KEYS.join(", or "),
      );
    }
  }
  const mark = block["mark"];
  const slider = block["slider"];
  const button = block["button"];
  const view = block["view"];
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
  if (button !== undefined && !BUTTONS.some((kind) => kind === button)) {
    return wrong(
      `article.${String(clicks)}.button`,
      button,
      BUTTONS.join(" or "),
    );
  }
  if (button !== undefined && clicks === 0) {
    return wrong(
      "article.0.button",
      button,
      "at a click after 0: it starts from the click before",
    );
  }
  return {
    mark: mark === undefined ? null : mark === false ? [] : mark,
    slider: (slider as SliderKind | undefined) ?? null,
    button: (button as ButtonKind | undefined) ?? null,
    view:
      view === undefined
        ? null
        : viewOf(`article.${String(clicks)}.view`, view),
  };
}

/** The watch's state in a figure at `clicks`: the slide's, with the camera
 *  of the `article` setting `view` if the slide sets one. A fitted view is
 *  centred in the slide's left part, at turn 0 (`fittedView`). */
export function figureState(
  frontmatter: Record<string, unknown>,
  clicks: number,
): WatchState | undefined {
  const state = watchState(frontmatter, clicks);
  const { view } = figureSettings(frontmatter, clicks);
  if (!state || !view) return state;
  return "view" in view
    ? { ...state, view: view.view }
    : { ...state, view: null, fit: view.fit, right: null, turn: 0 };
}

/** What a click's picture is, for comparing two clicks. */
interface Picture {
  readonly watch: WatchState | undefined;
  readonly board: BoardState | undefined;
}

/** The slide's picture at `clicks`, as the talk shows it, or, with
 *  `figure`, as its figure shows it (`figureState`). */
function pictureAt(
  frontmatter: Record<string, unknown>,
  clicks: number,
  figure = false,
): Picture {
  return {
    watch: (figure ? figureState : watchState)(frontmatter, clicks),
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

/** A key for the camera at `clicks`, as the figure shows it: the figures of
 *  one slide with the same key get one crop. `null` for a slide with no
 *  watch and no board. */
export function frameKey(
  frontmatter: Record<string, unknown>,
  clicks: number,
): string | null {
  const { watch: state, board } = pictureAt(frontmatter, clicks, true);
  if (!state && !board) return null;
  return frameOf(state);
}

/** A key for the picture at `clicks`: two clicks, of any slides, with the
 *  same key draw the same picture. `null` for a slide with no watch and no
 *  board. */
export function pictureKey(
  frontmatter: Record<string, unknown>,
  clicks: number,
): string | null {
  const { watch: state, board } = pictureAt(frontmatter, clicks, true);
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

/** The box of `pieces` on the slide, in px, as the stage shows them: each
 *  extent's corners, projected. `null` if none has an extent. */
function piecesBox(
  watch: Watch,
  stage: StageState,
  pieces: readonly Piece[],
): SlideBox | null {
  let box: SlideBox | null = null;
  for (const piece of pieces) {
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
  return box;
}

/** The crop's top and bottom: `low` to `high`, with BOX_MARGIN, inside the
 *  slide (0 to `size`). Where the slide cuts the picture on one side, the
 *  other side is cut too, so that the fitted pieces (`fitLow` to `fitHigh`)
 *  are in the middle, but the fitted pieces stay whole. */
function cropTopBottom(
  low: number,
  high: number,
  fitLow: number,
  fitHigh: number,
  size: number,
): [number, number] {
  const centre = (fitLow + fitHigh) / 2;
  let from = Math.max(0, low - BOX_MARGIN);
  let to = Math.min(size, high + BOX_MARGIN);
  if (high + BOX_MARGIN > size) {
    from = Math.max(from, Math.min(fitLow - BOX_MARGIN, 2 * centre - to));
  }
  if (low - BOX_MARGIN < 0) {
    to = Math.min(to, Math.max(fitHigh + BOX_MARGIN, 2 * centre - from));
  }
  return [from, to];
}

/** Where the picture at `clicks` is on the slide, in px, with BOX_MARGIN
 *  around it and inside the slide: the shown pieces' extents as the view
 *  shows them, and the diving board where it shows. Where the slide's top
 *  or bottom cuts the watch, the crop centres the pieces that the view fits,
 *  up and down (`cropTopBottom`): the title's space above a watch that the
 *  slide's bottom cuts is not kept. Not across: there, what the slide cuts
 *  is the case beside the train, and the figure keeps it. `null` for a slide
 *  with no watch and no board: its figure is the whole slide. */
export function pictureBox(
  watch: Watch,
  frontmatter: Record<string, unknown>,
  clicks: number,
): SlideBox | null {
  const { watch: state, board } = pictureAt(frontmatter, clicks, true);
  const boardBox = !board?.rest
    ? null
    : board.curling
      ? CURLING_BOARD_BOX
      : BOARD_BOX;
  let box = boardBox;
  let fitBox: SlideBox | null = null;
  if (state) {
    const stage = stageState(watch, state);
    const shown = watch.scene.pieces.filter((piece) =>
      [...piece.meshes].some((mesh) => stage.shown.has(mesh)),
    );
    const shownBox = piecesBox(watch, stage, shown);
    if (shownBox) box = union(box, shownBox);
    const fit = state.fit;
    fitBox =
      fit === "all" || fit.includes("all")
        ? shownBox
        : piecesBox(
            watch,
            stage,
            watch.scene.pieces.filter((piece) => fit.includes(piece.name)),
          );
  }
  if (!box) return null;
  // the board is drawn to the slide's edges: centre on it, it is the picture
  const centred = boardBox ? box : (fitBox ?? box);
  const [width, height] = watch.scene.slide;
  const [top, bottom] = cropTopBottom(
    box.top,
    box.bottom,
    centred.top,
    centred.bottom,
    height,
  );
  const left = Math.max(0, box.left - BOX_MARGIN);
  const right = Math.min(width, box.right + BOX_MARGIN);
  return { left, top, right, bottom };
}

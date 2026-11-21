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

import { LAPSE_HOURS, LAPSE_SECONDS } from "./mainspring.ts";
import { boardCurls, boardState, restShows } from "./board.ts";
import type { BoardState } from "./board.ts";
import type { Watch } from "./generate.ts";
import {
  clickOfKey,
  piecesNamed,
  shownPieces,
  stageState,
  viewOf,
  watchState,
  wrong,
} from "./state.ts";
import type { WatchState } from "./state.ts";
import type { Piece, View } from "../webgl/scene.ts";
import { pivotOnSlide, slidePoint } from "../webgl/renderer.ts";
import type { StageState } from "../webgl/timeline.ts";
import { isRecord } from "../webgl/checked.ts";
import { union } from "../addons/narration/figure.ts";
import type { Box } from "../addons/narration/figure.ts";

/** What a figure can scrub with a slider: the diving board's curl, the
 *  hairspring's twist (let go, it swings), or the mainspring's winding. */
export const SLIDERS = ["curl", "twist", "wind"] as const;
export type SliderKind = (typeof SLIDERS)[number];

/** What a slider says: what it does, above it, and the words at its two
 *  ends. The figure shows them, and the text export describes it with them. */
export const SLIDER_WORDS: Readonly<
  Record<SliderKind, { label: string; start: string; end: string }>
> = {
  curl: {
    label: "Curl the diving board into the hairspring",
    start: "Board",
    end: "Hairspring",
  },
  twist: { label: "Give it a twist, then let go", start: "Rest", end: "Wound" },
  wind: { label: "Wind the mainspring", start: "Bare", end: "Wound" },
};

/** What a figure's button plays. Each shows the click before the figure's,
 *  and plays the step to the figure's click when pressed: `release`, the
 *  mainspring's release; `run down`, its time-lapse. */
export const BUTTONS = ["release", "run down"] as const;
export type ButtonKind = (typeof BUTTONS)[number];

/** What a button says: what a press does, and what a second press does. */
export const BUTTON_WORDS: Readonly<
  Record<ButtonKind, { label: string; undo: string }>
> = {
  release: { label: "Let go of the outer end", undo: "Start again" },
  "run down": {
    label: speedUpLabel(LAPSE_HOURS * 60, LAPSE_SECONDS),
    undo: "Start again",
  },
};

/** s: the time over which a figure's speed-up button says what it does:
 *  "an hour in 30 seconds". The Recap slide's stops run their slowest part
 *  once in 30 s too (docs/watch.md, "The Recap slide"). */
const SPEED_UP_SECONDS = 30;

/** What a figure's speed-up button says, at `speedUp` (`watchLapse`'s
 *  scale: 120 runs an hour in 30 s): what a press does, and what a second
 *  press does. */
export function speedUpWords(speedUp: number): {
  label: string;
  undo: string;
} {
  return {
    label: speedUpLabel((speedUp * SPEED_UP_SECONDS) / 60, SPEED_UP_SECONDS),
    undo: "Back to real time",
  };
}

/** A button's words for a speed-up that runs `minutes` of the watch's time
 *  in `seconds`: "Speed up: an hour in 30 seconds". */
function speedUpLabel(minutes: number, seconds: number): string {
  const hours = minutes / 60;
  const span = !Number.isInteger(hours)
    ? `${String(minutes)} minutes`
    : hours === 1
      ? "an hour"
      : `${String(hours)} hours`;
  return `Speed up: ${span} in ${String(seconds)} seconds`;
}

/** A figure's settings at a click, from the slide's `article` block. */
export interface FigureSettings {
  /** The pieces that the figure marks, in place of the default; `[]`:
   *  none. `null`: the default. */
  readonly mark: readonly string[] | null;
  readonly slider: SliderKind | null;
  readonly button: ButtonKind | null;
  /** The speed-up of a button that runs the whole mechanism faster, in
   *  step (`watchLapse`'s scale), for a part too slow to see move: the
   *  figure starts at real speed. `null`: no such button. */
  readonly speedUp: number | null;
  /** The figure's camera, in place of the slide's: a named view, or the
   *  pieces that a fitted view fits (as `artView`). `null`: the slide's. */
  readonly view: { view: string } | { fit: readonly string[] } | null;
}

/** px: room around the picture, for the lines' width and the words that
 *  show beside it ("tick", "tock"). */
export const BOX_MARGIN = 16;

/** The board's drawing on the slide: 452 px tall, to the slide's bottom
 *  (`SLIDE_ORIGIN` in art/diving_board.py). */
const BOARD_DRAWING_TOP = 100;
/** In the drawing's px: the top of the board's swing, its highest point
 *  (the SVG's `data-swing-top`; watch/article.test.ts checks that they
 *  agree). */
export const BOARD_SWING_TOP = 46.9;

/** Where the diving board draws, in slide px: the slide's width, from the
 *  top of the board's swing to the slide's bottom. Its sentence, beside the
 *  board, is a label: the figure widens its crop to hold it. While the
 *  board curls, it rises into the title's space, to the slide's top. */
const BOARD_BOX: Box = {
  left: 0,
  top: BOARD_DRAWING_TOP + BOARD_SWING_TOP,
  right: 980,
  bottom: 552,
};
const CURLING_BOARD_BOX: Box = { ...BOARD_BOX, top: 0 };

/** Where the board's picture is at a click: the board over the pool
 *  (`BOARD_BOX`), the curl at its own click (`CURLING_BOARD_BOX`), or
 *  none: before the board shows, and after the curl, where its picture has
 *  gone. What it leaves then (the rest shape, over the hairspring, and its
 *  sentence, a label the figure measures) is no picture of its own. */
function boardBoxOf(board: BoardState | undefined): Box | null {
  if (!board || !restShows(board)) return null;
  if (!boardCurls(board)) return BOARD_BOX;
  return board.curlsHere ? CURLING_BOARD_BOX : null;
}

const NO_SETTINGS: FigureSettings = {
  mark: null,
  slider: null,
  button: null,
  speedUp: null,
  view: null,
};
const SETTING_KEYS = ["mark", "slider", "button", "speedUp", "view"];

/** The slide's `article` settings at `clicks`: the block whose key is that
 *  click. Throws on a key or a value of the wrong kind. */
export function figureSettings(
  frontmatter: Record<string, unknown>,
  clicks: number,
): FigureSettings {
  const article = frontmatter["article"];
  if (article === undefined) return NO_SETTINGS;
  if (!isRecord(article)) {
    return wrong("article", article, "a map from a click to settings");
  }
  for (const key of Object.keys(article)) clickOfKey("article", key);
  const block = article[String(clicks)];
  if (block === undefined) return NO_SETTINGS;
  if (!isRecord(block)) {
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
  const speedUp = block["speedUp"];
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
  // the button's words say whole minutes (`speedUpWords`)
  if (
    speedUp !== undefined &&
    !(
      typeof speedUp === "number" &&
      Number.isInteger(speedUp) &&
      speedUp > 1 &&
      Number.isInteger((speedUp * SPEED_UP_SECONDS) / 60)
    )
  ) {
    return wrong(
      `article.${String(clicks)}.speedUp`,
      speedUp,
      "an even whole number above 1",
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
    speedUp: typeof speedUp === "number" ? speedUp : null,
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
  return new Set(
    shownPieces(watch, stageState(watch, state)).map((piece) => piece.name),
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

/** A key for the camera at `clicks`, as the figure shows it, and for the
 *  diving board's picture (`boardBoxOf`): the figures of one slide with the
 *  same key get one crop. A hairspring, the board over the pool and the
 *  curl are three pictures, so the room that the curl needs is not kept in
 *  the others. `null` for a slide with no watch and no board. */
export function frameKey(
  frontmatter: Record<string, unknown>,
  clicks: number,
): string | null {
  const { watch: state, board } = pictureAt(frontmatter, clicks, true);
  if (!state && !board) return null;
  return JSON.stringify({
    camera: frameOf(state),
    board: boardBoxOf(board),
  });
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
  if (setting !== null) {
    piecesNamed(watch, `article.${String(clicks)}.mark`, setting);
    return [...setting];
  }
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

/** The box of `pieces` on the slide, in px, as the stage shows them: each
 *  extent's corners, projected. `null` if none has an extent. */
function piecesBox(
  watch: Watch,
  stage: StageState,
  pieces: readonly Piece[],
): Box | null {
  let box: Box | null = null;
  for (const piece of pieces) {
    const extent = watch.extents.get(piece);
    // a piece that the model draws (the mainspring's rest shape) has no
    // triangles in the scene, so no finite extent: it lies inside another
    if (!extent || !Number.isFinite(extent.box.left)) continue;
    for (const x of [extent.box.left, extent.box.right]) {
      for (const y of [extent.box.top, extent.box.bottom]) {
        for (const z of [extent.bottom, extent.top]) {
          const [left, top] = slidePoint(stage, watch.scene.slide, [x, y, z]);
          box = union(box, { left, top, right: left, bottom: top });
        }
      }
    }
  }
  return box;
}

/** Where a view of a ball (`View.ball`: the globe) shows the ball: the box
 *  of its disc about the pivot, or null for a view of no ball. The ball has
 *  no box extent: a box's corners would show it wider than its disc. */
function ballBox(view: View): Box | null {
  if (view.ball === undefined) return null;
  const [x, y] = pivotOnSlide(view);
  const radius = view.ball * view.scale;
  return {
    left: x - radius,
    top: y - radius,
    right: x + radius,
    bottom: y + radius,
  };
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
 *  shows them, the ball of a view of a ball (the globe, and so its story
 *  maps, which fill the slide), or the diving board's picture where it
 *  shows, which covers the watch. Where the slide's top
 *  or bottom cuts the watch, the crop centres the pieces that the view fits,
 *  up and down (`cropTopBottom`): the title's space above a watch that the
 *  slide's bottom cuts is not kept. Not across: there, what the slide cuts
 *  is the case beside the train, and the figure keeps it. `null` for a slide
 *  with no watch and no board: its figure is its `in-figure` elements, or
 *  the whole slide (ArticleHooks.pictureBox). */
export function pictureBox(
  watch: Watch,
  frontmatter: Record<string, unknown>,
  clicks: number,
): Box | null {
  const { watch: state, board } = pictureAt(frontmatter, clicks, true);
  const boardBox = boardBoxOf(board);
  let box = boardBox;
  let fitBox: Box | null = null;
  // where the board's picture shows, it covers the watch: the watch's
  // pieces are not in the picture
  if (state && !boardBox) {
    const stage = stageState(watch, state);
    const shownBox = piecesBox(watch, stage, shownPieces(watch, stage));
    if (shownBox) box = union(box, shownBox);
    const ball = ballBox(stage.view);
    if (ball) box = union(box, ball);
    const fit = state.fit;
    fitBox =
      fit === "all" || fit.includes("all")
        ? shownBox
        : piecesBox(watch, stage, piecesNamed(watch, "artFit", fit));
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

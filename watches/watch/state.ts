// A slide's frontmatter, at a number of clicks, as a state for the watch's
// stage. The frontmatter names things; `stageState` turns the names into the
// scene's objects, once, at this boundary (docs/watch.md, "The keys").
// A slide sets the state at click 0; a click changes it from that click on,
// with the same keys, in a block under `watchClicks` (CLICK_KEYS):
//   watch: the pieces shown ([hairspring, collet, stud]), or `all`; no key
//     on the slide hides the watch. A list of pieces may hold lists (YAML
//     aliases: [*gears, pallet fork]); they are flattened. It may hold
//     `all`: every piece that `all` shows ([all, hour wheel])
//   watchView: what the camera frames: a named view (cover, hairspring,
//     crown), or a list of pieces, which the view fits (`fittedView`); none:
//     the view fits the pieces shown
//   watchRight: slide px: where a fitted view puts its pieces' right edge;
//     none: they are centred in the slide's left 60% (`fittedView`)
//   watchBand: picture (default) or slide: the band whose height a fitted
//     view fills (`fittedView`)
//   watchTilt: degrees (default 0)
//   watchTurn: degrees, clockwise on the slide, before the tilt (default 0;
//     `CameraAngles`); only with a named view
//   watchMove: ordered (default): the camera moves, then tilts and turns,
//     or the reverse; together: all at the same time (`CameraMove`). It is
//     the move of the step between this click and the one before, in either
//     direction (`stepMove`)
//   watchFlashAfterMove: true: flash after the camera and fades finish;
//     false (default): use the ordinary flash order
//   watchAtRest: true: the balance is at rest; false (default): it swings
//   watchSpin: degrees a second of the escape wheel: the train spins freely
//     (`TrainClock`); false (default): it follows the mechanism
//   watchTickTock: true: the words "tick" and "tock" show at each strike of
//     the jewel on the fork; false (default): they do not (`tickTockState`)
//   watchTimeScale: true: the time scale shows the speed-up, live, in the
//     lower right corner; false (default): it does not (`timeScaleState`)
//   watchMainspring: a stage of the Mainspring slide's story (free, wound,
//     released, barrel, run down: watch/mainspring.ts); it also says
//     when the balance swings, so it is not set with watchAtRest
//   watchLapse: the time-lapse's speed-up (default 1: none; watch/lapse.ts);
//     not with watchSpin, watchMainspring or watchAtRest: true
//   watchUnwind: true: the spring unwinds with the barrel; at rest, the
//     mechanism keeps moving. Entering this state or jumping winds it
//   watchDim: pieces drawn dimmed (WATCH_DIM), to keep the eye on the
//     others; false (default): none
//   watchHide: pieces that `watch` shows but that do not show here, nor
//     count in a fitted view (the Recap slide's hands: `watch: [all, ...]`
//     with no other way to leave a piece out); false (default): none
// On the slide or in a block, about the step into that click, so they do
// not carry on to later clicks (STEP_KEYS):
//   watchFlash: pieces that flash, on the step forward into the slide (on
//     the slide) or into the block's click
//   watchLater: of the pieces that fade in on a step into that click, those
//     that fade in after the others
//   watchCut: of the pieces that go or come on a step into that click,
//     those that do so at once, with no fade
//   watchGoLater: of the pieces that go on a step into that click, those
//     that stay on the screen while the camera moves, and go after it
//   watchLinger: ordered outgoing groups; each pauses, then fades out,
//     before the camera moves
//   watchWind: true: wind the running spring at once at this click, before
//     the camera moves; only with watchUnwind
// On the slide only, about the step into it:
//   watchMoveWith: what shows while the camera moves, on the step between
//     this slide and the previous one, in either direction (`moveWithBefore`)
//   watchMoveAlso: pieces of either slide that also show while the camera
//     moves on that step: they come before the camera moves into this
//     slide, and go after it moves back
//   watchClicks: for a click, the keys that change from that click on
//     ({1: {watch: [*gears, pallet fork], watchSpin: false}})

import type { Mesh, Piece, View } from "../webgl/scene.ts";
import { CAMERA_MOVES } from "../webgl/timeline.ts";
import type { CameraMove, MoveWith, StageState } from "../webgl/timeline.ts";
import { FIT_BANDS, fittedView } from "./generate.ts";
import type { FitBand, Watch } from "./generate.ts";
import { MAINSPRING_STAGES } from "./mainspring.ts";
import type { Move } from "./navigation.ts";
import type { MainspringStage } from "./mainspring.ts";
import type { WatchModelState } from "./model.ts";

const MOVES_WITH: readonly MoveWith[] = ["common", "all", "none"];

/** What shows while the camera moves on a step (`watchMoveWith`), and the
 *  pieces that show then too (`watchMoveAlso`). */
export interface StepMoveWith {
  readonly rule: MoveWith;
  readonly also: readonly string[];
}

/** A step within a slide: the pieces that both clicks show. */
export const MOVE_WITH_COMMON: StepMoveWith = { rule: "common", also: [] };

/** The weight of a dimmed piece's own colours against the paper
 *  (`watchDim`): it looks as it would at this opacity. The "Before clocks"
 *  slide dims its cards to the same (slides.md): a part of the picture is
 *  more like a card than a line of text, which dims to 0.5. */
export const WATCH_DIM = 0.35;

export interface WatchState {
  /** A named view, or `null`: the view that fits `fit`. */
  view: string | null;
  /** Degrees (`CameraAngles`). */
  tilt: number;
  turn: number;
  /** The names of the pieces shown at this click, or "all". A list may
   *  hold "all": every piece that "all" shows. */
  show: readonly string[] | "all";
  /** The names of the pieces that the fitted view fits, or "all": the
   *  `watchView` list, or else the pieces shown. */
  fit: readonly string[] | "all";
  /** Where the fitted view puts the right edge of `fit`, in slide px, or
   *  `null`: where the rule puts it (`fittedView`). */
  right: number | null;
  /** The band whose height a fitted view fills. */
  band: FitBand;
  /** The names of the pieces that flash on the step forward into this
   *  click, or `undefined`. */
  flash: readonly string[] | undefined;
  /** Wait for the camera and fades before flashing. */
  flashAfterMove: boolean;
  /** The names of the pieces that fade in after the others, on a step into
   *  this click, or `undefined`. */
  later: readonly string[] | undefined;
  /** The names of the pieces that go or come at once, on a step into this
   *  click, or `undefined`. */
  cut: readonly string[] | undefined;
  /** The names of the pieces that go after the camera moves, on a step into
   *  this click, or `undefined`. */
  goLater: readonly string[] | undefined;
  settled: boolean;
  /** Degrees a second of the escape wheel: the train spins freely; `null`:
   *  it follows the mechanism. */
  spin: number | null;
  /** The Mainspring slide's stage, or `null`. */
  mainspring: MainspringStage | null;
  /** The names of the pieces drawn dimmed, or `null`: none. */
  dim: readonly string[] | null;
  /** The names of the pieces that `show` holds but that do not show, or
   *  `null`: none. */
  hide: readonly string[] | null;
  /** The time-lapse's speed-up: 1, the mechanism's own speed, or more
   *  (`watchLapse`; watch/lapse.ts). */
  lapse: number;
  /** The spring unwinds with the barrel without stopping the watch. */
  unwind: boolean;
  /** Wind at this click only, before the camera moves. */
  wind: boolean;
  /** How the camera goes to this click. */
  move: CameraMove;
  /** Outgoing groups that pause before their fade, on this step only. */
  linger?: readonly {
    readonly pieces: readonly string[];
    readonly seconds: number;
  }[];
}

export function wrong(name: string, value: unknown, wanted: string): never {
  throw new Error(`${name}: ${JSON.stringify(value)} should be ${wanted}`);
}

/** A click number in the frontmatter, or `undefined` if the field is not there. */
export function clickOf(
  frontmatter: Record<string, unknown>,
  name: string,
): number | undefined {
  const click = frontmatter[name];
  if (click === undefined) return undefined;
  if (typeof click !== "number" || !Number.isInteger(click) || click < 0) {
    return wrong(name, click, "a click number");
  }
  return click;
}

/** A list of piece names, flattened (it may hold lists: YAML aliases), each
 *  name once, or throws with the key's name. */
function namesOf(name: string, value: unknown): readonly string[] {
  const flat: unknown[] = Array.isArray(value) ? value.flat(Infinity) : [];
  if (
    flat.length === 0 ||
    !flat.every((item) => typeof item === "string" && item !== "")
  ) {
    return wrong(name, value, "a list of pieces");
  }
  return [...new Set(flat as string[])];
}

/** The pieces shown: a list of pieces, or `all`. The list may hold `all`
 *  too: every piece that `all` shows, and the others in the list. */
function shownOf(name: string, value: unknown): readonly string[] | "all" {
  return value === "all" ? "all" : namesOf(name, value);
}

/** What the camera frames: a named view, or the pieces that it fits. */
export function viewOf(
  name: string,
  value: unknown,
): { view: string } | { fit: readonly string[] } {
  if (typeof value === "string" && value !== "") return { view: value };
  if (Array.isArray(value)) return { fit: namesOf(name, value) };
  return wrong(name, value, "the name of a view, or a list of pieces");
}

function rightOf(name: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return wrong(name, value, "a number of slide px");
  }
  return value;
}

function bandOf(name: string, value: unknown): FitBand {
  const found = FIT_BANDS.find((band) => band === value);
  if (found === undefined) return wrong(name, value, FIT_BANDS.join(", or "));
  return found;
}

function degreesOf(name: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return wrong(name, value, "a number of degrees");
  }
  return value;
}

function booleanOf(name: string, value: unknown): boolean {
  if (typeof value !== "boolean") return wrong(name, value, "true or false");
  return value;
}

/** A time-lapse's speed-up: 1 or more. */
function lapseOf(name: string, value: unknown): number {
  if (typeof value !== "number" || !(value >= 1) || !Number.isFinite(value)) {
    return wrong(name, value, "a speed-up of 1 or more");
  }
  return value;
}

function moveOf(name: string, value: unknown): CameraMove {
  const found = CAMERA_MOVES.find((move) => move === value);
  if (found === undefined)
    return wrong(name, value, CAMERA_MOVES.join(", or "));
  return found;
}

/** Degrees a second, or `null`: the train follows the mechanism. */
function spinOf(name: string, value: unknown): number | null {
  if (value === false) return null;
  if (typeof value !== "number" || !(value > 0) || !Number.isFinite(value)) {
    return wrong(name, value, "a speed in degrees a second, or false");
  }
  return value;
}

/** A list of pieces, or `null` for `false`: none. */
function piecesOrNoneOf(
  name: string,
  value: unknown,
): readonly string[] | null {
  return value === false ? null : namesOf(name, value);
}

function isMap(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function lingerOf(
  name: string,
  value: unknown,
): NonNullable<WatchState["linger"]>[number] {
  if (
    !isMap(value) ||
    Object.keys(value).some((key) => !["pieces", "seconds"].includes(key))
  ) {
    return wrong(name, value, "a map with pieces and seconds");
  }
  const pieces = namesOf(`${name}.pieces`, value["pieces"]);
  const seconds = value["seconds"];
  if (
    typeof seconds !== "number" ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return wrong(
      `${name}.seconds`,
      seconds,
      "a finite number greater than zero",
    );
  }
  return { pieces, seconds };
}

function lingerGroupsOf(
  name: string,
  value: unknown,
): NonNullable<WatchState["linger"]> {
  if (!Array.isArray(value) || value.length === 0) {
    return wrong(name, value, "a non-empty list of linger groups");
  }
  return value.map((group: unknown, index) =>
    lingerOf(`${name}.${String(index)}`, group),
  );
}

function mainspringOf(name: string, value: unknown): MainspringStage {
  const found = MAINSPRING_STAGES.find((stage) => stage === value);
  if (found === undefined) {
    return wrong(name, value, MAINSPRING_STAGES.join(", or "));
  }
  return found;
}

/** The keys that a slide sets for click 0 and a `watchClicks` block changes,
 *  each with how to read its value. */
const CLICK_KEYS = {
  watch: shownOf,
  watchView: viewOf,
  watchRight: rightOf,
  watchBand: bandOf,
  watchTilt: degreesOf,
  watchTurn: degreesOf,
  watchMove: moveOf,
  watchFlashAfterMove: booleanOf,
  watchAtRest: booleanOf,
  watchSpin: spinOf,
  watchTickTock: booleanOf,
  watchTimeScale: booleanOf,
  watchMainspring: mainspringOf,
  watchLapse: lapseOf,
  watchUnwind: booleanOf,
  watchDim: piecesOrNoneOf,
  watchHide: piecesOrNoneOf,
} as const;
type ClickKey = keyof typeof CLICK_KEYS;
type ClickValues = { [Key in ClickKey]?: ReturnType<(typeof CLICK_KEYS)[Key]> };
/** The keys that the slide and a block can hold about the step into their
 *  click: they do not carry on to later clicks. */
const STEP_KEYS = {
  watchFlash: namesOf,
  watchLater: namesOf,
  watchCut: namesOf,
  watchGoLater: namesOf,
  watchLinger: lingerGroupsOf,
  watchWind: booleanOf,
} as const;
type StepKey = keyof typeof STEP_KEYS;
type StepValues = { [Key in StepKey]?: ReturnType<(typeof STEP_KEYS)[Key]> };
/** The click keys, and the step keys of one click. */
type PlaceValues = ClickValues & StepValues;

function isClickKey(name: string): name is ClickKey {
  return Object.hasOwn(CLICK_KEYS, name);
}

function isStepKey(name: string): name is StepKey {
  return Object.hasOwn(STEP_KEYS, name);
}

/** The step keys of `values`, apart from the click keys. */
function splitStep(values: PlaceValues): {
  step: StepValues;
  rest: ClickValues;
} {
  const step: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (isStepKey(key)) step[key] = value;
    else rest[key] = value;
  }
  return { step, rest };
}

/** The keys of `values` that a click can change, and its step keys, read;
 *  `name` prefixes the key's name in an error. Throws if a key is not one of
 *  them, unless `others` (the slide's own frontmatter holds other keys too). */
function readClickKeys(
  name: string,
  values: Record<string, unknown>,
  others: boolean,
): PlaceValues {
  const read: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (isClickKey(key)) {
      read[key] = CLICK_KEYS[key](`${name}${key}`, value);
    } else if (isStepKey(key)) {
      read[key] = STEP_KEYS[key](`${name}${key}`, value);
    } else if (!others) {
      return wrong(
        name.slice(0, -1),
        key,
        [...Object.keys(CLICK_KEYS), ...Object.keys(STEP_KEYS)].join(", or "),
      );
    }
  }
  return read;
}

/** The slide's click keys at `clicks`: the slide's own, changed by each
 *  `watchClicks` block whose click has come, in click order. Each block is
 *  read, also before its click. The step keys are those of `clicks` alone:
 *  the slide's at click 0, or the block's at its click. Throws if a key of
 *  the map is not a click number, a block holds a key that a click cannot
 *  change or a value of the wrong kind, or the slide sets a click key or a
 *  step key without `watch`. */
function atClick(
  frontmatter: Record<string, unknown>,
  clicks: number,
): PlaceValues {
  const { step: slideStep, rest: state } = splitStep(
    readClickKeys("", frontmatter, true),
  );
  const blocks = frontmatter["watchClicks"];
  if (state.watch === undefined) {
    const stray = Object.keys(frontmatter).find(
      (key) => isClickKey(key) || isStepKey(key) || key === "watchClicks",
    );
    if (stray !== undefined) {
      return wrong(stray, frontmatter[stray], "set only with watch");
    }
  }
  if (blocks === undefined) {
    return clicks === 0 ? { ...state, ...slideStep } : state;
  }
  if (!isMap(blocks)) {
    return wrong("watchClicks", blocks, "a map from a click to keys");
  }
  const changes = Object.entries(blocks).map(([key, block]) => {
    const click = Number(key);
    if (!Number.isInteger(click) || click < 0 || String(click) !== key) {
      return wrong("watchClicks", key, "a click number");
    }
    if (!isMap(block) || Object.keys(block).length === 0) {
      return wrong(`watchClicks.${key}`, block, "a map of keys");
    }
    return {
      click,
      values: readClickKeys(`watchClicks.${key}.`, block, false),
    };
  });
  changes.sort((first, second) => first.click - second.click);
  let step = clicks === 0 ? slideStep : {};
  for (const { click, values } of changes) {
    if (click > clicks) break;
    const { step: blockStep, rest } = splitStep(values);
    Object.assign(state, rest);
    if (click === clicks) step = { ...step, ...blockStep };
  }
  return { ...state, ...step };
}

/** What shows while the camera moves on the step between this slide and the
 *  previous one, in either direction: the pieces that both show (`common`,
 *  the default), all the pieces of either (`all`), or none (`none`: the
 *  camera jumps); and the pieces of either that show then too
 *  (`watchMoveAlso`). Throws if `watchMoveWith` is not one of these, if
 *  `watchMoveAlso` is not a list of pieces or is set with `all`, or if the
 *  slide has no `watch`. */
export function moveWithBefore(
  frontmatter: Record<string, unknown>,
): StepMoveWith {
  const value = frontmatter["watchMoveWith"] ?? "common";
  const rule = MOVES_WITH.find((each) => each === value);
  if (rule === undefined) {
    return wrong("watchMoveWith", value, MOVES_WITH.join(", or "));
  }
  const alsoValue = frontmatter["watchMoveAlso"];
  const also =
    alsoValue === undefined ? [] : namesOf("watchMoveAlso", alsoValue);
  if (also.length > 0 && rule === "all") {
    return wrong(
      "watchMoveAlso",
      alsoValue,
      "left out with watchMoveWith: all",
    );
  }
  for (const key of ["watchMoveWith", "watchMoveAlso"]) {
    if (frontmatter[key] !== undefined && frontmatter["watch"] === undefined) {
      return wrong(key, frontmatter[key], "set only with watch");
    }
  }
  return { rule, also };
}

/** The slide's watch state at `clicks`, or `undefined` if the slide has
 *  no `watch`. Throws if a field is there but is not what the list above
 *  says. */
export function watchState(
  frontmatter: Record<string, unknown>,
  clicks: number,
): WatchState | undefined {
  moveWithBefore(frontmatter); // it throws on a wrong `watchMoveWith`
  const now = atClick(frontmatter, clicks);
  if (now.watch === undefined) return undefined;
  const show = now.watch;
  const framed = now.watchView ?? { fit: show };
  if (now.watchRight !== undefined && "view" in framed) {
    return wrong("watchRight", now.watchRight, "set only with a fitted view");
  }
  if (now.watchBand !== undefined && "view" in framed) {
    return wrong("watchBand", now.watchBand, "set only with a fitted view");
  }
  // a fitted view fits the pieces' boxes in the plan, as the camera shows
  // them at turn 0 (`fittedView`)
  if ((now.watchTurn ?? 0) !== 0 && !("view" in framed)) {
    return wrong("watchTurn", now.watchTurn, "set only with a named view");
  }
  const mainspring = now.watchMainspring ?? null;
  if (mainspring !== null && now.watchAtRest !== undefined) {
    return wrong(
      "watchAtRest",
      now.watchAtRest,
      "left out where watchMainspring is set",
    );
  }
  // the time-lapse moves the train on with the balance: a spin, the
  // Mainspring slide's story and a balance at rest move it their own ways
  const lapse = now.watchLapse ?? 1;
  const unwind = now.watchUnwind ?? false;
  if (
    unwind &&
    (mainspring !== null ||
      (now.watchSpin ?? null) !== null ||
      now.watchAtRest === true)
  ) {
    return wrong(
      "watchUnwind",
      unwind,
      "false where watchMainspring, watchSpin or watchAtRest: true is set",
    );
  }
  if (now.watchWind === true && !unwind) {
    return wrong("watchWind", now.watchWind, "set only with watchUnwind: true");
  }
  if (
    lapse !== 1 &&
    ((now.watchSpin ?? null) !== null ||
      mainspring !== null ||
      now.watchAtRest === true)
  ) {
    return wrong(
      "watchLapse",
      lapse,
      "1 where watchSpin, watchMainspring or watchAtRest: true is set",
    );
  }
  return {
    view: "view" in framed ? framed.view : null,
    tilt: now.watchTilt ?? 0,
    turn: now.watchTurn ?? 0,
    show,
    fit: "fit" in framed ? framed.fit : show,
    right: now.watchRight ?? null,
    band: now.watchBand ?? "picture",
    flash: now.watchFlash,
    flashAfterMove: now.watchFlashAfterMove ?? false,
    later: now.watchLater,
    cut: now.watchCut,
    goLater: now.watchGoLater,
    ...(now.watchLinger ? { linger: now.watchLinger } : {}),
    // on the Mainspring slide, the watch runs only while the barrel's spring
    // is wound
    settled:
      mainspring === null
        ? (now.watchAtRest ?? false)
        : mainspring !== "barrel",
    spin: now.watchSpin ?? null,
    mainspring,
    dim: now.watchDim ?? null,
    hide: now.watchHide ?? null,
    lapse,
    unwind,
    wind: now.watchWind ?? false,
    move: now.watchMove ?? "ordered",
  };
}

/** The camera's move (`watchMove`) on a step from `from` to `to`: the later
 *  one's, so that a step back is the step forward, reversed
 *  (../docs/navigation.md). `move` is the step's (`moveOf`); `from` is
 *  `undefined` if it shows no watch. */
export function stepMove(
  from: WatchState | undefined,
  to: WatchState,
  move: Move,
): CameraMove {
  return move === "back" && from ? from.move : to.move;
}

/** Whether the words "tick" and "tock" show at each strike, at `clicks`
 *  (`watchTickTock`). Throws as `watchState` does. */
export function tickTockState(
  frontmatter: Record<string, unknown>,
  clicks: number,
): boolean {
  return atClick(frontmatter, clicks).watchTickTock ?? false;
}

/** Whether the time scale shows, at `clicks` (`watchTimeScale`). Throws as
 *  `watchState` does. */
export function timeScaleState(
  frontmatter: Record<string, unknown>,
  clicks: number,
): boolean {
  return atClick(frontmatter, clicks).watchTimeScale ?? false;
}

/** The camera's and the fade's state, with the names turned into objects.
 *  `moveWith` is the step's (`moveWithBefore`). Throws if a name is not a
 *  piece or a view of the watch, or if a hidden piece is not shown. */
export function stageState(
  watch: Watch,
  state: WatchState,
  moveWith: StepMoveWith = MOVE_WITH_COMMON,
): StageState {
  const { scene } = watch;
  const piecesNamed = (key: string, names: readonly string[]): Piece[] =>
    names.map((name) => {
      const found = scene.pieces.find((candidate) => candidate.name === name);
      if (!found) throw new Error(`${key}: no watch piece "${name}"`);
      return found;
    });
  const meshesOf = (pieces: readonly Piece[]): ReadonlySet<Mesh> =>
    new Set(pieces.flatMap((piece) => [...piece.meshes]));
  const all = scene.pieces.filter((piece) => piece.inAll);
  const listed = (names: readonly string[] | "all"): readonly Piece[] =>
    names === "all"
      ? all
      : names.flatMap((name) =>
          name === "all" ? all : piecesNamed("watch", [name]),
        );
  const hidden = new Set(piecesNamed("watchHide", state.hide ?? []));
  const shown = listed(state.show);
  for (const piece of hidden) {
    if (!shown.includes(piece)) {
      throw new Error(`watchHide: "${piece.name}" is not in watch`);
    }
  }
  const piecesOf = (names: readonly string[] | "all"): readonly Piece[] =>
    listed(names).filter((piece) => !hidden.has(piece));
  const namedView = (name: string): View => {
    const found = scene.views.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`watchView: no watch view "${name}"`);
    return found;
  };
  const view =
    state.view === null
      ? fittedView(
          watch,
          piecesOf(state.fit),
          state.right,
          state.band,
          state.tilt,
        )
      : namedView(state.view);
  return {
    view,
    tilt: state.tilt,
    turn: state.turn,
    move: state.move,
    shown: meshesOf(piecesOf(state.show)),
    flash: state.flash
      ? meshesOf(piecesNamed("watchFlash", state.flash))
      : null,
    flashAfterMove: state.flashAfterMove,
    later: state.later
      ? meshesOf(piecesNamed("watchLater", state.later))
      : new Set(),
    cut: state.cut ? meshesOf(piecesNamed("watchCut", state.cut)) : new Set(),
    goLater: state.goLater
      ? meshesOf(piecesNamed("watchGoLater", state.goLater))
      : new Set(),
    moveWith: moveWith.rule,
    moveAlso: meshesOf(piecesNamed("watchMoveAlso", moveWith.also)),
    ...(state.linger
      ? {
          linger: state.linger.map((group) => ({
            meshes: meshesOf(piecesNamed("watchLinger", group.pieces)),
            seconds: group.seconds,
          })),
        }
      : {}),
    ...(state.dim
      ? {
          dim: new Map(
            [...meshesOf(piecesNamed("watchDim", state.dim))].map(
              (mesh): [Mesh, number] => [mesh, WATCH_DIM],
            ),
          ),
        }
      : {}),
  };
}

export function modelState(state: WatchState): WatchModelState {
  return {
    settled: state.settled,
    spin: state.spin,
    mainspring: state.mainspring,
    lapse: state.lapse,
    unwind: state.unwind,
    wind: state.wind,
  };
}

// A slide's frontmatter, at a number of clicks, as a state for the watch's
// stage. The frontmatter names things; `stageState` turns the names into the
// scene's objects, once, at this boundary (docs/watch.md, "The keys").
// A slide sets the state at click 0; a click changes it from that click on,
// with the same keys, in a block under `watchClicks` (CLICK_KEYS):
//   watch: the pieces shown ([hairspring, collet, stud]), or `all`; no key
//     on the slide hides the watch. A list of pieces may hold lists (YAML
//     aliases: [*gears, pallet fork]); they are flattened
//   watchView: what the camera frames: a named view (cover, hairspring,
//     crown), or a list of pieces, which the view fits (`fittedView`); none:
//     the view fits the pieces shown
//   watchTilt: degrees (default 0)
//   watchAtRest: true: the balance is at rest; false (default): it swings
//   watchSpin: degrees a second of the escape wheel: the train spins freely
//     (`TrainClock`); false (default): it follows the mechanism
//   watchTickTock: plain or burst: the words "tick" and "tock" show at each
//     strike of the jewel on the fork, plain or as comic bursts (a trial);
//     false (default): they do not (`tickTockState`)
// On the slide only, about the step into it:
//   watchFlash: pieces that flash, when the slide is reached by a step
//     forward
//   watchMoveWith: what shows while the camera moves, on the step between
//     this slide and the previous one, in either direction (`moveWithBefore`)
//   watchClicks: for a click, the keys that change from that click on
//     ({1: {watch: [*gears, pallet fork], watchSpin: false}})

import type { Mesh, Piece, View } from "../webgl/scene.ts";
import type { MoveWith, StageState } from "../webgl/timeline.ts";
import { fittedView } from "./generate.ts";
import type { Watch } from "./generate.ts";
import type { WatchModelState } from "./model.ts";

const MOVES_WITH: readonly MoveWith[] = ["common", "all", "none"];

export interface WatchState {
  /** A named view, or `null`: the view that fits `fit`. */
  view: string | null;
  tilt: number;
  /** The names of the pieces shown at this click, or "all". */
  show: readonly string[] | "all";
  /** The names of the pieces that the fitted view fits, or "all": the
   *  `watchView` list, or else the pieces shown. */
  fit: readonly string[] | "all";
  flash: readonly string[] | undefined;
  settled: boolean;
  /** Degrees a second of the escape wheel: the train spins freely; `null`:
   *  it follows the mechanism. */
  spin: number | null;
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

/** The pieces shown: a list of pieces, or `all`. */
function shownOf(name: string, value: unknown): readonly string[] | "all" {
  return value === "all" ? "all" : namesOf(name, value);
}

/** What the camera frames: a named view, or the pieces that it fits. */
function viewOf(
  name: string,
  value: unknown,
): { view: string } | { fit: readonly string[] } {
  if (typeof value === "string" && value !== "") return { view: value };
  if (Array.isArray(value)) return { fit: namesOf(name, value) };
  return wrong(name, value, "the name of a view, or a list of pieces");
}

function tiltOf(name: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return wrong(name, value, "a number of degrees");
  }
  return value;
}

function atRestOf(name: string, value: unknown): boolean {
  if (typeof value !== "boolean") return wrong(name, value, "true or false");
  return value;
}

/** Degrees a second, or `null`: the train follows the mechanism. */
function spinOf(name: string, value: unknown): number | null {
  if (value === false) return null;
  if (typeof value !== "number" || !(value > 0) || !Number.isFinite(value)) {
    return wrong(name, value, "a speed in degrees a second, or false");
  }
  return value;
}

/** How the words "tick" and "tock" show at each strike. */
export interface TickTockState {
  /** In comic bursts, the 1960s _Batman_ style: a trial, to compare with
   *  the plain words. */
  burst: boolean;
}

function tickTockOf(name: string, value: unknown): TickTockState | undefined {
  if (value === false) return undefined;
  if (value !== "plain" && value !== "burst") {
    return wrong(name, value, "plain, or burst, or false");
  }
  return { burst: value === "burst" };
}

/** The keys that a slide sets for click 0 and a `watchClicks` block changes,
 *  each with how to read its value. */
const CLICK_KEYS = {
  watch: shownOf,
  watchView: viewOf,
  watchTilt: tiltOf,
  watchAtRest: atRestOf,
  watchSpin: spinOf,
  watchTickTock: tickTockOf,
} as const;
type ClickKey = keyof typeof CLICK_KEYS;
type ClickValues = { [Key in ClickKey]?: ReturnType<(typeof CLICK_KEYS)[Key]> };

function isClickKey(name: string): name is ClickKey {
  return Object.hasOwn(CLICK_KEYS, name);
}

/** The keys of `values` that a click can change, read; `name` prefixes the
 *  key's name in an error. Throws if a key is not one of them, unless
 *  `others` (the slide's own frontmatter holds other keys too). */
function readClickKeys(
  name: string,
  values: Record<string, unknown>,
  others: boolean,
): ClickValues {
  const read: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (isClickKey(key)) {
      read[key] = CLICK_KEYS[key](`${name}${key}`, value);
    } else if (!others) {
      return wrong(
        name.slice(0, -1),
        key,
        Object.keys(CLICK_KEYS).join(", or "),
      );
    }
  }
  return read;
}

/** The slide's click keys at `clicks`: the slide's own, changed by each
 *  `watchClicks` block whose click has come, in click order. Each block is
 *  read, also before its click. Throws if a key of the map is not a click
 *  number, a block holds a key that a click cannot change or a value of the
 *  wrong kind, or the slide sets a click key without `watch`. */
function atClick(
  frontmatter: Record<string, unknown>,
  clicks: number,
): ClickValues {
  const state = readClickKeys("", frontmatter, true);
  const blocks = frontmatter["watchClicks"];
  if (state.watch === undefined) {
    const stray = Object.keys(frontmatter).find(
      (key) => isClickKey(key) || key === "watchClicks",
    );
    if (stray !== undefined) {
      return wrong(stray, frontmatter[stray], "set only with watch");
    }
  }
  if (blocks === undefined) return state;
  const isMap = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
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
  for (const { click, values } of changes) {
    if (click > clicks) break;
    Object.assign(state, values);
  }
  return state;
}

/** What shows while the camera moves on the step between this slide and the
 *  previous one, in either direction: the pieces that both show (`common`,
 *  the default), all the pieces of either (`all`), or none (`none`: the
 *  camera jumps). Throws if `watchMoveWith` is not one of these, or if the
 *  slide has no `watch`. */
export function moveWithBefore(frontmatter: Record<string, unknown>): MoveWith {
  const value = frontmatter["watchMoveWith"];
  if (value === undefined) return "common";
  const found = MOVES_WITH.find((each) => each === value);
  if (found === undefined) {
    return wrong("watchMoveWith", value, MOVES_WITH.join(", or "));
  }
  if (frontmatter["watch"] === undefined) {
    return wrong("watchMoveWith", value, "set only with watch");
  }
  return found;
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
  const flashed = frontmatter["watchFlash"];
  return {
    view: "view" in framed ? framed.view : null,
    tilt: now.watchTilt ?? 0,
    show,
    fit: "fit" in framed ? framed.fit : show,
    flash: flashed === undefined ? undefined : namesOf("watchFlash", flashed),
    settled: now.watchAtRest ?? false,
    spin: now.watchSpin ?? null,
  };
}

/** How the words "tick" and "tock" show at each strike, at `clicks`, or
 *  `undefined` if they do not (`watchTickTock`). Throws as `watchState`
 *  does. */
export function tickTockState(
  frontmatter: Record<string, unknown>,
  clicks: number,
): TickTockState | undefined {
  return atClick(frontmatter, clicks).watchTickTock;
}

/** The camera's and the fade's state, with the names turned into objects.
 *  `moveWith` is the step's (`moveWithBefore`). Throws if a name is not a
 *  piece or a view of the watch. */
export function stageState(
  watch: Watch,
  state: WatchState,
  moveWith: MoveWith = "common",
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
  const piecesOf = (names: readonly string[] | "all"): readonly Piece[] =>
    names === "all" ? scene.pieces : piecesNamed("watch", names);
  const namedView = (name: string): View => {
    const found = scene.views.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`watchView: no watch view "${name}"`);
    return found;
  };
  const view =
    state.view === null
      ? fittedView(watch, piecesOf(state.fit))
      : namedView(state.view);
  return {
    view,
    tilt: state.tilt,
    shown:
      state.show === "all"
        ? new Set(scene.meshes)
        : meshesOf(piecesOf(state.show)),
    flash: state.flash
      ? meshesOf(piecesNamed("watchFlash", state.flash))
      : null,
    moveWith,
  };
}

export function modelState(state: WatchState): WatchModelState {
  return { settled: state.settled, spin: state.spin };
}

// A slide's frontmatter, at a number of clicks, as a state for the watch's
// stage. The frontmatter names things; `stageState` turns the names into the
// scene's objects, once, at this boundary (docs/watch.md, "The frontmatter
// keys").
//   watch: the pieces shown ([hairspring, collet, stud]), or `all`; no key
//     hides the watch
//   watchView: a named view (cover, hairspring, crown); none: the view that
//     fits the shown pieces (`fittedView`)
//   watchTilt: degrees (default 0)
//   watchFlash: pieces that flash, when the slide is reached by a step
//     forward
//   watchMoveWith: what shows while the camera moves, on the step between
//     this slide and the previous one, in either direction (`moveWithBefore`)
//   watchSettle: the click at which the balance settles at rest
//   watchResume: the click at which a settled balance starts to swing again
//   watchSpin: the click at which the escape wheel spins freely, alone: the
//     shown pieces are SPIN_PIECES, in the slide's view
//   watchSpinEnd: the click at which the rest comes back and stops it
//   watchSpinSpeed: the spin's speed, degrees a second (default SPIN_SPEED)
//   watchTickTock: the click from which the words "tick" and "tock" show at
//     each strike of the jewel on the fork (`tickTockState`)
//   watchTickTockBurst: the click from which they are comic bursts (a trial)

import type { Mesh, Piece, View } from "../webgl/scene.ts";
import type { MoveWith, StageState } from "../webgl/timeline.ts";
import { fittedView } from "./generate.ts";
import type { Watch } from "./generate.ts";
import type { WatchModelState } from "./model.ts";

/** Degrees a second: a spin's speed when the slide does not give one. */
export const SPIN_SPEED = 90;
/** What a free spin shows: the escape wheel, as the Escapement slide shows
 *  it. A spinning wheel would pass through the pallet, so it spins alone. */
export const SPIN_PIECES: readonly string[] = ["escape wheel", "escape arbor"];
const MOVES_WITH: readonly MoveWith[] = ["common", "all", "none"];

export interface WatchState {
  /** A named view, or `null`: the view that fits the shown pieces. */
  view: string | null;
  tilt: number;
  /** The names of the slide's pieces, or "all": the view fits them, and
   *  they show, except during a spin (`spin`). */
  show: readonly string[] | "all";
  flash: readonly string[] | undefined;
  settled: boolean;
  /** Degrees a second: the escape wheel spins freely; `null`: it does not. */
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

/** A list of piece names, or throws with the key's name. */
function namesOf(name: string, value: unknown): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every((item) => typeof item === "string" && item !== "")
  ) {
    return wrong(name, value, "a list of pieces");
  }
  return value as string[];
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

/** The slide's watch state, or `undefined` if the slide has no `watch`.
 *  Throws if a field is there but is not what the list above says. */
export function watchState(
  frontmatter: Record<string, unknown>,
  clicks: number,
): WatchState | undefined {
  moveWithBefore(frontmatter); // it throws on a wrong `watchMoveWith`
  const shown = frontmatter["watch"];
  if (shown === undefined) return undefined;
  const show = shown === "all" ? "all" : namesOf("watch", shown);
  const view = frontmatter["watchView"] ?? null;
  if (view !== null && (typeof view !== "string" || view === "")) {
    return wrong("watchView", view, "the name of a view");
  }
  const tilt = frontmatter["watchTilt"] ?? 0;
  if (typeof tilt !== "number" || !Number.isFinite(tilt)) {
    return wrong("watchTilt", tilt, "a number of degrees");
  }
  const flashed = frontmatter["watchFlash"];
  const flash =
    flashed === undefined ? undefined : namesOf("watchFlash", flashed);
  const settleAt = clickOf(frontmatter, "watchSettle");
  const resumeAt = clickOf(frontmatter, "watchResume");
  if (
    resumeAt !== undefined &&
    (settleAt === undefined || resumeAt <= settleAt)
  ) {
    return wrong("watchResume", resumeAt, "a click after watchSettle");
  }
  const spinAt = clickOf(frontmatter, "watchSpin");
  const spinEndAt = clickOf(frontmatter, "watchSpinEnd");
  if (
    spinEndAt !== undefined &&
    (spinAt === undefined || spinEndAt <= spinAt)
  ) {
    return wrong("watchSpinEnd", spinEndAt, "a click after watchSpin");
  }
  const speed = frontmatter["watchSpinSpeed"] ?? SPIN_SPEED;
  if (typeof speed !== "number" || !(speed > 0) || !Number.isFinite(speed)) {
    return wrong("watchSpinSpeed", speed, "a speed in degrees a second");
  }
  if (spinAt === undefined && frontmatter["watchSpinSpeed"] !== undefined) {
    return wrong("watchSpinSpeed", speed, "set only with watchSpin");
  }
  const spinning =
    spinAt !== undefined &&
    clicks >= spinAt &&
    (spinEndAt === undefined || clicks < spinEndAt);
  return {
    view,
    tilt,
    show,
    flash,
    settled:
      settleAt !== undefined &&
      clicks >= settleAt &&
      (resumeAt === undefined || clicks < resumeAt),
    spin: spinning ? speed : null,
  };
}

/** How the words "tick" and "tock" show at each strike. */
export interface TickTockState {
  /** In comic bursts, the 1960s _Batman_ style: a trial, to compare with
   *  the plain words. */
  burst: boolean;
}

/** How the words "tick" and "tock" show at each strike, at `clicks`, or
 *  `undefined` if they do not: from the slide's `watchTickTock` click on,
 *  in bursts from its `watchTickTockBurst` click on. Throws if a field is
 *  there but is not a click number, if the burst's click is not after the
 *  words' click, or if the slide has no `watch`. */
export function tickTockState(
  frontmatter: Record<string, unknown>,
  clicks: number,
): TickTockState | undefined {
  const from = clickOf(frontmatter, "watchTickTock");
  const burstFrom = clickOf(frontmatter, "watchTickTockBurst");
  if (burstFrom !== undefined && (from === undefined || burstFrom <= from)) {
    return wrong(
      "watchTickTockBurst",
      burstFrom,
      "a click after watchTickTock",
    );
  }
  if (from === undefined) return undefined;
  if (frontmatter["watch"] === undefined) {
    return wrong("watchTickTock", from, "set only with watch");
  }
  if (clicks < from) return undefined;
  return { burst: burstFrom !== undefined && clicks >= burstFrom };
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
  const pieces =
    state.show === "all" ? scene.pieces : piecesNamed("watch", state.show);
  const namedView = (name: string): View => {
    const found = scene.views.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`watchView: no watch view "${name}"`);
    return found;
  };
  // the fitted view fits the slide's pieces, also while a spin shows fewer
  const view =
    state.view === null ? fittedView(watch, pieces) : namedView(state.view);
  return {
    view,
    tilt: state.tilt,
    shown:
      state.spin !== null
        ? meshesOf(piecesNamed("watchSpin", SPIN_PIECES))
        : state.show === "all"
          ? new Set(scene.meshes)
          : meshesOf(pieces),
    flash: state.flash
      ? meshesOf(piecesNamed("watchFlash", state.flash))
      : null,
    moveWith,
  };
}

export function modelState(state: WatchState): WatchModelState {
  return { settled: state.settled, spin: state.spin };
}

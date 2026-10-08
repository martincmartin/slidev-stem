// A slide's frontmatter, at a number of clicks, as a state for the watch's
// stage. The frontmatter names things; `stageState` turns the names into the
// scene's objects, once, at this boundary.
//   watch: a view (cover, hairspring, escapement, crown); none hides the watch
//   watchTilt: degrees (default 0)
//   watchOnly: a subject ("hairspring and stud"): the rest of the watch fades
//   watchFlash: a subject ("balance and hairspring") that flashes before the
//     camera moves, when the slide is reached by a transition
//   watchSettle: the click at which the balance settles at rest
//   watchResume: the click at which a settled balance starts to swing again
//   watchSpin: the click at which the escape wheel spins freely, alone: the
//     subject is the escape wheel (ESCAPE_WHEEL)
//   watchSpinEnd: the click at which the rest comes back and stops it
//   watchSpinSpeed: the spin's speed, degrees a second (default SPIN_SPEED)
//   watchTickTock: the click from which the words "tick" and "tock" show at
//     each strike of the jewel on the fork (`tickTockState`)
//   watchTickTockBurst: the click from which they are comic bursts (a trial)

import type { Scene } from "../webgl/scene.ts";
import type { StageState } from "../webgl/timeline.ts";
import { ESCAPE_WHEEL } from "./generate.ts";
import type { WatchModelState } from "./model.ts";

/** Degrees a second: a spin's speed when the slide does not give one. */
export const SPIN_SPEED = 90;

export interface WatchState {
  view: string;
  tilt: number;
  only: string | undefined;
  flash: string | undefined;
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

/** The slide's watch state, or `undefined` if the slide has no `watch`.
 *  Throws if a field is there but is not what the list above says. */
export function watchState(
  frontmatter: Record<string, unknown>,
  clicks: number,
): WatchState | undefined {
  const view = frontmatter["watch"];
  if (view === undefined) return undefined;
  if (typeof view !== "string" || view === "") {
    return wrong("watch", view, "the name of a view");
  }
  const tilt = frontmatter["watchTilt"] ?? 0;
  if (typeof tilt !== "number" || !Number.isFinite(tilt)) {
    return wrong("watchTilt", tilt, "a number of degrees");
  }
  const only = frontmatter["watchOnly"];
  if (only !== undefined && (typeof only !== "string" || only === "")) {
    return wrong("watchOnly", only, "the name of a subject");
  }
  const flash = frontmatter["watchFlash"];
  if (flash !== undefined && (typeof flash !== "string" || flash === "")) {
    return wrong("watchFlash", flash, "the name of a subject");
  }
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
    // a spinning wheel would pass through the pallet: it spins alone
    only: spinning ? ESCAPE_WHEEL : only,
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

/** The camera's and the fade's state, with the names turned into objects. */
export function stageState(scene: Scene, state: WatchState): StageState {
  const view = scene.views.find((candidate) => candidate.name === state.view);
  if (!view) throw new Error(`no watch view ${state.view}`);
  const subjectNamed = (name: string | undefined) => {
    if (name === undefined) return null;
    const found = scene.subjects.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`no watch subject ${name}`);
    return found;
  };
  return {
    view,
    tilt: state.tilt,
    subject: subjectNamed(state.only),
    flash: subjectNamed(state.flash),
  };
}

export function modelState(state: WatchState): WatchModelState {
  return { settled: state.settled, spin: state.spin };
}

// A slide's frontmatter, at a number of clicks, as a state for the watch's
// stage. The frontmatter names things; `stageState` turns the names into the
// scene's objects, once, at this boundary.
//   watch: a view (cover, hairspring, crown); none hides the watch
//   watchTilt: degrees (default 0)
//   watchOnly: a subject ("hairspring and stud"): the rest of the watch fades
//   watchFlash: a subject ("balance and hairspring") that flashes before the
//     camera moves, when the slide is reached by a transition
//   watchSettle: the click at which the balance settles at rest
//   watchHide: the click at which the watch fades out, as on a slide without
//     a `watch`; the slide shows something else from then on

import type { Scene } from "../webgl/scene.ts";
import type { StageState } from "../webgl/timeline.ts";
import type { WatchModelState } from "./model.ts";

export interface WatchState {
  view: string;
  tilt: number;
  only: string | undefined;
  flash: string | undefined;
  settled: boolean;
}

function wrong(name: string, value: unknown, wanted: string): never {
  throw new Error(`${name}: ${JSON.stringify(value)} should be ${wanted}`);
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
  const settleAt = frontmatter["watchSettle"];
  if (
    settleAt !== undefined &&
    (typeof settleAt !== "number" ||
      !Number.isInteger(settleAt) ||
      settleAt < 0)
  ) {
    return wrong("watchSettle", settleAt, "a click number");
  }
  const hideAt = frontmatter["watchHide"];
  if (
    hideAt !== undefined &&
    (typeof hideAt !== "number" || !Number.isInteger(hideAt) || hideAt < 0)
  ) {
    return wrong("watchHide", hideAt, "a click number");
  }
  if (hideAt !== undefined && clicks >= hideAt) return undefined;
  return {
    view,
    tilt,
    only,
    flash,
    settled: settleAt !== undefined && clicks >= settleAt,
  };
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
  return { settled: state.settled };
}

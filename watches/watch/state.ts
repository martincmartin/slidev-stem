// A slide's frontmatter, at a number of clicks, as a state for the watch's
// stage. The frontmatter names things; `stageState` turns the names into the
// scene's objects, once, at this boundary.
//   watch: a view (cover, hairspring, crown); none hides the watch
//   watchTilt: degrees (default 0)
//   watchOnly: a subject ("hairspring and stud"): the rest of the watch fades
//   watchSettle: the click at which the balance settles at rest

import type { Scene } from "../webgl/scene.ts";
import type { StageState } from "../webgl/stage.ts";
import type { WatchModelState } from "./model.ts";

export interface WatchState {
  view: string;
  tilt: number;
  only: string | undefined;
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
  const settleAt = frontmatter["watchSettle"];
  if (
    settleAt !== undefined &&
    (typeof settleAt !== "number" ||
      !Number.isInteger(settleAt) ||
      settleAt < 0)
  ) {
    return wrong("watchSettle", settleAt, "a click number");
  }
  return {
    view,
    tilt,
    only,
    settled: settleAt !== undefined && clicks >= settleAt,
  };
}

/** The camera's and the fade's state, with the names turned into objects. */
export function stageState(scene: Scene, state: WatchState): StageState {
  const view = scene.views.find((candidate) => candidate.name === state.view);
  if (!view) throw new Error(`no watch view ${state.view}`);
  const subject =
    state.only === undefined
      ? null
      : (scene.subjects.find((candidate) => candidate.name === state.only) ??
        null);
  if (state.only !== undefined && subject === null) {
    throw new Error(`no watch subject ${state.only}`);
  }
  return { view, tilt: state.tilt, subject };
}

export function modelState(state: WatchState): WatchModelState {
  return { settled: state.settled };
}

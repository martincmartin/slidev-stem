// What the screen shows now, for tools/navcheck.ts: the contract is in
// ../docs/navigation.md, "Diagnostic: exhaustive navigation". `settled` must be the same however a
// (slide, click) is reached; each `continuous` number must move without a cut;
// `busy` is true while a story animation (the board's bend or curl) or a
// camera move still runs, so the check waits for it; and while a press would
// jump (`pressJumps`: ../docs/navigation.md, "A press during a move"), so that
// a check that waits for it presses a step.

import type { Stage } from "../webgl/stage.ts";
import type { WatchModelState } from "./model.ts";

export interface SlideState {
  settled: Record<string, string | number | boolean>;
  continuous: Record<string, number>;
  busy: boolean;
}

// What the watch's layer (global-bottom.vue) gives the scripts that drive the
// deck. Here, not in the layer, so that a script's types see them too.
declare global {
  interface Window {
    /** For the measurement scripts. */
    watchStage?: Stage<WatchModelState>;
    /** For tools/navcheck.ts (../docs/navigation.md, "Diagnostic:
     *  exhaustive navigation") and art/print-check.ts. */
    slideState?: () => SlideState;
  }
}

/** The element's opacity on the screen: its own times its ancestors'. */
function shownOpacity(element: Element | null): number {
  let opacity = 1;
  for (let at = element; at; at = at.parentElement) {
    opacity *= Number(getComputedStyle(at).opacity);
  }
  return element ? opacity : 0;
}

/** The diving boards on the screen (a hidden slide's are not). */
function shownBoards(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(".diving-board")].filter(
    (host) => host.offsetParent !== null,
  );
}

function layerOpacity(boards: HTMLElement[], layer: string): number {
  return Math.max(
    0,
    ...boards.map((host) =>
      shownOpacity(host.querySelector(`[data-layer="${layer}"]`)),
    ),
  );
}

/** How much of the watch's layer the slide on the screen covers: the alpha of
 *  its paper. A slide with the watch or the board is see-through (0). */
function slideCover(): number {
  const layout = [
    ...document.querySelectorAll(".slidev-page .slidev-layout"),
  ].find((element) => (element as HTMLElement).offsetParent !== null);
  if (!layout) return 0;
  const colour = getComputedStyle(layout).backgroundColor;
  const parts = /rgba?\(([^)]*)\)/.exec(colour)?.[1]?.split(",") ?? [];
  return parts.length === 4 ? Number(parts[3]) : 1;
}

export function slideState(
  stage: Stage<WatchModelState> | undefined,
  canvas: HTMLCanvasElement | null,
  shown: string,
  /** Whether a press now would be a jump (global-bottom.vue). */
  pressJumps: boolean,
): SlideState {
  const now = performance.now();
  const boards = shownBoards();
  const settled: SlideState["settled"] = { watch: shown };
  // what the slide's paper hides of the watch's layer, which is under it
  const seen = 1 - slideCover();
  const continuous: SlideState["continuous"] = {
    "watch opacity": seen * shownOpacity(canvas),
    "board picture": seen * layerOpacity(boards, "board"),
    "rest shape": seen * layerOpacity(boards, "rest"),
    "rest callout": seen * layerOpacity(boards, "rest-callout"),
  };
  let busy = pressJumps;
  if (stage?.hasState) {
    const values = stage.valuesAt(now);
    if (shown !== "null") {
      // a hidden watch keeps its last values: they are not on the screen
      settled["view"] = values.view.name;
      settled["tilt"] = values.tilt;
      settled["turn"] = values.turn;
      // what is on the screen, once nothing fades
      settled["shown"] = [...values.keep]
        .map((mesh) => mesh.name)
        .sort()
        .join(", ");
      continuous["view scale"] = values.view.scale;
      continuous["tilt"] = values.tilt;
      continuous["turn"] = values.turn;
    }
    if (stage.movingAt(now)) busy = true;
  }
  // whether the words "tick" and "tock" show at the strikes: each word's
  // opacity is the phase of the mechanism, so it is not `continuous`
  const tickTock = document.querySelector<HTMLElement>(".tick-tock");
  const words = tickTock?.dataset["shown"];
  if (words !== undefined) settled["tick-tock"] = words;
  // the time scale (components/TimeScale.vue): its number is a gauge, which
  // changes at once, not a fade, so it is `settled`; it waits for the
  // number to reach the click's speed-up. The time scale itself fades
  const timeScale = document.querySelector<HTMLElement>(".time-scale");
  if (timeScale) {
    settled["time scale"] = Number(timeScale.dataset["speedUp"]);
    continuous["time scale opacity"] = seen * shownOpacity(timeScale);
    if (timeScale.dataset["busy"] === "true") busy = true;
  }
  for (const host of boards) {
    const phase = host.dataset["phase"];
    if (phase !== undefined) settled["board"] = phase;
    if (host.dataset["busy"] === "true") busy = true;
  }
  return { settled, continuous, busy };
}

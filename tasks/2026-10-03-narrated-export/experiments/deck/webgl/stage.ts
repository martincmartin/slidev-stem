// A live stage: a canvas that moves its camera from view to view, fades the
// rest of the scene away from a subject, tilts, and runs a model. It knows
// nothing about what the scene shows: the model does.
//
// THE ORDER AND THE FLASH are the timeline's (timeline.ts): the stage has the
// renderer, the model and the frame loop, and asks the timeline what to draw.
//
// A stage owns its renderer and its frame loop: `dispose()` stops both and
// frees the renderer's GL objects.
//
// AN ERROR. If a frame throws (a model's bad matrix, a frame that breaks the
// renderer's contract), the loop stops: the stage does not continue after a
// frame that it could not finish. The error goes to the browser's console;
// `start()` runs the loop again.

import { check } from "./checked.ts";
import { Renderer } from "./renderer.ts";
import { FLASH_INKS } from "./scene.ts";
import type { Group, Palette, Scene, Subject } from "./scene.ts";
import { Timeline } from "./timeline.ts";
import type { StageState, Values } from "./timeline.ts";

/** What the scene shows and moves. */
export interface Model<ModelState> {
  /** A new state for the model; `instantly` for a slide reached directly. */
  show(state: ModelState, now: number, instantly: boolean): void;
  /** The world matrix of each group at `now`; it updates dynamic meshes. */
  frame(now: number, renderer: Renderer): Map<Group, Float32Array>;
  /** What the model is doing, for the measurement scripts. */
  phase(now: number): string;
}

/** The element's size on the screen, in device px. Slidev scales the slide
 *  with a CSS transform, which `clientWidth` leaves out: the bounding box has
 *  it. */
export function deviceSize(element: Element): [number, number] {
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = element.getBoundingClientRect();
  return [
    Math.max(1, Math.round(width * ratio)),
    Math.max(1, Math.round(height * ratio)),
  ];
}

/** The frames that the log keeps: 10 minutes at 60 frames a second. When it
 *  has twice this many, it drops the oldest half, so that a long run does
 *  not grow without end. */
export const FRAME_LOG_LIMIT = 36_000;

/** What the measurement scripts read: each frame's start, JS time and phase,
 *  for the last FRAME_LOG_LIMIT frames or more. */
export interface FrameLog {
  starts: number[];
  drawTimes: number[];
  phases: string[];
  /** [start, "width x height"] at each change of the drawing's size. */
  sizes: [number, string][];
}

export class Stage<ModelState> {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: Renderer;
  readonly log: FrameLog = { starts: [], drawTimes: [], phases: [], sizes: [] };
  private readonly model: Model<ModelState>;
  /** The pending animation frame, while the stage runs. */
  private request: number | null = null;
  private disposed = false;
  private readonly timeline = new Timeline();

  constructor(
    canvas: HTMLCanvasElement,
    scene: Scene,
    palette: Palette,
    model: Model<ModelState>,
  ) {
    this.canvas = canvas;
    this.model = model;
    this.renderer = new Renderer(canvas, scene, palette);
  }

  /** Go to a slide's state: at once, or one channel at a time from where the
   *  camera and the fade are now, alongside the state's flash (the timeline's).
   *  Returns the seconds until the flash ends, or 0 if there is none. */
  show(state: StageState, modelState: ModelState, instantly = false): number {
    check(!this.disposed, "the stage is disposed");
    const now = performance.now();
    const atOnce = instantly || !this.timeline.hasState;
    const flashSeconds = this.timeline.show(state, now, atOnce);
    this.model.show(modelState, now, atOnce);
    return flashSeconds;
  }

  /** The flashed subject, if the flash is on at `now`. */
  flashingAt(now: number): Subject | null {
    return this.timeline.flashingAt(now);
  }

  /** Each channel's value at `now`. */
  valuesAt(now: number): Values {
    return this.timeline.valuesAt(now);
  }

  /** What is moving at `now`: the flash, a channel, or the model's phase. */
  phaseAt(now: number): string {
    return this.timeline.phaseAt(now) ?? this.model.phase(now);
  }

  /** Draw a frame at each animation frame, until `stop()`. */
  start(): void {
    check(!this.disposed, "the stage is disposed");
    check(this.timeline.hasState, "show a state before the stage starts");
    this.request ??= requestAnimationFrame(this.frame);
  }

  stop(): void {
    if (this.request !== null) cancelAnimationFrame(this.request);
    this.request = null;
  }

  /** Stop, and free the renderer. Calling it again does nothing. */
  dispose(): void {
    this.stop();
    this.renderer.dispose();
    this.disposed = true;
  }

  private trimLog(): void {
    const { log } = this;
    if (log.starts.length < 2 * FRAME_LOG_LIMIT) return;
    const oldest = log.starts.length - FRAME_LOG_LIMIT;
    for (const list of [log.starts, log.drawTimes, log.phases]) {
      list.splice(0, oldest);
    }
    const first = log.starts[0] ?? Infinity;
    // keep the size in force at the first kept frame
    const kept = log.sizes.findLastIndex(([start]) => start <= first);
    if (kept > 0) log.sizes.splice(0, kept);
  }

  private readonly frame = (now: number): void => {
    this.request = null;
    const before = performance.now();
    const values = this.valuesAt(now);
    const flashing = this.flashingAt(now);
    const size = deviceSize(this.canvas);
    const sizeText = size.join(" x ");
    if (this.log.sizes.at(-1)?.[1] !== sizeText) {
      this.log.sizes.push([now, sizeText]);
    }
    this.renderer.render({
      view: values.view,
      tilt: values.tilt,
      groupMatrices: this.model.frame(now, this.renderer),
      ...(values.subject ? { keep: values.subject.meshes } : {}),
      rest: values.rest,
      ...(flashing
        ? { recolour: { meshes: flashing.meshes, inks: FLASH_INKS } }
        : {}),
      size,
    });
    this.log.starts.push(now);
    this.log.drawTimes.push(performance.now() - before);
    this.log.phases.push(this.phaseAt(now));
    this.trimLog();
    this.request = requestAnimationFrame(this.frame);
  };
}

// A live stage: a canvas that moves its camera from view to view, fades
// meshes in and out, tilts, and runs a model. It knows
// nothing about what the scene shows: the model does.
//
// THE ORDER AND THE FLASH are the timeline's (timeline.ts): the stage has the
// renderer, the model and the frame loop, and asks the timeline what to draw.
//
// A MODEL'S STORY. A model may tell a story of its own at a change (in the
// watch, a key that winds the mainspring). It starts when the stage's change
// ends (`Model.show`'s `after`). The story can show meshes that no state
// names, at an opacity (`Model.extra`): one fade at a time, so it fades them
// while the timeline does not fade; if both fade at once, the story's meshes
// show whole, or not at all.
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
import type { Group, Mesh, Palette, Scene } from "./scene.ts";
import { Timeline } from "./timeline.ts";
import type { StageState, Values } from "./timeline.ts";

/** Meshes that a model's story shows besides the state's, at an opacity. */
export interface Extra {
  readonly meshes: ReadonlySet<Mesh>;
  /** 0 to 1. */
  readonly opacity: number;
}

/** What the scene shows and moves. */
export interface Model<ModelState> {
  /** A new state for the model; `instantly` for a slide reached directly.
   *  `after` (ms): when the stage's change ends, for a story that plays
   *  forward. */
  show(state: ModelState, now: number, instantly: boolean, after: number): void;
  /** The world matrix of each group at `now`; it updates dynamic meshes. */
  frame(now: number, renderer: Renderer): Map<Group, Float32Array>;
  /** The story's meshes at `now`, or `null`. */
  extra?(now: number): Extra | null;
  /** When the story's moves end (ms), or `now`. */
  endAt?(now: number): number;
  /** Whether the story moves at `now`. */
  moving?(now: number): boolean;
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

/** The timeline's fade, with the story's meshes: whole, or as the fade if
 *  the timeline does not fade. While both fade, they show whole from half
 *  their opacity. */
function withExtra(
  values: Values,
  extra: Extra | null | undefined,
): Pick<Values, "keep" | "fade" | "rest"> {
  const { keep, fade, rest } = values;
  if (!extra || extra.opacity <= 0) return { keep, fade, rest };
  const whole = new Set([...keep, ...extra.meshes]);
  if (extra.opacity >= 1) return { keep: whole, fade, rest };
  if (fade.size === 0) return { keep, fade: extra.meshes, rest: extra.opacity };
  return { keep: extra.opacity >= 0.5 ? whole : keep, fade, rest };
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
   *  camera and the fade are now. The timeline controls the flash order.
   *  Returns the seconds until the flash ends, or 0 if there is none. */
  show(state: StageState, modelState: ModelState, instantly = false): number {
    check(!this.disposed, "the stage is disposed");
    const now = performance.now();
    const atOnce = instantly || !this.timeline.hasState;
    const flashSeconds = this.timeline.show(state, now, atOnce);
    this.model.show(modelState, now, atOnce, this.timeline.endAt(now));
    return flashSeconds;
  }

  /** The flashed meshes, if the flash is on at `now`. */
  flashingAt(now: number): ReadonlySet<Mesh> | null {
    return this.timeline.flashingAt(now);
  }

  /** Each channel's value at `now`. */
  valuesAt(now: number): Values {
    return this.timeline.valuesAt(now);
  }

  /** Whether a state has been shown yet. */
  get hasState(): boolean {
    return this.timeline.hasState;
  }

  /** Whether a channel moves, the flash runs, or the model's story moves, at
   *  `now`. */
  movingAt(now: number): boolean {
    return (
      this.timeline.phaseAt(now) !== null || (this.model.moving?.(now) ?? false)
    );
  }

  /** When the camera's last move ends (ms), or `now` if it does not move. */
  viewEndAt(now: number): number {
    return this.timeline.viewEndAt(now);
  }

  /** When the change ends (ms), with its flash and the model's story, or
   *  `now` if it has. */
  endAt(now: number): number {
    return Math.max(this.timeline.endAt(now), this.model.endAt?.(now) ?? now);
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

  /** Draw in `palette`'s colours from the next frame. */
  setPalette(palette: Palette): void {
    check(!this.disposed, "the stage is disposed");
    this.renderer.setPalette(palette);
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
    const recolour = this.timeline.recolourAt(now);
    const size = deviceSize(this.canvas);
    const sizeText = size.join(" x ");
    if (this.log.sizes.at(-1)?.[1] !== sizeText) {
      this.log.sizes.push([now, sizeText]);
    }
    const groupMatrices = this.model.frame(now, this.renderer);
    const { keep, fade, rest } = withExtra(values, this.model.extra?.(now));
    this.renderer.render({
      view: values.view,
      tilt: values.tilt,
      groupMatrices,
      keep,
      fade,
      rest,
      ...(recolour ? { recolour } : {}),
      dim: values.dim,
      size,
    });
    this.log.starts.push(now);
    this.log.drawTimes.push(performance.now() - before);
    this.log.phases.push(this.phaseAt(now));
    this.trimLog();
    this.request = requestAnimationFrame(this.frame);
  };
}

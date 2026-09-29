// A live stage: a canvas that moves its camera from view to view, fades the
// rest of the scene away from a subject, tilts, and runs a model. It knows
// nothing about what the scene shows: the model does.
//
// THE ORDER. Each change runs one channel at a time, eased: towards a subject
// the camera moves, then the rest fades, then the camera tilts; away from it,
// the reverse. A new state starts from what is on the screen now, so a change
// during a transition does not jump.

import { Renderer } from "./renderer.ts";
import type { Group, Mesh, Scene, Subject, View } from "./scene.ts";

export const MOVE_SECONDS = 1.8;
export const FADE_SECONDS = 0.8;
export const TILT_SECONDS = 1.5;

/** What the scene shows and moves. */
export interface Model<ModelState> {
  /** A new state for the model; `instantly` for a slide reached directly. */
  show(state: ModelState, now: number, instantly: boolean): void;
  /** The world matrix of each group at `now`; it updates dynamic meshes. */
  frame(now: number, renderer: Renderer): Map<Group, Float32Array>;
  /** What the model is doing, for the measurement scripts. */
  phase(now: number): string;
}

/** What the camera and the fade show. */
export interface StageState {
  view: View;
  /** Degrees. */
  tilt: number;
  /** The rest of the scene fades away from this; `null`: nothing fades. */
  subject: Subject | null;
}

type Channel = "view" | "rest" | "tilt";

interface Values {
  view: View;
  tilt: number;
  rest: number;
}

interface Phase {
  channel: Channel;
  from: Values[Channel];
  to: Values[Channel];
  /** ms. */
  start: number;
  seconds: number;
}

export function ease(fraction: number): number {
  return fraction < 0.5 ? 4 * fraction ** 3 : 1 - (-2 * fraction + 2) ** 3 / 2;
}

export function mix(first: number, second: number, fraction: number): number {
  return first + (second - first) * fraction;
}

/** An eased mix of two views, as a view of its own. */
export function mixView(first: View, second: View, fraction: number): View {
  return {
    name: `${first.name} to ${second.name}`,
    scale: mix(first.scale, second.scale, fraction),
    shift: [
      mix(first.shift[0], second.shift[0], fraction),
      mix(first.shift[1], second.shift[1], fraction),
    ],
    pivot: [
      mix(first.pivot[0], second.pivot[0], fraction),
      mix(first.pivot[1], second.pivot[1], fraction),
      mix(first.pivot[2], second.pivot[2], fraction),
    ],
  };
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

const TOWARDS_SUBJECT: Channel[] = ["view", "rest", "tilt"];
const SECONDS: Record<Channel, number> = {
  view: MOVE_SECONDS,
  rest: FADE_SECONDS,
  tilt: TILT_SECONDS,
};

/** What the measurement scripts read: each frame's start, JS time and phase. */
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
  private running = false;
  /** Where each channel is, when no phase runs. */
  private values: Values | null = null;
  /** One after another. */
  private phases: Phase[] = [];
  /** The subject's meshes, while the rest is faded or fading. */
  private keep: Set<Mesh> | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    scene: Scene,
    model: Model<ModelState>,
  ) {
    this.canvas = canvas;
    this.model = model;
    this.renderer = new Renderer(canvas, scene);
  }

  /** Go to a slide's state: at once, or one channel at a time from where the
   *  camera and the fade are now. */
  show(state: StageState, modelState: ModelState, instantly = false): void {
    const now = performance.now();
    const target: Values = {
      view: state.view,
      tilt: state.tilt,
      rest: state.subject ? 0 : 1,
    };
    if (state.subject) this.keep = state.subject.meshes;
    if (instantly || !this.values) {
      this.values = target;
      this.phases = [];
      this.model.show(modelState, now, true);
      return;
    }
    const current = this.valuesAt(now);
    const order =
      target.rest < current.rest
        ? TOWARDS_SUBJECT
        : [...TOWARDS_SUBJECT].reverse();
    this.values = current;
    this.phases = [];
    let start = now;
    for (const channel of order) {
      if (current[channel] === target[channel]) continue;
      this.phases.push({
        channel,
        from: current[channel],
        to: target[channel],
        start,
        seconds: SECONDS[channel],
      });
      start += SECONDS[channel] * 1000;
    }
    this.model.show(modelState, now, false);
  }

  /** Each channel's value at `now`. */
  valuesAt(now: number): Values {
    if (!this.values) throw new Error("the stage has no state yet");
    const values = { ...this.values };
    for (const phase of this.phases) {
      if (now < phase.start) continue;
      const fraction = Math.min(
        1,
        (now - phase.start) / (phase.seconds * 1000),
      );
      const eased = ease(fraction);
      // At its end, the target itself, so that the next state can tell that
      // this channel is already there.
      if (fraction >= 1) {
        Object.assign(values, { [phase.channel]: phase.to });
      } else if (phase.channel === "view") {
        values.view = mixView(phase.from as View, phase.to as View, eased);
      } else {
        values[phase.channel] = mix(
          phase.from as number,
          phase.to as number,
          eased,
        );
      }
    }
    return values;
  }

  /** What is moving at `now`: a channel, or the model's phase. */
  phaseAt(now: number): string {
    const running = this.phases.find(
      (phase) => now >= phase.start && now < phase.start + phase.seconds * 1000,
    );
    return running ? running.channel : this.model.phase(now);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
  }

  private readonly frame = (now: number): void => {
    if (!this.running) return;
    const before = performance.now();
    const values = this.valuesAt(now);
    const size = deviceSize(this.canvas);
    const sizeText = size.join(" x ");
    if (this.log.sizes.at(-1)?.[1] !== sizeText) {
      this.log.sizes.push([now, sizeText]);
    }
    this.renderer.render({
      view: values.view,
      tilt: values.tilt,
      groupMatrices: this.model.frame(now, this.renderer),
      ...(this.keep ? { keep: this.keep } : {}),
      rest: values.rest,
      size,
    });
    this.log.starts.push(now);
    this.log.drawTimes.push(performance.now() - before);
    this.log.phases.push(this.phaseAt(now));
    requestAnimationFrame(this.frame);
  };
}

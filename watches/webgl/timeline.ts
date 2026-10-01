// The stage's choreography, without a renderer or a clock of its own: which
// channel moves when. `Stage` (stage.ts) draws what it says; this file has no
// DOM and no WebGL, so a test can drive it with made-up times.
//
// THE ORDER. Each change runs one channel at a time, eased: towards a subject
// the camera moves, then the camera tilts, then the rest fades; away from it,
// the reverse. From one subject to another, the rest first fades in around
// the old subject; then the stage goes towards the new one. A new state starts
// from what is on the screen now, so a change during a transition does not
// jump.
//
// A FLASH (docs/illustrations.md, "Flash"). A state can name a subject to
// flash: before the channels change, the subject is drawn in FLASH_INKS and in
// its own inks, in turn, FLASH_CYCLES times. Only in a transition: a state
// shown at once, or one that changes no channel, does not flash. It ends on
// its own inks, so the move starts from the drawing as it was.

import type { Subject, View } from "./scene.ts";

export const MOVE_SECONDS = 1.8;
export const FADE_SECONDS = 0.8;
export const TILT_SECONDS = 1.5;
/** A flash: on (in FLASH_INKS), then off (in its own inks), this many times. */
export const FLASH_ON_SECONDS = 0.25;
export const FLASH_OFF_SECONDS = 0.25;
export const FLASH_CYCLES = 5;
export const FLASH_SECONDS =
  FLASH_CYCLES * (FLASH_ON_SECONDS + FLASH_OFF_SECONDS);

/** Whether a flash that started `elapsed` seconds ago is on. */
export function flashIsOn(elapsed: number): boolean {
  if (elapsed < 0 || elapsed >= FLASH_SECONDS) return false;
  return elapsed % (FLASH_ON_SECONDS + FLASH_OFF_SECONDS) < FLASH_ON_SECONDS;
}

/** What the camera and the fade show. */
export interface StageState {
  view: View;
  /** Degrees. */
  tilt: number;
  /** The rest of the scene fades away from this; `null`: nothing fades. */
  subject: Subject | null;
  /** Flashed before the channels change, in a transition; `null`: none. */
  flash: Subject | null;
}

/** Where each channel is. */
export interface Values {
  view: View;
  tilt: number;
  rest: number;
  /** What the fade keeps. It matters only while `rest` < 1. */
  subject: Subject | null;
}

type Channel = "view" | "rest" | "tilt";

/** A channel's move from one value to another. Each variant ties the channel
 *  to the type of its values. */
type Phase = {
  /** ms. */
  start: number;
  seconds: number;
} & (
  | { channel: "view"; from: View; to: View }
  | { channel: "tilt"; from: number; to: number }
  | {
      channel: "rest";
      from: number;
      to: number;
      /** A fade towards a subject: the subject that it keeps, from its start. */
      subject?: Subject;
    }
);

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

const TOWARDS_SUBJECT: Channel[] = ["view", "tilt", "rest"];
const SECONDS: Record<Channel, number> = {
  view: MOVE_SECONDS,
  rest: FADE_SECONDS,
  tilt: TILT_SECONDS,
};

/** `values` with `phase` applied at `now`. At its end, a phase gives the
 *  target itself, so that the next state can tell that its channel is already
 *  there. */
function applyPhase(values: Values, phase: Phase, now: number): void {
  if (now < phase.start) return;
  const fraction = Math.min(1, (now - phase.start) / (phase.seconds * 1000));
  const eased = ease(fraction);
  const done = fraction >= 1;
  switch (phase.channel) {
    case "view":
      values.view = done ? phase.to : mixView(phase.from, phase.to, eased);
      break;
    case "tilt":
      values.tilt = done ? phase.to : mix(phase.from, phase.to, eased);
      break;
    case "rest":
      if (phase.subject) values.subject = phase.subject;
      values.rest = done ? phase.to : mix(phase.from, phase.to, eased);
      break;
  }
}

/** The phase that takes `channel` from `from` to `target`, or `null` if it is
 *  there already. */
function phaseOf(
  channel: Channel,
  from: Values,
  target: Values,
  start: number,
  subject: Subject | null,
): Phase | null {
  const seconds = SECONDS[channel];
  switch (channel) {
    case "view":
      return from.view === target.view
        ? null
        : { channel, from: from.view, to: target.view, start, seconds };
    case "tilt":
      return from.tilt === target.tilt
        ? null
        : { channel, from: from.tilt, to: target.tilt, start, seconds };
    case "rest":
      return from.rest === target.rest
        ? null
        : {
            channel,
            from: from.rest,
            to: target.rest,
            start,
            seconds,
            ...(subject ? { subject } : {}),
          };
  }
}

export class Timeline {
  /** Where each channel is, when no phase runs. */
  private values: Values | null = null;
  /** One after another. */
  private phases: Phase[] = [];
  /** The flash before the phases, and when it starts (ms). */
  private flash: { subject: Subject; start: number } | null = null;

  /** Whether a state has been shown yet. Until then, there is nothing to
   *  move from, and the first state is shown at once. */
  get hasState(): boolean {
    return this.values !== null;
  }

  /** Go to a state at `now` (ms): at once, or one channel at a time from where
   *  the channels are now, after the state's flash. Returns the seconds until
   *  the flash ends, or 0 if there is none. */
  show(state: StageState, now: number, instantly = false): number {
    const target: Values = {
      view: state.view,
      tilt: state.tilt,
      rest: state.subject ? 0 : 1,
      subject: state.subject,
    };
    const running = this.flash;
    this.flash = null;
    if (instantly || !this.values) {
      this.values = target;
      this.phases = [];
      return 0;
    }
    const current = this.valuesAt(now);
    this.values = current;
    this.phases = [];
    let start = now;
    const add = (phase: Phase | null): void => {
      if (!phase) return;
      this.phases.push(phase);
      start += phase.seconds * 1000;
    };
    // where each channel is when the phases so far end
    const reached = { ...current };
    if (
      state.subject !== null &&
      current.subject !== state.subject &&
      current.rest < 1
    ) {
      add(phaseOf("rest", reached, { ...target, rest: 1 }, start, null));
      reached.rest = 1;
    }
    const order =
      target.rest < reached.rest
        ? TOWARDS_SUBJECT
        : [...TOWARDS_SUBJECT].reverse();
    for (const channel of order) {
      add(phaseOf(channel, reached, target, start, state.subject));
    }
    if (!state.flash || this.phases.length === 0) return 0;
    // a flash of the same subject that is still running goes on: a click
    // during it does not start it again
    const flashStart =
      running?.subject === state.flash &&
      now < running.start + FLASH_SECONDS * 1000
        ? running.start
        : now;
    this.flash = { subject: state.flash, start: flashStart };
    const delay = flashStart + FLASH_SECONDS * 1000 - now;
    for (const phase of this.phases) phase.start += delay;
    return FLASH_SECONDS - (now - flashStart) / 1000;
  }

  /** The flashed subject, if the flash is on at `now`. */
  flashingAt(now: number): Subject | null {
    const { flash } = this;
    if (!flash || !flashIsOn((now - flash.start) / 1000)) return null;
    return flash.subject;
  }

  /** Each channel's value at `now`. */
  valuesAt(now: number): Values {
    if (!this.values) throw new Error("the timeline has no state yet");
    const values = { ...this.values };
    for (const phase of this.phases) applyPhase(values, phase, now);
    return values;
  }

  /** What the timeline is moving at `now`: "flash", the name of a channel, or
   *  `null` if nothing. */
  phaseAt(now: number): string | null {
    const { flash } = this;
    if (
      flash &&
      now >= flash.start &&
      now < flash.start + FLASH_SECONDS * 1000
    ) {
      return "flash";
    }
    const running = this.phases.find(
      (phase) => now >= phase.start && now < phase.start + phase.seconds * 1000,
    );
    return running ? running.channel : null;
  }
}

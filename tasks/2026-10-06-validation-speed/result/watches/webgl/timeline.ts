// The stage's choreography, without a renderer or a clock of its own: which
// channel moves when. `Stage` (stage.ts) draws what it says; this file has no
// DOM and no WebGL, so a test can drive it with made-up times.
//
// THE ORDER. Each change runs one channel at a time, eased: towards a subject
// the camera moves, then the camera tilts, then the rest fades; away from it,
// the reverse. From one subject to another, the rest first fades in around
// the old subject; then the stage goes towards the new one. Between two
// subjects where one holds the other, the difference fades in or out alone,
// with the rest of the scene still out (a SWAP). If the view or the tilt
// changes too, the camera moves with the smaller subject on the screen: to the
// larger subject, the camera moves and tilts, then the swap; back, the swap,
// then the camera untilts and moves. A new state starts
// from what is on the screen now, so a change during a transition does not
// jump. A change during a swap first finishes the swap's fade, to the subject
// that the new state needs: the smaller one if the new subject is inside it,
// else the larger one. Then the stage goes on from that subject.
//
// A FLASH (docs/illustrations.md, "Flash"). A state can name a subject to
// flash: before the channels change, the subject is drawn in FLASH_INKS and in
// its own inks, in turn, FLASH_CYCLES times. Only in a transition: a state
// shown at once, or one that changes no channel, does not flash. It ends on
// its own inks. The first channel starts as soon as the flash ends. The caller
// names a flash only on the step forward into its slide
// (../../docs/navigation.md): the timeline does not know which way a change
// goes. A swap does not move the stage, so its flash starts when the swap ends,
// and plays on the part that has just faded in.

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
  /** Flashed before the channels change, or after a swap; `null`: none. */
  flash: Subject | null;
}

/** Where each channel is. */
export interface Values {
  view: View;
  tilt: number;
  rest: number;
  /** What the fade keeps. It matters only while `rest` < 1. */
  subject: Subject | null;
  /** While `rest` < 1, the only meshes that fade, besides `subject`'s (a swap);
   *  `null`: every mesh does. */
  fading: Subject | null;
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
  | {
      channel: "swap";
      smaller: Subject;
      larger: Subject;
      /** The difference's opacity: 0 shows `smaller`, 1 shows `larger`. */
      from: number;
      to: number;
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
    case "swap":
      // the smaller subject stays; the larger one's other meshes fade
      values.subject = done
        ? phase.to === 1
          ? phase.larger
          : phase.smaller
        : phase.smaller;
      values.fading = done ? null : phase.larger;
      values.rest = done ? 0 : mix(phase.from, phase.to, eased);
      break;
  }
}

/** Whether `outer` has every mesh of `inner`. */
function holds(outer: Subject, inner: Subject): boolean {
  return [...inner.meshes].every((mesh) => outer.meshes.has(mesh));
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
  /** The flash and when it starts (ms). */
  private flash: { subject: Subject; start: number } | null = null;

  /** Whether a state has been shown yet. Until then, there is nothing to
   *  move from, and the first state is shown at once. */
  get hasState(): boolean {
    return this.values !== null;
  }

  /** Go to a state at `now` (ms): at once, or one channel at a time from where
   *  the channels are now, after the state's flash (before it for a swap).
   *  Returns the seconds until
   *  the flash ends, or 0 if there is none. */
  show(state: StageState, now: number, instantly = false): number {
    const target: Values = {
      view: state.view,
      tilt: state.tilt,
      rest: state.subject ? 0 : 1,
      subject: state.subject,
      fading: null,
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
    let swapped = false;
    const add = (phase: Phase | null): void => {
      if (!phase) return;
      this.phases.push(phase);
      start += phase.seconds * 1000;
    };
    // where each channel is when the phases so far end
    const reached = { ...current };
    if (current.fading !== null && current.subject !== null) {
      // a swap was cut short: finish its fade, to the end that the new state
      // needs. Without this, `fading` would stay, and only the swap's larger
      // subject would ever be drawn again.
      const smaller = current.subject;
      const larger = current.fading;
      const toSmaller = state.subject !== null && holds(smaller, state.subject);
      swapped = true;
      add({
        channel: "swap",
        smaller,
        larger,
        from: current.rest,
        to: toSmaller ? 0 : 1,
        start,
        seconds: FADE_SECONDS,
      });
      reached.subject = toSmaller ? smaller : larger;
      reached.rest = 0;
      reached.fading = null;
    }
    if (
      state.subject !== null &&
      reached.subject !== null &&
      reached.subject !== state.subject &&
      reached.rest === 0 &&
      (holds(state.subject, reached.subject) ||
        holds(reached.subject, state.subject))
    ) {
      swapped = true;
      const from = reached.subject;
      const to = state.subject;
      const growing = holds(to, from);
      const swap = (): void => {
        add({
          channel: "swap",
          smaller: growing ? from : to,
          larger: growing ? to : from,
          from: growing ? 0 : 1,
          to: growing ? 1 : 0,
          start,
          seconds: FADE_SECONDS,
        });
      };
      // the camera moves with the smaller subject on the screen
      if (!growing) swap();
      const camera: Channel[] = growing ? ["view", "tilt"] : ["tilt", "view"];
      for (const channel of camera) {
        add(phaseOf(channel, reached, target, start, null));
      }
      reached.view = target.view;
      reached.tilt = target.tilt;
      if (growing) swap();
      reached.subject = to;
    } else if (
      state.subject !== null &&
      reached.subject !== state.subject &&
      reached.rest < 1
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
        : swapped
          ? start
          : now;
    this.flash = { subject: state.flash, start: flashStart };
    if (!swapped) {
      const delay = flashStart + FLASH_SECONDS * 1000 - now;
      for (const phase of this.phases) phase.start += delay;
    }
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

  /** When the last camera move ends (ms), or `now` if none is still to come.
   *  Text that must not cross a moving picture waits for it, in either
   *  direction: towards a subject the camera moves first, away from it last. */
  viewEndAt(now: number): number {
    const ends = this.phases
      .filter((phase) => phase.channel === "view")
      .map((phase) => phase.start + phase.seconds * 1000);
    return Math.max(now, ...ends);
  }

  /** What the timeline is moving at `now`: "flash", the name of a channel, or
   *  `null` if nothing. */
  phaseAt(now: number): string | null {
    const running = this.phases.find(
      (phase) => now >= phase.start && now < phase.start + phase.seconds * 1000,
    );
    if (running) return running.channel;
    const { flash } = this;
    if (
      flash &&
      now >= flash.start &&
      now < flash.start + FLASH_SECONDS * 1000
    ) {
      return "flash";
    }
    return null;
  }
}

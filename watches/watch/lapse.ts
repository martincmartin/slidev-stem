// The time-lapse of the Recap slide (`watchLapse`): the whole mechanism runs
// at a speed-up, in step, as in the Mainspring slide's time-lapse
// (docs/watch.md, "The Mainspring slide"). The mechanism's time is ahead of
// the balance's clock by the time that the speed-up adds, so the balance,
// the fork and the train are where one watch would have them. Each frame
// shows the mechanism at an instant in its shutter (`shutterInstant` in
// model.ts): what moves faster than a frame can show blurs. Not an
// oversight: a balance at its own speed with the train ahead by whole
// periods, as a stroboscope shows it, left the pallet flipping once a second
// while the train ran at 120x (tasks/2026-10-12-victory-lap/PLAN.md).
// At 15x the train steps at each beat, 15 times a second, each step shorter
// than a frame: that is what the escapement does, and the user keeps it.
// A change of speed-up eases over its seconds, evenly in the logarithm. The
// time ahead is an integral from the clock's start, so `now` may go back: a
// frame's instant in its shutter is before the last frame's `now`. The clock
// holds only the change that runs, or ran last, and the time ahead at its
// start: so `now` may go back within that change, not before it.

import { check } from "../webgl/checked.ts";
import { ease } from "../webgl/timeline.ts";

/** Steps of the table of the integral over a change. Between two steps, the
 *  time ahead is a straight line. Its error must stay under a quarter of the
 *  mechanism's motion in one 60 Hz frame at the speed-up of that moment:
 *  less than the spread of a frame's instant in its shutter. Measured, at
 *  most 0.16 of a frame, at 1x to 1440x in 2.5 s (lapse.test.ts). The error
 *  at the end of a change is under a millisecond. */
const STEPS = 64;

/** A change of speed-up, and the time ahead from the clock's start. */
interface Change {
  /** ms. */
  readonly start: number;
  /** ms; 0: at once. */
  readonly duration: number;
  readonly from: number;
  readonly to: number;
  /** s: the time ahead at `start`. */
  readonly ahead: number;
  /** s: the time ahead from `start` at each of STEPS + 1 even steps of the
   *  change. */
  readonly aheadSteps: readonly number[];
}

/** Throws unless `now` is a time (ms) and `speedUp` is a speed-up: finite,
 *  and at least 1, as `watchLapse` is. */
function checkInputs(speedUp: number, now: number): void {
  check(Number.isFinite(now), `the time ${String(now)} is not finite`);
  check(
    Number.isFinite(speedUp) && speedUp >= 1,
    `the speed-up ${String(speedUp)} is not finite and at least 1`,
  );
}

/** The speed-up at `fraction` (0 to 1) of a change, eased. */
function speedUpAt(from: number, to: number, fraction: number): number {
  const eased = ease(fraction);
  if (eased <= 0) return from;
  if (eased >= 1) return to;
  return Math.exp(Math.log(from) + (Math.log(to) - Math.log(from)) * eased);
}

function changeOf(
  start: number,
  duration: number,
  from: number,
  to: number,
  ahead: number,
): Change {
  const aheadSteps: number[] = [0];
  const step = duration / 1000 / STEPS;
  let previous = speedUpAt(from, to, 0);
  for (let index = 1; index <= STEPS; index++) {
    const next = speedUpAt(from, to, index / STEPS);
    // the trapezoid rule: each second at a speed-up k adds k - 1 seconds
    aheadSteps.push(
      (aheadSteps.at(-1) ?? 0) + ((previous + next) / 2 - 1) * step,
    );
    previous = next;
  }
  return { start, duration, from, to, ahead, aheadSteps };
}

export class LapseClock {
  private change: Change;

  constructor(now: number) {
    checkInputs(1, now);
    this.change = changeOf(now, 0, 1, 1, 0);
  }

  /** The speed-up at `now`. */
  speedUp(now: number): number {
    const { start, duration, from, to } = this.change;
    if (now >= start + duration) return to;
    return speedUpAt(from, to, Math.max(0, now - start) / duration);
  }

  /** Change to `speedUp` from `now`, over `seconds` (or at once). Throws
   *  unless `seconds` is finite and at least 0, and as `checkInputs`. */
  show(speedUp: number, now: number, seconds: number): void {
    checkInputs(speedUp, now);
    check(
      Number.isFinite(seconds) && seconds >= 0,
      `the change's ${String(seconds)} s is not finite and at least 0`,
    );
    this.change = changeOf(
      now,
      seconds * 1000,
      this.speedUp(now),
      speedUp,
      this.ahead(now),
    );
  }

  /** At once at `speedUp`, with nothing ahead: a jump to a slide. Throws
   *  as `checkInputs`. */
  jump(speedUp: number, now: number): void {
    checkInputs(speedUp, now);
    this.change = changeOf(now, 0, speedUp, speedUp, 0);
  }

  /** s: how far the mechanism's time is ahead of the balance's clock. */
  ahead(now: number): number {
    const { start, duration, to, aheadSteps } = this.change;
    const since = Math.max(0, now - start);
    if (since >= duration) {
      return (
        this.change.ahead +
        (aheadSteps.at(-1) ?? 0) +
        ((to - 1) * (since - duration)) / 1000
      );
    }
    const position = (since / duration) * STEPS;
    const index = Math.min(Math.floor(position), STEPS - 1);
    const low = aheadSteps[index] ?? 0;
    const high = aheadSteps[index + 1] ?? low;
    return this.change.ahead + low + (high - low) * (position - index);
  }

  /** The time ahead, once the mechanism runs at its own speed again and it
   *  no longer grows; then the clock holds none. The caller moves it into
   *  the balance's clock, so the balance can rest again. 0 while it grows. */
  takeAhead(now: number): number {
    const { start, duration, to } = this.change;
    if (to !== 1 || now < start + duration) return 0;
    const ahead = this.ahead(now);
    this.jump(1, now);
    return ahead;
  }
}

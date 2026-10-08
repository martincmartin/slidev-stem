// The watch's motion: the keyframes of the mechanism, the balance's swing and
// the hairspring. The spring's formula exists once, here.

import { at, check } from "../webgl/checked.ts";
import { ribbonGeometry, smoothRing } from "../webgl/mesh.ts";
import type { Point2 } from "../webgl/mesh.ts";
import type { Renderer } from "../webgl/renderer.ts";
import type { Model } from "../webgl/stage.ts";
import { FADE_SECONDS } from "../webgl/timeline.ts";
import type { Group, MeshGeometry } from "../webgl/scene.ts";
import type { Timing, Wheel } from "./design.ts";
import type { Watch, WatchGroups } from "./generate.ts";
import { polar, radians } from "./shapes.ts";

/** The hairspring. Its inner end is on the collet, at `radii[0]`, and turns
 *  with the balance; its outer end is held by the stud at `radii[1]` and
 *  `outerAngle`. At rest it is an Archimedean spiral of `turns` turns. It keeps
 *  its length: as the balance winds it up, its coils draw in toward the collet,
 *  and as the balance lets it out, they spread toward the stud. */
export interface Spring {
  radii: [number, number];
  /** Turns at rest (swing 0). */
  turns: number;
  /** Degrees: where the outer end is held. */
  outerAngle: number;
}

/** The spring's radii and turns, as the 2D drawing had them. */
export const SPRING_RADII: [number, number] = [8, 38];
export const SPRING_TURNS = 3.25;
/** At most 0.011 px from the curve at the cover's scale. */
export const SPRING_POINTS = 480;
/** The spread's limit: its coils cross or double back beyond it. */
const MAX_SPREAD = 0.95;

/** The spring's points about the balance's arbor, at the balance's angle
 *  `swing` (degrees). The radius goes from the inner to the outer radius as
 *  r = inner + (outer - inner) (u + k u (1 - u)), where u goes from 0 to 1
 *  along the angle. k is the spread: 0 at rest; below 0 the coils draw in,
 *  above 0 they spread out. It is chosen so that the length is the rest
 *  length. */
export function springPoints(spring: Spring, swing: number): Point2[] {
  const innerAngle = spring.outerAngle - 360 * spring.turns + swing;
  const curve = (spread: number): Point2[] =>
    spiralPoints(spring, innerAngle, spread);
  const target = polylineLength(
    spiralPoints(spring, spring.outerAngle - 360 * spring.turns, 0),
  );
  // the length grows with the spread: bisect
  let low = -MAX_SPREAD;
  let high = MAX_SPREAD;
  if (
    polylineLength(curve(low)) > target ||
    polylineLength(curve(high)) < target
  ) {
    throw new Error(
      `the spring cannot keep its length at swing ${String(swing)}`,
    );
  }
  for (let step = 0; step < 40; step++) {
    const middle = (low + high) / 2;
    if (polylineLength(curve(middle)) < target) low = middle;
    else high = middle;
  }
  return curve((low + high) / 2);
}

function spiralPoints(
  spring: Spring,
  innerAngle: number,
  spread: number,
): Point2[] {
  const [innerRadius, outerRadius] = spring.radii;
  return Array.from({ length: SPRING_POINTS }, (_, index) => {
    const fraction = index / (SPRING_POINTS - 1);
    const shaped = fraction + spread * fraction * (1 - fraction);
    return polar(
      innerRadius + shaped * (outerRadius - innerRadius),
      innerAngle + fraction * (spring.outerAngle - innerAngle),
    );
  });
}

function polylineLength(points: Point2[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index++) {
    const [x0, y0] = at(points, index - 1);
    const [x1, y1] = at(points, index);
    length += Math.hypot(x1 - x0, y1 - y0);
  }
  return length;
}

// ---- the mechanism's keyframes ---------------------------------------------------------
// The 2D drawing played SMIL: each part's angle is linear between keyframes,
// repeated for ever, with each repeat starting where the last one ended (if
// `accumulate`). The escapement moves at a beat a second, tick and tock.

/** A rotation's keyframes, as SMIL plays them. */
export interface Keyframes {
  values: number[];
  /** From 0 to 1, one for each value. */
  keyTimes: number[];
  /** s. */
  duration: number;
  accumulate: boolean;
}

/** The two parts of a period, as fractions, when the impulse pin drives the
 *  fork: the balance is within `pinArc` of centre. */
export function tickWindows(
  timing: Timing,
): [[number, number], [number, number]] {
  const start = Math.acos(timing.pinArc / timing.amplitude) / (2 * Math.PI);
  const end = Math.acos(-timing.pinArc / timing.amplitude) / (2 * Math.PI);
  return [
    [start, end],
    [1 - end, 1 - start],
  ];
}

/** A strike of the impulse jewel on the fork: the start of a tick window. */
export interface StrikeTime {
  /** Mechanism time, s. */
  time: number;
  /** Which of the period's two tick windows: 0 or 1. */
  window: number;
}

/** The strikes after mechanism time `from` and up to `to` (s), in order;
 *  none if `to` is not after `from`. */
export function strikesBetween(
  timing: Timing,
  from: number,
  to: number,
): StrikeTime[] {
  const starts = tickWindows(timing).map(([start]) => start * timing.period);
  const found: StrikeTime[] = [];
  for (
    let period = Math.floor(from / timing.period);
    period * timing.period <= to;
    period++
  ) {
    starts.forEach((start, window) => {
      const time = period * timing.period + start;
      if (time > from && time <= to) found.push({ time, window });
    });
  }
  return found;
}

/** A part of the train, which turns `step` degrees at each beat and holds
 *  still between beats, over `duration` seconds: a whole number of periods.
 *  In each tick window it waits for the fork to unlock the escape wheel, then
 *  turns. */
export function stepper(
  timing: Timing,
  duration: number,
  step: number,
  accumulate: boolean,
): Keyframes {
  const periods = duration / timing.period;
  check(
    Number.isInteger(periods) && periods >= 1,
    `${String(duration)} s is not a whole number of ${String(timing.period)} s periods`,
  );
  const keyTimes = [0];
  const values = [0];
  let angle = 0;
  for (let period = 0; period < periods; period++) {
    for (const [start, end] of tickWindows(timing)) {
      const unlocked = start + timing.unlock * (end - start);
      keyTimes.push((period + unlocked) / periods, (period + end) / periods);
      values.push(angle, angle + step);
      angle += step;
    }
  }
  return {
    values: [...values, angle],
    keyTimes: [...keyTimes, 1],
    duration,
    accumulate,
  };
}

/** The fork flips at each beat, between the two ends of its bank. */
export function forkFlips(timing: Timing): Keyframes {
  const [[firstStart, firstEnd], [secondStart, secondEnd]] =
    tickWindows(timing);
  return {
    values: [-1, -1, 1, 1, -1, -1].map((side) => side * timing.bank),
    keyTimes: [0, firstStart, firstEnd, secondStart, secondEnd, 1],
    duration: timing.period,
    accumulate: false,
  };
}

/** The angle at mechanism time `time` (s): linear between keyframes. */
export function angleAt(keyframes: Keyframes, time: number): number {
  const repeat = Math.floor(time / keyframes.duration);
  const fraction = time / keyframes.duration - repeat;
  let index = 0;
  while (
    index < keyframes.keyTimes.length - 2 &&
    at(keyframes.keyTimes, index + 1) <= fraction
  ) {
    index++;
  }
  const span =
    at(keyframes.keyTimes, index + 1) - at(keyframes.keyTimes, index);
  const along =
    span > 0 ? (fraction - at(keyframes.keyTimes, index)) / span : 1;
  const start = at(keyframes.values, index);
  const value =
    start +
    (at(keyframes.values, index + 1) - start) * Math.min(Math.max(along, 0), 1);
  return keyframes.accumulate
    ? repeat * at(keyframes.values, keyframes.values.length - 1) + value
    : value;
}

/** The balance's angle at mechanism time `time` (degrees, clockwise). At the
 *  end of its swing at time 0. */
export function balanceAngle(timing: Timing, time: number): number {
  return timing.amplitude * Math.cos((2 * Math.PI * time) / timing.period);
}

// ---- the matrices ---------------------------------------------------------------------------
/** A 4 x 4 matrix, column-major, for a turn by `degrees` about z, after a
 *  move to (x, y). */
function turnAt(x: number, y: number, degrees: number): Float32Array {
  const cosine = Math.cos(radians(degrees));
  const sine = Math.sin(radians(degrees));
  return Float32Array.from([
    cosine,
    sine,
    0,
    0,
    -sine,
    cosine,
    0,
    0,
    0,
    0,
    1,
    0,
    x,
    y,
    0,
    1,
  ]);
}

/** The watch's motion at a mechanism time. The train (the wheels and the
 *  hands) turns with one position, in beats: each of its groups turns its own
 *  degrees a beat. The mechanism steps it one beat at each tick (`beats`); a
 *  `TrainClock` can give another position. */
export class Motion {
  private readonly watch: Watch;
  /** The train's position at a mechanism time, in beats. */
  private readonly beat: Keyframes;
  /** Degrees a beat, of each group that the train turns. */
  private readonly steps = new Map<Group, number>();
  private readonly forkTurning: Keyframes;

  constructor(watch: Watch) {
    this.watch = watch;
    const { design, groups } = watch;
    const { timing } = design;
    this.beat = stepper(timing, timing.period, 1, true);
    for (const wheel of design.wheels) {
      this.steps.set(wheelGroup(groups, wheel), wheel.step);
    }
    const [, centre, , fourth] = design.wheels as [Wheel, Wheel, Wheel, Wheel];
    // the seconds hand is on the fourth wheel's arbor
    this.steps.set(groups.seconds, fourth.step);
    this.steps.set(groups.hour, centre.step / timing.hourRatio);
    this.steps.set(groups.minute, centre.step);
    this.forkTurning = forkFlips(timing);
  }

  /** The train's position at mechanism time `time`, in beats: a whole number
   *  while the escape wheel is locked, and between two while it steps. */
  beats(time: number): number {
    return angleAt(this.beat, time);
  }

  /** The world matrix of every group at mechanism time `time`, with the
   *  balance at `swing` degrees and the train at `beats`. */
  matrices(
    time: number,
    swing: number,
    beats = this.beats(time),
  ): Map<Group, Float32Array> {
    const { design, groups } = this.watch;
    const [centreX, centreY] = design.watchCentre;
    const result = new Map<Group, Float32Array>();
    result.set(groups.root, turnAt(centreX, centreY, 0));
    const place = (group: Group, arbor: Point2, angle: number): void => {
      result.set(group, turnAt(centreX + arbor[0], centreY + arbor[1], angle));
    };
    const turned = (group: Group): number => {
      const step = this.steps.get(group);
      if (step === undefined) throw new Error(`${group.name} has no step`);
      return step * beats;
    };
    for (const wheel of design.wheels) {
      const group = wheelGroup(groups, wheel);
      place(group, wheel.arbor, turned(group));
    }
    place(groups.balance, design.balance.arbor, swing);
    place(groups.springBase, design.balance.arbor, 0);
    place(groups.fork, design.fork.pivot, angleAt(this.forkTurning, time));
    const [, centre, , fourth] = design.wheels as [Wheel, Wheel, Wheel, Wheel];
    place(groups.seconds, fourth.arbor, turned(groups.seconds));
    place(groups.hour, centre.arbor, turned(groups.hour));
    place(groups.minute, centre.arbor, turned(groups.minute));
    return result;
  }

  /** The spring's geometry with the balance at `swing` degrees. */
  springGeometry(swing: number): MeshGeometry {
    const style = at(this.watch.spring.lines, 0).style;
    return ribbonGeometry(
      smoothRing(springPoints(this.watch.springShape, swing), style, false),
      this.watch.springHeights.bottom,
      this.watch.springHeights.top,
    );
  }
}

function wheelGroup(groups: WatchGroups, wheel: Wheel): Group {
  const found = groups.wheels.get(wheel);
  if (!found) throw new Error(`no group for the ${wheel.name} wheel`);
  return found;
}

// ---- the balance's clock --------------------------------------------------------------------
// The balance swings as q = A cos(2 pi t / T). To settle, it waits for the
// next extreme (|q| = A, where it is still), then goes to rest (q = 0) as
//   q = q_e (1 - s(u)),  s(u) = 3u^2 - 2u^3,  u = (t - t_e) / D,
// with D = sqrt(6) / omega = 0.78 s for T = 2 s. Its angle, speed and
// acceleration at t_e are those of the free swing, and its speed is 0 at the
// end (planning task, section 10.1: the other curves have a jump in one of
// the three). To resume: a cubic from where it is, at the speed it has, on to
// the opposite extreme, still, in D; then the free swing. From rest, that
// cubic is the settle mirrored, and it meets the free swing with no jump in
// acceleration either.
//
// The rest of the mechanism follows the balance, by the mechanism time at
// which the free swing has the balance's angle: tau = t_e + arccos(q / q_e) /
// omega. So the train stops when the balance stops, with the fork on its centre
// line, and it only runs forward.
//
// Times: `now` in ms (performance.now()); mechanism time in s.

function smoothstep(fraction: number): number {
  return fraction * fraction * (3 - 2 * fraction);
}

/** The cubic from `from` at `speed` (per unit of u) to `to`, still, at u = 1. */
function hermite(from: number, speed: number, to: number, u: number): number {
  const cube = u * u * u;
  const square = u * u;
  return (
    (2 * cube - 3 * square + 1) * from +
    (cube - 2 * square + u) * speed +
    (3 * square - 2 * cube) * to
  );
}

/** Mechanism time `from` (s) at `anchor` (ms): the free swing. */
interface Free {
  kind: "free";
  anchor: number;
  from: number;
}
/** A settle was asked for: the free swing goes on to `extreme` (s). */
interface Waiting {
  kind: "waiting";
  anchor: number;
  from: number;
  extreme: number;
}
interface Settling {
  kind: "settling";
  /** ms. */
  start: number;
  extreme: number;
  /** The angle at the extreme. */
  from: number;
}
interface Rest {
  kind: "rest";
  extreme: number;
}
/** From where the balance is, on to the opposite extreme. */
interface Resuming {
  kind: "resuming";
  start: number;
  extreme: number;
  from: number;
  /** Degrees per second. */
  speed: number;
  /** Settle again from the opposite extreme. */
  settleAfter: boolean;
}
type Mode = Free | Waiting | Settling | Rest | Resuming;

export class BalanceClock {
  readonly amplitude: number;
  readonly period: number;
  /** D: how long a settle or a resume takes. */
  readonly settleSeconds: number;
  mode: Mode;

  constructor(timing: Timing, now: number) {
    this.amplitude = timing.amplitude;
    this.period = timing.period;
    this.settleSeconds = Math.sqrt(6) / ((2 * Math.PI) / timing.period);
    this.mode = { kind: "free", anchor: now, from: 0 };
  }

  swingAt(time: number): number {
    return this.amplitude * Math.cos((2 * Math.PI * time) / this.period);
  }

  /** Move the mode on to `now`: a wait that reached its extreme, a settle or a
   *  resume that ended. The boundary times are exact, so a late frame lands on
   *  the right curve and never beyond it. */
  private advance(now: number): void {
    const milliseconds = this.settleSeconds * 1000;
    if (this.mode.kind === "waiting") {
      const { anchor, from, extreme } = this.mode;
      const reached = anchor + (extreme - from) * 1000;
      if (now >= reached) {
        this.mode = {
          kind: "settling",
          start: reached,
          extreme,
          from: this.swingAt(extreme),
        };
      }
    }
    if (
      this.mode.kind === "settling" &&
      now >= this.mode.start + milliseconds
    ) {
      this.mode = { kind: "rest", extreme: this.mode.extreme };
    }
    if (
      this.mode.kind === "resuming" &&
      now >= this.mode.start + milliseconds
    ) {
      const { start, extreme, settleAfter } = this.mode;
      const opposite = extreme + this.period / 2;
      this.mode = settleAfter
        ? {
            kind: "settling",
            start: start + milliseconds,
            extreme: opposite,
            from: this.swingAt(opposite),
          }
        : { kind: "free", anchor: start + milliseconds, from: opposite };
      this.advance(now);
    }
  }

  /** The mechanism's time, which drives the train. */
  time(now: number): number {
    this.advance(now);
    const mode = this.mode;
    if (mode.kind === "free" || mode.kind === "waiting") {
      return mode.from + (now - mode.anchor) / 1000;
    }
    const ratio = Math.min(
      1,
      Math.max(-1, this.angle(now) / this.swingAt(mode.extreme)),
    );
    return mode.extreme + (Math.acos(ratio) * this.period) / (2 * Math.PI);
  }

  /** The balance's angle (degrees). */
  angle(now: number): number {
    this.advance(now);
    const mode = this.mode;
    const fraction = (start: number): number =>
      Math.min(1, (now - start) / (this.settleSeconds * 1000));
    switch (mode.kind) {
      case "free":
      case "waiting":
        return this.swingAt(this.time(now));
      case "settling":
        return mode.from * (1 - smoothstep(fraction(mode.start)));
      case "rest":
        return 0;
      case "resuming":
        return hermite(
          mode.from,
          mode.speed * this.settleSeconds,
          this.swingAt(mode.extreme + this.period / 2),
          fraction(mode.start),
        );
    }
  }

  /** Degrees per second, while settling (the only mode that moves and that a
   *  resume can start in). */
  private settlingSpeed(now: number): number {
    if (this.mode.kind !== "settling") return 0;
    const u = Math.min(
      1,
      (now - this.mode.start) / (this.settleSeconds * 1000),
    );
    return (-this.mode.from * 6 * u * (1 - u)) / this.settleSeconds;
  }

  /** Wait for the next extreme (they come every half period), then settle. */
  settle(now: number): void {
    this.advance(now);
    const mode = this.mode;
    if (mode.kind === "free") {
      const half = this.period / 2;
      const extreme = Math.ceil(this.time(now) / half) * half;
      this.mode = {
        kind: "waiting",
        anchor: mode.anchor,
        from: mode.from,
        extreme,
      };
    } else if (mode.kind === "resuming") {
      mode.settleAfter = true; // going to the opposite extreme: settle from there
    }
  }

  resume(now: number): void {
    this.advance(now);
    const mode = this.mode;
    if (mode.kind === "waiting") {
      this.mode = { kind: "free", anchor: mode.anchor, from: mode.from };
    } else if (mode.kind === "settling" || mode.kind === "rest") {
      this.mode = {
        kind: "resuming",
        start: now,
        extreme: mode.extreme,
        from: this.angle(now),
        speed: this.settlingSpeed(now),
        settleAfter: false,
      };
    } else if (mode.kind === "resuming") {
      mode.settleAfter = false;
    }
  }

  /** How long (ms) from `now` until the balance is at rest: 0 at rest, and
   *  `null` if it is not going to rest. */
  untilRest(now: number): number | null {
    this.advance(now);
    const milliseconds = this.settleSeconds * 1000;
    const mode = this.mode;
    const restAt = (start: number): number =>
      Math.max(0, start + milliseconds - now);
    switch (mode.kind) {
      case "free":
        return null;
      case "waiting":
        return restAt(mode.anchor + (mode.extreme - mode.from) * 1000);
      case "settling":
        return restAt(mode.start);
      case "rest":
        return 0;
      case "resuming":
        // on to the opposite extreme, then a settle from there
        return mode.settleAfter ? restAt(mode.start + milliseconds) : null;
    }
  }

  /** At once: for a slide reached directly, and for stills. */
  place(settled: boolean, now: number): void {
    this.mode = settled
      ? { kind: "rest", extreme: 0 }
      : { kind: "free", anchor: now, from: 0 };
  }
}

/** The mechanism's time and the balance's angle in a still, `seconds` after the
 *  slide was reached. Both come from one clock, as in the live watch, so a
 *  settled still shows the pose that the live watch settles into. */
export function stillPose(
  timing: Timing,
  settled: boolean,
  seconds: number,
): { time: number; swing: number } {
  const clock = new BalanceClock(timing, 0);
  clock.place(settled, 0);
  return {
    time: clock.time(seconds * 1000),
    swing: clock.angle(seconds * 1000),
  };
}

// ---- the train's clock: the free spin -----------------------------------------------------------
// The train's position, in beats (`Motion.beats`). Normally it follows the
// mechanism, a whole number of teeth ahead: `lead` is an even number of beats
// (a tooth of the escape wheel is two beats), so the pallet stones meet the
// teeth as they did, and every wheel stays in mesh. During a free spin it
// turns on its own, at a speed in beats a second, while only the escape wheel
// shows (docs/watch.md, "The free spin"):
//   - a spin starts when the rest of the escapement has faded out (the
//     fade's FADE_SECONDS), and speeds up in SPIN_UP_SECONDS;
//   - a stop keeps it spinning until the rest has faded back in, and then
//     until the next tooth reaches the pallet: the lead reaches the next even
//     number of beats. From then on it follows the mechanism again.
// It only goes forward. Times: `now` in ms; speeds in beats a second.

/** s: from still to the full speed of a spin. */
export const SPIN_UP_SECONDS = 0.6;

/** How far a spin has gone `seconds` after it started: its speed rises from 0
 *  to `speed` as a smoothstep in SPIN_UP_SECONDS, then holds. */
export function spinDistance(speed: number, seconds: number): number {
  if (seconds <= 0) return 0;
  if (seconds >= SPIN_UP_SECONDS) {
    return speed * (seconds - SPIN_UP_SECONDS / 2);
  }
  const u = seconds / SPIN_UP_SECONDS;
  return speed * SPIN_UP_SECONDS * (u * u * u - (u * u * u * u) / 2);
}

interface Locked {
  kind: "locked";
  /** Even: whole teeth ahead of the mechanism. */
  lead: number;
}
interface Spinning {
  kind: "spinning";
  /** ms: when it starts to move. */
  start: number;
  speed: number;
  lead: number;
  /** The position where it started; set at the first frame after `start`. */
  from: number | null;
}
interface Stopping {
  kind: "stopping";
  spin: Spinning;
  /** ms: when the pallet is back, and can stop a tooth. */
  blocked: number;
  /** The lead at which it stops: the next tooth after `blocked`. */
  target: number | null;
}
type TrainMode = Locked | Spinning | Stopping;

export class TrainClock {
  mode: TrainMode = { kind: "locked", lead: 0 };

  /** Spin at `speed`, or follow the mechanism (`null`). `instantly`: a slide
   *  reached directly, already at speed or locked. */
  show(speed: number | null, now: number, instantly: boolean): void {
    const mode = this.mode;
    if (instantly) {
      this.mode =
        speed === null
          ? { kind: "locked", lead: 0 }
          : {
              kind: "spinning",
              start: now - SPIN_UP_SECONDS * 1000,
              speed,
              lead: 0,
              from: null,
            };
    } else if (speed !== null) {
      if (mode.kind === "locked") {
        this.mode = {
          kind: "spinning",
          start: now + FADE_SECONDS * 1000,
          speed,
          lead: mode.lead,
          from: null,
        };
      } else if (mode.kind === "stopping") {
        this.mode = mode.spin; // it had not stopped yet: it spins on
      }
    } else if (mode.kind === "spinning") {
      this.mode =
        now < mode.start
          ? { kind: "locked", lead: mode.lead } // it had not moved yet
          : {
              kind: "stopping",
              spin: mode,
              blocked: now + FADE_SECONDS * 1000,
              target: null,
            };
    }
  }

  /** The train's position at `now`, when the mechanism's position is
   *  `beats`. Call it with `now` that only goes forward. */
  position(now: number, beats: number): number {
    const mode = this.mode;
    switch (mode.kind) {
      case "locked":
        return beats + mode.lead;
      case "spinning":
        return this.spun(mode, now, beats);
      case "stopping": {
        const spun = this.spun(mode.spin, now, beats);
        if (now < mode.blocked) return spun;
        const lead = spun - beats;
        mode.target ??= 2 * Math.floor(lead / 2) + 2;
        if (lead < mode.target) return spun;
        this.mode = { kind: "locked", lead: mode.target };
        return beats + mode.target;
      }
    }
  }

  private spun(spin: Spinning, now: number, beats: number): number {
    if (now < spin.start) return beats + spin.lead;
    spin.from ??= beats + spin.lead;
    return spin.from + spinDistance(spin.speed, (now - spin.start) / 1000);
  }
}

// ---- the watch's model for the stage ----------------------------------------------------------
/** What a slide asks of the watch's motion. */
export interface WatchModelState {
  /** The balance stops at rest. */
  settled: boolean;
  /** Degrees a second: the escape wheel spins freely; `null`: it does not. */
  spin: number | null;
}

export class WatchModel implements Model<WatchModelState> {
  private readonly watch: Watch;
  private readonly motion: Motion;
  private readonly clock: BalanceClock;
  private readonly train = new TrainClock();

  constructor(watch: Watch, now = performance.now()) {
    this.watch = watch;
    this.motion = new Motion(watch);
    this.clock = new BalanceClock(watch.design.timing, now);
  }

  show(state: WatchModelState, now: number, instantly: boolean): void {
    if (instantly) this.clock.place(state.settled, now);
    else if (state.settled) this.clock.settle(now);
    else this.clock.resume(now);
    this.train.show(
      state.spin === null ? null : spinBeats(this.watch, state.spin),
      now,
      instantly,
    );
  }

  frame(now: number, renderer: Renderer): Map<Group, Float32Array> {
    const swing = this.clock.angle(now);
    const time = this.clock.time(now);
    renderer.updateMesh(this.watch.spring, this.motion.springGeometry(swing));
    const beats = this.train.position(now, this.motion.beats(time));
    return this.motion.matrices(time, swing, beats);
  }

  /** How long (ms) from `now` until the balance is at rest: 0 at rest, and
   *  `null` if it is not going to rest. */
  untilRest(now: number): number | null {
    return this.clock.untilRest(now);
  }

  /** The jewel's strikes on the fork from `from` to `now` (ms), and the
   *  mechanism's time at `now`, to pass as `from` next time. The strikes are
   *  in order, each with the moment it happened (ms), found from the
   *  mechanism's time at `from` and at `now`. None if `from` is `undefined`,
   *  or if the mechanism's time went back (a jump to a slide). Call it with
   *  `now` that only goes forward. */
  strikes(
    from: { now: number; time: number } | undefined,
    now: number,
  ): { strikes: { at: number; window: number }[]; time: number } {
    const time = this.clock.time(now);
    if (!from || !(time > from.time)) return { strikes: [], time };
    const strikes = strikesBetween(
      this.watch.design.timing,
      from.time,
      time,
    ).map(({ time: strikeTime, window }) => ({
      at:
        from.now +
        ((strikeTime - from.time) / (time - from.time)) * (now - from.now),
      window,
    }));
    return { strikes, time };
  }

  phase(now: number): string {
    this.clock.time(now); // moves the mode on
    if (this.train.mode.kind !== "locked") {
      return `train ${this.train.mode.kind}`;
    }
    return this.clock.mode.kind === "free"
      ? "idle"
      : `balance ${this.clock.mode.kind}`;
  }
}

/** A spin of the escape wheel, `degrees` a second, in beats a second. It must
 *  be faster than the mechanism's, or the next tooth would never catch up
 *  with the pallet: the mechanism makes a beat each half period. */
export function spinBeats(watch: Watch, degrees: number): number {
  const escape = at(watch.design.wheels, watch.design.wheels.length - 1);
  const beats = degrees / Math.abs(escape.step);
  const mechanism = 2 / watch.design.timing.period;
  check(
    beats > mechanism,
    `a spin of ${String(degrees)} deg/s is not faster than the mechanism's ${String(mechanism * Math.abs(escape.step))}`,
  );
  return beats;
}

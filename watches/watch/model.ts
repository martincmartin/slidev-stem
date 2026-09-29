// The watch's motion: the keyframes of the mechanism, the balance's swing and
// the hairspring. The spring's formula exists once, here.

import { at } from "../webgl/checked.ts";
import { ribbonGeometry, smoothRing } from "../webgl/mesh.ts";
import type { Point2 } from "../webgl/mesh.ts";
import type { MeshGeometry, Renderer } from "../webgl/renderer.ts";
import type { Model } from "../webgl/stage.ts";
import type { Group } from "../webgl/scene.ts";
import type { Timing, Wheel } from "./design.ts";
import type { Watch, WatchGroups } from "./generate.ts";
import { polar, radians } from "./shapes.ts";

/** The hairspring: an Archimedean spiral from `radii[0]` at angle
 *  `outerAngle - 360 turns + swing` to `radii[1]` at `outerAngle`. */
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

/** The spring's points about the balance's arbor, at the balance's angle
 *  `swing` (degrees). */
export function springPoints(spring: Spring, swing: number): Point2[] {
  const [innerRadius, outerRadius] = spring.radii;
  const innerAngle = spring.outerAngle - 360 * spring.turns + swing;
  return Array.from({ length: SPRING_POINTS }, (_, index) => {
    const fraction = index / (SPRING_POINTS - 1);
    return polar(
      innerRadius + fraction * (outerRadius - innerRadius),
      innerAngle + fraction * (spring.outerAngle - innerAngle),
    );
  });
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

/** A part that turns `step` degrees at each beat and holds still between
 *  beats, over `duration` seconds. */
export function stepper(
  timing: Timing,
  duration: number,
  step: number,
  accumulate: boolean,
): Keyframes {
  const periods = duration / timing.period;
  const keyTimes = [0];
  const values = [0];
  let angle = 0;
  for (let period = 0; period < Math.round(periods); period++) {
    for (const [start, end] of tickWindows(timing)) {
      keyTimes.push((period + start) / periods, (period + end) / periods);
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

/** The watch's motion at a mechanism time. */
export class Motion {
  private readonly watch: Watch;
  private readonly turning = new Map<Group, Keyframes>();

  constructor(watch: Watch) {
    this.watch = watch;
    const { design, groups } = watch;
    const { timing } = design;
    const [barrel, centre, third, fourth, escape] = design.wheels as [
      Wheel,
      Wheel,
      Wheel,
      Wheel,
      Wheel,
    ];
    for (const wheel of [barrel, centre, third, escape]) {
      this.turning.set(
        wheelGroup(groups, wheel),
        stepper(timing, timing.period, wheel.step, true),
      );
    }
    // the fourth wheel and the seconds hand turn once a minute
    const minute = stepper(timing, timing.fourthLoop, fourth.step, false);
    this.turning.set(wheelGroup(groups, fourth), minute);
    this.turning.set(groups.seconds, minute);
    this.turning.set(groups.fork, forkFlips(timing));
    this.turning.set(
      groups.hour,
      stepper(timing, timing.period, centre.step / timing.hourRatio, true),
    );
    this.turning.set(
      groups.minute,
      stepper(timing, timing.period, centre.step, true),
    );
  }

  /** The world matrix of every group at mechanism time `time`, with the
   *  balance at `swing` degrees. */
  matrices(time: number, swing: number): Map<Group, Float32Array> {
    const { design, groups } = this.watch;
    const [centreX, centreY] = design.watchCentre;
    const result = new Map<Group, Float32Array>();
    result.set(groups.root, turnAt(centreX, centreY, 0));
    const place = (group: Group, arbor: Point2, angle: number): void => {
      result.set(group, turnAt(centreX + arbor[0], centreY + arbor[1], angle));
    };
    for (const wheel of design.wheels) {
      const group = wheelGroup(groups, wheel);
      place(group, wheel.arbor, this.angleOf(group, time));
    }
    place(groups.balance, design.balance.arbor, swing);
    place(groups.springBase, design.balance.arbor, 0);
    place(groups.fork, design.fork.pivot, this.angleOf(groups.fork, time));
    const [, centre, , fourth] = design.wheels as [Wheel, Wheel, Wheel, Wheel];
    place(groups.seconds, fourth.arbor, this.angleOf(groups.seconds, time));
    place(groups.hour, centre.arbor, this.angleOf(groups.hour, time));
    place(groups.minute, centre.arbor, this.angleOf(groups.minute, time));
    return result;
  }

  private angleOf(group: Group, time: number): number {
    const keyframes = this.turning.get(group);
    if (!keyframes) throw new Error(`${group.name} has no keyframes`);
    return angleAt(keyframes, time);
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

  /** At once: for a slide reached directly, and for stills. */
  place(settled: boolean, now: number): void {
    this.mode = settled
      ? { kind: "rest", extreme: 0 }
      : { kind: "free", anchor: now, from: 0 };
  }
}

// ---- the watch's model for the stage ----------------------------------------------------------
/** What a slide asks of the watch's motion. */
export interface WatchModelState {
  /** The balance stops at rest. */
  settled: boolean;
}

export class WatchModel implements Model<WatchModelState> {
  private readonly watch: Watch;
  private readonly motion: Motion;
  private readonly clock: BalanceClock;

  constructor(watch: Watch, now = performance.now()) {
    this.watch = watch;
    this.motion = new Motion(watch);
    this.clock = new BalanceClock(watch.design.timing, now);
  }

  show(state: WatchModelState, now: number, instantly: boolean): void {
    if (instantly) this.clock.place(state.settled, now);
    else if (state.settled) this.clock.settle(now);
    else this.clock.resume(now);
  }

  frame(now: number, renderer: Renderer): Map<Group, Float32Array> {
    const swing = this.clock.angle(now);
    renderer.updateMesh(this.watch.spring, this.motion.springGeometry(swing));
    return this.motion.matrices(this.clock.time(now), swing);
  }

  phase(now: number): string {
    this.clock.time(now); // moves the mode on
    return this.clock.mode.kind === "free"
      ? "idle"
      : `balance ${this.clock.mode.kind}`;
  }
}

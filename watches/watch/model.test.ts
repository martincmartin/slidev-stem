// The balance's settle and resume, sampled: the numbers of section 10.1 of
// the planning task (ported from its settle_check.mjs). The balance's angle is
// sampled every STEP ms; a jump at one instant falls across two steps, so
// about half of it shows. The free swing is the control: its numbers are
// what "no jump" looks like at this step.

import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import { DESIGN } from "./design.ts";
import { generate } from "./generate.ts";
import {
  balanceAngle,
  BalanceClock,
  mechanismAt,
  SHUTTER_LIMIT_MS,
  shutterInstant,
  stillPose,
  strikesBetween,
  tickWindows,
  WatchModel,
} from "./model.ts";

const TIMING = DESIGN.timing;
const STEP = 0.1; // ms
const WINDOW = 20; // ms each side of a point of interest

interface Jumps {
  /** Degrees per step. */
  angle: number;
  /** Degrees per second, per step. */
  speed: number;
  /** Degrees per second squared, per step. */
  acceleration: number;
}

function largestChange(values: number[]): number {
  return Math.max(
    ...values
      .slice(1)
      .map((value, index) => Math.abs(value - at(values, index))),
  );
}

function jumps(angles: number[]): Jumps {
  const seconds = STEP / 1000;
  const speeds = angles
    .slice(1)
    .map((angle, index) => (angle - at(angles, index)) / seconds);
  const accelerations = speeds
    .slice(1)
    .map((speed, index) => (speed - at(speeds, index)) / seconds);
  return {
    angle: largestChange(angles),
    speed: largestChange(speeds),
    acceleration: largestChange(accelerations),
  };
}

/** The mechanism time never goes back: the largest step back, over a run. */
let stepBack = 0;

/** Angles from `from` to `to` ms; `action` is called once, at the first step
 *  at or after `at` (time only goes forward, as in a browser). */
function sample(
  clock: BalanceClock,
  from: number,
  to: number,
  actionAt = Infinity,
  action: (now: number) => void = () => undefined,
): number[] {
  const angles: number[] = [];
  let done = false;
  let last = -Infinity;
  for (let now = from; now <= to; now += STEP) {
    if (!done && now >= actionAt) {
      action(now);
      done = true;
    }
    angles.push(clock.angle(now));
    const time = clock.time(now);
    stepBack = Math.max(stepBack, last - time);
    last = time;
  }
  return angles;
}

const SETTLE_MS = new BalanceClock(TIMING, 0).settleSeconds * 1000;

function settled(requestAt: number, from: number, to: number) {
  const clock = new BalanceClock(TIMING, 0);
  clock.angle(requestAt);
  clock.settle(requestAt);
  return { mode: clock.mode, angles: sample(clock, from, to) };
}

const control = jumps(sample(new BalanceClock(TIMING, 0), 0, 4000));

test("the free swing is the control: speed jumps 0.15 deg/s a step, acceleration 0", () => {
  assert.ok(control.speed < 0.2, `speed ${String(control.speed)}`);
  assert.ok(
    control.acceleration < 1,
    `acceleration ${String(control.acceleration)}`,
  );
});

test("a settle starts at the next extreme, with no acceleration jump there", () => {
  for (const requestAt of [0, 250, 500, 999.9, 1000, 1000.1, 1740]) {
    const whole = settled(requestAt, requestAt, requestAt + 3000);
    // the wait ends at the next extreme (they come every 1000 ms)
    const clock = new BalanceClock(TIMING, 0);
    clock.settle(requestAt);
    const extremeAt = Math.ceil(requestAt / 1000) * 1000;
    const before = clock.angle(extremeAt - 1);
    const after = clock.angle(extremeAt + 1);
    assert.ok(
      Math.abs(Math.abs(before) - TIMING.amplitude) < 1e-3,
      `at ${String(requestAt)}`,
    );
    // no jump in angle across the extreme: 2 ms of the curve
    assert.ok(
      Math.abs(after - before) < 0.01,
      `${String(before)} to ${String(after)}`,
    );
    const window = jumps(
      settled(
        requestAt,
        Math.max(requestAt, extremeAt - WINDOW),
        extremeAt + WINDOW,
      ).angles,
    );
    assert.ok(
      window.speed < 0.2,
      `speed ${String(window.speed)} after a request at ${String(requestAt)}`,
    );
    assert.ok(
      window.acceleration < 1,
      `acceleration ${String(window.acceleration)} after a request at ${String(requestAt)}`,
    );
    assert.ok(jumps(whole.angles).angle < 0.2);
    // it is at rest before the run ends
    assert.equal(at(whole.angles, whole.angles.length - 1), 0);
  }
});

test("a settle stops in 0.78 s with no jump in speed; acceleration drops 1500 deg/s2 there", () => {
  const stopAt = 1000 + SETTLE_MS;
  const window = jumps(settled(0, stopAt - WINDOW, stopAt + WINDOW).angles);
  assert.ok(window.speed < 0.2, `speed ${String(window.speed)}`);
  assert.ok(
    window.acceleration < 1000,
    `acceleration ${String(window.acceleration)}`,
  );
  assert.ok(Math.abs(SETTLE_MS - 780) < 1, `D = ${String(SETTLE_MS)} ms`);
});

test("a resume from rest starts as the settle mirrored and joins the free swing with no jump", () => {
  const start = 3000;
  const around = (at_: number): Jumps => {
    const clock = new BalanceClock(TIMING, 0);
    clock.settle(0);
    return jumps(
      sample(clock, at_ - WINDOW, at_ + WINDOW, start, (now) => {
        clock.resume(now);
      }),
    );
  };
  const atStart = around(start);
  assert.ok(atStart.speed < 0.2, `speed at the start ${String(atStart.speed)}`);
  assert.ok(
    atStart.acceleration < 1000,
    `acceleration at the start ${String(atStart.acceleration)}`,
  );
  const atJoin = around(start + SETTLE_MS);
  assert.ok(atJoin.speed < 0.2, `speed at the join ${String(atJoin.speed)}`);
  assert.ok(
    atJoin.acceleration < 1,
    `acceleration at the join ${String(atJoin.acceleration)}`,
  );
});

test("a resume during a settle has no jump in angle or speed", () => {
  const clock = new BalanceClock(TIMING, 0);
  clock.settle(100);
  const angles = sample(clock, 1250, 1300 + SETTLE_MS + 2000, 1300, (now) => {
    clock.resume(now);
  });
  const result = jumps(angles);
  assert.ok(result.angle < 0.2);
  assert.ok(result.speed < 0.25, `speed ${String(result.speed)}`);
  assert.ok(
    result.acceleration < 500,
    `acceleration ${String(result.acceleration)}`,
  );
});

test("the mechanism's time never goes back", () => {
  assert.equal(stepBack, 0);
});

test("a settled still has the mechanism time and the angle of the settled live clock", () => {
  const live = new BalanceClock(TIMING, 0);
  live.place(true, 0);
  const pose = stillPose(TIMING, true, 0.37);
  assert.equal(pose.swing, 0);
  assert.equal(pose.time, live.time(5000));
  // the fork is where the live watch has it: at the quarter period, not at 0
  assert.equal(pose.time, TIMING.period / 4);
});

test("a free still is on the swing curve at its time", () => {
  const pose = stillPose(TIMING, false, 0.37);
  assert.equal(pose.time, 0.37);
  assert.equal(pose.swing, new BalanceClock(TIMING, 0).swingAt(0.37));
});

test("untilRest is when a settle reaches rest, and null for a free swing", () => {
  const free = new BalanceClock(TIMING, 0);
  assert.equal(free.untilRest(300), null);
  for (const requestAt of [0, 250, 999.9, 1740]) {
    const clock = new BalanceClock(TIMING, 0);
    clock.settle(requestAt);
    const restAt = requestAt + (clock.untilRest(requestAt) ?? NaN);
    assert.equal(restAt, Math.ceil(requestAt / 1000) * 1000 + SETTLE_MS);
    assert.ok(Math.abs(clock.angle(restAt - 50)) > 0.1);
    assert.equal(clock.untilRest(restAt), 0);
    assert.equal(clock.angle(restAt + 1), 0);
  }
  // a settle asked for during a resume: on to the opposite extreme, then rest
  const clock = new BalanceClock(TIMING, 0);
  clock.place(true, 0);
  clock.resume(100);
  clock.settle(200);
  assert.equal(clock.untilRest(200), 100 + 2 * SETTLE_MS - 200);
  clock.resume(300);
  assert.equal(clock.untilRest(300), null);
});

test("a strike is the start of each tick window, after `from` and up to `to`", () => {
  const [[first], [second]] = tickWindows(TIMING);
  const starts = [first * TIMING.period, second * TIMING.period];
  const period = TIMING.period;
  assert.deepEqual(strikesBetween(TIMING, 0, period), [
    { time: at(starts, 0), window: 0 },
    { time: at(starts, 1), window: 1 },
  ]);
  // `from` is left out, `to` is in: a strike on a frame's edge counts once
  assert.deepEqual(strikesBetween(TIMING, at(starts, 0), at(starts, 1)), [
    { time: at(starts, 1), window: 1 },
  ]);
  assert.deepEqual(strikesBetween(TIMING, 3 * period, 3 * period + 0.4), []);
  assert.deepEqual(
    strikesBetween(TIMING, 5 * period + 1, 6 * period + 0.5).map(
      (strike) => strike.window,
    ),
    [1, 0],
  );
  assert.deepEqual(strikesBetween(TIMING, 2, 1), []);
});

test("the model gives each strike the moment it happened, between two frames", () => {
  const model = new WatchModel(generate(), 0);
  const [[first]] = tickWindows(TIMING);
  const strikeMs = first * TIMING.period * 1000;
  const start = model.strikes(undefined, 0);
  assert.deepEqual(start.strikes, []);
  const before = model.strikes({ now: 0, time: start.time }, strikeMs - 10);
  assert.deepEqual(before.strikes, []);
  const after = model.strikes(
    { now: strikeMs - 10, time: before.time },
    strikeMs + 6,
  );
  assert.equal(after.strikes.length, 1);
  assert.equal(at(after.strikes, 0).window, 0);
  assert.ok(Math.abs(at(after.strikes, 0).at - strikeMs) < 1e-6);
  // a jump puts the mechanism's time back: no strikes
  model.show({ settled: false, spin: null, mainspring: null }, 2000, true);
  assert.deepEqual(model.strikes({ now: 1990, time: 1.99 }, 2010).strikes, []);
});

test("a time-lapse moves the mechanism on: the balance stays in step with the train, and whole periods leave it where its clock has it", () => {
  const clock = new BalanceClock(TIMING, 0);
  clock.settle(0);
  const settling = 1500;
  // whole periods: as the clock has it, settling too
  const whole = mechanismAt(clock, settling, 21_600);
  assert.equal(whole.swing, clock.angle(settling));
  assert.equal(whole.time, clock.time(settling) + 21_600 * (TIMING.period / 2));
  // between: on the free swing, at the mechanism's time
  const free = new BalanceClock(TIMING, 0);
  const between = mechanismAt(free, 400, 1234.5);
  assert.equal(between.time, free.time(400) + 1234.5 * (TIMING.period / 2));
  assert.equal(between.swing, balanceAngle(TIMING, between.time));
});

test("at the time-lapse's full speed, the shutter shows the balance across its swing, not at its own pace", () => {
  const clock = new BalanceClock(TIMING, 0);
  const frameMs = 1000 / 60;
  // 3,600 beats a second: 30 swings a frame
  const lapseAt = (now: number): number => (3600 * now) / 1000;
  const swings = (shutter: number): number[] =>
    Array.from({ length: 60 }, (_, frame) => {
      const now = 1000 + frame * frameMs;
      const instant = shutterInstant(now, shutter, frame);
      return mechanismAt(clock, now, lapseAt(instant)).swing;
    });
  // the mean change from one frame to the next (degrees)
  const step = (values: number[]): number =>
    values
      .slice(1)
      .reduce(
        (sum, value, index) => sum + Math.abs(value - at(values, index)),
        0,
      ) /
    (values.length - 1);
  // one instant a frame: the lapse's 30 whole swings a frame do not show, so
  // the balance seems to swing at its own slow pace
  assert.ok(step(swings(0)) < 10);
  // the shutter: from anywhere on the swing to anywhere, at each frame
  assert.ok(step(swings(frameMs)) > 60);
  assert.ok(frameMs < SHUTTER_LIMIT_MS);
  // in the shutter, before `now`
  for (let frame = 0; frame < 100; frame++) {
    const instant = shutterInstant(1000, frameMs, frame);
    assert.ok(instant <= 1000 && instant > 1000 - frameMs);
  }
});

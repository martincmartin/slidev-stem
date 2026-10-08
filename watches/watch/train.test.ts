// The train's clock (model.ts, TrainClock): the train's free spin (the
// escape wheel's on the Escapement slide, the gears' on the Gears slide), and
// the stop that brings it back into step with the mechanism.

import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import { FADE_SECONDS, Timeline } from "../webgl/timeline.ts";
import type { Wheel } from "./design.ts";
import { slideFrontmatter } from "./deck.ts";
import { generate } from "./generate.ts";
import {
  angleAt,
  BalanceClock,
  Motion,
  SPIN_UP_SECONDS,
  spinBeats,
  stepper,
  TrainClock,
} from "./model.ts";
import { moveWithBefore, stageState, watchState } from "./state.ts";
import type { WatchState } from "./state.ts";

const watch = generate();
const { design, groups } = watch;
const ESCAPEMENT_SLIDE = await slideFrontmatter("Escapement");
const GEARS_SLIDE = await slideFrontmatter("Gears");
/** A slide's stage state at a click. */
function stageAt(frontmatter: Record<string, unknown>, clicks: number) {
  return stageState(
    watch,
    watchState(frontmatter, clicks) ?? assert.fail("no watch"),
    moveWithBefore(frontmatter),
  );
}
/** The Escapement slide's stage state at a click. */
function escapementAt(clicks: number) {
  return stageAt(ESCAPEMENT_SLIDE, clicks);
}
/** The first click at which the Escapement slide spins the train. */
const ESCAPEMENT_SPIN = (() => {
  for (let click = 0; click <= Number(ESCAPEMENT_SLIDE["clicks"]); click++) {
    if (watchState(ESCAPEMENT_SLIDE, click)?.spin) return click;
  }
  return assert.fail("the Escapement slide does not spin");
})();
const motion = new Motion(watch);
const TIMING = design.timing;
const [, , , fourth, escape] = design.wheels as [
  Wheel,
  Wheel,
  Wheel,
  Wheel,
  Wheel,
];
/** Beats a second: 90 degrees a second of the escape wheel. */
const SPEED = spinBeats(watch, 90);
const FRAME = 1000 / 60; // ms

/** The mechanism's position (beats) at `now` (ms), as the live model has it. */
function mechanism(): (now: number) => number {
  const clock = new BalanceClock(TIMING, 0);
  return (now) => motion.beats(clock.time(now));
}

/** A group's angle (degrees) from its matrix. */
function angleOf(matrix: Float32Array | undefined): number {
  assert.ok(matrix);
  return (Math.atan2(at(matrix, 1), at(matrix, 0)) * 180) / Math.PI;
}

/** The difference of two angles, in (-180, 180]. */
function turn(first: number, second: number): number {
  return ((((first - second) % 360) + 540) % 360) - 180;
}

/** Positions every frame from `start` to `end` (ms). */
function run(
  train: TrainClock,
  beats: (now: number) => number,
  start: number,
  end: number,
): number[] {
  const positions: number[] = [];
  for (let now = start; now <= end; now += FRAME) {
    positions.push(train.position(now, beats(now)));
  }
  return positions;
}

function nondecreasing(positions: number[]): boolean {
  return positions.every(
    (position, index) => index === 0 || position >= at(positions, index - 1),
  );
}

test("the train turns as the mechanism's steppers did: each wheel its step a beat", () => {
  const steppers = new Map([
    [escape, stepper(TIMING, TIMING.period, escape.step, true)],
    [fourth, stepper(TIMING, TIMING.fourthLoop, fourth.step, false)],
  ]);
  for (const time of [0, 0.3, 0.47, 0.51, 0.55, 1.2, 7.77, 61.5]) {
    const matrices = motion.matrices(time, 0);
    for (const [wheel, keyframes] of steppers) {
      const group = groups.wheels.get(wheel);
      assert.ok(group);
      const angle = angleOf(matrices.get(group));
      assert.ok(
        Math.abs(turn(angle, angleAt(keyframes, time))) < 1e-3,
        `${wheel.name} at ${String(time)} s`,
      );
    }
  }
});

test("a spin starts when the rest has faded out, and speeds up smoothly to its speed", () => {
  const beats = mechanism();
  const train = new TrainClock();
  train.show(null, 0, true);
  train.show(SPEED, 1000, false);
  const fadeEnd = 1000 + FADE_SECONDS * 1000;
  // while the rest fades, the train follows the mechanism
  for (let now = 1000; now < fadeEnd; now += FRAME) {
    assert.equal(train.position(now, beats(now)), beats(now));
  }
  const atSpeed = fadeEnd + SPIN_UP_SECONDS * 1000;
  const before = train.position(atSpeed + 500, beats(atSpeed + 500));
  const after = train.position(atSpeed + 1500, beats(atSpeed + 1500));
  assert.ok(Math.abs(after - before - SPEED) < 1e-9);
});

test("on the Escapement slide, the fade to the spinning wheel takes FADE_SECONDS, as the spin assumes", () => {
  const spinAt = ESCAPEMENT_SPIN;
  const timeline = new Timeline();
  timeline.show(escapementAt(spinAt - 1), 0, true);
  timeline.show(escapementAt(spinAt), 1000, false);
  assert.equal(timeline.phaseAt(1000), "fade");
  assert.equal(timeline.phaseAt(1000 + FADE_SECONDS * 1000 - 1), "fade");
  assert.equal(timeline.phaseAt(1000 + FADE_SECONDS * 1000), null);
});

test("a stop spins on until the rest is back, then stops at the next tooth, in step with the mechanism", () => {
  const beats = mechanism();
  const train = new TrainClock();
  train.show(null, 0, true);
  train.show(SPEED, 1000, false);
  run(train, beats, 0, 5000);
  train.show(null, 5000, false);
  const blocked = 5000 + FADE_SECONDS * 1000;
  const positions = run(train, beats, 5000, 20_000);
  assert.ok(nondecreasing(positions));
  assert.equal(train.mode.kind, "locked");
  const lead = train.mode.lead;
  assert.equal(lead % 2, 0); // whole teeth: two beats a tooth
  // it spun on at full speed until the rest was back, then stopped
  const stoppedAt = positions.findIndex(
    (position, index) =>
      index > 0 &&
      position - at(positions, index - 1) < (SPEED * 0.5 * FRAME) / 1000,
  );
  const stopTime = 5000 + stoppedAt * FRAME;
  assert.ok(stopTime >= blocked);
  // within the time for a tooth and a tick after the pallet is back
  assert.ok(stopTime <= blocked + (2 / SPEED + 1) * 1000);
  // and from then on it follows the mechanism, `lead` beats ahead
  for (const now of [21_000, 21_500, 23_250]) {
    assert.equal(train.position(now, beats(now)), beats(now) + lead);
  }
});

test("a stop before the spin has started leaves the train where it was", () => {
  const beats = mechanism();
  const train = new TrainClock();
  train.show(null, 0, true);
  train.show(SPEED, 1000, false);
  train.show(null, 1300, false); // a fast click back, while the rest fades
  for (let now = 1000; now < 10_000; now += FRAME) {
    assert.equal(train.position(now, beats(now)), beats(now));
  }
});

test("fast clicks back and forth never move the train back, and it ends in step", () => {
  const beats = mechanism();
  const train = new TrainClock();
  train.show(null, 0, true);
  const positions: number[] = [];
  let now = 0;
  // deterministic 'random' gaps between clicks: 0.1 s to 2.4 s
  const gaps = [300, 2400, 100, 900, 1700, 200, 150, 2100, 650, 1200, 400];
  gaps.forEach((gap, index) => {
    train.show(index % 2 === 0 ? SPEED : null, now, false);
    positions.push(...run(train, beats, now, now + gap));
    now += gap;
  });
  train.show(null, now, false);
  positions.push(...run(train, beats, now, now + 10_000));
  assert.ok(nondecreasing(positions));
  assert.equal(train.mode.kind, "locked");
  assert.equal(train.mode.lead % 2, 0);
});

test("a slide reached directly is at its state at once: spinning at speed, or in step", () => {
  const train = new TrainClock();
  train.show(SPEED, 1000, true);
  const first = train.position(1000, 0);
  const second = train.position(2000, 0);
  assert.ok(Math.abs(second - first - SPEED) < 1e-9);
  train.show(null, 2000, true);
  assert.equal(train.position(2000, 7), 7);
});

test("a spin must be faster than the mechanism", () => {
  // the mechanism turns the escape wheel 12 degrees a second, on average
  assert.throws(() => spinBeats(watch, 12), /not faster/);
  assert.ok(spinBeats(watch, 13) > 1);
});

test("the Escapement slide's spin shows the escape wheel as the slide shows it", () => {
  const spinAt = ESCAPEMENT_SPIN;
  const still = escapementAt(spinAt - 1).shown;
  const spinning = escapementAt(spinAt).shown;
  assert.ok(spinning.size > 0);
  for (const mesh of spinning) {
    assert.equal(mesh.part, "escape wheel");
    assert.ok(still.has(mesh));
  }
  const shown = [...still].filter((mesh) => mesh.part === "escape wheel");
  assert.equal(spinning.size, shown.length);
});

test("on the Gears slide, the gears spin from the start, and start to fade in as the spin starts", () => {
  const gears = stageAt(GEARS_SLIDE, 0);
  assert.deepEqual(watchState(GEARS_SLIDE, 0)?.show, GEARS_SLIDE["watch"]);
  const timeline = new Timeline();
  timeline.show(escapementAt(Number(ESCAPEMENT_SLIDE["clicks"])), 0, true);
  timeline.show(gears, 1000, false);
  // the spin starts FADE_SECONDS after the click (TrainClock.show): when the
  // Escapement slide's picture has faded out, and the gears start to fade in
  const spinStart = 1000 + FADE_SECONDS * 1000;
  const before = timeline.valuesAt(spinStart - 1);
  assert.ok(before.fade.size > 0 && before.rest < 1e-3);
  const after = timeline.valuesAt(spinStart + 1);
  assert.equal(after.keep.size, 0);
  assert.deepEqual(after.fade, gears.shown);
});

test("on the Gears slide, the span fades in while the gears turn on at full speed", () => {
  const spanClick = 1;
  const [plain, span] = [0, spanClick].map(
    (click) => watchState(GEARS_SLIDE, click) ?? assert.fail("no watch"),
  ) as [WatchState, WatchState];
  assert.ok(plain.spin !== null && span.spin === plain.spin);
  assert.ok(
    stageAt(GEARS_SLIDE, spanClick).shown.size >
      stageAt(GEARS_SLIDE, 0).shown.size,
  );
  const beats = mechanism();
  const train = new TrainClock();
  train.show(spinBeats(watch, plain.spin), 0, true);
  train.show(spinBeats(watch, span.spin), 1000, false);
  // the same distance in each second, before the click and after it
  const second = (start: number): number =>
    train.position(start + 1000, beats(start + 1000)) -
    train.position(start, beats(start));
  for (const start of [0, 500, 1000, 2000]) {
    assert.ok(Math.abs(second(start) - spinBeats(watch, plain.spin)) < 1e-9);
  }
});

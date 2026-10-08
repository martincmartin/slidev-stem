// The train's clock (model.ts, TrainClock): the escape wheel's free spin on
// slide 4, and the stop that brings it back into step with the mechanism.

import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import { FADE_SECONDS, Timeline } from "../webgl/timeline.ts";
import type { Wheel } from "./design.ts";
import { ESCAPE_WHEEL, generate } from "./generate.ts";
import {
  angleAt,
  BalanceClock,
  Motion,
  SPIN_UP_SECONDS,
  spinBeats,
  stepper,
  TrainClock,
} from "./model.ts";

const watch = generate();
const { design, scene, groups } = watch;
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

test("the timeline's swap of the escapement and the escape wheel takes FADE_SECONDS, as the spin assumes", () => {
  const view = scene.views.find((candidate) => candidate.name === "escapement");
  const named = (name: string) =>
    scene.subjects.find((candidate) => candidate.name === name) ?? null;
  assert.ok(view);
  const timeline = new Timeline();
  const state = { view, tilt: 20, flash: null };
  timeline.show({ ...state, subject: named("escapement") }, 0, true);
  timeline.show({ ...state, subject: named(ESCAPE_WHEEL) }, 1000, false);
  assert.equal(timeline.phaseAt(1000 + FADE_SECONDS * 1000 - 1), "swap");
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

test("the escape wheel's subject is the escape wheel as the escapement shows it", () => {
  const named = (name: string) =>
    scene.subjects.find((candidate) => candidate.name === name);
  const wheel = named(ESCAPE_WHEEL);
  const escapement = named("escapement");
  assert.ok(wheel && escapement);
  assert.ok(wheel.meshes.size >= 1);
  for (const mesh of wheel.meshes) {
    assert.equal(mesh.part, "escape wheel");
    assert.ok(escapement.meshes.has(mesh));
  }
  const shown = [...escapement.meshes].filter(
    (mesh) => mesh.part === "escape wheel",
  );
  assert.equal(wheel.meshes.size, shown.length);
});

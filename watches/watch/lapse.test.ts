import assert from "node:assert/strict";
import { test } from "node:test";
import { LapseClock } from "./lapse.ts";

test("at a steady speed-up, each second puts the mechanism k - 1 seconds further ahead", () => {
  const clock = new LapseClock(1000);
  assert.equal(clock.ahead(3000), 0);
  clock.show(2, 3000, 0);
  assert.equal(clock.ahead(4000), 1);
  clock.show(1440, 4000, 0);
  assert.equal(clock.ahead(5000), 1 + 1439);
});

test("a change eases from one speed-up to the other, with no jump in the time ahead", () => {
  const clock = new LapseClock(0);
  clock.show(1440, 0, 0);
  clock.show(2, 10_000, 2.5);
  assert.equal(clock.speedUp(10_000), 1440);
  assert.ok(Math.abs(clock.speedUp(11_250) - Math.sqrt(1440 * 2)) < 1e-6);
  assert.equal(clock.speedUp(12_500), 2);
  for (const at of [10_000, 12_500]) {
    const step = Math.abs(clock.ahead(at + 1e-3) - clock.ahead(at - 1e-3));
    assert.ok(step < 2, `a jump of ${String(step)} at ${String(at)}`);
  }
  let last = -Infinity;
  for (let time = 9000; time <= 14_000; time += 50) {
    const ahead = clock.ahead(time);
    assert.ok(ahead >= last, `the time ahead fell at ${String(time)}`);
    last = ahead;
  }
});

test("a time before the last one asked for gives the earlier time ahead: a shutter's instant", () => {
  const clock = new LapseClock(0);
  clock.show(720, 0, 1);
  const later = clock.ahead(2000);
  assert.ok(clock.ahead(1990) < later);
  assert.equal(clock.ahead(2000), later);
});

test("the time ahead is handed over once it stops growing, and a jump has none", () => {
  const clock = new LapseClock(0);
  clock.show(15, 0, 0);
  clock.show(1, 1000, 2.5);
  assert.equal(clock.takeAhead(2000), 0, "it still grows");
  const ahead = clock.ahead(4000);
  assert.ok(ahead > 14);
  assert.equal(clock.takeAhead(4000), ahead);
  assert.equal(clock.ahead(5000), 0);
  clock.show(120, 5000, 0);
  clock.jump(1, 6000);
  assert.equal(clock.ahead(7000), 0);
});

test("between the table's steps, the time ahead is off by less than a quarter of a frame's motion", () => {
  const frame = 1000 / 60;
  for (const [from, to] of [
    [1, 1440],
    [1440, 720],
    [120, 15],
    [2, 1],
  ] as const) {
    const clock = new LapseClock(0);
    clock.show(from, 0, 0);
    clock.show(to, 0, 2.5);
    // the integral of the speed-up less 1, in steps of 0.1 ms
    const step = 0.1;
    let reference = 0;
    for (let time = step; time <= 2500 + step / 2; time += step) {
      const speedUp = (clock.speedUp(time - step) + clock.speedUp(time)) / 2;
      reference += ((speedUp - 1) * step) / 1000;
      if (Math.round(time / step) % 100 !== 0) continue;
      const motion = (clock.speedUp(time) * frame) / 1000;
      const error = Math.abs(clock.ahead(time) - reference);
      assert.ok(
        error < motion / 4,
        `${String(from)}x to ${String(to)}x at ${String(time)} ms: ${String(error / motion)} of a frame`,
      );
    }
  }
});

test("the clock takes only times and speed-ups that it can run", () => {
  assert.throws(() => new LapseClock(Number.NaN), /not finite/);
  const clock = new LapseClock(0);
  assert.throws(() => {
    clock.show(0, 0, 1);
  }, /speed-up 0/);
  assert.throws(() => {
    clock.show(Number.NaN, 0, 1);
  }, /speed-up NaN/);
  assert.throws(() => {
    clock.show(2, 0, -1);
  }, /-1 s/);
  assert.throws(() => {
    clock.show(2, 0, Infinity);
  }, /Infinity s/);
  assert.throws(() => {
    clock.jump(2, Infinity);
  }, /time Infinity/);
});

// A figure's clock, driven with made-up page times.

import assert from "node:assert/strict";
import { test } from "node:test";
import { FigureClock } from "./clock.ts";

test("a playing clock runs with the page's", () => {
  const clock = new FigureClock();
  assert.equal(clock.time(500), 500);
  assert.equal(clock.remaining(500), Number.POSITIVE_INFINITY);
});

test("a paused clock stands, and plays on from where it stood", () => {
  const clock = new FigureClock();
  clock.pause(1000);
  assert.equal(clock.time(5000), 1000);
  assert.equal(clock.remaining(5000), 0);
  clock.play(5000);
  assert.equal(clock.time(5250), 1250);
});

test("a paused clock runs to a time, and stands there", () => {
  const clock = new FigureClock();
  clock.pause(1000);
  clock.runTo(3000, 1800);
  assert.equal(clock.time(3500), 1500);
  assert.equal(clock.remaining(3500), 300);
  assert.equal(clock.time(9000), 1800);
  // a pause in the run stands where it is
  clock.runTo(9000, 2000);
  clock.pause(9100);
  assert.equal(clock.time(9900), 1900);
});

test("a run to a time passed, or in a playing clock, changes nothing", () => {
  const clock = new FigureClock();
  clock.runTo(100, 5000);
  assert.equal(clock.time(200), 200);
  clock.pause(1000);
  clock.runTo(2000, 400);
  assert.equal(clock.time(3000), 1000);
});

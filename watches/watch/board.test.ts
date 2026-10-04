// The diving board's pose on a page that does not run its clock.

import assert from "node:assert/strict";
import { test } from "node:test";
import { boardPoseTime, CURL_SHOWN } from "./board.ts";
import type { BoardTiming } from "./board.ts";

// diving-board.svg's times, as an example
const TIMING: BoardTiming = {
  swingStart: 2.4,
  curlStart: 3.4,
  curlDuration: 2.4,
};

test("before the board plays, the time is 0", () => {
  assert.equal(boardPoseTime(TIMING, false, false), 0);
});

test("a playing board is bent, at the bottom of its swing", () => {
  assert.equal(boardPoseTime(TIMING, true, false), TIMING.swingStart);
});

test("a curling board is part of the way through the curl", () => {
  const time = boardPoseTime(TIMING, true, true);
  assert.ok(time > TIMING.curlStart);
  assert.ok(time < TIMING.curlStart + TIMING.curlDuration);
  assert.equal(time, TIMING.curlStart + CURL_SHOWN * TIMING.curlDuration);
});

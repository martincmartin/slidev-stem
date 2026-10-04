// The diving board's targets, its pose on a page that does not run its clock,
// and its clock, in both directions.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BoardClock,
  boardPoseTime,
  boardState,
  CURL_SHOWN,
  EDIT_STEPS,
  editStep,
  storyEnd,
} from "./board.ts";
import type { BoardState, BoardTiming } from "./board.ts";

// diving-board.svg's times, as an example
const TIMING: BoardTiming = {
  swingStart: 2.4,
  swingPeriod: 1,
  curlStart: 3.4,
  curlDuration: 2.4,
  editDuration: 1.2,
};
const CURL_END = TIMING.curlStart + TIMING.curlDuration;
const END = storyEnd(TIMING);
// slide 2's keys
const SLIDE = { board: 1, boardCurl: 2, boardHide: 3 };

function stateAt(clicks: number): BoardState {
  const state = boardState(SLIDE, clicks);
  assert.ok(state);
  return state;
}

test("a slide without `board` has no board", () => {
  assert.equal(boardState({}, 2), undefined);
});

test("slide 2's targets: off, swinging, curling, then only the rest shape", () => {
  assert.deepEqual(stateAt(0), {
    picture: false,
    rest: false,
    curling: false,
    place: "start",
  });
  assert.deepEqual(stateAt(1), {
    picture: true,
    rest: true,
    curling: false,
    place: "swing",
  });
  assert.deepEqual(stateAt(2), {
    picture: true,
    rest: true,
    curling: true,
    place: "curled",
  });
  assert.deepEqual(stateAt(4), {
    picture: false,
    rest: true,
    curling: true,
    place: "curled",
  });
});

test("the keys must come in order", () => {
  assert.throws(() => boardState({ board: 2, boardCurl: 1 }, 0), /boardCurl/);
  assert.throws(
    () => boardState({ board: 1, boardCurl: 3, boardHide: 2 }, 0),
    /boardHide/,
  );
  assert.throws(() => boardState({ board: "one" }, 0), /board/);
});

test("a page's pose: 0, the bottom of the swing, part of the way through the curl, the end", () => {
  assert.equal(boardPoseTime(TIMING, stateAt(0)), 0);
  assert.equal(boardPoseTime(TIMING, stateAt(1)), TIMING.swingStart);
  const time = boardPoseTime(TIMING, stateAt(2));
  assert.equal(time, TIMING.curlStart + CURL_SHOWN * TIMING.curlDuration);
  // only the rest shape and its callout: curled, and the sentence edited
  assert.equal(boardPoseTime(TIMING, stateAt(3)), END);
  assert.equal(boardPoseTime(TIMING, stateAt(4)), END);
});

test("the edit: after the curl, one step after another, in reading order", () => {
  // rounded: the times are sums of tenths
  const steps = (time: number): number[] =>
    Array.from(
      { length: EDIT_STEPS },
      (_, index) => Math.round(editStep(TIMING, time, index) * 1e9) / 1e9,
    );
  assert.deepEqual(steps(CURL_END), [0, 0, 0, 0]);
  const length = TIMING.editDuration / EDIT_STEPS;
  assert.deepEqual(steps(CURL_END + length), [1, 0, 0, 0]);
  assert.deepEqual(steps(CURL_END + 2.5 * length), [1, 1, 0.5, 0]);
  assert.deepEqual(steps(END), [1, 1, 1, 1]);
  assert.deepEqual(steps(0), [0, 0, 0, 0]);
  assert.throws(() => editStep(TIMING, END, EDIT_STEPS), /edit step/);
});

test("forward: the swing plays from 0, and the curl waits for the bottom", () => {
  const clock = new BoardClock(TIMING);
  clock.show("swing", 0, false);
  assert.equal(clock.time(1000), 1);
  assert.equal(clock.phase(1000), "bend");
  assert.equal(clock.phase(2600), "swing");
  // 2.6 s in: 0.2 s into the swing; the next bottom is at 3.4 s
  clock.show("curled", 2600, false);
  assert.equal(clock.phase(2600), "curl");
  assert.ok(Math.abs(clock.time(3300) - 3.3) < 1e-9); // still swinging
  assert.ok(Math.abs(clock.time(3400) - TIMING.curlStart) < 1e-9);
  assert.ok(Math.abs(clock.time(4400) - (TIMING.curlStart + 1)) < 1e-9);
  // the curl, then the edit: busy until both are done
  assert.equal(clock.phase(3400 + 1000 * TIMING.curlDuration + 100), "curl");
  assert.equal(clock.time(9000), END);
  assert.equal(clock.phase(9000), "curled");
  assert.equal(clock.moving(9000), false);
});

test("back: the board uncurls to the bottom of the swing, and swings on", () => {
  const clock = new BoardClock(TIMING);
  clock.show("curled", 0, true);
  assert.equal(clock.time(0), END);
  clock.show("swing", 1000, false);
  assert.equal(clock.phase(1500), "uncurl");
  assert.ok(Math.abs(clock.time(1500) - (END - 0.5)) < 1e-9);
  // the edit is undone, then the board uncurls, each as long as forward; then
  // the swing starts at its bottom
  const uncurled = 1000 + (END - TIMING.curlStart) * 1000;
  assert.ok(Math.abs(clock.time(uncurled + 1) - TIMING.swingStart) < 0.01);
  assert.equal(clock.phase(uncurled + 100), "swing");
});

test("a change of mind in the middle of a curl turns it round where it is", () => {
  const clock = new BoardClock(TIMING);
  clock.show("curled", 0, true);
  clock.show("swing", 0, false);
  clock.show("curled", 500, false);
  assert.ok(Math.abs(clock.time(500) - (END - 0.5)) < 1e-9);
  assert.equal(clock.phase(600), "curl");
  assert.equal(clock.time(1000), END);
});

test("off and back: the pose holds, and the next swing plays from 0", () => {
  const clock = new BoardClock(TIMING);
  clock.show("swing", 0, false);
  clock.show("start", 1000, false);
  assert.equal(clock.time(5000), 1); // held while the picture fades
  assert.equal(clock.phase(5000), "start");
  clock.show("swing", 5000, false);
  assert.equal(clock.time(5500), 0.5);
});

test("a jump shows the target at once", () => {
  const clock = new BoardClock(TIMING);
  clock.show("swing", 0, true);
  assert.equal(clock.time(0), TIMING.swingStart);
  assert.equal(clock.phase(0), "swing");
  clock.show("curled", 100, true);
  assert.equal(clock.time(100), END); // curled, and the sentence edited
  clock.show("start", 200, true);
  assert.equal(clock.time(200), 0);
});

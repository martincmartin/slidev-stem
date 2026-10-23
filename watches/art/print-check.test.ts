import assert from "node:assert/strict";
import { test } from "node:test";
import { boardProblems, pageProblems } from "./print-check.ts";
import type {
  BoardPose,
  LiveView,
  Position,
  PrintedView,
  Unloaded,
} from "./print-check.ts";

/** A board's file times (s): the swing's bottom at 1, the curl from 2 to 3,
 *  the edit to 4. */
const TIMING = {
  swingStart: 1,
  swingPeriod: 1,
  curlStart: 2,
  curlDuration: 1,
  editDuration: 1,
};
const SWINGING: BoardPose = {
  picture: true,
  rest: false,
  curling: false,
  time: 1,
  timing: TIMING,
};
/** At the curl's click: half way through the curl (CURL_SHOWN). */
const CURLING: BoardPose = {
  ...SWINGING,
  rest: true,
  curling: true,
  time: 2.5,
};
/** After it: the rest shape, curled, with the sentence edited. */
const AT_REST: BoardPose = { ...CURLING, picture: false, time: 4 };

test("a printed board at its click's pose has no problem", () => {
  for (const pose of [SWINGING, CURLING, AT_REST]) {
    assert.deepEqual(boardProblems(pose, pose), []);
  }
  assert.deepEqual(boardProblems(null, null), []);
});

test("a printed board's clock must be at its click's pose", () => {
  const late = (pose: BoardPose, time: number) =>
    boardProblems(pose, { ...pose, time });
  assert.deepEqual(late(SWINGING, 1.2), [
    "the board's clock, 1.20 s, is not at its click's pose, 1.00 s",
  ]);
  // inside the curl, but not at the curl's pose
  assert.equal(late(CURLING, 2.2).length, 1);
  assert.equal(late(AT_REST, 3).length, 1);
  // within the tolerance: the SVG's clock reads a little late
  assert.deepEqual(late(AT_REST, 4.04), []);
});

test("a printed board must show what the live one shows", () => {
  assert.deepEqual(boardProblems(SWINGING, CURLING), [
    "the board's curling is true, live false",
  ]);
  assert.deepEqual(boardProblems(SWINGING, null), [
    "only one of the two pages shows the board",
  ]);
  // a board that is there but hidden is no board to compare
  assert.deepEqual(
    boardProblems(null, { ...SWINGING, picture: false, rest: false }),
    [],
  );
});

test("each printed page is compared with the live slide at its click", () => {
  const first: Position = { slide: 1, click: 0 };
  const second: Position = { slide: 2, click: 1 };
  const fourth: Position = { slide: 4, click: 0 };
  const positions = [first, second, { slide: 3, click: 0 }, fourth];
  const live: LiveView[] = positions.map((position) => ({
    position,
    watch: '{"view":"cover"}',
    board: null,
  }));
  const printed = new Map<Position, PrintedView | Unloaded>([
    [first, { watch: '{"view":"cover"}', board: null }],
    [second, { watch: '{"view":"crown"}', board: null }],
    [fourth, { failure: "Timeout 120000ms exceeded." }],
  ]);
  const { problems, withWatch } = pageProblems(live, printed);
  assert.deepEqual(problems, [
    'slide 2, click 1: the printed page shows {"view":"crown"}, the live slide {"view":"cover"}',
    "slide 3, click 0: the printed page did not load",
    "slide 4, click 0: the printed page did not load: Timeout 120000ms exceeded.",
  ]);
  assert.equal(withWatch, 2);
});

test("a deck with no watch on any page compares nothing, and fails", () => {
  const position = { slide: 1, click: 0 };
  const { problems } = pageProblems(
    [{ position, watch: "null", board: null }],
    new Map([[position, { watch: "null", board: null }]]),
  );
  assert.deepEqual(problems, ["no page shows the watch: nothing was compared"]);
});

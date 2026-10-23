import assert from "node:assert/strict";
import { test } from "node:test";
import { placeOf } from "./browser.ts";
import { moveProblems, ruleZeroProblem } from "./navcheck.ts";
import type { Move } from "./navcheck.ts";

/** A move from 2:0 to 2:1, pressed at 100 ms, whose `opacity` takes the
 *  values `values` at frames 16 ms apart from 68 ms. */
function move(values: readonly number[], timedOut = false): Move {
  return {
    start: { slide: 2, click: 0 },
    end: { slide: 2, click: 1 },
    key: "ArrowRight",
    press: 100,
    samples: values.map((opacity, index) => ({
      time: 68 + 16 * index,
      values: { opacity },
    })),
    settled: { view: "cover" },
    timedOut,
  };
}

test("a smooth fade has no problem", () => {
  // frames at 68, 84 (before the press), then 100, 116, ...
  assert.deepEqual(moveProblems(move([0, 0, 0.1, 0.4, 0.8, 1])), {
    problems: [],
    notes: [],
  });
});

test("a number that leaves its range is a flash", () => {
  const { problems } = moveProblems(move([0, 0, 0.5, 1.4, 1]));
  assert.equal(problems.length, 1);
  assert.match(
    problems[0] ?? "",
    /opacity went to 1\.40 on its way from 0\.00 to 1\.00/,
  );
});

test("a number that fades out and leaves ends at its last value", () => {
  const fadeOut = move([1, 1, 0.8, 0.4, 0]);
  const gone: Move = {
    ...fadeOut,
    samples: [...fadeOut.samples, { time: 200, values: {} }],
  };
  assert.deepEqual(moveProblems(gone), { problems: [], notes: [] });
});

test("most of a change in the first frame is a cut", () => {
  const { problems } = moveProblems(move([0, 0, 0.9, 1, 1]));
  assert.equal(problems.length, 1);
  assert.match(
    problems[0] ?? "",
    /90% of it in the first frame, 0 ms after the press \(a cut\)/,
  );
});

test("a first frame that comes late is a note, not a failure", () => {
  const late: Move = {
    ...move([0, 0, 0.9, 1]),
    press: 100,
    samples: [
      { time: 90, values: { opacity: 0 } },
      { time: 300, values: { opacity: 0.9 } },
      { time: 316, values: { opacity: 1 } },
    ],
  };
  const { problems, notes } = moveProblems(late);
  assert.deepEqual(problems, []);
  assert.match(notes[0] ?? "", /the frame came too late to tell/);
});

test("a move that does not end fails, and one with no frame is noted", () => {
  assert.equal(
    moveProblems(move([0, 0, 0.1, 0.5, 1], true)).problems.length,
    1,
  );
  assert.equal(moveProblems(move([])).notes.length, 1);
});

test("a move must end as a direct load of its place does", () => {
  assert.equal(ruleZeroProblem(move([0]), { view: "cover" }), null);
  assert.equal(
    ruleZeroProblem(move([0]), { view: "crown", tilt: 1 }),
    "2:0 -> 2:1 (ArrowRight): ends unlike a direct load of 2:1; " +
      'tilt none, not 1, view "cover", not "crown"',
  );
});

test("a URL's place is its slide and its click", () => {
  assert.deepEqual(placeOf("https://deck.test/3?clicks=2"), {
    slide: 3,
    click: 2,
  });
  assert.deepEqual(placeOf("https://deck.test/7"), { slide: 7, click: 0 });
  assert.deepEqual(placeOf("http://localhost:3030/"), { slide: 1, click: 0 });
});

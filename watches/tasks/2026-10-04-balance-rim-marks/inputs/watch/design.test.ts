// readDesign: the design as it is, and what it refuses.

import assert from "node:assert/strict";
import { test } from "node:test";
import designFile from "./design.json" with { type: "json" };
import { readDesign } from "./design.ts";
import { stepper } from "./model.ts";

/** design.json with one change. */
function changed(edit: (design: typeof designFile) => void): unknown {
  const copy = structuredClone(designFile);
  edit(copy);
  return copy;
}

test("design.json is a good design", () => {
  assert.doesNotThrow(() => readDesign(designFile));
});

test("a timing out of range throws, with its name", () => {
  const bad: [RegExp, (design: typeof designFile) => void][] = [
    [/timing.period/, (design) => (design.timing.period = 0)],
    [/timing.amplitude/, (design) => (design.timing.amplitude = -1)],
    [/timing.pinArc/, (design) => (design.timing.pinArc = 200)],
    [/timing.bank/, (design) => (design.timing.bank = 0)],
    [/timing.unlock/, (design) => (design.timing.unlock = 1)],
    [/timing.fourthLoop/, (design) => (design.timing.fourthLoop = 61)],
    [/timing.hourRatio/, (design) => (design.timing.hourRatio = 0)],
  ];
  for (const [message, edit] of bad) {
    assert.throws(() => readDesign(changed(edit)), message);
  }
});

test("a point that is not finite throws", () => {
  assert.throws(
    () => readDesign(changed((design) => (design.watchCentre = [Infinity, 0]))),
    /watchCentre/,
  );
});

test("two wheels with one name throw", () => {
  assert.throws(
    () =>
      readDesign(
        changed((design) => {
          const [first] = design.wheels;
          if (first) design.wheels.push(first);
        }),
      ),
    /different names/,
  );
});

test("stepper refuses a duration that is not a whole number of periods", () => {
  const timing = readDesign(designFile).timing;
  for (const duration of [0, 3, Infinity]) {
    assert.throws(() => stepper(timing, duration, 6, true), /whole number/);
  }
});

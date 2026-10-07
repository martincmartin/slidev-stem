// A slide's frontmatter to a watch state: what it accepts, and what it
// refuses with the field's name.

import assert from "node:assert/strict";
import { test } from "node:test";
import { ESCAPE_WHEEL } from "./generate.ts";
import { SPIN_SPEED, watchState } from "./state.ts";

test("a slide without watch has no state", () => {
  assert.equal(watchState({}, 0), undefined);
});

test("the fields and their defaults", () => {
  assert.deepEqual(watchState({ watch: "cover" }, 0), {
    view: "cover",
    tilt: 0,
    only: undefined,
    flash: undefined,
    settled: false,
    spin: null,
  });
  const frontmatter = {
    watch: "hairspring",
    watchTilt: 20,
    watchOnly: "hairspring and stud",
    watchFlash: "balance and hairspring",
    watchSettle: 1,
  };
  assert.equal(watchState(frontmatter, 0)?.settled, false);
  assert.deepEqual(watchState(frontmatter, 1), {
    view: "hairspring",
    tilt: 20,
    only: "hairspring and stud",
    flash: "balance and hairspring",
    settled: true,
    spin: null,
  });
});

test("the escape wheel spins alone from watchSpin until watchSpinEnd", () => {
  const frontmatter = {
    watch: "escapement",
    watchOnly: "escapement",
    watchSpin: 1,
    watchSpinEnd: 2,
    watchSpinSpeed: 120,
  };
  const at = (clicks: number) => watchState(frontmatter, clicks);
  assert.deepEqual(
    [0, 1, 2, 3].map((clicks) => [at(clicks)?.only, at(clicks)?.spin]),
    [
      ["escapement", null],
      [ESCAPE_WHEEL, 120],
      ["escapement", null],
      ["escapement", null],
    ],
  );
  // with no end, it spins to the slide's end, at the default speed
  const open = { watch: "escapement", watchSpin: 1 };
  assert.equal(watchState(open, 5)?.spin, SPIN_SPEED);
});

test("watchSpinEnd needs an earlier watchSpin, and a speed needs a spin", () => {
  for (const [frontmatter, field] of [
    [{ watchSpinEnd: 2 }, "watchSpinEnd"],
    [{ watchSpin: 2, watchSpinEnd: 2 }, "watchSpinEnd"],
    [{ watchSpinSpeed: 90 }, "watchSpinSpeed"],
  ] as const) {
    assert.throws(
      () => watchState({ watch: "cover", ...frontmatter }, 0),
      new RegExp(`^Error: ${field}:`),
      JSON.stringify(frontmatter),
    );
  }
});

test("a settled balance resumes at watchResume", () => {
  const frontmatter = { watch: "hairspring", watchSettle: 2, watchResume: 3 };
  const at = (clicks: number) => watchState(frontmatter, clicks);
  assert.equal(at(1)?.settled, false);
  assert.equal(at(2)?.settled, true);
  assert.equal(at(3)?.settled, false); // swinging again
  assert.equal(at(4)?.settled, false);
});

test("watchResume needs an earlier watchSettle", () => {
  for (const frontmatter of [
    { watchResume: 2 },
    { watchSettle: 2, watchResume: 2 },
  ]) {
    assert.throws(
      () => watchState({ watch: "cover", ...frontmatter }, 0),
      /^Error: watchResume:/,
      JSON.stringify(frontmatter),
    );
  }
});

test("a field of the wrong kind throws, with its name", () => {
  for (const [field, value] of [
    ["watch", ""],
    ["watch", 3],
    ["watchTilt", "20"],
    ["watchTilt", ""],
    ["watchTilt", true],
    ["watchTilt", Number.NaN],
    ["watchOnly", ""],
    ["watchOnly", 1],
    ["watchFlash", ""],
    ["watchFlash", 2],
    ["watchSettle", "1"],
    ["watchSettle", 1.5],
    ["watchSettle", -1],
    ["watchResume", "3"],
    ["watchResume", -1],
    ["watchResume", 1.5],
    ["watchSpin", "1"],
    ["watchSpin", -1],
    ["watchSpinEnd", 1.5],
    ["watchSpinSpeed", 0],
    ["watchSpinSpeed", -90],
    ["watchSpinSpeed", "90"],
  ] as const) {
    assert.throws(
      () => watchState({ watch: "cover", [field]: value }, 0),
      new RegExp(`^Error: ${field}:`),
      `${field}: ${String(value)}`,
    );
  }
});

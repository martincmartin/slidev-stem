// A slide's frontmatter to a watch state: what it accepts, and what it
// refuses with the field's name.

import assert from "node:assert/strict";
import { test } from "node:test";
import { watchState } from "./state.ts";

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
  });
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
  ] as const) {
    assert.throws(
      () => watchState({ watch: "cover", [field]: value }, 0),
      new RegExp(`^Error: ${field}:`),
      `${field}: ${String(value)}`,
    );
  }
});

// A slide's frontmatter to a watch state: what it accepts, and what it
// refuses with the field's name.

import assert from "node:assert/strict";
import { test } from "node:test";
import { generate } from "./generate.ts";
import {
  SPIN_PIECES,
  SPIN_SPEED,
  moveWithBefore,
  stageState,
  tickTockState,
  watchState,
} from "./state.ts";

const watch = generate();

test("a slide without watch has no state", () => {
  assert.equal(watchState({}, 0), undefined);
});

test("the fields and their defaults", () => {
  assert.deepEqual(watchState({ watch: "all" }, 0), {
    view: null,
    tilt: 0,
    show: "all",
    flash: undefined,
    settled: false,
    spin: null,
  });
  const frontmatter = {
    watch: ["hairspring", "collet", "stud"],
    watchView: "hairspring",
    watchTilt: 20,
    watchFlash: ["balance wheel"],
    watchSettle: 1,
  };
  assert.equal(watchState(frontmatter, 0)?.settled, false);
  assert.deepEqual(watchState(frontmatter, 1), {
    view: "hairspring",
    tilt: 20,
    show: ["hairspring", "collet", "stud"],
    flash: ["balance wheel"],
    settled: true,
    spin: null,
  });
});

test("the escape wheel spins alone from watchSpin until watchSpinEnd, in the slide's view", () => {
  const frontmatter = {
    watch: ["pallet fork", "escape wheel", "escape arbor"],
    watchSpin: 1,
    watchSpinEnd: 2,
    watchSpinSpeed: 120,
  };
  const at = (clicks: number) => watchState(frontmatter, clicks);
  assert.deepEqual(
    [0, 1, 2, 3].map((clicks) => at(clicks)?.spin),
    [null, 120, null, null],
  );
  const still = stageState(watch, at(0) ?? assert.fail());
  const spinning = stageState(watch, at(1) ?? assert.fail());
  const spun = new Set(
    watch.scene.pieces
      .filter((piece) => SPIN_PIECES.includes(piece.name))
      .flatMap((piece) => [...piece.meshes]),
  );
  assert.deepEqual(spinning.shown, spun);
  assert.ok(still.shown.size > spun.size);
  assert.deepEqual(spinning.view, still.view);
  // with no end, it spins to the slide's end, at the default speed
  const open = { watch: "all", watchSpin: 1 };
  assert.equal(watchState(open, 5)?.spin, SPIN_SPEED);
});

test("a slide shows the meshes of its pieces, or all of them, in its named or fitted view", () => {
  const named = stageState(
    watch,
    watchState({ watch: ["stud"], watchView: "hairspring" }, 0) ??
      assert.fail(),
  );
  assert.equal(named.view.name, "hairspring");
  assert.equal(named.shown.size, 1);
  const all = stageState(
    watch,
    watchState({ watch: "all" }, 0) ?? assert.fail(),
  );
  assert.equal(all.shown.size, watch.scene.meshes.length);
  const fitted = stageState(
    watch,
    watchState({ watch: ["fourth wheel", "escape pinion"] }, 0) ??
      assert.fail(),
  );
  assert.equal(fitted.view.name, "fourth wheel, escape pinion");
  assert.equal(fitted.moveWith, "common");
  for (const [frontmatter, error] of [
    [
      { watch: ["no such piece"] },
      /^Error: watch: no watch piece "no such piece"/,
    ],
    [
      { watch: ["stud"], watchFlash: ["nor this"] },
      /^Error: watchFlash: no watch piece/,
    ],
    [
      { watch: ["stud"], watchView: "nowhere" },
      /^Error: watchView: no watch view/,
    ],
  ] as const) {
    assert.throws(
      () => stageState(watch, watchState(frontmatter, 0) ?? assert.fail()),
      error,
    );
  }
});

test("watchMoveWith names what shows while the camera moves into the slide", () => {
  assert.equal(moveWithBefore({ watch: "all" }), "common");
  for (const value of ["common", "all", "none"]) {
    assert.equal(moveWithBefore({ watch: "all", watchMoveWith: value }), value);
  }
  assert.throws(
    () => watchState({ watch: "all", watchMoveWith: "some" }, 0),
    /^Error: watchMoveWith:/,
  );
  assert.throws(
    () => watchState({ watchMoveWith: "all" }, 0),
    /set only with watch/,
  );
});

test("watchSpinEnd needs an earlier watchSpin, and a speed needs a spin", () => {
  for (const [frontmatter, field] of [
    [{ watchSpinEnd: 2 }, "watchSpinEnd"],
    [{ watchSpin: 2, watchSpinEnd: 2 }, "watchSpinEnd"],
    [{ watchSpinSpeed: 90 }, "watchSpinSpeed"],
  ] as const) {
    assert.throws(
      () => watchState({ watch: "all", ...frontmatter }, 0),
      new RegExp(`^Error: ${field}:`),
      JSON.stringify(frontmatter),
    );
  }
});

test("a settled balance resumes at watchResume", () => {
  const frontmatter = { watch: "all", watchSettle: 2, watchResume: 3 };
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
      () => watchState({ watch: "all", ...frontmatter }, 0),
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
    ["watch", "stud"],
    ["watch", []],
    ["watch", [""]],
    ["watchView", ""],
    ["watchView", 1],
    ["watchFlash", ""],
    ["watchFlash", 2],
    ["watchFlash", "stud"],
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
      () => watchState({ watch: "all", [field]: value }, 0),
      new RegExp(`^Error: ${field}:`),
      `${field}: ${String(value)}`,
    );
  }
});

test("the words tick and tock show from watchTickTock on, in bursts from watchTickTockBurst", () => {
  assert.equal(tickTockState({ watch: "all" }, 9), undefined);
  const frontmatter = {
    watch: "all",
    watchTickTock: 7,
    watchTickTockBurst: 8,
  };
  assert.equal(tickTockState(frontmatter, 6), undefined);
  assert.deepEqual(tickTockState(frontmatter, 7), { burst: false });
  assert.deepEqual(tickTockState(frontmatter, 8), { burst: true });
  assert.throws(
    () => tickTockState({ watch: "all", watchTickTock: "7" }, 7),
    /watchTickTock/,
  );
  assert.throws(() => tickTockState({ watchTickTock: 7 }, 7), /watchTickTock/);
  assert.throws(
    () =>
      tickTockState(
        { watch: "all", watchTickTock: 7, watchTickTockBurst: 7 },
        7,
      ),
    /watchTickTockBurst/,
  );
  assert.throws(
    () => tickTockState({ watch: "all", watchTickTockBurst: 8 }, 8),
    /watchTickTockBurst/,
  );
});

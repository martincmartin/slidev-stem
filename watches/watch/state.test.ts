// A slide's frontmatter to a watch state: what it accepts, and what it
// refuses with the field's name.

import assert from "node:assert/strict";
import { test } from "node:test";
import { generate } from "./generate.ts";
import {
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
    fit: "all",
    right: null,
    flash: undefined,
    later: undefined,
    settled: false,
    spin: null,
  });
  const frontmatter = {
    watch: ["hairspring", "collet", "stud"],
    watchView: "hairspring",
    watchTilt: 20,
    watchFlash: ["balance wheel"],
    watchClicks: { 1: { watchAtRest: true } },
  };
  assert.equal(watchState(frontmatter, 0)?.settled, false);
  assert.deepEqual(watchState(frontmatter, 0)?.flash, ["balance wheel"]);
  assert.deepEqual(watchState(frontmatter, 1), {
    view: "hairspring",
    tilt: 20,
    show: ["hairspring", "collet", "stud"],
    fit: ["hairspring", "collet", "stud"],
    right: null,
    flash: undefined,
    later: undefined,
    settled: true,
    spin: null,
  });
});

test("a flash is of one click: the slide's at click 0, a block's at its click", () => {
  const frontmatter = {
    watch: "all",
    watchFlash: ["balance wheel"],
    watchClicks: {
      1: { watchTilt: 20 },
      2: { watchFlash: ["third wheel", ["third arbor"]], watchLater: ["lug"] },
      3: { watchTilt: 0, watchFlash: ["centre wheel"] },
    },
  };
  const flashes = [0, 1, 2, 3, 4].map(
    (clicks) => watchState(frontmatter, clicks)?.flash,
  );
  assert.deepEqual(flashes, [
    ["balance wheel"],
    undefined,
    ["third wheel", "third arbor"],
    ["centre wheel"],
    undefined,
  ]);
  // so is the order of the fades
  assert.deepEqual(
    [1, 2, 3].map((clicks) => watchState(frontmatter, clicks)?.later),
    [undefined, ["lug"], undefined],
  );
  // the other keys carry on, as without a flash
  assert.equal(watchState(frontmatter, 2)?.tilt, 20);
});

test("a click block changes the motion from its click on, as the slide sets it for click 0", () => {
  const frontmatter = {
    watch: "all",
    watchSpin: 45,
    watchClicks: {
      1: { watchSpin: false, watchAtRest: true },
      2: { watchSpin: 120, watchTilt: 20 },
      3: { watchAtRest: false, watchTickTock: "plain" },
      4: { watchTickTock: "burst" },
      5: { watchTickTock: false },
    },
  };
  const at = (clicks: number) => watchState(frontmatter, clicks);
  const clicks = [0, 1, 2, 3, 4, 5];
  assert.deepEqual(
    clicks.map((click) => at(click)?.spin),
    [45, null, 120, 120, 120, 120],
  );
  assert.deepEqual(
    clicks.map((click) => at(click)?.settled),
    [false, true, true, false, false, false],
  );
  assert.deepEqual(
    clicks.map((click) => at(click)?.tilt),
    [0, 0, 20, 20, 20, 20],
  );
  assert.deepEqual(
    clicks.map((click) => tickTockState(frontmatter, click)),
    [
      undefined,
      undefined,
      undefined,
      { burst: false },
      { burst: true },
      undefined,
    ],
  );
  // a block that says what is already so changes nothing
  assert.equal(
    watchState({ watch: "all", watchClicks: { 2: { watchAtRest: false } } }, 3)
      ?.settled,
    false,
  );
});

test("watchClicks changes what shows from its click on; the camera stays on watchView", () => {
  const gears = ["fourth wheel", "escape pinion"];
  const frontmatter = {
    watch: gears,
    watchView: gears,
    // a list may hold lists (YAML aliases), and a name twice shows once
    watchClicks: {
      3: { watch: [gears, "pallet fork", "escape wheel"] },
      1: { watch: [gears, "escape wheel", "escape pinion"] },
    },
  };
  const at = (clicks: number) => watchState(frontmatter, clicks);
  assert.deepEqual(
    [0, 1, 2, 3].map((clicks) => at(clicks)?.show),
    [
      gears,
      [...gears, "escape wheel"],
      [...gears, "escape wheel"],
      [...gears, "pallet fork", "escape wheel"],
    ],
  );
  const first = stageState(watch, at(0) ?? assert.fail());
  const last = stageState(watch, at(3) ?? assert.fail());
  assert.deepEqual(last.view, first.view);
  assert.ok(last.shown.size > first.shown.size);
  // without watchView, the view fits what shows, so it moves
  const moving = { watch: gears, watchClicks: frontmatter.watchClicks };
  const fitted = (clicks: number) =>
    stageState(watch, watchState(moving, clicks) ?? assert.fail()).view;
  assert.notDeepEqual(fitted(3), fitted(0));
  // a click can change the frame too: here, to a named view
  const named = {
    watch: gears,
    watchClicks: { 2: { watchView: "hairspring" } },
  };
  assert.equal(watchState(named, 1)?.view, null);
  assert.equal(watchState(named, 2)?.view, "hairspring");
});

test("watchClicks and watchView refuse what they cannot hold, with the key's name", () => {
  for (const [frontmatter, field] of [
    [{ watchClicks: [{ watch: "all" }] }, "watchClicks"],
    [{ watchClicks: { one: { watch: "all" } } }, "watchClicks"],
    [{ watchClicks: { "-1": { watch: "all" } } }, "watchClicks"],
    [{ watchClicks: { 1.5: { watch: "all" } } }, "watchClicks"],
    [{ watchClicks: { 1: ["escape wheel"] } }, "watchClicks.1"],
    [{ watchClicks: { 1: {} } }, "watchClicks.1"],
    [{ watchClicks: { 1: { watchMoveWith: "all" } } }, "watchClicks.1"],
    // a block is checked before its click comes
    [{ watchClicks: { 5: { watch: [] } } }, "watchClicks.5.watch"],
    [{ watchClicks: { 5: { watchView: 3 } } }, "watchClicks.5.watchView"],
    [{ watchView: [] }, "watchView"],
    [{ watchView: [[]] }, "watchView"],
  ] as const) {
    assert.throws(
      () => watchState({ watch: "all", ...frontmatter }, 0),
      new RegExp(`^Error: ${field.replaceAll(".", "\\.")}:`),
      JSON.stringify(frontmatter),
    );
  }
});

test("a slide shows the meshes of its pieces, or all but the marks, in its named or fitted view", () => {
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
  // every mesh but those of the pieces that only a slide that names them
  // shows: the Gears slide's spans, and the Gear Train slide's one-step
  // wheel and raised strap
  const marks = watch.scene.pieces.filter((piece) => !piece.inAll);
  assert.deepEqual(marks.map((piece) => piece.name).sort(), [
    "escape pinion span",
    "escape pinion span wash",
    "fourth wheel span",
    "fourth wheel span wash",
    "one-step wheel",
    "raised strap",
  ]);
  const markMeshes = new Set(marks.flatMap((piece) => [...piece.meshes]));
  assert.deepEqual(
    all.shown,
    new Set(watch.scene.meshes.filter((mesh) => !markMeshes.has(mesh))),
  );
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

test("watchRight puts a fitted view's right edge there, and needs a fitted view", () => {
  const pieces = ["fourth wheel", "escape pinion"];
  const right = (frontmatter: Record<string, unknown>): number => {
    const { view } = stageState(
      watch,
      watchState({ watch: pieces, ...frontmatter }, 0) ?? assert.fail(),
    );
    const edge = Math.max(
      ...pieces.map(
        (name) =>
          watch.extents.get(
            watch.scene.pieces.find((piece) => piece.name === name) ??
              assert.fail(),
          )?.box.right ?? assert.fail(),
      ),
    );
    return view.scale * edge + view.shift[0];
  };
  assert.ok(Math.abs(right({ watchRight: 489 }) - 489) < 1e-9);
  assert.ok(Math.abs(right({}) - 489) > 1);
  assert.throws(
    () =>
      watchState(
        { watch: pieces, watchView: "hairspring", watchRight: 489 },
        0,
      ),
    /^Error: watchRight: .*set only with a fitted view/,
  );
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

test("a key that a click can change needs watch on the slide", () => {
  for (const [frontmatter, field] of [
    [{ watchSpin: 45 }, "watchSpin"],
    [{ watchAtRest: true }, "watchAtRest"],
    [{ watchTickTock: "plain" }, "watchTickTock"],
    [{ watchRight: 489 }, "watchRight"],
    [{ watchFlash: ["stud"] }, "watchFlash"],
    [{ watchLater: ["stud"] }, "watchLater"],
    [{ watchClicks: { 1: { watch: "all" } } }, "watchClicks"],
  ] as const) {
    assert.throws(
      () => watchState(frontmatter, 0),
      new RegExp(`^Error: ${field}: .*set only with watch`),
      JSON.stringify(frontmatter),
    );
    assert.throws(() => tickTockState(frontmatter, 0), /set only with watch/);
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
    ["watchLater", []],
    ["watchLater", "stud"],
    ["watchAtRest", 1],
    ["watchAtRest", "true"],
    ["watchSpin", "90"],
    ["watchSpin", 0],
    ["watchSpin", -90],
    ["watchSpin", true],
    ["watchSpin", Number.POSITIVE_INFINITY],
    ["watchTickTock", true],
    ["watchTickTock", "loud"],
    ["watchRight", "489"],
    ["watchRight", true],
    ["watchRight", Number.NaN],
  ] as const) {
    assert.throws(
      () => watchState({ watch: "all", [field]: value }, 0),
      new RegExp(`^Error: ${field}:`),
      `${field}: ${String(value)}`,
    );
    // the same key in a click block, checked before its click
    assert.throws(
      () =>
        watchState({ watch: "all", watchClicks: { 3: { [field]: value } } }, 0),
      new RegExp(`^Error: watchClicks\\.3\\.${field}:`),
      `watchClicks.3.${field}: ${String(value)}`,
    );
  }
});

test("text delay and inverse inks belong only to their flash click", () => {
  const frontmatter = {
    watch: [
      "fourth wheel",
      "escape pinion",
      "fourth wheel span wash",
      "escape pinion span wash",
    ],
    watchClicks: {
      2: {
        watchFlash: ["escape pinion span wash"],
        watchFlashAfterText: true,
        watchFlashInverse: true,
      },
      3: {
        watchFlash: ["fourth wheel span wash"],
        watchFlashAfterText: true,
        watchFlashInverse: true,
      },
    },
  };
  for (const click of [2, 3]) {
    const state = watchState(frontmatter, click);
    assert.ok(state);
    assert.equal(state.flashAfterText, true);
    assert.equal(stageState(watch, state).flashInverse, true);
    const flashed = stageState(watch, state).flash;
    assert.ok(flashed);
    const pieceName =
      click === 2 ? "escape pinion span wash" : "fourth wheel span wash";
    assert.deepEqual(
      flashed,
      watch.scene.pieces.find((piece) => piece.name === pieceName)?.meshes,
    );
  }
  assert.equal(watchState(frontmatter, 4)?.flashAfterText, undefined);
  assert.equal(watchState(frontmatter, 4)?.flashInverse, undefined);
  assert.throws(
    () => watchState({ watch: "all", watchFlashAfterText: "yes" }, 0),
    /watchFlashAfterText/,
  );
  assert.throws(
    () => watchState({ watch: "all", watchFlashInverse: "yes" }, 0),
    /watchFlashInverse/,
  );
});

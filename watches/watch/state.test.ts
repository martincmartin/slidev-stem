// A slide's frontmatter to a watch state: what it accepts, and what it
// refuses with the field's name.

import assert from "node:assert/strict";
import { test } from "node:test";
import { generate, PICTURE_BAND } from "./generate.ts";
import {
  modelState,
  moveWithBefore,
  stageState,
  tickTockState,
  WATCH_DIM,
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
    band: "picture",
    flash: undefined,
    later: undefined,
    cut: undefined,
    goLater: undefined,
    settled: false,
    spin: null,
    mainspring: null,
    dim: null,
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
    band: "picture",
    flash: undefined,
    later: undefined,
    cut: undefined,
    goLater: undefined,
    settled: true,
    spin: null,
    mainspring: null,
    dim: null,
  });
});

test("watchDim dims pieces from its click on, until false; the stage gets their meshes at WATCH_DIM", () => {
  const frontmatter = {
    watch: ["hairspring", "collet", "stud"],
    watchClicks: { 1: { watchDim: ["stud"] }, 2: { watchDim: false } },
  };
  assert.equal(watchState(frontmatter, 0)?.dim, null);
  const dimmed = watchState(frontmatter, 1) ?? assert.fail();
  assert.deepEqual(dimmed.dim, ["stud"]);
  const stud = watch.scene.pieces.find((piece) => piece.name === "stud");
  assert.ok(stud);
  assert.deepEqual(
    stageState(watch, dimmed).dim,
    new Map([...stud.meshes].map((mesh) => [mesh, WATCH_DIM])),
  );
  assert.equal(watchState(frontmatter, 2)?.dim, null);
  assert.equal(
    stageState(watch, watchState(frontmatter, 2) ?? assert.fail()).dim,
    undefined,
  );
  assert.throws(
    () => watchState({ watch: ["stud"], watchDim: true }, 0),
    /watchDim/,
  );
  assert.throws(
    () => stageState(watch, { ...dimmed, dim: ["no such piece"] }),
    /watchDim/,
  );
});

test("watchLinger resolves its pieces and applies only at the declared click", () => {
  const frontmatter = {
    watch: ["mainspring", "barrel arbor"],
    watchLinger: [{ pieces: ["centre wheel drive"], seconds: 1 }],
  };
  const parsed = watchState(frontmatter, 0) ?? assert.fail();
  const arrow = watch.scene.pieces.find(
    (piece) => piece.name === "centre wheel drive",
  );
  assert.ok(arrow);
  assert.deepEqual(stageState(watch, parsed).linger, [
    {
      meshes: arrow.meshes,
      seconds: 1,
    },
  ]);
  assert.equal(watchState(frontmatter, 1)?.linger, undefined);
  for (const value of [null, {}, []]) {
    assert.throws(
      () => watchState({ ...frontmatter, watchLinger: value }, 0),
      /watchLinger/,
    );
  }
  assert.throws(
    () =>
      stageState(watch, {
        ...parsed,
        linger: [{ pieces: ["unknown"], seconds: 1 }],
      }),
    /watchLinger/,
  );
  for (const value of [
    null,
    true,
    {},
    { pieces: [], seconds: 1 },
    { pieces: ["centre wheel drive"], seconds: "1" },
    ...[0, -1, Infinity, Number.NaN].map((seconds) => ({
      pieces: ["centre wheel drive"],
      seconds,
    })),
    { pieces: ["centre wheel drive"], seconds: 1, extra: true },
  ]) {
    assert.throws(
      () => watchState({ ...frontmatter, watchLinger: [value] }, 0),
      /watchLinger/,
    );
  }
});

test("a flash is of one click: the slide's at click 0, a block's at its click", () => {
  const frontmatter = {
    watch: "all",
    watchFlash: ["balance wheel"],
    watchClicks: {
      1: { watchTilt: 20 },
      2: { watchFlash: ["third wheel", ["third arbor"]], watchLater: ["lug"] },
      3: { watchTilt: 0, watchFlash: ["centre wheel"], watchCut: ["stud"] },
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
  // and which pieces go at once
  assert.deepEqual(
    [2, 3, 4].map((clicks) => watchState(frontmatter, clicks)?.cut),
    [undefined, ["stud"], undefined],
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
      3: { watchAtRest: false, watchTickTock: true },
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
    [false, false, false, true, true, false],
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
  // shows: the drive arrows, the Gears slide's spans, the Gear Train slide's
  // one-step wheel and raised strap, the Spring Of Power slide's props, and the
  // motion works with the Hour Hand slide's one-step hour wheel
  const marks = watch.scene.pieces.filter((piece) => !piece.inAll);
  assert.deepEqual(marks.map((piece) => piece.name).sort(), [
    "cannon pinion",
    "centre wheel drive",
    "escape pinion span",
    "escape pinion span plain",
    "escape pinion span wash",
    "escape wheel drive",
    "fourth wheel drive",
    "fourth wheel span",
    "fourth wheel span plain",
    "fourth wheel span wash",
    "hour wheel",
    "mainspring rest",
    "mainspring stud",
    "minute arbor",
    "minute pinion",
    "minute wheel",
    "one-step hour hand",
    "one-step hour wheel",
    "one-step wheel",
    "raised strap",
    "third wheel drive",
    "winding key",
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
    [{ watchTickTock: true }, "watchTickTock"],
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
    ["watchCut", []],
    ["watchCut", "stud"],
    ["watchAtRest", 1],
    ["watchAtRest", "true"],
    ["watchSpin", "90"],
    ["watchSpin", 0],
    ["watchSpin", -90],
    ["watchSpin", true],
    ["watchSpin", Number.POSITIVE_INFINITY],
    ["watchTickTock", "plain"],
    ["watchTickTock", 1],
    ["watchRight", "489"],
    ["watchRight", true],
    ["watchRight", Number.NaN],
    ["watchBand", "page"],
    ["watchBand", 1],
    ["watchMainspring", "wound up"],
    ["watchMainspring", true],
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

test("the Spring Of Power slide's stage says when the watch runs: only in the barrel, wound", () => {
  const frontmatter = {
    watch: ["mainspring", "barrel arbor"],
    watchMainspring: "free",
    watchClicks: {
      2: { watchMainspring: "wound" },
      4: { watch: "all", watchMainspring: "barrel" },
      5: { watchMainspring: "run down" },
    },
  };
  const at = (click: number) => watchState(frontmatter, click) ?? assert.fail();
  assert.equal(at(0).mainspring, "free");
  assert.equal(at(3).mainspring, "wound");
  assert.deepEqual(
    [0, 2, 4, 5].map((click) => at(click).settled),
    [true, true, false, true],
  );
  assert.deepEqual(modelState(at(4)), {
    settled: false,
    spin: null,
    mainspring: "barrel",
  });
  // the story says when the balance swings: watchAtRest would say it twice
  assert.throws(
    () =>
      watchState(
        { ...frontmatter, watchClicks: { 1: { watchAtRest: true } } },
        1,
      ),
    /^Error: watchAtRest: true should be left out where watchMainspring is set/,
  );
});

test("watchBand: slide fits the slide's height, with the picture band's bottom margin at both ends", () => {
  const pieces = ["barrel", "balance wheel"];
  const view = (band: string) =>
    stageState(
      watch,
      watchState({ watch: pieces, watchBand: band }, 0) ?? assert.fail(),
    ).view;
  const picture = view("picture");
  const slide = view("slide");
  const [, height] = watch.scene.slide;
  // the same bottom margin; the slide band is taller by the room under the
  // subtitle less one margin
  const margin = height - PICTURE_BAND.bottom;
  assert.ok(Math.abs(margin - 14.47) < 1e-9);
  // at tilt 0 the plan is what shows: the scales go as the bands' heights
  assert.ok(
    Math.abs(
      slide.scale / picture.scale -
        (height - 2 * margin) / (PICTURE_BAND.bottom - PICTURE_BAND.top),
    ) < 1e-9,
  );
  assert.throws(
    () =>
      watchState({ watch: pieces, watchView: "cover", watchBand: "slide" }, 0),
    /^Error: watchBand: "slide" should be set only with a fitted view/,
  );
});

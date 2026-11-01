// A slide's frontmatter to a watch state: what it accepts, and what it
// refuses with the field's name.

import assert from "node:assert/strict";
import { test } from "node:test";
import { generate, PICTURE_BAND } from "./generate.ts";
import {
  modelState,
  MOVE_WITH_COMMON,
  moveWithBefore,
  stageState,
  stepMove,
  tickTockState,
  timeScaleState,
  WATCH_DIM,
  watchState,
} from "./state.ts";

const watch = generate();

test("a slide without watch has no state", () => {
  assert.equal(watchState({}, 0), undefined);
});

test("the fields and their defaults", () => {
  assert.deepEqual(watchState({ art: "all" }, 0), {
    view: null,
    tilt: null,
    turn: null,
    show: "all",
    fit: "all",
    right: null,
    band: "picture",
    flash: undefined,
    flashAfterMove: false,
    later: undefined,
    cut: undefined,
    goLater: undefined,
    settled: false,
    spin: null,
    mainspring: null,
    dim: null,
    hide: null,
    lapse: 1,
    unwind: false,
    wind: false,
    move: "ordered",
    moveSeconds: null,
  });
  const frontmatter = {
    art: ["hairspring", "collet", "stud"],
    artView: "hairspring",
    artTilt: 20,
    artFlash: ["balance wheel"],
    artClicks: { 1: { watchAtRest: true } },
  };
  assert.equal(watchState(frontmatter, 0)?.settled, false);
  assert.deepEqual(watchState(frontmatter, 0)?.flash, ["balance wheel"]);
  assert.deepEqual(watchState(frontmatter, 1), {
    view: "hairspring",
    tilt: 20,
    turn: null,
    show: ["hairspring", "collet", "stud"],
    fit: ["hairspring", "collet", "stud"],
    right: null,
    band: "picture",
    flash: undefined,
    flashAfterMove: false,
    later: undefined,
    cut: undefined,
    goLater: undefined,
    settled: true,
    spin: null,
    mainspring: null,
    dim: null,
    hide: null,
    lapse: 1,
    unwind: false,
    wind: false,
    move: "ordered",
    moveSeconds: null,
  });
});

test("artDim dims pieces from its click on, until false; the stage gets their meshes at WATCH_DIM", () => {
  const frontmatter = {
    art: ["hairspring", "collet", "stud"],
    artClicks: { 1: { artDim: ["stud"] }, 2: { artDim: false } },
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
  assert.throws(() => watchState({ art: ["stud"], artDim: true }, 0), /artDim/);
  assert.throws(
    () => stageState(watch, { ...dimmed, dim: ["no such piece"] }),
    /artDim/,
  );
});

test("artHide leaves pieces of watch out from its click on, until false, and out of a fitted view", () => {
  const frontmatter = {
    art: ["all", "hour wheel"],
    artClicks: {
      1: { artHide: ["hour hand"] },
      2: { artHide: ["hour hand", "minute hand"] },
      3: { artHide: false },
    },
  };
  const piece = (name: string) =>
    watch.scene.pieces.find((each) => each.name === name) ?? assert.fail(name);
  const hourHand = piece("hour hand");
  const minuteHand = piece("minute hand");
  const shownAt = (click: number) =>
    stageState(watch, watchState(frontmatter, click) ?? assert.fail()).shown;
  const showsPiece = (click: number, shown: typeof hourHand) =>
    [...shown.meshes].every((mesh) => shownAt(click).has(mesh));
  assert.equal(watchState(frontmatter, 0)?.hide, null);
  assert.deepEqual(watchState(frontmatter, 1)?.hide, ["hour hand"]);
  assert.ok(showsPiece(0, hourHand) && showsPiece(0, minuteHand));
  assert.ok(!showsPiece(1, hourHand) && showsPiece(1, minuteHand));
  assert.ok(!showsPiece(2, hourHand) && !showsPiece(2, minuteHand));
  assert.ok(showsPiece(3, hourHand) && showsPiece(3, minuteHand));
  assert.ok(showsPiece(1, piece("hour wheel")));
  assert.equal(
    shownAt(1).size,
    shownAt(0).size - hourHand.meshes.size,
    "only the hidden piece goes",
  );
  // a fitted view of the shown pieces does not fit a hidden one
  const fitted = (hide: readonly string[] | null) =>
    stageState(watch, {
      ...(watchState({ art: ["hour hand", "stud"] }, 0) ?? assert.fail()),
      hide,
    }).view;
  assert.deepEqual(
    fitted(["hour hand"]),
    stageState(watch, watchState({ art: ["stud"] }, 0) ?? assert.fail()).view,
  );
  assert.notDeepEqual(fitted(null), fitted(["hour hand"]));
  assert.throws(
    () => watchState({ art: "all", artHide: true }, 0),
    /^Error: artHide:/,
  );
  assert.throws(
    () =>
      stageState(
        watch,
        watchState({ art: ["stud"], artHide: ["hour hand"] }, 0) ??
          assert.fail(),
      ),
    /^Error: artHide: "hour hand" is not in art/,
  );
  assert.throws(
    () =>
      stageState(
        watch,
        watchState({ art: "all", artHide: ["no such piece"] }, 0) ??
          assert.fail(),
      ),
    /^Error: artHide: no watch piece/,
  );
});

test("artLinger resolves its pieces and applies only at the declared click", () => {
  const frontmatter = {
    art: ["mainspring", "barrel arbor"],
    artLinger: [{ pieces: ["centre wheel drive"], seconds: 1 }],
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
      () => watchState({ ...frontmatter, artLinger: value }, 0),
      /artLinger/,
    );
  }
  assert.throws(
    () =>
      stageState(watch, {
        ...parsed,
        linger: [{ pieces: ["unknown"], seconds: 1 }],
      }),
    /artLinger/,
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
      () => watchState({ ...frontmatter, artLinger: [value] }, 0),
      /artLinger/,
    );
  }
});

test("artFlashAfterMove carries to later clicks and resolves to the stage", () => {
  const frontmatter = {
    art: "all",
    artFlashAfterMove: true,
    artClicks: { 2: { artFlashAfterMove: false } },
  };
  for (const click of [0, 1, 2, 3]) {
    const parsed = watchState(frontmatter, click) ?? assert.fail();
    assert.equal(parsed.flashAfterMove, click < 2);
    assert.equal(stageState(watch, parsed).flashAfterMove, click < 2);
  }
  assert.throws(
    () => watchState({ art: "all", artFlashAfterMove: "true" }, 0),
    /artFlashAfterMove/,
  );
});

test("a flash is of one click: the slide's at click 0, a block's at its click", () => {
  const frontmatter = {
    art: "all",
    artFlash: ["balance wheel"],
    artClicks: {
      1: { artTilt: 20 },
      2: { artFlash: ["third wheel", ["third arbor"]], artLater: ["lug"] },
      3: { artTilt: 0, artFlash: ["centre wheel"], artCut: ["stud"] },
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
    art: "all",
    watchSpin: 45,
    artClicks: {
      1: { watchSpin: false, watchAtRest: true },
      2: { watchSpin: 120, artTilt: 20 },
      3: { watchAtRest: false, watchTickTock: true, watchTimeScale: true },
      5: { watchTickTock: false },
      4: { watchTimeScale: false },
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
    [null, null, 20, 20, 20, 20],
  );
  assert.deepEqual(
    clicks.map((click) => tickTockState(frontmatter, click)),
    [false, false, false, true, true, false],
  );
  assert.deepEqual(
    clicks.map((click) => timeScaleState(frontmatter, click)),
    [false, false, false, true, false, false],
  );
  // a block that says what is already so changes nothing
  assert.equal(
    watchState({ art: "all", artClicks: { 2: { watchAtRest: false } } }, 3)
      ?.settled,
    false,
  );
});

test("artClicks changes what shows from its click on; the camera stays on artView", () => {
  const gears = ["fourth wheel", "escape pinion"];
  const frontmatter = {
    art: gears,
    artView: gears,
    // a list may hold lists (YAML aliases), and a name twice shows once
    artClicks: {
      3: { art: [gears, "pallet fork", "escape wheel"] },
      1: { art: [gears, "escape wheel", "escape pinion"] },
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
  // without artView, the view fits what shows, so it moves
  const moving = { art: gears, artClicks: frontmatter.artClicks };
  const fitted = (clicks: number) =>
    stageState(watch, watchState(moving, clicks) ?? assert.fail()).view;
  assert.notDeepEqual(fitted(3), fitted(0));
  // a click can change the frame too: here, to a named view
  const named = {
    art: gears,
    artClicks: { 2: { artView: "hairspring" } },
  };
  assert.equal(watchState(named, 1)?.view, null);
  assert.equal(watchState(named, 2)?.view, "hairspring");
});

test("artClicks and artView refuse what they cannot hold, with the key's name", () => {
  for (const [frontmatter, field] of [
    [{ artClicks: [{ art: "all" }] }, "artClicks"],
    [{ artClicks: { one: { art: "all" } } }, "artClicks"],
    [{ artClicks: { "-1": { art: "all" } } }, "artClicks"],
    [{ artClicks: { 1.5: { art: "all" } } }, "artClicks"],
    [{ artClicks: { 1: ["escape wheel"] } }, "artClicks.1"],
    [{ artClicks: { 1: {} } }, "artClicks.1"],
    [{ artClicks: { 1: { artMoveWith: "all" } } }, "artClicks.1"],
    // a block is checked before its click comes
    [{ artClicks: { 5: { art: [] } } }, "artClicks.5.art"],
    [{ artClicks: { 5: { artView: 3 } } }, "artClicks.5.artView"],
    [{ artView: [] }, "artView"],
    [{ artView: [[]] }, "artView"],
  ] as const) {
    assert.throws(
      () => watchState({ art: "all", ...frontmatter }, 0),
      new RegExp(`^Error: ${field.replaceAll(".", "\\.")}:`),
      JSON.stringify(frontmatter),
    );
  }
});

test("a slide shows the meshes of its pieces, or all but the marks, in its named or fitted view", () => {
  const named = stageState(
    watch,
    watchState({ art: ["stud"], artView: "hairspring" }, 0) ?? assert.fail(),
  );
  assert.equal(named.view.name, "hairspring");
  assert.equal(named.shown.size, 1);
  const all = stageState(watch, watchState({ art: "all" }, 0) ?? assert.fail());
  // every mesh but those of the pieces that only a slide that names them
  // shows: the drive arrows, the Gears slide's spans, the Gear Train slide's
  // one-step wheel and raised strap, the Mainspring slide's props, and the
  // motion works with the Hour Hand slide's one-step hour wheel
  const marks = watch.scene.pieces.filter((piece) => !piece.inAll);
  assert.deepEqual(marks.map((piece) => piece.name).sort(), [
    "cannon pinion",
    "centre wheel drive",
    "escape pinion span",
    "escape pinion span plain",
    "escape wheel drive",
    "fourth wheel drive",
    "fourth wheel span",
    "fourth wheel span plain",
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
    watchState({ art: ["fourth wheel", "escape pinion"] }, 0) ?? assert.fail(),
  );
  assert.equal(fitted.view.name, "fourth wheel, escape pinion");
  assert.equal(fitted.moveWith, "common");
  for (const [frontmatter, error] of [
    [{ art: ["no such piece"] }, /^Error: art: no watch piece "no such piece"/],
    [
      { art: ["stud"], artFlash: ["nor this"] },
      /^Error: artFlash: no watch piece/,
    ],
    [{ art: ["stud"], artView: "nowhere" }, /^Error: artView: no watch view/],
  ] as const) {
    assert.throws(
      () => stageState(watch, watchState(frontmatter, 0) ?? assert.fail()),
      error,
    );
  }
});

test("artRight puts a fitted view's right edge there, and needs a fitted view", () => {
  const pieces = ["fourth wheel", "escape pinion"];
  const right = (frontmatter: Record<string, unknown>): number => {
    const { view } = stageState(
      watch,
      watchState({ art: pieces, ...frontmatter }, 0) ?? assert.fail(),
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
  assert.ok(Math.abs(right({ artRight: 489 }) - 489) < 1e-9);
  assert.ok(Math.abs(right({}) - 489) > 1);
  assert.throws(
    () => watchState({ art: pieces, artView: "hairspring", artRight: 489 }, 0),
    /^Error: artRight: .*set only with a fitted view/,
  );
});

test("artTurn turns a named view's camera, and a fitted view refuses it", () => {
  const turned = { art: "all", artView: "cover", artTurn: 90 };
  const state = watchState(turned, 0) ?? assert.fail();
  assert.equal(state.turn, 90);
  assert.equal(stageState(watch, state).turn, 90);
  assert.throws(
    () => watchState({ art: "all", artTurn: 90 }, 0),
    /^Error: artTurn: .*set only with a named view/,
  );
  // turn 0 is the default, so a fitted view may say it
  assert.equal(watchState({ art: "all", artTurn: 0 }, 0)?.turn, 0);
  assert.throws(
    () => watchState({ art: "all", artView: "cover", artTurn: "90" }, 0),
    /^Error: artTurn/,
  );
});

test("artMoveWith names what shows while the camera moves into the slide", () => {
  assert.deepEqual(moveWithBefore({ art: "all" }), MOVE_WITH_COMMON);
  for (const value of ["common", "all", "none"]) {
    assert.deepEqual(moveWithBefore({ art: "all", artMoveWith: value }), {
      rule: value,
      also: [],
    });
  }
  assert.throws(
    () => watchState({ art: "all", artMoveWith: "some" }, 0),
    /^Error: artMoveWith:/,
  );
  assert.throws(
    () => watchState({ artMoveWith: "all" }, 0),
    /set only with art/,
  );
});

test("artMoveAlso names pieces that also show while the camera moves into the slide", () => {
  const moveWith = moveWithBefore({
    art: "all",
    artMoveAlso: ["hour hand", "minute hand"],
  });
  assert.deepEqual(moveWith, {
    rule: "common",
    also: ["hour hand", "minute hand"],
  });
  const hands = watch.scene.pieces.filter((piece) =>
    ["hour hand", "minute hand"].includes(piece.name),
  );
  assert.equal(hands.length, 2);
  assert.deepEqual(
    stageState(watch, watchState({ art: "all" }, 0) ?? assert.fail(), moveWith)
      .moveAlso,
    new Set(hands.flatMap((piece) => [...piece.meshes])),
  );
  assert.throws(
    () => moveWithBefore({ art: "all", artMoveAlso: "hour hand" }),
    /^Error: artMoveAlso:/,
  );
  assert.throws(
    () =>
      moveWithBefore({
        art: "all",
        artMoveWith: "all",
        artMoveAlso: ["hour hand"],
      }),
    /^Error: artMoveAlso:.*artMoveWith: all/,
  );
  assert.throws(
    () => moveWithBefore({ artMoveAlso: ["hour hand"] }),
    /^Error: artMoveAlso:.*set only with art/,
  );
  assert.throws(
    () =>
      stageState(watch, watchState({ art: "all" }, 0) ?? assert.fail(), {
        rule: "common",
        also: ["no such piece"],
      }),
    /^Error: artMoveAlso:/,
  );
});

test("a key that a click can change needs watch on the slide", () => {
  for (const [frontmatter, field] of [
    [{ watchSpin: 45 }, "watchSpin"],
    [{ watchAtRest: true }, "watchAtRest"],
    [{ watchTickTock: true }, "watchTickTock"],
    [{ watchTimeScale: true }, "watchTimeScale"],
    [{ artRight: 489 }, "artRight"],
    [{ artFlash: ["stud"] }, "artFlash"],
    [{ artLater: ["stud"] }, "artLater"],
    [{ artClicks: { 1: { art: "all" } } }, "artClicks"],
  ] as const) {
    assert.throws(
      () => watchState(frontmatter, 0),
      new RegExp(`^Error: ${field}: .*set only with art`),
      JSON.stringify(frontmatter),
    );
    assert.throws(() => tickTockState(frontmatter, 0), /set only with art/);
    assert.throws(() => timeScaleState(frontmatter, 0), /set only with art/);
  }
});

test("a field of the wrong kind throws, with its name", () => {
  for (const [field, value] of [
    ["art", ""],
    ["art", 3],
    ["artTilt", "20"],
    ["artTilt", ""],
    ["artTilt", true],
    ["artTilt", Number.NaN],
    ["art", "stud"],
    ["art", []],
    ["art", [""]],
    ["artView", ""],
    ["artView", 1],
    ["artFlash", ""],
    ["artFlash", 2],
    ["artFlash", "stud"],
    ["artLater", []],
    ["artLater", "stud"],
    ["artCut", []],
    ["artCut", "stud"],
    ["watchAtRest", 1],
    ["watchAtRest", "true"],
    ["watchSpin", "90"],
    ["watchSpin", 0],
    ["watchSpin", -90],
    ["watchSpin", true],
    ["watchSpin", Number.POSITIVE_INFINITY],
    ["watchTickTock", "plain"],
    ["watchTickTock", 1],
    ["watchTimeScale", "yes"],
    ["watchTimeScale", 1],
    ["artRight", "489"],
    ["artRight", true],
    ["artRight", Number.NaN],
    ["artBand", "page"],
    ["artBand", 1],
    ["watchMainspring", "wound up"],
    ["watchMainspring", true],
  ] as const) {
    assert.throws(
      () => watchState({ art: "all", [field]: value }, 0),
      new RegExp(`^Error: ${field}:`),
      `${field}: ${String(value)}`,
    );
    // the same key in a click block, checked before its click
    assert.throws(
      () => watchState({ art: "all", artClicks: { 3: { [field]: value } } }, 0),
      new RegExp(`^Error: artClicks\\.3\\.${field}:`),
      `artClicks.3.${field}: ${String(value)}`,
    );
  }
});

test("the Mainspring slide's stage says when the watch runs: only in the barrel, wound", () => {
  const frontmatter = {
    art: ["mainspring", "barrel arbor"],
    watchMainspring: "free",
    artClicks: {
      2: { watchMainspring: "wound" },
      4: { art: "all", watchMainspring: "barrel" },
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
    lapse: 1,
    unwind: false,
    wind: false,
  });
  // the story says when the balance swings: watchAtRest would say it twice
  assert.throws(
    () =>
      watchState(
        { ...frontmatter, artClicks: { 1: { watchAtRest: true } } },
        1,
      ),
    /^Error: watchAtRest: true should be left out where watchMainspring is set/,
  );
});

test("artBand: slide fits the slide's height, with the picture band's bottom margin at both ends", () => {
  const pieces = ["barrel", "balance wheel"];
  const view = (band: string) =>
    stageState(
      watch,
      watchState({ art: pieces, artBand: band }, 0) ?? assert.fail(),
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
    () => watchState({ art: pieces, artView: "cover", artBand: "slide" }, 0),
    /^Error: artBand: "slide" should be set only with a fitted view/,
  );
});

test("artMoveSeconds sets a move's time, only for a move together or fly", () => {
  const frontmatter = {
    art: "all",
    artView: "cover",
    artMove: "fly",
    artMoveSeconds: 7,
  };
  const state = watchState(frontmatter, 0) ?? assert.fail();
  assert.equal(state.moveSeconds, 7);
  assert.equal(stageState(watch, state).moveSeconds, 7);
  assert.equal(
    stageState(watch, watchState({ art: "all" }, 0) ?? assert.fail())
      .moveSeconds,
    undefined,
  );
  assert.throws(
    () => watchState({ art: "all", artMoveSeconds: 7 }, 0),
    /artMoveSeconds.*together or fly/,
  );
  assert.throws(
    () => watchState({ ...frontmatter, artMoveSeconds: 0 }, 0),
    /more than 0/,
  );
  // a step's own: the next click's move takes its own time, either way
  const steps = {
    art: "all",
    artView: "cover",
    artMove: "fly",
    artClicks: { 1: { artMoveSeconds: 7 }, 2: { artView: "hairspring" } },
  };
  const [first, second, third] = [0, 1, 2].map(
    (click) => watchState(steps, click) ?? assert.fail(),
  );
  assert.ok(first && second && third);
  assert.equal(second.moveSeconds, 7);
  assert.equal(third.moveSeconds, null);
  assert.equal(stepMove(first, second, "forward").moveSeconds, 7);
  assert.equal(stepMove(second, first, "back").moveSeconds, 7);
  assert.equal(stepMove(second, third, "forward").moveSeconds, null);
});

test("a named view with angles gives them to a slide that sets none", () => {
  const cover =
    watch.scene.views.find((view) => view.name === "cover") ?? assert.fail();
  const angled = { ...cover, name: "angled", angles: { tilt: 35, turn: 80 } };
  const withAngles = {
    ...watch,
    scene: { ...watch.scene, views: [...watch.scene.views, angled] },
  };
  const own = watchState({ art: "all", artView: "angled" }, 0) ?? assert.fail();
  const stage = stageState(withAngles, own);
  assert.equal(stage.tilt, 35);
  assert.equal(stage.turn, 80);
  const set =
    watchState({ art: "all", artView: "angled", artTilt: 10 }, 0) ??
    assert.fail();
  assert.equal(stageState(withAngles, set).tilt, 10);
  assert.equal(stageState(withAngles, set).turn, 80);
  // a view without angles: 0
  assert.equal(
    stageState(watch, watchState({ art: "all" }, 0) ?? assert.fail()).tilt,
    0,
  );
});

test("watchLapse, artMove, and all in a list of pieces", () => {
  const frontmatter = {
    art: ["all", "hour wheel"],
    artView: "recap motion works",
    watchLapse: 1440,
    artMove: "together",
    artClicks: { 1: { watchLapse: 2 } },
  };
  const first = watchState(frontmatter, 0) ?? assert.fail();
  assert.equal(first.lapse, 1440);
  assert.equal(first.move, "together");
  assert.equal(watchState(frontmatter, 1)?.lapse, 2);
  assert.equal(watchState(frontmatter, 1)?.move, "together");
  assert.equal(modelState(first).lapse, 1440);
  const stage = stageState(watch, first);
  assert.equal(stage.move, "together");
  // all that `all` shows, and the hour wheel, which `all` leaves out
  const all = stageState(
    watch,
    watchState({ art: "all" }, 0) ?? assert.fail(),
  ).shown;
  const hourWheel =
    watch.scene.pieces.find((piece) => piece.name === "hour wheel") ??
    assert.fail();
  assert.deepEqual(stage.shown, new Set([...all, ...hourWheel.meshes]));
  for (const [key, value] of [
    ["watchLapse", 0.5],
    ["watchLapse", "fast"],
    ["artMove", "sideways"],
  ] as const) {
    assert.throws(
      () => watchState({ art: "all", [key]: value }, 0),
      new RegExp(`^Error: ${key}`),
    );
  }
  // the lapse moves the train its own way: not with a spin, the story, or a
  // balance at rest
  for (const other of [
    { watchSpin: 135 },
    { watchMainspring: "barrel" },
    { watchAtRest: true },
  ]) {
    assert.throws(
      () => watchState({ art: "all", watchLapse: 2, ...other }, 0),
      /^Error: watchLapse/,
    );
  }
});

test("a key that starts with art or watch and is not a key throws, with its name", () => {
  for (const key of ["watch", "watchView", "artVeiw", "watchClicks"]) {
    assert.throws(
      () => watchState({ art: "all", [key]: "cover" }, 0),
      new RegExp(`^Error: ${key}: no such key`),
    );
  }
  // other keys of the slide are not the stage's
  assert.ok(watchState({ art: "all", artwork: 1, watchful: 1 }, 0));
});

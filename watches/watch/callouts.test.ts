import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import type { Point2 } from "../webgl/mesh.ts";
import {
  escapementMarks,
  firstCrossing,
  gearsMarks,
  jewelStrikes,
  onSlide,
} from "./callouts.ts";
import { slideFrontmatter } from "./deck.ts";
import { generate, JEWEL_FLAT_OFFSET, JEWEL_RADIUS } from "./generate.ts";
import { tickWindows } from "./model.ts";
import { polar } from "./shapes.ts";
import { stageState, watchState } from "./state.ts";

const watch = generate();
const { design, scene } = watch;
const ESCAPEMENT_SLIDE = await slideFrontmatter("Escapement");
const marks = escapementMarks(watch, ESCAPEMENT_SLIDE);
const GEARS_SLIDE = await slideFrontmatter("Gears");
const { view } = stageState(
  watch,
  watchState(ESCAPEMENT_SLIDE, 0) ?? assert.fail("no watch"),
);

test("onSlide is the view's zoom and shift, and a tilt lifts a higher point", () => {
  const point: [number, number, number] = [700, 150, 5];
  const [x, y] = onSlide(view, { tilt: 0, turn: 0 }, scene.slide, point);
  assert.ok(Math.abs(x - (view.scale * 700 + view.shift[0])) < 1e-3);
  assert.ok(Math.abs(y - (view.scale * 150 + view.shift[1])) < 1e-3);
  const low = onSlide(view, { tilt: 20, turn: 0 }, scene.slide, [700, 150, 0]);
  const high = onSlide(
    view,
    { tilt: 20, turn: 0 },
    scene.slide,
    [700, 150, 10],
  );
  assert.ok(high[1] < low[1]);
});

test("the callouts' marks are on the slide, in the escapement's order from left to right", () => {
  for (const point of [marks.jewel, marks.pallet, marks.escape]) {
    assert.ok(point[0] > 0 && point[0] < at(scene.slide, 0));
    assert.ok(point[1] > 0 && point[1] < at(scene.slide, 1));
  }
  assert.ok(marks.jewel[0] < marks.pallet[0]);
  assert.ok(marks.pallet[0] < marks.escape[0]);
});

test("a leader from below to the pallet's aim meets the fork at both ends of its swing", () => {
  const below: Point2 = [marks.pallet[0], at(scene.slide, 1)];
  assert.equal(marks.forkOutlines.length, 2);
  for (const outline of marks.forkOutlines) {
    assert.notEqual(firstCrossing(below, marks.pallet, [outline]), undefined);
  }
});

test("the escapement's tops are the tops of their parts' meshes", () => {
  // a part's meshes are in the drawing's order: the body first
  const top = (part: string, index: number): number => {
    const mesh = scene.meshes.filter((each) => each.part === part)[index];
    assert.ok(mesh, part);
    return Math.max(
      ...Array.from({ length: mesh.triangles.length / 3 }, (_, vertex) =>
        at(mesh.triangles, 3 * vertex + 2),
      ),
    );
  };
  assert.equal(watch.escapementTops.escape, top("escape wheel", 0));
  assert.equal(watch.escapementTops.fork, top("pallet fork", 0));
  assert.equal(watch.escapementTops.jewel, top("impulse jewel", 0));
  assert.equal(watch.gearsTop, top("fourth wheel", 0));
});

test("the Gears slide's marks: the small gear above the big one, each inside its tip circle, on the slide", () => {
  const gears = gearsMarks(watch, GEARS_SLIDE);
  assert.ok(gears.pinion[1] < gears.wheel[1]);
  const reach = (centre: Point2, tips: readonly Point2[]): number =>
    Math.max(
      ...tips.map((tip) => Math.hypot(tip[0] - centre[0], tip[1] - centre[1])),
    );
  assert.ok(reach(gears.pinion, gears.pinionTips) > 0);
  assert.ok(
    reach(gears.pinion, gears.pinionTips) < reach(gears.wheel, gears.wheelTips),
  );
  for (const point of [...gears.pinionTips, ...gears.wheelTips]) {
    assert.ok(point[0] > 0 && point[0] < at(scene.slide, 0));
    assert.ok(point[1] > 0 && point[1] < at(scene.slide, 1));
  }
});

test("a fitted view tilts about its pieces' middle: the middle stays where it is, at any tilt", () => {
  const [, still] = onSlide(
    view,
    { tilt: 0, turn: 0 },
    scene.slide,
    view.pivot,
  );
  for (const tilt of [20, 45]) {
    const [, y] = onSlide(view, { tilt, turn: 0 }, scene.slide, view.pivot);
    assert.ok(Math.abs(y - still) < 1e-3, `tilt ${String(tilt)}`);
  }
});

test("the two strikes are on either side of the fork's axis, and their words go out as mirror images", () => {
  const strikes = jewelStrikes(watch, ESCAPEMENT_SLIDE);
  const [upper, lower] = [...strikes].sort(
    (first, second) => first.at[1] - second.at[1],
  );
  assert.ok(upper && lower);
  // the fork's notch is right of the balance: the words lean left, away
  // from the fork; the upper one goes up (NNW), the lower one down (SSW)
  assert.ok(upper.away[0] < 0 && upper.away[1] < 0);
  assert.ok(lower.away[0] < 0 && lower.away[1] > 0);
  for (const strike of strikes) {
    assert.ok(Math.abs(Math.hypot(...strike.away) - 1) < 1e-9);
    // 22.5 degrees from straight up or down, give or take the view's tilt
    const lean =
      (Math.atan2(Math.abs(strike.away[0]), Math.abs(strike.away[1])) * 180) /
      Math.PI;
    assert.ok(Math.abs(lean - 22.5) < 3, String(lean));
  }
  // the jewel at rest is between the two strikes
  assert.ok(upper.at[1] < marks.jewel[1] && marks.jewel[1] < lower.at[1]);
});

test("each window's strike is at the horn ahead of the jewel, not where it enters", () => {
  const { timing } = design;
  const radius =
    design.balance.impulsePinRadius + (JEWEL_FLAT_OFFSET - JEWEL_RADIUS) / 2;
  const arbor: Point2 = [
    design.watchCentre[0] + design.balance.arbor[0],
    design.watchCentre[1] + design.balance.arbor[1],
  ];
  // the jewel on the slide at mechanism time `time`, as the model swings it
  const jewelAt = (time: number): Point2 => {
    const swing =
      timing.amplitude * Math.cos((2 * Math.PI * time) / timing.period);
    const [x, y] = polar(radius, design.balance.pinDirection + swing, arbor);
    return onSlide(view, { tilt: 20, turn: 0 }, scene.slide, [
      x,
      y,
      watch.escapementTops.jewel,
    ]);
  };
  const strikes = jewelStrikes(watch, ESCAPEMENT_SLIDE);
  tickWindows(timing).forEach(([start], window) => {
    const time = start * timing.period;
    const [from, to] = [jewelAt(time), jewelAt(time + 0.01)];
    const ahead = at(strikes, window).at;
    const behind = at(strikes, 1 - window).at;
    const moving = (to[1] - from[1]) * (ahead[1] - behind[1]);
    assert.ok(moving > 0, `window ${String(window)}`);
  });
});

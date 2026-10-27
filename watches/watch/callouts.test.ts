import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import type { Point2 } from "../webgl/mesh.ts";
import {
  distanceToOutline,
  escapementMarks,
  firstCrossing,
  gearsMarks,
  forkAtBanks,
  onSlide,
  stoneStrikes,
  toothDrops,
} from "./callouts.ts";
import { slideFrontmatter } from "./deck.ts";
import { generate } from "./generate.ts";
import { Motion, tickWindows } from "./model.ts";
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

test("the two strikes are on either side of the escape wheel's arbor, and their words go straight out from it", () => {
  const strikes = stoneStrikes(watch, ESCAPEMENT_SLIDE);
  const [upper, lower] = [...strikes].sort(
    (first, second) => first.at[1] - second.at[1],
  );
  assert.ok(upper && lower);
  // the pallet is left of the escape wheel: the upper word goes up and
  // left (NW), the lower one down and left (SW)
  assert.ok(upper.away[0] < 0 && upper.away[1] < 0);
  assert.ok(lower.away[0] < 0 && lower.away[1] > 0);
  for (const strike of strikes) {
    assert.ok(Math.abs(Math.hypot(...strike.away) - 1) < 1e-9);
    // along the line from the wheel's arbor through the strike
    const out: Point2 = [
      strike.at[0] - marks.escape[0],
      strike.at[1] - marks.escape[1],
    ];
    const across = out[0] * strike.away[1] - out[1] * strike.away[0];
    assert.ok(Math.abs(across) < 1e-6 * Math.hypot(...out), String(across));
    assert.ok(out[0] * strike.away[0] + out[1] * strike.away[1] > 0);
  }
  assert.ok(upper.at[1] < marks.escape[1] && marks.escape[1] < lower.at[1]);
});

test("each window's strike is where a tooth lands on the stone that the window swung in", () => {
  const { timing } = design;
  const motion = new Motion(watch);
  const banks = forkAtBanks(design);
  const drops = toothDrops(design);
  tickWindows(timing).forEach(([, end], window) => {
    const name = `window ${String(window)}`;
    // the train has stepped one beat at the window's end
    assert.equal(motion.beats(end * timing.period), window + 1, name);
    const drop = at(drops, window);
    // the tooth touches the stone that the window swung in, and was clear
    // of it before the swing
    assert.ok(distanceToOutline(drop, at(banks, window)) < 0.01, name);
    assert.ok(distanceToOutline(drop, at(banks, 1 - window)) > 0.5, name);
  });
});

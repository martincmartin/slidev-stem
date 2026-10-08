import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import type { Point2 } from "../webgl/mesh.ts";
import type { Wheel } from "./design.ts";
import {
  escapementMarks,
  firstCrossing,
  jewelStrikes,
  onSlide,
} from "./callouts.ts";
import { generate, JEWEL_FLAT_OFFSET, JEWEL_RADIUS } from "./generate.ts";
import { tickWindows } from "./model.ts";
import { polar } from "./shapes.ts";

const watch = generate();
const { design, scene } = watch;
const ESCAPEMENT_SLIDE = { watch: "escapement", watchTilt: 20 };
const marks = escapementMarks(watch, ESCAPEMENT_SLIDE);
const view = scene.views.find((candidate) => candidate.name === "escapement");
const [, , , , escape] = design.wheels as [Wheel, Wheel, Wheel, Wheel, Wheel];

/** Twice the signed area of the triangle: > 0 if it turns clockwise on the
 *  slide (y is down). */
function cross(a: Point2, b: Point2, c: Point2): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

test("onSlide is the view's zoom and shift, and a tilt lifts a higher point", () => {
  assert.ok(view);
  const point: [number, number, number] = [700, 150, 5];
  const [x, y] = onSlide(view, 0, scene.slide, point);
  assert.ok(Math.abs(x - (view.scale * 700 + view.shift[0])) < 1e-3);
  assert.ok(Math.abs(y - (view.scale * 150 + view.shift[1])) < 1e-3);
  const low = onSlide(view, 20, scene.slide, [700, 150, 0]);
  const high = onSlide(view, 20, scene.slide, [700, 150, 10]);
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

test("the drive arrow turns the way the escape wheel turns, on the side of the fourth wheel", () => {
  const tail = at(marks.drive, 0);
  const middle = at(marks.drive, Math.floor(marks.drive.length / 2));
  const head = at(marks.drive, marks.drive.length - 1);
  // a negative step turns the wheel anticlockwise on the slide
  assert.equal(
    Math.sign(cross(marks.escape, tail, head)),
    Math.sign(escape.step),
  );
  const [, , , fourth] = design.wheels as [Wheel, Wheel, Wheel, Wheel];
  const toFourth = Math.atan2(
    fourth.arbor[1] - escape.arbor[1],
    fourth.arbor[0] - escape.arbor[0],
  );
  const ahead = polar(1, (toFourth * 180) / Math.PI);
  const out: Point2 = [
    middle[0] - marks.escape[0],
    middle[1] - marks.escape[1],
  ];
  assert.ok(out[0] * ahead[0] + out[1] * ahead[1] > 0);
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
});

test("the escapement view puts the hairspring's arbor halfway down from the subtitle, at any tilt", () => {
  assert.ok(view);
  const arbor: [number, number, number] = [
    design.watchCentre[0] + design.balance.arbor[0],
    design.watchCentre[1] + design.balance.arbor[1],
    (watch.springHeights.bottom + watch.springHeights.top) / 2,
  ];
  // the subtitle's baseline is at 110.7 (SUBTITLE_BASELINE in generate.ts)
  const halfway = (110.7 + at(scene.slide, 1)) / 2;
  for (const tilt of [0, 20, 45]) {
    const [, y] = onSlide(view, tilt, scene.slide, arbor);
    assert.ok(Math.abs(y - halfway) < 1e-3, `tilt ${String(tilt)}`);
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
  assert.ok(view);
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
    return onSlide(view, 20, scene.slide, [x, y, watch.escapementTops.jewel]);
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

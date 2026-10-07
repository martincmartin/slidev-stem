import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import type { Point2 } from "../webgl/mesh.ts";
import type { Wheel } from "./design.ts";
import {
  escapementMarks,
  forkAtBanks,
  insidePolygon,
  onSlide,
  palletPoint,
} from "./callouts.ts";
import { FORK_PIVOT_RADIUS, generate } from "./generate.ts";
import { polar } from "./shapes.ts";

const watch = generate();
const { design, scene } = watch;
const SLIDE_4 = { watch: "escapement", watchTilt: 20 };
const marks = escapementMarks(watch, SLIDE_4);
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

test("the pallet's leader ends on the fork at both ends of its swing, clear of the pivot", () => {
  const point = palletPoint(design);
  for (const outline of forkAtBanks(design)) {
    assert.ok(insidePolygon(point, outline));
  }
  // below the pivot's circle by more than the circle's radius
  const pivotY = design.watchCentre[1] + design.fork.pivot[1];
  assert.ok(point[1] - (pivotY + FORK_PIVOT_RADIUS) > FORK_PIVOT_RADIUS);
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

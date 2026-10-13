// The teeth: every wheel of the train meshes with the pinion that it drives,
// and every pinion of the motion works with the wheel that it drives. Over
// one tooth, the outlines never overlap, and the driving flank stays in
// touch (docs/watch.md, "The teeth").

import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import type { Point2 } from "../webgl/mesh.ts";
import designFile from "./design.json" with { type: "json" };
import {
  readDesign,
  type DrivenWheel,
  type DrivingPinion,
  type Wheel,
} from "./design.ts";
import { ARBOR_RADIUS, oneStepWheel } from "./generate.ts";
import { FLATNESS, type Path } from "./path.ts";
import {
  drivenLead,
  drivenWheelTeeth,
  drivingPinionLeaves,
  drivingPinionSeam,
  meshedSpan,
  pinionLead,
  pinionLeafShapes,
  pinionLeaves,
  pinionSeam,
  pinionTip,
  TOOTH_FORM,
  turned,
  wheelTeeth,
  wheelToothShapes,
  type ToothForm,
} from "./teeth.ts";

const design = readDesign(designFile);

/** px: twice the flattening tolerance (FLATNESS in path.ts). */
const MAX_OVERLAP = 2 * FLATNESS;
/** px: on the Gears slide a px is about 4.3 screen px, and the two outlines'
 *  half widths add to 2.25 screen px, so a smaller gap is under the ink. */
const MAX_CONTACT_GAP = 0.3;
/** px, where a pinion drives (the motion works): the leaf's round end is not
 *  shaped to drive, so the contact opens a little as each tooth leaves
 *  (0.33 px at most, measured on 2026-10-09). The Hour Hand slide shows
 *  them at about 3.8 screen px a px, so 0.4 px is under the 2.25 screen px
 *  of the two outlines' half widths, as on the Gears slide. */
const MAX_DRIVEN_GAP = 0.4;
const SAMPLES = 60;

/** Each wheel that drives a pinion, with the wheel that carries it. */
const meshes: [Wheel, Wheel][] = design.wheels.flatMap((wheel) =>
  wheel.driven !== null && wheel.driven.pinionRadius !== null
    ? [[wheel, wheel.driven] as [Wheel, Wheel]]
    : [],
);

function outline(path: Path): Point2[] {
  const contours = path.contours();
  assert.equal(contours.length, 1);
  return at(contours, 0).points;
}

/** `points` turned by `degrees` about their origin, then moved to `arbor`. */
function placed(points: Point2[], degrees: number, arbor: Point2): Point2[] {
  const radians = (degrees * Math.PI) / 180;
  return points.map((point) => {
    const [x, y] = turned(point, radians);
    return [x + arbor[0], y + arbor[1]];
  });
}

/** Even-odd ray casting. */
function insidePolygon([x, y]: Point2, polygon: Point2[]): boolean {
  let inside = false;
  for (let index = 0; index < polygon.length; index++) {
    const [startX, startY] = at(polygon, index);
    const [endX, endY] = at(polygon, (index + 1) % polygon.length);
    if (startY > y !== endY > y) {
      const crossX =
        startX + ((y - startY) * (endX - startX)) / (endY - startY);
      if (x < crossX) inside = !inside;
    }
  }
  return inside;
}

/** The distance from `point` to a closed polygon's edges, and the nearest
 *  point on them. */
function nearestOn(point: Point2, polygon: Point2[]): [number, Point2] {
  let best: [number, Point2] = [Infinity, point];
  for (let index = 0; index < polygon.length; index++) {
    const start = at(polygon, index);
    const end = at(polygon, (index + 1) % polygon.length);
    const edgeX = end[0] - start[0];
    const edgeY = end[1] - start[1];
    const lengthSquared = edgeX * edgeX + edgeY * edgeY;
    const along =
      lengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              ((point[0] - start[0]) * edgeX + (point[1] - start[1]) * edgeY) /
                lengthSquared,
            ),
          );
    const foot: Point2 = [start[0] + along * edgeX, start[1] + along * edgeY];
    const distance = Math.hypot(point[0] - foot[0], point[1] - foot[1]);
    if (distance < best[0]) best = [distance, foot];
  }
  return best;
}

function within(points: Point2[], centre: Point2, reach: number): Point2[] {
  return points.filter(
    (point) => Math.hypot(point[0] - centre[0], point[1] - centre[1]) < reach,
  );
}

/** `degrees` from the nearest multiple of `period`, in -period/2..period/2. */
function offNearest(degrees: number, period: number): number {
  return degrees - period * Math.round(degrees / period);
}

/** A wheel and a pinion in mesh, as the test turns them. */
interface Pair {
  readonly wheel: {
    readonly name: string;
    readonly points: Point2[];
    readonly teeth: number;
    readonly step: number;
    readonly arbor: Point2;
    readonly outer: number;
    /** Where tooth 0's centre line is, with its lead. */
    readonly toothPhase: number;
  };
  readonly pinion: {
    readonly points: Point2[];
    readonly step: number;
    readonly arbor: Point2;
  };
  /** Which of the two turns the other. */
  readonly driver: "wheel" | "pinion";
}

/** A wheel of the train and the pinion of `owner`, which it drives. */
function trainPair(wheel: Wheel, owner: Wheel): Pair {
  return {
    wheel: { ...wheel, points: outline(wheelTeeth(wheel)) },
    pinion: { ...owner, points: outline(pinionLeaves(owner)) },
    driver: "wheel",
  };
}

/** A wheel of the motion works and the pinion that drives it. */
function motionPair(wheel: DrivenWheel, pinion: DrivingPinion): Pair {
  return {
    wheel: {
      ...wheel,
      points: outline(drivenWheelTeeth(wheel)),
      toothPhase: wheel.toothPhase + drivenLead(wheel),
    },
    pinion: { ...pinion, points: outline(drivingPinionLeaves(pinion)) },
    driver: "pinion",
  };
}

/** Turns the pair through one tooth: they never overlap, and the driving
 *  flank stays in touch. */
function assertMeshes(pair: Pair): void {
  const { wheel, pinion: owner } = pair;
  {
    const wheelPoints = wheel.points;
    const pinionPoints = owner.points;
    const pinionReach =
      Math.max(...pinionPoints.map((point) => Math.hypot(...point))) + 1;
    // one wheel tooth passes in this many beats
    const toothBeats = 360 / wheel.teeth / Math.abs(wheel.step);
    for (let sample = 0; sample < SAMPLES; sample++) {
      const beats = (toothBeats * sample) / SAMPLES;
      const where = `${wheel.name} wheel at ${beats.toFixed(4)} beats`;
      const wheelTurn = wheel.step * beats;
      const wheelNow = placed(wheelPoints, wheelTurn, wheel.arbor);
      const pinionNow = placed(pinionPoints, owner.step * beats, owner.arbor);
      const wheelNear = within(wheelNow, owner.arbor, pinionReach);
      const pinionNear = within(pinionNow, wheel.arbor, wheel.outer + 1);

      let overlap = 0;
      for (const point of wheelNear) {
        if (insidePolygon(point, pinionNow)) {
          overlap = Math.max(overlap, nearestOn(point, pinionNow)[0]);
        }
      }
      for (const point of pinionNear) {
        if (insidePolygon(point, wheelNow)) {
          overlap = Math.max(overlap, nearestOn(point, wheelNow)[0]);
        }
      }
      assert.ok(overlap <= MAX_OVERLAP, `${where}: overlap ${String(overlap)}`);

      // the gap between the outlines, and the wheel's point at it
      let gap = Infinity;
      let wheelContact: Point2 = [0, 0];
      for (const point of wheelNear) {
        const [distance] = nearestOn(point, pinionNow);
        if (distance < gap) [gap, wheelContact] = [distance, point];
      }
      for (const point of pinionNear) {
        const [distance, foot] = nearestOn(point, wheelNow);
        if (distance < gap) [gap, wheelContact] = [distance, foot];
      }
      const allowed =
        pair.driver === "wheel" ? MAX_CONTACT_GAP : MAX_DRIVEN_GAP;
      assert.ok(gap <= allowed, `${where}: gap ${String(gap)}`);

      // a wheel that drives touches with a tooth's leading flank, the side
      // that it turns to; a wheel that a pinion drives, with the trailing one
      const [localX, localY] = turned(
        [wheelContact[0] - wheel.arbor[0], wheelContact[1] - wheel.arbor[1]],
        (-wheelTurn * Math.PI) / 180,
      );
      const angle = (Math.atan2(localY, localX) * 180) / Math.PI;
      const fromToothCentre = offNearest(
        angle - wheel.toothPhase,
        360 / wheel.teeth,
      );
      assert.equal(
        Math.sign(fromToothCentre),
        Math.sign(wheel.step) * (pair.driver === "wheel" ? 1 : -1),
        `${where}: the contact is on the flank that does not drive`,
      );
    }
  }
}

test("every wheel meshes with its pinion: no overlap, and the driving flank keeps contact", () => {
  assert.equal(meshes.length, 4); // barrel, centre, third, fourth
  for (const [wheel, owner] of meshes) assertMeshes(trainPair(wheel, owner));
});

test("the one-step wheel meshes with the fourth pinion, as the third wheel does", () => {
  const wheel = oneStepWheel(design);
  assert.ok(wheel.driven);
  assertMeshes(trainPair(wheel, wheel.driven));
});

test("each pinion of the motion works meshes with the wheel that it drives", () => {
  const { minute, hour } = design.motionWorks;
  for (const wheel of [minute, hour]) {
    assertMeshes(motionPair(wheel, wheel.driver));
  }
});

/** The least distance between two closed outlines. */
function distanceBetween(first: Point2[], second: Point2[]): number {
  return Math.min(
    ...first.map((point) => nearestOn(point, second)[0]),
    ...second.map((point) => nearestOn(point, first)[0]),
  );
}

test("a meshed span's teeth drive its leaves, and no other leaves, as it passes through the mesh", () => {
  for (const [wheel, owner] of meshes) {
    const span = meshedSpan(wheel, 4);
    assert.equal(new Set(span.teeth).size, 4, wheel.name);
    assert.equal(new Set(span.leaves).size, 4, wheel.name);
    const toothBeats = 360 / wheel.teeth / Math.abs(wheel.step);
    const teeth = span.teeth.map((tooth) =>
      outline(wheelToothShapes(wheel, [tooth])),
    );
    const leaves = [...Array(owner.leaves).keys()].map((leaf) =>
      outline(pinionLeafShapes(owner, [leaf])),
    );
    const driven = new Set<number>();
    // from three teeth before the start to three after: the whole span passes
    for (let sample = -SAMPLES; sample <= SAMPLES; sample++) {
      const beats = (3 * toothBeats * sample) / SAMPLES;
      for (const [index, tooth] of teeth.entries()) {
        const toothNow = placed(tooth, wheel.step * beats, wheel.arbor);
        for (const [leaf, points] of leaves.entries()) {
          const leafNow = placed(points, owner.step * beats, owner.arbor);
          if (distanceBetween(toothNow, leafNow) > MAX_CONTACT_GAP) continue;
          const where = `${wheel.name} wheel's tooth ${String(at(span.teeth, index))} at ${beats.toFixed(3)} beats`;
          assert.equal(leaf, at(span.leaves, index), where);
          driven.add(index);
        }
      }
    }
    assert.equal(
      driven.size,
      4,
      `${wheel.name}: a tooth of the span drove no leaf`,
    );
  }
});

test("a meshed span is the size of the pinion at most, and a shape's index is one of the wheel's", () => {
  const [wheel, owner] = at(meshes, 0);
  for (const count of [0, -1, 1.5, owner.leaves + 1]) {
    assert.throws(() => meshedSpan(wheel, count), /span/);
  }
  assert.equal(meshedSpan(wheel, owner.leaves).teeth.length, owner.leaves);
  for (const index of [-1, wheel.teeth, 0.5]) {
    assert.throws(() => wheelToothShapes(wheel, [index]), /tooth/);
  }
  for (const index of [-1, owner.leaves, 0.5]) {
    assert.throws(() => pinionLeafShapes(owner, [index]), /leaf/);
  }
  // one closed outline for each tooth or leaf
  assert.equal(wheelToothShapes(wheel, [0, 1, 2]).contours().length, 3);
  assert.equal(pinionLeafShapes(owner, [0, 1]).contours().length, 2);
});

test("a wheel's teeth reach its tip circle and its root circle", () => {
  // the layout's clearance checks (art/watch_geometry.py) use these circles
  for (const [wheel] of meshes) {
    const radii = outline(wheelTeeth(wheel)).map((point) =>
      Math.hypot(...point),
    );
    assert.ok(Math.abs(Math.max(...radii) - wheel.outer) < 0.01, wheel.name);
    assert.ok(Math.abs(Math.min(...radii) - wheel.inner) < 0.01, wheel.name);
  }
});

test("a tooth that would come to a point throws", () => {
  const fourth = design.wheels.find((wheel) => wheel.name === "fourth");
  assert.ok(fourth);
  // the fourth wheel's tooth comes to a point 5.71 px past its pitch circle
  assert.throws(() => wheelTeeth({ ...fourth, depth: 6 }), /point/);
});

test("each pinion turns back by half its backlash, against its turn", () => {
  const expected: Record<string, number> = {
    centre: -2.9705,
    third: 4.4117,
    fourth: -4.3997,
    escape: 2.2259,
  };
  for (const [, owner] of meshes) {
    const lead = expected[owner.name];
    assert.ok(lead !== undefined, owner.name);
    assert.ok(Math.abs(pinionLead(owner) - lead) < 1e-3, owner.name);
  }
});

test("each pinion has four corners for each leaf", () => {
  // one half-circle end avoids a false corner between two quarter arcs
  for (const [, owner] of meshes) {
    const contours = pinionLeaves(owner).contours();
    assert.equal(contours.length, 1, owner.name);
    const corners = at(contours, 0).corners.filter(Boolean).length;
    assert.equal(corners, 4 * owner.leaves, owner.name);
  }
});

test("a pinion's tip circle is where its leaves reach", () => {
  for (const [, owner] of meshes) {
    const reach = Math.max(
      ...outline(pinionLeaves(owner)).map((point) => Math.hypot(...point)),
    );
    assert.ok(Math.abs(pinionTip(owner) - reach) < FLATNESS, owner.name);
  }
});

test("an arbor's seam lies on its pinion's leaves: a circle, or an arc across each leaf", () => {
  const { cannon, minute } = design.motionWorks;
  const minutePinion = minute.pinion;
  assert.ok(minutePinion);
  const pinions: [string, number, Path, Path][] = [
    ...meshes.map(([, owner]): [string, number, Path, Path] => [
      owner.name,
      owner.leaves,
      pinionLeaves(owner),
      pinionSeam(owner, ARBOR_RADIUS),
    ]),
    ...[cannon, minutePinion].map((pinion): [string, number, Path, Path] => [
      pinion.name,
      pinion.leaves,
      drivingPinionLeaves(pinion),
      drivingPinionSeam(pinion, ARBOR_RADIUS),
    ]),
  ];
  const kinds = new Set<boolean>();
  for (const [name, leaves, outlinePath, seam] of pinions) {
    const leafOutline = outline(outlinePath);
    const contours = seam.contours();
    const whole = contours.length === 1 && at(contours, 0).closed;
    kinds.add(whole);
    if (!whole) {
      assert.equal(contours.length, leaves, name);
      assert.ok(
        contours.every((contour) => !contour.closed),
        name,
      );
    }
    for (const { points, closed } of contours) {
      for (const point of points) {
        assert.ok(Math.abs(Math.hypot(...point) - ARBOR_RADIUS) < 1e-9, name);
      }
      // each chord's middle is on the leaf; an arc ends on a flank
      for (let index = 1; index < points.length; index++) {
        const [startX, startY] = at(points, index - 1);
        const [endX, endY] = at(points, index);
        assert.ok(
          insidePolygon(
            [(startX + endX) / 2, (startY + endY) / 2],
            leafOutline,
          ),
          name,
        );
      }
      if (!closed) {
        for (const end of [at(points, 0), at(points, points.length - 1)]) {
          assert.ok(nearestOn(end, leafOutline)[0] < 1e-9, name);
        }
      }
    }
  }
  // the large pinions take the circle, the 4-leaf pinions the arcs
  assert.deepEqual(kinds, new Set([true, false]));
});

test("an arbor past a pinion's flanks throws", () => {
  const [, owner] = at(meshes, 0);
  const radius = owner.pinionRadius;
  assert.ok(radius !== null);
  assert.throws(() => pinionSeam(owner, radius), /past the .* pinion's flanks/);
});

function assertRejectedForm(form: ToothForm, message: RegExp): void {
  const [wheel, owner] = at(meshes, 0);
  assert.throws(() => wheelTeeth(wheel, form), message);
  assert.throws(() => pinionLead(owner, form), message);
  assert.throws(() => pinionLeaves(owner, form), message);
}

test("faceSegments must be a positive integer", () => {
  for (const faceSegments of [0, -1, 0.5, NaN, Infinity, -Infinity]) {
    assertRejectedForm(
      { ...TOOTH_FORM, faceSegments },
      /faceSegments must be a positive integer/,
    );
  }
});

test("leafWidth must be finite and positive", () => {
  for (const leafWidth of [0, -1, NaN, Infinity, -Infinity]) {
    assertRejectedForm(
      { ...TOOTH_FORM, leafWidth },
      /leafWidth must be finite and positive/,
    );
  }
});

test("contactSlack must be finite and nonnegative", () => {
  for (const contactSlack of [-1, NaN, Infinity, -Infinity]) {
    assertRejectedForm(
      { ...TOOTH_FORM, contactSlack },
      /contactSlack must be finite and nonnegative/,
    );
  }
  const [, owner] = at(meshes, 0);
  assert.doesNotThrow(() =>
    pinionLeaves(owner, { ...TOOTH_FORM, contactSlack: 0 }).contours(),
  );
});

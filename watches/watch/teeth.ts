// The train's teeth: cycloidal wheel teeth, and the pinion leaves that they
// drive. docs/watch.md, "The teeth", gives the rules and the reasons. Each
// outline is a Path about its own arbor, in slide px. Angles are screen
// angles (0 is 3 o'clock, clockwise), as in shapes.ts.

import type { Point2 } from "../webgl/mesh.ts";
import { at } from "../webgl/checked.ts";
import type { Wheel } from "./design.ts";
import { Path } from "./path.ts";
import { polar, radians } from "./shapes.ts";

/** The numbers of the tooth form that a caller can tune. */
export interface ToothForm {
  /** A pinion leaf's width on its pitch circle, in modules. */
  readonly leafWidth: number;
  /** px: the driving flanks stop this short of touching, so that the
   *  flattened outlines never cross. */
  readonly contactSlack: number;
  /** Cubic segments in each face of a wheel tooth. */
  readonly faceSegments: number;
}

export const TOOTH_FORM: ToothForm = Object.freeze({
  leafWidth: 1.25,
  contactSlack: 0.02,
  faceSegments: 4,
});

function checkToothForm(form: ToothForm): void {
  if (!(Number.isInteger(form.faceSegments) && form.faceSegments > 0)) {
    throw new Error("Tooth form faceSegments must be a positive integer.");
  }
  if (!(Number.isFinite(form.leafWidth) && form.leafWidth > 0)) {
    throw new Error("Tooth form leafWidth must be finite and positive.");
  }
  if (!(Number.isFinite(form.contactSlack) && form.contactSlack >= 0)) {
    throw new Error("Tooth form contactSlack must be finite and nonnegative.");
  }
}

/** `point` turned by `radians` about the origin: clockwise on the screen,
 *  as `polar` and the model's matrices turn. */
export function turned([x, y]: Point2, radians: number): Point2 {
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return [x * cosine - y * sine, x * sine + y * cosine];
}

function mirrored([x, y]: Point2): Point2 {
  return [x, -y];
}

/** One cubic Bezier: its start, its two controls and its end. */
type Cubic = readonly [Point2, Point2, Point2, Point2];

/** The face of a wheel tooth on its lower side (y < 0), from the pitch
 *  circle out to the tip circle, as cubics: the epicycloid that a circle of
 *  `rollRadius` draws as it rolls round the pitch circle. */
function faceCubics(
  wheel: Wheel,
  tipRadius: number,
  rollRadius: number,
  halfAngle: number,
  segments: number,
): Cubic[] {
  const pitchRadius = wheel.pitchRadius;
  const outer = pitchRadius + rollRadius;
  const ratio = outer / rollRadius;
  const point = (roll: number): Point2 =>
    turned(
      [
        outer * Math.cos(roll) - rollRadius * Math.cos(ratio * roll),
        outer * Math.sin(roll) - rollRadius * Math.sin(ratio * roll),
      ],
      -halfAngle,
    );
  const velocity = (roll: number): Point2 =>
    turned(
      [
        -outer * Math.sin(roll) + outer * Math.sin(ratio * roll),
        outer * Math.cos(roll) - outer * Math.cos(ratio * roll),
      ],
      -halfAngle,
    );
  if (!(tipRadius < pitchRadius + 2 * rollRadius)) {
    throw new Error(
      `the ${wheel.name} wheel's addendum is more than its rolling circle reaches`,
    );
  }
  // on this span, the distance from the centre grows from the pitch radius
  // to the pitch radius plus the rolling circle's diameter
  let low = 0;
  let high = (Math.PI * rollRadius) / pitchRadius;
  for (let halving = 0; halving < 60; halving++) {
    const middle = (low + high) / 2;
    if (Math.hypot(...point(middle)) < tipRadius) low = middle;
    else high = middle;
  }
  const tipRoll = high;
  if (!(point(tipRoll)[1] < 0)) {
    throw new Error(
      `the ${wheel.name} wheel's teeth come to a point inside the tip circle`,
    );
  }
  const cubics: Cubic[] = [];
  for (let index = 0; index < segments; index++) {
    const startRoll = (index / segments) * tipRoll;
    const endRoll = ((index + 1) / segments) * tipRoll;
    const third = (endRoll - startRoll) / 3;
    const start = point(startRoll);
    const end = point(endRoll);
    const [startX, startY] = velocity(startRoll);
    const [endX, endY] = velocity(endRoll);
    cubics.push([
      start,
      [start[0] + startX * third, start[1] + startY * third],
      [end[0] - endX * third, end[1] - endY * third],
      end,
    ]);
  }
  return cubics;
}

/** The closed outline of a wheel that drives a pinion: cycloidal teeth, half
 *  the pitch wide, with radial flanks. Its tip and root circles are the
 *  design's `outer` and `inner`. */
export function wheelTeeth(wheel: Wheel, form: ToothForm = TOOTH_FORM): Path {
  checkToothForm(form);
  const pinionRadius = wheel.driven?.pinionRadius ?? null;
  if (pinionRadius === null) {
    throw new Error(`the ${wheel.name} wheel drives no pinion`);
  }
  // a tooth is half the pitch wide; in its own frame, its centre line is +x
  const halfDegrees = 90 / wheel.teeth;
  const halfAngle = radians(halfDegrees);
  const rootRadius = wheel.pitchRadius - wheel.depth;
  const tipRadius = wheel.pitchRadius + wheel.depth;
  const face = faceCubics(
    wheel,
    tipRadius,
    pinionRadius / 2,
    halfAngle,
    form.faceSegments,
  );
  const tip = at(face, face.length - 1)[3];
  const lowerRoot = polar(rootRadius, -halfDegrees);
  const lowerPitch = polar(wheel.pitchRadius, -halfDegrees);
  const toothRadians = (2 * Math.PI) / wheel.teeth;
  const path = new Path();
  for (let index = 0; index < wheel.teeth; index++) {
    const centre = radians(wheel.toothPhase) + index * toothRadians;
    const onScreen = (point: Point2): Point2 => turned(point, centre);
    if (index === 0) path.moveTo(...onScreen(lowerRoot));
    path.lineTo(...onScreen(lowerPitch));
    for (const [, first, second, end] of face) {
      path.cubicTo(...onScreen(first), ...onScreen(second), ...onScreen(end));
    }
    path.arcTo(tipRadius, false, true, ...onScreen(mirrored(tip)));
    for (const [start, first, second] of [...face].reverse()) {
      path.cubicTo(
        ...onScreen(mirrored(second)),
        ...onScreen(mirrored(first)),
        ...onScreen(mirrored(start)),
      );
    }
    path.lineTo(...onScreen(mirrored(lowerRoot)));
    path.arcTo(
      rootRadius,
      false,
      true,
      ...turned(lowerRoot, centre + toothRadians),
    );
  }
  return path.close();
}

/** Degrees by which the pinion on `owner`'s arbor turns back, against its
 *  own turn, so that its leaves rest on the driving flanks of the teeth
 *  that turn it: half the backlash, less the slack. */
export function pinionLead(owner: Wheel, form: ToothForm = TOOTH_FORM): number {
  checkToothForm(form);
  const radius = owner.pinionRadius;
  if (radius === null) throw new Error(`the ${owner.name} wheel has no pinion`);
  if (owner.step === 0)
    throw new Error(`the ${owner.name} wheel does not turn`);
  const pitchModule = (2 * radius) / owner.leaves;
  const backlash = pitchModule * (Math.PI / 2 - form.leafWidth);
  if (!(backlash / 2 > form.contactSlack)) {
    throw new Error(`the ${owner.name} pinion's leaves leave no backlash`);
  }
  const lead = ((backlash / 2 - form.contactSlack) / radius) * (180 / Math.PI);
  return -Math.sign(owner.step) * lead;
}

/** The closed outline of the pinion on `owner`'s arbor: leaves with radial
 *  flanks and round ends, `form.leafWidth` modules wide. */
export function pinionLeaves(owner: Wheel, form: ToothForm = TOOTH_FORM): Path {
  const radius = owner.pinionRadius;
  const phase = owner.pinionPhase;
  if (radius === null || phase === null) {
    throw new Error(`the ${owner.name} wheel has no pinion`);
  }
  const lead = pinionLead(owner, form);
  const leaves = owner.leaves;
  const leafPitch = (2 * Math.PI * radius) / leaves;
  // as deep as the trapezoid leaves were: past the wheel's tips
  const rootRadius = radius - Math.min(4.5, 0.42 * leafPitch);
  if (!(rootRadius > 0)) {
    throw new Error(`the ${owner.name} pinion's gaps reach its centre`);
  }
  const halfAngle = form.leafWidth / leaves;
  if (!(halfAngle < Math.PI / leaves)) {
    throw new Error(
      `the ${owner.name} pinion's leaves are wider than their pitch`,
    );
  }
  const halfDegrees = (halfAngle * 180) / Math.PI;
  const endRadius = radius * Math.sin(halfAngle);
  const lowerRoot = polar(rootRadius, -halfDegrees);
  const lowerPitch = polar(radius, -halfDegrees);
  const leafRadians = (2 * Math.PI) / leaves;
  const first = radians(phase + lead);
  const path = new Path();
  for (let index = 0; index < leaves; index++) {
    const centre = first + index * leafRadians;
    const onScreen = (point: Point2): Point2 => turned(point, centre);
    if (index === 0) path.moveTo(...onScreen(lowerRoot));
    path.lineTo(...onScreen(lowerPitch));
    // the round end: one half circle. Two quarter arcs would meet at a false
    // corner, because path.ts takes an arc's end directions from its chords
    path.arcTo(endRadius, false, true, ...onScreen(mirrored(lowerPitch)));
    path.lineTo(...onScreen(mirrored(lowerRoot)));
    path.arcTo(
      rootRadius,
      false,
      true,
      ...turned(lowerRoot, centre + leafRadians),
    );
  }
  return path.close();
}

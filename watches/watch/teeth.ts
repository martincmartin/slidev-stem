// The teeth: cycloidal wheel teeth, and the pinion leaves that they mesh
// with. In the train each wheel drives a pinion; in the motion works each
// pinion drives a wheel. docs/watch.md, "The teeth", gives the rules and the
// reasons. Each
// outline is a Path about its own arbor, in slide px. Angles are screen
// angles (0 is 3 o'clock, clockwise), as in shapes.ts.

import type { Point2 } from "../webgl/mesh.ts";
import { at } from "../webgl/checked.ts";
import type { DrivenWheel, DrivingPinion, Wheel } from "./design.ts";
import { Path } from "./path.ts";
import { polar, radians } from "./shapes.ts";

/** What a wheel's teeth are made from: a train wheel or a wheel of the
 *  motion works. */
type Toothed = Pick<
  Wheel,
  "name" | "teeth" | "pitchRadius" | "depth" | "toothPhase"
>;

/** What a pinion's leaves are made from. */
interface Leaved {
  readonly name: string;
  readonly leaves: number;
  readonly radius: number;
  /** Degrees from screen angle 0 to leaf 0's centre line, with its lead. */
  readonly phase: number;
}

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
  wheel: Toothed,
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

/** A wheel tooth in its own frame, centre line +x: what each of a wheel's
 *  teeth repeats. */
interface ToothShape {
  readonly rootRadius: number;
  readonly tipRadius: number;
  /** The corners of its lower side (y < 0), on the root and pitch circles. */
  readonly lowerRoot: Point2;
  readonly lowerPitch: Point2;
  /** The face of its lower side, from the pitch circle to the tip. */
  readonly face: readonly Cubic[];
}

/** The radius of the pinion that a train wheel drives. */
function drivenPinionRadius(wheel: Wheel): number {
  const pinionRadius = wheel.driven?.pinionRadius ?? null;
  if (pinionRadius === null) {
    throw new Error(`the ${wheel.name} wheel drives no pinion`);
  }
  return pinionRadius;
}

/** A wheel's tooth: cycloidal, half the pitch wide, with radial flanks. Its
 *  face is the epicycloid of a circle half as large as the pinion that it
 *  meshes with, whichever of the two drives. */
function wheelTooth(
  wheel: Toothed,
  pinionRadius: number,
  form: ToothForm,
): ToothShape {
  checkToothForm(form);
  // a tooth is half the pitch wide; in its own frame, its centre line is +x
  const halfDegrees = 90 / wheel.teeth;
  const rootRadius = wheel.pitchRadius - wheel.depth;
  const tipRadius = wheel.pitchRadius + wheel.depth;
  return {
    rootRadius,
    tipRadius,
    lowerRoot: polar(rootRadius, -halfDegrees),
    lowerPitch: polar(wheel.pitchRadius, -halfDegrees),
    face: faceCubics(
      wheel,
      tipRadius,
      pinionRadius / 2,
      radians(halfDegrees),
      form.faceSegments,
    ),
  };
}

/** Radians from screen angle 0 to the centre line of tooth `index`, with
 *  the wheel turned `lead` degrees. */
function toothCentre(wheel: Toothed, index: number, lead = 0): number {
  return (
    radians(wheel.toothPhase + lead) + index * ((2 * Math.PI) / wheel.teeth)
  );
}

/** Draws a tooth's flanks, faces and tip, from the root corner of its lower
 *  side (where `path` is) to the root corner of its upper side. */
function traceTooth(
  path: Path,
  tooth: ToothShape,
  onScreen: (point: Point2) => Point2,
): void {
  const { face, lowerRoot, lowerPitch, tipRadius } = tooth;
  const tip = at(face, face.length - 1)[3];
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
}

/** The closed outline of a wheel that drives a pinion: cycloidal teeth, half
 *  the pitch wide, with radial flanks. Its tip and root circles are the
 *  design's `outer` and `inner`. */
export function wheelTeeth(wheel: Wheel, form: ToothForm = TOOTH_FORM): Path {
  return teethOutline(wheel, drivenPinionRadius(wheel), 0, form);
}

/** The closed outline of a wheel of the motion works: the teeth of
 *  `wheelTeeth`, turned back against the wheel's turn by `drivenLead`, so
 *  that they rest on the leaves of the pinion that drives them. */
export function drivenWheelTeeth(
  wheel: DrivenWheel,
  form: ToothForm = TOOTH_FORM,
): Path {
  return teethOutline(
    wheel,
    wheel.driver.radius,
    drivenLead(wheel, form),
    form,
  );
}

function teethOutline(
  wheel: Toothed,
  pinionRadius: number,
  lead: number,
  form: ToothForm,
): Path {
  const tooth = wheelTooth(wheel, pinionRadius, form);
  const path = new Path();
  for (let index = 0; index < wheel.teeth; index++) {
    const centre = toothCentre(wheel, index, lead);
    const onScreen = (point: Point2): Point2 => turned(point, centre);
    if (index === 0) path.moveTo(...onScreen(tooth.lowerRoot));
    traceTooth(path, tooth, onScreen);
    path.arcTo(
      tooth.rootRadius,
      false,
      true,
      ...turned(tooth.lowerRoot, centre + (2 * Math.PI) / wheel.teeth),
    );
  }
  return path.close();
}

/** The teeth of `wheel` that `teeth` numbers (0 is at `toothPhase`, and the
 *  numbers go clockwise), each a closed outline of its own: the tooth as
 *  `wheelTeeth` draws it, closed along the root circle. */
export function wheelToothShapes(
  wheel: Wheel,
  teeth: readonly number[],
  form: ToothForm = TOOTH_FORM,
): Path {
  const tooth = wheelTooth(wheel, drivenPinionRadius(wheel), form);
  const path = new Path();
  for (const index of teeth) {
    checkIndex(index, wheel.teeth, `the ${wheel.name} wheel's tooth`);
    const centre = toothCentre(wheel, index);
    const onScreen = (point: Point2): Point2 => turned(point, centre);
    path.moveTo(...onScreen(tooth.lowerRoot));
    traceTooth(path, tooth, onScreen);
    path.arcTo(tooth.rootRadius, false, false, ...onScreen(tooth.lowerRoot));
    path.close();
  }
  return path;
}

function checkIndex(index: number, count: number, what: string): void {
  if (!(Number.isInteger(index) && index >= 0 && index < count)) {
    throw new Error(
      `${what} ${String(index)} is not one of 0 to ${String(count - 1)}`,
    );
  }
}

/** Degrees by which the pinion on `owner`'s arbor turns back, against its
 *  own turn, so that its leaves rest on the driving flanks of the teeth
 *  that turn it: half the backlash, less the slack. */
export function pinionLead(owner: Wheel, form: ToothForm = TOOTH_FORM): number {
  const radius = owner.pinionRadius;
  if (radius === null) throw new Error(`the ${owner.name} wheel has no pinion`);
  return backLead(owner.name, owner.leaves, radius, radius, owner.step, form);
}

/** Degrees by which a wheel of the motion works turns back, against its
 *  own turn, so that its teeth rest on the leaves of the pinion that drives
 *  them: half the backlash, less the slack, as `pinionLead`. */
export function drivenLead(
  wheel: DrivenWheel,
  form: ToothForm = TOOTH_FORM,
): number {
  const { driver } = wheel;
  return backLead(
    wheel.name,
    driver.leaves,
    driver.radius,
    wheel.pitchRadius,
    wheel.step,
    form,
  );
}

/** Half the backlash of a pinion of `leaves` at `pinionRadius`, less the
 *  slack, as degrees of a gear of `radius` that turns `step` a beat: with
 *  the sign that turns that gear back. */
function backLead(
  name: string,
  leaves: number,
  pinionRadius: number,
  radius: number,
  step: number,
  form: ToothForm,
): number {
  checkToothForm(form);
  if (step === 0) throw new Error(`the ${name} wheel does not turn`);
  const pitchModule = (2 * pinionRadius) / leaves;
  const backlash = pitchModule * (Math.PI / 2 - form.leafWidth);
  if (!(backlash / 2 > form.contactSlack)) {
    throw new Error(`the ${name} pinion's leaves leave no backlash`);
  }
  const lead = ((backlash / 2 - form.contactSlack) / radius) * (180 / Math.PI);
  return -Math.sign(step) * lead;
}

/** A pinion leaf in its own frame, centre line +x: what each of a
 *  pinion's leaves repeats. */
interface LeafShape {
  readonly rootRadius: number;
  /** The radius of its round end. */
  readonly endRadius: number;
  /** The corners of its lower side (y < 0), on the root and pitch circles. */
  readonly lowerRoot: Point2;
  readonly lowerPitch: Point2;
  /** Radians from screen angle 0 to the centre line of leaf 0. */
  readonly first: number;
}

/** The pinion on a train wheel's arbor, turned back by its lead. */
function trainPinion(owner: Wheel, form: ToothForm): Leaved {
  const radius = owner.pinionRadius;
  const phase = owner.pinionPhase;
  if (radius === null || phase === null) {
    throw new Error(`the ${owner.name} wheel has no pinion`);
  }
  return {
    name: owner.name,
    leaves: owner.leaves,
    radius,
    phase: phase + pinionLead(owner, form),
  };
}

/** A leaf of a pinion: radial flanks and a round end, `form.leafWidth`
 *  modules wide. */
function pinionLeaf(pinion: Leaved, form: ToothForm): LeafShape {
  checkToothForm(form);
  const { radius, leaves } = pinion;
  const leafPitch = (2 * Math.PI * radius) / leaves;
  // as deep as the trapezoid leaves were: past the wheel's tips
  const rootRadius = radius - Math.min(4.5, 0.42 * leafPitch);
  if (!(rootRadius > 0)) {
    throw new Error(`the ${pinion.name} pinion's gaps reach its centre`);
  }
  const halfAngle = form.leafWidth / leaves;
  if (!(halfAngle < Math.PI / leaves)) {
    throw new Error(
      `the ${pinion.name} pinion's leaves are wider than their pitch`,
    );
  }
  const halfDegrees = (halfAngle * 180) / Math.PI;
  return {
    rootRadius,
    endRadius: radius * Math.sin(halfAngle),
    lowerRoot: polar(rootRadius, -halfDegrees),
    lowerPitch: polar(radius, -halfDegrees),
    first: radians(pinion.phase),
  };
}

/** Draws a leaf's flanks and round end, from the root corner of its lower
 *  side (where `path` is) to the root corner of its upper side. */
function traceLeaf(
  path: Path,
  leaf: LeafShape,
  onScreen: (point: Point2) => Point2,
): void {
  path.lineTo(...onScreen(leaf.lowerPitch));
  // the round end: one half circle. Two quarter arcs would meet at a false
  // corner, because path.ts takes an arc's end directions from its chords
  path.arcTo(
    leaf.endRadius,
    false,
    true,
    ...onScreen(mirrored(leaf.lowerPitch)),
  );
  path.lineTo(...onScreen(mirrored(leaf.lowerRoot)));
}

/** The closed outline of the pinion on `owner`'s arbor: leaves with radial
 *  flanks and round ends, `form.leafWidth` modules wide. */
export function pinionLeaves(owner: Wheel, form: ToothForm = TOOTH_FORM): Path {
  return leavesOutline(trainPinion(owner, form), form);
}

/** The tip circle of the pinion on `owner`'s arbor: where its leaves' round
 *  ends reach. */
export function pinionTip(owner: Wheel, form: ToothForm = TOOTH_FORM): number {
  const leaf = pinionLeaf(trainPinion(owner, form), form);
  return leaf.lowerPitch[0] + leaf.endRadius;
}

/** The closed outline of a pinion of the motion works, which drives a
 *  wheel: the leaves of `pinionLeaves`, with no lead. */
export function drivingPinionLeaves(
  pinion: DrivingPinion,
  form: ToothForm = TOOTH_FORM,
): Path {
  // it drives, so it has no lead
  return leavesOutline(pinion, form);
}

function leavesOutline(pinion: Leaved, form: ToothForm): Path {
  const leaf = pinionLeaf(pinion, form);
  const leafRadians = (2 * Math.PI) / pinion.leaves;
  const path = new Path();
  for (let index = 0; index < pinion.leaves; index++) {
    const centre = leaf.first + index * leafRadians;
    const onScreen = (point: Point2): Point2 => turned(point, centre);
    if (index === 0) path.moveTo(...onScreen(leaf.lowerRoot));
    traceLeaf(path, leaf, onScreen);
    path.arcTo(
      leaf.rootRadius,
      false,
      true,
      ...turned(leaf.lowerRoot, centre + leafRadians),
    );
  }
  return path.close();
}

/** The leaves of the pinion on `owner`'s arbor that `leaves` numbers (0 is
 *  at `pinionPhase`, and the numbers go clockwise), each a closed outline of
 *  its own: the leaf as `pinionLeaves` draws it, closed along the root
 *  circle. */
export function pinionLeafShapes(
  owner: Wheel,
  leaves: readonly number[],
  form: ToothForm = TOOTH_FORM,
): Path {
  const leaf = pinionLeaf(trainPinion(owner, form), form);
  const leafRadians = (2 * Math.PI) / owner.leaves;
  const path = new Path();
  for (const index of leaves) {
    checkIndex(index, owner.leaves, `the ${owner.name} pinion's leaf`);
    const centre = leaf.first + index * leafRadians;
    const onScreen = (point: Point2): Point2 => turned(point, centre);
    path.moveTo(...onScreen(leaf.lowerRoot));
    traceLeaf(path, leaf, onScreen);
    path.arcTo(leaf.rootRadius, false, false, ...onScreen(leaf.lowerRoot));
    path.close();
  }
  return path;
}

/** Some teeth of a wheel that are next to each other, and the leaves of its
 *  pinion that they drive: `leaves[index]` is the leaf that
 *  `teeth[index]` drives. */
export interface MeshedSpan {
  readonly teeth: readonly number[];
  readonly leaves: readonly number[];
}

/** `count` teeth of `wheel` that are next to each other, in the middle of
 *  its mesh with the pinion that it drives when the train is at its start,
 *  and the leaves that they drive. The ratio is whole, so each of these
 *  teeth drives the same leaf at every turn. Throws if the wheel and the
 *  pinion are not in mesh at the start. */
export function meshedSpan(
  wheel: Wheel,
  count: number,
  form: ToothForm = TOOTH_FORM,
): MeshedSpan {
  const owner = wheel.driven;
  if (owner === null)
    throw new Error(`the ${wheel.name} wheel drives no pinion`);
  if (!(Number.isInteger(count) && count > 0 && count <= owner.leaves)) {
    throw new Error(
      `a span of ${String(count)} teeth: it should be 1 to the ${owner.name} pinion's ${String(owner.leaves)} leaves`,
    );
  }
  const leaf = pinionLeaf(trainPinion(owner, form), form);
  // where the two meet: on the line from the wheel's arbor to the pinion's
  const meeting = Math.atan2(
    owner.arbor[1] - wheel.arbor[1],
    owner.arbor[0] - wheel.arbor[0],
  );
  /** How far `radians` is past the meeting line, in pitches, along the way
   *  that a part with this step moves there; in -count/2 to count/2. */
  const pastMeeting = (
    radians: number,
    line: number,
    step: number,
    pitches: number,
  ): number => {
    const turns = (Math.sign(step) * (radians - line)) / (2 * Math.PI);
    return pitches * (turns - Math.round(turns));
  };
  const toothPast = (index: number): number =>
    pastMeeting(toothCentre(wheel, index), meeting, wheel.step, wheel.teeth);
  const leafPast = (index: number): number =>
    pastMeeting(
      leaf.first + (index * 2 * Math.PI) / owner.leaves,
      meeting + Math.PI,
      owner.step,
      owner.leaves,
    );
  // a tooth drives the leaf half a pitch ahead of it; the middle of the
  // span's pairs is on the meeting line
  const byMiddle = [...Array(wheel.teeth).keys()].sort(
    (first, second) =>
      Math.abs(toothPast(first) + 0.25) - Math.abs(toothPast(second) + 0.25),
  );
  const nearest = byMiddle.slice(0, count);
  const teeth = [...nearest].sort(
    (first, second) => toothPast(first) - toothPast(second),
  );
  const leaves = teeth.map((tooth) => {
    const ahead = toothPast(tooth) + 0.5;
    const found = [...Array(owner.leaves).keys()].find((index) => {
      const off = leafPast(index) - ahead;
      return (
        Math.abs(off - owner.leaves * Math.round(off / owner.leaves)) < 0.25
      );
    });
    if (found === undefined) {
      throw new Error(
        `the ${wheel.name} wheel's tooth ${String(tooth)} drives no leaf of the ${owner.name} pinion at the start`,
      );
    }
    return found;
  });
  return { teeth, leaves };
}

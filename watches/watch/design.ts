// The watch's design: what art/watch_design.py writes to design.json. Types do
// not check JSON, so `readDesign` checks each value at load, and turns each
// name into a reference to its object, once.

import type { Point2 } from "../webgl/mesh.ts";
import designFile from "./design.json" with { type: "json" };

export interface Palette {
  line: string;
  frame: string;
  detail: string;
  knockout: string;
  background: string;
}

export interface Timing {
  /** s: one swing of the balance. */
  period: number;
  /** Degrees each way from centre. */
  amplitude: number;
  /** The fork moves while the balance is within this of centre (degrees). */
  pinArc: number;
  /** Degrees: the fork's swing each side of its centre line. */
  bank: number;
  /** The fraction of each tick window in which the fork turns and the train
   *  holds: the locked pallet stone clears its tooth first. */
  unlock: number;
  /** s: one turn of the fourth wheel. */
  fourthLoop: number;
  hourRatio: number;
}

/** A wheel and the pinion on its arbor. */
export interface Wheel {
  name: string;
  teeth: number;
  pitchRadius: number;
  /** The root circle: the wheel hides what is below it inside this. */
  inner: number;
  /** The tip circle. */
  outer: number;
  depth: number;
  pitch: number;
  spokes: number;
  leaves: number;
  pinionRadius: number | null;
  /** Degrees a beat. */
  step: number;
  /** From the watch centre. */
  arbor: Point2;
  /** The wheel whose pinion this one's teeth turn. */
  driven: Wheel | null;
  toothPhase: number;
  pinionPhase: number | null;
}

export interface BalanceDesign {
  radius: number;
  arbor: Point2;
  impulsePinRadius: number;
  pinDirection: number;
  studAngle: number;
}

export interface ForkDesign {
  pivot: Point2;
  heading: number;
  /** (along, across) from the pivot. */
  outline: Point2[];
}

export interface Design {
  canvas: { width: number; height: number };
  watchCentre: Point2;
  palette: Palette;
  timing: Timing;
  /** In train order: barrel, centre, third, fourth, escape. */
  wheels: Wheel[];
  escapeSolid: boolean;
  escapePhase: number;
  balance: BalanceDesign;
  fork: ForkDesign;
  /** The round parts a part is hidden inside, back to front: wheels, then
   *  the balance. */
  stack: (Wheel | "balance")[];
  case: { caseRadius: number; bezelRadius: number; ringRadius: number };
  hands: { hour: number; minute: number };
}

type Json = unknown;

function fail(where: string, wanted: string): never {
  throw new Error(`design.json: ${where} should be ${wanted}`);
}

function record(value: Json, where: string): Record<string, Json> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail(where, "an object");
  }
  return value as Record<string, Json>;
}

function field(
  parent: Record<string, Json>,
  name: string,
  where: string,
): Json {
  if (!(name in parent)) return fail(`${where}.${name}`, "present");
  return parent[name];
}

function num(
  parent: Record<string, Json>,
  name: string,
  where: string,
): number {
  const value = field(parent, name, where);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fail(`${where}.${name}`, "a number");
  }
  return value;
}

function text(
  parent: Record<string, Json>,
  name: string,
  where: string,
): string {
  const value = field(parent, name, where);
  if (typeof value !== "string") return fail(`${where}.${name}`, "a string");
  return value;
}

function flag(
  parent: Record<string, Json>,
  name: string,
  where: string,
): boolean {
  const value = field(parent, name, where);
  if (typeof value !== "boolean") return fail(`${where}.${name}`, "a boolean");
  return value;
}

function point(value: Json, where: string): Point2 {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== "number" ||
    typeof value[1] !== "number"
  ) {
    return fail(where, "a pair of numbers");
  }
  return [value[0], value[1]];
}

function list(
  parent: Record<string, Json>,
  name: string,
  where: string,
): Json[] {
  const value = field(parent, name, where);
  if (!Array.isArray(value)) return fail(`${where}.${name}`, "a list");
  return value as Json[];
}

function nullableNumber(
  parent: Record<string, Json>,
  name: string,
  where: string,
): number | null {
  return field(parent, name, where) === null ? null : num(parent, name, where);
}

/** Check the JSON and turn its names into objects. */
export function readDesign(json: Json): Design {
  const root = record(json, "the file");
  if (num(root, "format", "the file") !== 1) return fail("format", "1");
  const canvas = record(field(root, "canvas", "the file"), "canvas");
  const palette = record(field(root, "palette", "the file"), "palette");
  const timing = record(field(root, "timing", "the file"), "timing");
  const balance = record(field(root, "balance", "the file"), "balance");
  const fork = record(field(root, "fork", "the file"), "fork");
  const caseSizes = record(field(root, "case", "the file"), "case");
  const hands = record(field(root, "hands", "the file"), "hands");

  const drivenNames = new Map<Wheel, string | null>();
  const wheels = list(root, "wheels", "the file").map((entry, index) => {
    const where = `wheels[${String(index)}]`;
    const wheel = record(entry, where);
    const made: Wheel = {
      name: text(wheel, "name", where),
      teeth: num(wheel, "teeth", where),
      pitchRadius: num(wheel, "pitchRadius", where),
      inner: num(wheel, "inner", where),
      outer: num(wheel, "outer", where),
      depth: num(wheel, "depth", where),
      pitch: num(wheel, "pitch", where),
      spokes: num(wheel, "spokes", where),
      leaves: num(wheel, "leaves", where),
      pinionRadius: nullableNumber(wheel, "pinionRadius", where),
      step: num(wheel, "step", where),
      arbor: point(field(wheel, "arbor", where), `${where}.arbor`),
      driven: null,
      toothPhase: num(wheel, "toothPhase", where),
      pinionPhase: nullableNumber(wheel, "pinionPhase", where),
    };
    const driven = field(wheel, "driven", where);
    if (driven !== null && typeof driven !== "string") {
      return fail(`${where}.driven`, "a name or null");
    }
    drivenNames.set(made, driven);
    return made;
  });
  for (const wheel of wheels) {
    const name = drivenNames.get(wheel);
    if (name === null || name === undefined) continue;
    const found = wheels.find((other) => other.name === name);
    if (!found) return fail(`${wheel.name}.driven`, "the name of a wheel");
    wheel.driven = found;
  }
  const stack = list(root, "stack", "the file").map((name) => {
    if (name === "balance") return "balance" as const;
    const found = wheels.find((wheel) => wheel.name === name);
    if (!found) return fail("stack", "wheel names and balance");
    return found;
  });

  return {
    canvas: {
      width: num(canvas, "width", "canvas"),
      height: num(canvas, "height", "canvas"),
    },
    watchCentre: point(field(root, "watchCentre", "the file"), "watchCentre"),
    palette: {
      line: text(palette, "line", "palette"),
      frame: text(palette, "frame", "palette"),
      detail: text(palette, "detail", "palette"),
      knockout: text(palette, "knockout", "palette"),
      background: text(palette, "background", "palette"),
    },
    timing: {
      period: num(timing, "period", "timing"),
      amplitude: num(timing, "amplitude", "timing"),
      pinArc: num(timing, "pinArc", "timing"),
      bank: num(timing, "bank", "timing"),
      unlock: num(timing, "unlock", "timing"),
      fourthLoop: num(timing, "fourthLoop", "timing"),
      hourRatio: num(timing, "hourRatio", "timing"),
    },
    wheels,
    escapeSolid: flag(root, "escapeSolid", "the file"),
    escapePhase: num(root, "escapePhase", "the file"),
    balance: {
      radius: num(balance, "radius", "balance"),
      arbor: point(field(balance, "arbor", "balance"), "balance.arbor"),
      impulsePinRadius: num(balance, "impulsePinRadius", "balance"),
      pinDirection: num(balance, "pinDirection", "balance"),
      studAngle: num(balance, "studAngle", "balance"),
    },
    fork: {
      pivot: point(field(fork, "pivot", "fork"), "fork.pivot"),
      heading: num(fork, "heading", "fork"),
      outline: list(fork, "outline", "fork").map((entry, index) =>
        point(entry, `fork.outline[${String(index)}]`),
      ),
    },
    stack,
    case: {
      caseRadius: num(caseSizes, "caseRadius", "case"),
      bezelRadius: num(caseSizes, "bezelRadius", "case"),
      ringRadius: num(caseSizes, "ringRadius", "case"),
    },
    hands: {
      hour: num(hands, "hour", "hands"),
      minute: num(hands, "minute", "hands"),
    },
  };
}

/** The watch's design, from design.json. */
export const DESIGN: Design = readDesign(designFile);

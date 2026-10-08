// Outlines as SVG-style paths, flattened to polylines. The watch's shapes are
// written with arcs and curves (as the 2D art was); a renderer takes points.
//
// A point is a corner where two path commands meet at an angle. Points inside
// one arc or curve are never corners, however coarse the steps.

import { at } from "../webgl/checked.ts";
import type { Point2 } from "../webgl/mesh.ts";

/** The largest distance of a flattened arc or curve from the true one, in
 *  slide px. The hairspring view zooms 4.46 x: 0.01 px is 0.045 px there. */
export const FLATNESS = 0.01;
/** Two commands that meet at a turn of more than this make a corner. */
const CORNER_TURN = (5 * Math.PI) / 180;

/** A closed or open outline in plan, with its corners. */
export interface Contour {
  points: Point2[];
  corners: boolean[];
  closed: boolean;
}

type Command =
  | { kind: "move"; to: Point2 }
  | { kind: "line"; to: Point2 }
  | { kind: "arc"; radius: number; large: boolean; sweep: boolean; to: Point2 }
  | { kind: "quad"; control: Point2; to: Point2 }
  | { kind: "cubic"; first: Point2; second: Point2; to: Point2 }
  | { kind: "close" };

export class Path {
  private readonly commands: Command[] = [];

  moveTo(x: number, y: number): this {
    this.commands.push({ kind: "move", to: [x, y] });
    return this;
  }

  lineTo(x: number, y: number): this {
    this.commands.push({ kind: "line", to: [x, y] });
    return this;
  }

  /** A circular arc, as SVG's A: `sweep` runs clockwise on the screen. */
  arcTo(
    radius: number,
    large: boolean,
    sweep: boolean,
    x: number,
    y: number,
  ): this {
    this.commands.push({ kind: "arc", radius, large, sweep, to: [x, y] });
    return this;
  }

  quadTo(controlX: number, controlY: number, x: number, y: number): this {
    this.commands.push({
      kind: "quad",
      control: [controlX, controlY],
      to: [x, y],
    });
    return this;
  }

  cubicTo(
    firstX: number,
    firstY: number,
    secondX: number,
    secondY: number,
    x: number,
    y: number,
  ): this {
    this.commands.push({
      kind: "cubic",
      first: [firstX, firstY],
      second: [secondX, secondY],
      to: [x, y],
    });
    return this;
  }

  close(): this {
    this.commands.push({ kind: "close" });
    return this;
  }

  /** The other path's subpaths, after this one's. */
  append(other: Path): this {
    this.commands.push(...other.commands);
    return this;
  }

  /** The path's subpaths, flattened. */
  contours(): Contour[] {
    return flatten(this.commands);
  }
}

/** A full circle about (x, y), as two half arcs. */
export function circlePath(x: number, y: number, radius: number): Path {
  return new Path()
    .moveTo(x + radius, y)
    .arcTo(radius, true, true, x - radius, y)
    .arcTo(radius, true, true, x + radius, y)
    .close();
}

function subtract(end: Point2, start: Point2): Point2 {
  return [end[0] - start[0], end[1] - start[1]];
}

/** From `start` to `end`, or null if they are the same point. */
function direction(start: Point2, end: Point2): Point2 | null {
  return start[0] === end[0] && start[1] === end[1]
    ? null
    : subtract(end, start);
}

function isCorner(arriving: Point2 | null, leaving: Point2 | null): boolean {
  if (arriving === null || leaving === null) return false;
  const cross = arriving[0] * leaving[1] - arriving[1] * leaving[0];
  const dot = arriving[0] * leaving[0] + arriving[1] * leaving[1];
  return Math.abs(Math.atan2(cross, dot)) > CORNER_TURN;
}

/** Points along an SVG arc, after its start (SVG 1.1, appendix F.6.5, for a
 *  circle: no rotation). */
function arcPoints(
  start: Point2,
  radius: number,
  large: boolean,
  sweep: boolean,
  end: Point2,
): Point2[] {
  if (radius === 0) return [end];
  const halfX = (start[0] - end[0]) / 2;
  const halfY = (start[1] - end[1]) / 2;
  const excess = (halfX * halfX + halfY * halfY) / (radius * radius);
  const arcRadius = excess > 1 ? radius * Math.sqrt(excess) : radius;
  const numerator =
    arcRadius ** 4 - arcRadius ** 2 * (halfX * halfX + halfY * halfY);
  const denominator = arcRadius ** 2 * (halfX * halfX + halfY * halfY);
  const factor =
    Math.sqrt(Math.max(0, numerator / denominator)) *
    (large === sweep ? -1 : 1);
  const centreOffsetX = factor * halfY;
  const centreOffsetY = -(factor * halfX);
  const centreX = centreOffsetX + (start[0] + end[0]) / 2;
  const centreY = centreOffsetY + (start[1] + end[1]) / 2;
  const first = Math.atan2(
    (halfY - centreOffsetY) / arcRadius,
    (halfX - centreOffsetX) / arcRadius,
  );
  const last = Math.atan2(
    (-halfY - centreOffsetY) / arcRadius,
    (-halfX - centreOffsetX) / arcRadius,
  );
  let turn = last - first;
  if (sweep && turn < 0) turn += 2 * Math.PI;
  else if (!sweep && turn > 0) turn -= 2 * Math.PI;
  // A chord of angle a is at most r (1 - cos(a / 2)) from its arc.
  const step = 2 * Math.acos(Math.max(0, 1 - FLATNESS / arcRadius));
  const steps = Math.max(1, Math.ceil(Math.abs(turn) / step));
  const points: Point2[] = [];
  for (let index = 1; index <= steps; index++) {
    const angle = first + (turn * index) / steps;
    points.push([
      centreX + arcRadius * Math.cos(angle),
      centreY + arcRadius * Math.sin(angle),
    ]);
  }
  points[points.length - 1] = end;
  return points;
}

/** Points along a Bezier curve, after its start. */
function curvePoints(start: Point2, controls: Point2[]): Point2[] {
  const all = [start, ...controls];
  const degree = all.length - 1;
  // The second differences of the control points bound the curve's bend:
  // |B''| <= degree (degree - 1) max|second difference|.
  let bend = 0;
  for (let index = 0; index + 2 < all.length; index++) {
    const [ax, ay] = at(all, index);
    const [bx, by] = at(all, index + 1);
    const [cx, cy] = at(all, index + 2);
    bend = Math.max(bend, Math.hypot(ax - 2 * bx + cx, ay - 2 * by + cy));
  }
  const steps = Math.max(
    4,
    Math.ceil(Math.sqrt((degree * (degree - 1) * bend) / (8 * FLATNESS))),
  );
  const points: Point2[] = [];
  for (let index = 1; index <= steps; index++) {
    const along = index / steps;
    let x = 0;
    let y = 0;
    for (const [power, [controlX, controlY]] of all.entries()) {
      const weight =
        binomial(degree, power) *
        along ** power *
        (1 - along) ** (degree - power);
      x += weight * controlX;
      y += weight * controlY;
    }
    points.push([x, y]);
  }
  return points;
}

function binomial(total: number, choose: number): number {
  let result = 1;
  for (let index = 1; index <= choose; index++) {
    result = (result * (total - choose + index)) / index;
  }
  return result;
}

/** The directions in which a command leaves `start` and arrives at its end.
 *  For a curve they come from its control points; for an arc, from its first
 *  and last chords. */
function endTangents(
  start: Point2,
  command: Command,
  added: Point2[],
): [Point2 | null, Point2 | null] {
  if (command.kind === "quad" || command.kind === "cubic") {
    const controls: Point2[] =
      command.kind === "quad"
        ? [start, command.control, command.to]
        : [start, command.first, command.second, command.to];
    const leaving = controls
      .slice(1)
      .filter((point) => point[0] !== start[0] || point[1] !== start[1])
      .map((point) => direction(start, point))[0];
    const end = at(controls, controls.length - 1);
    const arriving = controls
      .slice(0, -1)
      .reverse()
      .filter((point) => point[0] !== end[0] || point[1] !== end[1])
      .map((point) => direction(point, end))[0];
    return [leaving ?? null, arriving ?? null];
  }
  const beforeEnd = added.length > 1 ? at(added, added.length - 2) : start;
  return [
    direction(start, at(added, 0)),
    direction(beforeEnd, at(added, added.length - 1)),
  ];
}

function flatten(commands: Command[]): Contour[] {
  const contours: Contour[] = [];
  let points: Point2[] = [];
  let corners: boolean[] = [];
  let current: Point2 = [0, 0];
  let firstLeaving: Point2 | null = null;
  let arriving: Point2 | null = null;

  const finish = (closed: boolean): void => {
    if (points.length > 1) {
      if (closed) {
        const last = at(points, points.length - 1);
        const first = at(points, 0);
        // the last point is the first again, up to rounding
        const repeated =
          Math.hypot(last[0] - first[0], last[1] - first[1]) < 1e-9;
        const closing = repeated ? null : direction(last, first);
        if (closing === null) {
          points.pop();
          corners.pop();
          corners[0] = isCorner(arriving, firstLeaving);
        } else {
          corners[corners.length - 1] = isCorner(arriving, closing);
          corners[0] = isCorner(closing, firstLeaving);
        }
      }
      contours.push({ points, corners, closed });
    }
    points = [];
    corners = [];
  };

  for (const command of commands) {
    if (command.kind === "move") {
      finish(false);
      current = command.to;
      points = [current];
      corners = [false];
      firstLeaving = null;
      arriving = null;
    } else if (command.kind === "close") {
      finish(true);
    } else {
      let added: Point2[];
      if (command.kind === "line") added = [command.to];
      else if (command.kind === "arc") {
        added = arcPoints(
          current,
          command.radius,
          command.large,
          command.sweep,
          command.to,
        );
      } else {
        added = curvePoints(
          current,
          command.kind === "quad"
            ? [command.control, command.to]
            : [command.first, command.second, command.to],
        );
      }
      const [leaving, nextArriving] = endTangents(current, command, added);
      if (points.length === 1) firstLeaving = leaving;
      else corners[corners.length - 1] = isCorner(arriving, leaving);
      points.push(...added);
      corners.push(...added.map(() => false));
      current = at(added, added.length - 1);
      arriving = nextArriving;
    }
  }
  finish(false);
  return contours;
}

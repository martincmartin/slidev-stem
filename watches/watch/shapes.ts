// The watch's 2D outlines, ported from the Python art (watch_design.py,
// frozen in tasks/2026-09-29-webgl-watch/inputs/art/). Each is a Path, about
// its own origin, in slide px. Angles are screen angles in degrees: 0 is
// 3 o'clock, increasing clockwise, because y points down.

import type { Point2 } from "../webgl/mesh.ts";
import { Path, circlePath } from "./path.ts";

export function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Polar to xy, from `origin`. */
export function polar(
  radius: number,
  angleDegrees: number,
  origin: Point2 = [0, 0],
): Point2 {
  const theta = radians(angleDegrees);
  return [
    origin[0] + radius * Math.cos(theta),
    origin[1] + radius * Math.sin(theta),
  ];
}

/** A clock-face angle (0 = 12 o'clock, clockwise) as a screen angle. */
export function clock(clockAngle: number): number {
  return clockAngle - 90;
}

export function disc(radius: number): Path {
  return circlePath(0, 0, radius);
}

/** An annulus as two subpaths, for the even-odd rule. */
export function ring(outer: number, inner: number): Path {
  return circlePath(0, 0, outer).append(circlePath(0, 0, inner));
}

export interface GearOptions {
  addendum?: number;
  dedendum?: number;
  /** As fractions of the angle between two teeth. */
  rootWidth?: number;
  tipWidth?: number;
}

/** The closed outline of a toothed wheel, centred on the origin. */
export function gear(
  teeth: number,
  pitchRadius: number,
  phase = 0,
  options: GearOptions = {},
): Path {
  const {
    addendum = 4,
    dedendum = 4,
    rootWidth = 0.56,
    tipWidth = 0.3,
  } = options;
  const toothAngle = 360 / teeth;
  const rootRadius = pitchRadius - dedendum;
  const tipRadius = pitchRadius + addendum;
  const path = new Path();
  for (let index = 0; index < teeth; index++) {
    const middle = phase + index * toothAngle;
    if (index === 0) {
      path.moveTo(...polar(rootRadius, middle - (rootWidth * toothAngle) / 2));
    }
    path.lineTo(...polar(tipRadius, middle - (tipWidth * toothAngle) / 2));
    path.arcTo(
      tipRadius,
      false,
      true,
      ...polar(tipRadius, middle + (tipWidth * toothAngle) / 2),
    );
    path.lineTo(...polar(rootRadius, middle + (rootWidth * toothAngle) / 2));
    path.arcTo(
      rootRadius,
      false,
      true,
      ...polar(rootRadius, middle + toothAngle - (rootWidth * toothAngle) / 2),
    );
  }
  return path.close();
}

/** A lever escape wheel: club teeth whose locking face leads anticlockwise,
 *  the way this one turns. */
export function escapeOutline(
  teeth: number,
  rootRadius: number,
  tipRadius: number,
  phase = 0,
): Path {
  const toothAngle = -360 / teeth;
  const path = new Path();
  for (let index = 0; index < teeth; index++) {
    const tip = phase + index * toothAngle;
    if (index === 0) path.moveTo(...polar(rootRadius, tip - 0.9 * toothAngle));
    // the back of the tooth curves up to the club; the club's flat top is the
    // impulse face; the locking face drops almost radially
    const [controlX, controlY] = polar(rootRadius + 2, tip - 0.55 * toothAngle);
    path.quadTo(
      controlX,
      controlY,
      ...polar(tipRadius - 2, tip - 0.22 * toothAngle),
    );
    path.lineTo(...polar(tipRadius, tip));
    path.lineTo(...polar(rootRadius, tip + 0.04 * toothAngle));
    path.arcTo(
      rootRadius,
      false,
      false,
      ...polar(rootRadius, tip + 0.1 * toothAngle),
    );
  }
  return path.close();
}

/** The gaps between straight spokes of constant width, one subpath each. */
export function openings(
  spokes: number,
  hubRadius: number,
  rimRadius: number,
  spokeWidth: number,
  phase = 0,
): Path {
  const halfWidth = spokeWidth / 2;
  const edge = (spokeAngle: number, side: number, radius: number): Point2 => {
    const along = Math.sqrt(radius * radius - halfWidth * halfWidth);
    const theta = radians(spokeAngle);
    return [
      along * Math.cos(theta) - side * halfWidth * Math.sin(theta),
      along * Math.sin(theta) + side * halfWidth * Math.cos(theta),
    ];
  };
  const path = new Path();
  for (let index = 0; index < spokes; index++) {
    const spoke = phase + (index * 360) / spokes;
    const nextSpoke = spoke + 360 / spokes;
    path.moveTo(...edge(spoke, 1, rimRadius));
    path.arcTo(rimRadius, false, true, ...edge(nextSpoke, -1, rimRadius));
    path.lineTo(...edge(nextSpoke, -1, hubRadius));
    path.arcTo(hubRadius, false, false, ...edge(spoke, 1, hubRadius));
    path.close();
  }
  return path;
}

/** An Archimedean spiral from (innerRadius, innerAngle) to (outerRadius,
 *  outerAngle), angles in degrees, as cubic Beziers: the barrel's mainspring. */
export function spiralCurve(
  innerRadius: number,
  outerRadius: number,
  innerAngle: number,
  outerAngle: number,
  segments: number,
): Path {
  const inner = radians(innerAngle);
  const sweep = radians(outerAngle) - inner;
  const radialSpan = outerRadius - innerRadius;
  const point = (fraction: number): [Point2, Point2] => {
    const radius = innerRadius + fraction * radialSpan;
    const theta = inner + fraction * sweep;
    return [
      [radius * Math.cos(theta), radius * Math.sin(theta)],
      [
        radialSpan * Math.cos(theta) - radius * sweep * Math.sin(theta),
        radialSpan * Math.sin(theta) + radius * sweep * Math.cos(theta),
      ],
    ];
  };
  let [start, startTangent] = point(0);
  const path = new Path().moveTo(...start);
  const handle = 1 / segments / 3;
  for (let index = 1; index <= segments; index++) {
    const [end, endTangent] = point(index / segments);
    path.cubicTo(
      start[0] + startTangent[0] * handle,
      start[1] + startTangent[1] * handle,
      end[0] - endTangent[0] * handle,
      end[1] - endTangent[1] * handle,
      ...end,
    );
    start = end;
    startTangent = endTangent;
  }
  return path;
}

/** A pinion: few, rounded leaves, at the pitch of the wheel that drives it. */
export function pinionOutline(
  leaves: number,
  radius: number,
  phase: number,
): Path {
  const leafPitch = (2 * Math.PI * radius) / leaves;
  return gear(leaves, radius, phase, {
    addendum: Math.min(3.5, 0.3 * leafPitch),
    dedendum: Math.min(4.5, 0.42 * leafPitch),
    rootWidth: 0.5,
    tipWidth: 0.4,
  });
}

/** A closed polygon of straight edges. */
export function polygon(points: Point2[]): Path {
  const [first, ...rest] = points;
  if (first === undefined) throw new Error("a polygon needs points");
  const path = new Path().moveTo(...first);
  for (const point of rest) path.lineTo(...point);
  return path.close();
}

export interface DaggerOptions {
  length: number;
  maxWidth: number;
  /** The widest point, as a fraction of the length. */
  widestAt: number;
  tail: number;
  tailWidth: number;
  /** The hand narrows to `tailWidth` this far from the arbor. */
  neck?: number;
}

/** A hand pointing at 12 from the origin: widest at `widestAt` of its length,
 *  with a short tail. */
export function dagger(options: DaggerOptions): Path {
  const { length, maxWidth, widestAt, tail, tailWidth, neck } = options;
  const side: Point2[] = [[maxWidth / 2, -length * widestAt]];
  if (neck !== undefined) side.push([tailWidth / 2, -neck]);
  side.push([tailWidth / 2, tail]);
  const mirrored = side
    .map(([across, along]): Point2 => [-across, along])
    .reverse();
  return polygon([[0, -length], ...side, ...mirrored]);
}

/** The pallet fork as (along the lever, across it) from its pivot, with the
 *  lever pointing at the balance: the fork's mouth at `mouth`, its two pallets
 *  on the far side of the pivot, at the escape wheel. */
export function forkOutline(mouth: number): Point2[] {
  return [
    [mouth - 17, 4.5],
    [mouth - 10, 11],
    [mouth + 3, 12.5],
    [mouth + 6.5, 8.5],
    [mouth - 7, 6.8],
    [mouth - 7, -6.8],
    [mouth + 6.5, -8.5],
    [mouth + 3, -12.5],
    [mouth - 10, -11],
    [mouth - 17, -4.5],
    [6, -4.5],
    // The entry pallet locks on its inside face. It cannot be a mirror of the
    // exit pallet below: that puts its body over the stopped tooth.
    [0, -26],
    [-11, -28],
    [-17, -23],
    [-16, -19],
    [-7, -24],
    [-5, 0],
    [-6, 13],
    [-13, 15],
    [-15, 19],
    [-9, 23],
    [1, 21],
    [6, 4.5],
  ];
}

/** A rectangle with rounded corners, as lines and quarter arcs. */
export function roundedRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  corner: number,
): Path {
  return new Path()
    .moveTo(x + corner, y)
    .lineTo(x + width - corner, y)
    .arcTo(corner, false, true, x + width, y + corner)
    .lineTo(x + width, y + height - corner)
    .arcTo(corner, false, true, x + width - corner, y + height)
    .lineTo(x + corner, y + height)
    .arcTo(corner, false, true, x, y + height - corner)
    .lineTo(x, y + corner)
    .arcTo(corner, false, true, x + corner, y)
    .close();
}

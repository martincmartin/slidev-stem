// Where slide 4's callouts point: points on the escapement, in a pose, where
// the slide's view shows them. The slide places each callout's label; its
// leader ends here, so the leaders follow the design and the view
// (docs/watch.md, "Slide 4: the escapement").

import { at } from "../webgl/checked.ts";
import { transformPoint } from "../webgl/math.ts";
import type { Point2 } from "../webgl/mesh.ts";
import { viewProjection } from "../webgl/renderer.ts";
import type { Vec3, View } from "../webgl/scene.ts";
import type { Design, Wheel } from "./design.ts";
import {
  FORK_PIVOT_RADIUS,
  forkOutlineLocal,
  JEWEL_RADIUS,
} from "./generate.ts";
import type { Watch } from "./generate.ts";
import { polar, radians } from "./shapes.ts";
import { stageState, watchState } from "./state.ts";

/** Degrees: the length of the drive arrow's arc on the escape wheel. */
const DRIVE_ARC = 90;
const DRIVE_POINTS = 24;
/** How far the pallet's leader ends down the fork's lower arm: this fraction
 *  of the way from the pivot's circle to the tip of the overlap (`palletPoint`).
 *  Lower looked too far from the pivot; at the point farthest from every edge
 *  (0.1 of the way) it looked like it pointed at the pivot. */
const PALLET_DEPTH = 0.25;

/** In slide px. */
export interface EscapementMarks {
  /** The escape wheel's arbor, on the wheel's face. */
  readonly escape: Point2;
  /** The escape wheel's root circle: its face is inside it. */
  readonly escapeRadius: number;
  /** The drive arrow, from its tail to its head: an arc on the escape wheel's
   *  face, at its pinion's radius, centred on the line to the fourth wheel,
   *  in the direction that the fourth wheel turns it. */
  readonly drive: readonly Point2[];
  /** On the fork's lower arm, at `palletPoint`, on the fork's top. */
  readonly pallet: Point2;
  /** The impulse jewel's centre, on its top, with the balance at rest: the
   *  middle of the fork's mouth, where the jewel meets the fork. */
  readonly jewel: Point2;
  readonly jewelRadius: number;
}

/** Where the view, at `tilt` degrees, shows a point of the world on a slide
 *  of `slide` px. The renderer's own camera: a change to it moves these too. */
export function onSlide(
  view: View,
  tilt: number,
  slide: readonly [number, number],
  point: Vec3,
): Point2 {
  const camera = viewProjection(view, tilt, slide);
  const [x, y] = transformPoint(camera.matrix, point);
  return [((x + 1) / 2) * slide[0], ((1 - y) / 2) * slide[1]];
}

/** A point turned by `degrees` about `pivot`, as the model turns a group. */
function turnedAbout(point: Point2, degrees: number, pivot: Point2): Point2 {
  const cosine = Math.cos(radians(degrees));
  const sine = Math.sin(radians(degrees));
  const [x, y] = [point[0] - pivot[0], point[1] - pivot[1]];
  return [pivot[0] + x * cosine - y * sine, pivot[1] + x * sine + y * cosine];
}

/** Whether `point` is inside the closed `polygon` (even-odd). */
export function insidePolygon(
  point: Point2,
  polygon: readonly Point2[],
): boolean {
  let inside = false;
  polygon.forEach((start, index) => {
    const end = at(polygon, (index + 1) % polygon.length);
    if (start[1] > point[1] !== end[1] > point[1]) {
      const x =
        start[0] +
        ((point[1] - start[1]) * (end[0] - start[0])) / (end[1] - start[1]);
      if (point[0] < x) inside = !inside;
    }
  });
  return inside;
}

/** The edges of a closed polygon. */
function edgesOf(polygon: readonly Point2[]): [Point2, Point2][] {
  return polygon.map((start, index) => [
    start,
    at(polygon, (index + 1) % polygon.length),
  ]);
}

/** Where the edges of two polygons cross. */
function crossings(
  first: readonly Point2[],
  second: readonly Point2[],
): Point2[] {
  const found: Point2[] = [];
  for (const [a, b] of edgesOf(first)) {
    for (const [c, d] of edgesOf(second)) {
      const denominator =
        (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
      if (denominator === 0) continue;
      const along =
        ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) /
        denominator;
      const across =
        ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) /
        denominator;
      if (along >= 0 && along <= 1 && across >= 0 && across <= 1) {
        found.push([
          a[0] + along * (b[0] - a[0]),
          a[1] + along * (b[1] - a[1]),
        ]);
      }
    }
  }
  return found;
}

/** The intervals of x where the line at `y` is inside the polygon. */
function spansAt(polygon: readonly Point2[], y: number): [number, number][] {
  const xs = edgesOf(polygon)
    .filter(([start, end]) => start[1] > y !== end[1] > y)
    .map(
      ([start, end]) =>
        start[0] + ((y - start[1]) * (end[0] - start[0])) / (end[1] - start[1]),
    )
    .sort((left, right) => left - right);
  const spans: [number, number][] = [];
  for (let index = 0; index + 1 < xs.length; index += 2) {
    spans.push([at(xs, index), at(xs, index + 1)]);
  }
  return spans;
}

/** The fork's outline in the world at each end of its swing. */
export function forkAtBanks(design: Design): [Point2[], Point2[]] {
  const pivot = worldOf(design, design.fork.pivot);
  const outline = forkOutlineLocal(
    design.fork.outline,
    design.fork.heading,
  ).map(([x, y]): Point2 => [pivot[0] + x, pivot[1] + y]);
  const turned = (bank: number): Point2[] =>
    outline.map((corner) => turnedAbout(corner, bank, pivot));
  return [turned(design.timing.bank), turned(-design.timing.bank)];
}

/** Where the pallet's leader ends, in the world's plan: a point that the fork
 *  covers at both ends of its swing, so at every angle between them, on its
 *  lower arm, clear of the pivot. The overlap of the two outlines ends below
 *  the pivot in a tip; the point is PALLET_DEPTH of the way down from the
 *  pivot's circle to that tip, in the middle of the overlap's width there. */
export function palletPoint(design: Design): Point2 {
  const pivot = worldOf(design, design.fork.pivot);
  const [first, second] = forkAtBanks(design);
  // the overlap's corners: a corner of one outline inside the other, or a
  // crossing of their edges. Its tip is the lowest (y grows downward).
  const corners = [
    ...first.filter((corner) => insidePolygon(corner, second)),
    ...second.filter((corner) => insidePolygon(corner, first)),
    ...crossings(first, second),
  ];
  const tip = Math.max(...corners.map((corner) => corner[1]));
  const top = pivot[1] + FORK_PIVOT_RADIUS;
  if (!(tip > top)) throw new Error("the fork's overlap has no lower arm");
  const y = top + PALLET_DEPTH * (tip - top);
  // of the overlap's intervals on that line, the one nearest the pivot's
  const spans = spansAt(first, y).flatMap(([left, right]) =>
    spansAt(second, y)
      .map(([otherLeft, otherRight]): [number, number] => [
        Math.max(left, otherLeft),
        Math.min(right, otherRight),
      ])
      .filter(([low, high]) => low < high),
  );
  const gap = ([low, high]: [number, number]): number =>
    Math.max(low - pivot[0], pivot[0] - high, 0);
  const nearest = spans.reduce((best, span) =>
    gap(span) < gap(best) ? span : best,
  );
  return [(nearest[0] + nearest[1]) / 2, y];
}

/** A point of the design (from the watch centre) in the world. */
function worldOf(design: Design, [x, y]: Point2): Point2 {
  return [design.watchCentre[0] + x, design.watchCentre[1] + y];
}

/** The marks for the slide whose frontmatter is `frontmatter`: its view and
 *  its tilt. Throws if the slide shows no watch. */
export function escapementMarks(
  watch: Watch,
  frontmatter: Record<string, unknown>,
): EscapementMarks {
  const state = watchState(frontmatter, 0);
  if (!state) throw new Error("the escapement's callouts need a `watch:` view");
  const { view, tilt } = stageState(watch.scene, state);
  const { design, escapementTops: tops } = watch;
  const shown = (point: Point2, z: number): Point2 =>
    onSlide(view, tilt, watch.scene.slide, [point[0], point[1], z]);
  const world = (point: Point2): Point2 => worldOf(design, point);
  const [, , , fourth, escape] = design.wheels as [
    Wheel,
    Wheel,
    Wheel,
    Wheel,
    Wheel,
  ];

  // the drive: the fourth wheel's teeth push the escape pinion
  const escapeArbor = world(escape.arbor);
  const fourthArbor = world(fourth.arbor);
  const toFourth =
    (Math.atan2(
      fourthArbor[1] - escapeArbor[1],
      fourthArbor[0] - escapeArbor[0],
    ) *
      180) /
    Math.PI;
  const turn = Math.sign(escape.step);
  const pinion = escape.pinionRadius;
  if (pinion === null) throw new Error("the escape wheel has no pinion");
  const drive = Array.from({ length: DRIVE_POINTS + 1 }, (_, index) =>
    shown(
      polar(
        pinion,
        toFourth + turn * DRIVE_ARC * (index / DRIVE_POINTS - 0.5),
        escapeArbor,
      ),
      tops.escape,
    ),
  );

  const jewel = polar(
    design.balance.impulsePinRadius,
    design.balance.pinDirection,
    world(design.balance.arbor),
  );
  return {
    escape: shown(escapeArbor, tops.escape),
    escapeRadius: escape.inner * view.scale,
    drive,
    pallet: shown(palletPoint(design), tops.fork),
    jewel: shown(jewel, tops.jewel),
    jewelRadius: JEWEL_RADIUS * view.scale,
  };
}

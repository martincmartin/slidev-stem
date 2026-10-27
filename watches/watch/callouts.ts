// Where the Escapement slide's and the Gears slide's callouts point: points on
// the watch, in a pose, where the slide's view shows them. The slide places
// each callout's label; its leader ends here, so the leaders follow the design
// and the view (docs/watch.md, "The Escapement slide" and "The Gears slide").

import { at } from "../webgl/checked.ts";
import { transformPoint } from "../webgl/math.ts";
import type { Point2 } from "../webgl/mesh.ts";
import { viewProjection } from "../webgl/renderer.ts";
import type { CameraAngles, Vec3, View } from "../webgl/scene.ts";
import type { Design, Wheel } from "./design.ts";
import {
  forkOutlineLocal,
  JEWEL_FLAT_OFFSET,
  JEWEL_RADIUS,
} from "./generate.ts";
import type { Watch } from "./generate.ts";
import { polar, radians } from "./shapes.ts";
import { stageState, watchState } from "./state.ts";
import { pinionTip } from "./teeth.ts";

/** Points on a tip circle (the escape wheel's, or a gear's on the Gears
 *  slide), for a leader that ends outside. */
const TIP_POINTS = 120;
/** In slide px: how far outside its part the wheel's and the pallet's leaders
 *  end (the callout's `stop`, with `clear`). */
export const LEADER_GAP = 10;

/** In slide px. */
export interface EscapementMarks {
  /** The escape wheel's arbor, on the wheel's face: where its leader aims. */
  readonly escape: Point2;
  /** Where the pallet's leader aims (`palletAim`), on the fork's top. */
  readonly pallet: Point2;
  /** The impulse jewel's deepest point, on its top, with the balance at rest
   *  (in the fork's mouth): the centre of the largest circle inside the D,
   *  midway between its flat and the far side of its arc. */
  readonly jewel: Point2;
  /** The outlines that the pallet's and the wheel's leaders end outside: the
   *  fork at either bank, and the escape wheel's tip circle. */
  readonly forkOutlines: readonly (readonly Point2[])[];
  readonly escapeTips: readonly Point2[];
}

/** Where the view, at `angles`, shows a point of the world on a slide of
 *  `slide` px. The renderer's own camera: a change to it moves these too. */
export function onSlide(
  view: View,
  angles: CameraAngles,
  slide: readonly [number, number],
  point: Vec3,
): Point2 {
  const camera = viewProjection(view, angles, slide);
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

/** The edges of a closed polygon. */
function edgesOf(polygon: readonly Point2[]): [Point2, Point2][] {
  return polygon.map((start, index) => [
    start,
    at(polygon, (index + 1) % polygon.length),
  ]);
}

/** Where the segment a-b crosses the segment c-d, as the fraction of the way
 *  from a to b; `undefined` if they do not cross. */
function crossingAlong(
  [a, b]: readonly [Point2, Point2],
  [c, d]: readonly [Point2, Point2],
): number | undefined {
  const denominator =
    (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
  if (denominator === 0) return undefined;
  const along =
    ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) /
    denominator;
  const across =
    ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) /
    denominator;
  return along >= 0 && along <= 1 && across >= 0 && across <= 1
    ? along
    : undefined;
}

/** Where the segment from `start` to `end` first meets one of `outlines`
 *  (closed polygons), as the fraction of the way; `undefined` if it meets
 *  none. */
export function firstCrossing(
  start: Point2,
  end: Point2,
  outlines: readonly (readonly Point2[])[],
): number | undefined {
  const found = outlines
    .flatMap((outline) =>
      edgesOf(outline).map((edge) => crossingAlong([start, end], edge)),
    )
    .filter((along) => along !== undefined);
  return found.length > 0 ? Math.min(...found) : undefined;
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

/** Where the pallet's leader aims, in the world's plan; it ends outside the
 *  fork, on the way there. On the fork's outline, B is the corner before its
 *  lowest, where the back of the arm turns gently up. A is the first corner
 *  after the lowest where the outline turns inward, sharply: where the lower
 *  stone meets the arm. The aim is halfway between A at its leftmost and B
 *  at its rightmost, over the fork's swing. */
export function palletAim(design: Design): Point2 {
  const pivot = worldOf(design, design.fork.pivot);
  const outline = forkOutlineLocal(
    design.fork.outline,
    design.fork.heading,
  ).map(([x, y]): Point2 => [pivot[0] + x, pivot[1] + y]);
  const count = outline.length;
  const corner = (index: number): Point2 =>
    at(outline, (index + count) % count);
  /** Degrees; the sign says which way the outline turns. */
  const turnAt = (index: number): number => {
    const [before, here, after] = [
      corner(index - 1),
      corner(index),
      corner(index + 1),
    ];
    const into = [here[0] - before[0], here[1] - before[1]];
    const out = [after[0] - here[0], after[1] - here[1]];
    return (
      (Math.atan2(
        at(into, 0) * at(out, 1) - at(into, 1) * at(out, 0),
        at(into, 0) * at(out, 0) + at(into, 1) * at(out, 1),
      ) *
        180) /
      Math.PI
    );
  };
  const lowest = outline.reduce(
    (best, point, index) => (point[1] > at(outline, best)[1] ? index : best),
    0,
  );
  // the lowest corner turns outward: its sign is the sign of an outward turn
  const outward = Math.sign(turnAt(lowest));
  const bIndex = lowest - 1;
  if (Math.abs(turnAt(bIndex)) > 45) throw new Error("B is not a gentle turn");
  let aIndex = lowest + 1;
  while (!(-outward * turnAt(aIndex) > 45)) {
    aIndex++;
    if (aIndex > lowest + count)
      throw new Error("no inward turn after the bottom");
  }
  const banks = [design.timing.bank, -design.timing.bank];
  const swung = (index: number): Point2[] =>
    banks.map((bank) => turnedAbout(corner(index), bank, pivot));
  const a = swung(aIndex).reduce((best, point) =>
    point[0] < best[0] ? point : best,
  );
  const b = swung(bIndex).reduce((best, point) =>
    point[0] > best[0] ? point : best,
  );
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/** A point of the design (from the watch centre) in the world. */
function worldOf(design: Design, [x, y]: Point2): Point2 {
  return [design.watchCentre[0] + x, design.watchCentre[1] + y];
}

/** Where the slide whose frontmatter is `frontmatter` shows a point of the
 *  world's plan at height `z`, with its view and its angles. Throws if the
 *  slide shows no watch. */
function slideProjection(
  watch: Watch,
  frontmatter: Record<string, unknown>,
): (point: Point2, z: number) => Point2 {
  const state = watchState(frontmatter, 0);
  if (!state) throw new Error("a slide's callouts need a `watch:`");
  const stage = stageState(watch, state);
  return (point, z) =>
    onSlide(stage.view, stage, watch.scene.slide, [point[0], point[1], z]);
}

/** The impulse jewel's deepest point in the world's plan, with the balance
 *  at `swing` degrees: the centre of the largest circle inside the D. The D
 *  runs from JEWEL_RADIUS behind its centre to JEWEL_FLAT_OFFSET in front of
 *  it, along pinDirection. */
function jewelPoint(design: Design, swing: number): Point2 {
  return polar(
    design.balance.impulsePinRadius + (JEWEL_FLAT_OFFSET - JEWEL_RADIUS) / 2,
    design.balance.pinDirection + swing,
    worldOf(design, design.balance.arbor),
  );
}

/** In slide px: where a tooth of the escape wheel strikes a pallet stone,
 *  and the way a sound goes out from there (a unit vector). */
export interface Strike {
  readonly at: Point2;
  readonly away: Point2;
}

/** The distance from `point` to the nearest edge of a closed polygon. */
export function distanceToOutline(
  point: Point2,
  outline: readonly Point2[],
): number {
  return Math.min(
    ...edgesOf(outline).map(([start, end]) => {
      const [dx, dy] = [end[0] - start[0], end[1] - start[1]];
      const along = Math.max(
        0,
        Math.min(
          1,
          ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) /
            (dx * dx + dy * dy),
        ),
      );
      return Math.hypot(
        point[0] - (start[0] + along * dx),
        point[1] - (start[1] + along * dy),
      );
    }),
  );
}

/** In the world's plan: where a tooth of the escape wheel lands on a pallet
 *  stone at the end of each tick window (`tickWindows` in model.ts), one for
 *  each window. Then the fork is at the bank that the window turned it to
 *  (`forkAtBanks`), and the train has stepped one beat in each window: the
 *  tooth tip on the fork's outline is the one that has landed. */
export function toothDrops(design: Design): [Point2, Point2] {
  const [, , , , escape] = design.wheels as [Wheel, Wheel, Wheel, Wheel, Wheel];
  const arbor = worldOf(design, escape.arbor);
  const banks = forkAtBanks(design);
  const drop = (window: number): Point2 => {
    // as escapeOutline places the tips, turned as the model turns the wheel
    const tips = Array.from({ length: escape.teeth }, (_, index) =>
      polar(
        escape.outer,
        design.escapePhase -
          (index * 360) / escape.teeth +
          escape.step * (window + 1),
        arbor,
      ),
    );
    const outline = at(banks, window);
    return tips.reduce((best, tip) =>
      distanceToOutline(tip, outline) < distanceToOutline(best, outline)
        ? tip
        : best,
    );
  };
  return [drop(0), drop(1)];
}

/** The strikes on the slide whose frontmatter is `frontmatter`, one for each
 *  tick window (`StrikeTime.window` in model.ts): where a tooth of the
 *  escape wheel lands on a pallet stone (`toothDrops`), on the wheel's top.
 *  Each sound goes straight out from the wheel's arbor, through its strike:
 *  the tooth makes it. */
export function stoneStrikes(
  watch: Watch,
  frontmatter: Record<string, unknown>,
): [Strike, Strike] {
  const shown = slideProjection(watch, frontmatter);
  const { design, escapementTops: tops } = watch;
  const [, , , , escape] = design.wheels as [Wheel, Wheel, Wheel, Wheel, Wheel];
  const arbor = shown(worldOf(design, escape.arbor), tops.escape);
  const strike = (drop: Point2): Strike => {
    const at = shown(drop, tops.escape);
    const [x, y] = [at[0] - arbor[0], at[1] - arbor[1]];
    const length = Math.hypot(x, y);
    return { at, away: [x / length, y / length] };
  };
  const [first, second] = toothDrops(design);
  return [strike(first), strike(second)];
}

/** The marks for the slide whose frontmatter is `frontmatter`: its view and
 *  its tilt. Throws if the slide shows no watch. */
export function escapementMarks(
  watch: Watch,
  frontmatter: Record<string, unknown>,
): EscapementMarks {
  const shown = slideProjection(watch, frontmatter);
  const { design, escapementTops: tops } = watch;
  const world = (point: Point2): Point2 => worldOf(design, point);
  const [, , , , escape] = design.wheels as [Wheel, Wheel, Wheel, Wheel, Wheel];
  const escapeArbor = world(escape.arbor);

  return {
    escape: shown(escapeArbor, tops.escape),
    pallet: shown(palletAim(design), tops.fork),
    jewel: shown(jewelPoint(design, 0), tops.jewel),
    forkOutlines: forkAtBanks(design).map((outline) =>
      outline.map((point) => shown(point, tops.fork)),
    ),
    escapeTips: Array.from({ length: TIP_POINTS }, (_, index) =>
      shown(
        polar(escape.outer, (360 * index) / TIP_POINTS, escapeArbor),
        tops.escape,
      ),
    ),
  };
}

/** In slide px. */
export interface GearsMarks {
  /** The escape pinion's arbor and the fourth wheel's: where their leaders
   *  aim. */
  readonly pinion: Point2;
  readonly wheel: Point2;
  /** The tip circles that the leaders end outside. */
  readonly pinionTips: readonly Point2[];
  readonly wheelTips: readonly Point2[];
}

/** The Gears slide's marks, for the slide whose frontmatter is `frontmatter`:
 *  its view and its tilt. The gears turn, so the leaders aim at the arbors
 *  and end outside the tip circles, which do not move. Throws if the slide
 *  shows no watch. */
export function gearsMarks(
  watch: Watch,
  frontmatter: Record<string, unknown>,
): GearsMarks {
  const shown = slideProjection(watch, frontmatter);
  const { design, gearsTop: top } = watch;
  const [, , , fourth, escape] = design.wheels as [
    Wheel,
    Wheel,
    Wheel,
    Wheel,
    Wheel,
  ];
  const circle = (radius: number, centre: Point2): Point2[] =>
    Array.from({ length: TIP_POINTS }, (_, index) =>
      shown(polar(radius, (360 * index) / TIP_POINTS, centre), top),
    );
  const pinionArbor = worldOf(design, escape.arbor);
  const wheelArbor = worldOf(design, fourth.arbor);
  return {
    pinion: shown(pinionArbor, top),
    wheel: shown(wheelArbor, top),
    pinionTips: circle(pinionTip(escape), pinionArbor),
    wheelTips: circle(fourth.outer, wheelArbor),
  };
}

/** The Gear Train slide's centre wheel, in its unchanged train view. Its
 *  final callout ends outside the wheel's tip circle. */
export function gearTrainMarks(
  watch: Watch,
  frontmatter: Record<string, unknown>,
): Pick<GearsMarks, "wheel" | "wheelTips"> {
  const shown = slideProjection(watch, frontmatter);
  const centre = at(watch.design.wheels, 1);
  const arbor = worldOf(watch.design, centre.arbor);
  return {
    wheel: shown(arbor, watch.centreTop),
    wheelTips: Array.from({ length: TIP_POINTS }, (_, index) =>
      shown(
        polar(centre.outer, (360 * index) / TIP_POINTS, arbor),
        watch.centreTop,
      ),
    ),
  };
}

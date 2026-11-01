// The camera's flight over a ball, such as a globe (`move: fly`): it zooms
// out as far as the pan needs, pans along the great circle between the two
// views' directions, and zooms in, as in van Wijk and Nuij, "Smooth and
// efficient zooming and panning" (2003). Both views look at one ball about
// one pivot (`View.ball`). It is paced by what the eye sees: the ground at
// the slide's middle and the zoom at the slide's edge move at one speed,
// after a ramp up and before a ramp down of `FLIGHT.ramp` seconds (`paced`).
// No DOM: the tests run it in Node.

import { mix } from "./math.ts";
import {
  pivotOnSlide,
  planeOnSlide,
  slidePoint,
  towardCamera,
} from "./renderer.ts";
import type { CameraPose, Vec3 } from "./scene.ts";

/** `rho` trades zoom for pan (their √2). The camera speeds up for `ramp`
 *  seconds, goes at `speed` (slide widths of what the eye sees, a second:
 *  `paced`), and slows down for `ramp` seconds. The speed is the one that
 *  the flight across the Atlantic was tuned to by eye, in 7 s. */
export const FLIGHT = {
  rho: Math.SQRT2,
  ramp: 1,
  speed: 0.5,
} as const;

export interface Flight {
  /** The flight's own time: a ramp, and its seen length at FLIGHT's
   *  speed. */
  readonly seconds: number;
  /** The camera at `share` of the path's length, from 0 to 1. */
  along(share: number): CameraPose;
  /** The camera at `fraction` of a flight that takes `seconds`, paced. */
  at(fraction: number, seconds: number): CameraPose;
}

/** Poses along a path that `paced` samples to measure it. */
const PACE_SAMPLES = 256;

/** The point of the ball that shows at the slide point `at` through
 *  `pose` (its view's `ball` about its pivot), on the near side; null off
 *  the ball, or if the view has no ball. */
export function ballPoint(
  pose: CameraPose,
  slide: readonly [number, number],
  at: readonly [number, number],
): Vec3 | null {
  const radius = pose.view.ball;
  if (radius === undefined) return null;
  const toward = towardCamera(pose);
  const helper: Vec3 = Math.abs(toward[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const cross = (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const across = cross(toward, helper);
  const length = Math.hypot(...across);
  const u: Vec3 = [across[0] / length, across[1] / length, across[2] / length];
  const v = cross(toward, u);
  const { pivot } = pose.view;
  const [a, b, c, d, e, f] = planeOnSlide(pose, slide, { origin: pivot, u, v });
  const [x, y] = [at[0] - e, at[1] - f];
  const determinant = a * d - b * c;
  const [alongU, alongV] = [
    (d * x - c * y) / determinant,
    (a * y - b * x) / determinant,
  ];
  const flat = Math.hypot(alongU, alongV);
  if (flat > radius) return null;
  const up = Math.sqrt(radius * radius - flat * flat);
  return [
    pivot[0] + u[0] * alongU + v[0] * alongV + toward[0] * up,
    pivot[1] + u[1] * alongU + v[1] * alongV + toward[1] * up,
    pivot[2] + u[2] * alongU + v[2] * alongV + toward[2] * up,
  ];
}

/** The share of the way, at `time` of `seconds`, that goes at one speed
 *  between a ramp up and a ramp down, each of constant acceleration. */
export function pacedShare(time: number, seconds: number): number {
  if (seconds <= 0) return 1;
  const ramp = Math.min(FLIGHT.ramp, seconds / 2);
  const speed = 1 / (seconds - ramp);
  const t = Math.min(seconds, Math.max(0, time));
  if (t < ramp) return (speed * t * t) / (2 * ramp);
  if (t > seconds - ramp) {
    const left = seconds - t;
    return 1 - (speed * left * left) / (2 * ramp);
  }
  return (speed * ramp) / 2 + speed * (t - ramp);
}

/** A path paced by what the eye sees, in widths of the slide: how far the
 *  ground at the slide's middle moves on the slide (or the pivot, off the
 *  ball), with how far the zoom moves the slide's edge. Van Wijk and Nuij's
 *  pace is even for a flat map; over a ball, the ground at the middle sped
 *  up 2 to 40 times between the ends and the middle of a flight. */
function paced(
  along: (share: number) => CameraPose,
  slide: readonly [number, number],
): Flight {
  const middle = [slide[0] / 2, slide[1] / 2] as const;
  const poses = Array.from({ length: PACE_SAMPLES + 1 }, (_, index) =>
    along(index / PACE_SAMPLES),
  );
  const lengths = [0];
  poses.slice(1).forEach((next, index) => {
    const pose = poses[index] ?? next;
    const ground = ballPoint(pose, slide, middle);
    const [fromX, fromY] = ground ? middle : pivotOnSlide(pose.view);
    const [toX, toY] = ground
      ? slidePoint(next, slide, ground)
      : pivotOnSlide(next.view);
    const zoom =
      (Math.abs(Math.log(next.view.scale / pose.view.scale)) * slide[0]) / 2;
    const step = Math.hypot(toX - fromX, toY - fromY, zoom) / slide[0];
    lengths.push((lengths.at(-1) ?? 0) + step);
  });
  const total = lengths.at(-1) ?? 0;
  /** The share of the path at `seen` of its seen length. */
  const shareAt = (seen: number): number => {
    if (total <= 0) return seen;
    let low = 0;
    let high = PACE_SAMPLES;
    while (high - low > 1) {
      const middleIndex = (low + high) >> 1;
      if ((lengths[middleIndex] ?? 0) <= seen * total) low = middleIndex;
      else high = middleIndex;
    }
    const [before, after] = [lengths[low] ?? 0, lengths[high] ?? 0];
    const part =
      after > before ? (seen * total - before) / (after - before) : 0;
    return (low + Math.min(1, Math.max(0, part))) / PACE_SAMPLES;
  };
  return {
    seconds: FLIGHT.ramp + total / FLIGHT.speed,
    along,
    at: (fraction, time) => along(shareAt(pacedShare(fraction * time, time))),
  };
}

const DEGREES = 180 / Math.PI;

/** `degrees` moved by whole turns into the half-open turn about `about`. */
function near(degrees: number, about: number): number {
  return about + ((((degrees - about + 180) % 360) + 360) % 360) - 180;
}

/** The flight from one pose to another, for a slide of `slide` px; `null`
 *  unless both views look at the same ball about the same pivot. */
export function flight(
  from: CameraPose,
  to: CameraPose,
  slide: readonly [number, number],
): Flight | null {
  const [width] = slide;
  const radius = from.view.ball;
  if (
    radius === undefined ||
    to.view.ball !== radius ||
    !from.view.pivot.every((value, axis) => value === to.view.pivot[axis])
  ) {
    return null;
  }
  const { rho } = FLIGHT;
  const [a, b] = [towardCamera(from), towardCamera(to)];
  const cosTurn = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const turn = Math.acos(Math.max(-1, Math.min(1, cosTurn)));
  const distance = radius * turn;
  // world units across the slide
  const [w0, w1] = [width / from.view.scale, width / to.view.scale];
  // where the pivot shows, from the slide's middle, in world units: so the
  // place at the middle moves from one view's to the other's as the camera
  // zooms. A view can show its pivot far off the slide (a story map's
  // camera), and a pivot kept at its slide point would swing the globe
  // away from both views as the camera zooms out
  const middle = [slide[0] / 2, slide[1] / 2] as const;
  const [start, end] = [from.view, to.view].map((view) => {
    const [x, y] = pivotOnSlide(view);
    return [(x - middle[0]) / view.scale, (y - middle[1]) / view.scale];
  });
  const { pivot } = from.view;
  /** The camera `u` world units along the pan, with `across` world units
   *  across the slide. */
  const camera = (u: number, across: number, share: number): CameraPose => {
    const along = distance === 0 ? share : u / distance;
    const [fromA, fromB] =
      turn < 1e-12
        ? [1 - along, along]
        : [
            Math.sin((1 - along) * turn) / Math.sin(turn),
            Math.sin(along * turn) / Math.sin(turn),
          ];
    const [x, y, z]: Vec3 = [
      fromA * a[0] + fromB * b[0],
      fromA * a[1] + fromB * b[1],
      fromA * a[2] + fromB * b[2],
    ];
    const length = Math.hypot(x, y, z);
    const tilt = Math.acos(Math.max(-1, Math.min(1, z / length))) * DEGREES;
    const linear = mix(from.turn, to.turn, along);
    const scale = width / across;
    const [slideX, slideY] = [
      middle[0] + scale * mix(start?.[0] ?? 0, end?.[0] ?? 0, along),
      middle[1] + scale * mix(start?.[1] ?? 0, end?.[1] ?? 0, along),
    ];
    return {
      view: {
        name: `${from.view.name} to ${to.view.name}`,
        scale,
        shift: [slideX - scale * pivot[0], slideY - scale * pivot[1]],
        pivot,
        ball: radius,
      },
      tilt,
      // straight down the pole, any turn faces it: keep the even mix
      turn:
        Math.hypot(x, y) < 1e-9
          ? linear
          : near(Math.atan2(x, y) * DEGREES, linear),
    };
  };
  if (distance < 1e-6 * Math.max(w0, w1)) {
    // a zoom with no pan
    const ratio = Math.log(w1 / w0);
    return paced(
      (share) => camera(0, w0 * Math.exp(ratio * share), share),
      slide,
    );
  }
  const b0 = (w: number, sign: number): number =>
    (w1 * w1 - w0 * w0 + sign * rho ** 4 * distance ** 2) /
    (2 * w * rho ** 2 * distance);
  const r = (value: number): number =>
    Math.log(-value + Math.sqrt(value ** 2 + 1));
  const r0 = r(b0(w0, 1));
  const r1 = r(b0(w1, -1));
  const length = (r1 - r0) / rho;
  return paced((share) => {
    const s = share * length;
    return camera(
      (w0 / rho ** 2) *
        (Math.cosh(r0) * Math.tanh(rho * s + r0) - Math.sinh(r0)),
      (w0 * Math.cosh(r0)) / Math.cosh(rho * s + r0),
      share,
    );
  }, slide);
}

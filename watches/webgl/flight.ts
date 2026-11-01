// The camera's flight over a ball, such as a globe (`move: fly`): it zooms
// out as far as the pan needs, pans along the great circle between the two
// views' directions, and zooms in, as in van Wijk and Nuij, "Smooth and
// efficient zooming and panning" (2003). Both views look at one ball about
// one pivot (`View.ball`). No DOM: the tests run it in Node.

import { mix } from "./math.ts";
import { pivotOnSlide, towardCamera } from "./renderer.ts";
import type { CameraPose, Vec3 } from "./scene.ts";

/** `rho` trades zoom for pan (their √2); a unit of the flight's length takes
 *  `seconds`, within `least` and `most`. */
export const FLIGHT = {
  rho: Math.SQRT2,
  seconds: 1,
  least: 1,
  most: 3.5,
} as const;

export interface Flight {
  /** The flight's own time: FLIGHT's seconds for its length. */
  readonly seconds: number;
  /** The camera at `share` of the flight's length, from 0 to 1. */
  at(share: number): CameraPose;
}

const DEGREES = 180 / Math.PI;

/** `degrees` moved by whole turns into the half-open turn about `about`. */
function near(degrees: number, about: number): number {
  return about + ((((degrees - about + 180) % 360) + 360) % 360) - 180;
}

/** The flight from one pose to another, for a slide `width` px wide; `null`
 *  unless both views look at the same ball about the same pivot. */
export function flight(
  from: CameraPose,
  to: CameraPose,
  width: number,
): Flight | null {
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
  const [start, end] = [pivotOnSlide(from.view), pivotOnSlide(to.view)];
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
      mix(start[0], end[0], along),
      mix(start[1], end[1], along),
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
  const timed = (
    length: number,
    at: (share: number) => CameraPose,
  ): Flight => ({
    seconds: Math.min(
      FLIGHT.most,
      Math.max(FLIGHT.least, length * FLIGHT.seconds),
    ),
    at,
  });
  if (distance < 1e-6 * Math.max(w0, w1)) {
    // a zoom with no pan
    const ratio = Math.log(w1 / w0);
    return timed(Math.abs(ratio) / rho, (share) =>
      camera(0, w0 * Math.exp(ratio * share), share),
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
  return timed(length, (share) => {
    const s = share * length;
    return camera(
      (w0 / rho ** 2) *
        (Math.cosh(r0) * Math.tanh(rho * s + r0) - Math.sinh(r0)),
      (w0 * Math.cosh(r0)) / Math.cosh(rho * s + r0),
      share,
    );
  });
}

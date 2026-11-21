// A reader's turn of a figure (the article): a second rotation after the
// camera's, in the view's own axes (right, down, toward the reader), about
// the view's pivot. A yaw swings the watch about the screen's vertical
// axis, and a pitch tips it about the horizontal one, so a sideways drag
// shows the watch's side from any view, and 12 o'clock stays near the top.
// The camera's own tilt and turn do not do this: a turn spins the watch
// about its own axis, flat at tilt 0 (stem/docs/webgl.md, "The
// camera is orthographic").
// No DOM here: the renderer and the tests use it.

import { radians } from "./math.ts";
import type { CameraAngles, Vec3 } from "./scene.ts";

/** In degrees: a yaw (+: the near side goes right), then a pitch (+: the
 *  near side goes down). */
export interface Orbit {
  readonly yaw: number;
  readonly pitch: number;
}

export const NO_ORBIT: Orbit = { yaw: 0, pitch: 0 };

/** A 3 x 3 rotation, by its rows. */
export type Rotation = readonly [Vec3, Vec3, Vec3];

/** Degrees from face-on that a reader may turn the watch to: edge-on is
 *  90°, where the dial's faces lie flat on the line of sight and their
 *  depths tie; at 89° the picture is the same
 *  (tasks/2026-11-20-article-turning/PLAN.md, "Edge-on"). */
export const ORBIT_LIMIT = 89;

export function isNoOrbit(orbit: Orbit): boolean {
  return orbit.yaw === 0 && orbit.pitch === 0;
}

/** The camera's own rotation: world (about the pivot) to the view's axes
 *  (right, down, toward the reader). A turn about the world's z axis, then a
 *  tilt about the slide's horizontal axis (`viewProjection`). */
export function viewRotation(angles: CameraAngles): Rotation {
  const tilt = radians(angles.tilt);
  const turn = radians(angles.turn);
  const [cosTilt, sinTilt] = [Math.cos(tilt), Math.sin(tilt)];
  const [cosTurn, sinTurn] = [Math.cos(turn), Math.sin(turn)];
  return [
    [cosTurn, -sinTurn, 0],
    [cosTilt * sinTurn, cosTilt * cosTurn, -sinTilt],
    [sinTilt * sinTurn, sinTilt * cosTurn, cosTilt],
  ];
}

/** The orbit's rotation in the view's axes: the pitch after the yaw. */
export function orbitRotation(orbit: Orbit): Rotation {
  const yaw = radians(orbit.yaw);
  const pitch = radians(orbit.pitch);
  const [cosYaw, sinYaw] = [Math.cos(yaw), Math.sin(yaw)];
  const [cosPitch, sinPitch] = [Math.cos(pitch), Math.sin(pitch)];
  return [
    [cosYaw, 0, sinYaw],
    [-sinPitch * sinYaw, cosPitch, sinPitch * cosYaw],
    [-cosPitch * sinYaw, -sinPitch, cosPitch * cosYaw],
  ];
}

/** `first`, then `second`: the product second x first. */
export function compose(first: Rotation, second: Rotation): Rotation {
  const row = (index: 0 | 1 | 2): Vec3 => {
    const [a, b, c] = second[index];
    return [
      a * first[0][0] + b * first[1][0] + c * first[2][0],
      a * first[0][1] + b * first[1][1] + c * first[2][1],
      a * first[0][2] + b * first[1][2] + c * first[2][2],
    ];
  };
  return [row(0), row(1), row(2)];
}

/** The cosine of the angle between the dial's normal (the world's z axis)
 *  and the direction to the reader, after the camera and the orbit: 1
 *  face-on, 0 edge-on, below 0 from behind. */
export function facing(angles: CameraAngles, orbit: Orbit): number {
  return compose(viewRotation(angles), orbitRotation(orbit))[2][2];
}

/** Whether `orbit` keeps the watch within `limit` degrees of face-on. */
function within(angles: CameraAngles, orbit: Orbit, limit: number): boolean {
  return facing(angles, orbit) >= Math.cos(radians(limit)) - 1e-12;
}

/** `orbit`, if it keeps the watch within `limit` degrees of face-on from
 *  the camera's `angles`; if not, the orbit on the limit on the way to it
 *  from the face-on orbit (no yaw, and the camera's tilt pitched back). So a
 *  drag past the limit slides along it. The way is at most 180° long: a
 *  longer one would come out of the far side of the watch. */
export function limitedOrbit(
  angles: CameraAngles,
  orbit: Orbit,
  limit = ORBIT_LIMIT,
): Orbit {
  if (within(angles, orbit, limit)) return orbit;
  // the dial's normal tips up the screen by the tilt, whatever the turn
  const faceOn: Orbit = { yaw: 0, pitch: angles.tilt };
  let yaw = orbit.yaw - faceOn.yaw;
  let pitch = orbit.pitch - faceOn.pitch;
  const length = Math.hypot(yaw, pitch);
  if (length > 180)
    [yaw, pitch] = [(yaw * 180) / length, (pitch * 180) / length];
  const at = (part: number): Orbit => ({
    yaw: faceOn.yaw + yaw * part,
    pitch: faceOn.pitch + pitch * part,
  });
  let [low, high] = [0, 1];
  for (let step = 0; step < 40; step++) {
    const middle = (low + high) / 2;
    if (within(angles, at(middle), limit)) low = middle;
    else high = middle;
  }
  return at(low);
}

/** `orbit` moved by `yaw` and `pitch` degrees: a reader's drag, as far as
 *  the limit lets it (`limitedOrbit`). */
export function movedOrbit(
  angles: CameraAngles,
  orbit: Orbit,
  yaw: number,
  pitch: number,
  limit = ORBIT_LIMIT,
): Orbit {
  return limitedOrbit(
    angles,
    { yaw: orbit.yaw + yaw, pitch: orbit.pitch + pitch },
    limit,
  );
}

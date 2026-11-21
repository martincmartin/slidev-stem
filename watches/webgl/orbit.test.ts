import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NO_ORBIT,
  ORBIT_LIMIT,
  compose,
  facing,
  movedOrbit,
  orbitRotation,
  viewRotation,
} from "./orbit.ts";
import type { Rotation } from "./orbit.ts";
import type { Vec3 } from "./scene.ts";

const FLAT = { tilt: 0, turn: 0 };

function apply(rotation: Rotation, point: Vec3): Vec3 {
  return [
    rotation[0][0] * point[0] +
      rotation[0][1] * point[1] +
      rotation[0][2] * point[2],
    rotation[1][0] * point[0] +
      rotation[1][1] * point[1] +
      rotation[1][2] * point[2],
    rotation[2][0] * point[0] +
      rotation[2][1] * point[1] +
      rotation[2][2] * point[2],
  ];
}

function near(actual: Vec3, expected: Vec3): void {
  for (const [index, value] of actual.entries()) {
    assert.ok(
      Math.abs(value - (expected[index] ?? Number.NaN)) < 1e-9,
      `${JSON.stringify(actual)} is not ${JSON.stringify(expected)}`,
    );
  }
}

test("a yaw moves the near side right; a pitch moves it down", () => {
  // the point nearest the reader, in the view's axes (right, down, toward)
  near(apply(orbitRotation({ yaw: 90, pitch: 0 }), [0, 0, 1]), [1, 0, 0]);
  near(apply(orbitRotation({ yaw: 0, pitch: 90 }), [0, 0, 1]), [0, 1, 0]);
  near(apply(orbitRotation(NO_ORBIT), [0.3, -2, 5]), [0.3, -2, 5]);
});

test("the camera's rotation tilts the bottom of the slide toward the reader", () => {
  // at tilt 90, the world's +y (down the slide) points at the reader
  near(apply(viewRotation({ tilt: 90, turn: 0 }), [0, 1, 0]), [0, 0, 1]);
  // a turn of 90 puts the world's +x at the bottom
  near(apply(viewRotation({ tilt: 0, turn: 90 }), [1, 0, 0]), [0, 1, 0]);
});

test("compose applies the first rotation, then the second", () => {
  const first = viewRotation({ tilt: 30, turn: 40 });
  const second = orbitRotation({ yaw: 25, pitch: -10 });
  const point: Vec3 = [1, 2, 3];
  near(
    apply(compose(first, second), point),
    apply(second, apply(first, point)),
  );
});

test("facing is the cosine from face-on, the camera's tilt and the orbit together", () => {
  assert.equal(facing(FLAT, NO_ORBIT), 1);
  const cos = (degrees: number) => Math.cos((degrees * Math.PI) / 180);
  assert.ok(
    Math.abs(facing({ tilt: 20, turn: 0 }, NO_ORBIT) - cos(20)) < 1e-12,
  );
  assert.ok(Math.abs(facing(FLAT, { yaw: 60, pitch: 0 }) - cos(60)) < 1e-12);
  // the camera's tilt tips the dial's normal up the screen; a pitch of the
  // near side down by as much undoes it
  assert.ok(
    Math.abs(facing({ tilt: 20, turn: 0 }, { yaw: 0, pitch: 20 }) - 1) < 1e-12,
  );
});

test("a move stops at the limit, and never goes behind", () => {
  const moved = movedOrbit(FLAT, NO_ORBIT, 200, 0);
  assert.ok(Math.abs(moved.yaw - ORBIT_LIMIT) < 1e-6, String(moved.yaw));
  assert.equal(moved.pitch, 0);
  const back = movedOrbit(FLAT, NO_ORBIT, 0, -500);
  assert.ok(Math.abs(back.pitch + ORBIT_LIMIT) < 1e-6, String(back.pitch));
  // from a tilted camera, the limit counts the camera's tilt too
  const tilted = { tilt: 20, turn: 0 };
  const up = movedOrbit(tilted, NO_ORBIT, 0, -500);
  assert.ok(
    Math.abs(facing(tilted, up) - Math.cos((ORBIT_LIMIT * Math.PI) / 180)) <
      1e-6,
  );
  assert.ok(Math.abs(up.pitch + (ORBIT_LIMIT - 20)) < 1e-6, String(up.pitch));
  // the other way, it turns through face-on and on to the limit
  const down = movedOrbit(tilted, NO_ORBIT, 0, 500);
  assert.ok(
    Math.abs(down.pitch - (ORBIT_LIMIT + 20)) < 1e-6,
    String(down.pitch),
  );
});

test("at the limit, the rest of a move slides along it", () => {
  const atEdge = movedOrbit(FLAT, NO_ORBIT, 200, 0);
  // a diagonal drag at the edge slides along it: the pitch moves, and the
  // yaw gives way
  const slid = movedOrbit(FLAT, atEdge, 10, 10);
  assert.ok(slid.pitch > 5 && slid.yaw < atEdge.yaw, JSON.stringify(slid));
  assert.ok(
    facing(FLAT, slid) >= Math.cos((ORBIT_LIMIT * Math.PI) / 180) - 1e-9,
  );
  // and a move back from the edge is free
  assert.deepEqual(movedOrbit(FLAT, atEdge, -10, 0), {
    yaw: atEdge.yaw - 10,
    pitch: 0,
  });
});

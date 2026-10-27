// The camera (`viewProjection`): the turn about the world's z axis, before
// the tilt; and a crop of it (`cropCamera`).

import assert from "node:assert/strict";
import { test } from "node:test";
import { transformPoint } from "./math.ts";
import { cropCamera, viewProjection } from "./renderer.ts";
import type { Vec3, View } from "./scene.ts";

const SLIDE = [980, 552] as const;
const VIEW: View = {
  name: "test",
  scale: 2.5,
  shift: [-1500, -400],
  pivot: [700, 250, 6],
};
const POINTS: Vec3[] = [
  [700, 250, 6],
  [760, 250, 0],
  [700, 190, 12],
  [640, 330, -20],
];

/** The point turned clockwise on the slide by `degrees`, about the pivot. */
function turned([x, y, z]: Vec3, degrees: number): Vec3 {
  const radians = (degrees * Math.PI) / 180;
  const [pivotX, pivotY] = VIEW.pivot;
  const [across, down] = [x - pivotX, y - pivotY];
  return [
    pivotX + across * Math.cos(radians) - down * Math.sin(radians),
    pivotY + across * Math.sin(radians) + down * Math.cos(radians),
    z,
  ];
}

function close(first: Vec3, second: Vec3, what: string): void {
  for (const [index, value] of first.entries()) {
    const other = second[index] ?? NaN;
    assert.ok(
      Math.abs(value - other) < 1e-5,
      `${what}: ${String(first)} vs ${String(second)}`,
    );
  }
}

test("a turned camera shows the world as an unturned one shows the world turned clockwise about the pivot", () => {
  for (const tilt of [0, 20, 75]) {
    for (const turn of [-60, 90, 210]) {
      const camera = viewProjection(VIEW, { tilt, turn }, SLIDE);
      const level = viewProjection(VIEW, { tilt, turn: 0 }, SLIDE);
      for (const point of POINTS) {
        close(
          transformPoint(camera.matrix, point),
          transformPoint(level.matrix, turned(point, turn)),
          `tilt ${String(tilt)}, turn ${String(turn)}`,
        );
      }
    }
  }
});

test("at turn 90, 3 o'clock is at the bottom, and the camera is on its side", () => {
  const camera = viewProjection(VIEW, { tilt: 30, turn: 90 }, SLIDE);
  const [x, y, z] = VIEW.pivot;
  const [, pivotY] = transformPoint(camera.matrix, VIEW.pivot);
  const [, rightY] = transformPoint(camera.matrix, [x + 10, y, z]);
  assert.ok(rightY < pivotY, "lower on the slide: clip y is up");
  close(
    camera.toCamera,
    [Math.sin(Math.PI / 6), 0, Math.cos(Math.PI / 6)],
    "toCamera",
  );
});

test("toCamera points along the depth: a step along it stays in place on the slide, and comes nearer", () => {
  for (const angles of [
    { tilt: 0, turn: 0 },
    { tilt: 45, turn: -60 },
    { tilt: 85, turn: 135 },
  ]) {
    const camera = viewProjection(VIEW, angles, SLIDE);
    const [point] = POINTS as [Vec3];
    const step: Vec3 = [
      point[0] + 10 * camera.toCamera[0],
      point[1] + 10 * camera.toCamera[1],
      point[2] + 10 * camera.toCamera[2],
    ];
    const [x, y, depth] = transformPoint(camera.matrix, point);
    const [stepX, stepY, stepDepth] = transformPoint(camera.matrix, step);
    assert.ok(Math.abs(stepX - x) < 1e-6 && Math.abs(stepY - y) < 1e-6);
    assert.ok(stepDepth < depth, "nearer: clip z is smaller");
  }
});

test("a crop camera puts the crop's part of the slide on the whole picture", () => {
  const crop = { left: 210, top: 40, width: 380, height: 214 };
  for (const angles of [
    { tilt: 0, turn: 0 },
    { tilt: 30, turn: 90 },
  ]) {
    const camera = viewProjection(VIEW, angles, SLIDE);
    const cropped = cropCamera(camera, crop, SLIDE);
    assert.deepEqual(cropped.toCamera, camera.toCamera);
    for (const point of POINTS) {
      const [x, y, z] = transformPoint(camera.matrix, point);
      // slide px, from the top left
      const slideX = ((x + 1) / 2) * SLIDE[0];
      const slideY = ((1 - y) / 2) * SLIDE[1];
      const [croppedX, croppedY, croppedZ] = transformPoint(
        cropped.matrix,
        point,
      );
      assert.ok(
        Math.abs(croppedX - (((slideX - crop.left) / crop.width) * 2 - 1)) <
          1e-4,
      );
      assert.ok(
        Math.abs(croppedY - (1 - ((slideY - crop.top) / crop.height) * 2)) <
          1e-4,
      );
      assert.ok(Math.abs(croppedZ - z) < 1e-6);
    }
  }
});

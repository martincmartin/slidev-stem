import assert from "node:assert/strict";
import { test } from "node:test";
import {
  IDENTITY,
  checkAffine,
  normalMatrix,
  transformNormal,
  transformPoint,
} from "./math.ts";
import type { Vec3 } from "./scene.ts";

function dot(first: Vec3, second: Vec3): number {
  return first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
}

// column-major: x' = 2x + 0.7y + 5, y' = 0.3x + y - 0.4z, z' = 0.2x + 3z + 1
const OBLIQUE = Float32Array.from([
  2, 0.3, 0.2, 0, 0.7, 1, 0, 0, 0, -0.4, 3, 0, 5, 0, 1, 1,
]);

test("a moved normal stays perpendicular to every moved tangent", () => {
  const turn = normalMatrix(OBLIQUE);
  const normal: Vec3 = [1, 2, -1];
  // two tangents of the plane with this normal
  const tangents: Vec3[] = [
    [2, -1, 0],
    [1, 0, 1],
  ];
  const movedNormal = transformNormal(turn, normal);
  for (const tangent of tangents) {
    assert.ok(Math.abs(dot(normal, tangent)) < 1e-12);
    // a tangent is a difference of points: the translation cancels
    const start = transformPoint(OBLIQUE, [0, 0, 0]);
    const end = transformPoint(OBLIQUE, tangent);
    const moved: Vec3 = [
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2],
    ];
    assert.ok(
      Math.abs(dot(movedNormal, moved)) < 1e-5,
      `(Nn).(Mt) = ${String(dot(movedNormal, moved))}`,
    );
  }
});

test("a singular matrix has no normal matrix", () => {
  const flatten = Float32Array.from([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
  ]);
  assert.throws(() => normalMatrix(flatten), /singular/);
});

test("the renderer's matrices must be affine and finite", () => {
  assert.doesNotThrow(() => {
    checkAffine(OBLIQUE, "oblique");
    checkAffine(IDENTITY, "identity");
  });
  const perspective = Float32Array.from(IDENTITY);
  perspective[11] = -1;
  assert.throws(() => {
    checkAffine(perspective, "perspective");
  }, /not affine/);
  const broken = Float32Array.from(IDENTITY);
  broken[12] = Number.NaN;
  assert.throws(() => {
    checkAffine(broken, "broken");
  }, /NaN/);
  assert.throws(() => {
    checkAffine(new Float32Array(9), "short");
  }, /9 entries/);
});

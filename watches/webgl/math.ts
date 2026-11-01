// 4 x 4 matrices, column-major, as WebGL takes them, and the points and
// normals that they move. The renderer and the mesh helpers share these.

import { at, check, checkFinite } from "./checked.ts";
import type { Vec3 } from "./scene.ts";

/** A 4 x 4 matrix, column-major. */
export type Matrix4 = Float32Array;

export const IDENTITY: Matrix4 = Float32Array.from([
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
]);

/** Throw unless `matrix` is an affine 4 x 4 (bottom row 0 0 0 1) of finite
 *  numbers. The line shader has no perspective divide: it needs this. */
export function checkAffine(matrix: Matrix4, what: string): void {
  check(matrix.length === 16, `${what} has ${String(matrix.length)} entries`);
  checkFinite(matrix, what);
  const bottom = [3, 7, 11, 15].map((index) => at(matrix, index));
  check(
    bottom.join() === "0,0,0,1",
    `${what} is not affine: its bottom row is ${bottom.join(" ")}`,
  );
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function unit(vector: Vec3): Vec3 {
  const length = Math.hypot(...vector);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

/** Two unit axes across the direction `normal`: at right angles to it and
 *  to each other, x and then y = normal x x. Their turn about `normal` is
 *  any: for a plane through a point, such as a disc that faces the camera. */
export function axesAcross(normal: Vec3): [Vec3, Vec3] {
  const z = unit(normal);
  const helper: Vec3 = Math.abs(z[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const x = unit(cross(helper, z));
  return [x, cross(z, x)];
}

/** The number `fraction` of the way from `first` to `second`. */
export function mix(first: number, second: number, fraction: number): number {
  return first + (second - first) * fraction;
}

export function transformPoint(matrix: Matrix4, [x, y, z]: Vec3): Vec3 {
  const output = (row: number): number =>
    at(matrix, row) * x +
    at(matrix, 4 + row) * y +
    at(matrix, 8 + row) * z +
    at(matrix, 12 + row);
  return [output(0), output(1), output(2)];
}

/** The inverse transpose of the matrix's upper 3 x 3, for a normal
 *  (column-major 3 x 3). Throws for a singular matrix: it has none. */
export function normalMatrix(matrix: Matrix4): Float32Array {
  // the 3 x 3's columns are (a b c), (d e f) and (g h i)
  const [a, b, c, d, e, f, g, h, i] = [0, 1, 2, 4, 5, 6, 8, 9, 10].map(
    (index) => at(matrix, index),
  ) as [number, number, number, number, number, number, number, number, number];
  const cofactors = [
    e * i - f * h,
    f * g - d * i,
    d * h - e * g,
    c * h - b * i,
    a * i - c * g,
    b * g - a * h,
    b * f - c * e,
    c * d - a * f,
    a * e - b * d,
  ];
  const determinant =
    a * at(cofactors, 0) + d * at(cofactors, 3) + g * at(cofactors, 6);
  check(
    Number.isFinite(determinant) && determinant !== 0,
    "a singular matrix has no normal matrix",
  );
  // the cofactor matrix over the determinant is the inverse transpose
  const scale = 1 / determinant;
  return Float32Array.from(cofactors.map((value) => value * scale));
}

/** A normal moved by a normal matrix (from `normalMatrix`). */
export function transformNormal(turn: Float32Array, [x, y, z]: Vec3): Vec3 {
  const output = (row: number): number =>
    at(turn, row) * x + at(turn, 3 + row) * y + at(turn, 6 + row) * z;
  return [output(0), output(1), output(2)];
}

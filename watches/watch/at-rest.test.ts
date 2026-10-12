import assert from "node:assert/strict";
import { test } from "node:test";
import { Outline } from "./at-rest.ts";
import type { Point3 } from "./at-rest.ts";
import type { Point2 } from "../webgl/mesh.ts";

// a square, anticlockwise in x and y, from 0 to 10
const square = new Outline([
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
]);

test("a face inside the outline is over it, at its own heights", () => {
  const face: Point3[] = [
    [2, 2, 1],
    [8, 2, 3],
    [5, 8, 2],
  ];
  assert.deepEqual(square.heightsOver(face), [1, 3]);
});

test("a face that crosses the outline with no corner inside it is over it, at the heights of the cut", () => {
  // a wall from x = -10 to x = 20 at y = 5, from height 0 to 30
  const wall: Point3[] = [
    [-10, 5, 0],
    [20, 5, 0],
    [20, 5, 30],
  ];
  const over = square.heightsOver(wall) ?? assert.fail("not over");
  // the wall's top edge climbs from 0 at x = -10 to 30 at x = 20: 10 a 10 px
  assert.ok(Math.abs(over[0]) < 1e-9, String(over[0]));
  assert.ok(Math.abs(over[1] - 20) < 0.01, String(over[1]));
});

test("a face outside the outline, or on its edge, is not over it", () => {
  const outside: Point3[] = [
    [11, 0, 0],
    [20, 0, 0],
    [15, 9, 5],
  ];
  const onEdge: Point3[] = [
    [10, 0, 0],
    [10, 10, 0],
    [10, 5, 5],
  ];
  assert.equal(square.heightsOver(outside), null);
  assert.equal(square.heightsOver(onEdge), null);
});

test("an outline that is not convex and anticlockwise is refused", () => {
  // a notch at (6, 8): (10, 10) is outside the edge from (6, 8) to (0, 10)
  const notched: Point2[] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [6, 8],
    [0, 10],
  ];
  const clockwise: Point2[] = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
  ];
  assert.throws(() => new Outline(notched), /not convex/);
  assert.throws(() => new Outline(clockwise), /not convex/);
});

test("an outline that is too thin, or has an edge with no length, is refused", () => {
  const inLine: Point2[] = [
    [0, 0],
    [10, 0],
    [20, 0],
  ];
  const repeated: Point2[] = [
    [0, 0],
    [10, 0],
    [10, 0],
    [0, 10],
  ];
  assert.throws(() => new Outline(inLine), /too thin/);
  assert.throws(() => new Outline(repeated), /no length/);
});

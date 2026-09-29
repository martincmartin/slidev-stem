import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extrude,
  normalMatrix,
  polygonRing,
  ribbon,
  smoothRing,
  sortRings,
  transformMesh,
} from "./mesh.ts";
import { at } from "./checked.ts";
import type { MeshInfo, Point2 } from "./mesh.ts";
import type { LineStyle } from "./scene.ts";

const STYLE: LineStyle = { colour: "#143C6B", opacity: 1, width: 2 };
const INFO: MeshInfo = { name: "test", part: "test", group: null, fill: null };

function square(centreX: number, centreY: number, half: number): Point2[] {
  return [
    [centreX - half, centreY - half],
    [centreX + half, centreY - half],
    [centreX + half, centreY + half],
    [centreX - half, centreY + half],
  ];
}

function circle(radius: number, count: number): Point2[] {
  return Array.from({ length: count }, (_, index): Point2 => {
    const angle = (2 * Math.PI * index) / count;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  });
}

test("a square with a square hole", () => {
  const mesh = extrude(
    [polygonRing(square(0, 0, 10), STYLE), polygonRing(square(0, 0, 4), STYLE)],
    0,
    5,
    INFO,
  );
  const capVertices = mesh.triangles.length / 3 - 16 * 3;
  assert.ok(capVertices / 3 <= 16, "at most 16 cap triangles");
  assert.equal(
    (mesh.triangles.length / 3 - capVertices) / 3,
    16,
    "16 wall triangles",
  );
  // a top and a bottom polyline for each ring, and a vertical line at each of the 8 corners
  assert.equal(mesh.lines.length, 2 * 2 + 8);
  assert.equal(mesh.silhouetteEdges.length, 0);
});

test("a circle of 64 points has 64 silhouette edges", () => {
  const mesh = extrude([smoothRing(circle(20, 64), STYLE)], 0, 3, INFO);
  assert.equal(mesh.silhouetteEdges.length, 64);
  assert.equal(mesh.lines.length, 2);
});

test("the ring sort finds a hole inside a hole", () => {
  const outer = polygonRing(square(0, 0, 30), STYLE);
  const hole = polygonRing(square(0, 0, 20), STYLE);
  const island = polygonRing(square(0, 0, 10), STYLE);
  const faces = sortRings([island, hole, outer]);
  assert.equal(faces.length, 2);
  const big = faces.find((face) => face.outer === outer);
  const small = faces.find((face) => face.outer === island);
  assert.deepEqual(big?.holes, [hole]);
  assert.deepEqual(small?.holes, []);
});

test("a ribbon has walls and no caps; its ends have vertical lines", () => {
  const points: Point2[] = [
    [0, 0],
    [10, 0],
    [20, 5],
  ];
  const mesh = ribbon(smoothRing(points, STYLE, false), 1, 2, INFO);
  assert.equal(mesh.triangles.length / 9, 4);
  assert.equal(mesh.silhouetteEdges.length, 1);
  assert.equal(mesh.lines.length, 2 + 2);
});

test("a decal has only top lines", () => {
  const mesh = extrude([polygonRing(square(0, 0, 3), STYLE)], 0, 2, INFO, {
    decal: true,
  });
  assert.equal(mesh.triangles.length, 0);
  assert.equal(mesh.lines.length, 1);
});

test("a turn keeps normals perpendicular to the surface", () => {
  // scale x by 3: the normal (1, 0, 0) of a wall stays along x
  const scale = Float32Array.from([
    3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ]);
  const turn = normalMatrix(scale);
  assert.ok(Math.abs(at(turn, 0) - 1 / 3) < 1e-6);
  const mesh = extrude([smoothRing(circle(10, 16), STYLE)], 0, 1, INFO);
  const moved = transformMesh(mesh, scale);
  const first = moved.silhouetteEdges[0];
  assert.ok(first);
  assert.ok(Math.abs(first.start[0] - 30) < 1e-4);
});

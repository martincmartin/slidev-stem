// node --test tasks/2026-10-28-globe-planning/spike/globe.test.ts NE_DIR is
// read from the environment: NE_DIR=... (tools/fetch.sh downloads it).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import {
  coastLines,
  discMatrix,
  facing,
  globeScene,
  landTriangles,
  parseLand,
  SLIDE,
  toSphere,
  view,
  waterStretches,
} from "./globe.ts";
import type { LonLat, Polygon } from "./globe.ts";
import type { Vec3 } from "./webgl/scene.ts";
import { checkAffine, transformPoint } from "./webgl/math.ts";
import { viewProjection } from "./webgl/renderer.ts";
import { checkScene } from "./webgl/scene.ts";

const NE_DIR = process.env["NE_DIR"];
if (NE_DIR === undefined) throw new Error("set NE_DIR to the Natural Earth files (tools/fetch.sh)");
const land = async (scale: string): Promise<Polygon[]> =>
  parseLand(JSON.parse(await readFile(join(NE_DIR, `ne_${scale}_land.geojson`), "utf8")));

test("the camera's angles put a place at the middle, nearest, with east right and north up", () => {
  for (const place of [[-6.3, 49.9], [-78.8, -33.6], [0, 0], [170, 10]] as LonLat[]) {
    const camera = viewProjection(view("test", 1), facing(place), SLIDE);
    const [x, y, depth] = transformPoint(camera.matrix, toSphere(place));
    assert.ok(Math.abs(x) < 1e-5 && Math.abs(y) < 1e-5, `${String(place)} at the middle`);
    const [east] = transformPoint(camera.matrix, toSphere([place[0] + 1, place[1]]));
    const [, north] = transformPoint(camera.matrix, toSphere([place[0], place[1] + 1]));
    assert.ok(east > x, "east is to the right");
    assert.ok(north > y, "north is up: clip y is up");
    const [, , away] = transformPoint(camera.matrix, toSphere([place[0] + 90, 0]));
    assert.ok(depth < away, "the place is nearer than a point 90 degrees away");
  }
});

test("the coast leaves out the cuts at 180 degrees and along the South Pole", async () => {
  const lines = coastLines(await land("50m"));
  for (const { points } of lines) {
    for (let index = 0; index + 1 < points.length; index++) {
      const [lonA, latA] = points[index] ?? [0, 0];
      const [lonB, latB] = points[index + 1] ?? [0, 0];
      assert.ok(!(Math.abs(lonA) === 180 && lonA === lonB), "no edge along 180 degrees");
      assert.ok(!(latA <= -89.99 && latB <= -89.99), "no edge along the South Pole");
    }
  }
});

test("30 W is on water from the Arctic to Antarctica", async () => {
  const stretches = waterStretches((await land("50m")).flat(), -30);
  assert.ok(stretches.some(([north, south]) => north > 60 && south < -70));
});

test("each land face is in front of the sphere's face of its cell, or on it", async () => {
  for (const step of [1.5, 3]) {
    const triangles = landTriangles(await land("110m"), step);
    let worst = Infinity;
    for (let index = 0; index < triangles.length; index += 9) {
      const corners = [0, 3, 6].map((at): Vec3 => [triangles[index + at] ?? 0, triangles[index + at + 1] ?? 0, triangles[index + at + 2] ?? 0]);
      // the cell: from the mean of the corners' longitudes and latitudes (not
      // the 3D centroid: a chord along a parallel bows toward the pole), and
      // its plane through its corners
      const degrees = corners.map(([x, y, z]): LonLat => [(Math.atan2(-y, x) * 180) / Math.PI, (Math.asin(z / Math.hypot(x, y, z)) * 180) / Math.PI]);
      const firstLon = degrees[0]?.[0] ?? 0;
      const near = (value: number): number => (value - firstLon > 180 ? value - 360 : firstLon - value > 180 ? value + 360 : value);
      const lon = degrees.reduce((sum, [value]) => sum + near(value), 0) / 3;
      const lat = degrees.reduce((sum, [, value]) => sum + value, 0) / 3;
      const west = Math.floor((lon + 180) / step) * step - 180;
      const south = Math.floor((lat + 90) / step) * step - 90;
      const cell = [toSphere([west, south]), toSphere([west + step, south]), toSphere([west + step, south + step]), toSphere([west, south + step])];
      const [a, b, c, d] = cell as [Vec3, Vec3, Vec3, Vec3];
      const u: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const v: Vec3 = [d[0] - b[0], d[1] - b[1], d[2] - b[2]];
      const normal: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const length = Math.hypot(...normal) * (normal[0] * a[0] + normal[1] * a[1] + normal[2] * a[2] > 0 ? 1 : -1);
      const height = corners.map((corner) => ((corner[0] - a[0]) * normal[0] + (corner[1] - a[1]) * normal[1] + (corner[2] - a[2]) * normal[2]) / length);
      worst = Math.min(worst, ...height);
    }
    assert.ok(worst > -1e-3, `step ${String(step)}: a corner ${String(worst)} behind its cell's face`);
  }
});

test("the scene is one that the renderer takes", async () => {
  for (const occluder of ["sphere", "disc"] as const) {
    for (const water of [false, true]) {
      const { scene, counts } = globeScene(await land("110m"), { step: 3, water, meridianSpacing: 15, occluder });
      checkScene(scene);
      assert.ok(counts.lineSegments > 0);
    }
  }
});

test("the disc's matrix turns its z axis to the camera, and keeps lengths", () => {
  for (const angles of [{ tilt: 0, turn: 0 }, { tilt: 40, turn: 60 }, { tilt: 123.6, turn: 11.2 }, { tilt: 180, turn: 0 }]) {
    const { toCamera } = viewProjection(view("test", 1), angles, SLIDE);
    const matrix = discMatrix(toCamera);
    checkAffine(matrix, "the disc's matrix");
    const [x, y, z] = transformPoint(matrix, [0, 0, 1]);
    const length = Math.hypot(...toCamera);
    assert.ok(Math.hypot(x - toCamera[0] / length, y - toCamera[1] / length, z - toCamera[2] / length) < 1e-6);
    for (const axis of [[1, 0, 0], [0, 1, 0]] as Vec3[]) {
      const turned = transformPoint(matrix, axis);
      assert.ok(Math.abs(Math.hypot(...turned) - 1) < 1e-6, "a rotation keeps lengths");
      assert.ok(Math.abs(turned[0] * toCamera[0] + turned[1] * toCamera[1] + turned[2] * toCamera[2]) < 1e-6, "the disc is across the view");
    }
  }
});

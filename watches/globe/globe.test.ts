import assert from "node:assert/strict";
import { test } from "node:test";
import { transformPoint } from "../webgl/math.ts";
import { slidePoint, towardCamera, viewProjection } from "../webgl/renderer.ts";
import { checkScene } from "../webgl/scene.ts";
import type { Mesh, Vec3 } from "../webgl/scene.ts";
import earthFile from "./earth.json" with { type: "json" };
import { parseEarth } from "./earth.ts";
import type { Box, LonLat } from "./earth.ts";
import {
  CENTRE,
  DISC_GROUP,
  RADIUS,
  coastIn,
  coastLines,
  discMatrix,
  facing,
  globeMeshes,
  globeView,
  landPieces,
  scaleRanges,
  toSphere,
} from "./globe.ts";
import { globeMatrices, makeGlobe } from "./model.ts";

const SLIDE: readonly [number, number] = [980, 552];
const EARTH = parseEarth(earthFile);
const GLOBE = makeGlobe(SLIDE);

const near = (actual: number, wanted: number, tolerance: number): boolean =>
  Math.abs(actual - wanted) <= tolerance;

test("a view puts its place at its slide point, with east right and north up", () => {
  for (const [centre, at] of [
    [
      [-6.25, 49.8],
      [490, 300],
    ],
    [
      [-78.83, -33.64],
      [230, 300],
    ],
    [
      [170, 10],
      [100, 450],
    ],
  ] as const) {
    const view = globeView({ name: "test", centre, at, kmPerPx: 2 });
    const pose = { view, ...facing(centre) };
    const [x, y] = slidePoint(pose, SLIDE, toSphere(centre));
    // the camera's matrix is single precision
    assert.ok(near(x, at[0], 0.01) && near(y, at[1], 0.01), String([x, y]));
    const [eastX, eastY] = slidePoint(
      pose,
      SLIDE,
      toSphere([centre[0] + 0.1, centre[1]]),
    );
    assert.ok(eastX > x && near(eastY, y, 0.5), "east is to the right");
    const [northX, northY] = slidePoint(
      pose,
      SLIDE,
      toSphere([centre[0], centre[1] + 0.1]),
    );
    assert.ok(northY < y && near(northX, x, 0.01), "north is up");
    // 1 km is 1/2 px at 2 km a px
    assert.ok(
      near(Math.hypot(northX - x, northY - y), (0.1 * 111.195) / 2, 0.01),
    );
  }
});

test("each view has the globe under the slide's middle, and its own angles", () => {
  const { views } = GLOBE;
  assert.deepEqual(
    views.map((view) => view.name),
    ["south america", "channel", "cape noir", "juan fernandez", "scilly"],
  );
  for (const view of views) {
    assert.equal(view.ball, RADIUS);
    assert.deepEqual(view.pivot, CENTRE);
    const angles = view.angles ?? assert.fail();
    // the globe is under the slide's middle: a view's camera looks down at
    // a place, which can be off the slide
    const [x, y] = slidePoint({ view, ...angles }, SLIDE, CENTRE);
    const reach = Math.hypot(SLIDE[0] / 2 - x, SLIDE[1] / 2 - y);
    assert.ok(reach < RADIUS * view.scale, view.name);
  }
});

test("the camera's direction is the depth's gradient in the view's projection", () => {
  const view = {
    name: "test",
    scale: 1,
    shift: [0, 0],
    pivot: [0, 0, 0],
  } as const;
  for (const angles of [
    { tilt: 0, turn: 0 },
    { tilt: 40, turn: 60 },
    { tilt: 123.6, turn: -11.2 },
  ]) {
    const { matrix } = viewProjection(view, angles, SLIDE);
    const toward = towardCamera(angles);
    const step = 10;
    const [, , depth] = transformPoint(matrix, [0, 0, 0]);
    const [, , nearer] = transformPoint(matrix, [
      step * toward[0],
      step * toward[1],
      step * toward[2],
    ]);
    // clip z is the depth, negated (renderer.ts): nearer is smaller
    assert.ok(nearer < depth);
    assert.ok(near(Math.hypot(...toward), 1, 1e-12));
  }
});

test("the disc faces the camera about the globe's centre, and hides the far side", () => {
  for (const place of [
    [0, 0],
    [-76, -55],
    [-6.25, 49.8],
    [120, 89],
  ] as const) {
    const angles = facing(place);
    const matrix = globeMatrices(angles).get(DISC_GROUP) ?? assert.fail();
    assert.deepEqual(matrix, discMatrix(towardCamera(angles)));
    const toward = towardCamera(angles);
    const [x, y, z] = transformPoint(matrix, [0, 0, 1]);
    assert.ok(near(x - CENTRE[0], toward[0], 1e-4), String(place));
    assert.ok(near(y - CENTRE[1], toward[1], 1e-4));
    assert.ok(near(z - CENTRE[2], toward[2], 1e-4));
    // the place is in front of the disc, its antipode behind it
    const height = (point: Vec3): number =>
      (point[0] - CENTRE[0]) * toward[0] +
      (point[1] - CENTRE[1]) * toward[1] +
      (point[2] - CENTRE[2]) * toward[2];
    assert.ok(near(height(toSphere(place)), RADIUS, 1e-6));
    assert.ok(
      near(height(toSphere([place[0] + 180, -place[1]])), -RADIUS, 1e-6),
    );
  }
});

test("the coast leaves out the cuts at 180 degrees and along the South Pole", () => {
  for (const level of EARTH.levels) {
    for (const { points, closed } of coastLines(level.polygons)) {
      const count = closed ? points.length : points.length - 1;
      for (let index = 0; index < count; index++) {
        const [lonA, latA] = points[index] ?? assert.fail();
        const [lonB, latB] =
          points[(index + 1) % points.length] ?? assert.fail();
        assert.ok(!(Math.abs(lonA) === 180 && lonA === lonB), level.scale);
        assert.ok(!(latA <= -89.99 && latB <= -89.99), level.scale);
      }
    }
  }
});

test("a coast cut at a box keeps each part on its side, and the whole line", () => {
  const box: Box = { west: 0, east: 10, south: 0, north: 10 };
  const square: LonLat[] = [
    [-2, 5],
    [5, -2],
    [12, 5],
    [5, 12],
  ];
  const line = { points: square, closed: true };
  const inside = coastIn([line], [box], true);
  const outside = coastIn([line], [box], false);
  const length = (lines: typeof inside): number =>
    lines.reduce((sum, { points, closed }) => {
      let total = 0;
      const count = closed ? points.length : points.length - 1;
      for (let index = 0; index < count; index++) {
        const [a, b] = [points[index], points[(index + 1) % points.length]];
        if (a && b) total += Math.hypot(b[0] - a[0], b[1] - a[1]);
      }
      return sum + total;
    }, 0);
  assert.ok(near(length(inside) + length(outside), length([line]), 1e-9));
  assert.ok(near(length(inside), (length([line]) * 3) / 7, 1e-9));
  for (const { points } of inside) {
    for (const [lon, lat] of points) {
      assert.ok(lon >= 0 && lon <= 10 && lat >= 0 && lat <= 10);
    }
  }
  assert.deepEqual(
    coastIn(
      [line],
      [{ ...box, west: -20, east: 20, south: -20, north: 20 }],
      true,
    ),
    [line],
  );
});

test("each land piece is in one cell of the grid, and on one side of each box edge", () => {
  const boxes = EARTH.levels.at(-1)?.boxes ?? assert.fail();
  const level = EARTH.levels[1] ?? assert.fail();
  const pieces = landPieces(level.polygons, boxes);
  assert.ok(pieces.length > 50_000);
  const sides = (value: number, at: number): number =>
    value < at - 1e-9 ? -1 : value > at + 1e-9 ? 1 : 0;
  for (const piece of pieces) {
    for (const axis of [0, 1] as const) {
      const values = piece.map((corner) => corner[axis]);
      const low = Math.min(...values);
      const high = Math.max(...values);
      assert.ok(Math.floor(low / 3 + 1e-9) >= Math.ceil(high / 3 - 1e-9) - 1);
      for (const box of boxes) {
        const edges =
          axis === 0 ? [box.west, box.east] : [box.south, box.north];
        for (const edge of edges) {
          const found = new Set(values.map((value) => sides(value, edge)));
          assert.ok(
            !(found.has(-1) && found.has(1)),
            `a piece across ${String(edge)}`,
          );
        }
      }
    }
  }
});

/** The land meshes drawn at `scale` that have land at `place`. */
function landAt(meshes: readonly Mesh[], scale: number, place: LonLat): Mesh[] {
  const radians = Math.PI / 180;
  const degrees = ([x, y, z]: Vec3): LonLat => [
    Math.atan2(-(y - CENTRE[1]), x - CENTRE[0]) / radians,
    Math.asin((z - CENTRE[2]) / RADIUS) / radians,
  ];
  const side = (a: LonLat, b: LonLat, c: LonLat): number =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return meshes.filter((mesh) => {
    if (mesh.group !== null || !mesh.scales) return false;
    if (scale < mesh.scales[0] || scale >= mesh.scales[1]) return false;
    const { triangles } = mesh;
    for (let index = 0; index < triangles.length; index += 9) {
      const [a, b, c] = [0, 3, 6].map((at) =>
        degrees([
          triangles[index + at] ?? 0,
          triangles[index + at + 1] ?? 0,
          triangles[index + at + 2] ?? 0,
        ]),
      ) as [LonLat, LonLat, LonLat];
      const signs = [side(a, b, place), side(b, c, place), side(c, a, place)];
      if (signs.every((sign) => sign >= 0) || signs.every((sign) => sign <= 0))
        return true;
    }
    return false;
  });
}

test("at each scale, the land is drawn once, near the stories and away from them", () => {
  const ranges = scaleRanges(EARTH.levels.map((level) => level.scale));
  assert.deepEqual([...ranges.keys()], ["110m", "50m", "10m"]);
  const edges = [...ranges.values()];
  assert.equal(edges[0]?.[0], 0);
  assert.equal(edges.at(-1)?.[1], Infinity);
  for (let index = 0; index + 1 < edges.length; index++) {
    assert.equal(edges[index]?.[1], edges[index + 1]?.[0]);
  }
  // Chile, inside a box of 1:10m; Spain and Australia, outside
  const places: LonLat[] = [
    [-70, -30],
    [-3.7, 40.4],
    [134, -25],
  ];
  for (const [low, high] of edges) {
    const scale = high === Infinity ? low * 2 : (low + high) / 2;
    for (const place of places) {
      const found = landAt(GLOBE.meshes, scale, place);
      assert.equal(
        found.length,
        1,
        `${String(place)} at ${String(scale)}: ${found.map((mesh) => mesh.name).join(", ")}`,
      );
    }
  }
  // the sea is not land
  assert.equal(landAt(GLOBE.meshes, 1, [-30, 0]).length, 0);
});

test("the globe is a scene that the renderer takes, and `all` leaves it out", () => {
  const { meshes, piece } = globeMeshes(EARTH);
  assert.equal(piece.inAll, false);
  assert.equal(piece.meshes.size, meshes.length);
  assert.doesNotThrow(() => {
    checkScene({
      slide: SLIDE,
      meshes,
      groups: [DISC_GROUP],
      views: GLOBE.views,
      pieces: [piece],
    });
  });
});

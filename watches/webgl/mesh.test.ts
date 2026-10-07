import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkRing,
  extrude,
  polygonRing,
  ribbon,
  smoothRing,
  sortRings,
  transformMesh,
} from "./mesh.ts";
import { at } from "./checked.ts";
import type { MeshInfo, Point2, Ring } from "./mesh.ts";
import { INKS } from "./scene.ts";
import type { LineStyle, Vec3 } from "./scene.ts";

const STYLE: LineStyle = { ink: INKS.subject, opacity: 1, width: 2 };
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

/** The triangles, as three vertices each. */
function triangles(values: Float32Array): [Vec3, Vec3, Vec3][] {
  const result: [Vec3, Vec3, Vec3][] = [];
  const vertex = (index: number): Vec3 => [
    at(values, index),
    at(values, index + 1),
    at(values, index + 2),
  ];
  for (let index = 0; index < values.length; index += 9) {
    result.push([vertex(index), vertex(index + 3), vertex(index + 6)]);
  }
  return result;
}

function planArea([first, second, third]: [Vec3, Vec3, Vec3]): number {
  return (
    Math.abs(
      (second[0] - first[0]) * (third[1] - first[1]) -
        (third[0] - first[0]) * (second[1] - first[1]),
    ) / 2
  );
}

function dot(first: Vec3, second: Vec3): number {
  return first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
}

test("a square with a square hole: two caps of the right area, and 16 walls", () => {
  const mesh = extrude(
    [polygonRing(square(0, 0, 10), STYLE), polygonRing(square(0, 0, 4), STYLE)],
    0,
    5,
    INFO,
  );
  const all = triangles(mesh.triangles);
  const flat = all.filter(([first, second, third]) => {
    return first[2] === second[2] && second[2] === third[2];
  });
  const walls = all.filter((triangle) => !flat.includes(triangle));
  assert.equal(walls.length, 16, "16 wall triangles");
  for (const wall of walls) {
    const heights = wall.map(([, , z]) => z);
    assert.deepEqual(
      [Math.min(...heights), Math.max(...heights)],
      [0, 5],
      "each wall spans the bottom to the top",
    );
  }
  for (const height of [0, 5]) {
    const cap = flat.filter(([[, , z]]) => z === height);
    const area = cap.reduce((sum, triangle) => sum + planArea(triangle), 0);
    assert.ok(
      Math.abs(area - (20 ** 2 - 8 ** 2)) < 1e-6,
      `cap at ${String(height)}: area ${String(area)}`,
    );
    for (const triangle of cap) {
      const centreX = triangle.reduce((sum, [x]) => sum + x, 0) / 3;
      const centreY = triangle.reduce((sum, [, y]) => sum + y, 0) / 3;
      assert.ok(
        Math.abs(centreX) > 4 || Math.abs(centreY) > 4,
        "no cap triangle is in the hole",
      );
    }
  }
  // a top and a bottom polyline for each ring, and a vertical line at each of the 8 corners
  assert.equal(mesh.lines.length, 2 * 2 + 8);
  assert.equal(mesh.silhouetteEdges.length, 0);
});

test("a circle of 64 points has 64 silhouette edges", () => {
  const mesh = extrude([smoothRing(circle(20, 64), STYLE)], 0, 3, INFO);
  assert.equal(mesh.silhouetteEdges.length, 64);
  assert.equal(mesh.lines.length, 2);
});

test("the ring sort finds a hole inside a hole, in either winding", () => {
  for (const turn of [false, true]) {
    const ring = (half: number): Ring => {
      const points = square(0, 0, half);
      return polygonRing(turn ? points.reverse() : points, STYLE);
    };
    const outer = ring(30);
    const hole = ring(20);
    const island = ring(10);
    const faces = sortRings([island, hole, outer]);
    assert.equal(faces.length, 2);
    const big = faces.find((face) => face.outer === outer);
    const small = faces.find((face) => face.outer === island);
    assert.deepEqual(big?.holes, [hole]);
    assert.deepEqual(small?.holes, []);
  }
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

test("a ring must have enough points, a flag for each, and no zero-length edge", () => {
  const good = square(0, 0, 1);
  assert.doesNotThrow(() => {
    checkRing(polygonRing(good, STYLE));
  });
  const bad: [string, Ring][] = [
    ["two points, closed", polygonRing(good.slice(0, 2), STYLE)],
    ["one point, open", polygonRing(good.slice(0, 1), STYLE, false)],
    ["too few flags", { ...polygonRing(good, STYLE), corners: [true] }],
    [
      "a repeated point",
      polygonRing([...good.slice(0, 2), at(good, 1), at(good, 2)], STYLE),
    ],
    [
      "the first point again at the end",
      polygonRing([...good, at(good, 0)], STYLE),
    ],
    [
      "not a number",
      polygonRing([...good.slice(0, 3), [Number.NaN, 0]], STYLE),
    ],
  ];
  for (const [what, ring] of bad) {
    assert.throws(
      () => {
        checkRing(ring);
      },
      Error,
      what,
    );
    assert.throws(() => extrude([ring], 0, 1, INFO), Error, what);
  }
  // an open ring may end where it started: its closing edge is not drawn
  assert.doesNotThrow(() => {
    checkRing(polygonRing([...good, at(good, 0)], STYLE, false));
  });
});

test("rings that cross have no outer ring for a hole: an error", () => {
  // two squares that overlap: each one's first point is inside the other
  const first = polygonRing(square(0, 0, 10), STYLE); // starts at (-10, -10)
  const second = polygonRing(
    [
      [5, 5],
      [-20, 5],
      [-20, -20],
      [5, -20],
    ],
    STYLE,
  );
  assert.throws(() => sortRings([first, second]), /cross/);
});

test("a shear keeps each silhouette normal perpendicular to its vertical edge", () => {
  // x += 0.5 z, and y scaled by 3: the vertical edges lean, and the walls turn
  const shear = Float32Array.from([
    1, 0, 0, 0, 0, 3, 0, 0, 0.5, 0, 1, 0, 0, 0, 0, 1,
  ]);
  const mesh = extrude([smoothRing(circle(10, 16), STYLE)], 0, 4, INFO);
  const moved = transformMesh(mesh, shear);
  assert.equal(moved.silhouetteEdges.length, 16);
  for (const edge of moved.silhouetteEdges) {
    const along: Vec3 = [
      edge.end[0] - edge.start[0],
      edge.end[1] - edge.start[1],
      edge.end[2] - edge.start[2],
    ];
    const leaning: Vec3 = [2, 0, 4]; // the edge leans with the shear
    for (const [axis, value] of along.entries()) {
      assert.ok(Math.abs(value - at(leaning, axis)) < 1e-9, "the edge leans");
    }
    for (const normal of [edge.normalBefore, edge.normalAfter]) {
      assert.ok(Math.abs(dot(normal, along)) < 1e-5);
    }
  }
});

test("heights must be finite with the bottom below the top; a decal may be flat", () => {
  const ring = [polygonRing(square(0, 0, 5), STYLE)];
  for (const [bottom, top] of [
    [1, 1],
    [2, 1],
    [0, Number.NaN],
    [Number.NEGATIVE_INFINITY, 0],
  ] as const) {
    assert.throws(() => extrude(ring, bottom, top, INFO), /heights|below/);
  }
  const line = smoothRing(square(0, 0, 5), STYLE, false);
  assert.throws(() => ribbon(line, 1, 0, INFO), /below/);
  assert.doesNotThrow(() => extrude(ring, 1, 1, INFO, { decal: true }));
});

test("transformMesh refuses a matrix that is not affine", () => {
  const mesh = extrude([polygonRing(square(0, 0, 5), STYLE)], 0, 1, INFO);
  const projective = new Float32Array([
    1, 0, 0, 0.5, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ]);
  assert.throws(() => transformMesh(mesh, projective), /not affine/);
});

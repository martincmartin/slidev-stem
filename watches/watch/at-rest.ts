// The watch's meshes in the world at rest (the mechanism at time 0): for the
// tests that check where parts are against each other (generate.test.ts and
// deck.test.ts).

import { at, check, checkFinite } from "../webgl/checked.ts";
import { transformPoint } from "../webgl/math.ts";
import type { Point2 } from "../webgl/mesh.ts";
import type { Group, Mesh } from "../webgl/scene.ts";
import type { Watch } from "./generate.ts";
import { Motion } from "./model.ts";

export type Point3 = readonly [number, number, number];

export class AtRest {
  private readonly matrices: ReadonlyMap<Group, Float32Array>;
  /** Each mesh's points, found once. */
  private readonly found = new Map<Mesh, Point3[]>();

  constructor(watch: Watch) {
    this.matrices = new Motion(watch).matrices(0, 0);
  }

  /** Each vertex of the mesh's faces, in the world. */
  points(mesh: Mesh): Point3[] {
    const known = this.found.get(mesh);
    if (known) return known;
    const matrix = mesh.group ? this.matrices.get(mesh.group) : undefined;
    if (!matrix) throw new Error(`${mesh.name} has no group matrix`);
    const points: Point3[] = [];
    for (let index = 0; index + 2 < mesh.triangles.length; index += 3) {
      points.push(
        transformPoint(matrix, [
          at(mesh.triangles, index),
          at(mesh.triangles, index + 1),
          at(mesh.triangles, index + 2),
        ]),
      );
    }
    this.found.set(mesh, points);
    return points;
  }

  /** The mesh's lowest and highest heights in the world. */
  heights(mesh: Mesh): [number, number] {
    const heights = this.points(mesh).map((point) => point[2]);
    return [Math.min(...heights), Math.max(...heights)];
  }
}

/** How far inside an outline a face must be to count as over it: more than
 *  the rounding of a mesh's 32-bit points, so that a face on the outline's
 *  edge (the case's wall, at a disc clipped to the case) is not over it. */
const OVER_MARGIN = 1e-3;

/** A convex outline in x and y, anticlockwise: what is inside it is on the
 *  left of each edge. */
export class Outline {
  /** Each edge: a point on it and its unit normal, toward the inside. */
  private readonly edges: { x: number; y: number; nx: number; ny: number }[];
  private readonly box: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  /** A circle inside the outline, by more than OVER_MARGIN: a face inside it
   *  needs no clip. */
  private readonly middle: Point2;
  private readonly innerRadius: number;

  constructor(points: readonly Point2[]) {
    check(points.length >= 3, "an outline needs 3 points");
    checkFinite(points.flat(), "the outline");
    this.edges = points.map(([x, y], index) => {
      const [nextX, nextY] = at(points, (index + 1) % points.length);
      const length = Math.hypot(nextX - x, nextY - y);
      check(length > 0, `the outline's edge ${String(index)} has no length`);
      return { x, y, nx: -(nextY - y) / length, ny: (nextX - x) / length };
    });
    // convex and anticlockwise: no point is outside an edge, by more than
    // OVER_MARGIN (the rounding of a mesh's points)
    for (const edge of this.edges) {
      for (const point of points) {
        check(
          this.distance(edge, point) >= -OVER_MARGIN,
          "the outline is not convex and anticlockwise",
        );
      }
    }
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    this.box = {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
    };
    this.middle = [
      xs.reduce((sum, x) => sum + x, 0) / xs.length,
      ys.reduce((sum, y) => sum + y, 0) / ys.length,
    ];
    this.innerRadius =
      Math.min(...this.edges.map((edge) => this.distance(edge, this.middle))) -
      OVER_MARGIN;
    check(this.innerRadius > 0, "the outline is too thin");
  }

  /** The lowest and highest heights of the faces (world points, three a
   *  triangle) where they are over the outline, by more than OVER_MARGIN:
   *  each triangle clipped to it. `null` if no face is over it. */
  heightsOver(triangles: readonly Point3[]): [number, number] | null {
    const { left, right, top, bottom } = this.box;
    let low = Infinity;
    let high = -Infinity;
    for (let index = 0; index + 2 < triangles.length; index += 3) {
      const corners = [
        at(triangles, index),
        at(triangles, index + 1),
        at(triangles, index + 2),
      ];
      const xs = corners.map((point) => point[0]);
      const ys = corners.map((point) => point[1]);
      if (
        Math.max(...xs) <= left ||
        Math.min(...xs) >= right ||
        Math.max(...ys) <= top ||
        Math.min(...ys) >= bottom
      ) {
        continue;
      }
      const [middleX, middleY] = this.middle;
      const over = corners.every(
        ([x, y]) => Math.hypot(x - middleX, y - middleY) < this.innerRadius,
      )
        ? corners
        : this.clip(corners);
      for (const point of over) {
        low = Math.min(low, point[2]);
        high = Math.max(high, point[2]);
      }
    }
    return low <= high ? [low, high] : null;
  }

  /** How far `point` is inside `edge`'s line. */
  private distance(
    edge: { x: number; y: number; nx: number; ny: number },
    point: readonly number[],
  ): number {
    return (
      edge.nx * (at(point, 0) - edge.x) + edge.ny * (at(point, 1) - edge.y)
    );
  }

  /** The part of the polygon `corners` inside the outline: Sutherland and
   *  Hodgman's clip, with the heights along each cut. */
  private clip(corners: readonly Point3[]): readonly Point3[] {
    let polygon = corners;
    for (const edge of this.edges) {
      const kept: Point3[] = [];
      polygon.forEach((point, index) => {
        const next = at(polygon, (index + 1) % polygon.length);
        const here = this.distance(edge, point) - OVER_MARGIN;
        const there = this.distance(edge, next) - OVER_MARGIN;
        if (here >= 0) kept.push(point);
        if ((here < 0 && there > 0) || (here > 0 && there < 0)) {
          const share = here / (here - there);
          kept.push([
            point[0] + share * (next[0] - point[0]),
            point[1] + share * (next[1] - point[1]),
            point[2] + share * (next[2] - point[2]),
          ]);
        }
      });
      if (kept.length === 0) return [];
      polygon = kept;
    }
    return polygon;
  }
}

/** A paper disc's outline in the world: the edge of its fan of triangles. */
export function discOutline(atRest: AtRest, disc: Mesh): Outline {
  const points = atRest.points(disc);
  // a fan: each triangle is the middle, then two points of the edge
  const outline: Point2[] = [];
  for (let index = 1; index < points.length; index += 3) {
    const [x, y] = at(points, index);
    outline.push([x, y]);
  }
  return new Outline(outline);
}

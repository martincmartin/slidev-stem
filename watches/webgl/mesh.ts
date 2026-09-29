// Helpers that make meshes: an outline with holes, extruded along z, or a
// ribbon (walls only). Nothing here knows what the mesh is.

import earcut from "earcut";
import { at } from "./checked.ts";
import type {
  Colour,
  Disc,
  Group,
  Line,
  LineStyle,
  Mesh,
  SilhouetteEdge,
  Vec3,
} from "./scene.ts";

export type Point2 = [number, number];

/** An outline in plan. `style` is the line drawn along it (`null`: none).
 *  `corners[index]` says the outline turns sharply at point `index`: its
 *  vertical edge is always drawn. A point without a corner is drawn only on a
 *  silhouette. */
export interface Ring {
  points: Point2[];
  corners: boolean[];
  style: LineStyle | null;
  /** An open ring has walls and lines only, and no cap. */
  closed: boolean;
}

/** What a mesh is, apart from its geometry. */
export interface MeshInfo {
  name: string;
  part: string;
  group: Group | null;
  fill: Colour | null;
  hiddenInside?: Disc[];
  lineOrder?: number;
  inDrawing?: boolean;
  dynamic?: boolean;
}

export interface ExtrudeOptions {
  /** Lines only, on the top face: no walls, no fill, no bottom edges. */
  decal?: boolean;
}

/** A ring with no sharp corners (a circle, a spiral). */
export function smoothRing(
  points: Point2[],
  style: LineStyle | null,
  closed = true,
): Ring {
  return { points, corners: points.map(() => false), style, closed };
}

/** A ring with a sharp corner at every point (a polygon). */
export function polygonRing(
  points: Point2[],
  style: LineStyle | null,
  closed = true,
): Ring {
  return { points, corners: points.map(() => true), style, closed };
}

function signedArea(points: Point2[]): number {
  let sum = 0;
  for (const [index, [x0, y0]] of points.entries()) {
    const [x1, y1] = at(points, (index + 1) % points.length);
    sum += x0 * y1 - x1 * y0;
  }
  return sum / 2;
}

function contains(outline: Point2[], [x, y]: Point2): boolean {
  let inside = false;
  for (const [index, [x0, y0]] of outline.entries()) {
    const [x1, y1] = at(outline, (index + 1) % outline.length);
    if (y0 > y !== y1 > y && x < x0 + ((y - y0) * (x1 - x0)) / (y1 - y0)) {
      inside = !inside;
    }
  }
  return inside;
}

/** An outer outline and the holes in it. */
export interface Face {
  outer: Ring;
  holes: Ring[];
}

/** Sort closed rings by containment, with the even-odd rule: a ring inside an
 *  even number of rings is an outer ring; one inside an odd number is a hole
 *  of the smallest ring that is around it. */
export function sortRings(rings: Ring[]): Face[] {
  const around = rings.map((ring) => {
    const probe = at(ring.points, 0);
    return rings.filter(
      (other) => other !== ring && contains(other.points, probe),
    );
  });
  const faces = new Map<Ring, Face>();
  for (const [index, ring] of rings.entries()) {
    if (at(around, index).length % 2 === 0) {
      faces.set(ring, { outer: ring, holes: [] });
    }
  }
  for (const [index, ring] of rings.entries()) {
    const containing = at(around, index);
    if (containing.length % 2 === 0) continue;
    const smallest = containing.reduce((best, other) =>
      Math.abs(signedArea(other.points)) < Math.abs(signedArea(best.points))
        ? other
        : best,
    );
    faces.get(smallest)?.holes.push(ring);
  }
  return [...faces.values()];
}

/** The triangles of a face at height `z`, as x, y, z of each vertex. */
function capTriangles(face: Face, z: number): number[] {
  const flat: number[] = [];
  const holeStarts: number[] = [];
  for (const point of face.outer.points) flat.push(...point);
  for (const hole of face.holes) {
    holeStarts.push(flat.length / 2);
    for (const point of hole.points) flat.push(...point);
  }
  const values: number[] = [];
  for (const vertex of earcut(flat, holeStarts, 2)) {
    values.push(at(flat, 2 * vertex), at(flat, 2 * vertex + 1), z);
  }
  return values;
}

function edgeCount(ring: Ring, closed: boolean): number {
  return closed ? ring.points.length : ring.points.length - 1;
}

function wallTriangles(
  ring: Ring,
  closed: boolean,
  bottom: number,
  top: number,
): number[] {
  const values: number[] = [];
  for (let index = 0; index < edgeCount(ring, closed); index++) {
    const [x0, y0] = at(ring.points, index);
    const [x1, y1] = at(ring.points, (index + 1) % ring.points.length);
    values.push(x0, y0, bottom, x1, y1, bottom, x1, y1, top);
    values.push(x0, y0, bottom, x1, y1, top, x0, y0, top);
  }
  return values;
}

/** The outline's normal (in plan, z = 0) on the edge from point `from` to `to`. */
function edgeNormal(ring: Ring, from: number, to: number): Vec3 {
  const [x0, y0] = at(ring.points, from);
  const [x1, y1] = at(ring.points, to);
  const length = Math.hypot(x1 - x0, y1 - y0) || 1;
  return [-(y1 - y0) / length, (x1 - x0) / length, 0];
}

interface Lines {
  lines: Line[];
  silhouetteEdges: SilhouetteEdge[];
}

/** The lines of one outline: its top edges and bottom edges, and its vertical
 *  edges: at a corner, or at the end of an open outline, always; at any other
 *  point only on a silhouette. A decal has its top edges only. */
function ringLines(
  ring: Ring,
  closed: boolean,
  bottom: number,
  top: number,
  decal: boolean,
): Lines {
  const result: Lines = { lines: [], silhouetteEdges: [] };
  const style = ring.style;
  if (style === null) return result;
  const at = (z: number): Vec3[] =>
    ring.points.map(([x, y]): Vec3 => [x, y, z]);
  result.lines.push({ points: at(top), closed, style });
  if (decal) return result;
  result.lines.push({ points: at(bottom), closed, style });
  const count = ring.points.length;
  for (const [index, [x, y]] of ring.points.entries()) {
    const isEnd = !closed && (index === 0 || index === count - 1);
    if (ring.corners[index] === true || isEnd) {
      result.lines.push({
        points: [
          [x, y, bottom],
          [x, y, top],
        ],
        closed: false,
        style,
      });
    } else {
      result.silhouetteEdges.push({
        start: [x, y, bottom],
        end: [x, y, top],
        normalBefore: edgeNormal(ring, (index - 1 + count) % count, index),
        normalAfter: edgeNormal(ring, index, (index + 1) % count),
        style,
      });
    }
  }
  return result;
}

function makeMesh(info: MeshInfo, triangles: number[], lines: Lines): Mesh {
  return {
    name: info.name,
    part: info.part,
    group: info.group,
    fill: info.fill,
    triangles: new Float32Array(triangles),
    lines: lines.lines,
    silhouetteEdges: lines.silhouetteEdges,
    hiddenInside: info.hiddenInside ?? [],
    lineOrder: info.lineOrder ?? 0,
    inDrawing: info.inDrawing ?? true,
    dynamic: info.dynamic ?? false,
  };
}

/** Closed outlines with holes (even-odd, as SVG fills) become a mesh: a cap at
 *  `bottom` and one at `top`, a wall on each edge, and the lines. An open ring
 *  has walls and lines only. */
export function extrude(
  rings: Ring[],
  bottom: number,
  top: number,
  info: MeshInfo,
  options: ExtrudeOptions = {},
): Mesh {
  const decal = options.decal ?? false;
  const triangles: number[] = [];
  const lines: Lines = { lines: [], silhouetteEdges: [] };
  if (!decal) {
    for (const face of sortRings(rings.filter((ring) => ring.closed))) {
      triangles.push(...capTriangles(face, bottom), ...capTriangles(face, top));
    }
  }
  for (const ring of rings) {
    if (!decal) {
      triangles.push(...wallTriangles(ring, ring.closed, bottom, top));
    }
    const made = ringLines(ring, ring.closed, bottom, top, decal);
    lines.lines.push(...made.lines);
    lines.silhouetteEdges.push(...made.silhouetteEdges);
  }
  return makeMesh(info, triangles, lines);
}

/** An open outline with walls only (a spring): no caps. */
export function ribbon(
  polyline: Ring,
  bottom: number,
  top: number,
  info: MeshInfo,
): Mesh {
  return makeMesh(
    info,
    wallTriangles(polyline, false, bottom, top),
    ringLines(polyline, false, bottom, top, false),
  );
}

/** The geometry of a ribbon, for `Renderer.updateMesh`. */
export function ribbonGeometry(
  polyline: Ring,
  bottom: number,
  top: number,
): Pick<Mesh, "triangles" | "lines" | "silhouetteEdges"> {
  const lines = ringLines(polyline, false, bottom, top, false);
  return {
    triangles: new Float32Array(wallTriangles(polyline, false, bottom, top)),
    lines: lines.lines,
    silhouetteEdges: lines.silhouetteEdges,
  };
}

/** A 4 x 4 matrix, column-major, as WebGL takes it. */
export type Matrix4 = Float32Array;

function transformPoint(matrix: Matrix4, [x, y, z]: Vec3): Vec3 {
  const output = (row: number): number =>
    at(matrix, row) * x +
    at(matrix, 4 + row) * y +
    at(matrix, 8 + row) * z +
    at(matrix, 12 + row);
  return [output(0), output(1), output(2)];
}

/** The inverse transpose of the matrix's upper 3 x 3, for a normal. */
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
  const scale = determinant === 0 ? 1 : 1 / determinant;
  // the cofactor matrix over the determinant is the inverse transpose
  return Float32Array.from(cofactors.map((value) => value * scale));
}

function transformNormal(turn: Float32Array, [x, y, z]: Vec3): Vec3 {
  const output = (row: number): number =>
    at(turn, row) * x + at(turn, 3 + row) * y + at(turn, 6 + row) * z;
  return [output(0), output(1), output(2)];
}

/** The mesh with all of its geometry moved by `matrix`, once (the crown is
 *  an extrusion along x: make it along z, then turn it). */
export function transformMesh(mesh: Mesh, matrix: Matrix4): Mesh {
  const turn = normalMatrix(matrix);
  const triangles = new Float32Array(mesh.triangles.length);
  for (let index = 0; index < mesh.triangles.length; index += 3) {
    const moved = transformPoint(matrix, [
      at(mesh.triangles, index),
      at(mesh.triangles, index + 1),
      at(mesh.triangles, index + 2),
    ]);
    triangles.set(moved, index);
  }
  return {
    ...mesh,
    triangles,
    lines: mesh.lines.map((line) => ({
      ...line,
      points: line.points.map((point) => transformPoint(matrix, point)),
    })),
    silhouetteEdges: mesh.silhouetteEdges.map((edge) => ({
      ...edge,
      start: transformPoint(matrix, edge.start),
      end: transformPoint(matrix, edge.end),
      normalBefore: transformNormal(turn, edge.normalBefore),
      normalAfter: transformNormal(turn, edge.normalAfter),
    })),
  };
}

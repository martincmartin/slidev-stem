// Compare the generated scene with the spike's (inputs/spike/out/scene.json).
//
//     node tools/compare_scene.ts        # in this task's directory
//
// For each solid and decal of the spike, it finds the generated mesh with the
// same part, bottom, top and fill, and reports the largest distance between
// their outlines (both ways, at the static pose), and any difference in line
// styles, clip discs or line order. It exits non-zero if a solid has no mesh,
// or a height differs by 1e-6, or an outline differs by more than 0.15 px.

import { readFileSync } from "node:fs";
import type { Point2 } from "../../../webgl/mesh.ts";
import type { Group, Mesh } from "../../../webgl/scene.ts";
import { generate } from "../../../watch/generate.ts";

const OUTLINE_TOLERANCE = 0.15;
const HEIGHT_TOLERANCE = 1e-6;

interface SpikeLine {
  closed: boolean;
  points: number[];
  corners: number[];
  stroke: { colour: string; opacity: number; width: number } | null;
}
interface SpikeSolid {
  name: string;
  part: string;
  bottom: number;
  top: number;
  zTop: number;
  fill: string | null;
  group: number | null;
  placement: number[] | null;
  clips: [number, number, number][];
  lines: SpikeLine[];
  decal: boolean;
}
interface SpikeScene {
  paper: string;
  groups: { parent: number | null; static: number[] }[];
  solids: SpikeSolid[];
}

const spike = JSON.parse(
  readFileSync(new URL("../inputs/spike/out/scene.json", import.meta.url), "utf8"),
) as SpikeScene;
const watch = generate();
const { design } = watch;

type Affine = [number, number, number, number, number, number];
const IDENTITY: Affine = [1, 0, 0, 1, 0, 0];
function multiply(first: Affine, second: Affine): Affine {
  const [a, b, c, d, e, f] = first;
  const [a2, b2, c2, d2, e2, f2] = second;
  return [
    a * a2 + c * b2,
    b * a2 + d * b2,
    a * c2 + c * d2,
    b * c2 + d * d2,
    a * e2 + c * f2 + e,
    b * e2 + d * f2 + f,
  ];
}
function apply(matrix: Affine, [x, y]: Point2): Point2 {
  const [a, b, c, d, e, f] = matrix;
  return [a * x + c * y + e, b * x + d * y + f];
}

function spikeWorld(groupIndex: number | null): Affine {
  if (groupIndex === null) return IDENTITY;
  const group = spike.groups[groupIndex];
  if (!group) throw new Error("no such group");
  const local = group.static as Affine;
  return group.parent === null ? local : multiply(spikeWorld(group.parent), local);
}

// The generated groups at the static pose (time 0): the balance at its
// amplitude, the fork at one end of its bank, every wheel at 0.
const arbors = new Map<Group, Point2>();
const angles = new Map<Group, number>();
arbors.set(watch.groups.root, design.watchCentre);
const [barrel, centre, third, fourth, escape] = design.wheels;
for (const wheel of [barrel, centre, third, fourth, escape]) {
  const group = watch.groups.wheels.get(wheel!);
  if (group) arbors.set(group, wheel!.arbor);
}
arbors.set(watch.groups.balance, design.balance.arbor);
arbors.set(watch.groups.springBase, design.balance.arbor);
arbors.set(watch.groups.fork, design.fork.pivot);
arbors.set(watch.groups.seconds, fourth!.arbor);
arbors.set(watch.groups.hour, centre!.arbor);
arbors.set(watch.groups.minute, centre!.arbor);
angles.set(watch.groups.balance, design.timing.amplitude);
angles.set(watch.groups.fork, -design.timing.bank);

function ourWorld(group: Group | null): Affine {
  if (group === null) return IDENTITY;
  const arbor = arbors.get(group) ?? [0, 0];
  const angle = ((angles.get(group) ?? 0) * Math.PI) / 180;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  // a group that is not the root sits at the watch centre plus its arbor
  const isRoot = group === watch.groups.root;
  const base: Affine = isRoot
    ? [1, 0, 0, 1, arbor[0], arbor[1]]
    : [cosine, sine, -sine, cosine, design.watchCentre[0] + arbor[0], design.watchCentre[1] + arbor[1]];
  return base;
}

function toPaper(hex: string, opacity: number): string {
  const channel = (index: number, colour: string): number =>
    parseInt(colour.slice(index, index + 2), 16);
  const mixed = [1, 3, 5].map((index) =>
    Math.round(opacity * channel(index, hex) + (1 - opacity) * channel(index, spike.paper)),
  );
  return "#" + mixed.map((value) => value.toString(16).padStart(2, "0").toUpperCase()).join("");
}

function segmentDistance([px, py]: Point2, [ax, ay]: Point2, [bx, by]: Point2): number {
  const dx = bx - ax;
  const dy = by - ay;
  const squared = dx * dx + dy * dy;
  const t = squared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / squared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distanceToPolyline(point: Point2, polyline: Point2[], closed: boolean): number {
  let best = Infinity;
  const count = polyline.length;
  for (let index = 0; index < (closed ? count : count - 1); index++) {
    best = Math.min(best, segmentDistance(point, polyline[index]!, polyline[(index + 1) % count]!));
  }
  return best;
}

function hausdorff(first: Point2[], firstClosed: boolean, second: Point2[], secondClosed: boolean): number {
  const oneWay = (from: Point2[], to: Point2[], toClosed: boolean): number =>
    Math.max(...from.map((point) => distanceToPolyline(point, to, toClosed)));
  return Math.max(oneWay(first, second, secondClosed), oneWay(second, first, firstClosed));
}

interface OurLine {
  points: Point2[];
  closed: boolean;
  width: number;
  colour: string;
  opacity: number;
}

/** The mesh's top-face lines in world coordinates: one per ring that has a style. */
function ourTopLines(mesh: Mesh, decal: boolean): OurLine[] {
  const matrix = ourWorld(mesh.group);
  if (mesh.part === "crown") {
    // the crown is along x: its section is the ring at the largest x, as (y, z)
    const right = Math.max(...mesh.lines.flatMap((line) => line.points.map((point) => point[0])));
    return mesh.lines
      .filter((line) => line.points.length > 2 && line.points.every((point) => Math.abs(point[0] - right) < 1e-9))
      .map((line) => ({
        points: line.points.map((point): Point2 => [point[1] + design.watchCentre[1], point[2]]),
        closed: line.closed,
        width: line.style.width,
        colour: line.style.colour,
        opacity: line.style.opacity,
      }));
  }
  const heights = mesh.lines.flatMap((line) => line.points.map((point) => point[2]));
  const top = Math.max(...heights);
  return mesh.lines
    .filter((line) => line.points.length > 2 || decal || line.points.every((point) => point[2] === top))
    .filter((line) => line.points.every((point) => Math.abs(point[2] - top) < 1e-9))
    .map((line) => ({
      points: line.points.map((point) => apply(matrix, [point[0], point[1]])),
      closed: line.closed,
      width: line.style.width,
      colour: line.style.colour,
      opacity: line.style.opacity,
    }));
}

let failures = 0;
function report(message: string, failing = false): void {
  console.log((failing ? "FAIL  " : "      ") + message);
  if (failing) failures++;
}

// Differences that are not the generator's: each has a reason. A solid's name
// starts with the key; `kind` is which check. Each is checked to be at most
// `limit` (px) if it is an outline.
const EXPLAINED: { solid: string; kind: string; limit: number; reason: string }[] = [
  {
    solid: "fourth wheel",
    kind: "disc",
    limit: 0,
    reason:
      "the spike measured the clip circle from the SVG's arcs, whose end points are rounded to 0.1 px: it found radius 42.37; the third wheel's root circle is 41.05",
  },
  {
    solid: "barrel 2",
    kind: "outline",
    limit: 0.16,
    reason: "the barrel's spring: the spike's 16 steps a Bezier and the SVG's rounding against 0.01 px flattening",
  },
  {
    solid: "hairspring 1",
    kind: "outline",
    limit: 0.45,
    reason:
      "the spring is an exact spiral here; the drawing's 13 Beziers bulge off it by up to 0.91 px (spike scene_export.py)",
  },
];
const used = new Set<Mesh>();
let worst = 0;
for (const [index, solid] of spike.solids.entries()) {
  const label = `${String(index)} ${solid.name}`;
  const wantedFill = solid.fill;
  const candidates = watch.scene.meshes.filter(
    (mesh) =>
      !used.has(mesh) &&
      mesh.part === solid.part &&
      (solid.decal
        ? mesh.fill === null
        : mesh.fill !== null &&
          toPaper(mesh.fill.hex, mesh.fill.opacity) === wantedFill?.toUpperCase()),
  );
  const heights = (mesh: Mesh): [number, number] => {
    const z = mesh.lines.flatMap((line) => line.points.map((point) => point[2]));
    return [Math.min(...z), Math.max(...z)];
  };
  const crown = solid.placement !== null;
  const match = candidates.find((mesh) => {
    if (crown) return mesh.part === "crown";
    if (mesh.lines.length === 0) {
      // a mesh with no lines: the triangles say its heights
      const z = Array.from({ length: mesh.triangles.length / 3 }, (_, at) => mesh.triangles[3 * at + 2]!);
      return Math.abs(Math.min(...z) - solid.bottom) < 1e-3 && Math.abs(Math.max(...z) - solid.top) < 1e-3;
    }
    const [bottom, top] = heights(mesh);
    return (
      Math.abs(bottom - solid.bottom) < 1e-3 * (solid.decal ? 1 : 1) + 1e-3 &&
      Math.abs(top - solid.top) < 1e-3 + 1e-3
    );
  });
  if (!match) {
    // find the closest by part for the report
    const same = watch.scene.meshes
      .filter((mesh) => mesh.part === solid.part)
      .map((mesh) => `${mesh.name} ${heights(mesh).map((value) => value.toFixed(3)).join("..")}`);
    report(`${label}: NO MESH (want ${solid.bottom}..${solid.top} ${String(wantedFill)}; have ${same.join(", ")})`, true);
    continue;
  }
  used.add(match);
  const notes: string[] = [];
  const explained: string[] = [];
  const note = (kind: string, text: string, size = 0): void => {
    const known = EXPLAINED.find((item) => solid.name.startsWith(item.solid) && item.kind === kind && size <= item.limit + 1e-9);
    if (known) explained.push(`${text} (explained: ${known.reason})`);
    else notes.push(text);
  };
  if (!crown) {
    const [bottom, top] = match.lines.length ? heights(match) : [solid.bottom, solid.top];
    if (Math.abs(bottom - solid.bottom) > HEIGHT_TOLERANCE || Math.abs(top - solid.top) > HEIGHT_TOLERANCE) {
      note("height", `heights ${bottom}..${top} vs ${solid.bottom}..${solid.top}`);
    }
  }
  if (Math.abs(match.lineOrder - solid.zTop) > HEIGHT_TOLERANCE) {
    note("lineOrder", `lineOrder ${match.lineOrder} vs ${solid.zTop}`);
  }
  // clip discs
  const ourDiscs = match.hiddenInside.map((disc) => [...disc.centre, disc.radius]);
  if (ourDiscs.length !== solid.clips.length) note("disc", `${String(ourDiscs.length)} discs vs ${String(solid.clips.length)}`);
  else {
    for (const [at, disc] of solid.clips.entries()) {
      const ours = ourDiscs[at]!;
      const off = Math.max(...disc.map((value, k) => Math.abs(value - ours[k]!)));
      if (off > 0.15) note("disc", `disc ${String(at)}: ${ours.map((v) => v.toFixed(2)).join(",")} vs ${disc.map((v) => v.toFixed(2)).join(",")}`);
    }
  }
  // outlines and styles
  const ours = ourTopLines(match, solid.decal);
  const matrix = crown ? IDENTITY : spikeWorld(solid.group);
  let outline = 0;
  const styled = solid.lines.filter((line) => line.stroke !== null);
  if (styled.length !== ours.length) note("lines", `${String(ours.length)} lines vs ${String(styled.length)}`);
  for (const line of styled) {
    const pointsList: Point2[] = [];
    for (let at = 0; at < line.points.length; at += 2) pointsList.push([line.points[at]!, line.points[at + 1]!]);
    let world: Point2[];
    if (crown) {
      // (u, v) is (y, z): compare with the crown's section as (y, z)
      const placement = solid.placement ?? [];
      world = pointsList.map(([u, v]) => [u + (placement[13] ?? 0), v + (placement[14] ?? 0)]);
    } else {
      world = pointsList.map((point) => apply(matrix, point));
    }
    let best: OurLine | undefined;
    let bestDistance = Infinity;
    for (const candidate of ours) {
      const distance = hausdorff(world, line.closed, candidate.points, candidate.closed);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
    outline = Math.max(outline, bestDistance);
    if (best && line.stroke) {
      if (Math.abs(best.width - line.stroke.width) > 1e-9 || best.colour.toUpperCase() !== line.stroke.colour.toUpperCase() || Math.abs(best.opacity - line.stroke.opacity) > 1e-9) {
        note("style", `style ${best.width}/${best.colour}/${best.opacity} vs ${line.stroke.width}/${line.stroke.colour}/${line.stroke.opacity}`);
      }
    }
  }
  worst = Math.max(worst, outline);
  if (outline > OUTLINE_TOLERANCE) note("outline", `outline ${outline.toFixed(3)} px`, outline);
  report(
    `${label}: outline ${outline.toFixed(3)} px${notes.length ? "; " + notes.join("; ") : ""}${explained.length ? "; " + explained.join("; ") : ""}`,
    notes.length > 0,
  );
}
const unused = watch.scene.meshes.filter((mesh) => !used.has(mesh));
for (const mesh of unused) report(`generated mesh not in the spike: ${mesh.name}`, mesh.inDrawing);
console.log(`\n${String(spike.solids.length)} solids and decals; worst outline ${worst.toFixed(3)} px; ${String(failures)} failures`);
process.exit(failures === 0 ? 0 : 1);

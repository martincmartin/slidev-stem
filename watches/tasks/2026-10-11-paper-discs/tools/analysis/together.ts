// For each covering part (the group named by a clip disc): the meshes that a
// paper disc at that part's bottom, with the clip disc's radius, would also
// hide, at rest: under it in plan, starting below it, and not hidden by that
// clip disc today.
import { generate } from "../../../../watch/generate.ts";
import { deckSlides } from "../../../../watch/deck.ts";
import { watchState, stageState } from "../../../../watch/state.ts";
import { Motion } from "../../../../watch/model.ts";

const watch = generate();
const matrices = new Motion(watch).matrices(0, 0);
type P = [number, number, number];
const worldTriangles = (mesh: any): P[][] => {
  const matrix = mesh.group ? matrices.get(mesh.group) : undefined;
  const t = mesh.triangles;
  const points: P[] = [];
  for (let index = 0; index < t.length; index += 3) {
    let [x, y, z] = [t[index], t[index + 1], t[index + 2]];
    if (matrix) {
      const m = matrix;
      [x, y, z] = [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
    }
    points.push([x, y, z]);
  }
  const triangles: P[][] = [];
  for (let index = 0; index < points.length; index += 3) triangles.push(points.slice(index, index + 3));
  return triangles;
};
const segmentDistance = (c: number[], a: P, b: P): number => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const squared = dx * dx + dy * dy;
  const t = squared > 0 ? Math.max(0, Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / squared)) : 0;
  return Math.hypot(a[0] + t * dx - c[0], a[1] + t * dy - c[1]);
};
const inside = (c: number[], [a, b, d]: P[]): boolean => {
  const sign = (p: P, q: P) => (c[0] - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (c[1] - q[1]);
  const [s1, s2, s3] = [sign(a, b), sign(b, d), sign(d, a)];
  return !((s1 < 0 || s2 < 0 || s3 < 0) && (s1 > 0 || s2 > 0 || s3 > 0));
};
// the covering groups and their discs (centre, radius), from the clip discs
const covers = new Map<any, { centre: number[]; radius: number }>();
for (const mesh of watch.scene.meshes) for (const disc of mesh.hiddenInside) covers.set(disc.by, { centre: [...disc.centre], radius: disc.radius });
const triangles = new Map(watch.scene.meshes.map((mesh: any) => [mesh, worldTriangles(mesh)]));
const pairs: { group: any; mesh: any }[] = [];
for (const [group, disc] of covers) {
  const own = watch.scene.meshes.filter((mesh: any) => mesh.group === group && triangles.get(mesh)!.length > 0);
  const bottom = Math.min(...own.flatMap((mesh: any) => triangles.get(mesh)!.flat().map((p: P) => p[2])));
  
  for (const mesh of watch.scene.meshes) {
    if (mesh.group === group) continue;
    const clipped = mesh.hiddenInside.some((each: any) => each.by === group);
    // the part of the mesh under the disc: triangles that start below it and meet the circle
    const under = triangles.get(mesh)!.filter((triangle: P[]) =>
      Math.min(...triangle.map((p) => p[2])) < bottom - 1e-6 &&
      (inside(disc.centre, triangle) || [0, 1, 2].some((k) => segmentDistance(disc.centre, triangle[k], triangle[(k + 1) % 3]) < disc.radius)));
    if (under.length === 0) continue;
    const top = Math.max(...under.flat().map((p) => p[2]));
    if (!clipped) pairs.push({ group, mesh });
  }
}

const seen = new Set<string>();
for (const slide of await deckSlides()) {
  const last = Number(slide.frontmatter.clicks ?? 0);
  for (let click = 0; click <= Math.max(last, 12); click++) {
    let state;
    try { state = watchState(slide.frontmatter, click); } catch { continue; }
    if (!state) continue;
    const shown = stageState(watch, state).shown;
    for (const { group, mesh } of pairs) {
      const ownerShown = [...shown].some((each: any) => each.group === group);
      if (ownerShown && shown.has(mesh)) {
        const key = `${slide.title} click ${click}: ${group.name} over ${mesh.name}`;
        if (!seen.has(key)) { seen.add(key); console.log(key); }
      }
    }
  }
}
console.log(`${pairs.length} new pairs; ${seen.size} shown together`);

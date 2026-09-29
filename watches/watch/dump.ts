// Write the generated scene as JSON, for tools/scenecheck.py:
//
//     pnpm art:scene > scene.json
//
// An object reference is written as the index of that object. The
// triangles are not written, only their number: the checks are about styles.

import type { LineStyle, Mesh, Scene } from "../webgl/scene.ts";
import { generate } from "./generate.ts";

function uniqueStyles(mesh: Mesh): LineStyle[] {
  const seen = new Map<string, LineStyle>();
  for (const { style } of [...mesh.lines, ...mesh.silhouetteEdges]) {
    seen.set(
      `${style.colour}/${String(style.opacity)}/${String(style.width)}`,
      style,
    );
  }
  return [...seen.values()];
}

/** The scene as plain data. */
export function sceneData(scene: Scene): object {
  const groupIndex = new Map(
    scene.groups.map((group, index) => [group, index]),
  );
  const meshIndex = new Map(scene.meshes.map((mesh, index) => [mesh, index]));
  const indexOf = <Item>(
    items: Map<Item, number>,
    item: Item | null,
  ): number | null => (item === null ? null : (items.get(item) ?? null));
  return {
    format: 1,
    slide: scene.slide,
    paper: scene.paper,
    groups: scene.groups.map((group) => ({
      name: group.name,
      parent: indexOf(groupIndex, group.parent),
    })),
    meshes: scene.meshes.map((mesh) => ({
      name: mesh.name,
      part: mesh.part,
      group: indexOf(groupIndex, mesh.group),
      fill: mesh.fill,
      triangles: mesh.triangles.length / 9,
      lineStyles: uniqueStyles(mesh),
      lines: mesh.lines.length,
      silhouetteEdges: mesh.silhouetteEdges.length,
      hiddenInside: mesh.hiddenInside,
      lineOrder: mesh.lineOrder,
      inDrawing: mesh.inDrawing,
      dynamic: mesh.dynamic,
    })),
    views: scene.views,
    subjects: scene.subjects.map((subject) => ({
      name: subject.name,
      meshes: [...subject.meshes].map((mesh) => indexOf(meshIndex, mesh)),
    })),
  };
}

if (import.meta.main) {
  process.stdout.write(
    JSON.stringify(sceneData(generate().scene), null, 1) + "\n",
  );
}

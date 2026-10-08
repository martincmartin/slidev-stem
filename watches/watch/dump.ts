// Write the generated scene as JSON, for tools/scenecheck.py:
//
//     pnpm art:scene > scene.json
//
// An object reference is written as the index of that object. The
// triangles are not written, only their number: the checks are about styles.

import { INKS } from "../webgl/scene.ts";
import type { InkName, LineStyle, Mesh, Scene } from "../webgl/scene.ts";
import { generate } from "./generate.ts";
import { INK_VARIABLES } from "./palette.ts";

/** The scene as plain data. `variables` says which theme variable gives each
 *  ink its colour: the data holds no colour, only the ink and its variable. */
export function sceneData(
  scene: Scene,
  variables: Readonly<Record<InkName, string>>,
): object {
  const inks = Object.values(INKS);
  const inkIndex = new Map(inks.map((ink, index) => [ink, index]));
  const uniqueStyles = (mesh: Mesh): object[] => {
    const seen = new Map<string, LineStyle>();
    for (const { style } of [...mesh.lines, ...mesh.silhouetteEdges]) {
      const ink = String(inkIndex.get(style.ink));
      seen.set(`${ink}/${String(style.opacity)}/${String(style.width)}`, style);
    }
    return [...seen.values()].map((style) => ({
      ink: inkIndex.get(style.ink),
      opacity: style.opacity,
      width: style.width,
    }));
  };
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
    inks: inks.map((ink) => ({
      name: ink.name,
      variable: variables[ink.name],
    })),
    groups: scene.groups.map((group) => ({
      name: group.name,
      parent: indexOf(groupIndex, group.parent),
    })),
    meshes: scene.meshes.map((mesh) => ({
      name: mesh.name,
      part: mesh.part,
      group: indexOf(groupIndex, mesh.group),
      fill: mesh.fill && {
        ink: inkIndex.get(mesh.fill.ink),
        opacity: mesh.fill.opacity,
      },
      triangles: mesh.triangles.length / 9,
      lineStyles: uniqueStyles(mesh),
      lines: mesh.lines.length,
      silhouetteEdges: mesh.silhouetteEdges.length,
      hiddenInside: mesh.hiddenInside.map((disc) => ({
        centre: disc.centre,
        radius: disc.radius,
        by: indexOf(groupIndex, disc.by),
      })),
      lineOrder: mesh.lineOrder,
      inDrawing: mesh.inDrawing,
      dynamic: mesh.dynamic,
    })),
    views: scene.views,
    pieces: scene.pieces.map((piece) => ({
      name: piece.name,
      meshes: [...piece.meshes].map((mesh) => indexOf(meshIndex, mesh)),
    })),
  };
}

if (import.meta.main) {
  process.stdout.write(
    JSON.stringify(sceneData(generate().scene, INK_VARIABLES), null, 1) + "\n",
  );
}

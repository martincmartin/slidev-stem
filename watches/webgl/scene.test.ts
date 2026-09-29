import assert from "node:assert/strict";
import { test } from "node:test";
import { extrude, polygonRing } from "./mesh.ts";
import { checkScene, hexRgb } from "./scene.ts";
import type { Group, Mesh, Scene } from "./scene.ts";

const STYLE = { colour: "#143C6B", opacity: 1, width: 2 };
const ROOT: Group = { name: "root", parent: null };

function box(name: string): Mesh {
  return extrude(
    [
      polygonRing(
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
        ],
        STYLE,
      ),
    ],
    0,
    1,
    { name, part: name, group: ROOT, fill: { hex: "#E3E8EC", opacity: 0.5 } },
  );
}

const MESH = box("box");
const GOOD: Scene = {
  slide: [980, 552],
  paper: "#FAF7F0",
  meshes: [MESH],
  groups: [ROOT],
  views: [{ name: "all", scale: 1, shift: [0, 0], pivot: [0, 0, 0] }],
  subjects: [{ name: "the box", meshes: new Set([MESH]) }],
};

test("a colour is #rrggbb", () => {
  assert.deepEqual(hexRgb("#FF0000"), [1, 0, 0]);
  for (const bad of ["FF0000", "#F00", "#GG0000", "#FF00001", "red"]) {
    assert.throws(() => hexRgb(bad), /not a #rrggbb/, bad);
  }
});

test("checkScene takes a good scene, and names what is wrong with a bad one", () => {
  assert.doesNotThrow(() => {
    checkScene(GOOD);
  });
  const other = box("other");
  const stray: Group = { name: "stray", parent: null };
  const bad: [RegExp, Scene][] = [
    [/listed twice/, { ...GOOD, meshes: [MESH, MESH] }],
    [
      /group is not in the scene/,
      { ...GOOD, meshes: [{ ...MESH, group: stray }] },
    ],
    [
      /parent is not in the scene/,
      { ...GOOD, groups: [ROOT, { name: "child", parent: stray }] },
    ],
    [
      /other is not in the scene/,
      { ...GOOD, subjects: [{ name: "s", meshes: new Set([other]) }] },
    ],
    [
      /opacity/,
      { ...GOOD, meshes: [{ ...MESH, fill: { hex: "#E3E8EC", opacity: 2 } }] },
    ],
    [
      /whole triangles/,
      { ...GOOD, meshes: [{ ...MESH, triangles: new Float32Array(4) }] },
    ],
    [
      /NaN/,
      {
        ...GOOD,
        meshes: [{ ...MESH, triangles: new Float32Array(9).fill(Number.NaN) }],
      },
    ],
    [
      /a disc of radius/,
      {
        ...GOOD,
        meshes: [{ ...MESH, hiddenInside: [{ centre: [0, 0], radius: 0 }] }],
      },
    ],
    [
      /line width/,
      {
        ...GOOD,
        meshes: [
          {
            ...MESH,
            lines: [
              {
                points: [
                  [0, 0, 0],
                  [1, 0, 0],
                ],
                closed: false,
                style: { ...STYLE, width: 0 },
              },
            ],
          },
        ],
      },
    ],
    [
      /a line of 1 points/,
      {
        ...GOOD,
        meshes: [
          {
            ...MESH,
            lines: [{ points: [[0, 0, 0]], closed: false, style: STYLE }],
          },
        ],
      },
    ],
    [
      /scale/,
      {
        ...GOOD,
        views: [{ name: "flat", scale: 0, shift: [0, 0], pivot: [0, 0, 0] }],
      },
    ],
    [/not a #rrggbb/, { ...GOOD, paper: "white" }],
  ];
  for (const [message, scene] of bad) {
    assert.throws(() => {
      checkScene(scene);
    }, message);
  }
});

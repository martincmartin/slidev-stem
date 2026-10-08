import assert from "node:assert/strict";
import { test } from "node:test";
import { extrude, polygonRing } from "./mesh.ts";
import { FLASH_INKS, INKS, checkPalette, checkScene, hexRgb } from "./scene.ts";
import type { Group, Ink, Mesh, Palette, Scene } from "./scene.ts";

const STYLE = { ink: INKS.subject, opacity: 1, width: 2 };
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
    {
      name,
      part: name,
      group: ROOT,
      fill: { ink: INKS.subjectWash, opacity: 0.5 },
    },
  );
}

const MESH = box("box");
const GOOD: Scene = {
  slide: [980, 552],
  meshes: [MESH],
  groups: [ROOT],
  views: [{ name: "all", scale: 1, shift: [0, 0], pivot: [0, 0, 0] }],
  pieces: [{ name: "the box", meshes: new Set([MESH]) }],
};

test("a colour is #rrggbb", () => {
  assert.deepEqual(hexRgb("#FF0000"), [1, 0, 0]);
  for (const bad of ["FF0000", "#F00", "#GG0000", "#FF00001", "red"]) {
    assert.throws(() => hexRgb(bad), /not a #rrggbb/, bad);
  }
});

const PALETTE: Palette = {
  paper: "#FAF7F0",
  subject: "#143C6B",
  subjectWash: "#D3DCE3",
  muted: "#736A60",
  mutedWash: "#E2DED6",
  ink: "#2A2520",
  second: "#9A6238",
  secondWash: "#E6D8CA",
};

test("checkPalette wants a #rrggbb colour for the paper and for each ink", () => {
  assert.doesNotThrow(() => {
    checkPalette(PALETTE);
  });
  for (const key of [
    "paper",
    "subject",
    "subjectWash",
    "muted",
    "mutedWash",
    "ink",
  ] as const) {
    assert.throws(
      () => {
        checkPalette({ ...PALETTE, [key]: "pale blue" });
      },
      /not a #rrggbb/,
      key,
    );
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
      { ...GOOD, pieces: [{ name: "s", meshes: new Set([other]) }] },
    ],
    [
      /not one of INKS/,
      {
        ...GOOD,
        meshes: [{ ...MESH, fill: { ink: { name: "subject" }, opacity: 0.5 } }],
      },
    ],
    [
      /opacity/,
      {
        ...GOOD,
        meshes: [{ ...MESH, fill: { ink: INKS.subjectWash, opacity: 2 } }],
      },
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
        meshes: [
          { ...MESH, hiddenInside: [{ centre: [0, 0], radius: 0, by: ROOT }] },
        ],
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
    [
      /two views have one name/,
      { ...GOOD, views: [...GOOD.views, ...GOOD.views] },
    ],
    [
      /two pieces have one name/,
      {
        ...GOOD,
        pieces: [...GOOD.pieces, { name: "the box", meshes: new Set() }],
      },
    ],
  ];
  for (const [message, scene] of bad) {
    assert.throws(() => {
      checkScene(scene);
    }, message);
  }
});

test("a flash draws each ink that a scene uses in a flash ink", () => {
  const flashInks: ReadonlySet<Ink> = new Set([INKS.second, INKS.secondWash]);
  const sceneInks = Object.values(INKS).filter((ink) => !flashInks.has(ink));
  assert.deepEqual(new Set(FLASH_INKS.keys()), new Set(sceneInks));
  for (const ink of FLASH_INKS.values()) assert.ok(flashInks.has(ink));
  assert.equal(FLASH_INKS.get(INKS.subjectWash), INKS.secondWash);
});

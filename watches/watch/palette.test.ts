import assert from "node:assert/strict";
import { test } from "node:test";
import { INKS } from "../webgl/scene.ts";
import { INK_VARIABLES, PAPER_VARIABLE, readPalette } from "./palette.ts";

const MUTED_WASH = "color-mix(in srgb, #736a60 18%, #faf7f0)";
const THEME = new Map([
  ["--palette-background", " #faf7f0"],
  ["--palette-subject", "#143c6b"],
  ["--palette-subject-wash", "#d3dce3"],
  ["--palette-muted", "#736a60"],
  ["--palette-muted-wash", MUTED_WASH],
  ["--palette-ink", "#2a2520"],
  ["--palette-second", "#9a6238"],
  ["--palette-second-wash", "#e6d8ca"],
]);

const variables = (values: ReadonlyMap<string, string>) => ({
  getPropertyValue: (name: string) => values.get(name) ?? "",
});

/** What a browser would give: here only the one recipe needs working out. */
const toHex = (value: string): string =>
  value === MUTED_WASH ? "#e2ded6" : value;

test("every ink has its own theme variable", () => {
  const names = Object.values(INKS).map((ink) => ink.name);
  assert.deepEqual(Object.keys(INK_VARIABLES).sort(), [...names].sort());
  assert.equal(new Set(Object.values(INK_VARIABLES)).size, names.length);
});

test("readPalette gives each ink the colour of its variable", () => {
  assert.deepEqual(readPalette(variables(THEME), toHex), {
    paper: "#faf7f0",
    subject: "#143c6b",
    subjectWash: "#d3dce3",
    muted: "#736a60",
    mutedWash: "#e2ded6",
    ink: "#2a2520",
    second: "#9a6238",
    secondWash: "#e6d8ca",
  });
});

test("readPalette names a variable that the theme does not set", () => {
  for (const name of [PAPER_VARIABLE, ...Object.values(INK_VARIABLES)]) {
    const partial = new Map(THEME);
    partial.delete(name);
    assert.throws(
      () => readPalette(variables(partial), toHex),
      new RegExp(name),
      name,
    );
  }
});

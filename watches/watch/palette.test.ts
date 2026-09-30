import assert from "node:assert/strict";
import { test } from "node:test";
import { INKS } from "../webgl/scene.ts";
import { INK_VARIABLES, PAPER_VARIABLE, readPalette } from "./palette.ts";

const THEME = new Map([
  ["--palette-background", " #faf7f0"],
  ["--palette-art-line", "#143c6b"],
  ["--palette-muted", "#736a60"],
  ["--palette-ink", "#2a2520"],
  ["--palette-art-knockout", "#d3dce3"],
]);

const variables = (values: ReadonlyMap<string, string>) => ({
  getPropertyValue: (name: string) => values.get(name) ?? "",
});

test("every ink has its own theme variable", () => {
  const names = Object.values(INKS).map((ink) => ink.name);
  assert.deepEqual(Object.keys(INK_VARIABLES).sort(), [...names].sort());
  assert.equal(new Set(Object.values(INK_VARIABLES)).size, names.length);
});

test("readPalette gives each ink the colour of its variable", () => {
  assert.deepEqual(readPalette(variables(THEME)), {
    paper: "#faf7f0",
    line: "#143c6b",
    frame: "#736a60",
    detail: "#2a2520",
    knockout: "#d3dce3",
  });
});

test("readPalette names a variable that the theme does not set", () => {
  for (const name of [PAPER_VARIABLE, ...Object.values(INK_VARIABLES)]) {
    const partial = new Map(THEME);
    partial.delete(name);
    assert.throws(
      () => readPalette(variables(partial)),
      new RegExp(name),
      name,
    );
  }
});

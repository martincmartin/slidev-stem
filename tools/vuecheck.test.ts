import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtempDisposable, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { directiveProblems, problems, vueFiles } from "./vuecheck.ts";

const FILE = "One.vue";

function component(template: string): string {
  return `<script setup lang="ts">\n</script>\n\n<template>\n${template}</template>\n`;
}

test("a comment before the one root fails", () => {
  const text = component(
    '  <!-- a note -->\n  <div class="callout">\n    x\n  </div>\n',
  );
  assert.deepEqual(problems(FILE, text), [
    { kind: "root comment", comment: "a note" },
  ]);
});

test("a comment after the one root fails", () => {
  const text = component("  <div>\n    x\n  </div>\n  <!-- a note -->\n");
  assert.equal(problems(FILE, text).length, 1);
});

test("a comment inside the root passes", () => {
  const text = component(
    '  <div>\n    <!-- a note -->\n    <img src="a.png">\n  </div>\n',
  );
  assert.deepEqual(problems(FILE, text), []);
});

test("a template with two roots is not checked", () => {
  assert.deepEqual(
    problems(FILE, component("  <!-- a note -->\n  <i />\n  <div>x</div>\n")),
    [],
  );
  // text is a root too
  assert.deepEqual(
    problems(FILE, component("  <!-- a note -->\n  x <i />\n")),
    [],
  );
});

test("a v-else branch is the same root", () => {
  const text = component(
    '  <!-- a note -->\n  <i v-if="on" />\n  <b v-else-if="half" />\n' +
      "  <div v-else>x</div>\n",
  );
  assert.equal(problems(FILE, text).length, 1);
});

test("a nested template ends inside the root", () => {
  const text = component(
    '  <!-- a note -->\n  <main>\n    <template v-for="x of xs" :key="x">\n' +
      "      <p>{{ x }}</p>\n    </template>\n  </main>\n",
  );
  assert.equal(problems(FILE, text).length, 1);
});

test("a file with no template passes", () => {
  assert.deepEqual(
    problems(FILE, "<script setup>\nconst x = 1;\n</script>\n"),
    [],
  );
});

test("a template that Vue cannot parse fails", () => {
  const [found] = problems(FILE, component("  <div>\n"));
  assert.equal(found?.kind, "unparsed");
});

test("the lint disables are read anywhere in the template", () => {
  const text = component(
    "  <div>\n    <p>\n      <!-- eslint-disable-next-line vue/no-v-html -->\n" +
      '      <span v-html="x" />\n    </p>\n  </div>\n',
  );
  assert.deepEqual(problems(FILE, text), [
    {
      kind: "no reason",
      directive: "eslint-disable-next-line vue/no-v-html",
    },
  ]);
});

test("Vue's production build still reads the comments", async () => {
  await using root = await mkdtempDisposable(join(tmpdir(), "vuecheck-"));
  const file = join(root.path, "One.vue");
  await writeFile(file, component("  <!-- a note -->\n  <div>x</div>\n"));
  const run = spawnSync(
    process.execPath,
    [join(import.meta.dirname, "vuecheck.ts"), file],
    { env: { ...process.env, NODE_ENV: "production" }, encoding: "utf8" },
  );
  assert.equal(run.status, 1, run.stdout + run.stderr);
});

test("the skipped directories are not read", async () => {
  await using root = await mkdtempDisposable(join(tmpdir(), "vuecheck-"));
  for (const name of [
    "A.vue",
    "node_modules/p/B.vue",
    "tasks/t/C.vue",
    ".x/D.vue",
    "dist/E.vue",
  ]) {
    const path = join(root.path, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, "");
  }
  assert.deepEqual(await vueFiles([root.path]), [join(root.path, "A.vue")]);
});

test("a block disable with its enable passes", () => {
  assert.deepEqual(
    directiveProblems([
      "eslint-disable vue/no-v-html -- our own file",
      "eslint-enable vue/no-v-html",
    ]),
    [],
  );
});

test("a block disable without an enable fails", () => {
  const directive = "eslint-disable vue/no-v-html -- our own file";
  assert.deepEqual(directiveProblems([directive]), [
    { kind: "no enable", directive, rule: "vue/no-v-html" },
  ]);
});

test("an enable with no rules ends every disable", () => {
  assert.deepEqual(
    directiveProblems(["eslint-disable a, b -- why", "eslint-enable"]),
    [],
  );
});

test("a next-line disable needs no enable, but a reason", () => {
  assert.deepEqual(
    directiveProblems(["eslint-disable-next-line vue/no-v-html -- why"]),
    [],
  );
  const directive = "eslint-disable-next-line vue/no-v-html";
  assert.deepEqual(directiveProblems([directive]), [
    { kind: "no reason", directive },
  ]);
});

test("a disable that names no rule fails", () => {
  const directive = "eslint-disable -- why";
  assert.deepEqual(directiveProblems([directive]), [
    { kind: "no rule", directive },
  ]);
});

test("other comments are not directives", () => {
  assert.deepEqual(
    directiveProblems(["prettier-ignore", "a note about eslint-disable"]),
    [],
  );
});

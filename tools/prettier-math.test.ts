import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { format, getFileInfo, resolveConfig } from "prettier";
import * as prettierMath from "./prettier-math.ts";
import { starsInMath } from "./prettier-math.ts";

test("starsInMath finds `*` in inline and display math, with the line", () => {
  const text =
    "Intro.\n\nThe difference in $a^*$ and\n$b^*$.\n\n$$\n\\Delta L^*\n$$\n";
  assert.deepEqual(
    starsInMath(text).map((star) => star.line),
    [3, 4, 6],
  );
});

test("starsInMath ignores `*` outside math, in code, and dollar amounts", () => {
  const text = [
    "L* and *emphasis*, and $a^\\ast$ and $b^\\ast$.",
    "From $5 to $10*, not math.",
    "`$a^*$` in a code span.",
    "```ts",
    "const area = $width * $height",
    "```",
    "",
  ].join("\n");
  assert.deepEqual(starsInMath(text), []);
});

test("the plugin stops Prettier before it changes a file, and passes a file with no `*` in math", async () => {
  const options = { parser: "markdown", plugins: [prettierMath] };
  await assert.rejects(
    format("In $a^*$ and $b^*$.\n", options),
    /Write \\ast instead/,
  );
  assert.equal(
    await format("In $a^\\ast$ and $b^\\ast$.\n", options),
    "In $a^\\ast$ and $b^\\ast$.\n",
  );
});

// A deck with frontmatter: the Slidev parser formats its prose, and would change the math.
const DECK = "---\ntitle: Example\n---\n\n# A slide\n\nIn $a^*$ and $b^*$.\n";

for (const [file, parser] of [
  ["../docs/example.md", "markdown"],
  ["../watches/docs/example.md", "markdown"],
  ["../watches/slides.md", "slidev"],
] as const) {
  test(`with the root's config, Prettier parses ${file} as ${parser}, and refuses \`*\` in its math`, async () => {
    const filepath = fileURLToPath(new URL(file, import.meta.url));
    const config = await resolveConfig(filepath);
    assert.ok(config);
    const info = await getFileInfo(filepath, { plugins: config.plugins ?? [] });
    assert.equal(config.parser ?? info.inferredParser, parser);
    await assert.rejects(
      format(DECK, { ...config, filepath }),
      /Write \\ast instead/,
    );
  });
}

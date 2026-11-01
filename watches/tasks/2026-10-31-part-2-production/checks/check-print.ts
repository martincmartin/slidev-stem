// Check the story map's SVG state on actual printed pages. The house print
// check compares the watch and board states; it does not read voyage marks.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { openDeck, withBrowser, ORIGIN } from "../../../../tools/browser.ts";
import { deckSlides } from "../../../watch/deck.ts";

const { positionals } = parseArgs({ allowPositionals: true });
const [deckArg, outputArg] = positionals;
if (!deckArg || !outputArg || positionals.length !== 2)
  throw new Error("usage: check-print.ts DECK OUT");
const deck = resolve(deckArg);
const output = resolve(outputArg);
const slides = (await deckSlides()).filter(
  (slide) => slide.frontmatter["hide"] !== true,
);
const slide =
  slides.findIndex(
    (each) => each.title === "Hunt for Juan Fernández Island, 1741",
  ) + 1;
assert.ok(slide > 0);
await mkdir(output, { recursive: true });
const results = [];
for (const engine of ["chromium", "firefox", "webkit"] as const) {
  const counts = await withBrowser(engine, async (browser) => {
    const served = await openDeck(browser, deck);
    const found: number[] = [];
    try {
      for (const [click, expected] of [
        [2, 12],
        [3, 66],
        [4, 72],
        [5, 72],
      ] as const) {
        await served.page.goto(
          `${ORIGIN}/${slide}?print=clicks&clicks=${click}`,
        );
        const page = served.page.locator(`[data-slidev-no="${slide}"]`);
        await page.waitFor({ state: "visible" });
        const image = page.locator(".watch-still-image");
        await image.waitFor({ state: "visible" });
        await served.page.waitForFunction((selector) => {
          const image = document.querySelector(selector);
          return (
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0
          );
        }, `[data-slidev-no="${slide}"] .watch-still-image`);
        const count = Number(
          await page
            .locator('[data-map="juan fernandez"] .count-number')
            .textContent(),
        );
        assert.equal(count, expected, `${engine}: printed click ${click}`);
        found.push(count);
      }
      assert.deepEqual(served.problems(), []);
      return found;
    } finally {
      await served.page.context().close();
    }
  });
  console.log(`${engine}: printed voyage counts ${counts.join(", ")} passed`);
  results.push({ engine, counts });
}
await writeFile(
  join(output, "print-counts.json"),
  JSON.stringify(results, null, 2) + "\n",
);

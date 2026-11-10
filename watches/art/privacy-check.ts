// Do the live watch and a paused article voyage work without canvas pixel reads?
//
//     node art/privacy-check.ts DECK_DIR    # also `pnpm art:privacy DECK_DIR`
//
// DECK_DIR is the built deck. Each engine starts in a fresh context, with no
// saved browser data, and 2D canvas pixel reads throw: that is the
// restriction that once left a slide blank in Safari's private window, when
// the palette was read from canvas pixels (../../docs/webgl.md, "Checks").
// Playwright's WebKit is not Safari's private window. The engines run at
// once, each in its own browser.

import { parseArgs } from "node:util";
import {
  ENGINES,
  ORIGIN,
  isEngine,
  openDeck,
  requireDeck,
  withBrowser,
} from "./browser.ts";
import type { Engine } from "./browser.ts";

/** ms for cover startup or a paused voyage step to finish. */
const CHECK_TIMEOUT_MS = 5_000;

/** The problems of `engine`: cover startup and a paused article step. */
async function checkEngine(deck: string, engine: Engine): Promise<string[]> {
  return withBrowser(engine, async (browser) => {
    const { page, problems } = await openDeck(browser, deck);
    await page.context().addInitScript(() => {
      CanvasRenderingContext2D.prototype.getImageData = () => {
        throw new Error("Canvas pixel read blocked by the privacy check");
      };
    });
    try {
      await page.goto(`${ORIGIN}/1`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () =>
          window.watchStage !== undefined &&
          document
            .querySelector(".watch-canvas")
            ?.getAttribute("data-watch") !== "null",
        undefined,
        { timeout: CHECK_TIMEOUT_MS },
      );
      await page.goto(`${ORIGIN}/article`);
      await page.locator(".article-motion button").click();
      const voyage = page.locator("#hunt-for-juan-fernandez-island-1741-1");
      await voyage.scrollIntoViewIfNeeded();
      await voyage
        .getByRole("button", { name: "Step 4 of 6", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.querySelector(
            '#hunt-for-juan-fernandez-island-1741-1 [data-map="juan fernandez"] .count-number',
          )?.textContent === "12",
        undefined,
        { timeout: CHECK_TIMEOUT_MS },
      );
    } catch (error) {
      const why = error instanceof Error ? error.message : String(error);
      return [
        `the cover or paused article voyage failed: ${why.split("\n")[0] ?? why}`,
        ...problems(),
      ];
    }
    return problems();
  });
}

const { positionals } = parseArgs({ allowPositionals: true });
const [deck] = positionals;
if (deck === undefined || positionals.length > 1) {
  console.error("usage: node art/privacy-check.ts DECK_DIR");
  process.exit(2);
}
requireDeck(deck);
const results = await Promise.all(
  Object.keys(ENGINES)
    .filter(isEngine)
    .map(async (engine) => ({
      engine,
      problems: await checkEngine(deck, engine),
    })),
);
for (const { engine, problems } of results) {
  for (const problem of problems) console.log(`FAIL ${engine}: ${problem}`);
  if (problems.length === 0) {
    console.log(
      `ok ${engine}: cover and paused article voyage passed with canvas pixel reads blocked`,
    );
  }
}
process.exitCode = results.some(({ problems }) => problems.length > 0) ? 1 : 0;

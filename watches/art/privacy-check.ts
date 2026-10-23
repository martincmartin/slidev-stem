// Does the live watch start in each engine when the page cannot read canvas
// pixels?
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

/** ms for the live watch to start on the cover. */
const STARTUP_TIMEOUT_MS = 5_000;

/** The problems of `engine`: none if its live watch started on the cover. */
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
        { timeout: STARTUP_TIMEOUT_MS },
      );
    } catch (error) {
      const why = error instanceof Error ? error.message : String(error);
      return [
        `the live watch did not start on the cover: ${why.split("\n")[0] ?? why}`,
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
      `ok ${engine}: live watch started with canvas pixel reads blocked`,
    );
  }
}
process.exitCode = results.some(({ problems }) => problems.length > 0) ? 1 : 0;

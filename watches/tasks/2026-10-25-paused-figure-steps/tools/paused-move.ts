// Option 1: a step in a paused figure plays its move, then stands; for a
// reader who asks for reduced motion it is a jump; a pause in the middle of a
// move stands there.
//   node paused-move.ts DECK_DIR
import type { Locator, Page } from "playwright-chromium";
import {
  isEngine,
  openDeck,
  ORIGIN,
  withBrowser,
} from "../../../../tools/browser.ts";

const deck = process.argv[2];
if (!deck) throw new Error("usage: paused-move.ts DECK_DIR");
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** The frame's shots every 400 ms until two in a row are the same (at most
 *  20 s): the first, and the last. */
async function settle(frame: Locator): Promise<{ first: Buffer; last: Buffer; ms: number }> {
  const start = Date.now();
  const first = await frame.screenshot();
  let last = first;
  for (;;) {
    await wait(400);
    const next = await frame.screenshot();
    if (next.equals(last) || Date.now() - start > 20_000) {
      return { first, last: next, ms: Date.now() - start };
    }
    last = next;
  }
}

async function stepped(page: Page): Promise<Locator> {
  const figures = page
    .locator(".article-figure")
    .filter({ has: page.locator('button[aria-label="Next step"]') })
    .filter({ has: page.locator(".article-pause") });
  await figures.first().waitFor();
  return figures;
}

for (const engine of ["chromium", "firefox", "webkit"]) {
  if (!isEngine(engine)) continue;
  await withBrowser(engine, async (browser) => {
    for (const reducedMotion of ["no-preference", "reduce"] as const) {
      const { page, problems } = await openDeck(browser, deck, {
        viewport: { width: 1400, height: 1000 },
        reducedMotion,
      });
      await page.goto(`${ORIGIN}/article`);
      const figures = await stepped(page);
      for (let index = 0; index < (await figures.count()); index++) {
        const figure = figures.nth(index);
        const id = String(await figure.getAttribute("id"));
        const frame = figure.locator(".article-figure-frame");
        const pause = figure.locator(".article-pause");
        await figure.scrollIntoViewIfNeeded();
        await wait(1500);
        if ((await pause.getAttribute("aria-pressed")) !== "true") await pause.click();
        await wait(300);
        const before = await frame.screenshot();
        await figure.locator('button[aria-label="Next step"]').click();
        const { first, last, ms } = await settle(frame);
        console.log(
          `${engine} ${reducedMotion} ${id}: changed ${String(!before.equals(last))}, ` +
            `moved ${String(!first.equals(last))}, stood after ${String(ms)} ms`,
        );
        if (reducedMotion === "reduce" || !id.startsWith("recap")) continue;
        // a pause in the middle of a move stands there
        await figure.locator('button[aria-label="Next step"]').click();
        await wait(500);
        await pause.click(); // play
        await pause.click(); // pause, in the move
        const held = await frame.screenshot();
        await wait(1500);
        const later = await frame.screenshot();
        const { last: end } = await settle(frame);
        await figure.locator('button[aria-label="Next step"]').click();
        const after = await settle(frame);
        console.log(
          `${engine} ${id} paused in a move: stands ${String(held.equals(later) && later.equals(end))}, ` +
            `next step moves ${String(!after.first.equals(after.last))}`,
        );
      }
      console.log(`${engine} ${reducedMotion} problems: ${JSON.stringify(problems())}`);
      await page.context().close();
    }
  });
}

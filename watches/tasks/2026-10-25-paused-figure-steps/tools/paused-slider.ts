// With "pause them all", move each slider and say whether its figure changed.
//   node paused-slider.ts DECK_DIR
import { isEngine, openDeck, ORIGIN, withBrowser } from "/Users/martin/Develop/slidev/stem/work1/tools/browser.ts";

const deck = process.argv[2];
if (!deck) throw new Error("usage: paused-slider.ts DECK_DIR");
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

for (const engine of ["chromium", "firefox", "webkit"]) {
  if (!isEngine(engine)) continue;
  await withBrowser(engine, async (browser) => {
    const { page, problems } = await openDeck(browser, deck, { viewport: { width: 1400, height: 1000 } });
    await page.goto(`${ORIGIN}/article`);
    await page.locator(".article-motion button").click();
    const figures = page.locator(".article-figure").filter({ has: page.locator('input[type="range"]') });
    await figures.first().waitFor();
    for (let index = 0; index < (await figures.count()); index++) {
      const figure = figures.nth(index);
      await figure.scrollIntoViewIfNeeded();
      await wait(1500);
      const frame = figure.locator(".article-figure-frame");
      const before = await frame.screenshot();
      await figure.locator('input[type="range"]').fill("0.6");
      await wait(500);
      const after = await frame.screenshot();
      console.log(`${engine} ${String(await figure.getAttribute("id"))}: slider changed picture ${String(!before.equals(after))}`);
    }
    console.log(`${engine} problems: ${JSON.stringify(problems())}`);
  });
}

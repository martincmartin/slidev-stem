// Pause a figure, step it, and say whether its picture changed.
//   node paused-step.ts DECK_DIR
import { isEngine, openDeck, ORIGIN, withBrowser } from "/Users/martin/Develop/slidev/stem/work1/tools/browser.ts";

const deck = process.argv[2];
if (!deck) throw new Error("usage: paused-step.ts DECK_DIR");
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

for (const engine of ["chromium", "firefox", "webkit"]) {
  if (!isEngine(engine)) continue;
  await withBrowser(engine, async (browser) => {
    const { page, problems } = await openDeck(browser, deck, { viewport: { width: 1400, height: 1000 } });
    await page.goto(`${ORIGIN}/article`);
    const figures = page.locator(".article-figure").filter({ has: page.locator('button[aria-label="Next step"]') });
    await figures.first().waitFor();
    const count = await figures.count();
    for (let index = 0; index < count; index++) {
      const figure = figures.nth(index);
      const playing = (await figure.locator(".article-figure-caption").count()) > 0;
      await figure.scrollIntoViewIfNeeded();
      await wait(1500);
      const pause = figure.locator(".article-pause");
      if ((await pause.count()) > 0) await pause.click();
      else continue; // a still figure: nothing pauses it but "pause all"
      await wait(500);
      const frame = figure.locator(".article-figure-frame");
      const before = await frame.screenshot();
      await figure.locator('button[aria-label="Next step"]').click();
      await wait(800);
      const after = await frame.screenshot();
      await wait(800);
      const later = await frame.screenshot();
      const id = await figure.getAttribute("id");
      console.log(`${engine} ${id}${playing ? " (plays)" : ""}: step changed picture ${String(!before.equals(after))}, still after ${String(after.equals(later))}`);
    }
    console.log(`${engine} problems: ${JSON.stringify(problems())}`);
  });
}

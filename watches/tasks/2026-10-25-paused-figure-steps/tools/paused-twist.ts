// The twist slider in a paused figure: a hold shows the hairspring wound; a
// let-go swings it back to rest, and the figure and the thumb stand there.
//   node paused-twist.ts DECK_DIR
import {
  isEngine,
  openDeck,
  ORIGIN,
  withBrowser,
} from "../../../../tools/browser.ts";

const deck = process.argv[2];
if (!deck) throw new Error("usage: paused-twist.ts DECK_DIR");
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

for (const engine of ["chromium", "firefox", "webkit"]) {
  if (!isEngine(engine)) continue;
  await withBrowser(engine, async (browser) => {
    const { page, problems } = await openDeck(browser, deck, {
      viewport: { width: 1400, height: 1000 },
    });
    await page.goto(`${ORIGIN}/article`);
    const figure = page
      .locator(".article-figure")
      .filter({ hasText: "Give it a twist" });
    await figure.waitFor();
    await figure.scrollIntoViewIfNeeded();
    await wait(1500);
    await figure.locator(".article-pause").click();
    await wait(300);
    const frame = figure.locator(".article-figure-frame");
    const input = figure.locator('input[type="range"]');
    const rest = await frame.screenshot();
    await input.evaluate((element: HTMLInputElement) => {
      element.value = "0.6";
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await wait(500);
    const held = await frame.screenshot();
    await input.dispatchEvent("change");
    await wait(1000);
    const released = await frame.screenshot();
    await wait(1000);
    const later = await frame.screenshot();
    console.log(
      `${engine}: hold changed ${String(!rest.equals(held))}, ` +
        `let-go changed ${String(!held.equals(released))}, ` +
        `stands ${String(released.equals(later))}, thumb ${await input.inputValue()}`,
    );
    console.log(`${engine} problems: ${JSON.stringify(problems())}`);
  });
}

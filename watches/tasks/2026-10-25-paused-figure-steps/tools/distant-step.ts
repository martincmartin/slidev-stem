// A press on a step that is not a neighbour moves, forward and back, in a
// paused figure and in a playing one.
//   node distant-step.ts DECK_DIR
import type { Locator } from "playwright-chromium";
import {
  isEngine,
  openDeck,
  ORIGIN,
  withBrowser,
} from "../../../../tools/browser.ts";

const deck = process.argv[2];
if (!deck) throw new Error("usage: distant-step.ts DECK_DIR");
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** Whether the frame moves after a press: its shot 100 ms after differs from
 *  its shot once it settles. */
async function moves(frame: Locator, press: Locator): Promise<string> {
  await press.click();
  await wait(100);
  const first = await frame.screenshot();
  let last = first;
  const start = Date.now();
  for (;;) {
    await wait(400);
    const next = await frame.screenshot();
    if (next.equals(last) || Date.now() - start > 20_000) break;
    last = next;
  }
  return `${String(!first.equals(last))} (${String(Date.now() - start)} ms)`;
}

for (const engine of ["chromium", "firefox", "webkit"]) {
  if (!isEngine(engine)) continue;
  await withBrowser(engine, async (browser) => {
    const { page, problems } = await openDeck(browser, deck, {
      viewport: { width: 1400, height: 1000 },
    });
    await page.goto(`${ORIGIN}/article`);
    const figures = page
      .locator(".article-figure")
      .filter({ has: page.locator(".article-step") });
    await figures.first().waitFor();
    for (let index = 0; index < (await figures.count()); index++) {
      const figure = figures.nth(index);
      const dots = figure.locator(".article-step");
      const count = await dots.count();
      if (count < 3) continue;
      const id = String(await figure.getAttribute("id"));
      const frame = figure.locator(".article-figure-frame");
      const pause = figure.locator(".article-pause");
      await figure.scrollIntoViewIfNeeded();
      await wait(1500);
      for (const paused of [true, false]) {
        if (await pause.count()) {
          const pressed = (await pause.getAttribute("aria-pressed")) === "true";
          if (pressed !== paused) await pause.click();
        } else if (!paused) continue;
        await dots.nth(0).click();
        await wait(6000);
        const forward = await moves(frame, dots.nth(count - 1));
        const back = await moves(frame, dots.nth(0));
        console.log(
          `${engine} ${id} (${String(count)} steps) ${paused ? "paused" : "playing"}: ` +
            `first to last moves ${forward}, last to first moves ${back}`,
        );
      }
    }
    console.log(`${engine} problems: ${JSON.stringify(problems())}`);
  });
}

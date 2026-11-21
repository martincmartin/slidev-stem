// The Recap: turn it, then jump two steps on: frames of the move, which
// must be one motion from the turned picture to the step's view.
import { chromium } from "playwright-chromium";
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
await page.goto("http://localhost:4321/article/1");
await page.waitForSelector(".article-figure-frame");
const id = await page.evaluate(() => [...document.querySelectorAll("figure.article-figure")].find((f) => f.id.startsWith("recap"))?.id);
const figure = page.locator(`[id="${id}"]`);
const frame = figure.locator(".article-figure-frame");
await frame.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);
const b = await frame.boundingBox();
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
await page.mouse.down();
await page.mouse.move(b.x + b.width * 0.75, b.y + b.height * 0.4, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(800);
const current = await figure.evaluate((el) => [...el.querySelectorAll(".article-step")].findIndex((s) => s.classList.contains("article-step-current")));
const dots = figure.locator(".article-step");
const target = (current + 2) % (await dots.count());
const times = [];
const t0 = Date.now();
// the page's clock stands but for each step of the strip, so that each
// frame is 200 ms of the page's time, however slow a screenshot is
await page.clock.install();
await page.clock.pauseAt(Date.now() + 1000);
await page.screenshot({ path: `${out}/strip-00.png`, clip: b });
await dots.nth(target).click();
for (let i = 1; i < 16; i++) {
  await page.clock.runFor(200);
  await page.screenshot({ path: `${out}/strip-${String(i).padStart(2, "0")}.png`, clip: b });
  times.push(i * 200);
}
console.log({ current, target, times });
await browser.close();

// The Recap's playing figure: a drag holds the tour; a step's button eases
// the turn back, with no drag until the camera is there; then the tour goes on.
import { chromium } from "playwright-chromium";
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:4321/article/1");
await page.waitForSelector(".article-figure-frame");
const id = await page.evaluate(() => [...document.querySelectorAll("figure.article-figure")].filter((f) => f.id.startsWith("recap")).map((f) => f.id)[0]);
const figure = page.locator(`[id="${id}"]`);
const frame = figure.locator(".article-figure-frame");
await frame.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);
const t0 = Date.now();
const state = () => figure.evaluate((el, t0) => ({
  t: ((Date.now() - t0) / 1000).toFixed(1),
  step: [...el.querySelectorAll(".article-step")].findIndex((s) => s.classList.contains("article-step-current")),
  turnable: el.querySelector(".article-figure-frame").classList.contains("article-figure-turnable"),
  turned: el.querySelector(".article-figure-frame").classList.contains("article-figure-turned"),
  reset: getComputedStyle(el.querySelector(".article-reset")).visibility,
}), t0);
const log = [];
log.push(["start", await state()]);
const b = await frame.boundingBox();
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
await page.mouse.down();
await page.mouse.move(b.x + b.width * 0.7, b.y + b.height * 0.45, { steps: 6 });
await page.mouse.up();
log.push(["dragged", await state()]);
await page.screenshot({ path: `${out}/recap-0-turned.png`, clip: b });
// longer than a step's change and its dwell: the tour must hold
await page.waitForTimeout(12000);
log.push(["12 s later", await state()]);
await figure.locator('[aria-label="Next step"]').click();
for (let i = 0; i < 16; i++) {
  log.push([`after next +${i * 0.5}s`, await state()]);
  if (i === 1) await page.screenshot({ path: `${out}/recap-1-returning.png`, clip: b });
  await page.waitForTimeout(500);
}
await page.screenshot({ path: `${out}/recap-2-back.png`, clip: b });
// the tour goes on by itself
await page.waitForTimeout(9000);
log.push(["9 s more", await state()]);
for (const [what, s] of log) console.log(what.padEnd(18), JSON.stringify(s));
console.log("errors", errors);
await browser.close();

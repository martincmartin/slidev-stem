// Turn each figure that has steps or a button, then step or press: it must stay turned.
import { chromium } from "playwright-chromium";
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:4321/article/1");
await page.waitForSelector(".article-figure-frame");
await page.waitForTimeout(3000);
const ids = await page.evaluate(() =>
  [...document.querySelectorAll("figure.article-figure")]
    .filter((f) => f.querySelector(".article-figure-turnable") && f.querySelector(".article-step, .article-action"))
    .map((f) => f.id));
const results = {};
for (const id of ids) {
  const figure = page.locator(`[id="${id}"]`);
  const frame = figure.locator(".article-figure-frame");
  await frame.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const b = await frame.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.7, b.y + b.height * 0.45, { steps: 6 });
  await page.mouse.up();
  const turned = () => frame.evaluate((el) => el.classList.contains("article-figure-turned"));
  const before = await turned();
  const control = (await figure.locator(".article-action").count()) > 0
    ? figure.locator(".article-action")
    : figure.locator('[aria-label="Next step"]');
  await control.click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/keep-${id}.png`, clip: b });
  results[id] = { before, after: await turned(), control: await control.getAttribute("class") };
}
console.log(JSON.stringify({ results, errors }, null, 1));
await browser.close();

import { chromium } from "playwright-chromium";
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
await page.goto("http://localhost:4321/article/1");
await page.waitForSelector(".article-figure-frame");
const figure = page.locator('[id="escapement-4"]');
const frame = figure.locator(".article-figure-frame");
await frame.scrollIntoViewIfNeeded();
await page.waitForTimeout(3000);
const b = await frame.boundingBox();
const [x, y] = [b.x + b.width / 2, b.y + b.height / 2];
const shoot = async (name, count) => {
  for (let i = 0; i < count; i++) {
    await page.screenshot({ path: `${out}/tick-${name}-${i}.png`, clip: b });
    await page.waitForTimeout(170);
  }
};
await shoot("level", 4);
await page.mouse.move(x, y);
await page.mouse.down();
await page.mouse.move(x + b.width * 0.25, y - b.height * 0.12, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(500);
await shoot("turned", 6);
console.log(await page.evaluate(() => [...document.querySelectorAll("#escapement-4 .tick-tock-word")].length));
await browser.close();

// The strap: the cover's figure turned two ways, and the tightest views
// unturned (the Gear Train's first-click figure; the trenches slide in the talk).
import { chromium } from "playwright-chromium";
import { load } from "@slidev/parser/fs";
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
await page.goto("http://localhost:4321/article/1");
await page.waitForSelector(".article-figure-frame");
await page.waitForTimeout(3000);
const shotOf = async (id, name, drags) => {
  const frame = page.locator(`[id="${id}"] .article-figure-frame`);
  await frame.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const b = await frame.boundingBox();
  for (const [dx, dy] of drags) {
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * (0.5 + dx), b.y + b.height * (0.5 + dy), { steps: 6 });
    await page.mouse.up();
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}.png`, clip: b });
};
const cover = await page.evaluate(() => document.querySelector("figure.article-figure").id);
await shotOf(cover, "1-cover", []);
await shotOf(cover, "2-cover-side", [[0.25, 0]]);
await page.locator(`[id="${cover}"] .article-reset`).click();
await page.waitForTimeout(1000);
await shotOf(cover, "3-cover-tipped", [[0.1, -0.35]]);
await shotOf("gear-train-1", "4-gear-train-1", []);
// the talk's trenches slide
const deck = await load(process.cwd(), "slides.md");
const index = deck.slides.findIndex((s) => (s.title ?? "").startsWith("World War I")) + 1;
await page.goto(`http://localhost:4321/${index}`);
await page.waitForTimeout(5000);
await page.screenshot({ path: `${out}/5-trenches-talk.png` });
await browser.close();

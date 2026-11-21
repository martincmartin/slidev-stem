// The Recap: turn it, press "Next step", and log, on a stepped clock, when a
// drag can turn it again, against the camera's arrival (the time scale
// stops changing) and the step's whole change.
import { chromium } from "playwright-chromium";
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
await page.waitForTimeout(500);
await figure.locator('[aria-label="Next step"]').click();
for (let t = 0; t <= 4000; t += 250) {
  const s = await figure.evaluate((el) => ({
    turnable: el.querySelector(".article-figure-frame").classList.contains("article-figure-turnable"),
    scale: el.querySelector(".time-scale")?.textContent?.replace(/\s+/g, " ").trim(),
  }));
  console.log(String(t).padStart(5), s.turnable ? "drag on " : "drag off", s.scale);
  await page.waitForTimeout(100);
}
await browser.close();

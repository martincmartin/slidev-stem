// Drag figures of Part 1 with a mouse (any engine), and swipe them by touch
// (Chromium, through CDP: real touch input, so that touch-action applies).
import { chromium, devices } from "playwright-chromium";
import { firefox } from "playwright-firefox";
import { webkit } from "playwright-webkit";
const engines = { chromium, firefox, webkit };
const name = process.argv[2] ?? "chromium";
const out = process.argv[3];
const ids = (process.argv[4] ?? "what-everyone-should-know-about-mechanical-watches-0").split(",");
const browser = await engines[name].launch();
const touch = process.argv[5] === "touch";
const context = await browser.newContext(touch ? { ...devices["Pixel 7"] } : { viewport: { width: 1100, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto("http://localhost:4321/article/1");
await page.waitForSelector(".article-figure-frame");
await page.waitForTimeout(3000);
const result = {};
const state = (figure) => figure.evaluate((el) => ({
  turned: el.querySelector(".article-figure-frame").classList.contains("article-figure-turned"),
  turnable: el.querySelector(".article-figure-frame").classList.contains("article-figure-turnable"),
  reset: el.querySelector(".article-reset") ? getComputedStyle(el.querySelector(".article-reset")).visibility : "none",
  board: el.querySelector(".diving-board") ? getComputedStyle(el.querySelector(".diving-board")).opacity : "none",
  labels: getComputedStyle(el.querySelector(".slidev-page")).opacity,
  scrollY: Math.round(scrollY),
}));
for (const id of ids) {
  const figure = page.locator(`[id="${id}"]`);
  const frame = figure.locator(".article-figure-frame");
  await frame.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const shot = (step) => figure.screenshot({ path: `${out}/${name}${touch ? "-touch" : ""}-${id}-${step}.png` });
  const r = (result[id] = { start: await state(figure) });
  await shot("0");
  const box = await frame.boundingBox();
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  if (!r.start.turnable) continue;
  if (!touch) {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + box.width * 0.2, y + box.height * 0.1, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(600);
    r.dragged = await state(figure);
    await shot("1");
    await figure.locator(".article-reset").click();
    await page.waitForTimeout(600);
    r.reset = await state(figure);
    await shot("2");
  } else {
    const cdp = await context.newCDPSession(page);
    const swipe = async (dx, dy, at = [x, y]) => {
      const [x0, y0] = at;
      const points = 12;
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] });
      for (let i = 1; i <= points; i++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (dx * i) / points, y: y0 + (dy * i) / points }] });
        await page.waitForTimeout(16);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(800);
    };
    await swipe(0, -200);
    r.vertical = await state(figure);
    await frame.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const box2 = await frame.boundingBox();
    await swipe(120, 15, [box2.x + box2.width / 2, box2.y + box2.height / 2]);
    r.sideways = await state(figure);
    await shot("1");
  }
}
// the wheel over a figure scrolls the page
if (!touch) {
  const frame = page.locator(`[id="${ids[0]}"] .article-figure-frame`);
  await frame.scrollIntoViewIfNeeded();
  const b = await frame.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(600);
  result.wheel = { before, after: await page.evaluate(() => scrollY), turned: await page.locator(`[id="${ids[0]}"] .article-figure-turned`).count() };
}
console.log(JSON.stringify({ result, errors }, null, 1));
await browser.close();

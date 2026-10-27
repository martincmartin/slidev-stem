import { firefox } from "playwright-firefox";
import { openPage } from "/Users/martin/Develop/slidev/stem/work1/watches/art/browser.ts";
const browser = await firefox.launch({ firefoxUserPrefs: { "browser.privatebrowsing.autostart": true } });
for (const viewport of [{ width: 412, height: 915 }, { width: 1440, height: 900 }]) {
  const served = await openPage(browser, "/Users/martin/Develop/slidev/stem/work1/watches/dist", { viewport, deviceScaleFactor: 2.6 });
  const { page } = served;
  await page.goto("https://files.test/article");
  await page.waitForSelector("figure.article-figure canvas.watch-canvas", { timeout: 60000 });
  await page.waitForTimeout(2000);
  const rows = await page.evaluate(() => [...document.querySelectorAll("figure.article-figure")].map((figure) => {
    const canvas = figure.querySelector("canvas.watch-canvas");
    if (!canvas) return null;
    const label = (figure.querySelector("[aria-label]")?.getAttribute("aria-label") ?? "").slice(0, 40);
    const shown = (figure.querySelector("[aria-label]") ?? figure).getBoundingClientRect();
    const drawn = canvas.getBoundingClientRect();
    return `${(drawn.width * drawn.height / (shown.width * shown.height)).toFixed(1)}x  canvas ${Math.round(drawn.width)}x${Math.round(drawn.height)} css, shown ${Math.round(shown.width)}x${Math.round(shown.height)}  ${label}`;
  }).filter(Boolean));
  console.log(`viewport ${viewport.width}x${viewport.height}: canvas area / shown area`);
  for (const row of rows) console.log("  " + row);
  await page.context().close();
}
await browser.close();

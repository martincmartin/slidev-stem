// The pictures of round 8 (PLAN.md, section 18): the Noon Comes Later slide at
// each place for the Sun and each tilt of the camera, before and after the
// Earth turns. In Chromium. In watches/, with the mockup's server running
// (mockup/vite.config.ts):
//   node tasks/2026-10-30-part-2-visual-language/tools/noon.ts http://localhost:5200/ OUT_DIR
// It writes OUT_DIR/frames/<sun>-<tilt>-<hours>.png, a sheet for each time,
// OUT_DIR/sheet-<hours>h.png, and OUT_DIR/marks-<markLat>-<compass>.png: the
// degree marks at each latitude, with and without W and E;
// OUT_DIR/sweep-<sun>.png: every 5° of tilt, with no marks; and
// OUT_DIR/which-<marks>-<hours>.png: which meridians have a mark, at tilt 25°;
// and OUT_DIR/above-<hours>h.png: the Sun at the bottom and the camera every 5°
// from 5° to 40° above the equator, with the three marks, with each one in
// OUT_DIR/frames/above-<degrees>-<hours>.png.
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright-chromium";

const SUNS = ["bottom", "left"] as const;
const TILTS = [0, 15, 30, 45] as const;
const HOURS = [0, 2] as const;

const [base, out] = process.argv.slice(2);
if (base === undefined || out === undefined)
  throw new Error("usage: noon.ts URL OUT_DIR");
await mkdir(join(out, "frames"), { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 980, height: 588 },
    deviceScaleFactor: 2,
  });
  for (const hours of HOURS) {
    const cells: string[] = [];
    for (const sun of SUNS)
      for (const tilt of TILTS) {
        await page.goto(
          `${base}noon.html?sun=${sun}&tilt=${String(tilt)}&hours=${String(hours)}`,
        );
        await page.waitForSelector("body[data-ready]");
        const path = join(
          out,
          "frames",
          `${sun}-${String(tilt)}-${String(hours)}.png`,
        );
        await page.locator("#slide").screenshot({ path });
        const data = (await readFile(path)).toString("base64");
        cells.push(
          `<figure><img src="data:image/png;base64,${data}"><figcaption>Sun ${sun}, tilt ${String(tilt)}°, ${String(hours)} h</figcaption></figure>`,
        );
      }
    const sheet = await browser.newPage({
      viewport: { width: 1980, height: 800 },
    });
    await sheet.setContent(
      `<style>body{margin:10px;font:18px system-ui;background:#fff}.grid{display:grid;grid-template-columns:repeat(4,485px);gap:10px}figure{margin:0}img{width:485px;display:block;border:1px solid #999}</style><div class="grid">${cells.join("")}</div>`,
    );
    await sheet.screenshot({
      path: join(out, `sheet-${String(hours)}h.png`),
      fullPage: true,
    });
    await sheet.close();
  }
  // Every 5° of tilt, for each place for the Sun, with no degree marks
  for (const sun of SUNS) {
    const sweep: string[] = [];
    for (let tilt = 0; tilt <= 45; tilt += 5) {
      await page.goto(
        `${base}noon.html?sun=${sun}&tilt=${String(tilt)}&hours=0&marks=none`,
      );
      await page.waitForSelector("body[data-ready]");
      const data = (await page.locator("#slide").screenshot()).toString(
        "base64",
      );
      sweep.push(
        `<figure><img src="data:image/png;base64,${data}"><figcaption>Sun ${sun}, tilt ${String(tilt)}°</figcaption></figure>`,
      );
    }
    const sweepSheet = await browser.newPage({
      viewport: { width: 1980, height: 800 },
    });
    await sweepSheet.setContent(
      `<style>body{margin:10px;font:18px system-ui;background:#fff}.grid{display:grid;grid-template-columns:repeat(4,485px);gap:10px}figure{margin:0}img{width:485px;display:block;border:1px solid #999}</style><div class="grid">${sweep.join("")}</div>`,
    );
    await sweepSheet.screenshot({
      path: join(out, `sweep-${sun}.png`),
      fullPage: true,
    });
    await sweepSheet.close();
  }
  // The camera low, measured up from the equator: a tilt from the pole of 90
  // less that height
  for (const hours of HOURS) {
    const cells: string[] = [];
    for (let above = 5; above <= 40; above += 5) {
      await page.goto(
        `${base}noon.html?sun=bottom&tilt=${String(90 - above)}&hours=${String(hours)}&marks=story`,
      );
      await page.waitForSelector("body[data-ready]");
      const path = join(
        out,
        "frames",
        `above-${String(above)}-${String(hours)}.png`,
      );
      await page.locator("#slide").screenshot({ path });
      const data = (await readFile(path)).toString("base64");
      cells.push(
        `<figure><img src="data:image/png;base64,${data}"><figcaption>${String(above)}° above the equator, ${String(hours)} h</figcaption></figure>`,
      );
    }
    const sheet = await browser.newPage({
      viewport: { width: 1980, height: 800 },
    });
    await sheet.setContent(
      `<style>body{margin:10px;font:18px system-ui;background:#fff}.grid{display:grid;grid-template-columns:repeat(4,485px);gap:10px}figure{margin:0}img{width:485px;display:block;border:1px solid #999}</style><div class="grid">${cells.join("")}</div>`,
    );
    await sheet.screenshot({
      path: join(out, `above-${String(hours)}h.png`),
      fullPage: true,
    });
    await sheet.close();
  }
  // Which meridians have a degree mark, before and after the Earth turns
  for (const which of ["none", "story", "every45"] as const)
    for (const hours of HOURS) {
      await page.goto(
        `${base}noon.html?sun=bottom&tilt=25&hours=${String(hours)}&marks=${which}`,
      );
      await page.waitForSelector("body[data-ready]");
      await page.locator("#slide").screenshot({
        path: join(out, `which-${which}-${String(hours)}.png`),
      });
    }
  for (const markLat of [60, 70, 75])
    for (const compass of [0, 1]) {
      await page.goto(
        `${base}noon.html?sun=bottom&tilt=30&hours=0&markLat=${String(markLat)}&compass=${String(compass)}`,
      );
      await page.waitForSelector("body[data-ready]");
      await page.locator("#slide").screenshot({
        path: join(out, `marks-${String(markLat)}-${String(compass)}.png`),
      });
    }
} finally {
  await browser.close();
}

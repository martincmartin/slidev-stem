// Sample two article figures' 2D canvases each frame: does the later one
// sometimes show the earlier one's picture?
import { firefox } from "playwright-firefox";
import { chromium } from "playwright-chromium";
import { openPage } from "/Users/martin/Develop/slidev/stem/work1/watches/art/browser.ts";

const engineName = process.argv[2] ?? "firefox";
const deck = "/Users/martin/Develop/slidev/stem/work1/watches/dist";
const engine = engineName === "firefox" ? firefox : chromium;
const browser = await engine.launch(
  engineName === "firefox"
    ? { firefoxUserPrefs: { "browser.privatebrowsing.autostart": true } }
    : {},
);
const served = await openPage(browser, deck, {
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2.6,
});
const { page } = served;
await page.goto("https://files.test/article");
await page.waitForSelector("figure.article-figure canvas.watch-canvas", { timeout: 60000 });
await page.waitForTimeout(3000);
const result = await page.evaluate(async () => {
  const figures = [...document.querySelectorAll("figure.article-figure")];
  const label = (figure: Element) =>
    figure.querySelector("[aria-label]")?.getAttribute("aria-label") ?? "";
  const four = figures.find((figure) => label(figure).startsWith("The minute hand on the center"));
  const twoThree = figures.find((figure) => label(figure).startsWith("Two more pairs of gears"));
  if (!four || !twoThree) return { error: figures.map(label) };
  four.scrollIntoView({ block: "center" });
  await new Promise((done) => setTimeout(done, 3000));
  const canvases = [twoThree, four].map((figure) => figure.querySelector("canvas.watch-canvas") as HTMLCanvasElement);
  const ink = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d")!;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const [r, g, b] = [data[0], data[1], data[2]];
    let count = 0;
    for (let index = 0; index < data.length; index += 4) {
      if (Math.abs(data[index] - r) + Math.abs(data[index + 1] - g) + Math.abs(data[index + 2] - b) > 60) count++;
    }
    return count;
  };
  const samples: number[][] = [];
  const starts: number[] = [];
  for (let frame = 0; frame < 240; frame++) {
    await new Promise((done) => requestAnimationFrame(done));
    starts.push(performance.now());
    samples.push(canvases.map(ink));
  }
  const rects = canvases.map((canvas) => { const box = canvas.getBoundingClientRect(); return [Math.round(box.top), Math.round(box.bottom), canvas.width, canvas.height]; });
  return { samples, starts, rects, viewport: innerHeight };
});
if ("error" in result) { console.log(result.error); process.exit(1); }
const { samples, starts, rects } = result;
console.log(engineName, "rects (top, bottom, width, height):", JSON.stringify(rects));
for (const column of [0, 1]) {
  const values = samples.map((sample) => sample[column]);
  const sorted = [...values].sort((a, b) => a - b);
  console.log(column === 0 ? "fig 2-3" : "fig 4", "min", sorted[0], "median", sorted[sorted.length >> 1], "max", sorted.at(-1));
}
const median4 = [...samples.map((s) => s[1])].sort((a, b) => a - b)[120];
const odd = samples.filter((s) => Math.abs(s[1] - median4) > 0.1 * median4).length;
console.log("fig 4 frames more than 10% from its median:", odd, "of", samples.length);
const gaps = starts.slice(1).map((t, i) => t - starts[i]).sort((a, b) => a - b);
console.log("frame gap median", gaps[gaps.length >> 1].toFixed(1), "max", gaps.at(-1)!.toFixed(1));
console.log("problems", served.problems());
await browser.close();

// Load #gear-train, scroll down through the section, and sample the click 4
// figure's canvas each frame while it is drawn.
import { firefox } from "playwright-firefox";
import { openPage } from "/Users/martin/Develop/slidev/stem/work1/watches/art/browser.ts";
const headless = process.argv[2] !== "headed";
const browser = await firefox.launch({ headless });
const served = await openPage(browser, "/Users/martin/Develop/slidev/stem/work1/watches/dist", {
  viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6,
});
const { page } = served;
await page.goto("https://files.test/article#gear-train");
await page.waitForSelector("figure.article-figure canvas.watch-canvas", { timeout: 60000 });
const result = await page.evaluate(async () => {
  const figures = [...document.querySelectorAll("figure.article-figure")];
  const label = (figure: Element) => figure.querySelector("[aria-label]")?.getAttribute("aria-label") ?? "";
  const four = figures.find((figure) => label(figure).startsWith("The minute hand on the center"))!;
  const canvas = four.querySelector("canvas.watch-canvas") as HTMLCanvasElement;
  const ink = () => {
    if (canvas.width < 400) return -1;
    const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    let count = 0;
    for (let index = 0; index < data.length; index += 16) {
      if (Math.abs(data[index] - data[0]) + Math.abs(data[index + 1] - data[1]) + Math.abs(data[index + 2] - data[2]) > 60) count++;
    }
    return count;
  };
  const samples: number[] = [];
  const target = four.getBoundingClientRect().bottom + scrollY - innerHeight + 50;
  const from = scrollY;
  for (let frame = 0; frame < 600; frame++) {
    await new Promise((done) => requestAnimationFrame(done));
    scrollTo(0, from + Math.min(1, frame / 300) * (target - from));
    samples.push(ink());
  }
  return samples;
});
const drawn = result.filter((value) => value >= 0);
const settled = drawn.slice(-200);
const sorted = [...settled].sort((a, b) => a - b);
const median = sorted[sorted.length >> 1];
console.log(headless ? "headless" : "headed", "frames drawn", drawn.length, "median ink", median, "min", sorted[0], "max", sorted.at(-1));
const low = drawn.map((value, index) => [index, value]).filter(([, value]) => value < 0.8 * median);
console.log("frames with under 80% of the median ink:", low.length, JSON.stringify(low.slice(0, 20)));
await browser.close();

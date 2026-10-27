// Time each rAF callback, and the drawImage copies of a WebGL canvas within it.
import { firefox } from "playwright-firefox";
import { chromium } from "playwright-chromium";
import { openPage } from "/Users/martin/Develop/slidev/stem/work1/watches/art/browser.ts";

const engineName = process.argv[2] ?? "firefox";
const target = process.argv[3] ?? "The minute hand on the center";
const engine = engineName === "firefox" ? firefox : chromium;
const browser = await engine.launch(
  engineName === "firefox"
    ? { firefoxUserPrefs: { "browser.privatebrowsing.autostart": true } }
    : { args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] },
);
const served = await openPage(browser, "/Users/martin/Develop/slidev/stem/work1/watches/dist", {
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2.6,
});
const { page } = served;
await page.addInitScript(() => {
  const stats = { copyMs: 0, copies: 0, callbackMs: 0, callbacks: 0, finishMs: 0 };
  (window as unknown as { copyStats: typeof stats }).copyStats = stats;
  const drawImage = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
    const source = args[0];
    if (source instanceof HTMLCanvasElement && !source.isConnected) {
      // the time for the GPU to finish, apart from the copy
      const gl = source.getContext("webgl2");
      const before = performance.now();
      gl?.finish();
      const finished = performance.now();
      stats.finishMs += finished - before;
      (drawImage as (...a: unknown[]) => void).apply(this, args);
      stats.copyMs += performance.now() - finished;
      stats.copies++;
      return;
    }
    (drawImage as (...a: unknown[]) => void).apply(this, args);
  } as typeof drawImage;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => raf((now) => {
    const before = performance.now();
    callback(now);
    stats.callbackMs += performance.now() - before;
    stats.callbacks++;
  });
});
await page.goto("https://files.test/article");
await page.waitForSelector("figure.article-figure canvas.watch-canvas", { timeout: 60000 });
await page.waitForTimeout(3000);
const result = await page.evaluate(async (target) => {
  const figures = [...document.querySelectorAll("figure.article-figure")];
  const label = (figure: Element) => figure.querySelector("[aria-label]")?.getAttribute("aria-label") ?? "";
  const figure = figures.find((each) => label(each).startsWith(target));
  if (!figure) return { error: figures.map(label) };
  figure.scrollIntoView({ block: "center" });
  await new Promise((done) => setTimeout(done, 3000));
  const stats = (window as unknown as { copyStats: Record<string, number> }).copyStats;
  for (const key of Object.keys(stats)) stats[key] = 0;
  const start = performance.now();
  await new Promise((done) => setTimeout(done, 4000));
  const elapsed = performance.now() - start;
  const sizes = [...document.querySelectorAll("canvas.watch-canvas")]
    .map((canvas) => canvas as HTMLCanvasElement)
    .filter((canvas) => { const box = canvas.getBoundingClientRect(); return box.bottom > -200 && box.top < innerHeight + 200; })
    .map((canvas) => `${canvas.width}x${canvas.height}`);
  return { ...stats, elapsed, sizes };
}, target);
if ("error" in result) { console.log(result.error); process.exit(1); }
const frames = result.callbacks;
console.log(engineName, JSON.stringify(target), "near-screen canvases", result.sizes.join(", "));
console.log(`  frames ${frames} in ${(result.elapsed / 1000).toFixed(1)} s = ${(frames / result.elapsed * 1000).toFixed(1)} fps`);
console.log(`  per frame: rAF JS ${(result.callbackMs / frames).toFixed(1)} ms, of it GPU finish ${(result.finishMs / frames).toFixed(1)} ms, drawImage copy ${(result.copyMs / frames).toFixed(1)} ms (${(result.copies / frames).toFixed(1)} copies)`);
await browser.close();

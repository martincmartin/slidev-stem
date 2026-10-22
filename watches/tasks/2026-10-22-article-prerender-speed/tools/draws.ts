// How many figures are drawn in each frame, and how big: drawImage calls by
// target canvas, figure by figure, over each figure's settle.
//
//     node tasks/2026-10-22-article-prerender-speed/tools/draws.ts DIST OUT.json
//
// (measure.ts's notes follow.)
//
// DIST is a deck built with base "/". As prerender.ts does, it serves DIST,
// opens /article, and for each figure scrolls to it, waits SETTLE_MS and
// takes a screenshot of its frame. For each figure it records: the
// screenshot's time; and, over the settle, the frames, the long animation
// frames with their scripts' total time by source (function name and URL),
// the requestAnimationFrame callbacks by caller, and the running animations
// (CSS and Web Animations; SVG SMIL: SVGs whose animations are not paused).
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { chromium } from "playwright-chromium";

const dist = resolve(process.argv[2] ?? "dist");
const outFile = process.argv[3] ?? "draws.json";
const SETTLE_MS = 2500;
const TYPES: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2",
  ".json": "application/json",
};
const index = await readFile(join(dist, "index.html"), "utf8");
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname);
  const file = join(dist, path);
  (file.startsWith(dist + sep) ? readFile(file) : Promise.reject(new Error()))
    .then((body) => {
      response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      response.end(body);
    })
    .catch(() => {
      response.writeHead(200, { "content-type": "text/html" });
      response.end(index);
    });
});
await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
const address = server.address();
if (address === null || typeof address === "string") throw new Error("no port");

// In the page, before its scripts: count rAF callbacks by caller, and keep
// the long animation frames.
const PROBE = `
(() => {
  const counts = new Map();
  const original = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => {
    const line = (new Error().stack ?? "").split("\\n")[2] ?? "?";
    const key = line.trim().replace(/:\\d+:\\d+\\)?$/, "").replace(/\\?[^ )]*/, "");
    return original((now) => { counts.set(key, (counts.get(key) ?? 0) + 1); callback(now); });
  };
  const frames = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      frames.push({ duration: entry.duration, scripts: entry.scripts.map((s) => ({
        source: (s.sourceFunctionName || s.invoker || "?") + " " + (s.sourceURL || "").replace(/.*\\//, ""),
        duration: s.duration })) });
    }
  }).observe({ type: "long-animation-frame", buffered: false });
  const draws = new Map();
  const drawImage = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (...args) {
    const canvas = this.canvas;
    const figure = canvas.closest?.("figure")?.id ?? "(none)";
    const source = args[0];
    const key = figure + " " + String(source.width) + "x" + String(source.height) + "->" + String(canvas.width) + "x" + String(canvas.height);
    draws.set(key, (draws.get(key) ?? 0) + 1);
    return drawImage.apply(this, args);
  };
  let frameCount = 0;
  const tick = () => { frameCount++; original(tick); };
  original(tick);
  window.__probe = {
    reset() { counts.clear(); frames.length = 0; frameCount = 0; draws.clear(); },
    read() {
      const bySource = {};
      for (const frame of frames) for (const s of frame.scripts) bySource[s.source] = (bySource[s.source] ?? 0) + s.duration;
      return {
        frames: frameCount,
        draws: Object.fromEntries(draws),
        longFrames: frames.length,
        longFrameMs: frames.reduce((sum, f) => sum + f.duration, 0),
        scriptMsBySource: bySource,
        rafByCaller: Object.fromEntries(counts),
        animations: document.getAnimations().filter((a) => a.playState === "running").length,
        smilRunning: [...document.querySelectorAll("svg")].filter((svg) => svg.querySelector("animate, animateTransform, animateMotion, set") && !svg.animationsPaused()).length,
      };
    },
  };
})();`;

const browser = await chromium.launch();
const results: unknown[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "no-preference" });
  page.setDefaultTimeout(180_000);
  await page.addInitScript(PROBE);
  await page.goto(`http://127.0.0.1:${String(address.port)}/article`);
  await page.locator("figure.article-figure").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  const figures = page.locator("figure.article-figure");
  const count = await figures.count();
  const start = performance.now();
  for (let index = 0; index < count; index++) {
    const figure = figures.nth(index);
    const id = await figure.getAttribute("id");
    await figure.scrollIntoViewIfNeeded();
    await page.evaluate(() => (window as unknown as { __probe: { reset(): void } }).__probe.reset());
    await page.waitForTimeout(SETTLE_MS);
    const settle = await page.evaluate(() => (window as unknown as { __probe: { read(): unknown } }).__probe.read());
    results.push({ index, id, settle });
    const { frames, draws } = settle as { frames: number; draws: Record<string, number> };
    console.log(index, id, "frames", frames, JSON.stringify(draws));
  }
  console.log("total", Math.round((performance.now() - start) / 1000), "s");
} finally {
  await writeFile(outFile, JSON.stringify(results, null, 2));
  await browser.close();
  server.close();
}

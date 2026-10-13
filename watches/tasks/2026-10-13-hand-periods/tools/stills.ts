// Stills of the slides around the new slide's place, from a built deck.
//
//     node tasks/2026-10-13-hand-periods/tools/stills.ts [DIST] [OUT]
//
// Run from watches/. DIST (default dist/) is a `pnpm build` output; OUT
// (default tasks/2026-10-13-hand-periods/out/) gets one PNG for each shot.
// The tool serves DIST itself, with the single-page fallback, on a free
// port, and opens each slide and click in Chromium at 980 x 552. It waits
// SETTLE ms for the watch's fades and camera moves to end.

import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright-chromium";

const dist = resolve(process.argv[2] ?? "dist");
const out = resolve(process.argv[3] ?? "tasks/2026-10-13-hand-periods/out");
const SETTLE = 6000;

// slide title, clicks, file name. The tool finds each slide by its title
// (AGENTS.md: name a slide by its title, not its number)
const shots: readonly (readonly [string, number, string])[] = [
  ["What Every Nerd Should Know About Mechanical Watches", 0, "cover"],
  ["Escapement", 4, "escapement-click-4"],
  ["Three Hands", 0, "three-hands-click-0"],
  ["Three Hands", 1, "three-hands-click-1"],
  ["Three Hands", 2, "three-hands-click-2"],
  ["Three Hands", 3, "three-hands-click-3"],
  ["Gears", 0, "gears-click-0"],
  ["Gears", 6, "gears-click-6"],
  ["Gear Train", 4, "gear-train-click-4"],
  ["Hour Hand", 6, "hour-hand-click-6"],
];
const LAST_SLIDE = 20;

const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".json": "application/json",
};

const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname);
  const file = join(dist, path);
  readFile(file)
    .catch(() => readFile(join(dist, "index.html")))
    .then((body) => {
      const type = file.startsWith(dist) && extname(file) ? TYPES[extname(file)] : undefined;
      response.writeHead(200, { "content-type": type ?? "text/html" });
      response.end(body);
    })
    .catch(() => {
      response.writeHead(404);
      response.end();
    });
});
await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
const address = server.address();
if (address === null || typeof address === "string") throw new Error("no port");
const base = `http://127.0.0.1:${String(address.port)}`;

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  // each slide's number in this build, from the title on its page
  const numbers = new Map<string, number>();
  const probe = await browser.newPage();
  for (let slide = 1; slide <= LAST_SLIDE; slide++) {
    await probe.goto(`${base}/${String(slide)}`);
    await probe.waitForTimeout(500);
    const title = (await probe.locator(".slidev-page:visible h1").first().textContent({ timeout: 2000 }).catch(() => null))?.trim();
    if (title !== undefined && !numbers.has(title)) numbers.set(title, slide);
  }
  await probe.close();
  for (const [title, clicks, name] of shots) {
    const slide = numbers.get(title);
    if (slide === undefined) throw new Error(`no slide titled ${title}`);
    const context = await browser.newContext({ viewport: { width: 980, height: 552 } });
    const page = await context.newPage();
    await page.goto(`${base}/${String(slide)}?clicks=${String(clicks)}`);
    await page.waitForTimeout(SETTLE);
    await page.screenshot({ path: join(out, `${name}.png`) });
    await context.close();
    console.log(name);
  }
} finally {
  await browser.close();
  server.close();
}

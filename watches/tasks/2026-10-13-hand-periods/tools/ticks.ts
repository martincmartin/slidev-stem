// Does the hand tick on the Three Hands slide? Two stills of one page,
// INTERVAL ms apart, and the number of pixels that differ in the picture's
// part of the slide (left of the text).
//
//     node tasks/2026-10-13-hand-periods/tools/ticks.ts [DIST] [OUT]
//
// Run from watches/. DIST (default dist/) is a `pnpm build` output; OUT
// (default tasks/2026-10-13-hand-periods/out/) gets ticks-0.png and
// ticks-1.png. The tool serves DIST as stills.ts does.

import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright-chromium";

const dist = resolve(process.argv[2] ?? "dist");
const out = resolve(process.argv[3] ?? "tasks/2026-10-13-hand-periods/out");
const SETTLE = 5000;
const INTERVAL = 1000;
const PICTURE = { x: 0, y: 130, width: 460, height: 420 };

const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname);
  const file = join(dist, path);
  readFile(file)
    .catch(() => readFile(join(dist, "index.html")))
    .then((body) => {
      response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "text/html" });
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
  const page = await browser.newPage({ viewport: { width: 980, height: 552 } });
  let found = false;
  for (let slide = 1; slide <= 25 && !found; slide++) {
    await page.goto(`${base}/${String(slide)}`);
    await page.waitForTimeout(500);
    const title = await page.locator(".slidev-page:visible h1").first().textContent({ timeout: 2000 }).catch(() => null);
    found = title?.trim() === "Three Hands";
  }
  if (!found) throw new Error("no slide titled Three Hands");
  await page.waitForTimeout(SETTLE);
  const shots: Buffer[] = [];
  for (const index of [0, 1]) {
    if (index > 0) await page.waitForTimeout(INTERVAL);
    shots.push(await page.screenshot({ path: join(out, `ticks-${String(index)}.png`), clip: PICTURE }));
  }
  // compare in the page: decode both PNGs and count the pixels that differ
  const differ = await page.evaluate(async (images) => {
    const decode = async (base64: string) => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d")!;
      context.drawImage(bitmap, 0, 0);
      return context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    };
    const [first, second] = await Promise.all(images.map(decode));
    let count = 0;
    for (let index = 0; index < first!.length; index += 4) {
      if (Math.abs(first![index]! - second![index]!) + Math.abs(first![index + 1]! - second![index + 1]!) + Math.abs(first![index + 2]! - second![index + 2]!) > 30) count++;
    }
    return count;
  }, shots.map((shot) => shot.toString("base64")));
  console.log(`${String(differ)} px differ in the picture, ${String(INTERVAL)} ms apart`);
} finally {
  await browser.close();
  server.close();
}

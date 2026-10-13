// The width of each candidate line, in the deck's sentence type: the Gears
// slide's `.gears-sentence` (35 px, 600, line height 1.25).
//
//     node tasks/2026-10-13-hand-periods/tools/text-widths.ts [DIST] [--json]
//
// Run from watches/. DIST (default dist/) is a `pnpm build` output. The tool
// serves it, opens the Gears slide at click 4 in Chromium at 980 x 552 (so
// one CSS px of the page is one px of the slide), copies its rule's element
// for each line, and reads the copy's width and the line height.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright-chromium";

const args = process.argv.slice(2);
const json = args.includes("--json");
const dist = resolve(args.find((arg) => !arg.startsWith("--")) ?? "dist");
const LINES = [
  "Second hand: a tick a second",
  "60 ticks a turn: once a minute",
  "60 ticks: once a minute",
  "Second hand:",
  "a tick a second",
  "60 ticks a turn:",
  "once a minute",
  "Hand",
  "A full turn",
  "Second",
  "Minute",
  "Hour",
  "1 minute",
  "1 hour",
  "12 hours",
  "Second Hand",
  "Minute Hand",
  "Hour Hand",
  "Once a minute",
  "Once an hour",
  "Once in 12 hours",
  "Once every 12 hours",
  "Every minute",
  "Every hour",
  "Every 12 hours",
  "Twice a day",
  "One full turn",
  "One turn a minute",
  "Turns once a minute",
  "The second hand!",
  "The Second Hand!",
];

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

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 980, height: 552 } });
  let found = false;
  for (let slide = 1; slide <= 20 && !found; slide++) {
    await page.goto(`${base}/${String(slide)}?clicks=4`);
    await page.waitForTimeout(500);
    const title = await page.locator(".slidev-page:visible h1").first().textContent({ timeout: 2000 }).catch(() => null);
    found = title?.trim() === "Gears";
  }
  if (!found) throw new Error("no slide titled Gears");
  await page.waitForTimeout(2000);
  const widths = await page.evaluate((lines) => {
    const rule = document.querySelector<HTMLElement>(".slidev-page:not([style*='display: none']) .gears-rule");
    if (rule === null) throw new Error("no .gears-rule");
    const scale = rule.getBoundingClientRect().height / rule.offsetHeight;
    return lines.map((line) => {
      const copy = rule.cloneNode(false) as HTMLElement;
      copy.textContent = line;
      copy.style.visibility = "hidden";
      rule.parentElement!.append(copy);
      const width = copy.getBoundingClientRect().width / scale;
      const lineHeight = Number.parseFloat(getComputedStyle(copy).lineHeight);
      copy.remove();
      return { line, width, lineHeight };
    });
  }, LINES);
  if (json) console.log(JSON.stringify(widths, null, 2));
  else for (const { line, width, lineHeight } of widths) console.log(`${width.toFixed(0).padStart(4)} px  ${line}   (line ${lineHeight.toFixed(2)} px)`);
} finally {
  await browser.close();
  server.close();
}

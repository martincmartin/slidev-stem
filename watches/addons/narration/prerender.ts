// The article as a static page: run after `slidev build`.
//
//     node addons/narration/prerender.ts [DIST]
//
// DIST (default dist/) is the built deck. The script serves it on a free port,
// opens /article in Chromium, and takes a still of each figure, as it shows
// when it has settled. It writes DIST/article/index.html: the deck's
// index.html, with the article's text in it as HTML and each figure a still
// (DIST/article/figures/<id>.png). So the page reads with no JavaScript, a
// search engine sees its text, and it can be kept as files. With
// JavaScript, the deck's own code starts at /article, and the live article
// takes the static one's place.
//
// The page is at /article/ on any static host, with no rewrite rules. Build
// the deck with Slidev's `--base` if it is not at the host's root.
// docs/article.md has the rest.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { chromium } from "playwright-chromium";

const dist = resolve(process.argv[2] ?? "dist");
const out = join(dist, "article");
/** ms: after a figure scrolls into view, before its still: it draws, and a
 *  step's moves end. */
const SETTLE_MS = 2500;
/** The stills' pixels per CSS px: sharp on a high-density screen. */
const STILL_SCALE = 2;

const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const index = await readFile(join(dist, "index.html"), "utf8");
/** The deck's base URL (Slidev's --base): where its entry script is. */
const base = /src="([^"]*)assets\/index-[^"]*\.js"/.exec(index)?.[1];
if (base === undefined) throw new Error("no entry script in index.html");
const server = createServer((request, response) => {
  const path = decodeURIComponent(
    new URL(request.url ?? "/", "http://localhost").pathname,
  );
  const file = join(dist, path.startsWith(base) ? path.slice(base.length) : "");
  const inside = file.startsWith(dist + sep);
  // the deck's routes are not files: they get its index.html
  (inside ? readFile(file) : Promise.reject(new Error("outside")))
    .then((body) => {
      response.writeHead(200, {
        "content-type": TYPES[extname(file)] ?? "application/octet-stream",
      });
      response.end(body);
    })
    .catch(() => {
      response.writeHead(200, { "content-type": "text/html" });
      response.end(index);
    });
});
await new Promise<void>((done) => {
  server.listen(0, "127.0.0.1", done);
});
const address = server.address();
if (address === null || typeof address === "string") {
  throw new Error("the server has no port");
}

await mkdir(join(out, "figures"), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: STILL_SCALE,
    reducedMotion: "no-preference",
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${String(address.port)}${base}article`);
  await page.locator("figure.article-figure").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  const figures = page.locator("figure.article-figure");
  const count = await figures.count();
  // The page's "Pause them all": a paused figure is not drawn and keeps its
  // picture. Without a GPU each frame of a figure takes up to 0.4 s, and a
  // scroll or a screenshot waits for frames, so both are done paused. Sent
  // as an event: a click would wait for frames too. It reads the button's
  // state, so a page that starts paused (a reader who asks for reduced
  // motion) works too. See tasks/2026-10-22-article-prerender-speed/.
  const pauseAll = page.locator(".article-motion button");
  const setPaused = async (paused: boolean) => {
    const pressed = String(paused);
    if ((await pauseAll.getAttribute("aria-pressed")) === pressed) return;
    await pauseAll.dispatchEvent("click");
    await page
      .locator(`.article-motion button[aria-pressed="${pressed}"]`)
      .waitFor({ state: "attached" });
  };
  await setPaused(true);
  for (let index = 0; index < count; index++) {
    const figure = figures.nth(index);
    const id = await figure.getAttribute("id");
    if (!id) throw new Error(`figure ${String(index)} has no id`);
    await figure.scrollIntoViewIfNeeded();
    await setPaused(false);
    await page.waitForTimeout(SETTLE_MS);
    await setPaused(true);
    await figure
      .locator(".article-figure-frame")
      .screenshot({ path: join(out, "figures", `${id}.png`) });
  }
  // the page as it shows, with a still in place of each figure, and no
  // controls: without the deck's code they do nothing
  const { article, styles, title } = await page.evaluate(() => {
    const main = document.querySelector("main.article-page");
    if (!main) throw new Error("no article");
    const copy = main.cloneNode(true) as HTMLElement;
    for (const figure of copy.querySelectorAll("figure.article-figure")) {
      const frame = figure.querySelector<HTMLElement>(".article-figure-frame");
      if (!frame) continue;
      const still = document.createElement("img");
      still.src = `figures/${figure.id}.png`;
      still.alt = frame.getAttribute("aria-label") ?? "";
      // the copy is not in the page, so its size is its style's
      still.width = Math.round(parseFloat(frame.style.width));
      still.height = Math.round(parseFloat(frame.style.height));
      still.className = "article-figure-still";
      frame.replaceChildren(still);
      frame.removeAttribute("role");
      frame.removeAttribute("aria-label");
      figure.querySelector(".article-figure-controls")?.remove();
    }
    for (const button of copy.querySelectorAll(".article-motion button")) {
      button.remove();
    }
    // the styles that the article's route loaded, as paths: a link that the
    // deck's code adds holds this server's address
    const styles = [
      ...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    ].map((link) => new URL(link.href).pathname);
    return { article: copy.outerHTML, styles, title: document.title };
  });
  if (errors.length > 0)
    throw new Error(`the article failed: ${errors.join("; ")}`);
  const head = [...new Set(styles)]
    .filter((path) => !index.includes(`href="${path}"`))
    .map((path) => `<link rel="stylesheet" href="${path}">`)
    .join("\n");
  const html = index
    .replace("<html", '<html class="article-mode"')
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace("</head>", `${head}\n</head>`)
    .replace('<div id="app"></div>', `<div id="app">${article}</div>`);
  if (!html.includes(article)) {
    throw new Error('the deck\'s index.html has no <div id="app"></div>');
  }
  await writeFile(join(out, "index.html"), html);
  console.log(`${String(count)} figures; ${join(out, "index.html")}`);
} finally {
  await browser.close();
  server.close();
}

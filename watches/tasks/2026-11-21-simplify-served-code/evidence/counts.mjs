import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
const { chromium } = await import("/Users/martin/Develop/slidev/stem/work1/watches/node_modules/playwright-chromium/index.mjs");
const DIST = process.argv[2];
const PART = process.argv[3] ?? "1";
const BASE = "/";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".json": "application/json", ".map": "application/json", ".ico": "image/x-icon", ".txt": "text/plain" };
const requests = [];
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let path = decodeURIComponent(url.pathname);
  requests.push(path);
  if (!path.startsWith(BASE)) { res.writeHead(404); res.end(); return; }
  let file = join(DIST, path.slice(BASE.length));
  try { if ((await stat(file)).isDirectory()) file = join(file, "index.html"); } catch { file = join(DIST, "index.html"); }
  try { const body = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }); res.end(body); }
  catch { const body = await readFile(join(DIST, "index.html")); res.writeHead(200, { "content-type": "text/html" }); res.end(body); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ args: (process.env.GLARGS ?? "").split(" ").filter(Boolean) });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    const counts = new Map();
    window.__counts = counts;
    const bump = (k) => counts.set(k, (counts.get(k) ?? 0) + 1);
    const wrap = (proto, name, label) => {
      const orig = proto[name];
      proto[name] = function (...args) { bump(label ?? name); return orig.apply(this, args); };
    };
    const gl0 = WebGL2RenderingContext.prototype.texStorage2D; window.__sizes = []; WebGL2RenderingContext.prototype.texStorage2D = function (...a) { window.__sizes.push(a[3] + "x" + a[4]); return gl0.apply(this, a); }; const gb = WebGL2RenderingContext.prototype.blitFramebuffer; window.__blits = []; WebGL2RenderingContext.prototype.blitFramebuffer = function (...a) { window.__blits.push(a[2] + "x" + a[3] + "@" + a[4] + "," + a[5]); return gb.apply(this, a); };
    for (const n of ["createTexture", "texStorage2D", "createFramebuffer", "deleteTexture", "bufferData", "bufferSubData", "drawArrays", "drawArraysInstanced", "uniformMatrix4fv", "blitFramebuffer"]) wrap(WebGL2RenderingContext.prototype, n);
    wrap(Element.prototype, "getBoundingClientRect", "gBCR"); wrap(Element.prototype, "setAttribute", "setAttr"); wrap(Element.prototype, "querySelectorAll", "qSA"); wrap(CSSStyleDeclaration.prototype, "setProperty", "setProp");
    wrap(window, "getComputedStyle", "gCS");
    wrap(CanvasRenderingContext2D.prototype, "drawImage", "drawImage");
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((t) => { bump("frames"); cb(t); });
  });
  await page.goto(`http://127.0.0.1:${port}${BASE}article/${PART}/`, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  const positions = JSON.parse(process.argv[4] ?? "[0, 1500, 3000, 6000]");
  for (const y of positions) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(1500);
    await page.evaluate(() => { window.__counts.clear(); window.__sizes = []; window.__blits = []; });
    const t0 = Date.now();
    await page.waitForTimeout(2000);
    const c = await page.evaluate(() => Object.fromEntries(window.__counts));
    const vis = await page.evaluate(() => [...document.querySelectorAll("canvas")].filter((c) => { const r = c.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; }).map((c) => `${c.width}x${c.height}`));
    const secs = (Date.now() - t0) / 1000; const sz = await page.evaluate(() => { const s = window.__sizes.slice(-12).join(" "); const b = window.__blits.slice(-8).join(" "); window.__sizes = []; window.__blits = []; return s + " / blits " + b; }); console.log(sz);
    const rate = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, +(v / secs).toFixed(1)]));
    console.log(JSON.stringify({ y, visibleCanvases: vis, perSecond: rate }));
  }
  console.log("errors:", errors);
} finally {
  await browser.close();
  server.close();
}

// The pictures of round 9 (PLAN.md, section 19): each layout of the Longitude
// From Time slide, at its last click, with the slide then number 17. In watches/,
// with the deck's dev server running, it writes SOURCE with each layout's numbers
// to TARGET, takes a picture, and writes SOURCE back to TARGET at the end:
//   node tasks/2026-10-30-part-2-visual-language/tools/layouts.mjs \
//     http://localhost:3030 OUT_DIR \
//     tasks/2026-10-30-part-2-visual-language/evidence/round-9/noon-before.ts.txt \
//     globe/noon.ts
// SOURCE is noon.ts as it was: the talk's noon.ts holds the chosen layout, so give
// back the current file by hand afterward.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
const require = createRequire(`${process.cwd()}/package.json`);
const { chromium } = require("playwright-chromium");
const [base, out, source, target] = process.argv.slice(2);
const original = readFileSync(source, "utf8");
const OPTIONS = {
  now:    { name: "Now: globe 200 at 294, clock upper left", globe: [294, 286, 200], clock: [92, 92], left: 610 },
  shift:  { name: "A. Globe moves right: same size", globe: [334, 286, 200], clock: [92, 92], left: 575 },
  both:   { name: "B. Globe right and smaller (180), with subtitle", globe: [350, 304, 180], clock: [92, 92], left: 570, subtitle: true },
  bothtwo:{ name: "C. As B, last line on two lines, globe further right", globe: [372, 304, 180], clock: [92, 92], left: 610, subtitle: true, two: true },
  right:  { name: "D. Clock above the text, globe stays left (190), with subtitle", globe: [260, 300, 185], clock: [890, 92], left: 530, subtitle: true, top: 156 },
  small:  { name: "E. Globe smaller only (170), with subtitle", globe: [294, 304, 170], clock: [92, 92], left: 560, subtitle: true },
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 980, height: 552 }, deviceScaleFactor: 1.5 });
try {
  for (const [key, option] of Object.entries(OPTIONS)) {
    const text = original
      .replace(/at: \[294, 286\],\n  radius: 200,/, `at: [${option.globe[0]}, ${option.globe[1]}],\n  radius: ${option.globe[2]},`)
      .replace(/at: \[92, 92\],/, `at: [${option.clock[0]}, ${option.clock[1]}],`);
    writeFileSync(target, text);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await page.goto(`${base}/17?clicks=3`);
    await page.waitForSelector(".slidev-page-17 .noon-sentence", { state: "attached", timeout: 30000 });
    await page.waitForTimeout(5000);
    const result = await page.evaluate((option) => {
      const layout = document.querySelector(".slidev-page-17 .slidev-layout");
      const sentence = layout.querySelector(".noon-sentence");
      sentence.style.left = `${option.left}px`;
      if (option.subtitle) { const p = document.createElement("p"); p.textContent = "Noon comes later"; layout.querySelector("h1").after(p); }
      if (option.top) sentence.style.top = `${option.top}px`;
      if (option.two) sentence.lastElementChild.innerHTML = "Hours × 15<br>= Longitude";
      const box = layout.getBoundingClientRect(); const scale = box.width / 980;
      const widths = {};
      for (const words of ["Hours × 15 = Longitude", "Hours × 15", "= Longitude", "Hours behind × 15", "Hours difference × 15", "Hours difference"]) {
        const s = document.createElement("span"); s.textContent = words; s.style.position = "absolute"; s.style.visibility = "hidden"; sentence.append(s);
        widths[words] = Math.round(s.getBoundingClientRect().width / scale); s.remove();
      }
      const range = document.createRange(); let right = 0, top = 1e9, bottom = 0;
      for (const el of sentence.children) { range.selectNodeContents(el); const r = range.getBoundingClientRect(); right = Math.max(right, (r.right - box.left) / scale); top = Math.min(top, (r.top - box.top) / scale); bottom = Math.max(bottom, (r.bottom - box.top) / scale); }
      return { widths, textRight: Math.round(right), textTop: Math.round(top), textBottom: Math.round(bottom) };
    }, option);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/option-${key}.png`, timeout: 120000 });
    const [x, y, r] = option.globe; const [cx, cy] = option.clock;
    const clockGap = Math.round(Math.hypot(x - cx, y - cy) - r - 64);
    console.log(key, JSON.stringify({ clockGap, globeTop: y - r, globeBottom: y + r, globeRight: x + r, textGap: option.left - (x + r), labelSpacing: Math.round(r * Math.cos(20 * Math.PI / 180) * Math.sin(15 * Math.PI / 180)), ...result, widths: key === "now" ? result.widths : undefined }));
  }
  const cells = Object.entries(OPTIONS).map(([key, option]) => `<figure><img src="data:image/png;base64,${readFileSync(`${out}/option-${key}.png`).toString("base64")}"><figcaption>${option.name}</figcaption></figure>`);
  const sheet = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  await sheet.setContent(`<style>body{margin:12px;font:20px system-ui;background:#fff}.grid{display:grid;grid-template-columns:repeat(2,730px);gap:14px}figure{margin:0}img{width:730px;display:block;border:1px solid #999}</style><div class="grid">${cells.join("")}</div>`);
  await sheet.screenshot({ path: `${out}/layout-options.png`, fullPage: true });
} finally {
  writeFileSync(target, original);
  await browser.close();
}

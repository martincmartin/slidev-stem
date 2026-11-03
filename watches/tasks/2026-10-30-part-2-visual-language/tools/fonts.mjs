// The pictures and measurements of round 10 (PLAN.md, section 20): Newton's
// words in each script font, at the largest size that fits the slide's box, with
// and without a thin stroke of ink that thickens the hairlines. It downloads each
// font's Latin 400 file from npm, at the version given. In watches/:
//   node tasks/2026-10-30-part-2-visual-language/tools/fonts.mjs OUT_DIR
// It writes OUT_DIR/fonts.json and OUT_DIR/fonts.png.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
const require = createRequire(`${process.cwd()}/package.json`);
const { chromium } = require("playwright-chromium");

const VERSION = "5.3.0";
const FONTS = [
  "meddon", "petit-formal-script", "pinyon-script", "mrs-saint-delafield",
  "herr-von-muellerhoff", "mr-de-haviland", "monsieur-la-doulaise", "league-script",
  "alex-brush", "allura", "rouge-script", "great-vibes", "italianno", "tangerine",
  "parisienne", "homemade-apple", "la-belle-aurore", "dawning-of-a-new-day",
];
const LINES = [
  "by reason of the motion of a Ship,",
  "the variation of heat & cold, wet and dry,",
  "and the difference of Gravity in different Latitudes,",
  "such a Watch hath not yet been made.",
];
/** Slide px: the room under the title and the subtitle, on a 980 x 552 slide. */
const BOX = { width: 880, height: 380 };
const LINE_HEIGHT = 1.45;
/** Slide px of stroke, in the ink, centred on each letter's edge. */
const STROKES = [0, 0.5, 0.7, 0.8];
/** Canvas px to a slide px, for the measures of the strokes. */
const SCALE = 4;

const [out] = process.argv.slice(2);
if (out === undefined) throw new Error("usage: fonts.mjs OUT_DIR");
const work = mkdtempSync(join(tmpdir(), "script-fonts-"));
const sources = {};
for (const font of FONTS) {
  const url = `https://registry.npmjs.org/@fontsource/${font}/-/${font}-${VERSION}.tgz`;
  const archive = join(work, `${font}.tgz`);
  execFileSync("curl", ["-sSfL", "-o", archive, url]);
  const directory = join(work, font);
  execFileSync("mkdir", ["-p", directory]);
  execFileSync("tar", ["-xzf", archive, "-C", directory, "--strip-components=1", "--wildcards", "*latin-400-normal.woff2"]);
  const file = readdirSync(join(directory, "files")).find((name) => /-latin-400-normal\.woff2$/.test(name));
  if (file === undefined) throw new Error(`no Latin 400 file in ${font}`);
  sources[font] = readFileSync(join(directory, "files", file)).toString("base64");
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 980, height: 552 } });
const rows = await page.evaluate(
  async ({ sources, LINES, BOX, LINE_HEIGHT, STROKES, SCALE }) => {
    const measure = (name, size, stroke) => {
      // the thinnest and the typical stroke: twice the distance to the paper on
      // each ridge of the ink, by a chamfer distance
      const canvas = document.createElement("canvas");
      const [width, height] = [Math.ceil(BOX.width * SCALE * 1.1), Math.ceil(size * 2.2 * SCALE)];
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.font = `${size * SCALE}px "${name}"`;
      context.fillStyle = "#000";
      context.strokeStyle = "#000";
      context.lineJoin = "round";
      context.lineWidth = stroke * SCALE;
      const y = size * 1.4 * SCALE;
      const text = LINES[3];
      context.fillText(text, 10, y);
      if (stroke > 0) context.strokeText(text, 10, y);
      const { data } = context.getImageData(0, 0, width, height);
      const distance = new Float32Array(width * height);
      const FAR = 1e6;
      for (let index = 0; index < distance.length; index++)
        distance[index] = (data[4 * index + 3] ?? 0) > 127 ? FAR : 0;
      const relax = (index, other, cost) => {
        const candidate = distance[other] + cost;
        if (candidate < distance[index]) distance[index] = candidate;
      };
      for (let row = 1; row < height - 1; row++)
        for (let column = 1; column < width - 1; column++) {
          const index = row * width + column;
          relax(index, index - 1, 1);
          relax(index, index - width, 1);
          relax(index, index - width - 1, 1.414);
          relax(index, index - width + 1, 1.414);
        }
      for (let row = height - 2; row > 0; row--)
        for (let column = width - 2; column > 0; column--) {
          const index = row * width + column;
          relax(index, index + 1, 1);
          relax(index, index + width, 1);
          relax(index, index + width + 1, 1.414);
          relax(index, index + width - 1, 1.414);
        }
      const ridges = [];
      for (let row = 1; row < height - 1; row++)
        for (let column = 1; column < width - 1; column++) {
          const index = row * width + column;
          const here = distance[index];
          if (here <= 0) continue;
          if (
            here >= distance[index - 1] && here >= distance[index + 1] &&
            here >= distance[index - width] && here >= distance[index + width]
          )
            ridges.push((2 * here) / SCALE);
        }
      ridges.sort((a, b) => a - b);
      const at = (share) => ridges[Math.floor(share * (ridges.length - 1))] ?? 0;
      return { thin: at(0.1), middle: at(0.5) };
    };
    const rows = [];
    for (const [font, source] of Object.entries(sources)) {
      const name = `${font} test`;
      const face = new FontFace(name, `url(data:font/woff2;base64,${source})`);
      await face.load();
      document.fonts.add(face);
      const context = document.createElement("canvas").getContext("2d");
      context.font = `100px "${name}"`;
      const longest = Math.max(...LINES.map((line) => context.measureText(line).width)) / 100;
      const x = context.measureText("x").actualBoundingBoxAscent / 100;
      const size = Math.floor(Math.min(BOX.width / longest, BOX.height / (LINES.length * LINE_HEIGHT)));
      rows.push({
        font,
        size,
        xHeight: +(x * size).toFixed(1),
        strokes: STROKES.map((stroke) => {
          const { thin, middle } = measure(name, size, stroke);
          return { stroke, thin: +thin.toFixed(2), middle: +middle.toFixed(2) };
        }),
      });
    }
    return rows;
  },
  { sources, LINES, BOX, LINE_HEIGHT, STROKES, SCALE },
);
writeFileSync(join(out, "fonts.json"), `${JSON.stringify(rows, null, 1)}\n`);

const faces = Object.entries(sources)
  .map(([font, source]) => `@font-face{font-family:"${font}";src:url(data:font/woff2;base64,${source})}`)
  .join("");
const escapeHtml = (text) => text.replaceAll("&", "&amp;");
const cell = ({ font, size, xHeight }, stroke) =>
  `<figure><figcaption>${font}, ${size} px, x-height ${xHeight} px, stroke ${stroke}</figcaption><div class="slide"><div class="words" style="font-family:'${font}';font-size:${size}px;-webkit-text-stroke:${stroke}px #2A2520">${LINES.map(escapeHtml).join("<br>")}</div></div></figure>`;
const sheet = await browser.newPage({ viewport: { width: 1520, height: 900 } });
await sheet.setContent(
  `<style>${faces}body{margin:10px;background:#ddd;font:15px system-ui}.grid{display:grid;grid-template-columns:repeat(3,490px);gap:10px}figure{margin:0}.slide{width:490px;height:190px;overflow:hidden;background:#FAF7F0;position:relative}.words{position:absolute;left:0;top:0;width:${BOX.width}px;height:${BOX.height}px;transform:scale(.5);transform-origin:0 0;color:#2A2520;line-height:${LINE_HEIGHT};white-space:nowrap;text-align:center;display:flex;align-items:center;justify-content:center}</style><div class="grid">${rows.map((row) => cell(row, 0)).join("")}</div>`,
);
await sheet.evaluate(() => document.fonts.ready);
await sheet.screenshot({ path: join(out, "fonts.png"), fullPage: true });
await browser.close();

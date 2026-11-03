// The pictures and measures of round 11 (PLAN.md, section 21): each layout of
// mockup/seconds.html at each click. In Chromium. In watches/, with the mockup's
// server running (mockup/vite.config.ts):
//   node tasks/2026-10-30-part-2-visual-language/tools/seconds.ts http://localhost:5200/ OUT_DIR
// It writes OUT_DIR/frames/<option>-<click>.png, OUT_DIR/clicks-<option>.png (every
// click of a layout), OUT_DIR/last-clicks.png (each layout's last click), and
// OUT_DIR/measurements.json: at each click, the words that show, the smallest type,
// and how far the text comes to each edge of the slide.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright-chromium";

const OPTIONS = ["a", "b", "c", "d", "e", "f"] as const;
const CLICKS = [0, 1, 2, 3] as const;

const [base, out] = process.argv.slice(2);
if (base === undefined || out === undefined)
  throw new Error("usage: seconds.ts URL OUT_DIR");
await mkdir(join(out, "frames"), { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 980, height: 552 },
    deviceScaleFactor: 2,
  });
  const measurements: unknown[] = [];
  const lasts: string[] = [];
  for (const option of OPTIONS) {
    const cells: string[] = [];
    for (const click of CLICKS) {
      await page.goto(
        `${base}seconds.html?option=${option}&click=${String(click)}`,
      );
      await page.waitForSelector("body[data-ready]");
      const path = join(out, "frames", `${option}-${String(click)}.png`);
      await page.locator("#slide").screenshot({ path });
      const seen = await page.evaluate(() => {
        const slide = document.querySelector("#slide");
        const section = document.querySelector<HTMLElement>("section.shown");
        if (slide === null || section === null) throw new Error("no section");
        const box = slide.getBoundingClientRect();
        const textNodes = (): Text[] => {
          const found: Text[] = [];
          const nodes = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
          while (nodes.nextNode())
            if (
              nodes.currentNode.parentElement !== null &&
              getComputedStyle(nodes.currentNode.parentElement).visibility !==
                "hidden"
            )
              found.push(nodes.currentNode as Text);
          return found;
        };
        // The px of slide between the first text that holds each string: how far
        // the eye goes from a number to what it means. Null if one does not show.
        const gap = (from: string, to: string): number | null => {
          const place = (words: string) => {
            const node = textNodes().find((each) =>
              each.textContent.includes(words),
            );
            if (node === undefined) return null;
            const each = document.createRange();
            const start = node.textContent.indexOf(words);
            each.setStart(node, start);
            each.setEnd(node, start + words.length);
            return each.getBoundingClientRect();
          };
          const [first, second] = [place(from), place(to)];
          if (first === null || second === null) return null;
          const across = Math.max(
            0,
            first.left - second.right,
            second.left - first.right,
          );
          const down = Math.max(
            0,
            first.top - second.bottom,
            second.top - first.bottom,
          );
          return Math.round(Math.hypot(across, down));
        };
        const largestNumber = (): number =>
          Math.max(
            ...textNodes()
              .filter((node) => /±\d/.test(node.textContent))
              .map((node) =>
                node.parentElement === null
                  ? 0
                  : Number.parseFloat(
                      getComputedStyle(node.parentElement).fontSize,
                    ),
              ),
            0,
          );
        const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        let words = 0;
        let smallest = Infinity;
        let [left, right, top, bottom] = [Infinity, 0, Infinity, 0];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const parent = node.parentElement;
          const text = node.textContent?.trim() ?? "";
          if (parent === null || text === "") continue;
          if (getComputedStyle(parent).visibility === "hidden") continue;
          words += text.split(/\s+/).length;
          smallest = Math.min(
            smallest,
            Number.parseFloat(getComputedStyle(parent).fontSize),
          );
          range.selectNodeContents(node);
          const rect = range.getBoundingClientRect();
          left = Math.min(left, rect.left - box.left);
          right = Math.max(right, rect.right - box.left);
          top = Math.min(top, rect.top - box.top);
          bottom = Math.max(bottom, rect.bottom - box.top);
        }
        return {
          name: section.dataset["name"] ?? "",
          words,
          largestNumber: largestNumber(),
          travel: {
            "±3 to £20,000": gap("±3", "£20,000"),
            "±9 to good watch": gap("±9", "ood watch today"),
          },
          smallestType: smallest,
          left: Math.round(left),
          right: Math.round(right),
          top: Math.round(top),
          bottom: Math.round(bottom),
        };
      });
      measurements.push({ option, click, ...seen });
      const data = (await readFile(path)).toString("base64");
      const cell = `<figure><img src="data:image/png;base64,${data}"><figcaption>${seen.name}, click ${String(click)}</figcaption></figure>`;
      cells.push(cell);
      if (click === CLICKS[CLICKS.length - 1]) lasts.push(cell);
    }
    const sheet = await browser.newPage({
      viewport: { width: 1500, height: 900 },
    });
    await sheet.setContent(
      `<style>body{margin:12px;font:20px system-ui;background:#fff}.grid{display:grid;grid-template-columns:repeat(2,730px);gap:14px}figure{margin:0}img{width:730px;display:block;border:1px solid #999}</style><div class="grid">${cells.join("")}</div>`,
    );
    await sheet.screenshot({
      path: join(out, `clicks-${option}.png`),
      fullPage: true,
    });
    await sheet.close();
  }
  const sheet = await browser.newPage({
    viewport: { width: 1500, height: 900 },
  });
  await sheet.setContent(
    `<style>body{margin:12px;font:20px system-ui;background:#fff}.grid{display:grid;grid-template-columns:repeat(2,730px);gap:14px}figure{margin:0}img{width:730px;display:block;border:1px solid #999}</style><div class="grid">${lasts.join("")}</div>`,
  );
  await sheet.screenshot({ path: join(out, "last-clicks.png"), fullPage: true });
  await sheet.close();
  await writeFile(
    join(out, "measurements.json"),
    `${JSON.stringify(measurements, null, 2)}\n`,
  );
} finally {
  await browser.close();
}

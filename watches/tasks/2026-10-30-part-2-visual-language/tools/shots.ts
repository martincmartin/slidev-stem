// Pictures and measurements of the mockup: each style at each step, settled,
// in Chromium. In watches/, with the mockup's server running
// (mockup/vite.config.ts):
//   node tasks/2026-10-30-part-2-visual-language/tools/shots.ts http://localhost:5200/ OUT_DIR \
//     [--sea wash|paper] [--wind NAME] [--label NAME] [--start NAME] [--style NAME]...
// With --sea paper, the sea is not filled; --wind, --label and --start are
// the mockup's choices (mockup/choices.ts); each --style shoots one style
// (default: all). It writes OUT_DIR/frames/<style>-<step>.png, frames of the
// labels in motion (frames/labels-motion-<n>.png: MOTION),
// OUT_DIR/measurements.json, the times between the frames of each of the
// labels' camera flights (OUT_DIR/flights.json), and two sheets: every step
// of every style, with the motion (sheet.png), and each style's last step
// (last-steps.png).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright-chromium";
import type { Page } from "playwright-chromium";
import { CHOICES } from "../mockup/choices.ts";
import { STYLES as STORY_STYLES } from "../mockup/story.ts";

const STYLES = STORY_STYLES.map((style) => style.name);
/** CSS px: the slide, and the mockup's bar under it. */
const VIEWPORT = { width: 980, height: 552 + 36 };
const SCALE = 1;
/** A pixel that changes by more than this (of 255, in any channel) when the
 *  text shows is covered by the text. */
const COVERED = 24;

/** The labels in motion, from the step before, settled: a step, and when
 *  after it starts: ms, or a share of its camera's flight. The camera flies
 *  to Cape Noir, and the story map comes in; the ship sails into sight of
 *  the land; the camera flies to Juan Fernández; the ship sails north,
 *  east, and west. */
type Moment = number | { readonly flight: number };
const MOTION: readonly (readonly [number, Moment])[] = [
  [1, { flight: 0.5 }],
  [1, { flight: 0.9 }],
  [2, 900],
  [4, { flight: 0.15 }],
  [4, { flight: 0.5 }],
  [4, { flight: 0.9 }],
  [5, 1000],
  [6, 700],
  [7, 3200],
];

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

interface Coverage {
  /** device px of the sea that the text covers, and of all the sea */
  readonly sea: number;
  readonly seaCovered: number;
  /** device px anywhere that the text covers */
  readonly covered: number;
}

/** Compares two pictures of the slide, with and without its text, inside
 *  the page: the sea is where the story map's land path is not. Null on the
 *  globe, with no story map. */
async function coverage(
  page: Page,
  withText: Buffer,
  withoutText: Buffer,
): Promise<Coverage | null> {
  const land = await page.evaluate(() => window.mock.land());
  if (land === null) return null;
  return page.evaluate(
    async ({ one, other, scale, threshold, land }) => {
      const load = async (base64: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        return image;
      };
      const [first, second] = await Promise.all([load(one), load(other)]);
      const { width, height } = first;
      const pixels = (
        draw: (context: OffscreenCanvasRenderingContext2D) => void,
      ) => {
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext("2d");
        if (context === null) throw new Error("no 2D context");
        draw(context);
        return context.getImageData(0, 0, width, height).data;
      };
      const a = pixels((context) => context.drawImage(first, 0, 0));
      const b = pixels((context) => context.drawImage(second, 0, 0));
      const mask = pixels((context) => {
        context.fillStyle = "white";
        context.fillRect(0, 0, width, height);
        context.scale(scale, scale);
        context.fillStyle = "black";
        context.fill(new Path2D(land));
      });
      let sea = 0;
      let seaCovered = 0;
      let covered = 0;
      for (let index = 0; index < a.length; index += 4) {
        const changed = [0, 1, 2].some(
          (channel) =>
            Math.abs((a[index + channel] ?? 0) - (b[index + channel] ?? 0)) >
            threshold,
        );
        const isSea = (mask[index] ?? 0) > 127;
        if (isSea) sea += 1;
        if (changed) covered += 1;
        if (changed && isSea) seaCovered += 1;
      }
      return { sea, seaCovered, covered };
    },
    {
      one: withText.toString("base64"),
      other: withoutText.toString("base64"),
      scale: SCALE,
      threshold: COVERED,
      land,
    },
  );
}

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      sea: { type: "string", default: "wash" },
      wind: { type: "string", default: CHOICES.wind[0] },
      label: { type: "string", default: CHOICES.label[0] },
      start: { type: "string", default: CHOICES.start[0] },
      style: { type: "string", multiple: true },
    },
  });
  const [url, out] = positionals;
  const among = (names: readonly string[], name: string) =>
    names.includes(name);
  const styles = STYLES.filter(
    (style) => values.style === undefined || values.style.includes(style),
  );
  if (
    positionals.length !== 2 ||
    url === undefined ||
    out === undefined ||
    !["wash", "paper"].includes(values.sea) ||
    !among(CHOICES.wind, values.wind) ||
    !among(CHOICES.label, values.label) ||
    !among(CHOICES.start, values.start) ||
    styles.length !== (values.style?.length ?? STYLES.length)
  ) {
    const names = (choice: readonly string[]) => choice.join("|");
    console.error(
      `usage: node tools/shots.ts URL OUT_DIR [--sea wash|paper] [--wind ${names(CHOICES.wind)}] [--label ${names(CHOICES.label)}] [--start ${names(CHOICES.start)}] [--style ${names(STYLES)}]...`,
    );
    process.exitCode = 2;
    return;
  }
  const query = new URLSearchParams({
    sea: values.sea,
    wind: values.wind,
    label: values.label,
    start: values.start,
  }).toString();
  await mkdir(join(out, "frames"), { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: VIEWPORT,
      deviceScaleFactor: SCALE,
    });
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));
    const check = () => {
      const [error] = errors;
      if (error !== undefined)
        throw new Error("the mockup failed", { cause: error });
    };
    const open = async (address: string) => {
      await page.goto(address);
      await Promise.race([
        // The page sets window.mock only after it has read its maps.
        page.waitForFunction(() => "mock" in window && window.mock.ready),
        page.waitForEvent("pageerror").then((error) => {
          throw new Error(`the mockup failed: ${address}`, { cause: error });
        }),
      ]);
    };
    const results: unknown[] = [];
    const frames: Record<string, string[]> = {};
    for (const style of styles) {
      await open(`${url}?style=${style}&step=0&settle=1&${query}`);
      const steps = await page.evaluate(() => window.mock.steps);
      frames[style] = [];
      for (let step = 0; step < steps; step += 1) {
        await page.evaluate((target) => {
          window.mock.go(target);
        }, step);
        await wait(150);
        const slide = page.locator("#slide");
        const withText = await slide.screenshot();
        await page.evaluate(() =>
          document.querySelector("#slide")?.classList.add("no-text"),
        );
        await wait(50);
        const withoutText = await slide.screenshot();
        await page.evaluate(() =>
          document.querySelector("#slide")?.classList.remove("no-text"),
        );
        const file = join(out, "frames", `${style}-${String(step)}.png`);
        await writeFile(file, withText);
        frames[style].push(file);
        check();
        const measured = await page.evaluate(() => window.mock.measure());
        results.push({
          ...measured,
          coverage: await coverage(page, withText, withoutText),
        });
      }
    }
    await writeFile(
      join(out, "measurements.json"),
      `${JSON.stringify(results, null, 1)}\n`,
    );

    // The labels in motion, as the audience sees them between steps.
    const motion: string[] = [];
    if (styles.includes("labels")) {
      await open(`${url}?style=labels&step=0&${query}`);
      for (const [index, [step, when]] of MOTION.entries()) {
        await page.evaluate((target) => {
          window.mock.go(target - 1);
        }, step);
        await wait(150);
        const timing = await page.evaluate(
          (target) => window.mock.go(target, true),
          step,
        );
        const flight = timing.flightEnd - timing.flightStart;
        await wait(
          typeof when === "number"
            ? when
            : (timing.flightStart + when.flight * flight) * 1000,
        );
        const file = join(out, "frames", `labels-motion-${String(index)}.png`);
        await page.locator("#slide").screenshot({ path: file });
        check();
        motion.push(file);
      }
    }

    // The camera's flights, with no pictures taken while they fly.
    if (styles.includes("labels")) {
      const flights: unknown[] = [];
      for (const step of new Set(
        MOTION.flatMap(([at, when]) => (typeof when === "number" ? [] : [at])),
      )) {
        await page.evaluate((target) => {
          window.mock.go(target - 1);
        }, step);
        await wait(300);
        const timing = await page.evaluate(
          (target) => window.mock.go(target, true),
          step,
        );
        await wait(timing.flightEnd * 1000 + 300);
        const gaps = (await page.evaluate(() => window.mock.frames())).sort(
          (a, b) => a - b,
        );
        const at = (share: number) =>
          gaps[Math.min(gaps.length - 1, Math.floor(share * gaps.length))] ?? 0;
        flights.push({
          step,
          seconds: timing.flightEnd - timing.flightStart,
          frames: gaps.length,
          msBetweenFrames: { median: at(0.5), p95: at(0.95), most: at(1) },
        });
        check();
      }
      await writeFile(
        join(out, "flights.json"),
        `${JSON.stringify(flights, null, 1)}\n`,
      );
    }

    // The still frames: the language's other kinds of slide, one each.
    for (const still of ["prize", "newton"]) {
      await page.goto(`${url}${still}.html?${query}`);
      await page.waitForFunction(() => document.body.dataset["ready"] === "1");
      check();
      await page
        .locator("#slide")
        .screenshot({ path: join(out, "frames", `${still}.png`) });
    }

    // The sheets: a row for each style.
    const image = async (file: string) =>
      `data:image/png;base64,${(await readFile(file)).toString("base64")}`;
    const rows: string[] = [];
    const last: string[] = [];
    for (const [style, files] of [
      ...styles.map((style) => [style, frames[style] ?? []] as const),
      ["labels in motion", motion] as const,
    ]) {
      if (files.length === 0) continue;
      const cells = await Promise.all(
        files.map(
          async (file, step) =>
            `<figure><img src="${await image(file)}"><figcaption>${String(step + 1)}</figcaption></figure>`,
        ),
      );
      rows.push(
        `<section><h2>${style}</h2><div class="row">${cells.join("")}</div></section>`,
      );
      const final = files.at(-1);
      if (final !== undefined && files !== motion)
        last.push(
          `<figure class="big"><img src="${await image(final)}"><figcaption>${style}</figcaption></figure>`,
        );
    }
    const css =
      "body{margin:12px;font:16px system-ui;background:#fff}h2{margin:8px 0 4px;font-size:18px}.row{display:flex;gap:8px}figure{margin:0}img{width:245px;display:block;border:1px solid #999}.big img{width:490px}figcaption{font-size:13px;color:#555}.grid{display:grid;grid-template-columns:repeat(2,490px);gap:10px}";
    const sheet = await browser.newPage({
      viewport: { width: 2600, height: 400 },
    });
    await sheet.setContent(`<style>${css}</style>${rows.join("")}`);
    await sheet.screenshot({ path: join(out, "sheet.png"), fullPage: true });
    await sheet.setViewportSize({ width: 1010, height: 400 });
    await sheet.setContent(
      `<style>${css}</style><div class="grid">${last.join("")}</div>`,
    );
    await sheet.screenshot({
      path: join(out, "last-steps.png"),
      fullPage: true,
    });
  } finally {
    await browser.close();
  }
}

if (import.meta.main) await main();

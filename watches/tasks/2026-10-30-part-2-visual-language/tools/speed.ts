// Times each of the mockup's camera flights in Chromium, Firefox and WebKit:
// the ms between frames, while the camera flies from each step to the next.
// Headless Firefox does not draw what a window would, so --headed opens a
// window for each engine (on the screen, for about a minute). In watches/,
// with the mockup's server running:
//   node tasks/2026-10-30-part-2-visual-language/tools/speed.ts URL OUT.json
//     [--headed] [--scale 2] [--start globe|america] [--style labels|lessig]
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { chromium, firefox, webkit } from "playwright-core";
import { CHOICES } from "../mockup/choices.ts";

const ENGINES = { chromium, firefox, webkit } as const;
/** CSS px: the slide, and the mockup's bar under it. */
const VIEWPORT = { width: 980, height: 552 + 36 };

interface Timed {
  readonly engine: string;
  readonly step: number;
  readonly seconds: number;
  readonly frames: number;
  readonly msBetweenFrames: {
    readonly median: number;
    readonly p95: number;
    readonly most: number;
  };
}

const usage =
  "usage: node tools/speed.ts URL OUT.json [--headed] [--scale N] [--start globe|america] [--style labels|lessig]";

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      headed: { type: "boolean", default: false },
      scale: { type: "string", default: "2" },
      start: { type: "string", default: "globe" },
      style: { type: "string", default: "labels" },
    },
  });
  const [url, out] = positionals;
  const scale = Number(values.scale);
  const start = CHOICES.start.find((name) => name === values.start);
  if (
    positionals.length !== 2 ||
    url === undefined ||
    out === undefined ||
    !Number.isFinite(scale) ||
    start === undefined
  ) {
    console.error(usage);
    process.exitCode = 2;
    return;
  }
  const timed: Timed[] = [];
  for (const [engine, type] of Object.entries(ENGINES)) {
    const browser = await type.launch({ headless: !values.headed });
    try {
      const page = await browser.newPage({
        viewport: VIEWPORT,
        deviceScaleFactor: scale,
      });
      const open = async (step: number) => {
        await page.goto(
          `${url}?style=${values.style}&step=${String(step)}&settle=1&start=${start}`,
        );
        await page.waitForFunction(
          () => "mock" in window && window.mock.ready,
          null,
          { timeout: 60_000 },
        );
      };
      await open(0);
      const steps = await page.evaluate(() => window.mock.steps);
      for (let step = 1; step < steps; step += 1) {
        await open(step - 1);
        await page.waitForTimeout(500);
        const timing = await page.evaluate(
          (target) => window.mock.go(target, true),
          step,
        );
        if (timing.flightEnd <= timing.flightStart) continue;
        // Wait out the flight, however slow its frames.
        await page.waitForTimeout(timing.flightEnd * 1000 + 300);
        for (let tries = 0; tries < 60; tries += 1) {
          const before = await page.evaluate(() => window.mock.frames().length);
          await page.waitForTimeout(500);
          const after = await page.evaluate(() => window.mock.frames().length);
          if (after === before) break;
        }
        const gaps = (await page.evaluate(() => window.mock.frames())).sort(
          (a, b) => a - b,
        );
        const at = (share: number) =>
          gaps[Math.min(gaps.length - 1, Math.floor(share * gaps.length))] ?? 0;
        const result: Timed = {
          engine,
          step,
          seconds: timing.flightEnd - timing.flightStart,
          frames: gaps.length,
          msBetweenFrames: { median: at(0.5), p95: at(0.95), most: at(1) },
        };
        timed.push(result);
        console.log(
          `${engine} step ${String(step)}: ${result.seconds.toFixed(2)} s, ${String(result.frames)} frames, ms between them: median ${at(0.5).toFixed(1)}, 95th percentile ${at(0.95).toFixed(1)}, most ${at(1).toFixed(1)}`,
        );
      }
    } finally {
      await browser.close();
    }
  }
  await writeFile(
    out,
    `${JSON.stringify({ headed: values.headed, scale, start, style: values.style, timed }, null, 1)}\n`,
  );
}

if (import.meta.main) await main();

// Frozen phase 8 timing supplement: the house tool's walk covers the opening.
// pnpm exec node tasks/2026-10-31-part-2-production/checks/measure-frames.ts DECK OUT
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  ENGINES,
  openDeck,
  ORIGIN,
  pathOf,
  placeOf,
} from "../../../../tools/browser.ts";
import CHROMIUM_ARGS from "../../../../tools/chromium-args.json" with { type: "json" };
import { deckSlides } from "../../../watch/deck.ts";
import type {} from "../../../watch/slide-state.ts";

declare global {
  interface Window {
    phase8Gaps?: number[];
  }
}
const { positionals } = parseArgs({ allowPositionals: true });
const [deckArg, outputArg] = positionals;
if (!deckArg || !outputArg || positionals.length !== 2)
  throw new Error("usage: measure-frames.ts DECK OUT");
const deck = resolve(deckArg);
const output = resolve(outputArg);
await mkdir(output, { recursive: true });
const shown = (await deckSlides()).filter(
  (slide) => slide.frontmatter["hide"] !== true,
);
const index =
  shown.findIndex(
    (slide) => slide.title === "Age of Sail: Longitude Was a Guess",
  ) + 1;
assert.ok(index > 0);
const results: object[] = [];
const percentile = (
  values: readonly number[],
  share: number,
): number | null => {
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.floor((sorted.length - 1) * share)] ?? null;
};
for (const engine of ["chromium", "firefox", "webkit"] as const) {
  for (const profile of [
    { name: "laptop", viewport: { width: 1728, height: 980 }, ratio: 2 },
    { name: "projector", viewport: { width: 1920, height: 1080 }, ratio: 1 },
  ]) {
    const browser = await ENGINES[engine].launch({
      headless: false,
      ...(engine === "chromium" ? { args: CHROMIUM_ARGS.gpu } : {}),
    });
    try {
      const served = await openDeck(browser, deck, {
        viewport: profile.viewport,
        deviceScaleFactor: profile.ratio,
      });
      const page = served.page;
      await page.goto(`${ORIGIN}/${index}`);
      await page.waitForFunction(
        () => window.slideState !== undefined && !window.slideState().busy,
      );
      await page.waitForTimeout(500);
      const entries: object[] = [];
      const changes = [
        {
          title: "Cape Noir flight",
          from: { slide: index, click: 0 },
          to: { slide: index, click: 1 },
        },
        {
          title: "Juan Fernández flight",
          from: { slide: index, click: 5 },
          to: { slide: index + 1, click: 0 },
        },
        {
          title: "Juan Fernández voyage",
          from: { slide: index + 1, click: 2 },
          to: { slide: index + 1, click: 3 },
        },
        {
          title: "Atlantic flight",
          from: { slide: index + 1, click: 5 },
          to: { slide: index + 2, click: 0 },
        },
        {
          title: "Scilly flight",
          from: { slide: index + 2, click: 0 },
          to: { slide: index + 2, click: 1 },
        },
      ];
      for (const change of changes) {
        await page.goto(`${ORIGIN}${pathOf(change.from)}`);
        await page.waitForFunction(
          () => window.slideState !== undefined && !window.slideState().busy,
        );
        const start = await page.evaluate(() => {
          window.phase8Gaps = [];
          let previous = performance.now();
          const record = (now: number): void => {
            window.phase8Gaps?.push(now - previous);
            previous = now;
            if (window.phase8Gaps !== undefined) requestAnimationFrame(record);
          };
          requestAnimationFrame(record);
          return window.watchStage?.log.starts.length ?? 0;
        });
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(100);
        await page.waitForFunction(
          () => window.slideState?.().busy === false,
          undefined,
          { timeout: 20000 },
        );
        assert.deepEqual(placeOf(page.url()), change.to);
        const data = await page.evaluate((start) => {
          const gaps = window.phase8Gaps ?? [];
          delete window.phase8Gaps;
          const stage = window.watchStage;
          return {
            gaps,
            js: stage?.log.drawTimes.slice(start) ?? [],
            renderer: stage?.renderer.info(),
            viewport: [innerWidth, innerHeight, devicePixelRatio],
          };
        }, start);
        assert.ok(data.gaps.length > 10, `${engine}: no measured frames`);
        entries.push({
          title: change.title,
          samples: data.gaps.length,
          gapMedianMs: percentile(data.gaps, 0.5),
          gap95Ms: percentile(data.gaps, 0.95),
          jsMedianMs: percentile(data.js, 0.5),
          js95Ms: percentile(data.js, 0.95),
          gapsOver12_5: data.gaps.filter((gap) => gap > 12.5).length,
          gapsOver25: data.gaps.filter((gap) => gap > 25).length,
          renderer: data.renderer,
          viewport: data.viewport,
        });
      }
      assert.deepEqual(served.problems(), []);
      results.push({
        engine,
        version: browser.version(),
        profile: profile.name,
        entries,
      });
      console.log(
        `${engine} ${profile.name}: ${entries.length} Part 2 changes measured`,
      );
    } finally {
      await browser.close();
    }
  }
}
await writeFile(
  join(output, "frame-timing.json"),
  JSON.stringify(results, null, 2) + "\n",
);

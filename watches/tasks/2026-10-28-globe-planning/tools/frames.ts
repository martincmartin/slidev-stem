// Opens the spike (spike/main.ts) in Chromium, Firefox and WebKit at each
// setting, lets the globe turn, and writes its frame times and a picture.
//   node tasks/2026-10-28-globe-planning/tools/frames.ts URL OUT_DIR [ENGINE...]
// URL is the spike's dev server (spike/vite.config.ts). Headless: Chromium
// draws on the GPU (tools/chromium-args.json); the report gives each
// engine's renderer.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { isEngine, withBrowser } from "../../../../tools/browser.ts";
import type { Engine } from "../../../../tools/browser.ts";

/** The settings to measure: each is the spike's address. */
const SETTINGS: readonly Record<string, string>[] = [
  { scale: "110m", water: "none" },
  { scale: "50m", water: "none" },
  { scale: "50m", water: "wash" },
  { scale: "10m", water: "none" },
  { scale: "50m", water: "none", view: "atlantic" },
  { scale: "50m", water: "wash", view: "atlantic", palette: "after-hours" },
  { scale: "10m", water: "none", view: "scilly", spin: "0" },
  { scale: "10m", water: "wash", view: "scilly", spin: "0" },
  { scale: "10m", water: "none", view: "anson", spin: "0" },
  { scale: "10m", water: "wash", view: "anson", spin: "0" },
  { scale: "110m", water: "none", occluder: "disc" },
  { scale: "50m", water: "none", occluder: "disc" },
  { scale: "50m", water: "wash", occluder: "disc" },
  { scale: "10m", water: "none", occluder: "disc" },
  { scale: "50m", water: "wash", view: "atlantic", palette: "after-hours", occluder: "disc" },
  { scale: "10m", water: "wash", view: "anson", spin: "0", occluder: "disc" },
];
/** The speaker's laptop, and a phone's width (its pixels, not its GPU). */
const SCREENS = [
  { name: "laptop", viewport: { width: 1512, height: 950 }, deviceScaleFactor: 2 },
  { name: "phone-size", viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 },
] as const;
const SECONDS = 5;

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

async function measure(engine: Engine, url: string, out: string): Promise<unknown[]> {
  const results: unknown[] = [];
  await withBrowser(engine, async (browser) => {
    for (const screen of SCREENS) {
      for (const setting of SETTINGS) {
        if (screen.name === "phone-size" && setting["view"] !== undefined) continue;
        const name = `${engine}-${screen.name}-${Object.values(setting).join("-")}`;
        const context = await browser.newContext({ viewport: screen.viewport, deviceScaleFactor: screen.deviceScaleFactor });
        try {
          const page = await context.newPage();
          await page.goto(`${url}?${new URLSearchParams(setting).toString()}`);
          await page.waitForFunction(() => window.globe.ready || window.globe.error !== null, null, { timeout: 120_000 });
          await wait(SECONDS * 1000);
          const result = await page.evaluate(() => ({ ...window.globe, stats: window.globe.stats() }));
          await page.locator("canvas").screenshot({ path: join(out, `${name}.png`) });
          results.push({ name, engine, screen: screen.name, ...result });
          console.log(name, result.error ?? JSON.stringify(result.stats), result.buildMs.toFixed(0), "ms build");
        } catch (error) {
          results.push({ name, engine, screen: screen.name, error: String(error) });
          console.log(name, "failed:", String(error));
        } finally {
          await context.close();
        }
      }
    }
  });
  return results;
}

if (import.meta.main) {
  const { positionals } = parseArgs({ allowPositionals: true });
  const [url, out, ...engines] = positionals;
  const chosen = engines.length > 0 ? engines : ["chromium", "firefox", "webkit"];
  if (url === undefined || out === undefined || !chosen.every(isEngine)) {
    console.error("usage: node frames.ts URL OUT_DIR [chromium|firefox|webkit...]");
    process.exitCode = 2;
  } else {
    await mkdir(out, { recursive: true });
    for (const engine of chosen.filter(isEngine)) {
      const results = await measure(engine, url, out);
      await writeFile(join(out, `frames-${engine}.json`), `${JSON.stringify(results, null, 2)}\n`);
    }
  }
}

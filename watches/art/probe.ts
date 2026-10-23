// The probe page (webgl/probe/), built with Vite and opened in Chromium, for
// the scripts that draw stills of the watch: watch-stills.ts and
// pixel-regression.ts.
//
// Chromium draws in software here, as headless Chromium does by default. The
// legibility checks measure these pixels, and two runs of the same code give
// byte-identical PNGs (../../docs/talks.md, "Browser support").

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-chromium";
import type { Page } from "playwright-chromium";
import { build } from "vite";
import { DESIGN } from "../watch/design.ts";
import { balanceAngle } from "../watch/model.ts";
import type { ProbeOptions } from "../webgl/probe/probe.ts";
import { serveFrom } from "./browser.ts";

const PROBE = fileURLToPath(new URL("../webgl/probe/", import.meta.url));
/** Device px for each CSS px: tools/barroom.py's. */
const DEVICE_SCALE = 2;
const TIMEOUT_MS = 120_000;

/** A frame of `view`, tilted `tilt` degrees, at mechanism time `time` (s),
 *  with the balance where its swing has it then, at the slide's size
 *  (the design's canvas) in device px. `extra` adds the options that pick and fade pieces. */
export function frame(
  view: string,
  tilt: number,
  time: number,
  extra: Pick<ProbeOptions, "only" | "rest" | "flash"> = {},
): ProbeOptions {
  return {
    view,
    tilt,
    time,
    swing: balanceAngle(DESIGN.timing, time),
    size: [
      DESIGN.canvas.width * DEVICE_SCALE,
      DESIGN.canvas.height * DEVICE_SCALE,
    ],
    ...extra,
  };
}

/** Build the probe page, open it, and give `use` the page once it can draw.
 *  Close everything after. Fail if the page threw or asked for anything
 *  outside the build. */
export async function withProbe<T>(
  use: (page: Page) => Promise<T>,
): Promise<T> {
  const built = await mkdtemp(join(tmpdir(), "probe-"));
  try {
    await build({
      root: PROBE,
      base: "./",
      configFile: false,
      logLevel: "error",
      build: { outDir: built, emptyOutDir: true },
    });
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({
        deviceScaleFactor: DEVICE_SCALE,
      });
      context.setDefaultTimeout(TIMEOUT_MS);
      const { origin, outside } = await serveFrom(context, built);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const failures = () => [
        ...errors,
        ...outside.map((url) => `outside request: ${url}`),
      ];
      await page.goto(`${origin}/index.html`);
      // The probe's module runs to its end, or throws, before the load event
      // that goto waits for: so the page can draw now, or it never will.
      if (!(await page.evaluate(() => window.watchProbeReady === true))) {
        throw new Error(
          `the probe page did not get ready: ${failures().join("; ")}`,
        );
      }
      const result = await use(page);
      if (failures().length > 0) {
        throw new Error(`the probe page failed: ${failures().join("; ")}`);
      }
      return result;
    } finally {
      await browser.close();
    }
  } finally {
    await rm(built, { recursive: true, force: true });
  }
}

/** Draw each frame on `page`, in order, and write it to `out` as a PNG named
 *  by its key. The frames share the page, so the GL state that one leaves
 *  is what the next starts from. */
export async function drawFrames(
  page: Page,
  frames: Readonly<Record<string, ProbeOptions>>,
  out: string,
): Promise<void> {
  await mkdir(out, { recursive: true });
  for (const [name, options] of Object.entries(frames)) {
    const url = await page.evaluate((options) => {
      const canvas = document.querySelector("canvas");
      if (!window.watchProbe || !canvas) throw new Error("no probe");
      window.watchProbe.render(options);
      return canvas.toDataURL();
    }, options);
    const png = Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
    await writeFile(join(out, name), png);
  }
}

// Draw a fixed set of frames of the watch on the probe page, as PNGs, to
// compare before and after a change to webgl/ that must not change the
// picture.
//
//     node art/pixel-regression.ts OUT_DIR              # in watches/
//     node art/pixel-regression.ts --compare BEFORE AFTER
//
// Two runs of the same code give byte-identical PNGs in Chromium. The frames
// cover each path of the renderer: a still frame, the spring's update, the
// tilt, the three views, a fade at rest 0, 0.5 and 1, and a flash (a
// recolour). The same page draws them in order, so the GL state that one
// frame leaves is what the next one starts from. It also writes the
// renderer's `info()` to info.json. `--compare` says which files differ, and
// by how many pixels, and fails if any does. Chromium decodes the PNGs for
// the count: a canvas stores premultiplied colours, which is exact for the
// probe's frames, as they are opaque.

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright-chromium";
import type { Browser } from "playwright-chromium";
import { drawFrames, frame, withProbe } from "./probe.ts";

/** The pieces that the fade keeps. */
const SUBJECT = ["hairspring", "collet", "stud"];
/** The pieces that the flash recolours. */
const FLASHED = [
  "balance wheel",
  "balance staff",
  "hairspring",
  "collet",
  "stud",
  "roller",
  "impulse jewel",
];
/** The fade: the rest of the watch at opacity `rest`. */
const fade = (rest: number) => ({ only: SUBJECT, rest });

const FRAMES = {
  "01-cover.png": frame("cover", 0, 0),
  "02-cover-later.png": frame("cover", 0, 0.37),
  "03-cover-tilt45.png": frame("cover", 45, 0.8),
  "04-hairspring.png": frame("hairspring", 0, 0.2),
  "05-hairspring-fade-half.png": frame("hairspring", 0, 0.3, fade(0.5)),
  "06-hairspring-fade-out.png": frame("hairspring", 0, 0.4, fade(0)),
  "07-hairspring-tilt20.png": frame("hairspring", 20, 0.5, fade(0)),
  "08-hairspring-fade-in.png": frame("hairspring", 20, 0.6, fade(1)),
  "09-crown.png": frame("crown", 0, 1.1),
  "10-cover-again.png": frame("cover", 0, 0),
  "11-cover-flash.png": frame("cover", 0, 0.1, { flash: FLASHED }),
};

async function draw(out: string): Promise<void> {
  const info = await withProbe(async (page) => {
    await drawFrames(page, FRAMES, out);
    return page.evaluate(() => {
      if (!window.watchProbe) throw new Error("no probe");
      return window.watchProbe.info();
    });
  });
  await writeFile(join(out, "info.json"), `${JSON.stringify(info, null, 2)}\n`);
  console.log(`wrote ${String(Object.keys(FRAMES).length)} frames to ${out}`);
}

/** How two pictures differ, from their PNGs as data: URLs. It runs in the
 *  page. */
async function difference([first, second]: readonly [string, string]) {
  const decode = async (url: string) => {
    const bitmap = await createImageBitmap(await (await fetch(url)).blob(), {
      colorSpaceConversion: "none",
      premultiplyAlpha: "none",
    });
    const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext(
      "2d",
    );
    if (!context) throw new Error("no 2D context");
    context.drawImage(bitmap, 0, 0);
    return context.getImageData(0, 0, bitmap.width, bitmap.height);
  };
  const [one, two] = await Promise.all([decode(first), decode(second)]);
  if (one.width !== two.width || one.height !== two.height) {
    return {
      kind: "sizes",
      sizes: [one, two].map(
        (picture) => `${String(picture.width)} x ${String(picture.height)}`,
      ),
    } as const;
  }
  let changed = 0;
  let largest = 0;
  for (let at = 0; at < one.data.length; at += 4) {
    let step = 0;
    for (let channel = at; channel < at + 4; channel++) {
      const gap = Math.abs((one.data[channel] ?? 0) - (two.data[channel] ?? 0));
      step = Math.max(step, gap);
    }
    if (step > 0) changed++;
    largest = Math.max(largest, step);
  }
  return { kind: "pixels", changed, largest } as const;
}

/** Say how each frame in `after` differs from the one in `before`. Returns
 *  the number of frames that differ. */
async function compare(before: string, after: string): Promise<number> {
  // started at the first frame that differs: usually none does
  let browser: Browser | undefined;
  try {
    let differ = 0;
    for (const name of Object.keys(FRAMES)) {
      const [one, two] = await Promise.all([
        readFile(join(before, name)),
        readFile(join(after, name)),
      ]);
      const same = one.equals(two);
      let result: Awaited<ReturnType<typeof difference>> = {
        kind: "pixels",
        changed: 0,
        largest: 0,
      };
      if (!same) {
        browser ??= await chromium.launch();
        const page = await browser.newPage();
        const url = (png: Buffer) =>
          `data:image/png;base64,${png.toString("base64")}`;
        result = await page.evaluate(difference, [url(one), url(two)] as const);
        await page.close();
      }
      if (result.kind === "sizes") {
        console.log(`${name}: sizes differ, ${result.sizes.join(" and ")}`);
        differ++;
        continue;
      }
      console.log(
        `${name}: ${String(result.changed)} px differ (largest step ${String(result.largest)}), bytes ${same ? "identical" : "differ"}`,
      );
      if (result.changed > 0) differ++;
    }
    return differ;
  } finally {
    await browser?.close();
  }
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { compare: { type: "boolean" } },
});
const [directory, other] = positionals;
const wanted = values.compare ? 2 : 1;
if (directory === undefined || positionals.length !== wanted) {
  console.error(
    "usage: node art/pixel-regression.ts OUT_DIR\n" +
      "       node art/pixel-regression.ts --compare BEFORE AFTER",
  );
  process.exit(2);
}
if (other !== undefined) {
  process.exitCode = (await compare(directory, other)) > 0 ? 1 : 0;
} else {
  await draw(directory);
}

// PNG stills of the WebGL watch, for the house's legibility checks.
//
//     node art/watch-stills.ts OUT_DIR    # in watches/; also `pnpm art:stills OUT_DIR`
//
// The watch has no SVG, so stem/tools/barroom.py and motion.py cannot render
// it: they take its stills as PNGs. This draws them on the probe page
// (probe.ts), at 2 device px for each CSS px of the 980 x 552 slide:
//
//   cover.png     the cover: tilt 0, at the size the slide shows it
//   motion-a.png  the escapement's first frame: time 0 (the balance at one end
//   motion-b.png  of its swing) and half a period on (the other end): the
//                 fork and the escape wheel have moved
//
// It also writes pairs.json, a list of [first, second] file names, for
// `motion.py --png-pair`. Then it runs the renderer's browser checks
// (`window.webglChecks()`, webgl/probe/checks.ts: context loss, dispose, the
// fade, the contract of each input) and fails if one fails. The tilted views
// are not here: the cover's numbers are what the SVG's had
// (docs/measurements.md).

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { DESIGN } from "../watch/design.ts";
import { drawFrames, frame, withProbe } from "./probe.ts";

const FRAMES = {
  "cover.png": frame("cover", 0, 0),
  "motion-a.png": frame("cover", 0, 0),
  "motion-b.png": frame("cover", 0, DESIGN.timing.period / 2),
};
const PAIRS = [["motion-a.png", "motion-b.png"]];

const { positionals } = parseArgs({ allowPositionals: true });
const [out] = positionals;
if (out === undefined || positionals.length > 1) {
  console.error("usage: node art/watch-stills.ts OUT_DIR");
  process.exit(2);
}

const failures = await withProbe(async (page) => {
  await drawFrames(page, FRAMES, out);
  const results = await page.evaluate(() => {
    if (!window.webglChecks) throw new Error("no webglChecks");
    return window.webglChecks();
  });
  return results.filter((result) => result.failure !== null);
});
if (failures.length > 0) {
  console.error("the renderer's checks failed:");
  for (const { name, failure } of failures) {
    console.error(`  ${name}: ${String(failure)}`);
  }
  process.exit(1);
}
await writeFile(join(out, "pairs.json"), `${JSON.stringify(PAIRS)}\n`);
console.log(`wrote ${Object.keys(FRAMES).join(", ")} and pairs.json to ${out}`);
console.log("the renderer's browser checks passed");

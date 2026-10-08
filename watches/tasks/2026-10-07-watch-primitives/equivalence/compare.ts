// Compare two traces from trace.ts: the steps that both have, sample by
// sample. Prints each step that differs, with its first difference and the
// largest difference of each field, and the steps that only one trace has.
//
//   node compare.ts before.json after.json

import { readFileSync } from "node:fs";

interface Sample {
  opacity: number[];
  view: number[];
  tilt: number;
  flash: number[] | null;
}
interface Trace {
  meshes: string[];
  steps: Record<string, Sample[]>;
}

const [, , beforePath, afterPath] = process.argv;
if (!beforePath || !afterPath) {
  throw new Error("usage: node compare.ts before.json after.json");
}
const before = JSON.parse(readFileSync(beforePath, "utf8")) as Trace;
const after = JSON.parse(readFileSync(afterPath, "utf8")) as Trace;
if (JSON.stringify(before.meshes) !== JSON.stringify(after.meshes)) {
  throw new Error("the two traces have different meshes");
}

const TOLERANCE = 1e-5;
let same = 0;
let differ = 0;
for (const [key, first] of Object.entries(before.steps)) {
  const second = after.steps[key];
  if (!second) {
    console.log(`only before: ${key}`);
    continue;
  }
  const largest = { opacity: 0, view: 0, tilt: 0, flash: 0, length: 0 };
  let firstAt: string | null = null;
  const count = Math.max(first.length, second.length);
  largest.length = Math.abs(first.length - second.length);
  for (let at = 0; at < count; at++) {
    const one = first[Math.min(at, first.length - 1)];
    const two = second[Math.min(at, second.length - 1)];
    if (!one || !two) continue;
    const opacity = Math.max(
      ...one.opacity.map((value, mesh) => Math.abs(value - (two.opacity[mesh] ?? 0))),
    );
    const view = Math.max(
      ...one.view.map((value, which) => Math.abs(value - (two.view[which] ?? 0))),
    );
    const tilt = Math.abs(one.tilt - two.tilt);
    const flash = JSON.stringify(one.flash) === JSON.stringify(two.flash) ? 0 : 1;
    largest.opacity = Math.max(largest.opacity, opacity);
    largest.view = Math.max(largest.view, view);
    largest.tilt = Math.max(largest.tilt, tilt);
    largest.flash = Math.max(largest.flash, flash);
    if (
      firstAt === null &&
      Math.max(opacity, view, tilt, flash) > TOLERANCE
    ) {
      firstAt = `${String(at * 25)} ms: opacity ${String(opacity)}, view ${JSON.stringify(one.view)} vs ${JSON.stringify(two.view)}, tilt ${String(one.tilt)} vs ${String(two.tilt)}, flash ${String(flash)}`;
    }
  }
  if (firstAt === null && largest.length === 0) {
    same++;
    continue;
  }
  differ++;
  console.log(`DIFFERS ${key}`);
  console.log(`  first: ${firstAt ?? "(only the length)"}`);
  console.log(`  largest: ${JSON.stringify(largest)} (length in samples)`);
}
for (const key of Object.keys(after.steps)) {
  if (!(key in before.steps)) console.log(`only after: ${key}`);
}
console.log(`${String(same)} steps the same, ${String(differ)} differ`);

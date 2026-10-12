// How far a rise of the hands and arbor ends shows on the screen, in CSS px,
// at each distinct deck state: the rise times the view's scale times the
// sine of the tilt (a height shows up the screen by z sin t).
import { readFileSync } from "node:fs";
import { generate } from "../../../../watch/generate.ts";
import { stageState } from "../../../../watch/state.ts";

const rise = Number(process.argv[2] ?? 3);
const watch = generate();
const frames = JSON.parse(readFileSync(new URL("../../out/states.json", import.meta.url), "utf8")) as { name: string; state: never }[];
for (const { name, state } of frames) {
  const stage = stageState(watch, state);
  const shown = rise * stage.view.scale * Math.sin((stage.tilt * Math.PI) / 180);
  console.log(`${name.padEnd(56)} scale ${stage.view.scale.toFixed(2)} tilt ${String(stage.tilt).padStart(2)}: ${shown.toFixed(2)} px`);
}

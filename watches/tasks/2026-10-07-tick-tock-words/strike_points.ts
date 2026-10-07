// Where the impulse jewel strikes the fork on slide 4, in slide px: the
// jewel's deepest point at the start of each tick window (the balance at
// +pinArc and -pinArc), with the fork's pivot, its outlines at the two banks
// and the balance's arbor, for choosing where the words go.
//
//     node tasks/2026-10-07-tick-tock-words/strike_points.ts   # in watches/

import { readFileSync } from "node:fs";
import { escapementMarks, onSlide } from "../../watch/callouts.ts";
import { JEWEL_FLAT_OFFSET, JEWEL_RADIUS } from "../../watch/generate.ts";
import { WATCH } from "../../watch/instance.ts";
import { polar } from "../../watch/shapes.ts";
import { stageState, watchState } from "../../watch/state.ts";

const deck = readFileSync(new URL("../../slides.md", import.meta.url), "utf8");
// slide 4's frontmatter keys that set the view
const frontmatter = { watch: "escapement", watchTilt: 20 };
if (!deck.includes("watch: escapement\nwatchTilt: 20")) {
  throw new Error("slide 4's view changed: update this script");
}
const state = watchState(frontmatter, 0);
if (!state) throw new Error("no state");
const { view, tilt } = stageState(WATCH.scene, state);
const { design, escapementTops: tops } = WATCH;
const world = ([x, y]: readonly [number, number]): [number, number] => [
  design.watchCentre[0] + x,
  design.watchCentre[1] + y,
];
const shown = (point: [number, number], z: number) =>
  onSlide(view, tilt, WATCH.scene.slide, [point[0], point[1], z]).map(
    (value) => Math.round(value * 10) / 10,
  );
const arbor = world(design.balance.arbor);
const radius =
  design.balance.impulsePinRadius + (JEWEL_FLAT_OFFSET - JEWEL_RADIUS) / 2;
const jewelAt = (swing: number) =>
  shown(polar(radius, design.balance.pinDirection + swing, arbor), tops.jewel);
const { pinArc, amplitude, period } = design.timing;
const start = Math.acos(pinArc / amplitude) / (2 * Math.PI);
const marks = escapementMarks(WATCH, frontmatter);
console.log(
  JSON.stringify(
    {
      timing: design.timing,
      windowStarts: [start * period, (start + 0.5) * period],
      strikeAtPlusArc: jewelAt(pinArc),
      strikeAtMinusArc: jewelAt(-pinArc),
      jewelAtRest: marks.jewel,
      balanceArbor: shown(arbor, tops.jewel),
      forkPivot: shown(world(design.fork.pivot), tops.fork),
      pallet: marks.pallet,
      escape: marks.escape,
    },
    null,
    1,
  ),
);

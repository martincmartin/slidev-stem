// Each piece's lowest and highest heights in the model, at rest (holdouts
// left out): the heights that tools/touches.py takes as constants.
//
//     node tasks/2026-10-12-victory-lap/tools/heights.ts > tasks/2026-10-12-victory-lap/out/heights.txt
//
// It runs on the project's model, so its output can change later: the
// output of the task's start (e15308a) is in out/heights.txt.

import { AtRest } from "../../../watch/at-rest.ts";
import { generate } from "../../../watch/generate.ts";

const watch = generate();
const atRest = new AtRest(watch);
for (const piece of watch.scene.pieces) {
  let low = Infinity;
  let high = -Infinity;
  for (const mesh of piece.meshes) {
    if (mesh.holdout) continue;
    const [bottom, top] = atRest.heights(mesh);
    low = Math.min(low, bottom);
    high = Math.max(high, top);
  }
  if (low <= high) {
    console.log(
      `${piece.name.padEnd(22)} ${low.toFixed(2)} ${high.toFixed(2)}`,
    );
  }
}

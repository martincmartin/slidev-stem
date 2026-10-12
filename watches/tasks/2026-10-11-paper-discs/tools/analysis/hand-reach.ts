// How far the one-step hour hand reaches from the watch's centre, against
// the chapter ring's inner radius, at rest (the hand and the ring are at one
// height).
import { generate } from "../../../../watch/generate.ts";
import { Motion } from "../../../../watch/model.ts";

const watch = generate();
const matrices = new Motion(watch).matrices(0, 0);
const hand = watch.scene.meshes.find((mesh) => mesh.name === "one-step hour hand");
if (!hand?.group) throw new Error("no hand");
const matrix = matrices.get(hand.group);
if (!matrix) throw new Error("no matrix");
const [cx, cy] = watch.design.watchCentre;
let reach = 0;
for (let index = 0; index < hand.triangles.length; index += 3) {
  const [x, y] = [hand.triangles[index] ?? 0, hand.triangles[index + 1] ?? 0];
  const wx = (matrix[0] ?? 0) * x + (matrix[4] ?? 0) * y + (matrix[12] ?? 0);
  const wy = (matrix[1] ?? 0) * x + (matrix[5] ?? 0) * y + (matrix[13] ?? 0);
  reach = Math.max(reach, Math.hypot(wx - cx, wy - cy));
}
console.log(`hand reaches ${reach.toFixed(1)} px from the centre; the chapter ring starts at ${String(watch.design.case.ringRadius)}`);

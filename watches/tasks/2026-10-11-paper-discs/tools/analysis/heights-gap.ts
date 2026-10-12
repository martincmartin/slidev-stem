// Each mesh's world height range and plan box at rest, and its clip discs.
import { generate } from "../../../../watch/generate.ts";
import { Motion } from "../../../../watch/model.ts";

const watch = generate(undefined, { stackGap: Number(process.argv[2] ?? 0) });
const matrices = new Motion(watch).matrices(0, 0);
const groupName = (group: any) => (group ? group.name : "-");
for (const mesh of watch.scene.meshes) {
  const matrix = mesh.group ? matrices.get(mesh.group) : undefined;
  let zLow = Infinity, zHigh = -Infinity, xLow = Infinity, xHigh = -Infinity, yLow = Infinity, yHigh = -Infinity;
  const t = mesh.triangles;
  for (let index = 0; index < t.length; index += 3) {
    let [x, y, z] = [t[index], t[index + 1], t[index + 2]];
    if (matrix) {
      const m = matrix;
      [x, y, z] = [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
    }
    zLow = Math.min(zLow, z); zHigh = Math.max(zHigh, z);
    xLow = Math.min(xLow, x); xHigh = Math.max(xHigh, x);
    yLow = Math.min(yLow, y); yHigh = Math.max(yHigh, y);
  }
  const discs = mesh.hiddenInside.map((disc) => `r${disc.radius.toFixed(1)} by ${groupName(disc.by)}`).join("; ");
  console.log(`${mesh.name.padEnd(28)} group ${groupName(mesh.group).padEnd(16)} z ${zLow.toFixed(1)}..${zHigh.toFixed(1)}  x ${xLow.toFixed(0)}..${xHigh.toFixed(0)} y ${yLow.toFixed(0)}..${yHigh.toFixed(0)}  ${discs}`);
}

import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { generate, PROPOSALS } from "./prototype/watch/generate.ts";
import type { Mesh } from "./prototype/webgl/scene.ts";
const bounds = (mesh: Mesh): [number, number] => {
  const heights = [...mesh.triangles].filter((_, index) => index % 3 === 2);
  return [Math.min(...heights), Math.max(...heights)];
};
const results = PROPOSALS.map((proposal) => {
  const watch = generate(undefined, proposal);
  const meshFor = (part: string) =>
    watch.scene.meshes.find((mesh) => mesh.part === part)!;
  const balance = bounds(meshFor("balance"));
  const spring = watch.springHeights;
  const roller = bounds(meshFor("roller"));
  const jewel = bounds(meshFor("impulse jewel"));
  const staff = bounds(
    watch.scene.meshes.find((mesh) => mesh.name === "hairspring 3")!,
  );
  const stud = bounds(meshFor("hairspring stud"));
  assert.equal(spring.bottom - balance[1], 2);
  assert.equal(roller[0] - spring.top, 2);
  assert.equal(jewel[0], roller[1]);
  assert.equal(staff[0], balance[1]);
  assert.equal(staff[1], roller[1]);
  assert.equal(roller[0] - stud[1], 1);
  assert.ok(bounds(meshFor("case band"))[0] < balance[0]);
  for (const wheel of watch.design.wheels) {
    if (!wheel.driven || wheel.name === "barrel") continue;
    const driverBody = meshFor(`${wheel.name} wheel`);
    const pinion = watch.scene.meshes.find(
      (mesh) =>
        mesh.part === `${wheel.driven!.name} wheel` && mesh.name.endsWith(" 3"),
    )!;
    assert.deepEqual(bounds(pinion), bounds(driverBody));
  }
  return {
    name: proposal.name,
    balance,
    spring,
    roller,
    jewel,
    staff,
    stud,
    checks: "passed",
  };
});
writeFileSync(
  new URL("./evidence/geometry-checks.json", import.meta.url),
  JSON.stringify(results, null, 2) + "\n",
);
console.log("Three proposal stacks passed geometry checks.");

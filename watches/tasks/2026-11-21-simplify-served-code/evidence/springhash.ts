import { createHash } from "node:crypto";
import { springPoints, mainspringPoints, SPRING_RADII, SPRING_TURNS, MAINSPRING_TURNS } from "/Users/martin/Develop/slidev/stem/work1/watches/watch/model.ts";
const hash = createHash("sha256");
const hair = { radii: SPRING_RADII, turns: SPRING_TURNS, outerAngle: 37 };
const main = { radii: [10, 60] as [number, number], turns: MAINSPRING_TURNS, outerAngle: 12 };
const started = performance.now();
for (let index = 0; index < 400; index++) {
  const swing = Math.sin(index) * 150;
  hash.update(JSON.stringify(springPoints(hair, swing)));
  hash.update(JSON.stringify(mainspringPoints(main, index * 7.3, (index % 300))));
}
console.log(hash.digest("hex"), `${((performance.now() - started) / 800).toFixed(3)} ms a call`);

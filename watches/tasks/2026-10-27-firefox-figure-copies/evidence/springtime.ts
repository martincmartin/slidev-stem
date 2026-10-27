import { generate } from "/Users/martin/Develop/slidev/stem/work1/watches/watch/generate.ts";
import { Motion, springPoints } from "/Users/martin/Develop/slidev/stem/work1/watches/watch/model.ts";
const watch = generate();
const motion = new Motion(watch);
function time(label: string, run: (index: number) => unknown, count = 300) {
  for (let index = 0; index < 50; index++) run(index);
  const start = performance.now();
  for (let index = 0; index < count; index++) run(index);
  (globalThis.results ??= []).push([label, ((performance.now() - start) / count).toFixed(3), "ms"]);
}
time("springPoints (hairspring)", (index) => springPoints(watch.springShape, Math.sin(index) * 200));
time("springGeometry (hairspring)", (index) => motion.springGeometry(Math.sin(index) * 200));
time("mainspringGeometry", (index) => motion.mainspringGeometry({ arbor: index, wind: (index % 300), key: 0 } as never));
const geometry = motion.springGeometry(10);
console.log("lines", geometry.lines.length, geometry.lines.map((line) => line.points.length), "silhouette edges", geometry.silhouetteEdges.length, "triangle floats", geometry.triangles.length);

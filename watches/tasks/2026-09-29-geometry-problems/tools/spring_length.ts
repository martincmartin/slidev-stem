// The hairspring's length and shape over the balance's swing.
//
//     node tasks/2026-09-29-geometry-problems/tools/spring_length.ts   # in watches/

import { generate } from "../../../watch/generate.ts";
import { springPoints } from "../../../watch/model.ts";

const spring = generate().springShape;
for (const swing of [-150, -100, -50, 0, 50, 100, 150]) {
  const points = springPoints(spring, swing);
  let length = 0;
  for (let index = 1; index < points.length; index++) {
    const [x0, y0] = points[index - 1] ?? [0, 0];
    const [x1, y1] = points[index] ?? [0, 0];
    length += Math.hypot(x1 - x0, y1 - y0);
  }
  const turns = spring.turns - swing / 360;
  const oneTurnIn = points[Math.round((points.length - 1) * (1 - 1 / turns))] ?? [0, 0];
  const last = points[points.length - 1] ?? [0, 0];
  console.log(
    `swing ${String(swing).padStart(4)}  turns ${turns.toFixed(3)}  length ${length.toFixed(3)} px  ` +
      `radius one turn in from the stud ${Math.hypot(...oneTurnIn).toFixed(2)} px  outer end ${Math.hypot(...last).toFixed(2)} px`,
  );
}

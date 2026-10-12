// The mainspring's gap between neighbouring coils, centre to centre, coil by
// coil from the arbor out, at rest and wound one turn (the Mainspring slide's
// click 1).
import { generate } from "../../../../watch/generate.ts";
import { springPoints } from "../../../../watch/model.ts";

const shape = generate().mainspringShape;
for (const wind of [0, 360]) {
  const points = springPoints(shape, -wind);
  const turns = shape.turns + wind / 360;
  const perTurn = (points.length - 1) / turns;
  const gaps: string[] = [];
  for (let coil = 0; coil + 1 < turns; coil++) {
    // at the middle of each coil, the radius here and one turn further out
    const index = Math.round((coil + 0.5) * perTurn);
    const outer = Math.round(index + perTurn);
    if (outer >= points.length) break;
    const radius = (point: number[]) => Math.hypot(point[0] ?? 0, point[1] ?? 0);
    gaps.push((radius(points[outer] ?? [0, 0]) - radius(points[index] ?? [0, 0])).toFixed(1));
  }
  console.log(`wind ${String(wind / 360)} turn: gaps from the arbor out ${gaps.join(", ")} px`);
}

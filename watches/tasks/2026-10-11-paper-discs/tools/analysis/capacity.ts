// How far the mainspring can wind in the model's shape family, and the
// smallest gap between coils at each wind.
import { generate } from "../../../../watch/generate.ts";
import { springPoints } from "../../../../watch/model.ts";

const watch = generate() as any;
const shape = watch.mainspringShape;
console.log("shape", JSON.stringify(shape));
const length = (points: number[][]) => {
  let total = 0;
  for (let index = 1; index < points.length; index++)
    total += Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]);
  return total;
};
const rest = springPoints(shape, 0);
console.log("length", length(rest).toFixed(1));
// smallest radial gap between a point and the coil one turn further out
function smallestGap(points: number[][], turns: number): number {
  const perTurn = (points.length - 1) / turns;
  let smallest = Infinity;
  for (let index = 0; index + perTurn < points.length; index++) {
    const inner = points[index];
    // nearest point on the next coil, by search near index + perTurn
    let best = Infinity;
    for (let other = Math.floor(index + perTurn * 0.8); other < Math.min(points.length, index + perTurn * 1.2); other++) {
      best = Math.min(best, Math.hypot(points[other][0] - inner[0], points[other][1] - inner[1]));
    }
    smallest = Math.min(smallest, best);
  }
  return smallest;
}
for (let wind = 0; wind <= 720; wind += 30) {
  try {
    const points = springPoints(shape, -wind);
    console.log(`wind ${(wind / 360).toFixed(2)} turns: smallest gap ${smallestGap(points, shape.turns + wind / 360).toFixed(2)} px`);
  } catch (error) {
    console.log(`wind ${(wind / 360).toFixed(2)} turns: ${(error as Error).message}`);
  }
}

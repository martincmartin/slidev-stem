// For each angle of the one-step hour wheel about the centre arbor: the gap
// in the plan between its tip circle and the barrel arbor's wall (negative:
// they overlap, and the arbor rises through the wheel).
import { generate } from "../../../../watch/generate.ts";

const watch = generate();
const { design } = watch;
const wheel = watch.oneStepHour;
const centre = design.wheels[1].arbor; // the centre wheel's
const barrel = design.wheels[0].arbor;
const distance = Math.hypot(wheel.arbor[0] - centre[0], wheel.arbor[1] - centre[1]);
const ARBOR_RADIUS = 15; // BARREL_ARBOR_RADIUS in watch/generate.ts
console.log(`one-step hour wheel: tip radius ${wheel.outer.toFixed(1)}, ${distance.toFixed(1)} from the centre arbor`);
for (let angle = 0; angle < 360; angle += 15) {
  const radians = (angle * Math.PI) / 180;
  const at = [centre[0] + distance * Math.cos(radians), centre[1] + distance * Math.sin(radians)];
  const gap = Math.hypot(at[0] - barrel[0], at[1] - barrel[1]) - wheel.outer - ARBOR_RADIUS;
  console.log(`${String(angle).padStart(3)}: ${gap.toFixed(1)} px`);
}

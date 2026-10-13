// How long each hand covers each Recap stop's touch, at the stop's speed-up.
//
//     node tasks/2026-10-13-recap-hands/tools/cover.ts [RADIUS]
//
// Run from watches/. RADIUS (world px, default 6) is the touch's disc. The
// camera's tilt, turn and speed-up of each stop are copied from slides.md
// (2026-10-13). A line of sight from the touch to the camera meets the
// hand's middle height at the touch's place moved by tan(tilt) x the height
// between them, toward the camera's side. The hand covers the touch when its
// footprint (its mesh's triangles, at a whole-turn sweep in 0.25 degree
// steps) meets that disc. Other parts in the way are not counted.

import { generate } from "../../../watch/generate.ts";

const watch = generate();
const { design } = watch;
const [centreX, centreY] = design.watchCentre;
const radius = Number(process.argv[2] ?? 6);
const STEPS = 1440;

const hands = [
  { name: "minute hand 1", arbor: design.wheels[1]!.arbor, period: 3600 },
  { name: "hour hand 1", arbor: design.wheels[1]!.arbor, period: 43200 },
  { name: "seconds hand 1", arbor: design.wheels[3]!.arbor, period: 60 },
].map((hand) => {
  const mesh = watch.scene.meshes.find((each) => each.name === hand.name)!;
  const heights = [...mesh.triangles].filter((_, index) => index % 3 === 2);
  return {
    ...hand,
    triangles: mesh.triangles,
    height: (Math.min(...heights) + Math.max(...heights)) / 2,
    pivot: [centreX + hand.arbor[0], centreY + hand.arbor[1]] as const,
  };
});

// view, tilt, turn, speed-up
const stops = [
  ["recap motion works", 30, 0, 1440],
  ["recap barrel", 30, 0, 720],
  ["recap barrel touch", 80, 80, 720],
  ["recap centre touch", 45, -10, 120],
  ["recap third touch", 45, 15, 15],
  ["recap fourth touch", 45, 75, 2],
  ["recap pallet", 45, 90, 1],
  ["recap jewel", 45, 90, 1],
  ["hairspring", 20, 0, 1],
] as const;

function inside(triangles: Float32Array, x: number, y: number): boolean {
  for (let index = 0; index < triangles.length; index += 9) {
    const [x1, y1, x2, y2, x3, y3] = [0, 1, 3, 4, 6, 7].map(
      (offset) => triangles[index + offset]!,
    ) as [number, number, number, number, number, number];
    const side1 = (x - x2) * (y1 - y2) - (x1 - x2) * (y - y2);
    const side2 = (x - x3) * (y2 - y3) - (x2 - x3) * (y - y3);
    const side3 = (x - x1) * (y3 - y1) - (x3 - x1) * (y - y1);
    const negative = side1 < 0 || side2 < 0 || side3 < 0;
    const positive = side1 > 0 || side2 > 0 || side3 > 0;
    if (!(negative && positive)) return true;
  }
  return false;
}

for (const [name, tilt, turn, speedUp] of stops) {
  const view = watch.scene.views.find((each) => each.name === name)!;
  const [touchX, touchY, touchHeight] = view.pivot;
  const cells: string[] = [];
  for (const hand of hands) {
    const shift =
      Math.tan((tilt * Math.PI) / 180) * (hand.height - touchHeight);
    const seenX = touchX + shift * Math.sin((turn * Math.PI) / 180);
    const seenY = touchY + shift * Math.cos((turn * Math.PI) / 180);
    const samples: [number, number][] = [[seenX, seenY]];
    for (let index = 0; index < 24; index++) {
      const angle = (index * Math.PI) / 12;
      samples.push([
        seenX + radius * Math.cos(angle),
        seenY + radius * Math.sin(angle),
      ]);
    }
    const covered: boolean[] = [];
    for (let step = 0; step < STEPS; step++) {
      // turn the samples back by the hand's angle, about its arbor
      const angle = (-2 * Math.PI * step) / STEPS;
      const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
      covered.push(
        samples.some(([x, y]) => {
          const [dx, dy] = [x - hand.pivot[0], y - hand.pivot[1]];
          return inside(hand.triangles, cos * dx - sin * dy, sin * dx + cos * dy);
        }),
      );
    }
    let run = 0;
    let longest = 0;
    for (let step = 0; step < 2 * STEPS; step++) {
      run = covered[step % STEPS]! ? run + 1 : 0;
      longest = Math.max(longest, Math.min(run, STEPS));
    }
    const period = hand.period / speedUp;
    const share = covered.filter(Boolean).length / STEPS;
    cells.push(
      `${hand.name.split(" ")[0]!} ${(100 * share).toFixed(1)}%, ` +
        `${((longest / STEPS) * period).toFixed(1)} s of ${period.toFixed(0)} s`,
    );
  }
  console.log(`${name} (${String(speedUp)}x): ${cells.join(" | ")}`);
}

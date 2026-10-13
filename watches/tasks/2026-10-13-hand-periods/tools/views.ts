// Candidate views for design 1 zoomed in on the fourth wheel: the zoom, the
// seconds hand's size and step on the slide, and how much of the time the
// minute and hour hands show on the slide.
//
//     node tasks/2026-10-13-hand-periods/tools/views.ts [--json]
//
// Run from watches/. Each view is the deck's own fitted view
// (`fittedView`, watch/generate.ts) of a list of pieces, in the picture
// band, at a tilt. A big hand "shows" at an angle when a point of it more
// than SHOWS_FROM world px from its arbor is on the slide (980 x 552). The
// tilt foreshortens y about the view's pivot; heights are not counted, so
// at a tilt a raised hand shows a few px higher than here.

import { fittedView, generate } from "../../../watch/generate.ts";

const SHOWS_FROM = 20;
const ANGLES = 720;
const SLIDE = { width: 980, height: 552 };
const HANDS = { seconds: 60, minute: 206, hour: 140 };

const watch = generate();
const pieceNamed = (name: string) => {
  const piece = [...watch.extents.keys()].find((each) => each.name === name);
  if (piece === undefined) throw new Error(`no piece ${name}`);
  return piece;
};
const middleOf = (name: string): readonly [number, number] => {
  const { box } = watch.extents.get(pieceNamed(name))!;
  return [(box.left + box.right) / 2, (box.top + box.bottom) / 2];
};

const candidates: readonly (readonly [string, readonly string[], number])[] = [
  ["seconds hand", ["seconds hand"], 0],
  ["seconds hand, tilt 20", ["seconds hand"], 20],
  ["seconds hand + fourth wheel", ["seconds hand", "fourth wheel"], 0],
  ["seconds hand + centre pivot", ["seconds hand", "centre pivot"], 0],
  ["Gears slide (for comparison)", ["fourth wheel", "fourth arbor", "escape pinion", "escape arbor"], 20],
  ["case band (design 1 as first drawn)", ["case band"], 0],
];

const secondsBox = watch.extents.get(pieceNamed("seconds hand"))!.box;
const fourth = middleOf("seconds hand");
const centre = middleOf("centre pivot");

const rows = candidates.map(([label, names, tilt]) => {
  const view = fittedView(watch, names.map(pieceNamed), null, "picture", tilt);
  const cos = Math.cos((tilt * Math.PI) / 180);
  const onSlide = ([x, y]: readonly [number, number]): readonly [number, number] => [
    view.shift[0] + view.scale * x,
    view.shift[1] + view.scale * (view.pivot[1] + (y - view.pivot[1]) * cos),
  ];
  const inside = ([x, y]: readonly [number, number]) =>
    x >= 0 && x <= SLIDE.width && y >= 0 && y <= SLIDE.height;
  const showsShare = (arbor: readonly [number, number], length: number) => {
    let shows = 0;
    for (let index = 0; index < ANGLES; index++) {
      const angle = (2 * Math.PI * index) / ANGLES;
      for (let along = SHOWS_FROM; along <= length; along += 2) {
        const point = onSlide([arbor[0] + along * Math.sin(angle), arbor[1] - along * Math.cos(angle)]);
        if (inside(point)) {
          shows++;
          break;
        }
      }
    }
    return shows / ANGLES;
  };
  const [centreX, centreY] = onSlide(centre);
  const [fourthX, fourthY] = onSlide(fourth);
  return {
    label,
    scale: view.scale,
    secondsLength: HANDS.seconds * view.scale,
    tipStep: (2 * Math.PI * HANDS.seconds * view.scale) / 60,
    fourthArbor: [fourthX, fourthY],
    centreArbor: [centreX, centreY],
    centreOnSlide: inside([centreX, centreY]),
    minuteShows: showsShare(centre, HANDS.minute),
    hourShows: showsShare(centre, HANDS.hour),
  };
});

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ secondsBox, rows }, null, 2));
} else {
  const box = secondsBox;
  console.log(`seconds hand's extent: ${(box.right - box.left).toFixed(1)} x ${(box.bottom - box.top).toFixed(1)} world px`);
  for (const row of rows) {
    console.log(
      [
        row.label.padEnd(36),
        `scale ${row.scale.toFixed(2)}`,
        `hand ${row.secondsLength.toFixed(0)} px`,
        `step ${row.tipStep.toFixed(1)} px`,
        `arbor at ${row.fourthArbor.map((each) => each.toFixed(0)).join(",")}`,
        `centre at ${row.centreArbor.map((each) => each.toFixed(0)).join(",")}${row.centreOnSlide ? "" : " (off)"}`,
        `minute shows ${(100 * row.minuteShows).toFixed(0)}%`,
        `hour shows ${(100 * row.hourShows).toFixed(0)}%`,
      ].join("  "),
    );
  }
}

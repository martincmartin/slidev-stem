// Stills of design 1 zoomed in on the seconds hand, from the explorer.
//
//     node tasks/2026-10-13-hand-periods/tools/zoom-stills.ts [OUT]
//
// Run from watches/. OUT defaults to tasks/2026-10-13-hand-periods/out/.
// The tool serves the explorer (watch/explorer/, as `pnpm explore` does)
// and opens it at the deck's fitted view of the seconds hand (`fittedView`,
// watch/generate.ts): the view's pivot is the explorer's target, at the
// cross of its guides, and the scale is the view's. It shows the pieces in
// `all`, or all but the minute and hour hands, at 1x, and takes a still of
// the slide frame after SETTLE ms. The explorer cannot dim pieces without a
// deck pose, so these stills show no dim.

import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium } from "playwright-chromium";
import { createServer } from "vite";
import { fittedView, generate } from "../../../watch/generate.ts";

const out = resolve(process.argv[2] ?? "tasks/2026-10-13-hand-periods/out");
const SETTLE = 4000;

const watch = generate();
const pieces = [...watch.extents.keys()];
const pieceNamed = (name: string) => {
  const piece = pieces.find((each) => each.name === name);
  if (piece === undefined) throw new Error(`no piece ${name}`);
  return piece;
};
const all = pieces.filter((piece) => piece.inAll);
const bigHands = new Set([pieceNamed("minute hand"), pieceNamed("hour hand")]);

// file name, tilt, pieces shown
const shots: readonly (readonly [string, number, readonly (typeof pieces)[number][]])[] = [
  ["zoom-seconds-all", 0, all],
  ["zoom-seconds-no-big-hands", 0, all.filter((piece) => !bigHands.has(piece))],
  ["zoom-seconds-no-big-hands-tilt-20", 20, all.filter((piece) => !bigHands.has(piece))],
  ["zoom-fourth-wheel-and-hand", 0, ["fourth wheel", "fourth arbor", "seconds hand"].map(pieceNamed)],
  ["zoom-fourth-wheel-and-hand-tilt-20", 20, ["fourth wheel", "fourth arbor", "seconds hand"].map(pieceNamed)],
  ["zoom-hand-alone", 0, [pieceNamed("seconds hand")]],
  ["zoom-hand-alone-tilt-20", 20, [pieceNamed("seconds hand")]],
  ["zoom-hand-arbor", 0, ["seconds hand", "fourth arbor"].map(pieceNamed)],
  ["zoom-hand-arbor-tilt-10", 10, ["seconds hand", "fourth arbor"].map(pieceNamed)],
  ["zoom-hand-arbor-tilt-20", 20, ["seconds hand", "fourth arbor"].map(pieceNamed)],
];
// a close-up of the pivot too, PIVOT_CROP slide px on each side of the
// view's middle (the hand's arbor), scaled up by the explorer's frame
const PIVOT_CROP = 40;

const server = await createServer({
  root: resolve("watch/explorer"),
  configFile: resolve("watch/explorer/vite.config.ts"),
  server: { port: 3170, strictPort: false, open: false },
  logLevel: "error",
});
await server.listen();
const base = server.resolvedUrls?.local[0];
if (base === undefined) throw new Error("no server address");

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, tilt, shown] of shots) {
    const view = fittedView(watch, [pieceNamed("seconds hand")], null, "picture", tilt);
    const hash = new URLSearchParams({
      tilt: tilt.toFixed(2),
      turn: "0.00",
      scale: view.scale.toPrecision(8),
      target: view.pivot.map((value) => value.toFixed(3)).join(","),
      speed: "1",
      guides: "0",
      show: shown.map((piece) => piece.name).join("|"),
    });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 3 });
    const page = await context.newPage();
    await page.goto(`${base}#${hash.toString()}`);
    await page.waitForTimeout(SETTLE);
    const frame = page.locator("#slide");
    await frame.screenshot({ path: join(out, `${name}.png`) });
    const box = await frame.boundingBox();
    if (box === null) throw new Error("no slide frame");
    const zoom = box.width / 980;
    // the fitted view puts the circle's middle at x 294 (the middle of the
    // left 60%) and y 338 (the picture band's middle)
    await page.screenshot({
      path: join(out, `${name}-pivot.png`),
      clip: {
        x: box.x + (294 - PIVOT_CROP) * zoom,
        y: box.y + (338 - PIVOT_CROP) * zoom,
        width: 2 * PIVOT_CROP * zoom,
        height: 2 * PIVOT_CROP * zoom,
      },
      scale: "device",
    });
    await context.close();
    console.log(name, `scale ${view.scale.toFixed(2)}`);
  }
} finally {
  await browser.close();
  await server.close();
}

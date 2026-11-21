// The shortest strap whose ends stay off the slide at each settled click of
// the talk, at each article figure, and on the camera's way between
// neighbouring clicks.
import { deckSlides } from "./watch/deck.ts";
import { makeGlobe } from "./globe/model.ts";
import { makeArt } from "./watch/art.ts";
import { moveWithBefore, stageState, watchState } from "./watch/state.ts";
import { figureState, defaultFigures } from "./watch/article.ts";
import { slidePoint } from "./webgl/renderer.ts";
import { mixCamera } from "./webgl/timeline.ts";
import type { CameraPose } from "./webgl/scene.ts";

const watch = makeArt(makeGlobe).art;
const [width, height] = watch.scene.slide;
const strapPieces = watch.scene.pieces.filter((p) => p.name === "strap" || p.name === "raised strap");
const extents = strapPieces.map((p) => watch.extents.get(p));
const box = extents[0].box;
const centreY = (box.top + box.bottom) / 2;
const now = (box.bottom - box.top) / 2;
const zs = extents.flatMap((e) => [e.bottom, e.top]);
console.log("strap now: half length", now, "x", box.left, box.right, "z", Math.min(...zs), Math.max(...zs));

/** Whether the strap's end at `side` (-1 top, +1 bottom in world y) with
 *  half-length `length` is off the slide through `pose`. */
function off(pose: CameraPose, length: number, side: number): boolean {
  const points = [box.left, box.right].flatMap((x) =>
    zs.map((z) => slidePoint(pose, watch.scene.slide, [x, centreY + side * length, z])),
  );
  return (
    points.every(([x]) => x < 0) ||
    points.every(([x]) => x > width) ||
    points.every(([, y]) => y < 0) ||
    points.every(([, y]) => y > height)
  );
}
function needed(pose: CameraPose): number {
  let worst = 0;
  for (const side of [-1, 1]) {
    if (!off(pose, 20000, side)) return Infinity;
    let [low, high] = [0, 20000];
    for (let i = 0; i < 50; i++) {
      const mid = (low + high) / 2;
      if (off(pose, mid, side)) high = mid; else low = mid;
    }
    worst = Math.max(worst, high);
  }
  return worst;
}
const showsStrap = (stage: ReturnType<typeof stageState>): boolean =>
  strapPieces.some((p) => [...p.meshes].some((m) => stage.shown.has(m)));

const results: { where: string; need: number }[] = [];
const slides = await deckSlides();
let previous: { stage: ReturnType<typeof stageState>; where: string } | null = null;
for (const [index, slide] of slides.entries()) {
  const total = Number(slide.frontmatter["clicks"] ?? 0);
  for (let clicks = 0; clicks <= total; clicks++) {
    const state = watchState(slide.frontmatter, clicks);
    if (!state) { previous = null; continue; }
    const stage = stageState(watch, state);
    const where = `${slide.title} @${clicks}`;
    if (showsStrap(stage)) results.push({ where, need: needed(stage) });
    // the way from the previous click: the camera and its parts
    // what shows while the camera moves: the slide's rule between slides,
    // the pieces that both show within one; and the pieces that go later
    const rule = clicks === 0 ? moveWithBefore(slide.frontmatter) : { rule: "common", also: [] };
    const strapNames = ["strap", "raised strap"];
    const has = (set: ReadonlySet<unknown>) => strapPieces.some((p) => [...p.meshes].some((m) => set.has(m)));
    const during =
      previous &&
      rule.rule !== "none" &&
      ((rule.rule === "all" && (showsStrap(stage) || showsStrap(previous.stage))) ||
        (showsStrap(stage) && showsStrap(previous.stage)) ||
        rule.also.some((name) => strapNames.includes(name)) ||
        has(stage.goLater) ||
        (stage.linger ?? []).some((group) => has(group.meshes)));
    if (previous && during) {
      let worst = 0;
      for (let f = 0; f <= 1.0001; f += 0.05) {
        const a = previous.stage, b = stage;
        const poses: CameraPose[] = [
          mixCamera(a, b, f),
          { view: a.view, tilt: a.tilt + (b.tilt - a.tilt) * f, turn: a.turn + (b.turn - a.turn) * f },
          { view: b.view, tilt: a.tilt + (b.tilt - a.tilt) * f, turn: a.turn + (b.turn - a.turn) * f },
          { ...mixCamera(a, b, f), tilt: a.tilt, turn: a.turn },
          { ...mixCamera(a, b, f), tilt: b.tilt, turn: b.turn },
        ];
        for (const pose of poses) worst = Math.max(worst, needed(pose));
      }
      results.push({ where: `move ${previous.where} -> ${where}`, need: worst });
    }
    previous = { stage, where };
  }
  // the article's figures
  const total2 = Number(slide.frontmatter["clicks"] ?? 0);
  for (const clicks of defaultFigures(watch, slide.frontmatter, total2)) {
    const state = figureState(slide.frontmatter, clicks);
    if (!state) continue;
    const stage = stageState(watch, state);
    if (showsStrap(stage)) results.push({ where: `figure ${slide.title} @${clicks}`, need: needed(stage) });
  }
}
results.sort((a, b) => b.need - a.need);
for (const r of results.slice(0, 25)) console.log(r.need.toFixed(0).padStart(7), r.where);
console.log("count", results.length);

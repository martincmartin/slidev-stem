// The strap's ends are off the slide in each view of the talk and each
// article figure, and on the camera's way between a click and the next
// while the strap shows (STRAP_LENGTH in generate.ts). A reader who turns a
// figure may see them: that is the point of a short strap.

import assert from "node:assert/strict";
import { test } from "node:test";
import { makeGlobe } from "../globe/model.ts";
import { slidePoint } from "../webgl/renderer.ts";
import type { CameraPose, Mesh } from "../webgl/scene.ts";
import { mixCamera } from "../webgl/timeline.ts";
import { defaultFigures, figureState } from "./article.ts";
import { makeArt } from "./art.ts";
import { deckSlides } from "./deck.ts";
import { moveWithBefore, stageState, watchState } from "./state.ts";
import type { WatchState } from "./state.ts";

const watch = makeArt(makeGlobe).art;
const slides = await deckSlides();
const [width, height] = watch.scene.slide;
const straps = watch.scene.pieces.filter(
  (piece) => piece.name === "strap" || piece.name === "raised strap",
);
const strapMeshes = new Set(straps.flatMap((piece) => [...piece.meshes]));

type Stage = ReturnType<typeof stageState>;

function showsStrap(meshes: ReadonlySet<Mesh>): boolean {
  return [...strapMeshes].some((mesh) => meshes.has(mesh));
}

/** The ends of the straps that `pose` shows, on the slide, that are not
 *  off it: none, if the strap is long enough. */
function endsInView(pose: CameraPose): string[] {
  const found: string[] = [];
  for (const piece of straps) {
    const extent = watch.extents.get(piece);
    assert.ok(extent, piece.name);
    const { box } = extent;
    for (const y of [box.top, box.bottom]) {
      const corners = [box.left, box.right].flatMap((x) =>
        [extent.bottom, extent.top].map((z) =>
          slidePoint(pose, watch.scene.slide, [x, y, z]),
        ),
      );
      const off =
        corners.every(([x]) => x < 0) ||
        corners.every(([x]) => x > width) ||
        corners.every(([, down]) => down < 0) ||
        corners.every(([, down]) => down > height);
      if (!off) found.push(`${piece.name} at y ${String(y)}`);
    }
  }
  return found;
}

/** Poses on the camera's way from `from` to `to`: together, or the view
 *  first or the angles first (`StageState.move`). */
function poses(from: Stage, to: Stage): CameraPose[] {
  const found: CameraPose[] = [];
  for (let step = 0; step <= 20; step++) {
    const part = step / 20;
    const angles = {
      tilt: from.tilt + (to.tilt - from.tilt) * part,
      turn: from.turn + (to.turn - from.turn) * part,
    };
    const mixed = mixCamera(from, to, part);
    found.push(
      mixed,
      { view: from.view, ...angles },
      { view: to.view, ...angles },
      { ...mixed, tilt: from.tilt, turn: from.turn },
      { ...mixed, tilt: to.tilt, turn: to.turn },
    );
  }
  return found;
}

/** Whether the strap shows while the camera moves from `from` to `to`: the
 *  pieces of both (within a slide, and by default between slides), of
 *  either with `artMoveWith: all`, and those that go after the move. */
function strapMoves(
  from: Stage,
  to: Stage,
  frontmatter: Record<string, unknown>,
  firstClick: boolean,
): boolean {
  const rule = firstClick
    ? moveWithBefore(frontmatter)
    : { rule: "common", also: [] };
  if (rule.rule === "none") return false;
  const either = showsStrap(from.shown) || showsStrap(to.shown);
  const both = showsStrap(from.shown) && showsStrap(to.shown);
  return (
    both ||
    (rule.rule === "all" && either) ||
    rule.also.some((name) => straps.some((piece) => piece.name === name)) ||
    showsStrap(to.goLater) ||
    (to.linger ?? []).some((group) => showsStrap(group.meshes))
  );
}

test("the strap's ends are off the slide at each click of the talk, and on the way", () => {
  const problems: string[] = [];
  let previous: { stage: Stage; where: string } | null = null;
  for (const slide of slides) {
    const total = Number(slide.frontmatter["clicks"] ?? 0);
    for (let clicks = 0; clicks <= total; clicks++) {
      const state: WatchState | undefined = watchState(
        slide.frontmatter,
        clicks,
      );
      if (!state) {
        previous = null;
        continue;
      }
      const stage = stageState(watch, state);
      const where = `${slide.title} @${String(clicks)}`;
      if (showsStrap(stage.shown)) {
        for (const end of endsInView(stage)) problems.push(`${where}: ${end}`);
      }
      if (
        previous &&
        strapMoves(previous.stage, stage, slide.frontmatter, clicks === 0)
      ) {
        for (const pose of poses(previous.stage, stage)) {
          for (const end of endsInView(pose)) {
            problems.push(`${previous.where} to ${where}: ${end}`);
          }
        }
      }
      previous = { stage, where };
    }
  }
  assert.deepEqual([...new Set(problems)], []);
});

test("the strap's ends are off the slide in each article figure, unturned", () => {
  const problems: string[] = [];
  for (const slide of slides) {
    const total = Number(slide.frontmatter["clicks"] ?? 0);
    for (const clicks of defaultFigures(watch, slide.frontmatter, total)) {
      const state = figureState(slide.frontmatter, clicks);
      if (!state) continue;
      const stage = stageState(watch, state);
      if (!showsStrap(stage.shown)) continue;
      for (const end of endsInView(stage)) {
        problems.push(`${slide.title} @${String(clicks)}: ${end}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

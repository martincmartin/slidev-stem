// Every slide's watch, as slides.md names it: each piece and view exists, at
// every click. A name that is wrong would otherwise throw only when the
// slide shows.

import assert from "node:assert/strict";
import { test } from "node:test";
import { deckSlides } from "./deck.ts";
import { generate } from "./generate.ts";
import { AtRest, discOutline } from "./at-rest.ts";
import { moveWithBefore, stageState, watchState } from "./state.ts";
import type { Mesh, Piece } from "../webgl/scene.ts";

const watch = generate();
const slides = await deckSlides();

test("every slide's pieces and view exist, at every click", () => {
  let shown = 0;
  for (const { title, frontmatter } of slides) {
    const clicks = Number(frontmatter["clicks"] ?? 0);
    for (let click = 0; click <= clicks; click++) {
      const state = watchState(frontmatter, click);
      if (!state) continue;
      shown++;
      const stage = stageState(watch, state, moveWithBefore(frontmatter));
      assert.ok(stage.shown.size > 0, `${title} @${String(click)}`);
    }
  }
  assert.ok(shown > 0, "no slide shows the watch");
});

test("no slide spins the train while the pallet fork shows: the escape wheel would turn through its stones", () => {
  for (const { title, frontmatter } of slides) {
    const clicks = Number(frontmatter["clicks"] ?? 0);
    for (let click = 0; click <= clicks; click++) {
      const state = watchState(frontmatter, click);
      if (!state?.spin) continue; // a spin's speed is never 0
      assert.ok(
        state.show !== "all" && !state.show.includes("pallet fork"),
        `${title} @${String(click)}`,
      );
    }
  }
});

test("the mainspring winds only where its outer end is held: by the stud, or in the barrel", () => {
  let seen = 0;
  for (const { title, frontmatter } of slides) {
    const clicks = Number(frontmatter["clicks"] ?? 0);
    for (let click = 0; click <= clicks; click++) {
      const state = watchState(frontmatter, click);
      if (!state?.mainspring) continue;
      seen++;
      const shows = (piece: string): boolean =>
        state.show === "all" || state.show.includes(piece);
      const holder = shows("barrel")
        ? "barrel"
        : shows("mainspring stud")
          ? "stud"
          : "nothing";
      const wanted = {
        free: "nothing",
        wound: "stud",
        released: "nothing",
        barrel: "barrel",
        "run down": "barrel",
      }[state.mainspring];
      assert.equal(holder, wanted, `${title} @${String(click)}`);
    }
  }
  assert.ok(seen > 0, "no slide tells the mainspring's story");
});

test("the Gears slide's gears show where they set the picture band: its view is the plan fit that drew them", () => {
  const gears = slides.find((slide) => slide.title === "Gears");
  assert.ok(gears);
  const state = watchState(gears.frontmatter, 0) ?? assert.fail();
  const view = stageState(watch, state).view;
  // the plan fit: the plan's height in 420 px, halfway between the
  // subtitle's baseline (110.7) and the slide's bottom
  const fit = state.fit;
  assert.ok(fit !== "all");
  const extents = watch.scene.pieces
    .filter((piece) => fit.includes(piece.name))
    .map((piece) => watch.extents.get(piece) ?? assert.fail());
  const top = Math.min(...extents.map((extent) => extent.box.top));
  const bottom = Math.max(...extents.map((extent) => extent.box.bottom));
  const scale = 420 / (bottom - top);
  const shiftY = (110.7 + 552) / 2 - (scale * (top + bottom)) / 2;
  assert.ok(
    Math.abs(view.scale / scale - 1) < 1e-4,
    `scale ${String(view.scale)}`,
  );
  assert.ok(
    Math.abs(view.shift[1] - shiftY) < 0.05,
    `shift ${String(view.shift[1])}`,
  );
});

test("no part that a click shows rises through a paper disc that it shows", () => {
  // A paper disc hides only what is under it (docs/watch.md, "Paper discs"):
  // a part that rose through it would show in the wheel's openings. Not the
  // wheel's own parts, such as its arbor. The watch is at rest: a part that
  // turns keeps its heights, but a part that is not round about its axis
  // is checked only where it is at rest.
  const atRest = new AtRest(watch);
  const { scene } = watch;
  const piece = (name: string): Piece =>
    scene.pieces.find((candidate) => candidate.name === name) ??
    assert.fail(name);
  const discOf = (wheel: Piece): Mesh =>
    [...wheel.meshes].find((mesh) => mesh.holdout) ?? assert.fail(wheel.name);
  // the centre arbor rises through the hour wheel's pipe, which hides it
  const allowed = new Map([
    [discOf(piece("hour wheel")), piece("centre arbor").meshes],
  ]);
  // each disc, and the parts that rise through it, found once
  const crossings = scene.meshes
    .filter((mesh) => mesh.holdout)
    .map((disc) => {
      const height = atRest.heights(disc)[0];
      const outline = discOutline(atRest, disc);
      // the wheel's groups; the disc itself is in the watch's
      const own = new Set(
        scene.pieces
          .filter((each) => each.meshes.has(disc))
          .flatMap((each) => [...each.meshes].map((mesh) => mesh.group)),
      );
      own.delete(disc.group);
      const through = scene.meshes.filter((mesh) => {
        if (mesh.holdout || own.has(mesh.group)) return false;
        if (allowed.get(disc)?.has(mesh)) return false;
        const over = outline.heightsOver(atRest.points(mesh));
        return over !== null && over[0] < height && over[1] > height;
      });
      return { disc, through };
    });
  for (const { title, frontmatter } of slides) {
    const clicks = Number(frontmatter["clicks"] ?? 0);
    for (let click = 0; click <= clicks; click++) {
      const state = watchState(frontmatter, click);
      if (!state) continue;
      const { shown } = stageState(watch, state);
      for (const { disc, through } of crossings) {
        if (!shown.has(disc)) continue;
        for (const mesh of through) {
          assert.ok(
            !shown.has(mesh),
            `${title} @${String(click)}: ${mesh.name} rises through ${disc.name}`,
          );
        }
      }
    }
  }
});

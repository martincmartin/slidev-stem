import assert from "node:assert/strict";
import { test } from "node:test";
import { INKS, INVERSE_FLASH_INKS } from "./scene.ts";
import type { Mesh, View } from "./scene.ts";
import {
  FADE_SECONDS,
  FLASH_CYCLES,
  FLASH_OFF_SECONDS,
  FLASH_ON_SECONDS,
  FLASH_SECONDS,
  MOVE_SECONDS,
  TILT_SECONDS,
  Timeline,
  flashIsOn,
} from "./timeline.ts";
import type { StageState } from "./timeline.ts";

test("a flash is five cycles of 0.25 s on and 0.25 s off", () => {
  assert.equal(FLASH_CYCLES, 5);
  assert.equal(FLASH_ON_SECONDS, 0.25);
  assert.equal(FLASH_OFF_SECONDS, 0.25);
  assert.equal(FLASH_SECONDS, 2.5);
});

test("a flash is on in the first part of each cycle, and ends off", () => {
  for (let cycle = 0; cycle < FLASH_CYCLES; cycle++) {
    const start = cycle * (FLASH_ON_SECONDS + FLASH_OFF_SECONDS);
    assert.equal(flashIsOn(start), true, `${String(start)} s`);
    assert.equal(flashIsOn(start + 0.2), true, `${String(start + 0.2)} s`);
    assert.equal(flashIsOn(start + 0.25), false, `${String(start + 0.25)} s`);
    assert.equal(flashIsOn(start + 0.45), false, `${String(start + 0.45)} s`);
  }
  for (const outside of [-0.1, FLASH_SECONDS, FLASH_SECONDS + 0.1]) {
    assert.equal(flashIsOn(outside), false, `${String(outside)} s`);
  }
});

// ---- the one rule -----------------------------------------------------------

const view = (name: string, scale: number): View => ({
  name,
  scale,
  shift: [0, 0],
  pivot: [0, 0, 0],
});
const WIDE = view("wide", 1);
const CLOSE = view("close", 3);
const FAR = view("far", 5);
/** A mesh that the timeline only compares by identity. */
function mesh(name: string): Mesh {
  return { name } as unknown as Mesh;
}
const SPRING = mesh("spring");
const BALANCE = mesh("balance");
const CASE = mesh("case");
const ALL: ReadonlySet<Mesh> = new Set([SPRING, BALANCE, CASE]);
const set = (...meshes: Mesh[]): ReadonlySet<Mesh> => new Set(meshes);

function state(options: Partial<StageState> & { view: View }): StageState {
  return {
    tilt: 0,
    shown: ALL,
    flash: null,
    later: set(),
    cut: set(),
    goLater: set(),
    moveWith: "common",
    ...options,
  };
}

const MOVE = MOVE_SECONDS * 1000;
const TILT = TILT_SECONDS * 1000;
const FADE = FADE_SECONDS * 1000;

function timelineAt(initial: StageState): Timeline {
  const timeline = new Timeline();
  timeline.show(initial, 0, true);
  return timeline;
}

test("the first state is shown at once, with no phase", () => {
  const timeline = new Timeline();
  assert.equal(timeline.hasState, false);
  const flashSeconds = timeline.show(
    state({ view: CLOSE, tilt: 20, shown: set(SPRING), flash: set(SPRING) }),
    0,
  );
  assert.equal(flashSeconds, 0);
  assert.equal(timeline.hasState, true);
  assert.deepEqual(timeline.valuesAt(0), {
    view: CLOSE,
    tilt: 20,
    keep: set(SPRING),
    fade: set(),
    rest: 1,
  });
  assert.equal(timeline.phaseAt(0), null);
});

test("the later meshes fade in after the others, and then the flash plays", () => {
  const timeline = timelineAt(state({ view: WIDE, shown: set(SPRING) }));
  timeline.show(
    state({
      view: WIDE,
      shown: ALL,
      later: set(CASE),
      flash: set(BALANCE),
    }),
    0,
  );
  assert.deepEqual(timeline.valuesAt(FADE / 2).fade, set(BALANCE));
  const later = timeline.valuesAt(FADE + FADE / 2);
  assert.deepEqual(later.keep, set(SPRING, BALANCE));
  assert.deepEqual(later.fade, set(CASE));
  assert.equal(timeline.flashingAt(FADE + FADE / 2), null);
  assert.deepEqual(timeline.flashingAt(2 * FADE), set(BALANCE));
  assert.deepEqual(timeline.valuesAt(2 * FADE).keep, ALL);
  assert.equal(timeline.endAt(0), 2 * FADE + FLASH_SECONDS * 1000);
  assert.equal(timeline.endAt(9000), 9000);
});

test("valuesAt before any state throws", () => {
  assert.throws(() => new Timeline().valuesAt(0), /no state/);
});

test("by default the old meshes fade out, the camera moves with the common ones, then the new ones fade in", () => {
  const timeline = timelineAt(state({ view: WIDE, shown: set(SPRING, CASE) }));
  timeline.show(state({ view: CLOSE, shown: set(SPRING, BALANCE) }), 0);
  assert.equal(timeline.phaseAt(0), "fade");
  const going = timeline.valuesAt(FADE / 2);
  assert.deepEqual(going.keep, set(SPRING));
  assert.deepEqual(going.fade, set(CASE));
  assert.ok(going.rest > 0 && going.rest < 1);
  assert.equal(timeline.phaseAt(FADE), "view");
  const moving = timeline.valuesAt(FADE + MOVE / 2);
  assert.deepEqual(moving.keep, set(SPRING));
  assert.equal(moving.fade.size, 0);
  assert.ok(moving.view.scale > WIDE.scale && moving.view.scale < CLOSE.scale);
  assert.equal(timeline.phaseAt(FADE + MOVE), "fade");
  const coming = timeline.valuesAt(FADE + MOVE + FADE / 2);
  assert.deepEqual(coming.fade, set(BALANCE));
  assert.deepEqual(timeline.valuesAt(2 * FADE + MOVE), {
    view: CLOSE,
    tilt: 0,
    keep: set(SPRING, BALANCE),
    fade: set(),
    rest: 1,
  });
  assert.equal(timeline.phaseAt(2 * FADE + MOVE), null);
});

test("zooming in, the camera moves and then tilts; zooming out, it untilts and then moves", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE, tilt: 30 }), 0);
  assert.equal(timeline.phaseAt(0), "view");
  assert.equal(timeline.phaseAt(MOVE), "tilt");
  assert.equal(timeline.valuesAt(MOVE + TILT).tilt, 30);
  timeline.show(state({ view: WIDE }), 10_000);
  assert.equal(timeline.phaseAt(10_000), "tilt");
  assert.equal(timeline.phaseAt(10_000 + TILT), "view");
  assert.equal(timeline.valuesAt(10_000 + TILT + MOVE).view, WIDE);
});

test("with moveWith all, the new meshes fade in first and the camera moves with both", () => {
  // the opening: the whole watch is on the screen while the camera zooms in
  const timeline = timelineAt(state({ view: WIDE, shown: set(SPRING) }));
  timeline.show(
    state({ view: CLOSE, shown: set(BALANCE), moveWith: "all" }),
    0,
  );
  assert.equal(timeline.phaseAt(0), "fade");
  assert.deepEqual(timeline.valuesAt(FADE / 2).fade, set(BALANCE));
  const moving = timeline.valuesAt(FADE + MOVE / 2);
  assert.deepEqual(moving.keep, set(SPRING, BALANCE));
  assert.equal(timeline.phaseAt(FADE + MOVE), "fade");
  assert.deepEqual(timeline.valuesAt(FADE + MOVE + FADE / 2).fade, set(SPRING));
  assert.deepEqual(timeline.valuesAt(2 * FADE + MOVE).keep, set(BALANCE));
});

test("with nothing on the screen during the move, the camera jumps", () => {
  for (const [moveWith, from, to] of [
    ["none", set(SPRING, CASE), set(SPRING, BALANCE)],
    ["common", set(SPRING), set(BALANCE)],
  ] as const) {
    const timeline = timelineAt(state({ view: WIDE, shown: from }));
    timeline.show(state({ view: CLOSE, tilt: 20, shown: to, moveWith }), 0);
    // the old picture fades out; the text waits for it
    assert.deepEqual(timeline.valuesAt(FADE / 2).fade, from);
    assert.equal(timeline.viewEndAt(0), FADE, moveWith);
    const jumped = timeline.valuesAt(FADE);
    assert.equal(jumped.view, CLOSE);
    assert.equal(jumped.tilt, 20);
    assert.equal(jumped.keep.size, 0);
    assert.deepEqual(timeline.valuesAt(FADE + FADE / 2).fade, to);
    assert.deepEqual(timeline.valuesAt(2 * FADE).keep, to);
    assert.equal(timeline.phaseAt(2 * FADE), null);
  }
});

test("without a camera move, the old meshes fade out and then the new ones fade in", () => {
  const timeline = timelineAt(state({ view: CLOSE, shown: set(SPRING) }));
  timeline.show(state({ view: CLOSE, shown: set(BALANCE) }), 0);
  assert.deepEqual(timeline.valuesAt(FADE / 2).fade, set(SPRING));
  assert.deepEqual(timeline.valuesAt(FADE + FADE / 2).fade, set(BALANCE));
  assert.equal(timeline.phaseAt(2 * FADE), null);
});

test("to a set that holds the old one, only the difference fades in, and back", () => {
  const timeline = timelineAt(state({ view: CLOSE, shown: set(SPRING) }));
  timeline.show(state({ view: CLOSE, shown: set(SPRING, BALANCE) }), 0);
  const growing = timeline.valuesAt(FADE / 2);
  assert.deepEqual(growing.keep, set(SPRING));
  assert.deepEqual(growing.fade, set(BALANCE));
  assert.equal(timeline.phaseAt(FADE), null);
  timeline.show(state({ view: CLOSE, shown: set(SPRING) }), FADE);
  const shrinking = timeline.valuesAt(FADE + FADE / 2);
  assert.deepEqual(shrinking.keep, set(SPRING));
  assert.deepEqual(shrinking.fade, set(BALANCE));
  assert.deepEqual(timeline.valuesAt(2 * FADE).keep, set(SPRING));
});

test("in another view: the camera moves with the smaller set, then the difference fades in; back, the reverse", () => {
  const timeline = timelineAt(state({ view: CLOSE, shown: set(SPRING) }));
  timeline.show(
    state({ view: WIDE, tilt: 20, shown: set(SPRING, BALANCE) }),
    0,
  );
  assert.equal(timeline.phaseAt(0), "tilt");
  assert.equal(timeline.phaseAt(TILT), "view");
  assert.deepEqual(timeline.valuesAt(TILT + MOVE / 2).keep, set(SPRING));
  assert.equal(timeline.viewEndAt(0), TILT + MOVE);
  assert.equal(timeline.phaseAt(TILT + MOVE), "fade");
  const back = TILT + MOVE + FADE;
  timeline.show(state({ view: CLOSE, shown: set(SPRING) }), back);
  assert.equal(timeline.phaseAt(back), "fade");
  assert.equal(timeline.phaseAt(back + FADE), "view");
  assert.equal(timeline.phaseAt(back + FADE + MOVE), "tilt");
  assert.equal(timeline.viewEndAt(back), back + FADE + MOVE);
});

test("a fade cut short ends at 1 if the new state shows its meshes, else at 0, with no jump", () => {
  for (const [next, keep] of [
    [ALL, ALL],
    [set(SPRING), set(SPRING)],
  ] as const) {
    const timeline = timelineAt(state({ view: CLOSE, shown: set(SPRING) }));
    timeline.show(state({ view: CLOSE, shown: set(SPRING, BALANCE) }), 0);
    const cut = timeline.valuesAt(FADE / 2);
    timeline.show(state({ view: CLOSE, shown: next }), FADE / 2);
    assert.equal(timeline.valuesAt(FADE / 2).rest, cut.rest);
    assert.deepEqual(timeline.valuesAt(FADE / 2).fade, set(BALANCE));
    const settled = FADE / 2 + FADE;
    // to the whole set: the balance ends at 1, then the case fades in
    const end = timeline.valuesAt(next === ALL ? settled + FADE : settled);
    assert.deepEqual(end.keep, keep);
    assert.equal(end.fade.size, 0);
  }
});

test("a new state during a camera move starts from what is shown, with no jump", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE }), 0);
  const before = timeline.valuesAt(900);
  timeline.show(state({ view: FAR }), 900);
  const after = timeline.valuesAt(900);
  assert.equal(before.view.name, "wide to close");
  assert.equal(after.view.scale, before.view.scale);
  assert.deepEqual(after.view.shift, before.view.shift);
  assert.deepEqual(after.view.pivot, before.view.pivot);
  assert.equal(timeline.valuesAt(900 + MOVE).view, FAR);
});

test("a state that changes nothing has no phase and no flash", () => {
  const timeline = timelineAt(state({ view: CLOSE, tilt: 10 }));
  assert.equal(
    timeline.show(state({ view: CLOSE, tilt: 10, flash: set(SPRING) }), 100),
    0,
  );
  assert.equal(timeline.phaseAt(100), null);
  assert.equal(timeline.flashingAt(100), null);
});

test("an equal view that is another object does not move the camera", () => {
  const timeline = timelineAt(state({ view: CLOSE }));
  timeline.show(state({ view: view("close again", 3) }), 0);
  assert.equal(timeline.phaseAt(0), null);
});

// ---- the flash -------------------------------------------------------------------

test("shown at once, a state has no phase and no flash", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  assert.equal(
    timeline.show(state({ view: CLOSE, flash: set(SPRING) }), 0, true),
    0,
  );
  assert.equal(timeline.phaseAt(0), null);
  assert.equal(timeline.valuesAt(0).view, CLOSE);
});

test("a flash of meshes on the screen plays first, and the change waits for it", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  const seconds = timeline.show(
    state({
      view: CLOSE,
      tilt: 20,
      shown: set(SPRING),
      flash: set(SPRING, BALANCE),
      moveWith: "all",
    }),
    0,
  );
  assert.equal(seconds, FLASH_SECONDS);
  const flashEnd = FLASH_SECONDS * 1000;
  assert.equal(timeline.phaseAt(0), "flash");
  assert.deepEqual(timeline.flashingAt(0), set(SPRING, BALANCE));
  assert.equal(timeline.flashingAt(FLASH_ON_SECONDS * 1000), null);
  assert.equal(timeline.valuesAt(flashEnd - 1).view, WIDE);
  assert.equal(timeline.phaseAt(flashEnd), "view");
  assert.equal(timeline.phaseAt(flashEnd + MOVE), "tilt");
  assert.equal(timeline.phaseAt(flashEnd + MOVE + TILT), "fade");
  assert.deepEqual(
    timeline.valuesAt(flashEnd + MOVE + TILT + FADE).keep,
    set(SPRING),
  );
});

test("a flash of meshes that fade in plays when they are in", () => {
  const timeline = timelineAt(state({ view: CLOSE, shown: set(SPRING) }));
  const seconds = timeline.show(
    state({ view: CLOSE, shown: set(SPRING, BALANCE), flash: set(BALANCE) }),
    0,
  );
  assert.equal(seconds, FADE_SECONDS + FLASH_SECONDS);
  assert.equal(timeline.flashingAt(FADE - 1), null);
  assert.deepEqual(timeline.flashingAt(FADE), set(BALANCE));
  assert.equal(timeline.phaseAt(FADE + 1), "flash");
});

test("a click during a flash of the same meshes does not start it again", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  const flashed = { shown: set(SPRING), flash: set(SPRING) };
  timeline.show(state({ view: CLOSE, ...flashed }), 0);
  const seconds = timeline.show(state({ view: FAR, ...flashed }), 1000);
  assert.equal(seconds, FLASH_SECONDS - 1);
  assert.equal(timeline.phaseAt(FLASH_SECONDS * 1000), "fade");
});

test("a waiting flash cut short during its fade: the fade ends first, then the camera moves, then it flashes", () => {
  // the balance fades in and would flash at FADE; at FADE / 2 a click asks
  // for the same pieces and flash in another view
  const flashed = { shown: set(SPRING, BALANCE), flash: set(BALANCE) };
  const timeline = timelineAt(state({ view: WIDE, shown: set(SPRING) }));
  timeline.show(state({ view: WIDE, ...flashed }), 0);
  const cut = FADE / 2;
  const seconds = timeline.show(state({ view: CLOSE, ...flashed }), cut);
  // the half-visible balance goes on fading in at once: it does not freeze
  assert.equal(timeline.phaseAt(cut), "fade");
  assert.ok(
    timeline.valuesAt(cut + FADE / 2).rest > timeline.valuesAt(cut).rest,
  );
  assert.equal(timeline.flashingAt(cut + FADE / 2), null);
  // then the camera moves, with no flash during it
  assert.equal(timeline.phaseAt(cut + FADE), "view");
  assert.equal(timeline.flashingAt(cut + FADE + MOVE / 2), null);
  // the flash plays when the change ends
  const end = cut + FADE + MOVE;
  assert.deepEqual(timeline.flashingAt(end), set(BALANCE));
  assert.equal(seconds, (end - cut) / 1000 + FLASH_SECONDS);
});

test("a flash that has started goes on through a new state, and the change waits for it", () => {
  const flashed = { shown: set(SPRING, BALANCE), flash: set(BALANCE) };
  const timeline = timelineAt(state({ view: WIDE, shown: set(SPRING) }));
  timeline.show(state({ view: WIDE, ...flashed }), 0);
  // the flash starts at FADE; a click comes 1 s into it
  const click = FADE + 1000;
  assert.equal(timeline.phaseAt(click), "flash");
  const seconds = timeline.show(state({ view: CLOSE, ...flashed }), click);
  assert.equal(seconds, FLASH_SECONDS - 1);
  assert.deepEqual(timeline.flashingAt(click), set(BALANCE));
  const flashEnd = FADE + FLASH_SECONDS * 1000;
  assert.equal(timeline.valuesAt(flashEnd - 1).view, WIDE);
  assert.equal(timeline.phaseAt(flashEnd), "view");
});

test("a flash of other meshes starts from the click", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE, flash: set(SPRING) }), 0);
  const seconds = timeline.show(
    state({ view: FAR, flash: set(BALANCE) }),
    1000,
  );
  assert.equal(seconds, FLASH_SECONDS);
  assert.deepEqual(timeline.flashingAt(1000), set(BALANCE));
});

test("a flash that has ended does not go on", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE, flash: set(SPRING) }), 0);
  const later = FLASH_SECONDS * 1000 + 10;
  const seconds = timeline.show(
    state({ view: WIDE, flash: set(SPRING) }),
    later,
  );
  assert.equal(seconds, FLASH_SECONDS);
});

test("text waits for the camera: first towards a close view, last away from it", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(
    state({ view: CLOSE, tilt: 20, shown: set(SPRING), moveWith: "all" }),
    1000,
  );
  assert.equal(timeline.viewEndAt(1000), 1000 + MOVE);
  timeline.show(state({ view: WIDE, moveWith: "all" }), 10_000);
  assert.equal(timeline.viewEndAt(10_000), 10_000 + FADE + TILT + MOVE);
  // after the move, or with no move, there is nothing to wait for
  assert.equal(timeline.viewEndAt(20_000), 20_000);
});

test("a text-only inverse cue waits for the text fade and runs five cycles", () => {
  const timeline = new Timeline();
  timeline.show(state({ view: WIDE }), 0);
  const cue = state({
    view: WIDE,
    flash: set(SPRING),
    flashDelay: 0.4,
    flashInverse: true,
  });
  assert.equal(timeline.show(cue, 100), 0.4 + FLASH_SECONDS);
  assert.equal(timeline.recolourAt(499), undefined);
  assert.equal(timeline.phaseAt(499), null);
  for (let cycle = 0; cycle < FLASH_CYCLES; cycle++) {
    const start = 500 + cycle * 500;
    assert.deepEqual(timeline.recolourAt(start)?.meshes, set(SPRING));
    assert.equal(timeline.recolourAt(start)?.inks, INVERSE_FLASH_INKS);
    assert.equal(
      timeline.recolourAt(start)?.inks.get(INKS.second),
      INKS.subject,
    );
    assert.equal(
      timeline.recolourAt(start)?.inks.get(INKS.secondWash),
      INKS.subjectWash,
    );
    assert.equal(timeline.recolourAt(start + 250), undefined);
    assert.equal(timeline.recolourAt(start + 499), undefined);
  }
  assert.equal(timeline.recolourAt(3000), undefined);
  assert.equal(timeline.endAt(100), 3000);
  assert.deepEqual(timeline.valuesAt(100).keep, ALL);
});

test("a queued text cue is cancelled by another target or a jump", () => {
  for (const instantly of [false, true]) {
    const timeline = new Timeline();
    timeline.show(state({ view: WIDE }), 0);
    timeline.show(
      state({ view: WIDE, flash: set(SPRING), flashDelay: 0.4 }),
      100,
    );
    timeline.show(state({ view: WIDE, flash: null }), 200, instantly);
    assert.equal(timeline.recolourAt(500), undefined);
    assert.equal(timeline.endAt(200), 200);
  }
});

test("a delayed cue waits for an interrupted mesh fade to finish", () => {
  const timeline = new Timeline();
  timeline.show(state({ view: WIDE, shown: set(SPRING) }), 0);
  timeline.show(state({ view: WIDE, shown: set(SPRING, BALANCE) }), 100);
  timeline.show(
    state({
      view: WIDE,
      shown: set(SPRING, BALANCE),
      flash: set(BALANCE),
      flashDelay: 0.4,
    }),
    200,
  );
  assert.equal(timeline.flashingAt(999), null);
  assert.deepEqual(timeline.flashingAt(1000), set(BALANCE));
  assert.equal(timeline.valuesAt(1000).rest, 1);
});

test("a go-later mesh stays on the screen while the camera moves, and goes after it", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(
    state({ view: CLOSE, shown: set(SPRING), goLater: set(BALANCE) }),
    1000,
  );
  // the case fades out first, alone
  const first = timeline.valuesAt(1000 + FADE / 2);
  assert.deepEqual(first.fade, set(CASE));
  assert.ok(first.keep.has(BALANCE));
  // the balance stays while the camera moves
  const moving = timeline.valuesAt(1000 + FADE + MOVE / 2);
  assert.equal(moving.fade.size, 0);
  assert.deepEqual(moving.keep, set(SPRING, BALANCE));
  assert.ok(moving.view.scale > WIDE.scale && moving.view.scale < CLOSE.scale);
  // then it fades out
  const after = timeline.valuesAt(1000 + FADE + MOVE + FADE / 2);
  assert.deepEqual(after.fade, set(BALANCE));
  assert.equal(after.view.scale, CLOSE.scale);
  assert.equal(timeline.endAt(1000), 1000 + FADE + MOVE + FADE);
});

test("a cut mesh goes at once, and the others then fade as usual", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(
    state({ view: WIDE, shown: set(SPRING), cut: set(BALANCE) }),
    1000,
  );
  const next = timeline.valuesAt(1000);
  // the balance is gone at once; the case fades out
  assert.ok(!next.keep.has(BALANCE) && !next.fade.has(BALANCE));
  assert.ok(next.fade.has(CASE));
  assert.equal(timeline.endAt(1000), 1000 + FADE);
  // and comes back at once
  timeline.show(state({ view: WIDE, cut: set(BALANCE) }), 5000);
  const back = timeline.valuesAt(5000);
  assert.ok(back.keep.has(BALANCE));
});

import assert from "node:assert/strict";
import { test } from "node:test";
import type { Mesh, View } from "./scene.ts";
import {
  DIM_SECONDS,
  FADE_SECONDS,
  FLASH_CYCLES,
  FLASH_OFF_SECONDS,
  FLASH_ON_SECONDS,
  FLASH_SECONDS,
  MOVE_SECONDS,
  ANGLES_SECONDS,
  TOGETHER_SECONDS,
  Timeline,
  flashIsOn,
  mixCamera,
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
    turn: 0,
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
const ANGLES = ANGLES_SECONDS * 1000;
const TOGETHER = TOGETHER_SECONDS * 1000;
const FADE = FADE_SECONDS * 1000;

function timelineAt(initial: StageState): Timeline {
  const timeline = new Timeline();
  timeline.show(initial, 0, true);
  return timeline;
}

test("outgoing meshes linger alone for one second, then fade before the camera changes", () => {
  const arrow = mesh("torque arrow");
  const timeline = timelineAt(state({ view: WIDE, shown: set(CASE, arrow) }));
  timeline.show(
    state({
      view: CLOSE,
      shown: set(SPRING),
      linger: [{ meshes: set(arrow), seconds: 1 }],
    }),
    0,
  );
  assert.deepEqual(timeline.valuesAt(FADE / 2).keep, set(arrow));
  assert.deepEqual(timeline.valuesAt(FADE / 2).fade, set(CASE));
  for (const time of [FADE, FADE + 500, FADE + 999]) {
    const values = timeline.valuesAt(time);
    assert.deepEqual(values.keep, set(arrow));
    assert.deepEqual(values.fade, set());
    assert.equal(values.view, WIDE);
    assert.equal(timeline.phaseAt(time), "hold");
  }
  const leaving = timeline.valuesAt(FADE + 1000 + FADE / 2);
  assert.deepEqual(leaving.keep, set());
  assert.deepEqual(leaving.fade, set(arrow));
  assert.equal(leaving.rest, 0.5);
  assert.equal(leaving.view, WIDE);
  const arriving = timeline.valuesAt(2 * FADE + 1000);
  assert.equal(arriving.view, CLOSE);
  assert.deepEqual(arriving.fade, set(SPRING));
  assert.equal(timeline.viewEndAt(0), 2 * FADE + 1000);
  assert.deepEqual(timeline.valuesAt(3 * FADE + 1000).keep, set(SPRING));
});

test("a jump skips the linger, and an interrupted hold restores the earlier state", () => {
  const arrow = mesh("torque arrow");
  const before = state({ view: WIDE, shown: set(CASE, arrow) });
  const after = state({
    view: CLOSE,
    shown: set(SPRING),
    linger: [{ meshes: set(arrow), seconds: 1 }],
  });
  const timeline = timelineAt(before);
  timeline.show(after, 0);
  timeline.show(before, FADE + 500);
  assert.deepEqual(timeline.valuesAt(FADE + 500).keep, set(arrow));
  assert.equal(timeline.phaseAt(FADE + 500), "fade");
  assert.deepEqual(timeline.valuesAt(2 * FADE + 500).keep, before.shown);
  assert.equal(timeline.phaseAt(2 * FADE + 500), null);
  timeline.show(after, 2 * FADE + 500, true);
  assert.deepEqual(timeline.valuesAt(2 * FADE + 500).keep, after.shown);
  assert.equal(timeline.phaseAt(2 * FADE + 500), null);
});

test("linger ignores meshes that do not leave and rejects invalid durations", () => {
  const before = state({ view: WIDE, shown: set(CASE) });
  const timeline = timelineAt(before);
  timeline.show({ ...before, linger: [{ meshes: set(CASE), seconds: 1 }] }, 0);
  assert.equal(timeline.phaseAt(0), null);
  for (const seconds of [0, -1, Number.NaN, Infinity]) {
    assert.throws(
      () =>
        timeline.show(
          { ...before, linger: [{ meshes: set(CASE), seconds }] },
          0,
        ),
      /linger seconds/,
    );
  }
});

test("two outgoing groups pause and fade in order before the camera changes", () => {
  const arrow = mesh("torque arrow");
  const before = state({ view: WIDE, shown: set(CASE, BALANCE, arrow) });
  const after = state({
    view: CLOSE,
    shown: set(SPRING),
    linger: [
      { meshes: set(BALANCE), seconds: 1 },
      { meshes: set(arrow), seconds: 1 },
    ],
  });
  const timeline = timelineAt(before);
  timeline.show(after, 0);
  assert.deepEqual(timeline.valuesAt(FADE / 2).keep, set(BALANCE, arrow));
  assert.deepEqual(timeline.valuesAt(FADE / 2).fade, set(CASE));
  for (const offset of [0, 500, 999]) {
    const first = timeline.valuesAt(FADE + offset);
    assert.deepEqual(first.keep, set(BALANCE, arrow));
    assert.deepEqual(first.fade, set());
    assert.equal(first.view, WIDE);
    assert.equal(timeline.phaseAt(FADE + offset), "hold");
    const second = timeline.valuesAt(2 * FADE + 1000 + offset);
    assert.deepEqual(second.keep, set(arrow));
    assert.deepEqual(second.fade, set());
    assert.equal(second.view, WIDE);
    assert.equal(timeline.phaseAt(2 * FADE + 1000 + offset), "hold");
  }
  assert.deepEqual(
    timeline.valuesAt(FADE + 1000 + FADE / 2).fade,
    set(BALANCE),
  );
  assert.deepEqual(
    timeline.valuesAt(2 * FADE + 2000 + FADE / 2).fade,
    set(arrow),
  );
  assert.equal(timeline.viewEndAt(0), 3 * FADE + 2000);
  assert.deepEqual(timeline.valuesAt(4 * FADE + 2000).keep, set(SPRING));
  for (const time of [FADE + 500, 2 * FADE + 1500]) {
    const interrupted = timelineAt(before);
    interrupted.show(after, 0);
    interrupted.show(before, time);
    assert.equal(interrupted.phaseAt(time), "fade");
    assert.deepEqual(interrupted.valuesAt(time + FADE).keep, before.shown);
    assert.equal(interrupted.phaseAt(time + FADE), null);
  }
  assert.throws(
    () =>
      timeline.show(
        {
          ...after,
          linger: [
            { meshes: set(arrow), seconds: 1 },
            { meshes: set(arrow), seconds: 1 },
          ],
        },
        0,
      ),
    /only one linger group/,
  );
});

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
    turn: 0,
    keep: set(SPRING),
    fade: set(),
    rest: 1,
    dim: new Map(),
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
    turn: 0,
    keep: set(SPRING, BALANCE),
    fade: set(),
    rest: 1,
    dim: new Map(),
  });
  assert.equal(timeline.phaseAt(2 * FADE + MOVE), null);
});

test("a dim eases after the camera moves and the old meshes fade out, before the new ones fade in", () => {
  const timeline = timelineAt(state({ view: WIDE, shown: set(SPRING, CASE) }));
  const dimmed = new Map([[CASE, 0.35]]);
  timeline.show(
    state({ view: CLOSE, shown: set(CASE, BALANCE), dim: dimmed }),
    0,
  );
  // the spring fades out; the camera moves with the case, still bright
  assert.equal(timeline.valuesAt(FADE + MOVE / 2).dim.size, 0);
  assert.equal(timeline.phaseAt(FADE + MOVE), "dim");
  const easing = timeline.valuesAt(FADE + MOVE + DIM_SECONDS * 500);
  const weight = easing.dim.get(CASE) ?? 1;
  assert.ok(weight > 0.35 && weight < 1, String(weight));
  // then the balance fades in, with the case dimmed
  assert.equal(timeline.phaseAt(FADE + MOVE + DIM_SECONDS * 1000), "fade");
  const end = FADE + MOVE + DIM_SECONDS * 1000 + FADE;
  assert.deepEqual(timeline.valuesAt(end).dim, dimmed);
  assert.equal(timeline.endAt(0), end);
  // the end of a dim eases too, from where it is
  timeline.show(state({ view: CLOSE, shown: set(CASE, BALANCE) }), 20_000);
  assert.equal(timeline.phaseAt(20_000), "dim");
  assert.deepEqual(
    timeline.valuesAt(20_000 + DIM_SECONDS * 1000).dim,
    new Map(),
  );
  // a state with the same dim changes nothing
  timeline.show(state({ view: CLOSE, shown: set(CASE, BALANCE) }), 30_000);
  assert.equal(timeline.phaseAt(30_000), null);
});

test("the camera tilts and turns at the same time, in one phase", () => {
  const timeline = timelineAt(state({ view: CLOSE }));
  timeline.show(state({ view: CLOSE, tilt: 30, turn: 90 }), 0);
  assert.equal(timeline.phaseAt(0), "angles");
  const half = timeline.valuesAt(ANGLES / 2);
  // eased the same: each is the same fraction of its way
  assert.ok(half.tilt > 0 && half.tilt < 30, `tilt ${String(half.tilt)}`);
  assert.equal(half.turn / 90, half.tilt / 30);
  const end = timeline.valuesAt(ANGLES);
  assert.equal(end.tilt, 30);
  assert.equal(end.turn, 90);
  // a turn alone is a change of the angles too
  timeline.show(state({ view: CLOSE, tilt: 30, turn: -45 }), ANGLES);
  assert.equal(timeline.phaseAt(ANGLES), "angles");
  assert.equal(timeline.valuesAt(2 * ANGLES).turn, -45);
});

test("zooming in, the camera moves and then changes its angles; zooming out, the reverse", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE, tilt: 30 }), 0);
  assert.equal(timeline.phaseAt(0), "view");
  assert.equal(timeline.phaseAt(MOVE), "angles");
  assert.equal(timeline.valuesAt(MOVE + ANGLES).tilt, 30);
  timeline.show(state({ view: WIDE }), 10_000);
  assert.equal(timeline.phaseAt(10_000), "angles");
  assert.equal(timeline.phaseAt(10_000 + ANGLES), "view");
  assert.equal(timeline.valuesAt(10_000 + ANGLES + MOVE).view, WIDE);
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
  assert.equal(timeline.phaseAt(0), "angles");
  assert.equal(timeline.phaseAt(ANGLES), "view");
  assert.deepEqual(timeline.valuesAt(ANGLES + MOVE / 2).keep, set(SPRING));
  assert.equal(timeline.viewEndAt(0), ANGLES + MOVE);
  assert.equal(timeline.phaseAt(ANGLES + MOVE), "fade");
  const back = ANGLES + MOVE + FADE;
  timeline.show(state({ view: CLOSE, shown: set(SPRING) }), back);
  assert.equal(timeline.phaseAt(back), "fade");
  assert.equal(timeline.phaseAt(back + FADE), "view");
  assert.equal(timeline.phaseAt(back + FADE + MOVE), "angles");
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
  assert.equal(timeline.phaseAt(flashEnd + MOVE), "angles");
  assert.equal(timeline.phaseAt(flashEnd + MOVE + ANGLES), "fade");
  assert.deepEqual(
    timeline.valuesAt(flashEnd + MOVE + ANGLES + FADE).keep,
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
  assert.equal(timeline.viewEndAt(10_000), 10_000 + FADE + ANGLES + MOVE);
  // after the move, or with no move, there is nothing to wait for
  assert.equal(timeline.viewEndAt(20_000), 20_000);
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

test("with move: together, the camera moves, zooms, tilts and turns in one phase", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(
    state({ view: CLOSE, tilt: 40, turn: 80, move: "together" }),
    0,
  );
  assert.equal(timeline.phaseAt(0), "camera");
  const half = timeline.valuesAt(TOGETHER / 2);
  // the scale evenly in its logarithm; the angles evenly
  assert.ok(
    Math.abs(half.view.scale - Math.sqrt(WIDE.scale * CLOSE.scale)) < 1e-9,
  );
  assert.ok(Math.abs(half.tilt - 20) < 1e-9);
  assert.ok(Math.abs(half.turn - 40) < 1e-9);
  assert.equal(timeline.viewEndAt(0), TOGETHER);
  const end = timeline.valuesAt(TOGETHER);
  assert.equal(end.view, CLOSE);
  assert.equal(end.tilt, 40);
  assert.equal(end.turn, 80);
  assert.equal(timeline.phaseAt(TOGETHER), null);
});

test("mixCamera keeps each end, and moves the pivot's place on the slide evenly", () => {
  const first = {
    view: { name: "a", scale: 2, shift: [100, 50], pivot: [10, 20, 0] },
    tilt: 0,
    turn: 0,
  } as const;
  const second = {
    view: { name: "b", scale: 8, shift: [-300, -100], pivot: [60, 40, 5] },
    tilt: 80,
    turn: -10,
  } as const;
  const onSlide = (view: View): [number, number] => [
    view.scale * view.pivot[0] + view.shift[0],
    view.scale * view.pivot[1] + view.shift[1],
  ];
  for (const [fraction, end] of [
    [0, first],
    [1, second],
  ] as const) {
    const mixed = mixCamera(first, second, fraction);
    assert.ok(Math.abs(mixed.view.scale - end.view.scale) < 1e-9);
    for (const [axis, value] of mixed.view.pivot.entries()) {
      assert.ok(Math.abs(value - (end.view.pivot[axis] ?? NaN)) < 1e-9);
    }
    for (const [axis, value] of mixed.view.shift.entries()) {
      assert.ok(Math.abs(value - (end.view.shift[axis] ?? NaN)) < 1e-9);
    }
  }
  const [startX] = onSlide(first.view);
  const [endX] = onSlide(second.view);
  const [middleX] = onSlide(mixCamera(first, second, 0.5).view);
  assert.ok(Math.abs(middleX - (startX + endX) / 2) < 1e-9);
  // zooming in, the pivot has gone more than half its way in the world at
  // the middle: the screen shows it at an even speed
  const pivotX = mixCamera(first, second, 0.5).view.pivot[0];
  assert.ok(pivotX > 35, `pivot ${String(pivotX)}`);
});

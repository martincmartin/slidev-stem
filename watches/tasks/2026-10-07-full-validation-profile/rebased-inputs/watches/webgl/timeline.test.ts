import assert from "node:assert/strict";
import { test } from "node:test";
import type { Mesh, Subject, View } from "./scene.ts";
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

// ---- the order of the channels ------------------------------------------------

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
// neither holds the other
const SPRING: Subject = { name: "spring", meshes: new Set([mesh("spring")]) };
const BALANCE: Subject = {
  name: "balance",
  meshes: new Set([mesh("balance")]),
};

function state(options: Partial<StageState> & { view: View }): StageState {
  return { tilt: 0, subject: null, flash: null, ...options };
}

const MOVE = MOVE_SECONDS * 1000;
const TILT = TILT_SECONDS * 1000;
const FADE = FADE_SECONDS * 1000;

function timelineAt(initial: StageState): Timeline {
  const timeline = new Timeline();
  timeline.show(initial, 0, false);
  return timeline;
}

test("the first state is shown at once, with no phase", () => {
  const timeline = new Timeline();
  assert.equal(timeline.hasState, false);
  const flashSeconds = timeline.show(
    state({ view: CLOSE, tilt: 20, subject: SPRING, flash: SPRING }),
    0,
  );
  assert.equal(flashSeconds, 0);
  assert.equal(timeline.hasState, true);
  assert.deepEqual(timeline.valuesAt(0), {
    view: CLOSE,
    tilt: 20,
    rest: 0,
    subject: SPRING,
    fading: null,
  });
  assert.equal(timeline.phaseAt(0), null);
});

test("valuesAt before any state throws", () => {
  assert.throws(() => new Timeline().valuesAt(0), /no state/);
});

test("towards a subject: the view moves, then the camera tilts, then the rest fades", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE, tilt: 30, subject: SPRING }), 0);
  assert.equal(timeline.phaseAt(0), "view");
  assert.equal(timeline.phaseAt(MOVE - 1), "view");
  assert.equal(timeline.phaseAt(MOVE), "tilt");
  assert.equal(timeline.phaseAt(MOVE + TILT), "rest");
  assert.equal(timeline.phaseAt(MOVE + TILT + FADE), null);
  // while the view moves, the others wait
  const early = timeline.valuesAt(MOVE / 2);
  assert.ok(early.view.scale > WIDE.scale && early.view.scale < CLOSE.scale);
  assert.equal(early.tilt, 0);
  assert.equal(early.rest, 1);
  // the end of a phase is the target itself, not a value near it
  const tilting = timeline.valuesAt(MOVE + TILT / 2);
  assert.equal(tilting.view, CLOSE);
  assert.ok(tilting.tilt > 0 && tilting.tilt < 30);
  assert.equal(tilting.rest, 1);
  const fading = timeline.valuesAt(MOVE + TILT + FADE / 2);
  assert.equal(fading.tilt, 30);
  assert.ok(fading.rest > 0 && fading.rest < 1);
  assert.equal(fading.subject, SPRING);
  assert.deepEqual(timeline.valuesAt(MOVE + TILT + FADE), {
    view: CLOSE,
    tilt: 30,
    rest: 0,
    subject: SPRING,
    fading: null,
  });
});

test("away from a subject: the rest fades in, then the camera untilts, then the view moves", () => {
  const timeline = timelineAt(
    state({ view: CLOSE, tilt: 30, subject: SPRING }),
  );
  timeline.show(state({ view: WIDE }), 0);
  assert.equal(timeline.phaseAt(0), "rest");
  assert.equal(timeline.phaseAt(FADE), "tilt");
  assert.equal(timeline.phaseAt(FADE + TILT), "view");
  assert.equal(timeline.phaseAt(FADE + TILT + MOVE), null);
  assert.equal(timeline.valuesAt(FADE + TILT + MOVE).view, WIDE);
});

test("from one subject to another: the rest fades in around the first, then the stage goes to the second", () => {
  const timeline = timelineAt(state({ view: CLOSE, subject: SPRING }));
  timeline.show(state({ view: FAR, subject: BALANCE }), 0);
  assert.equal(timeline.phaseAt(0), "rest");
  // the old subject is kept while the rest comes back
  assert.equal(timeline.valuesAt(FADE / 2).subject, SPRING);
  assert.equal(timeline.valuesAt(FADE).rest, 1);
  assert.equal(timeline.phaseAt(FADE), "view");
  // the tilt does not change: it has no phase
  assert.equal(timeline.phaseAt(FADE + MOVE), "rest");
  assert.equal(timeline.valuesAt(FADE + MOVE).subject, BALANCE);
  assert.equal(timeline.valuesAt(FADE + MOVE - 1).subject, SPRING);
  assert.equal(timeline.valuesAt(FADE + MOVE + FADE).rest, 0);
});

test("from a subject to one that holds it: the difference fades in alone, with the rest still out", () => {
  const inner = mesh("inner");
  const extra = mesh("extra");
  const small: Subject = { name: "small", meshes: new Set([inner]) };
  const large: Subject = { name: "large", meshes: new Set([inner, extra]) };
  const timeline = timelineAt(state({ view: CLOSE, subject: small }));
  timeline.show(state({ view: CLOSE, subject: large }), 0);
  assert.equal(timeline.phaseAt(0), "swap");
  const growing = timeline.valuesAt(FADE / 2);
  assert.equal(growing.subject, small);
  assert.equal(growing.fading, large);
  assert.ok(growing.rest > 0 && growing.rest < 1);
  const done = timeline.valuesAt(FADE);
  assert.equal(done.subject, large);
  assert.equal(done.rest, 0);
  assert.equal(done.fading, null);
  assert.equal(timeline.phaseAt(FADE), null);
  // and back again: the difference fades out alone
  timeline.show(state({ view: CLOSE, subject: small }), FADE);
  assert.equal(timeline.flashingAt(FADE + 1), null);
  const shrinking = timeline.valuesAt(FADE + FADE / 2);
  assert.equal(shrinking.subject, small);
  assert.equal(shrinking.fading, large);
  assert.equal(timeline.valuesAt(2 * FADE).subject, small);
  assert.equal(timeline.valuesAt(2 * FADE).fading, null);
});

test("to a subject that holds the old one, in another view: the camera moves and tilts with the rest still out, then the difference fades in", () => {
  const inner = mesh("inner");
  const extra = mesh("extra");
  const small: Subject = { name: "small", meshes: new Set([inner]) };
  const large: Subject = { name: "large", meshes: new Set([inner, extra]) };
  const timeline = timelineAt(state({ view: CLOSE, subject: small }));
  timeline.show(state({ view: WIDE, tilt: 20, subject: large }), 0);
  assert.equal(timeline.phaseAt(0), "view");
  const moving = timeline.valuesAt(MOVE / 2);
  assert.equal(moving.subject, small);
  assert.equal(moving.rest, 0);
  assert.equal(moving.fading, null);
  assert.equal(timeline.viewEndAt(0), MOVE);
  assert.equal(timeline.phaseAt(MOVE), "tilt");
  assert.equal(timeline.valuesAt(MOVE + TILT / 2).rest, 0);
  assert.equal(timeline.phaseAt(MOVE + TILT), "swap");
  const growing = timeline.valuesAt(MOVE + TILT + FADE / 2);
  assert.equal(growing.view, WIDE);
  assert.equal(growing.tilt, 20);
  assert.equal(growing.subject, small);
  assert.equal(growing.fading, large);
  assert.deepEqual(timeline.valuesAt(MOVE + TILT + FADE), {
    view: WIDE,
    tilt: 20,
    rest: 0,
    subject: large,
    fading: null,
  });
  // and back again: the difference fades out, then the camera untilts and moves
  const back = MOVE + TILT + FADE;
  timeline.show(state({ view: CLOSE, subject: small }), back);
  assert.equal(timeline.phaseAt(back), "swap");
  assert.equal(timeline.phaseAt(back + FADE), "tilt");
  assert.equal(timeline.valuesAt(back + FADE).subject, small);
  assert.equal(timeline.valuesAt(back + FADE).rest, 0);
  assert.equal(timeline.phaseAt(back + FADE + TILT), "view");
  assert.equal(timeline.viewEndAt(back), back + FADE + TILT + MOVE);
  assert.equal(timeline.phaseAt(back + FADE + TILT + MOVE), null);
  assert.equal(timeline.valuesAt(back + FADE + TILT + MOVE).view, CLOSE);
});

test("a swap cut short by a state with no subject fades the difference in, then the rest", () => {
  // the Escapement slide back to the Balance Wheel slide, and on to the cover before the swap ends
  const inner = mesh("inner");
  const extra = mesh("extra");
  const small: Subject = { name: "small", meshes: new Set([inner]) };
  const large: Subject = { name: "large", meshes: new Set([inner, extra]) };
  const timeline = timelineAt(state({ view: CLOSE, subject: large }));
  timeline.show(state({ view: CLOSE, subject: small }), 0);
  const cut = timeline.valuesAt(FADE / 2);
  assert.equal(cut.fading, large);
  timeline.show(state({ view: WIDE }), FADE / 2);
  // no jump where it is cut
  assert.equal(timeline.valuesAt(FADE / 2).rest, cut.rest);
  assert.equal(timeline.phaseAt(FADE / 2), "swap");
  const swapped = FADE / 2 + FADE;
  assert.deepEqual(timeline.valuesAt(swapped), {
    view: CLOSE,
    tilt: 0,
    rest: 0,
    subject: large,
    fading: null,
  });
  assert.equal(timeline.phaseAt(swapped), "rest");
  // the whole watch, not only the swap's subjects
  assert.deepEqual(timeline.valuesAt(swapped + FADE + MOVE), {
    view: WIDE,
    tilt: 0,
    rest: 1,
    subject: large,
    fading: null,
  });
});

test("a swap cut short by a state inside its smaller subject fades the difference out", () => {
  const inner = mesh("inner");
  const extra = mesh("extra");
  const small: Subject = { name: "small", meshes: new Set([inner]) };
  const large: Subject = { name: "large", meshes: new Set([inner, extra]) };
  const timeline = timelineAt(state({ view: CLOSE, subject: small }));
  timeline.show(state({ view: CLOSE, subject: large }), 0);
  timeline.show(state({ view: CLOSE, subject: small }), FADE / 2);
  assert.equal(timeline.phaseAt(FADE / 2), "swap");
  assert.deepEqual(timeline.valuesAt(FADE / 2 + FADE), {
    view: CLOSE,
    tilt: 0,
    rest: 0,
    subject: small,
    fading: null,
  });
  assert.equal(timeline.phaseAt(FADE / 2 + FADE), null);
});

test("a swap flashes its subject when the swap ends, not before", () => {
  const inner = mesh("inner");
  const extra = mesh("extra");
  const small: Subject = { name: "small", meshes: new Set([inner]) };
  const large: Subject = { name: "large", meshes: new Set([inner, extra]) };
  const added: Subject = { name: "added", meshes: new Set([extra]) };
  const timeline = timelineAt(state({ view: CLOSE, subject: small }));
  const flashSeconds = timeline.show(
    state({ view: CLOSE, subject: large, flash: added }),
    0,
  );
  assert.equal(flashSeconds, FADE_SECONDS + FLASH_SECONDS);
  assert.equal(timeline.flashingAt(0), null);
  assert.equal(timeline.flashingAt(FADE - 1), null);
  assert.equal(timeline.flashingAt(FADE), added);
  assert.equal(timeline.phaseAt(FADE + 1), "flash");
  assert.equal(timeline.flashingAt(FADE + FLASH_SECONDS * 1000), null);
});

test("a state that changes nothing has no phase", () => {
  const timeline = timelineAt(state({ view: CLOSE, tilt: 10 }));
  assert.equal(
    timeline.show(state({ view: CLOSE, tilt: 10, flash: SPRING }), 100),
    0,
  );
  assert.equal(timeline.phaseAt(100), null);
  assert.equal(timeline.flashingAt(100), null);
});

test("a new state during a transition starts from what is shown, with no jump", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE }), 0);
  const before = timeline.valuesAt(900);
  timeline.show(state({ view: FAR }), 900);
  const after = timeline.valuesAt(900);
  assert.equal(before.view.name, "wide to close");
  // the same camera (the new view is named for how it was made)
  assert.equal(after.view.scale, before.view.scale);
  assert.deepEqual(after.view.shift, before.view.shift);
  assert.deepEqual(after.view.pivot, before.view.pivot);
  assert.equal(timeline.valuesAt(900 + MOVE).view, FAR);
});

test("shown at once, a state has no phase and no flash", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  assert.equal(
    timeline.show(state({ view: CLOSE, flash: SPRING }), 0, true),
    0,
  );
  assert.equal(timeline.phaseAt(0), null);
  assert.equal(timeline.valuesAt(0).view, CLOSE);
});

// ---- the flash ----------------------------------------------------------------

test("the flash ends before zoom, tilt and fade run at their existing speeds", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  const start = 1000;
  const seconds = timeline.show(
    state({ view: CLOSE, tilt: 20, subject: SPRING, flash: SPRING }),
    start,
  );
  const flashEnd = start + FLASH_SECONDS * 1000;
  assert.equal(seconds, FLASH_SECONDS);
  assert.equal(timeline.viewEndAt(start), flashEnd + MOVE);
  for (let elapsed = 0; elapsed < FLASH_SECONDS * 1000; elapsed += 50) {
    assert.equal(timeline.phaseAt(start + elapsed), "flash");
    assert.equal(timeline.valuesAt(start + elapsed).view, WIDE);
    assert.equal(timeline.valuesAt(start + elapsed).tilt, 0);
    assert.equal(timeline.valuesAt(start + elapsed).rest, 1);
  }
  assert.equal(timeline.flashingAt(start), SPRING);
  assert.equal(timeline.flashingAt(start + FLASH_ON_SECONDS * 1000), null);
  assert.equal(timeline.flashingAt(flashEnd), null);
  assert.equal(timeline.phaseAt(flashEnd), "view");
  const zooming = timeline.valuesAt(flashEnd + MOVE / 2);
  assert.ok(
    zooming.view.scale > WIDE.scale && zooming.view.scale < CLOSE.scale,
  );
  assert.equal(zooming.tilt, 0);
  assert.equal(zooming.rest, 1);
  assert.equal(timeline.phaseAt(flashEnd + MOVE - 1), "view");
  assert.equal(timeline.phaseAt(flashEnd + MOVE), "tilt");
  assert.equal(timeline.valuesAt(flashEnd + MOVE).view, CLOSE);
  assert.equal(timeline.phaseAt(flashEnd + MOVE + TILT), "rest");
  const fading = timeline.valuesAt(flashEnd + MOVE + TILT + FADE / 2);
  assert.ok(fading.rest > 0 && fading.rest < 1);
  assert.equal(fading.tilt, 20);
  assert.equal(timeline.phaseAt(flashEnd + MOVE + TILT + FADE), null);
  assert.equal(timeline.valuesAt(flashEnd + MOVE + TILT + FADE).rest, 0);
});

test("a click during a flash of the same subject does not start it again", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE, subject: SPRING, flash: SPRING }), 0);
  const seconds = timeline.show(
    state({ view: FAR, subject: SPRING, flash: SPRING }),
    1000,
  );
  assert.equal(seconds, FLASH_SECONDS - 1);
  assert.equal(timeline.valuesAt(FLASH_SECONDS * 1000 - 1).view, WIDE);
  assert.equal(timeline.viewEndAt(1000), FLASH_SECONDS * 1000 + MOVE);
  assert.equal(timeline.flashingAt(1000 + FLASH_SECONDS * 1000 - 1000), null);
  assert.equal(timeline.phaseAt(FLASH_SECONDS * 1000), "view");
});

test("a flash of another subject starts from the click", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE, subject: SPRING, flash: SPRING }), 0);
  const seconds = timeline.show(
    state({ view: FAR, subject: BALANCE, flash: BALANCE }),
    1000,
  );
  assert.equal(seconds, FLASH_SECONDS);
  assert.equal(timeline.flashingAt(1000), BALANCE);
});

test("a flash that has ended does not go on", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE, subject: SPRING, flash: SPRING }), 0);
  const later = FLASH_SECONDS * 1000 + 10;
  const seconds = timeline.show(
    state({ view: WIDE, subject: SPRING, flash: SPRING }),
    later,
  );
  assert.equal(seconds, FLASH_SECONDS);
});

test("text waits for the camera: first towards a subject, last away from it", () => {
  const timeline = timelineAt(state({ view: WIDE }));
  timeline.show(state({ view: CLOSE, tilt: 20, subject: SPRING }), 1000);
  assert.equal(timeline.viewEndAt(1000), 1000 + MOVE);
  timeline.show(state({ view: WIDE }), 10_000);
  assert.equal(timeline.viewEndAt(10_000), 10_000 + FADE + TILT + MOVE);
  // after the move, or with no move, there is nothing to wait for
  assert.equal(timeline.viewEndAt(20_000), 20_000);
});

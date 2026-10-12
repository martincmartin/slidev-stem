import assert from "node:assert/strict";
import { test } from "node:test";
import type { Piece } from "../../webgl/scene.ts";
import type { WatchState } from "../state.ts";
import { decodeAddress, encodeAddress, speedUpOf } from "./address.ts";
import type { AddressChoices, ExplorerState } from "./address.ts";
import type { DeckPose } from "./deck-poses.ts";

function piece(name: string): Piece {
  return { name } as unknown as Piece;
}
function pose(title: string, click: number, lapse: number): DeckPose {
  return { title, click, state: { lapse } as WatchState };
}

const CASE = piece("case");
const BALANCE = piece("balance wheel");
const RECAP = pose("Recap", 3, 120);
const HOUR_HAND = pose("Hour Hand", 3, 1);
const CHOICES: AddressChoices = {
  pieces: [CASE, BALANCE],
  poses: [RECAP, HOUR_HAND],
  speedUps: [1440, 120, 1],
  scaleRange: { least: 0.05, most: 100 },
};
const STATE: ExplorerState = {
  camera: { target: [1.5, -2, 0.25], scale: 3.25, tilt: 30, turn: -10 },
  motion: { kind: "pose", pose: RECAP },
  dimmedBy: HOUR_HAND,
  guides: false,
  shown: new Set([BALANCE]),
};

test("an address decodes to the state that it encodes", () => {
  const address = decodeAddress(`#${encodeAddress(STATE)}`, CHOICES);
  assert.deepEqual(address.camera, STATE.camera);
  assert.deepEqual(address.motion, { kind: "pose", pose: RECAP });
  assert.equal(address.dimmedBy, HOUR_HAND);
  assert.equal(address.guides, false);
  assert.deepEqual([...(address.shown ?? [])], [BALANCE]);
  assert.deepEqual(address.unknown, []);
  const free = decodeAddress(
    encodeAddress({ ...STATE, motion: { kind: "free", speedUp: 1440 } }),
    CHOICES,
  );
  assert.deepEqual(free.motion, { kind: "free", speedUp: 1440 });
});

test("an empty address holds nothing, and shows the guides", () => {
  assert.deepEqual(decodeAddress("", CHOICES), {
    camera: null,
    motion: null,
    dimmedBy: null,
    guides: true,
    shown: null,
    unknown: [],
  });
});

test("a pose's motion runs at its own speed-up, whatever the address's speed", () => {
  const address = decodeAddress("speed=1440&pose=Recap+%403", CHOICES);
  assert.ok(address.motion);
  assert.equal(speedUpOf(address.motion), 120);
});

test("a wrong part decodes to null, and the others still apply", () => {
  const address = decodeAddress(
    "tilt=0&turn=0&scale=Infinity&target=0,0,0&speed=7&dim=Gears+%401&show=case|strap",
    CHOICES,
  );
  assert.equal(address.camera, null, "a scale out of the zoom's range");
  assert.equal(address.motion, null, "a speed-up that the page does not offer");
  assert.equal(address.dimmedBy, null);
  assert.deepEqual([...(address.shown ?? [])], [CASE]);
  assert.deepEqual(address.unknown, ["piece strap", "pose Gears @1"]);
});

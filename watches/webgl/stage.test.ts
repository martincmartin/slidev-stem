import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FLASH_CYCLES,
  FLASH_OFF_SECONDS,
  FLASH_ON_SECONDS,
  FLASH_SECONDS,
  flashIsOn,
} from "./stage.ts";

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

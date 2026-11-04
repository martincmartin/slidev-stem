import assert from "node:assert/strict";
import { test } from "node:test";
import { fadeFrames, songScreens, titleScreens } from "./songs.ts";

const song = {
  title: "A Song",
  bpm: 180,
  lines: [
    { text: "one", beats: 8 },
    { text: "two", beats: 8 },
    { text: "three", beats: 9 },
  ],
};

test("a screen holds two lines, for as long as they take in the song", () => {
  const screens = songScreens([song]);
  assert.deepEqual(
    screens.map((screen) => screen.lines),
    [["one", "two"], ["three"]],
  );
  assert.deepEqual(
    screens.map((screen) => screen.seconds),
    [(16 * 60) / 180, 3],
  );
});

test("the songs show in order", () => {
  const other = { ...song, lines: [{ text: "first", beats: 8 }] };
  const screens = songScreens([other, song]);
  assert.deepEqual(screens[0]?.lines, ["first"]);
  assert.deepEqual(screens.at(-1)?.lines, ["three"]);
});

test("a list that is not a list is an error", () => {
  assert.throws(() => songScreens("no"), /must be a list/);
});

test("a line with no beats names its song", () => {
  assert.throws(
    () => songScreens([{ ...song, lines: [{ text: "one" }] }]),
    /A Song: each line/,
  );
});

test("there must be a song", () => {
  assert.throws(() => songScreens([]), /at least one song/);
});

test("each title has a screen of its own, for the same time", () => {
  assert.deepEqual(titleScreens(["One", "Two"], 4), [
    { lines: ["One"], seconds: 4 },
    { lines: ["Two"], seconds: 4 },
  ]);
});

test("titles must be a list of text, with a time", () => {
  assert.throws(() => titleScreens([], 4), /at least one title/);
  assert.throws(() => titleScreens("One", 4), /at least one title/);
  assert.throws(() => titleScreens([1], 4), /must be text/);
  assert.throws(() => titleScreens(["One"], 0), /above 0/);
});

test("a screen is faded in after its fade and starts fading out one fade before its end", () => {
  assert.deepEqual(fadeFrames(4, 0.5), [
    { opacity: 0, offset: 0 },
    { opacity: 1, offset: 0.125 },
    { opacity: 1, offset: 0.875 },
    { opacity: 0, offset: 1 },
  ]);
});

test("with no fade, a screen is shown for all its time", () => {
  assert.ok(fadeFrames(4, 0).every((frame) => frame["opacity"] === 1));
});

test("a screen too short for its fades is an error", () => {
  assert.throws(() => fadeFrames(0.5, 0.4), /too short/);
});

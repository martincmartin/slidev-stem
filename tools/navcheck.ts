// Walk a deck forward and back, and check that going back needs no work.
//
//     pnpm navcheck /tmp/deck                  # at the root; a build
//     pnpm navcheck http://localhost:3030      # a running dev server
//
// A diagnostic tool: run it when a navigation problem is found or suspected.
// No validation mode runs it. Do not run it routinely.
//
// The rules are in ../docs/navigation.md. The deck must define
// window.slideState(), which returns {settled, continuous, busy}
// (../docs/navigation.md, "Diagnostic: exhaustive navigation"). A deck
// without it passes with a note.
//
// A recorder in the page records slideState() at each frame, and when each
// key goes down. The walk presses the right arrow from slide 1 to the end of
// the deck, then the left arrow back to slide 1. Before each press it waits
// for one frame; after it, until the move ends: nothing is busy, and no
// number has changed for QUIET_MS. Then it loads each place (slide and
// click) directly.
// It fails if:
//
// - a place's `settled` after a move differs from its `settled` after a
//   direct load (rule 0: the settled screen depends only on the slide and the
//   click);
// - a `continuous` number leaves the range between its value before the press
//   and its value at the end (it jumps out and comes back: a flash);
// - a `continuous` number covers more than CUT_SHARE of its change by the
//   first frame after the press, when that frame comes within CUT_WINDOW_MS (a
//   cut). A later first frame cannot tell a cut from a fast fade: the check
//   says so, and does not fail;
// - a move does not end within MOVE_TIMEOUT_MS, or the page throws an error.
//
// A build is served from disk with every outside request aborted
// (browser.ts); a page error or an outside request fails. For a rapid walk,
// whose presses do not wait for an animation to end, run offline-check.ts
// --walk. It exits 1 on a failure, and 2 on a usage error.

import { parseArgs } from "node:util";
import type { Page } from "playwright-chromium";
import type { Position } from "../themes/house/navigation.ts";
import {
  describeProblem,
  FIRST,
  isEngine,
  MOST_POSITIONS,
  named,
  openDeck,
  ORIGIN,
  outsideUrls,
  pathOf,
  placeOf,
  reasonOf,
  requireDeck,
  same,
  showSlide,
  withBrowser,
} from "./browser.ts";

/** ms: a move has ended when nothing is busy and no number has changed for
 *  this long. */
const QUIET_MS = 600;
const MOVE_TIMEOUT_MS = 15_000;
/** The first frame after a press may cover at most this share of a
 *  change... */
const CUT_SHARE = 0.6;
/** ...if it comes this soon (ms) after the press. The fastest fade here is
 *  0.3 s: 120 ms into it (0.4 of its time), a cubic ease-in-out has covered
 *  4 * 0.4^3, about 0.26 of it, and a CSS `ease` about 0.5. A cut has
 *  covered all. */
const CUT_WINDOW_MS = 120;
/** A number is unchanged within this share of its size (at least 1). */
const TOLERANCE = 0.02;
/** CSS px: one slide, for the sampled walk. */
const SLIDE_VIEWPORT = { width: 980, height: 552 };

/** What a talk's window.slideState() returns. */
interface SlideState {
  readonly settled: Readonly<Record<string, string | number | boolean>>;
  readonly continuous: Readonly<Record<string, number>>;
  readonly busy: boolean;
}

/** What the recorder has seen in a page since Node last read it. */
interface Recorder {
  frames: Sample[];
  /** The last frame's settled values. */
  settled: SlideState["settled"];
  /** When the last key went down (ms, the page's clock), or -Infinity. */
  press: number;
  /** When a number last changed, or the deck was last busy. */
  since: number;
  /** The last frame's settled and continuous values, as text. */
  last: string;
  /** What slideState() threw, if it did: the recorder stops then. */
  error: string | null;
}

declare global {
  interface Window {
    slideState?: () => SlideState;
    navRecorder?: Recorder;
  }
}

interface Sample {
  readonly time: number;
  readonly values: Readonly<Record<string, number>>;
}

/** What the screen did from before one press until its move ended. */
interface Sampled {
  readonly samples: readonly Sample[];
  readonly settled: SlideState["settled"];
  /** When the key went down. */
  readonly press: number;
  readonly timedOut: boolean;
}

/** One press, from one place to the next, and what the screen did. */
export interface Move extends Sampled {
  readonly start: Position;
  readonly end: Position;
  readonly key: string;
}

/** Record slideState() at each frame, and when each key goes down, from
 *  before the deck's scripts run (an init script). It runs in the page. */
function installRecorder(): void {
  const recorder: Recorder = {
    frames: [],
    settled: {},
    press: -Infinity,
    since: 0,
    last: "",
    error: null,
  };
  window.navRecorder = recorder;
  // before Slidev sees the key
  window.addEventListener(
    "keydown",
    () => {
      recorder.press = performance.now();
    },
    { capture: true },
  );
  // Read after each frame's callbacks, the deck's animations among them: a
  // message posted in a frame callback runs after all of them. A frame
  // callback of its own would run before a loop that started later, and see
  // each change one frame late: a cut would look like a fade.
  const after = new MessageChannel();
  after.port1.onmessage = () => {
    let state: SlideState | undefined;
    try {
      state = window.slideState?.();
    } catch (error) {
      recorder.error = String(error);
      return;
    }
    if (!state) return;
    const now = performance.now();
    recorder.frames.push({ time: now, values: state.continuous });
    recorder.settled = state.settled;
    const key = JSON.stringify([state.settled, state.continuous]);
    if (key !== recorder.last || state.busy) recorder.since = now;
    recorder.last = key;
  };
  const frame = () => {
    if (recorder.error !== null) return;
    after.port2.postMessage(null);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Whether the deck has been quiet for `quiet` ms since `from`: nothing busy
 *  and no number changed, by the recorded frames. Judged at the newest
 *  recorded frame, not at the clock: without a GPU a frame can take longer
 *  than `quiet`, and the frame being drawn may still change something. It
 *  runs in the page. */
function quietSince({ from, quiet }: { from: number; quiet: number }) {
  const recorder = window.navRecorder;
  if (recorder?.error != null) return true; // settle() reports it
  const newest = recorder?.frames.at(-1)?.time;
  if (!recorder || newest === undefined) return false;
  return newest - Math.max(recorder.since, from) >= quiet;
}

/** Forget the recorded frames, and return the page's clock. It runs in the
 *  page. */
function clearFrames(): number {
  if (window.navRecorder) window.navRecorder.frames = [];
  return performance.now();
}

/** Wait until the deck has been quiet since `from` (the page's clock), and
 *  return what the recorder saw since it was cleared. */
async function settle(page: Page, from: () => Promise<number>) {
  let timedOut = false;
  try {
    await page.waitForFunction(
      quietSince,
      { from: await from(), quiet: QUIET_MS },
      { timeout: MOVE_TIMEOUT_MS, polling: "raf" },
    );
  } catch (error) {
    // by name: each Playwright package can have its own TimeoutError
    if (!(error instanceof Error) || error.name !== "TimeoutError") throw error;
    timedOut = true;
  }
  const seen = await page.evaluate(() => {
    const recorder = window.navRecorder;
    if (!recorder) throw new Error("navcheck's recorder is not in the page");
    if (recorder.error !== null) {
      throw new Error(`slideState() threw: ${recorder.error}`);
    }
    return {
      samples: recorder.frames,
      settled: recorder.settled,
      press: recorder.press,
    };
  });
  return { ...seen, timedOut };
}

/** The settled values, with numbers rounded: a direct load and a move may
 *  differ in the last digits. */
function rounded(settled: SlideState["settled"]): SlideState["settled"] {
  return Object.fromEntries(
    Object.entries(settled).map(([name, value]) => [
      name,
      typeof value === "number" ? Math.round(value * 1000) / 1000 : value,
    ]),
  );
}

/** `move` as text: where it went from and to, and the key. */
const label = (move: Move) =>
  `${named(move.start)} -> ${named(move.end)} (${move.key})`;

/** The failures and the notes for one move. */
export function moveProblems(move: Move): {
  problems: string[];
  notes: string[];
} {
  const problems: string[] = [];
  const notes: string[] = [];
  const moved = label(move);
  if (move.timedOut) {
    problems.push(`${moved}: did not end within ${String(MOVE_TIMEOUT_MS)} ms`);
  }
  const before = move.samples.filter((sample) => sample.time < move.press);
  const after = move.samples.filter((sample) => sample.time >= move.press);
  const first = before.at(-1)?.values;
  const early = after[0];
  if (!first || !early) {
    notes.push(`${moved}: no frame before or after the press`);
    return { problems, notes };
  }
  for (const [name, start] of Object.entries(first)) {
    // A number that leaves the screen leaves slideState() (a fade out, then
    // gone): it ends at the last value that it had.
    const end =
      after.findLast((sample) => name in sample.values)?.values[name] ?? start;
    const tolerance = TOLERANCE * Math.max(1, Math.abs(start), Math.abs(end));
    const low = Math.min(start, end) - tolerance;
    const high = Math.max(start, end) + tolerance;
    const outside = after.find((sample) => {
      const value = sample.values[name] ?? end;
      return value < low || value > high;
    });
    if (outside) {
      const worst = outside.values[name] ?? end;
      problems.push(
        `${moved}: ${name} went to ${worst.toFixed(2)} on its way from ` +
          `${start.toFixed(2)} to ${end.toFixed(2)}`,
      );
      continue;
    }
    const change = Math.abs(end - start);
    if (change <= tolerance) continue;
    const covered = Math.abs((early.values[name] ?? end) - start) / change;
    if (covered > CUT_SHARE) {
      const delay = early.time - move.press;
      const text =
        `${moved}: ${name} went from ${start.toFixed(2)} to ${end.toFixed(2)} ` +
        `with ${(covered * 100).toFixed(0)}% of it in the first frame, ` +
        `${delay.toFixed(0)} ms after the press`;
      if (delay <= CUT_WINDOW_MS) problems.push(`${text} (a cut)`);
      else notes.push(`${text}: the frame came too late to tell`);
    }
  }
  return { problems, notes };
}

/** How `move` ends unlike a direct load of its place (`loaded`), or null. */
export function ruleZeroProblem(
  move: Move,
  loaded: SlideState["settled"],
): string | null {
  const settled = rounded(move.settled);
  const direct = rounded(loaded);
  const names = [...new Set([...Object.keys(direct), ...Object.keys(settled)])]
    .filter((name) => direct[name] !== settled[name])
    .sort();
  if (names.length === 0) return null;
  const show = (value: unknown) =>
    value === undefined ? "none" : JSON.stringify(value);
  return (
    `${label(move)}: ends unlike a ` +
    `direct load of ${named(move.end)}; ` +
    names
      .map(
        (name) => `${name} ${show(settled[name])}, not ${show(direct[name])}`,
      )
      .join(", ")
  );
}

/** Press `key`, and return the move that it made, or null if the URL did not
 *  change (the end of the deck). */
async function press(page: Page, key: string): Promise<Move | null> {
  const start = page.url();
  const before = await page.evaluate(clearFrames);
  // a frame from before the press, to judge the move from
  await page.waitForFunction(
    () => {
      const recorder = window.navRecorder;
      return recorder?.error != null || (recorder?.frames.length ?? 0) > 0;
    },
    undefined,
    { polling: "raf" },
  );
  await page.keyboard.press(key);
  const sampled = await settle(page, () =>
    page
      .waitForFunction(
        (after) => (window.navRecorder?.press ?? -Infinity) >= after,
        before,
        { polling: "raf" },
      )
      .then(() => page.evaluate(() => window.navRecorder?.press ?? 0)),
  );
  if (sampled.timedOut && page.url() === start) {
    throw new Error("a key press did not give a settled page");
  }
  if (page.url() === start) return null;
  return { ...sampled, start: placeOf(start), end: placeOf(page.url()), key };
}

/** A place, as a direct load of it settles. */
interface DirectLoad {
  readonly place: Position;
  readonly settled: SlideState["settled"];
}

/** Everything that the walks found. */
interface Findings {
  readonly moves: readonly Move[];
  /** Each place that a move reached. */
  readonly direct: readonly DirectLoad[];
  readonly problems: readonly string[];
}

/** Walk the deck at `base` on `page`, and load each place directly. */
async function walk(page: Page, base: string): Promise<Findings> {
  const moves: Move[] = [];
  const direct: DirectLoad[] = [];
  const problems: string[] = [];
  await page.context().addInitScript(installRecorder);
  /** Load `place`, and what it settles to; null if the deck has no
   *  slideState(). */
  const load = async (place: Position) => {
    await showSlide(page, base, pathOf(place));
    const probed = await page.evaluate(
      () => typeof window.slideState === "function",
    );
    if (!probed) return null;
    return settle(page, () => page.evaluate(clearFrames));
  };
  try {
    const first = await load(FIRST);
    if (first === null) {
      console.log(
        "navcheck: the deck has no window.slideState(): nothing to check",
      );
      return { moves, direct, problems };
    }
    if (first.timedOut)
      problems.push("slide 1 did not settle within the move timeout");
    for (const key of ["ArrowRight", "ArrowLeft"]) {
      let ended = false;
      for (let step = 1; step < MOST_POSITIONS; step++) {
        const move = await press(page, key);
        if (move === null) {
          ended = true;
          break;
        }
        moves.push(move);
        const seconds =
          ((move.samples.at(-1)?.time ?? move.press) - move.press) / 1000;
        console.log(
          `  ${named(move.start)} -> ${named(move.end)}: ${seconds.toFixed(1)} s` +
            (move.timedOut ? " (did not end)" : ""),
        );
      }
      if (!ended)
        problems.push(
          `${key}: the walk did not end within ${String(MOST_POSITIONS)} steps`,
        );
    }
    if (moves.length > 0 && !same(placeOf(page.url()), FIRST)) {
      problems.push("the backward walk did not return to slide 1");
    }
    const places = moves
      .map((move) => move.end)
      .filter(
        (place, index, all) =>
          all.findIndex((other) => same(other, place)) === index,
      );
    for (const place of places) {
      const loaded = await load(place);
      if (loaded === null || loaded.timedOut) {
        problems.push(`${named(place)}: a direct load did not settle`);
      } else {
        direct.push({ place, settled: loaded.settled });
      }
    }
  } catch (error) {
    problems.push(`the walk stopped: ${reasonOf(error)}`);
  }
  return { moves, direct, problems };
}

if (import.meta.main) {
  const usage =
    "usage: pnpm navcheck DECK|URL [--browser chromium|firefox|webkit]";
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        browser: { type: "string", default: "chromium" },
      },
    });
  } catch (error) {
    console.error(`${String(error)}\n${usage}`);
    process.exit(2);
  }
  const { positionals, values } = parsed;
  const [target] = positionals;
  const engine = values.browser;
  if (target === undefined || positionals.length > 1 || !isEngine(engine)) {
    console.error(usage);
    process.exit(2);
  }
  const server = /^https?:\/\//.test(target);
  if (!server) requireDeck(target);
  const base = server ? target.replace(/\/+$/, "") : ORIGIN;
  const { findings, pageProblems } = await withBrowser(
    engine,
    async (browser) => {
      const served = await openDeck(browser, server ? undefined : target, {
        viewport: SLIDE_VIEWPORT,
      });
      const found = await walk(served.page, base);
      return { findings: found, pageProblems: served.problems() };
    },
  );
  const problems = [...findings.problems];
  const notes: string[] = [];
  for (const move of findings.moves) {
    const judged = moveProblems(move);
    problems.push(...judged.problems);
    notes.push(...judged.notes);
    const loaded = findings.direct.find(({ place }) => same(place, move.end));
    const differs = loaded ? ruleZeroProblem(move, loaded.settled) : null;
    if (differs !== null) problems.push(differs);
  }
  const forward = findings.moves.filter(
    (move) => move.key === "ArrowRight",
  ).length;
  console.log(
    `navcheck: ${String(forward)} moves forward, ` +
      `${String(findings.moves.length - forward)} back`,
  );
  for (const note of notes) console.log(`note ${note}`);
  const outside = outsideUrls(pageProblems);
  console.log(`outside requests: ${String(outside.length)}`);
  for (const problem of pageProblems) problems.push(describeProblem(problem));
  for (const problem of problems) console.log(`FAIL ${problem}`);
  process.exitCode = problems.length > 0 ? 1 : 0;
}

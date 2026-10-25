// Walk a deck in bursts of rapid presses, and check two things:
//
// - each burst ends like a direct load of the same place (rule 0 of
//   ../../../../docs/navigation.md, for moves that a new press interrupts);
// - each frame during a burst shows only pieces of the place that the URL
//   names and of the place before it: one step, not pieces left over from a
//   step that a press cut short;
// - with --jumps, the second rule of the task (PLAN.md): each press during a
//   move jumps, so each frame at the place that it reaches shows exactly
//   that place's pieces, and no story of the board runs.
//
//     node tools/rapid.ts DECK [--presses 3] [--gap 150] [--browser chromium]
//       [--jumps]
//
// DECK is a built deck's directory. Each burst presses the same arrow
// `presses` times, `gap` ms apart, then waits until the deck is quiet: nothing
// busy and nothing changed for QUIET_MS. The walk goes forward to the end in
// bursts, then back to slide 1. Then it loads each place that it passed, for
// its settled values and its pieces. A frame's pieces are the watch stage's
// meshes at full opacity and those that fade, while the fade shows
// (`window.watchStage.valuesAt`); a frame where the watch's canvas does not
// show has no pieces. A press is during a move when, at the frame before it,
// the stage's change has not ended (`endAt`) or the board's story runs, or
// when it comes less than BURST_MS after a press that was. It imports the house's tools/browser.ts, as of the task's
// date.

import { parseArgs } from "node:util";
import type { Page } from "playwright-chromium";
import type { Position } from "../../../../themes/house/navigation.ts";
import {
  FIRST,
  isEngine,
  named,
  openDeck,
  ORIGIN,
  pathOf,
  placeOf,
  requireDeck,
  same,
  showSlide,
  withBrowser,
} from "../../../../tools/browser.ts";

/** ms: the deck is quiet when nothing is busy and nothing has changed for
 *  this long (as tools/navcheck.ts). */
const QUIET_MS = 600;
const SETTLE_TIMEOUT_MS = 20_000;
/** A fade or a canvas shows when its opacity is above this. */
const SHOWS = 0.02;
const VIEWPORT = { width: 980, height: 552 };
/** ms: as BURST_MS in global-bottom.vue, at the task's date. */
const BURST_MS = 1000;

type Settled = Readonly<Record<string, string | number | boolean>>;

/** One frame: when (ms), the deck's place (`slideNavigation()`), the names
 *  of the pieces that show (null: the watch does not show), and whether a
 *  move runs: the stage's change, or the board's story. */
interface Frame {
  readonly time: number;
  readonly place: Position;
  readonly pieces: readonly string[] | null;
  readonly moving: boolean;
}

interface Recorder {
  since: number;
  last: string;
  settled: Settled;
  /** null: not recording. */
  frames: Frame[] | null;
}

interface StageLike {
  readonly hasState: boolean;
  endAt(now: number): number;
  valuesAt(now: number): {
    keep: ReadonlySet<{ name: string }>;
    fade: ReadonlySet<{ name: string }>;
    rest: number;
  };
}

interface StateLike {
  settled: Settled;
  continuous: Record<string, number>;
  busy: boolean;
}

declare global {
  interface Window {
    rapidRecorder?: Recorder;
  }
}

/** Record when slideState() last changed or was busy, and, while asked, the
 *  pieces of each frame. It runs in the page. */
function installRecorder(shows: number): void {
  const recorder: Recorder = { since: 0, last: "", settled: {}, frames: null };
  window.rapidRecorder = recorder;
  const frame = () => {
    const page = window as unknown as {
      slideState?: () => StateLike;
      watchStage?: StageLike;
      slideNavigation?: () => Position;
    };
    const state = page.slideState?.();
    if (state) {
      const key = JSON.stringify([state.settled, state.continuous]);
      if (key !== recorder.last || state.busy) recorder.since = performance.now();
      recorder.last = key;
      recorder.settled = state.settled;
      const stage = page.watchStage;
      const opacity = state.continuous["watch opacity"] ?? 0;
      const at = page.slideNavigation?.();
      if (recorder.frames && at && stage?.hasState) {
        const now = performance.now();
        let pieces: string[] | null = null;
        if (opacity > shows) {
          const values = stage.valuesAt(now);
          pieces = [...values.keep].map((mesh) => mesh.name);
          if (values.rest > shows) {
            pieces.push(...[...values.fade].map((mesh) => mesh.name));
          }
        }
        const boardBusy = [
          ...document.querySelectorAll<HTMLElement>("[data-busy]"),
        ].some(
          (host) => host.dataset["phase"] !== undefined && host.dataset["busy"] === "true",
        );
        recorder.frames.push({
          time: now,
          place: { slide: at.slide, click: at.click },
          pieces,
          moving: boardBusy || stage.endAt(now) > now,
        });
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Wait until the deck is quiet, and return its settled values. */
async function settle(page: Page): Promise<Settled> {
  await page.waitForFunction(
    (quiet) => {
      const recorder = window.rapidRecorder;
      return (
        recorder !== undefined &&
        recorder.last !== "" &&
        performance.now() - recorder.since >= quiet
      );
    },
    QUIET_MS,
    { timeout: SETTLE_TIMEOUT_MS, polling: "raf" },
  );
  return page.evaluate(() => window.rapidRecorder?.settled ?? {});
}

function rounded(settled: Settled): Settled {
  return Object.fromEntries(
    Object.entries(settled).map(([name, value]) => [
      name,
      typeof value === "number" ? Math.round(value * 1000) / 1000 : value,
    ]),
  );
}

/** The names whose values differ, as text, or null. */
function difference(after: Settled, direct: Settled): string | null {
  const one = rounded(after);
  const other = rounded(direct);
  const names = [...new Set([...Object.keys(one), ...Object.keys(other)])]
    .filter((name) => one[name] !== other[name])
    .sort();
  if (names.length === 0) return null;
  const show = (value: unknown) =>
    value === undefined ? "none" : JSON.stringify(value);
  return names
    .map((name) => `${name} ${show(one[name])}, not ${show(other[name])}`)
    .join("; ");
}

/** The pieces of a place at rest, from its settled `shown`. */
function piecesOf(settled: Settled): Set<string> {
  const shown = settled["shown"];
  return new Set(
    typeof shown === "string" && shown !== "" ? shown.split(", ") : [],
  );
}

interface Burst {
  readonly from: Position;
  readonly to: Position;
  readonly key: string;
  readonly settled: Settled;
  readonly frames: readonly Frame[];
}

/** The frames of `burst` that show a piece of neither the place that the
 *  URL names nor the place before it, as text. */
function strayFrames(
  burst: Burst,
  pieces: (place: Position) => ReadonlySet<string>,
): string[] {
  const found: string[] = [];
  let before = burst.from;
  let current = burst.from;
  for (const frame of burst.frames) {
    const place = frame.place;
    if (!same(place, current)) {
      before = current;
      current = place;
    }
    if (frame.pieces === null) continue;
    const allowed = new Set([...pieces(before), ...pieces(current)]);
    const stray = frame.pieces.filter((name) => !allowed.has(name));
    if (stray.length > 0) {
      found.push(
        `at ${named(current)} (from ${named(before)}): ${[...new Set(stray)].sort().join(", ")}`,
      );
    }
  }
  return [...new Set(found)];
}

/** The frames of `burst` at a place that a press during a move reached,
 *  that show other pieces than the place's, or where a move runs (the
 *  stage's change, or the board's story), as text. */
function slowJumps(
  burst: Burst,
  pieces: (place: Position) => ReadonlySet<string>,
): string[] {
  const found: string[] = [];
  let current = burst.from;
  let jumped = false;
  let jumpedAt = -Infinity;
  let previous: Frame | undefined;
  for (const frame of burst.frames) {
    if (!same(frame.place, current)) {
      current = frame.place;
      jumped =
        (previous?.moving ?? false) || frame.time - jumpedAt < BURST_MS;
      if (jumped) jumpedAt = frame.time;
    }
    previous = frame;
    if (!jumped) continue;
    if (frame.moving) found.push(`at ${named(current)}: a move runs`);
    const expected = pieces(current);
    if (frame.pieces !== null) {
      const shown = new Set(frame.pieces);
      const differs =
        shown.size !== expected.size ||
        [...shown].some((name) => !expected.has(name));
      if (differs) {
        found.push(
          `at ${named(current)}: ${[...shown].sort().join(", ")}, not ${[...expected].sort().join(", ")}`,
        );
      }
    }
  }
  return [...new Set(found)];
}

async function main(): Promise<void> {
  const usage =
    "usage: node tools/rapid.ts DECK [--presses N] [--gap MS] " +
    "[--browser chromium|firefox|webkit] [--jumps]";
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      presses: { type: "string", default: "3" },
      gap: { type: "string", default: "150" },
      browser: { type: "string", default: "chromium" },
      jumps: { type: "boolean", default: false },
    },
  });
  const [deck] = positionals;
  const presses = Number(values.presses);
  const gap = Number(values.gap);
  const engine = values.browser;
  if (
    deck === undefined ||
    positionals.length !== 1 ||
    !Number.isInteger(presses) ||
    presses < 1 ||
    !Number.isFinite(gap) ||
    !isEngine(engine)
  ) {
    console.error(usage);
    process.exitCode = 2;
    return;
  }
  requireDeck(deck);
  const failures = await withBrowser(engine, async (browser) => {
    const { page } = await openDeck(browser, deck, { viewport: VIEWPORT });
    await page.context().addInitScript(installRecorder, SHOWS);
    await showSlide(page, ORIGIN, pathOf(FIRST));
    await settle(page);
    const bursts: Burst[] = [];
    for (const key of ["ArrowRight", "ArrowLeft"]) {
      for (;;) {
        const from = placeOf(page.url());
        await page.evaluate(() => {
          if (window.rapidRecorder) window.rapidRecorder.frames = [];
        });
        for (let index = 0; index < presses; index++) {
          await page.keyboard.press(key);
          await page.waitForTimeout(gap);
        }
        const settled = await settle(page);
        const frames = await page.evaluate(() => {
          const recorded = window.rapidRecorder?.frames ?? [];
          if (window.rapidRecorder) window.rapidRecorder.frames = null;
          return recorded;
        });
        const to = placeOf(page.url());
        if (same(from, to)) break;
        bursts.push({ from, to, key, settled, frames });
        console.log(`  ${named(from)} -> ${named(to)} (${key})`);
      }
    }
    const direct = new Map<string, Settled>();
    const load = async (place: Position): Promise<Settled> => {
      const name = named(place);
      const known = direct.get(name);
      if (known) return known;
      await showSlide(page, ORIGIN, pathOf(place));
      const loaded = await settle(page);
      direct.set(name, loaded);
      return loaded;
    };
    const places = bursts.flatMap((burst) => [
      burst.from,
      ...burst.frames.map((frame) => frame.place),
    ]);
    for (const place of places) await load(place);
    const pieces = (place: Position) =>
      piecesOf(direct.get(named(place)) ?? {});
    const found: string[] = [];
    for (const burst of bursts) {
      const moved = `${named(burst.from)} -> ${named(burst.to)} (${burst.key} x${String(presses)})`;
      const differs = difference(burst.settled, await load(burst.to));
      if (differs !== null) found.push(`${moved}: ends unlike a direct load: ${differs}`);
      for (const stray of strayFrames(burst, pieces)) {
        found.push(`${moved}: a frame ${stray}`);
      }
      if (values.jumps) {
        for (const slow of slowJumps(burst, pieces)) {
          found.push(`${moved}: a jump's frame ${slow}`);
        }
      }
    }
    return found;
  });
  for (const failure of failures) console.log(`FAIL ${failure}`);
  console.log(`${String(failures.length)} failures`);
  process.exitCode = failures.length > 0 ? 1 : 0;
}

await main();

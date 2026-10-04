// The diving board's state and its clock. components/DivingBoard.vue draws the
// board and sets the SVG's time to the one that this gives. The times come from
// the SVG's root (art/diving_board.py writes them). No DOM here, so a test can
// drive the clock with made-up times.
//
// A SLIDE NAMES TARGETS, NOT MOVES (../../docs/navigation.md). `boardState`
// turns a slide's frontmatter and click into a target: whether the picture and
// the rest shape show, and where the board is: flat (`start`), swinging
// (`swing`) or curled into the spring (`curled`). The clock goes from where it
// is to the target, in either direction:
//   start -> swing: play from 0: bend, hold, let go, then swing for ever
//   swing -> curled: wait for the next bottom of the swing, then curl
//   curled -> swing: uncurl (the curl played backwards) to the bottom of the
//     swing, then swing
//   -> start: the picture fades out; the clock holds its pose, and the next
//     swing plays from 0
// A jump (a reload, a slide that is not a neighbour) goes to the target at
// once: the start, the bottom of the swing, or the end of the curl.

import { clickOf, wrong } from "./state.ts";

/** The root's `data-` times, in seconds. */
export interface BoardTiming {
  /** The bottom of the swing: the board is bent and still. */
  swingStart: number;
  /** One swing, from the bottom back to the bottom. */
  swingPeriod: number;
  /** When the curl starts, and how long it lasts. */
  curlStart: number;
  curlDuration: number;
}

export type BoardPlace = "start" | "swing" | "curled";

/** What the board shows at a slide's click. */
export interface BoardState {
  /** The board, the pool and the stand. */
  picture: boolean;
  /** The dashed rest outline and its callout. */
  rest: boolean;
  /** The pool and the stand fade, and the board curls. */
  curling: boolean;
  place: BoardPlace;
}

/** A target for the live board, and whether to show it at once (a jump). A
 *  new object for each move. */
export interface BoardTarget {
  state: BoardState | undefined;
  atOnce: boolean;
}

/** The board's state at `clicks`, or `undefined` if the slide has no `board`.
 *  The keys are click numbers:
 *    board: the board and the rest shape fade in, and the board plays
 *    boardCurl: the pool and the stand fade, and the board curls
 *    boardHide: the board fades; the rest shape stays to the slide's end */
export function boardState(
  frontmatter: Record<string, unknown>,
  clicks: number,
): BoardState | undefined {
  const showAt = clickOf(frontmatter, "board");
  if (showAt === undefined) return undefined;
  const curlAt = clickOf(frontmatter, "boardCurl");
  const hideAt = clickOf(frontmatter, "boardHide");
  if (curlAt !== undefined && curlAt <= showAt) {
    return wrong("boardCurl", curlAt, "a click after board");
  }
  if (hideAt !== undefined && hideAt <= (curlAt ?? showAt)) {
    return wrong("boardHide", hideAt, "a click after boardCurl and board");
  }
  const shown = clicks >= showAt;
  const curling = curlAt !== undefined && clicks >= curlAt;
  return {
    picture: shown && (hideAt === undefined || clicks < hideAt),
    rest: shown,
    curling,
    place: !shown ? "start" : curling ? "curled" : "swing",
  };
}

/** How far through the curl a page shows it: the board is a spiral that has
 *  not yet wound in to the hairspring, so the page differs from the next click's
 *  (the hairspring at rest). */
export const CURL_SHOWN = 0.5;

/** The SVG's time (s) for a page that does not run the clock: print and
 *  export, the overview, the presenter's "next" pane. Before the board plays,
 *  the picture is faded out, so time 0. */
export function boardPoseTime(timing: BoardTiming, state: BoardState): number {
  if (state.place === "start") return 0;
  if (state.curling) return timing.curlStart + CURL_SHOWN * timing.curlDuration;
  return timing.swingStart;
}

/** What the clock is doing, for tools/navcheck.py and the tests. A bend, a
 *  curl (or the wait for it) and an uncurl are busy: they end on their own. */
export type BoardPhase =
  "start" | "bend" | "swing" | "curl" | "uncurl" | "curled";

/** The clock's motion from a time (ms) on. */
type Segment =
  | { kind: "hold"; time: number }
  /** Plays forward from `from` (s) at `startMs`; past the swing's start it
   *  repeats the swing's one cycle. Curls at `curlAt` (ms), if set. */
  | { kind: "loop"; startMs: number; from: number; curlAt: number | null }
  /** In the curl, from `from` (s) at `startMs`: forward to its end, or
   *  backward to its start and then into the swing. */
  | { kind: "curl"; startMs: number; from: number; rate: 1 | -1 };

export class BoardClock {
  private readonly timing: BoardTiming;
  private segment: Segment = { kind: "hold", time: 0 };
  /** At the start: the next swing plays from 0, whatever the pose held. */
  private atStart = true;

  constructor(timing: BoardTiming) {
    for (const [name, value] of Object.entries(timing)) {
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`board timing ${name}: ${String(value)}`);
      }
    }
    if (timing.swingPeriod <= 0 || timing.curlStart < timing.swingStart) {
      throw new Error("board timing: no swing before the curl");
    }
    this.timing = timing;
  }

  private get curlEnd(): number {
    return this.timing.curlStart + this.timing.curlDuration;
  }

  /** The segment in force at `now`, after the ends that have passed. */
  private current(now: number): Segment {
    const { swingStart, curlStart } = this.timing;
    for (;;) {
      const segment = this.segment;
      if (
        segment.kind === "loop" &&
        segment.curlAt !== null &&
        now >= segment.curlAt
      ) {
        this.segment = {
          kind: "curl",
          startMs: segment.curlAt,
          from: curlStart,
          rate: 1,
        };
      } else if (segment.kind === "curl") {
        const ends = segment.rate === 1 ? this.curlEnd : curlStart;
        const endMs = segment.startMs + Math.abs(ends - segment.from) * 1000;
        if (now < endMs) return segment;
        this.segment =
          segment.rate === 1
            ? { kind: "hold", time: ends }
            : { kind: "loop", startMs: endMs, from: swingStart, curlAt: null };
      } else {
        return segment;
      }
    }
  }

  /** The loop's time (s) at `now`, before it wraps into the swing's cycle. */
  private elapsed(segment: Segment & { kind: "loop" }, now: number): number {
    return segment.from + (now - segment.startMs) / 1000;
  }

  /** The SVG's time (s) at `now`. */
  time(now: number): number {
    const segment = this.current(now);
    const { swingStart, swingPeriod } = this.timing;
    switch (segment.kind) {
      case "hold":
        return segment.time;
      case "loop": {
        const elapsed = this.elapsed(segment, now);
        return elapsed < swingStart
          ? elapsed
          : swingStart + ((elapsed - swingStart) % swingPeriod);
      }
      case "curl":
        return segment.from + (segment.rate * (now - segment.startMs)) / 1000;
    }
  }

  phase(now: number): BoardPhase {
    const segment = this.current(now);
    if (this.atStart) return "start";
    switch (segment.kind) {
      case "hold":
        return segment.time >= this.curlEnd ? "curled" : "start";
      case "loop":
        if (segment.curlAt !== null) return "curl";
        return this.elapsed(segment, now) < this.timing.swingStart
          ? "bend"
          : "swing";
      case "curl":
        return segment.rate === 1 ? "curl" : "uncurl";
    }
  }

  /** Whether the time changes after `now`. */
  moving(now: number): boolean {
    return this.current(now).kind !== "hold";
  }

  /** When the swing is next at its bottom (ms): it starts there, and is there
   *  each period. */
  private nextBottom(segment: Segment & { kind: "loop" }, now: number): number {
    const { swingStart, swingPeriod } = this.timing;
    const elapsed = this.elapsed(segment, now);
    const cycles =
      elapsed <= swingStart
        ? 0
        : Math.ceil((elapsed - swingStart) / swingPeriod);
    return now + (swingStart + cycles * swingPeriod - elapsed) * 1000;
  }

  /** Go to `place` from where the clock is at `now`, or at once. */
  show(place: BoardPlace, now: number, atOnce: boolean): void {
    const { swingStart } = this.timing;
    if (place === "start") {
      this.segment = { kind: "hold", time: atOnce ? 0 : this.time(now) };
      this.atStart = true;
      return;
    }
    if (atOnce || this.atStart) {
      // from the start, a swing plays from 0; a curl with no swing before it
      // is a jump, so it is shown at once
      this.segment =
        place === "curled"
          ? { kind: "hold", time: this.curlEnd }
          : {
              kind: "loop",
              startMs: now,
              from: atOnce ? swingStart : 0,
              curlAt: null,
            };
      this.atStart = false;
      return;
    }
    const segment = this.current(now);
    const time = this.time(now);
    if (place === "swing") {
      if (segment.kind === "loop") {
        this.segment = { ...segment, curlAt: null };
      } else if (segment.kind === "hold" || segment.rate === 1) {
        this.segment = { kind: "curl", startMs: now, from: time, rate: -1 };
      }
      return;
    }
    // place === "curled"
    if (segment.kind === "loop") {
      if (segment.curlAt === null) {
        this.segment = { ...segment, curlAt: this.nextBottom(segment, now) };
      }
    } else if (segment.kind === "curl" && segment.rate === -1) {
      this.segment = { kind: "curl", startMs: now, from: time, rate: 1 };
    }
  }
}

// The Mainspring slide's story (docs/watch.md, "The Mainspring slide"): the
// barrel arbor's angle, the mainspring's wind and the winding key's opacity,
// at each moment. No DOM and no WebGL here, so a test can drive the clock with
// made-up times.
//
// A SLIDE NAMES TARGETS, NOT MOVES (../../docs/navigation.md). Each click names
// a stage of the story (`watchMainspring`), in this order:
//   free: the bare spring and its arbor, at rest
//   wound: the outer end is held (the stud); the key fades in, turns the
//     arbor a third of a turn three times, with a pause after each, and fades
//     out, and the spring winds
//   released: the outer end is let go, and the spring uncoils to its rest
//   barrel: in the barrel, the key winds it again; the watch starts when the
//     key starts to turn
//   run down: a time-lapse: the watch runs fast until the barrel has turned
//     once, and the spring is let down. Then the watch stops
// The stages up to `barrel` are places on one line of story time (s). A step
// forward plays the line from where it is, from when the stage's change ends
// (the stud fades in, then the key winds). A step back cuts to its stage's
// pose at once:
// going back does not run time backward, so a key never unwinds. The
// time-lapse is a physical process: the train only goes forward, so a step
// back during it stops the train at its next tooth. A jump goes to the target
// at once.
//
// Angles are in degrees, clockwise on the slide. Winding turns the arbor the
// way the barrel turns as it lets the spring down: anticlockwise. `wind` is
// how far the arbor has turned against the spring's outer end; 0 is at rest.

import { check } from "../webgl/checked.ts";
import { ease, FADE_SECONDS } from "../webgl/timeline.ts";

export const MAINSPRING_STAGES = [
  "free",
  "wound",
  "released",
  "barrel",
  "run down",
] as const;
export type MainspringStage = (typeof MAINSPRING_STAGES)[number];

/** s: each turn of the key, and the pause after it. */
export const KEY_TURN_SECONDS = 0.5;
export const KEY_REST_SECONDS = 0.5;
export const KEY_TURNS = 3;
/** Degrees: each turn of the key. Three make one turn of the arbor: the
 *  wind that the barrel lets down in one turn. */
export const KEY_TURN_DEGREES = 120;
/** Degrees: the spring wound, by one turn of the arbor. */
export const WOUND = KEY_TURNS * KEY_TURN_DEGREES;
/** s: the key fades in, turns and pauses three times, and fades out. */
export const KEY_SECONDS =
  2 * FADE_SECONDS + KEY_TURNS * (KEY_TURN_SECONDS + KEY_REST_SECONDS);
/** s: the released spring uncoils. */
export const UNCOIL_SECONDS = 2;
/** How fast the uncoil settles: a critically damped spring's return, with
 *  this many time constants in UNCOIL_SECONDS. */
const UNCOIL_RATE = 7;
/** s: before the time-lapse starts, while its words fade in. */
export const LAPSE_WAIT_SECONDS = 0.5;
/** s: "6 hours in 6 seconds": one turn of the barrel. */
export const LAPSE_SECONDS = 6;
/** s: the time-lapse speeds up and slows down in this time, at each end. */
const LAPSE_RAMP_SECONDS = 0.5;

/** Where the story is at a moment. */
export interface MainspringPose {
  /** Degrees: the barrel arbor's angle, and the key's. */
  arbor: number;
  /** Degrees: the spring's wind, from 0 (at rest) to WOUND. */
  wind: number;
  /** The key's opacity, 0 to 1. */
  key: number;
}

/** A running spring, wound at `woundAt` degrees of the barrel. The arbor
 *  stays fixed. At zero wind, the spring stays at rest; this pose does not
 *  stop the mechanism. The barrel turns anticlockwise. */
export function runningSpringPose(
  woundAt: number,
  barrelAngle: number,
): MainspringPose {
  return {
    arbor: woundAt - WOUND,
    wind: Math.max(0, Math.min(WOUND, WOUND + barrelAngle - woundAt)),
    key: 0,
  };
}

/** A part of the line: the key's turns (which wind the spring, and start
 *  the watch if it is in the barrel), or the uncoil. */
type Segment =
  | { kind: "key"; starts: boolean; seconds: number }
  | { kind: "uncoil"; seconds: number };

const LINE: readonly Segment[] = [
  { kind: "key", starts: false, seconds: KEY_SECONDS },
  { kind: "uncoil", seconds: UNCOIL_SECONDS },
  { kind: "key", starts: true, seconds: KEY_SECONDS },
];

/** Story time (s) at the start of the line and at the end of each segment. */
const PLACES: readonly number[] = LINE.reduce<number[]>(
  (places, segment) => [...places, (places.at(-1) ?? 0) + segment.seconds],
  [0],
);

function placeOf(index: number): number {
  const place = PLACES[index];
  if (place === undefined) throw new Error(`no place ${String(index)}`);
  return place;
}

/** Each stage on the line, and its place: the end of its segment. */
const STAGE_PLACES = new Map<MainspringStage, number>([
  ["free", placeOf(0)],
  ["wound", placeOf(1)],
  ["released", placeOf(2)],
  ["barrel", placeOf(3)],
]);

/** Story times from which the watch runs: the first turn of each key that
 *  starts it. Nothing on the line stops it: only the time-lapse lets the
 *  spring down. */
const RUNS_FROM: readonly number[] = LINE.flatMap((segment, index) =>
  segment.kind === "key" && segment.starts
    ? [placeOf(index) + FADE_SECONDS]
    : [],
);

/** The place of a stage on the line (story time, s). `run down` is a
 *  time-lapse from the end of the line, where the key has wound the spring
 *  in the barrel. */
export function placeFor(stage: MainspringStage): number {
  if (stage === "run down") return placeOf(PLACES.length - 1);
  const place = STAGE_PLACES.get(stage);
  if (place === undefined) throw new Error(`no place for ${stage}`);
  return place;
}

/** Whether the watch runs at `stage`'s place on the line, or after it: in
 *  the barrel, and in the time-lapse. At an earlier stage, nothing moves
 *  but a step's change. */
export function storyRuns(stage: MainspringStage): boolean {
  return RUNS_FROM.some((from) => placeFor(stage) >= from);
}

function smoothstep(fraction: number): number {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}

/** A critically damped spring's return, from 0 to 1, with no speed at the
 *  start or the end, scaled to reach 1 at `fraction` 1. */
function uncoiled(fraction: number): number {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  const back = (at: number): number =>
    1 - (1 + UNCOIL_RATE * at) * Math.exp(-UNCOIL_RATE * at);
  return back(clamped) / back(1);
}

/** Degrees that the key has turned, `seconds` after its turns start. */
function keyTurned(seconds: number): number {
  const cycle = KEY_TURN_SECONDS + KEY_REST_SECONDS;
  const done = Math.min(Math.floor(seconds / cycle), KEY_TURNS);
  const into = seconds - done * cycle;
  const partial = done < KEY_TURNS ? smoothstep(into / KEY_TURN_SECONDS) : 0;
  return (done + partial) * KEY_TURN_DEGREES;
}

/** The pose at story time `time` on the line. */
export function linePose(time: number): MainspringPose {
  let arbor = 0;
  let wind = 0;
  let start = 0;
  for (const segment of LINE) {
    const local = Math.min(Math.max(time - start, 0), segment.seconds);
    if (segment.kind === "uncoil") {
      const left = wind * (1 - uncoiled(local / segment.seconds));
      if (time < start + segment.seconds) return { arbor, wind: left, key: 0 };
      wind = 0;
    } else {
      const turnsStart = FADE_SECONDS;
      const turnsEnd = segment.seconds - FADE_SECONDS;
      const turned = keyTurned(Math.max(local - turnsStart, 0));
      const key =
        local < turnsStart
          ? ease(local / FADE_SECONDS)
          : local < turnsEnd
            ? 1
            : 1 - ease((local - turnsEnd) / FADE_SECONDS);
      if (time < start + segment.seconds) {
        return {
          arbor: arbor - turned,
          wind: wind + turned,
          key,
        };
      }
      arbor -= WOUND;
      wind += WOUND;
    }
    start += segment.seconds;
  }
  return { arbor, wind, key: 0 };
}

/** How far through the time-lapse, from 0 to 1, `seconds` after its wait
 *  ends: it speeds up and slows down in LAPSE_RAMP_SECONDS, and holds its
 *  speed between. */
export function lapseProgress(seconds: number): number {
  const ramp = LAPSE_RAMP_SECONDS;
  const total = LAPSE_SECONDS;
  const clamped = Math.min(Math.max(seconds, 0), total);
  // the distance at full speed 1, with a smoothstep ramp at each end
  const rampDistance = (into: number): number => {
    const u = into / ramp;
    return ramp * (u * u * u - (u * u * u * u) / 2);
  };
  const full = total - ramp;
  const distance =
    clamped < ramp
      ? rampDistance(clamped)
      : clamped > total - ramp
        ? full - rampDistance(total - clamped)
        : clamped - ramp / 2;
  return distance / full;
}

/** A play of the line, forward, from one story time to another; it starts
 *  at `startMs`, and goes one story second a second. */
interface Play {
  kind: "play";
  from: number;
  to: number;
  startMs: number;
}
/** The time-lapse, from `from`, where the spring is wound in the barrel: it
 *  waits LAPSE_WAIT_SECONDS from `startMs`, then runs. */
interface Lapse {
  kind: "lapse";
  from: number;
  startMs: number;
}
type Move = Play | Lapse;

function endOf(move: Move): number {
  return move.kind === "play"
    ? move.startMs + (move.to - move.from) * 1000
    : move.startMs + (LAPSE_WAIT_SECONDS + LAPSE_SECONDS) * 1000;
}

export class MainspringClock {
  /** Beats of the train in one time-lapse: one turn of the barrel. */
  private readonly lapseBeats: number;
  /** Story time when no move runs. */
  private time = 0;
  /** A time-lapse from `time` has let the spring down. */
  private runDown = false;
  /** The moves still to come or running, in order. */
  private moves: Move[] = [];
  /** The beats that ended time-lapses have added to the train. */
  private committed = 0;
  /** The stage asked for, or `null` on a slide without the story. */
  private target: MainspringStage | null = null;

  /** `lapseBeats`: the train's beats in one turn of the barrel, a whole even
   *  number, so that the pallet meets the teeth as before. */
  constructor(lapseBeats: number) {
    check(
      Number.isInteger(lapseBeats) && lapseBeats > 0 && lapseBeats % 2 === 0,
      `a time-lapse of ${String(lapseBeats)} beats is not a whole number of teeth`,
    );
    this.lapseBeats = lapseBeats;
  }

  /** Drop the moves that have ended by `now`. */
  private advance(now: number): void {
    for (;;) {
      const first = this.moves[0];
      if (!first || now < endOf(first)) return;
      this.moves.shift();
      if (first.kind === "play") {
        this.time = first.to;
      } else {
        this.time = first.from;
        this.runDown = true;
        this.committed += this.lapseBeats;
      }
    }
  }

  /** The move running at `now`, if any (it may still wait for its start). */
  private running(now: number): Move | undefined {
    this.advance(now);
    return this.moves[0];
  }

  /** Story time on the line at `now`. During a time-lapse, where it
   *  started. */
  private lineAt(now: number): number {
    const move = this.running(now);
    if (!move) return this.time;
    if (move.kind === "lapse") return move.from;
    return move.from + Math.max(0, now - move.startMs) / 1000;
  }

  /** How far the time-lapse running at `now` has gone, or `null`. */
  private lapseAt(now: number): number | null {
    const move = this.running(now);
    if (move?.kind !== "lapse") return null;
    return lapseProgress((now - move.startMs) / 1000 - LAPSE_WAIT_SECONDS);
  }

  /** Cut to `time` at `now`: what runs stops. A time-lapse that runs stops
   *  at the train's next tooth: the train only goes forward. */
  private cut(time: number, now: number): void {
    const progress = this.lapseAt(now);
    if (progress !== null) {
      this.committed += 2 * Math.ceil((progress * this.lapseBeats) / 2);
    }
    this.moves = [];
    this.runDown = false;
    this.time = time;
  }

  /** Go to `stage` from where the clock is at `now`: at once, or by the rule
   *  at the top of this file. `after` (ms): when the stage's change ends; a
   *  step forward plays then. `null`: a slide without the story; the moves
   *  that run end, and a jump puts the spring at rest. */
  show(
    stage: MainspringStage | null,
    now: number,
    instantly: boolean,
    after = now,
  ): void {
    const fromTarget = this.target;
    this.target = stage;
    if (stage === null) {
      if (instantly) this.cut(0, now);
      return;
    }
    if (instantly || fromTarget === null) {
      // nothing of the story was on the screen: it starts at its stage
      this.cut(placeFor(stage), now);
      this.runDown = stage === "run down";
      return;
    }
    const lapsing = this.running(now)?.kind === "lapse";
    if (stage === "run down" && (lapsing || this.runDown)) return;
    const from = this.lineAt(now);
    const to = placeFor(stage);
    if (stage !== "run down" && (lapsing || this.runDown || to <= from)) {
      // a step back cuts to its stage: time does not run backward
      this.cut(to, now);
      return;
    }
    // a step forward plays from where the line is
    this.cut(from, now);
    const startMs = Math.max(after, now);
    this.moves.push({ kind: "play", from, to, startMs });
    if (stage === "run down") {
      this.moves.push({
        kind: "lapse",
        from: to,
        startMs: startMs + (to - from) * 1000,
      });
    }
  }

  /** Hold the story at `time` on the line (s), from `now`, in either
   *  direction: what runs stops. For a reader who scrubs the story with a
   *  slider (the article): not for the talk, where time does not run
   *  backward. */
  hold(time: number, now: number): void {
    check(
      Number.isFinite(time) && time >= 0 && time <= placeFor("barrel"),
      `story time ${String(time)} is not on the line`,
    );
    this.cut(time, now);
  }

  /** The arbor, the wind and the key at `now`. */
  pose(now: number): MainspringPose {
    const progress = this.lapseAt(now);
    const line = linePose(this.lineAt(now));
    if (progress !== null) {
      return { arbor: line.arbor, wind: line.wind * (1 - progress), key: 0 };
    }
    return this.runDown ? { arbor: line.arbor, wind: 0, key: 0 } : line;
  }

  /** Whether the watch runs at `now`: from the key's first turn in the
   *  barrel to the end of the time-lapse; `null` on a slide
   *  without the story, which sets it itself. */
  runs(now: number): boolean | null {
    if (this.target === null) return null;
    if (this.lapseAt(now) !== null) return true;
    if (this.runDown) return false;
    const time = this.lineAt(now);
    return RUNS_FROM.some((from) => time >= from);
  }

  /** The beats that the time-lapses have moved the mechanism on, at `now`.
   *  They only grow: the train only goes forward. */
  trainBeats(now: number): number {
    const progress = this.lapseAt(now) ?? 0;
    return this.committed + progress * this.lapseBeats;
  }

  /** When the last move ends (ms), or `now`. */
  endAt(now: number): number {
    this.advance(now);
    const last = this.moves.at(-1);
    return last ? endOf(last) : now;
  }

  /** Whether a move runs (or waits to start) at `now`. */
  moving(now: number): boolean {
    return this.running(now) !== undefined;
  }

  /** What the story is doing at `now`, for the measurement scripts. */
  phase(now: number): string | null {
    const move = this.running(now);
    if (!move) return null;
    return move.kind === "lapse" ? "mainspring time-lapse" : "mainspring";
  }
}

/** The pose that a stage shows once its moves end: for a still. */
export function stagePose(stage: MainspringStage): MainspringPose {
  const line = linePose(placeFor(stage));
  return stage === "run down" ? { arbor: line.arbor, wind: 0, key: 0 } : line;
}

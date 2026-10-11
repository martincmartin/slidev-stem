// The Spring Of Power slide's story (docs/watch.md, "The Spring Of Power slide"): the
// barrel arbor's angle, the mainspring's wind and the winding key's opacity,
// at each moment. No DOM and no WebGL here, so a test can drive the clock with
// made-up times.
//
// A SLIDE NAMES TARGETS, NOT MOVES (../../docs/navigation.md). Each click names
// a stage of the story (`watchMainspring`), in this order:
//   free: the bare spring and its arbor, at rest
//   turned: the key fades in, turns the arbor a third of a turn three times,
//     with a pause after each, and fades out. Nothing holds the outer end, so
//     the spring turns whole
//   wound: the same, with the outer end held (the stud): the spring winds
//   released: the outer end is let go, and the spring uncoils to its rest
//   barrel: in the barrel, the key winds it again; the watch starts when the
//     key starts to turn
//   barrel again: a trial, to compare `barrel` in another view: the spring
//     is let down at once, the watch stops, and the key winds it again
//   run down: a time-lapse: the watch runs fast until the barrel has turned
//     once, and the spring is let down. Then the watch stops
// The stages up to `barrel again` are places on one line of story time
// (s). A step forward plays the line from where it is, from when the stage's
// change ends (the stud fades in, then the key winds); a let-down at its start
// happens at once, at the click. A step back cuts to its stage's pose at once:
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
  "turned",
  "wound",
  "released",
  "barrel",
  "barrel again",
  "run down",
] as const;
export type MainspringStage = (typeof MAINSPRING_STAGES)[number];

/** The stages at which the spring is wound in the barrel, and the watch
 *  runs: `barrel` and its trials. */
export const BARREL_STAGES: ReadonlySet<MainspringStage> = new Set([
  "barrel",
  "barrel again",
]);

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
/** s: a let-down at once: the line needs a length for it. */
const LET_DOWN_SECONDS = 0.001;
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

/** A part of the line: the key's turns (which wind the spring if its outer
 *  end is held, and start the watch if it is in the barrel), the uncoil, or
 *  a let-down at once (which stops the watch). */
type Segment =
  | { kind: "key"; winds: boolean; starts: boolean; seconds: number }
  | { kind: "uncoil"; seconds: number }
  | { kind: "let down"; seconds: number };

const LINE: readonly Segment[] = [
  { kind: "key", winds: false, starts: false, seconds: KEY_SECONDS },
  { kind: "key", winds: true, starts: false, seconds: KEY_SECONDS },
  { kind: "uncoil", seconds: UNCOIL_SECONDS },
  { kind: "key", winds: true, starts: true, seconds: KEY_SECONDS },
  { kind: "let down", seconds: LET_DOWN_SECONDS },
  { kind: "key", winds: true, starts: true, seconds: KEY_SECONDS },
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
  ["turned", placeOf(1)],
  ["wound", placeOf(2)],
  ["released", placeOf(3)],
  ["barrel", placeOf(4)],
  ["barrel again", placeOf(6)],
]);

/** The places where the key has wound the spring in the barrel: a
 *  time-lapse starts from one, and ends where its key started. */
const WOUND_IN_BARREL = [placeOf(4), placeOf(6)];

/** How the watch runs: from the first turn of a key that starts it to the
 *  end of the next let-down, as story times. */
const RUNS: readonly [number, number][] = LINE.flatMap((segment, index) => {
  if (segment.kind !== "key" || !segment.starts) return [];
  const next = LINE.findIndex(
    (later, laterIndex) => laterIndex > index && later.kind === "let down",
  );
  return [
    [
      placeOf(index) + FADE_SECONDS,
      next === -1 ? Infinity : placeOf(next + 1),
    ] as [number, number],
  ];
});

/** The place of a stage on the line. `run down` is a time-lapse from the
 *  first place at or after `from` where the spring is wound in the barrel. */
function placeFor(stage: MainspringStage, from: number): number {
  if (stage === "run down") {
    const wound = WOUND_IN_BARREL.find((place) => place >= from - 1e-9);
    return wound ?? placeOf(PLACES.length - 1);
  }
  const place = STAGE_PLACES.get(stage);
  if (place === undefined) throw new Error(`no place for ${stage}`);
  return place;
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
    if (segment.kind === "uncoil" || segment.kind === "let down") {
      const fraction = local / segment.seconds;
      const left =
        wind *
        (1 - (segment.kind === "uncoil" ? uncoiled(fraction) : fraction));
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
          wind: segment.winds ? wind + turned : wind,
          key,
        };
      }
      arbor -= WOUND;
      if (segment.winds) wind += WOUND;
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
      this.cut(placeFor(stage, 0), now);
      this.runDown = stage === "run down";
      return;
    }
    const lapsing = this.running(now)?.kind === "lapse";
    if (stage === "run down" && (lapsing || this.runDown)) return;
    const from = this.lineAt(now);
    const to = placeFor(stage, from);
    if (stage !== "run down" && (lapsing || this.runDown || to <= from)) {
      // a step back cuts to its stage: time does not run backward
      this.cut(to, now);
      return;
    }
    // a step forward plays from where the line is; a let-down at its start
    // happens at once
    this.cut(from, now);
    let start = from;
    const next = LINE[PLACES.indexOf(from)];
    if (next?.kind === "let down" && to >= from + next.seconds) {
      start += next.seconds;
      this.time = start;
    }
    const startMs = Math.max(after, now);
    this.moves.push({ kind: "play", from: start, to, startMs });
    if (stage === "run down") {
      this.moves.push({
        kind: "lapse",
        from: to,
        startMs: startMs + (to - start) * 1000,
      });
    }
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
   *  barrel to a let-down or the end of the time-lapse; `null` on a slide
   *  without the story, which sets it itself. */
  runs(now: number): boolean | null {
    if (this.target === null) return null;
    if (this.lapseAt(now) !== null) return true;
    if (this.runDown) return false;
    const time = this.lineAt(now);
    return RUNS.some(([from, to]) => time >= from && time < to);
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
  const line = linePose(placeFor(stage, 0));
  return stage === "run down" ? { arbor: line.arbor, wind: 0, key: 0 } : line;
}

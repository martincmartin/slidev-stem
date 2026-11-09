// What a story map's marks show at a time (docs/globe.md, "The marks"): a
// pure function of the step's two targets and the frame's clock, so that
// the live layer, an article's figure and a still all draw the same thing.
// A slide names a target for each click (`globeLeg`, `globeMarks`): the
// last leg of the voyage that shows, and the marks. On a step forward, the
// new legs sail one after the other once the camera has come (`start`), and
// the new marks fade in; the marks that go fade out at once. A step back is
// the step forward reversed: the legs that go sail back, from the last. A
// step that leaves a story keeps its voyage whole, and its marks fade out:
// the map fades with the camera. A jump shows its target at once. A click
// can name marks that flash (`globeFlash`): on the step forward into it
// only, once its marks have faded in, they hide and show again, in the
// flash's rhythm (../../docs/illustrations.md, "Flash"). No DOM: the tests
// run it in Node.

import type { View } from "../webgl/scene.ts";
import { FLASH_SECONDS, flashIsOn } from "../webgl/timeline.ts";
import type { Leg, Mark, Point, Story } from "./stories.ts";

/** Seconds of a mark's fade. */
export const MARK_FADE_SECONDS = 0.4;

/** A story map's marks at a click: the story, how many of its legs show
 *  (the ship is at the end of the last), and the marks that show. */
export interface VoyageTarget {
  readonly story: Story;
  readonly legs: number;
  readonly marks: ReadonlySet<Mark>;
  /** Of `marks`, those that flash on the step forward into this click. */
  readonly flash: ReadonlySet<Mark>;
}

/** The frontmatter's names of a click's target (`voyageState`): the last
 *  leg that shows, or null, the marks, and the marks that flash on the
 *  step forward into the click (none if absent). */
export interface VoyageNames {
  readonly leg: string | null;
  readonly marks: readonly string[];
  readonly flash?: readonly string[];
}

/** The target that `names` give, on the story map whose view is `view`, or
 *  null if the slide names nothing. Throws if it names a leg or a mark that
 *  the story does not have, or names any on a view with no story. */
export function voyageTarget(
  stories: readonly Story[],
  view: View,
  names: VoyageNames,
): VoyageTarget | null {
  if (names.leg === null && names.marks.length === 0) return null;
  const story = stories.find((each) => each.placed.view === view);
  if (!story) {
    throw new Error(`globeLeg, globeMarks: the view ${view.name} has no story`);
  }
  const legs =
    names.leg === null
      ? 0
      : story.legs.findIndex((leg) => leg.name === names.leg) + 1;
  if (legs === 0 && names.leg !== null) {
    throw new Error(
      `globeLeg: no leg "${names.leg}"; the legs: ${story.legs.map((leg) => leg.name).join(", ")}`,
    );
  }
  const marks = names.marks.map((name) => {
    const found = story.marks.find((mark) => mark.name === name);
    if (!found) {
      throw new Error(
        `globeMarks: no mark "${name}"; the marks: ${story.marks.map((mark) => mark.name).join(", ")}`,
      );
    }
    return found;
  });
  const flash = (names.flash ?? []).map((name) => {
    const found = marks.find((mark) => mark.name === name);
    if (!found) {
      throw new Error(
        `globeFlash: "${name}" is not in globeMarks: ${names.marks.join(", ")}`,
      );
    }
    return found;
  });
  return { story, legs, marks: new Set(marks), flash: new Set(flash) };
}

/** Whether `target` shows a mark that moves by itself: the wind's gusts,
 *  which loop (StoryMaps.vue). */
export function movesByItself(target: VoyageTarget | null): boolean {
  return [...(target?.marks ?? [])].some((mark) =>
    mark.parts.some((part) => part.kind === "gust"),
  );
}

/** A step between two targets: `at` is when it happens, and `start` when
 *  its legs start to sail and its marks to fade in (ms; after the camera's
 *  move). A jump, or a still, has the same target both sides. `flash`: the
 *  marks that flash once the marks have faded in; none if absent. */
export interface VoyageStep {
  readonly from: VoyageTarget | null;
  readonly to: VoyageTarget | null;
  readonly at: number;
  readonly start: number;
  readonly flash?: ReadonlySet<Mark>;
}

/** The step that shows `target` at once. */
export function settled(target: VoyageTarget | null): VoyageStep {
  return { from: target, to: target, at: 0, start: 0 };
}

/** Make a step from the last target. A jump shows its target at once;
 *  otherwise the new legs wait for the camera. The target's marks flash
 *  only on a step forward (../../docs/navigation.md, an attention cue).
 *  Times are in ms. */
export function nextVoyage(
  previous: VoyageStep,
  to: VoyageTarget | null,
  timing: {
    readonly at: number;
    readonly cameraEnd: number;
    readonly jump: boolean;
    readonly forward: boolean;
  },
): VoyageStep {
  const { at, cameraEnd, jump, forward } = timing;
  const none: ReadonlySet<Mark> = new Set();
  const flash = !jump && forward ? (to?.flash ?? none) : none;
  return {
    from: jump ? to : previous.to,
    to,
    at,
    start: jump ? at : cameraEnd,
    ...(flash.size > 0 ? { flash } : {}),
  };
}

/** When `step`'s flash starts (ms): when its marks have faded in. */
function flashStart(step: VoyageStep): number {
  return step.start + MARK_FADE_SECONDS * 1000;
}

/** What a story map shows of its voyage at a time. For each of its legs:
 *  the share of the track drawn (null: the leg is not on the screen) and
 *  how many of its dots show
 *  (`dayDots`); where the ship is
 *  and which way it faces, or null; and each mark's opacity. */
export interface VoyageFrame {
  readonly tracks: readonly (number | null)[];
  readonly dots: readonly number[];
  readonly ship: {
    readonly at: Point;
    readonly heading: Leg["heading"];
  } | null;
  readonly marks: ReadonlyMap<Mark, number>;
  /** The marks that a flash hides now, at their opacity in `marks`. */
  readonly flashedOff: ReadonlySet<Mark>;
  /** The days at sea that the voyage shows: a day ends at each dot after a
   *  leg's first. */
  readonly days: number;
}

/** The point at `share` of the way along `route`, by length. */
export function along(route: readonly Point[], share: number): Point {
  const lengths = route.slice(1).map((point, index) => {
    const before = route[index] ?? point;
    return Math.hypot(point[0] - before[0], point[1] - before[1]);
  });
  let left = share * lengths.reduce((sum, length) => sum + length, 0);
  for (const [index, length] of lengths.entries()) {
    const [from, to] = [route[index], route[index + 1]];
    if (!from || !to) break;
    if (left <= length && length > 0) {
      const part = left / length;
      return [
        from[0] + (to[0] - from[0]) * part,
        from[1] + (to[1] - from[1]) * part,
      ];
    }
    left -= length;
  }
  const last = route.at(-1);
  if (!last) throw new Error("an empty route");
  return last;
}

/** A leg's dots: one where it starts, and one at the end of each day; none
 *  for a leg of no days. */
export function dayDots(leg: Leg): Point[] {
  if (leg.days === 0) return [];
  return Array.from({ length: leg.days + 1 }, (_, day) =>
    along(leg.route, day / leg.days),
  );
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/** The legs that `step` sails, in the order it sails them, and which
 *  way: on a step forward within a story, those that were not on the
 *  screen, from the first; on a step back, those that go, from the last.
 *  Other steps sail none. */
function sailing({ from, to }: VoyageStep): {
  readonly legs: readonly number[];
  readonly back: boolean;
} {
  if (!to || from?.story !== to.story) return { legs: [], back: false };
  const [low, high] = [
    Math.min(from.legs, to.legs),
    Math.max(from.legs, to.legs),
  ];
  const legs = Array.from({ length: high - low }, (_, index) => low + index);
  const back = from.legs > to.legs;
  return { legs: back ? legs.reverse() : legs, back };
}

/** When `step`'s change ends (ms): its legs have sailed, its marks have
 *  faded, and its flash has ended. A step that changes nothing ends when it happens (`at`): a jump,
 *  and every step of a slide with no story map. */
export function voyageEndAt(step: VoyageStep): number {
  const { from, to, at, start } = step;
  const fade = MARK_FADE_SECONDS * 1000;
  const seconds = sailing(step).legs.reduce(
    (sum, index) => sum + (to?.story.legs[index]?.seconds ?? 0),
    0,
  );
  // a mark is of one story, so a step to another story fades all of them
  const going = [...(from?.marks ?? [])].some((mark) => !to?.marks.has(mark));
  const coming = [...(to?.marks ?? [])].some((mark) => !from?.marks.has(mark));
  return Math.max(
    at,
    going ? at + fade : at,
    coming ? start + fade : at,
    seconds > 0 ? start + seconds * 1000 : at,
    step.flash?.size ? flashStart(step) + FLASH_SECONDS * 1000 : at,
  );
}

/** The voyage of `story` at `now` (ms) in `step`, or null if the step
 *  leaves it: each story map draws its own. */
export function voyageAt(
  story: Story,
  step: VoyageStep,
  now: number,
): VoyageFrame | null {
  const to = step.to?.story === story ? step.to : null;
  const from = step.from?.story === story ? step.from : null;
  if (!to && !from) return null;
  const fade = MARK_FADE_SECONDS * 1000;
  const marks = new Map<Mark, number>();
  for (const mark of story.marks) {
    const before = from?.marks.has(mark) === true;
    const after = to?.marks.has(mark) === true;
    if (before && after) marks.set(mark, 1);
    else if (after) marks.set(mark, clamp((now - step.start) / fade));
    else if (before) marks.set(mark, clamp(1 - (now - step.at) / fade));
  }
  // each leg's share of its track: whole, but for those that the step
  // sails, which play one after the other from its start. A leg is on the
  // screen once it has begun to sail, and until it has sailed back
  const { legs: sailed, back } = sailing(step);
  const shares = new Map<number, number | null>();
  let clock = (now - step.start) / 1000;
  for (const index of sailed) {
    const { seconds } = story.legs[index] ?? { seconds: 0 };
    const share = seconds > 0 ? clamp(clock / seconds) : clock >= 0 ? 1 : 0;
    const begun = clock >= 0;
    const over = seconds > 0 ? clock >= seconds : clock >= 0;
    shares.set(index, back ? (over ? null : 1 - share) : begun ? share : null);
    clock -= seconds;
  }
  // a map that the step leaves keeps its voyage whole: it goes with the
  // map's fade, by the camera's pose
  const shown = to
    ? Math.max(to.legs, back ? (from?.legs ?? 0) : 0)
    : (from?.legs ?? 0);
  const tracks: (number | null)[] = [];
  const dots: number[] = [];
  let ship: VoyageFrame["ship"] = null;
  for (const [index, leg] of story.legs.slice(0, shown).entries()) {
    const share = shares.has(index) ? (shares.get(index) ?? null) : 1;
    tracks.push(share);
    // a dot shows when the ship passes it
    dots.push(
      share !== null && leg.days > 0
        ? Math.floor(share * leg.days + 1e-9) + 1
        : 0,
    );
    // the ship is on the last leg on the screen
    if (share !== null)
      ship = { at: along(leg.route, share), heading: leg.heading };
  }
  const days = dots.reduce((sum, shown) => sum + Math.max(0, shown - 1), 0);
  const off = flashIsOn((now - flashStart(step)) / 1000);
  const flashedOff = new Set(
    [...(step.flash ?? [])].filter((mark) => off && marks.has(mark)),
  );
  return { tracks, dots, ship, marks, flashedOff, days };
}

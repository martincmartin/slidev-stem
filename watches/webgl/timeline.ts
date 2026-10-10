// The stage's choreography, without a renderer or a clock of its own: which
// channel moves when. `Stage` (stage.ts) draws what it says; this file has no
// DOM and no WebGL, so a test can drive it with made-up times.
//
// ONE RULE. A state names the meshes that it shows. From the shown set A to
// the shown set B, with D the meshes on the screen while the camera moves
// (`StageState.moveWith`: by default the meshes of both; and the meshes of
// A in `StageState.goLater`):
//   1. A becomes D: the meshes of A that are not in D fade out; then the
//      meshes of D that are not in A fade in.
//   2. The camera moves and tilts, eased: zooming in, it moves and then
//      tilts; otherwise it untilts and then moves. If D is empty, nothing is
//      on the screen, and the camera jumps.
//   3. D becomes B, as in 1; of the meshes that fade in, those in
//      `StageState.later` fade in after the others.
// The meshes in `StageState.cut` do not fade: they go, or come, at once,
// before the others fade. A DIM (`StageState.dim`) changes in 3, after the
// meshes that go have faded out and before the others fade in: so a camera
// move shows the old dim, and a dim that comes with a zoom in follows it.
// Without a camera move, A becomes B, as in 3. A fade fades its meshes as one
// picture, over the meshes that stay. A new state starts from what is on the
// screen now: a fade cut short first ends (at 1 if the new state shows every
// mesh that fades, else at 0), and a camera move goes on from where it is.
//
// A FLASH (docs/illustrations.md, "Flash"). A state can name meshes to flash:
// they are drawn in FLASH_INKS and in their own inks, in turn, FLASH_CYCLES
// times. If they are all on the screen already, at full opacity, the flash
// plays before the change, and the change waits for it: it points to where
// the camera goes. If not, it plays when the change ends, on the meshes that
// have faded in. A new state with the same flash lets a flash that has
// started go on, and places one that is still waiting again. Only in a
// transition: a state shown at once, or one that changes nothing,
// does not flash. The caller names a flash only on the step forward into its
// slide (../../docs/navigation.md): the timeline does not know which way a
// change goes.

import type { Mesh, View } from "./scene.ts";

export const MOVE_SECONDS = 1.8;
export const FADE_SECONDS = 0.8;
/** A dim, or its end, eases in this time. */
export const DIM_SECONDS = FADE_SECONDS;
export const TILT_SECONDS = 1.5;
/** A flash: on (in FLASH_INKS), then off (in its own inks), this many times. */
export const FLASH_ON_SECONDS = 0.25;
export const FLASH_OFF_SECONDS = 0.25;
export const FLASH_CYCLES = 5;
export const FLASH_SECONDS =
  FLASH_CYCLES * (FLASH_ON_SECONDS + FLASH_OFF_SECONDS);

/** Whether a flash that started `elapsed` seconds ago is on. */
export function flashIsOn(elapsed: number): boolean {
  if (elapsed < 0 || elapsed >= FLASH_SECONDS) return false;
  return elapsed % (FLASH_ON_SECONDS + FLASH_OFF_SECONDS) < FLASH_ON_SECONDS;
}

/** What is on the screen while the camera moves: the meshes that the old and
 *  the new state both show, all the meshes of either, or none (the camera
 *  jumps). */
export type MoveWith = "common" | "all" | "none";

/** What the camera and the fade show. */
export interface StageState {
  view: View;
  /** Degrees. */
  tilt: number;
  /** The meshes on the screen; the others are faded out. */
  shown: ReadonlySet<Mesh>;
  /** Flashed before the change if they are on the screen, else after it;
   *  `null`: none. */
  flash: ReadonlySet<Mesh> | null;
  /** Of the meshes that fade in at the end of the change, these fade in
   *  after the others. */
  later: ReadonlySet<Mesh>;
  /** Of the meshes that go or come, these do so at once, with no fade. */
  cut: ReadonlySet<Mesh>;
  /** Of the meshes that go, these stay on the screen while the camera moves,
   *  and go after it. */
  goLater: ReadonlySet<Mesh>;
  moveWith: MoveWith;
  /** The dimmed meshes: the weight of each one's own colours against the
   *  paper (`Frame.dim`). Default: none. */
  dim?: ReadonlyMap<Mesh, number>;
}

/** Where each channel is. */
export interface Values {
  view: View;
  tilt: number;
  /** Drawn at full opacity. */
  keep: ReadonlySet<Mesh>;
  /** Drawn at opacity `rest`, as one picture: the meshes that fade in or
   *  out. Empty while nothing fades. */
  fade: ReadonlySet<Mesh>;
  rest: number;
  /** The weight of each dimmed mesh's own colours. */
  dim: ReadonlyMap<Mesh, number>;
}

const NOTHING: ReadonlySet<Mesh> = new Set();
const UNDIMMED: ReadonlyMap<Mesh, number> = new Map();

/** A channel's move from one value to another. Each variant ties the channel
 *  to the type of its values. */
type Phase = {
  /** ms. */
  start: number;
  /** 0: a jump. */
  seconds: number;
} & (
  | { channel: "view"; from: View; to: View }
  | { channel: "tilt"; from: number; to: number }
  | {
      channel: "fade";
      keep: ReadonlySet<Mesh>;
      fade: ReadonlySet<Mesh>;
      from: number;
      to: number;
      /** What is on the screen at its end. */
      after: ReadonlySet<Mesh>;
    }
  | {
      channel: "dim";
      from: ReadonlyMap<Mesh, number>;
      to: ReadonlyMap<Mesh, number>;
    }
);

export function ease(fraction: number): number {
  return fraction < 0.5 ? 4 * fraction ** 3 : 1 - (-2 * fraction + 2) ** 3 / 2;
}

export function mix(first: number, second: number, fraction: number): number {
  return first + (second - first) * fraction;
}

/** An eased mix of two views, as a view of its own. */
export function mixView(first: View, second: View, fraction: number): View {
  return {
    name: `${first.name} to ${second.name}`,
    scale: mix(first.scale, second.scale, fraction),
    shift: [
      mix(first.shift[0], second.shift[0], fraction),
      mix(first.shift[1], second.shift[1], fraction),
    ],
    pivot: [
      mix(first.pivot[0], second.pivot[0], fraction),
      mix(first.pivot[1], second.pivot[1], fraction),
      mix(first.pivot[2], second.pivot[2], fraction),
    ],
  };
}

/** Whether two views put the camera at the same place. */
function sameView(first: View, second: View): boolean {
  return (
    first.scale === second.scale &&
    first.shift.every((value, axis) => value === second.shift[axis]) &&
    first.pivot.every((value, axis) => value === second.pivot[axis])
  );
}

function union(
  first: ReadonlySet<Mesh>,
  second: ReadonlySet<Mesh>,
): ReadonlySet<Mesh> {
  return new Set([...first, ...second]);
}

/** The meshes of `first` that are not in `second`. */
function minus(
  first: ReadonlySet<Mesh>,
  second: ReadonlySet<Mesh>,
): ReadonlySet<Mesh> {
  return new Set([...first].filter((mesh) => !second.has(mesh)));
}

function within(inner: ReadonlySet<Mesh>, outer: ReadonlySet<Mesh>): boolean {
  return [...inner].every((mesh) => outer.has(mesh));
}

function sameSet(first: ReadonlySet<Mesh>, second: ReadonlySet<Mesh>): boolean {
  return first.size === second.size && within(first, second);
}

function sameDim(
  first: ReadonlyMap<Mesh, number>,
  second: ReadonlyMap<Mesh, number>,
): boolean {
  return (
    first.size === second.size &&
    [...first].every(([mesh, weight]) => second.get(mesh) === weight)
  );
}

/** The weights of two dims, mixed: a mesh that one of them leaves out is at
 *  1 there. */
function mixDim(
  first: ReadonlyMap<Mesh, number>,
  second: ReadonlyMap<Mesh, number>,
  fraction: number,
): ReadonlyMap<Mesh, number> {
  const mixed = new Map<Mesh, number>();
  for (const mesh of new Set([...first.keys(), ...second.keys()])) {
    mixed.set(mesh, mix(first.get(mesh) ?? 1, second.get(mesh) ?? 1, fraction));
  }
  return mixed;
}

/** `values` with `phase` applied at `now`. At its end, a phase gives the
 *  target itself, so that the next state can tell that its channel is already
 *  there. */
function applyPhase(values: Values, phase: Phase, now: number): void {
  if (now < phase.start) return;
  const fraction =
    phase.seconds === 0
      ? 1
      : Math.min(1, (now - phase.start) / (phase.seconds * 1000));
  const eased = ease(fraction);
  const done = fraction >= 1;
  switch (phase.channel) {
    case "view":
      values.view = done ? phase.to : mixView(phase.from, phase.to, eased);
      break;
    case "tilt":
      values.tilt = done ? phase.to : mix(phase.from, phase.to, eased);
      break;
    case "fade":
      values.keep = done ? phase.after : phase.keep;
      values.fade = done ? NOTHING : phase.fade;
      values.rest = done ? 1 : mix(phase.from, phase.to, eased);
      break;
    case "dim":
      values.dim = done ? phase.to : mixDim(phase.from, phase.to, eased);
      break;
  }
}

export class Timeline {
  /** Where each channel is, when no phase runs. */
  private values: Values | null = null;
  /** One after another. */
  private phases: Phase[] = [];
  /** The flash and when it starts (ms). */
  private flash: { meshes: ReadonlySet<Mesh>; start: number } | null = null;

  /** Whether a state has been shown yet. Until then, there is nothing to
   *  move from, and the first state is shown at once. */
  get hasState(): boolean {
    return this.values !== null;
  }

  /** Go to a state at `now` (ms): at once, or by the rule at the top of this
   *  file, from where the channels are now. Returns the seconds until the
   *  flash ends, or 0 if there is none. */
  show(state: StageState, now: number, instantly = false): number {
    const running = this.flash;
    this.flash = null;
    if (instantly || !this.values) {
      this.values = {
        view: state.view,
        tilt: state.tilt,
        keep: state.shown,
        fade: NOTHING,
        rest: 1,
        dim: state.dim ?? UNDIMMED,
      };
      this.phases = [];
      return 0;
    }
    const current = this.valuesAt(now);
    this.values = current;
    this.phases = [];
    let start = now;
    const add = (phase: Phase): void => {
      this.phases.push(phase);
      start += phase.seconds * 1000;
    };
    const fade = (
      keep: ReadonlySet<Mesh>,
      meshes: ReadonlySet<Mesh>,
      from: number,
      to: number,
      seconds = FADE_SECONDS,
    ): void => {
      const after = to === 1 ? union(keep, meshes) : keep;
      add({
        channel: "fade",
        keep,
        fade: meshes,
        from,
        to,
        after,
        start,
        seconds,
      });
    };
    // what is on the screen when the phases so far end
    let shown = current.keep;
    if (current.fade.size > 0) {
      // a fade cut short ends first
      const wanted = within(current.fade, state.shown);
      fade(current.keep, current.fade, current.rest, wanted ? 1 : 0);
      if (wanted) shown = union(current.keep, current.fade);
    }
    const become = (
      target: ReadonlySet<Mesh>,
      later: ReadonlySet<Mesh> = NOTHING,
      between: () => void = () => undefined,
    ): void => {
      const going = minus(shown, target);
      const cutGoing = new Set(
        [...going].filter((mesh) => state.cut.has(mesh)),
      );
      if (cutGoing.size > 0) {
        shown = minus(shown, cutGoing);
        fade(shown, cutGoing, 1, 0, 0);
      }
      const fading = minus(going, cutGoing);
      if (fading.size > 0) {
        shown = minus(shown, fading);
        fade(shown, fading, 1, 0);
      }
      between();
      const cutComing = new Set(
        [...minus(target, shown)].filter((mesh) => state.cut.has(mesh)),
      );
      if (cutComing.size > 0) {
        fade(shown, cutComing, 0, 1, 0);
        shown = union(shown, cutComing);
      }
      const coming = minus(target, shown);
      const first = minus(coming, later);
      for (const meshes of [first, minus(coming, first)]) {
        if (meshes.size > 0) {
          fade(shown, meshes, 0, 1);
          shown = union(shown, meshes);
        }
      }
    };
    const moves = !sameView(current.view, state.view);
    const tilts = current.tilt !== state.tilt;
    if (moves || tilts) {
      const moveWith =
        state.moveWith === "all"
          ? union(shown, state.shown)
          : state.moveWith === "none"
            ? NOTHING
            : new Set([...shown].filter((mesh) => state.shown.has(mesh)));
      const during = union(
        moveWith,
        new Set([...shown].filter((mesh) => state.goLater.has(mesh))),
      );
      become(during);
      // a move that nobody sees is a jump
      const seen = during.size > 0;
      const move = (): void => {
        if (!moves) return;
        add({
          channel: "view",
          from: current.view,
          to: state.view,
          start,
          seconds: seen ? MOVE_SECONDS : 0,
        });
      };
      const tilt = (): void => {
        if (!tilts) return;
        add({
          channel: "tilt",
          from: current.tilt,
          to: state.tilt,
          start,
          seconds: seen ? TILT_SECONDS : 0,
        });
      };
      if (state.view.scale > current.view.scale) {
        move();
        tilt();
      } else {
        tilt();
        move();
      }
    }
    const dimTo = state.dim ?? UNDIMMED;
    become(state.shown, state.later, () => {
      if (sameDim(current.dim, dimTo)) return;
      add({
        channel: "dim",
        from: current.dim,
        to: dimTo,
        start,
        seconds: DIM_SECONDS,
      });
    });
    if (!state.flash || this.phases.length === 0) return 0;
    // only meshes at full opacity are on the screen: a fading one is not, yet
    const onScreen = within(state.flash, current.keep);
    // a flash of the same meshes that has started goes on: a click during it
    // does not start it again. One that is still waiting is placed again.
    const goesOn =
      running &&
      sameSet(running.meshes, state.flash) &&
      running.start <= now &&
      now < running.start + FLASH_SECONDS * 1000
        ? running
        : null;
    const flashStart = goesOn ? goesOn.start : onScreen ? now : start;
    this.flash = { meshes: state.flash, start: flashStart };
    // flashing and moving never happen together
    if (onScreen || goesOn) {
      const delay = flashStart + FLASH_SECONDS * 1000 - now;
      for (const phase of this.phases) phase.start += delay;
    }
    return FLASH_SECONDS - (now - flashStart) / 1000;
  }

  /** The flashed meshes, if the flash is on at `now`. */
  flashingAt(now: number): ReadonlySet<Mesh> | null {
    const { flash } = this;
    if (!flash || !flashIsOn((now - flash.start) / 1000)) return null;
    return flash.meshes;
  }

  /** Each channel's value at `now`. */
  valuesAt(now: number): Values {
    if (!this.values) throw new Error("the timeline has no state yet");
    const values = { ...this.values };
    for (const phase of this.phases) applyPhase(values, phase, now);
    return values;
  }

  /** When the last camera move ends (ms), or `now` if none is still to come.
   *  Text that must not cross a moving picture waits for it, in either
   *  direction: towards a close view the camera moves first, away from it
   *  last. After a jump, the text waits for the old picture to go. */
  viewEndAt(now: number): number {
    const ends = this.phases
      .filter((phase) => phase.channel === "view")
      .map((phase) => phase.start + phase.seconds * 1000);
    return Math.max(now, ...ends);
  }

  /** When the change ends (ms), with its flash, or `now` if nothing is
   *  still to come. Text that follows what the picture shows waits for it. */
  endAt(now: number): number {
    const ends = this.phases.map((phase) => phase.start + phase.seconds * 1000);
    if (this.flash) ends.push(this.flash.start + FLASH_SECONDS * 1000);
    return Math.max(now, ...ends);
  }

  /** What the timeline is moving at `now`: "flash", the name of a channel, or
   *  `null` if nothing. */
  phaseAt(now: number): string | null {
    const running = this.phases.find(
      (phase) => now >= phase.start && now < phase.start + phase.seconds * 1000,
    );
    if (running) return running.channel;
    const { flash } = this;
    if (
      flash &&
      now >= flash.start &&
      now < flash.start + FLASH_SECONDS * 1000
    ) {
      return "flash";
    }
    return null;
  }
}

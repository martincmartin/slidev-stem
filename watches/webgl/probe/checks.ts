// Checks of the renderer, the stage and the stills that need a browser:
// context loss, dispose, a dynamic mesh drawn last, the fade, a recolour,
// a dim, the flash, and the contract of each input. They draw small scenes of their own, not the
// watch. `window.webglChecks()` runs them all; art/watch_stills.py calls it.

import { check } from "../checked.ts";
import { IDENTITY } from "../math.ts";
import {
  extrude,
  polygonRing,
  ribbonGeometry,
  ribbon,
  smoothRing,
} from "../mesh.ts";
import type { Point2 } from "../mesh.ts";
import { Renderer } from "../renderer.ts";
import { FLASH_INKS, INKS, hexRgb } from "../scene.ts";
import type {
  Frame,
  Group,
  Mesh,
  MeshGeometry,
  Palette,
  Scene,
} from "../scene.ts";
import { Stage } from "../stage.ts";
import type { Model } from "../stage.ts";
import { Stills } from "../stills.ts";
import {
  FADE_SECONDS,
  FLASH_OFF_SECONDS,
  FLASH_ON_SECONDS,
  FLASH_SECONDS,
} from "../timeline.ts";
import type { StageState } from "../timeline.ts";

export interface CheckResult {
  name: string;
  /** `null` if it passed. */
  failure: string | null;
}

declare global {
  interface Window {
    webglChecks?: () => Promise<CheckResult[]>;
  }
}

const SIZE: [number, number] = [200, 100];
const CHECK_SECONDS = 10;
const STYLE = { ink: INKS.subject, opacity: 1, width: 3 };
const PALETTE: Palette = {
  paper: "#FAF7F0",
  subject: "#143C6B",
  subjectWash: "#E3E8EC",
  muted: "#736A60",
  mutedWash: "#E2DED6",
  ink: "#2A2520",
  second: "#9A6238",
  secondWash: "#E6D8CA",
};
/** Another palette, with another paper: Campfire's, as an example. */
const DARK: Palette = {
  paper: "#241E1A",
  subject: "#FFCC8F",
  subjectWash: "#3D3731",
  muted: "#B5A594",
  mutedWash: "#4A403A",
  ink: "#F6EEE3",
  second: "#54BCD6",
  secondWash: "#2D3A3C",
};

function square(left: number, top: number, side: number): Point2[] {
  return [
    [left, top],
    [left + side, top],
    [left + side, top + side],
    [left, top + side],
  ];
}

function springPoints(turn: number): Point2[] {
  return Array.from({ length: 24 }, (_, index): Point2 => {
    const angle = turn + index * 0.5;
    const radius = 10 + index * 1.2;
    return [140 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)];
  });
}

function springGeometry(turn: number): MeshGeometry {
  return ribbonGeometry(smoothRing(springPoints(turn), STYLE, false), 0, 4);
}

/** A test scene: two boxes that overlap, in a group, and a dynamic spring
 *  whose lines are drawn last. */
function makeScene(): {
  scene: Scene;
  group: Group;
  front: Mesh;
  back: Mesh;
  spring: Mesh;
} {
  const group: Group = { name: "root", parent: null };
  const box = (name: string, left: number, bottom: number): Mesh =>
    extrude([polygonRing(square(left, 20, 50), STYLE)], bottom, bottom + 10, {
      name,
      part: name,
      group,
      fill: { ink: INKS.subjectWash, opacity: 1 },
      lineOrder: bottom + 10,
    });
  const back = box("back", 20, 0);
  const front = box("front", 50, 20);
  const spring = ribbon(smoothRing(springPoints(0), STYLE, false), 0, 4, {
    name: "spring",
    part: "spring",
    group,
    fill: null,
    lineOrder: 1000,
    dynamic: true,
  });
  const scene: Scene = {
    slide: SIZE,
    meshes: [back, front, spring],
    groups: [group],
    views: [{ name: "all", scale: 1, shift: [0, 0], pivot: [0, 0, 0] }],
    pieces: [
      { name: "front", meshes: new Set([front]), inAll: true },
      { name: "back", meshes: new Set([back]), inAll: true },
    ],
  };
  return { scene, group, front, back, spring };
}

/** A stage state of the test scene that shows `shown` (default: all). */
function stateOf(
  test: TestScene,
  shown: ReadonlySet<Mesh> = new Set(test.scene.meshes),
  flash: ReadonlySet<Mesh> | null = null,
): StageState {
  const view = test.scene.views[0];
  check(view !== undefined, "no view");
  return {
    view,
    tilt: 0,
    shown,
    flash,
    later: new Set(),
    cut: new Set(),
    goLater: new Set(),
    moveWith: "common",
  };
}

type TestScene = ReturnType<typeof makeScene>;

function frameOf(test: TestScene, extra: Partial<Frame> = {}): Frame {
  return {
    view: test.scene.views[0] ?? {
      name: "none",
      scale: 1,
      shift: [0, 0],
      pivot: [0, 0, 0],
    },
    tilt: 30,
    groupMatrices: new Map([[test.group, IDENTITY]]),
    size: SIZE,
    ...extra,
  };
}

function canvas(): HTMLCanvasElement {
  return document.createElement("canvas");
}

function renderer(target: HTMLCanvasElement, scene: Scene): Renderer {
  return new Renderer(target, scene, PALETTE, { preserveDrawingBuffer: true });
}

function contextOf(target: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = target.getContext("webgl2");
  check(gl !== null, "no context");
  return gl;
}

function pixels(target: HTMLCanvasElement): Uint8Array {
  const gl = contextOf(target);
  const values = new Uint8Array(target.width * target.height * 4);
  gl.readPixels(
    0,
    0,
    target.width,
    target.height,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    values,
  );
  return values;
}

function noError(target: HTMLCanvasElement): void {
  const gl = contextOf(target);
  const error = gl.getError();
  check(error === gl.NO_ERROR, `WebGL error ${String(error)}`);
}

/** How many channels differ by more than `tolerance`. */
function differences(
  first: Uint8Array,
  second: Uint8Array,
  tolerance = 0,
): number {
  check(first.length === second.length, "the pictures differ in size");
  let count = 0;
  for (const [index, value] of first.entries()) {
    if (Math.abs(value - (second[index] ?? 0)) > tolerance) count++;
  }
  return count;
}

function same(first: Uint8Array, second: Uint8Array, what: string): void {
  const count = differences(first, second);
  check(count === 0, `${what}: ${String(count)} channels differ`);
}

function throws(action: () => unknown, pattern: RegExp): void {
  try {
    action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    check(pattern.test(message), `threw "${message}", not ${String(pattern)}`);
    return;
  }
  throw new Error(`did not throw ${String(pattern)}`);
}

function nextEvent(target: HTMLCanvasElement, name: string): Promise<void> {
  return new Promise((resolve) => {
    target.addEventListener(
      name,
      () => {
        resolve();
      },
      { once: true },
    );
  });
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** What a fresh renderer draws for the scene with the spring's geometry. */
function expected(
  test: TestScene,
  geometry: MeshGeometry,
  frame: Frame,
): Uint8Array {
  const spring: Mesh = { ...test.spring, ...geometry };
  const scene: Scene = {
    ...test.scene,
    meshes: test.scene.meshes.map((mesh) =>
      mesh === test.spring ? spring : mesh,
    ),
  };
  const target = canvas();
  const fresh = renderer(target, scene);
  try {
    fresh.render(frame);
    return pixels(target);
  } finally {
    fresh.dispose();
  }
}

/** Keep `thing` until the check ends, and dispose it then, even if the check
 *  fails: a failed check does not leave a live context to the next one. */
type Own = <Thing extends { dispose(): void }>(thing: Thing) => Thing;

const CHECKS: [string, (own: Own) => Promise<void> | void][] = [
  [
    "a dynamic mesh drawn last takes new geometry, with no GL error",
    (own) => {
      const test = makeScene();
      const target = canvas();
      const drawn = own(renderer(target, test.scene));
      const frame = frameOf(test);
      drawn.render(frame);
      for (const turn of [0.3, 0.6, 0.9]) {
        drawn.updateMesh(test.spring, springGeometry(turn));
        drawn.render(frame);
        noError(target);
      }
      same(
        pixels(target),
        expected(test, springGeometry(0.9), frame),
        "after three updates",
      );
      drawn.dispose();
    },
  ],
  [
    "the renderer leaves the default bindings",
    (own) => {
      const test = makeScene();
      const target = canvas();
      const drawn = own(renderer(target, test.scene));
      drawn.render(frameOf(test, { keep: new Set([test.front]), rest: 0.5 }));
      const gl = contextOf(target);
      for (const binding of [
        gl.VERTEX_ARRAY_BINDING,
        gl.CURRENT_PROGRAM,
        gl.ARRAY_BUFFER_BINDING,
        gl.FRAMEBUFFER_BINDING,
        gl.TEXTURE_BINDING_2D,
      ]) {
        check(
          gl.getParameter(binding) === null,
          `binding ${String(binding)} is not null`,
        );
      }
      drawn.dispose();
    },
  ],
  [
    "a fade: rest 1 is the whole scene, rest 0.5 is halfway between 0 and 1",
    (own) => {
      const test = makeScene();
      const target = canvas();
      const drawn = own(renderer(target, test.scene));
      const keep = new Set([test.front]);
      drawn.render(frameOf(test));
      const whole = pixels(target);
      drawn.render(frameOf(test, { keep, rest: 1 }));
      same(pixels(target), whole, "rest 1");
      drawn.render(frameOf(test, { keep, rest: 0 }));
      const kept = pixels(target);
      check(differences(kept, whole) > 0, "rest 0 is the same as rest 1");
      drawn.render(frameOf(test, { keep, rest: 0.5 }));
      const half = pixels(target);
      const middle = whole.map(
        (value, index) => (value + (kept[index] ?? 0)) / 2,
      );
      const off = differences(half, middle, 1);
      check(off === 0, `rest 0.5: ${String(off)} channels are not halfway`);
      drawn.dispose();
    },
  ],
  [
    "a lost context: frames are skipped, and after its restoration the last geometry is drawn",
    async (own) => {
      const test = makeScene();
      const target = canvas();
      const drawn = own(renderer(target, test.scene));
      const frame = frameOf(test);
      drawn.render(frame);
      const lose = contextOf(target).getExtension("WEBGL_lose_context");
      check(lose !== null, "no WEBGL_lose_context");
      const lost = nextEvent(target, "webglcontextlost");
      lose.loseContext();
      await lost;
      // The await resumes while the browser still dispatches the event, before
      // it allows a restoration: wait for the next task.
      await wait(0);
      drawn.render(frame);
      drawn.updateMesh(test.spring, springGeometry(1.2));
      const restored = nextEvent(target, "webglcontextrestored");
      lose.restoreContext();
      await restored;
      drawn.render(frame);
      noError(target);
      check(
        drawn.contextsLost === 1,
        `contextsLost is ${String(drawn.contextsLost)}`,
      );
      same(
        pixels(target),
        expected(test, springGeometry(1.2), frame),
        "after the restoration",
      );
      drawn.dispose();
    },
  ],
  [
    "dispose: a second call does nothing, the renderer refuses work, and the canvas takes a new renderer",
    (own) => {
      const test = makeScene();
      const target = canvas();
      const first = own(renderer(target, test.scene));
      throws(() => renderer(target, test.scene), /another renderer/);
      first.render(frameOf(test));
      const before = pixels(target);
      first.dispose();
      first.dispose();
      throws(() => {
        first.render(frameOf(test));
      }, /disposed/);
      throws(() => {
        first.updateMesh(test.spring, springGeometry(0));
      }, /disposed/);
      // its listener is gone: a restored event does not make its resources again
      target.dispatchEvent(new Event("webglcontextrestored"));
      const second = own(renderer(target, test.scene));
      second.render(frameOf(test));
      same(pixels(target), before, "a new renderer on the same canvas");
      second.dispose();
      throws(() => new Renderer(target, test.scene, PALETTE), /other settings/);
    },
  ],
  [
    "setPalette: the next frame is in the new colours, and back again",
    (own) => {
      const test = makeScene();
      const target = canvas();
      const drawn = own(renderer(target, test.scene));
      drawn.render(frameOf(test));
      const before = pixels(target);
      drawn.setPalette(DARK);
      drawn.render(frameOf(test));
      const dark = pixels(target);
      check(
        dark[0] === 0x24 && dark[1] === 0x1e && dark[2] === 0x1a,
        `the paper is ${String([...dark.slice(0, 3)])}, not the dark paper`,
      );
      drawn.setPalette(PALETTE);
      drawn.render(frameOf(test));
      same(pixels(target), before, "the first palette again");
      throws(() => {
        drawn.setPalette({ ...PALETTE, ink: "dark" });
      }, /dark/);
      drawn.dispose();
      throws(() => {
        drawn.setPalette(PALETTE);
      }, /disposed/);
    },
  ],
  [
    "the renderer refuses a frame or a mesh that breaks its contract",
    (own) => {
      const test = makeScene();
      const other = makeScene();
      const target = canvas();
      const drawn = own(renderer(target, test.scene));
      const cases: [RegExp, () => void][] = [
        [
          /no matrix for root/,
          () => {
            drawn.render(frameOf(test, { groupMatrices: new Map() }));
          },
        ],
        [
          /not affine/,
          () => {
            const matrix = Float32Array.from(IDENTITY);
            matrix[3] = 1;
            drawn.render(
              frameOf(test, { groupMatrices: new Map([[test.group, matrix]]) }),
            );
          },
        ],
        [
          /singular/,
          () => {
            drawn.render(
              frameOf(test, {
                groupMatrices: new Map([
                  [test.group, new Float32Array(16).fill(0).fill(1, 15)],
                ]),
              }),
            );
          },
        ],
        [
          /outside 0..1/,
          () => {
            drawn.render(frameOf(test, { rest: 1.5 }));
          },
        ],
        [
          /not in the scene/,
          () => {
            drawn.render(frameOf(test, { keep: new Set([other.front]) }));
          },
        ],
        [
          /0 x 100/,
          () => {
            drawn.render(frameOf(test, { size: [0, 100] }));
          },
        ],
        [
          /not dynamic/,
          () => {
            drawn.updateMesh(test.front, springGeometry(0));
          },
        ],
        [
          /not in the scene/,
          () => {
            drawn.updateMesh(other.spring, springGeometry(0));
          },
        ],
        [
          /whole triangles/,
          () => {
            drawn.updateMesh(test.spring, {
              ...springGeometry(0),
              triangles: new Float32Array(3),
            });
          },
        ],
      ];
      for (const [pattern, action] of cases) throws(action, pattern);
      drawn.render(frameOf(test));
      noError(target);
      drawn.dispose();
    },
  ],
  [
    "the stage runs one loop, however often it starts and stops, and dispose ends it",
    async (own) => {
      const test = makeScene();
      const model: Model<null> = {
        show: () => undefined,
        frame: () => new Map([[test.group, IDENTITY]]),
        phase: () => "still",
      };
      const target = canvas();
      const stage = own(new Stage(target, test.scene, PALETTE, model));
      stage.show(stateOf(test), null, true);
      let animationFrames = 0;
      let counting = true;
      const count = (): void => {
        animationFrames++;
        if (counting) requestAnimationFrame(count);
      };
      requestAnimationFrame(count);
      stage.start();
      stage.stop();
      stage.start();
      stage.start();
      await wait(300);
      counting = false;
      const frames = stage.log.starts.length;
      check(frames > 0, "the stage drew nothing");
      check(
        frames <= animationFrames + 1,
        `${String(frames)} frames in ${String(animationFrames)} animation frames`,
      );
      stage.dispose();
      await wait(100);
      check(stage.log.starts.length === frames, "the stage drew after dispose");
      throws(() => {
        stage.start();
      }, /disposed/);
      throws(() => {
        stage.renderer.render(frameOf(test));
      }, /disposed/);
    },
  ],
  [
    "from one set of meshes to another, the old ones fade out before the new ones fade in",
    (own) => {
      const test = makeScene();
      const { front, back } = test;
      const model: Model<null> = {
        show: () => undefined,
        frame: () => new Map([[test.group, IDENTITY]]),
        phase: () => "still",
      };
      const stage = own(new Stage(canvas(), test.scene, PALETTE, model));
      stage.show(stateOf(test, new Set([front])), null, true);
      const shown = performance.now();
      stage.show(stateOf(test, new Set([back])), null);
      const fade = FADE_SECONDS * 1000;
      for (const [after, fading, rest] of [
        [fade / 2, front, 0.5],
        [fade + fade / 2, back, 0.5],
      ] as const) {
        const values = stage.valuesAt(shown + after);
        check(
          values.keep.size === 0 &&
            values.fade.size === 1 &&
            values.fade.has(fading),
          `after ${String(after)} ms ${fading.name} is not the one that fades`,
        );
        check(
          Math.abs(values.rest - rest) < 0.05,
          `after ${String(after)} ms the rest is ${String(values.rest)}, not about ${String(rest)}`,
        );
      }
      const end = stage.valuesAt(shown + 3 * fade);
      check(
        end.keep.size === 1 && end.keep.has(back) && end.fade.size === 0,
        "the change does not end on the new meshes",
      );
    },
  ],
  [
    "a recolour draws only its meshes, in the inks that its map gives",
    (own) => {
      const test = makeScene();
      const target = canvas();
      const drawn = own(renderer(target, test.scene));
      const [red, green, blue] = hexRgb(PALETTE.secondWash).map((value) =>
        Math.round(value * 255),
      );
      const flashFill = (picture: Uint8Array): number => {
        let count = 0;
        for (let index = 0; index < picture.length; index += 4) {
          if (
            picture[index] === red &&
            picture[index + 1] === green &&
            picture[index + 2] === blue
          ) {
            count++;
          }
        }
        return count;
      };
      drawn.render(frameOf(test));
      const plain = pixels(target);
      check(flashFill(plain) === 0, "the plain picture has the flash's fill");
      for (const [what, recolour] of [
        ["no meshes", { meshes: new Set<Mesh>(), inks: FLASH_INKS }],
        ["an empty map", { meshes: new Set([test.front]), inks: new Map() }],
      ] as const) {
        drawn.render(frameOf(test, { recolour }));
        same(plain, pixels(target), `a recolour of ${what}`);
      }
      drawn.render(
        frameOf(test, {
          recolour: { meshes: new Set([test.front]), inks: FLASH_INKS },
        }),
      );
      const flashed = pixels(target);
      check(flashFill(flashed) > 100, "the front box has not the flash's fill");
      drawn.render(frameOf(test));
      same(plain, pixels(target), "the picture after the recolour");
      throws(() => {
        drawn.render(
          frameOf(test, {
            recolour: {
              meshes: new Set([makeScene().front]),
              inks: FLASH_INKS,
            },
          }),
        );
      }, /not in the scene/);
      noError(target);
    },
  ],
  [
    "a dim mixes a mesh's colours toward the paper, and it still hides what is under it",
    (own) => {
      const test = makeScene();
      const target = canvas();
      const drawn = own(renderer(target, test.scene));
      const rgb = (hex: string): number[] =>
        hexRgb(hex).map((value) => value * 255);
      const wash = rgb(PALETTE.subjectWash);
      const paper = rgb(PALETTE.paper);
      /** Pixels within 1 of `colour` in each channel. */
      const count = (picture: Uint8Array, colour: number[]): number => {
        let found = 0;
        for (let index = 0; index < picture.length; index += 4) {
          if (
            colour.every(
              (value, channel) =>
                Math.abs((picture[index + channel] ?? 0) - value) <= 1,
            )
          ) {
            found++;
          }
        }
        return found;
      };
      drawn.render(frameOf(test));
      const plain = pixels(target);
      drawn.render(frameOf(test, { dim: new Map([[test.front, 1]]) }));
      same(plain, pixels(target), "a dim of weight 1");
      drawn.render(frameOf(test, { dim: new Map([[test.front, 0.5]]) }));
      const half = wash.map(
        (value, channel) => 0.5 * value + 0.5 * (paper[channel] ?? 0),
      );
      check(count(pixels(target), half) > 100, "a dim of 0.5 has no half fill");
      // dimmed to the paper, the front box still hides the back one
      drawn.render(frameOf(test, { dim: new Map([[test.front, 0]]) }));
      const blank = count(pixels(target), wash);
      drawn.render(frameOf(test, { keep: new Set([test.back]), rest: 0 }));
      const backAlone = count(pixels(target), wash);
      check(
        blank > 100 && blank < backAlone,
        `the dimmed box does not hide the back one (${String(blank)} and ${String(backAlone)} px of its fill)`,
      );
      throws(() => {
        drawn.render(frameOf(test, { dim: new Map([[test.front, 1.5]]) }));
      }, /outside 0..1/);
      throws(() => {
        drawn.render(
          frameOf(test, { dim: new Map([[makeScene().front, 0.5]]) }),
        );
      }, /not in the scene/);
      noError(target);
    },
  ],
  [
    "a flash runs before the channels, on and off, and only in a transition",
    (own) => {
      const test = makeScene();
      const front = new Set([test.front]);
      const model: Model<null> = {
        show: () => undefined,
        frame: () => new Map([[test.group, IDENTITY]]),
        phase: () => "still",
      };
      const stage = own(new Stage(canvas(), test.scene, PALETTE, model));
      const flashing = stateOf(test, front, front);
      check(
        stage.show(flashing, null, true) === 0,
        "a state shown at once flashed",
      );
      stage.show(stateOf(test), null, true);
      const before = performance.now();
      const seconds = stage.show(flashing, null);
      const after = performance.now();
      check(seconds === FLASH_SECONDS, `the flash is ${String(seconds)} s`);
      const cycle = (FLASH_ON_SECONDS + FLASH_OFF_SECONDS) * 1000;
      const on = FLASH_ON_SECONDS * 1000;
      for (let index = 0; index < 5; index++) {
        const start = index * cycle;
        check(
          stage.flashingAt(after + start + on / 2) !== null,
          `the flash is off ${String(start + on / 2)} ms in`,
        );
        check(
          stage.flashingAt(before + start + on + 20) === null,
          `the flash is on ${String(start + on + 20)} ms in`,
        );
      }
      const end = before + FLASH_SECONDS * 1000;
      check(
        stage.phaseAt(after + 10) === "flash",
        "the flash did not start before the fade",
      );
      check(
        stage.valuesAt(end - 20).rest === 1,
        "the fade started before the flash ended",
      );
      check(
        stage.phaseAt(after + FLASH_SECONDS * 1000) === "fade",
        "the fade did not start when the flash ended",
      );
      check(
        stage.flashingAt(after + FLASH_SECONDS * 1000) === null,
        "the flash outlasts its time",
      );
      const faded = stage.valuesAt(
        after + FLASH_SECONDS * 1000 + FADE_SECONDS * 1000 + 50,
      );
      check(
        faded.fade.size === 0 && faded.keep.size === 1,
        "the fade did not finish",
      );
      // a click during the flash: the same flash goes on, it does not restart
      stage.show(stateOf(test), null, true);
      const first = performance.now();
      stage.show(flashing, null);
      const left = stage.show(flashing, null);
      check(
        left <= FLASH_SECONDS && left > FLASH_SECONDS - 0.2,
        `the flash restarted or jumped: ${String(left)} s left`,
      );
      check(
        stage.flashingAt(first + FLASH_SECONDS * 1000 + 20) === null,
        "the flash ran past its first end",
      );
      stage.show(flashing, null, true);
      check(
        stage.show(flashing, null) === 0,
        "a state that changes no channel flashed",
      );
    },
  ],
  [
    "stills: one picture for each key and palette, and dispose revokes their URLs",
    async (own) => {
      const test = makeScene();
      const stills = own(new Stills(test.scene));
      let draws = 0;
      const draw = (drawn: Renderer): void => {
        draws++;
        drawn.render(frameOf(test));
      };
      const url = await stills.of("a", PALETTE, draw);
      check(
        (await stills.of("a", PALETTE, draw)) === url,
        "the same key gave another picture",
      );
      const dark = await stills.of("a", DARK, draw);
      check(dark !== url, "another palette gave the same picture");
      check(draws === 2, `drawn ${String(draws)} times for two palettes`);
      check((await fetch(url)).ok, "the URL does not load");
      stills.dispose();
      stills.dispose();
      let loads = true;
      try {
        await fetch(url);
      } catch {
        loads = false;
      }
      check(!loads, "the URL still loads after dispose");
      throws(() => stills.of("b", PALETTE, draw), /disposed/);
    },
  ],
];

window.webglChecks = async () => {
  const results: CheckResult[] = [];
  for (const [name, run] of CHECKS) {
    const held: { dispose(): void }[] = [];
    const own: Own = (thing) => {
      held.push(thing);
      return thing;
    };
    try {
      // A check that waits for an event that never comes fails, not hangs.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const late = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`no result in ${String(CHECK_SECONDS)} s`));
        }, CHECK_SECONDS * 1000);
      });
      try {
        await Promise.race([run(own), late]);
      } finally {
        clearTimeout(timer);
        for (const thing of held) thing.dispose();
      }
      results.push({ name, failure: null });
    } catch (error) {
      results.push({
        name,
        failure: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
};

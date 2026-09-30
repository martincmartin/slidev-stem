// Checks of the renderer, the stage and the stills that need a browser:
// context loss, dispose, a dynamic mesh drawn last, the fade, and the
// contract of each input. They draw small scenes of their own, not the
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
import type { Frame, Group, Mesh, MeshGeometry, Scene } from "../scene.ts";
import { FADE_SECONDS, Stage } from "../stage.ts";
import type { Model } from "../stage.ts";
import { Stills } from "../stills.ts";

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
const STYLE = { colour: "#143C6B", opacity: 1, width: 3 };

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
      fill: { hex: "#E3E8EC", opacity: 1 },
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
    paper: "#FAF7F0",
    meshes: [back, front, spring],
    groups: [group],
    views: [{ name: "all", scale: 1, shift: [0, 0], pivot: [0, 0, 0] }],
    subjects: [
      { name: "front", meshes: new Set([front]) },
      { name: "back", meshes: new Set([back]) },
    ],
  };
  return { scene, group, front, back, spring };
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
  return new Renderer(target, scene, { preserveDrawingBuffer: true });
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
      throws(() => new Renderer(target, test.scene), /other settings/);
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
      const stage = own(new Stage(target, test.scene, model));
      const view = test.scene.views[0];
      check(view !== undefined, "no view");
      stage.show({ view, tilt: 0, subject: null }, null, true);
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
    "from one subject to another, the rest fades in around the old subject before the new one is kept",
    (own) => {
      const test = makeScene();
      const [front, back] = test.scene.subjects;
      const view = test.scene.views[0];
      check(
        front !== undefined && back !== undefined && view !== undefined,
        "the test scene is incomplete",
      );
      const model: Model<null> = {
        show: () => undefined,
        frame: () => new Map([[test.group, IDENTITY]]),
        phase: () => "still",
      };
      const stage = own(new Stage(canvas(), test.scene, model));
      stage.show({ view, tilt: 0, subject: front }, null, true);
      const shown = performance.now();
      stage.show({ view, tilt: 0, subject: back }, null);
      const fade = FADE_SECONDS * 1000;
      for (const [after, subject, rest] of [
        [fade / 2, front, 0.5],
        [fade + fade / 2, back, 0.5],
        [3 * fade, back, 0],
      ] as const) {
        const values = stage.valuesAt(shown + after);
        check(
          values.subject === subject,
          `after ${String(after)} ms the fade keeps ${values.subject?.name ?? "nothing"}, not ${subject.name}`,
        );
        check(
          Math.abs(values.rest - rest) < 0.05,
          `after ${String(after)} ms the rest is ${String(values.rest)}, not about ${String(rest)}`,
        );
      }
      stage.show({ view, tilt: 0, subject: back }, null, true);
      const leaving = performance.now();
      stage.show({ view, tilt: 0, subject: null }, null);
      const values = stage.valuesAt(leaving + fade / 2);
      check(
        values.subject === back,
        "the fade to no subject drops its subject before the rest is back",
      );
    },
  ],
  [
    "stills: one picture for each key, and dispose revokes their URLs",
    async (own) => {
      const test = makeScene();
      const stills = own(new Stills(test.scene));
      let draws = 0;
      const draw = (drawn: Renderer): void => {
        draws++;
        drawn.render(frameOf(test));
      };
      const url = await stills.of("a", draw);
      check(
        (await stills.of("a", draw)) === url,
        "the same key gave another picture",
      );
      check(draws === 1, `drawn ${String(draws)} times`);
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
      throws(() => stills.of("b", draw), /disposed/);
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

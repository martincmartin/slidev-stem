// The watch's stage, traced through every step of a deck: what each mesh shows
// (its opacity), the camera, the tilt and the flash, every 25 ms. Run with the
// code of one version of the talk, and compare two traces with compare.ts.
//
//   node trace.ts before|after <watches dir> <out.json>
//
// `before` drives the API of main at a310e92 (subjects, `watchOnly`); `after`
// drives the API of the refactor (pieces, `watch: [...]`). Both read the
// deck's own slides.md with Slidev's parser, and both step as
// global-bottom.vue does: a flash only on the step forward into its slide, a
// slide reached from a slide without the watch shown at once.

import { writeFileSync } from "node:fs";
import { load } from "@slidev/parser/fs";

interface MeshLike {
  name: string;
}
interface ViewLike {
  scale: number;
  shift: readonly [number, number];
  pivot: readonly [number, number, number];
}
type Frontmatter = Record<string, unknown>;
type Move = "forward" | "back";

/** One sample: each mesh's opacity, the camera, the tilt, the flashed meshes. */
interface Sample {
  opacity: number[];
  view: number[];
  tilt: number;
  flash: number[] | null;
}

/** A version's stage, behind one interface. */
interface Driver {
  meshes: readonly MeshLike[];
  /** Whether the slide shows the watch at this click. */
  shows(frontmatter: Frontmatter, clicks: number): boolean;
  /** Show at once. */
  jump(frontmatter: Frontmatter, clicks: number, now: number): void;
  /** A step, as global-bottom.vue makes it. `boundary` is the frontmatter of
   *  the later of the two slides, for a step between slides. */
  step(
    frontmatter: Frontmatter,
    clicks: number,
    move: Move,
    intoSlide: boolean,
    boundary: Frontmatter | null,
    now: number,
  ): void;
  sample(now: number): Sample;
  busy(now: number): boolean;
}

const [, , version, root, out] = process.argv;
if (!version || !root || !out) {
  throw new Error("usage: node trace.ts before|after <watches dir> <out.json>");
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function viewNumbers(view: ViewLike): number[] {
  // the pivot's x does not enter the projection (webgl/renderer.ts)
  return [view.scale, ...view.shift, view.pivot[1], view.pivot[2]].map(round);
}

async function beforeDriver(): Promise<Driver> {
  const { generate } = await import(`${root}/watch/generate.ts`);
  const { watchState, stageState } = await import(`${root}/watch/state.ts`);
  const { Timeline } = await import(`${root}/webgl/timeline.ts`);
  const { scene } = generate();
  const meshes: MeshLike[] = scene.meshes;
  const index = new Map(meshes.map((mesh, at) => [mesh, at]));
  const timeline = new Timeline();
  const stateOf = (frontmatter: Frontmatter, clicks: number, flash: boolean) => {
    const state = watchState(frontmatter, clicks);
    return stageState(scene, { ...state, flash: flash ? state.flash : undefined });
  };
  return {
    meshes,
    shows: (frontmatter, clicks) => watchState(frontmatter, clicks) !== undefined,
    jump(frontmatter, clicks, now) {
      timeline.show(stateOf(frontmatter, clicks, false), now, true);
    },
    step(frontmatter, clicks, move, intoSlide, _boundary, now) {
      timeline.show(
        stateOf(frontmatter, clicks, move === "forward" && intoSlide),
        now,
      );
    },
    sample(now) {
      const values = timeline.valuesAt(now);
      const kept: ReadonlySet<MeshLike> = values.subject?.meshes ?? new Set();
      const fading: ReadonlySet<MeshLike> | null = values.fading?.meshes ?? null;
      const opacity = meshes.map((mesh) =>
        kept.has(mesh)
          ? 1
          : fading === null || fading.has(mesh)
            ? round(values.rest)
            : 0,
      );
      const flashing = timeline.flashingAt(now);
      return {
        opacity,
        view: viewNumbers(values.view),
        tilt: round(values.tilt),
        flash: flashing
          ? [...flashing.meshes].map((mesh) => index.get(mesh) ?? -1).sort()
          : null,
      };
    },
    busy: (now) => timeline.phaseAt(now) !== null,
  };
}

async function afterDriver(): Promise<Driver> {
  const { WATCH } = await import(`${root}/watch/instance.ts`);
  const { watchState, stageState, moveWithBefore } = await import(
    `${root}/watch/state.ts`
  );
  const { Timeline } = await import(`${root}/webgl/timeline.ts`);
  const meshes: MeshLike[] = WATCH.scene.meshes;
  const index = new Map(meshes.map((mesh, at) => [mesh, at]));
  const timeline = new Timeline();
  const stateOf = (
    frontmatter: Frontmatter,
    clicks: number,
    flash: boolean,
    boundary: Frontmatter | null,
  ) => {
    const state = watchState(frontmatter, clicks);
    return stageState(
      WATCH,
      { ...state, flash: flash ? state.flash : undefined },
      boundary ? moveWithBefore(boundary) : undefined,
    );
  };
  return {
    meshes,
    shows: (frontmatter, clicks) => watchState(frontmatter, clicks) !== undefined,
    jump(frontmatter, clicks, now) {
      timeline.show(stateOf(frontmatter, clicks, false, null), now, true);
    },
    step(frontmatter, clicks, move, intoSlide, boundary, now) {
      timeline.show(
        stateOf(frontmatter, clicks, move === "forward" && intoSlide, boundary),
        now,
      );
    },
    sample(now) {
      const values = timeline.valuesAt(now);
      const opacity = meshes.map((mesh) =>
        values.keep.has(mesh) ? 1 : values.fade.has(mesh) ? round(values.rest) : 0,
      );
      const flashing: ReadonlySet<MeshLike> | null = timeline.flashingAt(now);
      return {
        opacity,
        view: viewNumbers(values.view),
        tilt: round(values.tilt),
        flash: flashing
          ? [...flashing].map((mesh) => index.get(mesh) ?? -1).sort()
          : null,
      };
    },
    busy: (now) => timeline.phaseAt(now) !== null,
  };
}

const driver = version === "before" ? await beforeDriver() : await afterDriver();
const deck = await load(root, `${root}/slides.md`);

interface Place {
  key: string;
  slide: number;
  frontmatter: Frontmatter;
  clicks: number;
}
const places: Place[] = [];
const seen = new Map<string, number>();
for (const slide of deck.slides) {
  const frontmatter = slide.frontmatter as Frontmatter;
  if (frontmatter["hide"] === true) continue;
  const title = slide.title ?? `slide ${String(slide.index)}`;
  const count = (seen.get(title) ?? 0) + 1;
  seen.set(title, count);
  const clicks = Number(frontmatter["clicks"] ?? 0);
  for (let click = 0; click <= clicks; click++) {
    places.push({
      key: `${title} (${String(count)}) @${String(click)}`,
      slide: slide.index,
      frontmatter,
      clicks: click,
    });
  }
}

const STEP_MS = 25;
const LIMIT_MS = 20_000;
/** Times at which a step is cut short by a step back. */
const CUTS_MS = [300, 1200, 2600, 4000];

function run(from: Place, to: Place, cutAt: number | null): Sample[] {
  const samples: Sample[] = [];
  driver.jump(from.frontmatter, from.clicks, 0);
  const stepTo = (source: Place, target: Place, move: Move, now: number) => {
    const intoSlide = source.slide !== target.slide;
    const later = source.slide > target.slide ? source : target;
    driver.step(
      target.frontmatter,
      target.clicks,
      move,
      intoSlide,
      intoSlide ? later.frontmatter : null,
      now,
    );
  };
  const forward = places.indexOf(to) > places.indexOf(from);
  stepTo(from, to, forward ? "forward" : "back", 0);
  let cut = cutAt;
  for (let now = 0; now <= LIMIT_MS; now += STEP_MS) {
    if (cut !== null && now >= cut) {
      stepTo(to, from, forward ? "back" : "forward", now);
      cut = null;
    }
    samples.push(driver.sample(now));
    if (cut === null && !driver.busy(now) && driver.sample(now).flash === null) {
      break;
    }
  }
  return samples;
}

const steps: Record<string, Sample[]> = {};
for (let at = 0; at + 1 < places.length; at++) {
  const here = places[at];
  const next = places[at + 1];
  if (!here || !next) continue;
  if (
    !driver.shows(here.frontmatter, here.clicks) ||
    !driver.shows(next.frontmatter, next.clicks)
  ) {
    continue;
  }
  steps[`${here.key} -> ${next.key}`] = run(here, next, null);
  steps[`${next.key} -> ${here.key}`] = run(next, here, null);
  for (const cut of CUTS_MS) {
    steps[`${here.key} -> ${next.key}, back at ${String(cut)} ms`] = run(
      here,
      next,
      cut,
    );
  }
}
writeFileSync(
  out,
  JSON.stringify({ meshes: driver.meshes.map((mesh) => mesh.name), steps }),
);
console.log(`${String(Object.keys(steps).length)} steps written to ${out}`);

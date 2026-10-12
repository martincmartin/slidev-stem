// Draws the deck's watch states in a variant of the occlusion: today's clip
// discs, or paper discs (raised, or holdouts), at a hidden-line tolerance.
// render.py drives it: `window.paperProbe.render(variant, frame)`.

import { generate } from "../../../../watch/generate.ts";
import { addPaperDiscs as addDiscs } from "../../../../watch/paper-discs.ts";
import type { Watch } from "../../../../watch/generate.ts";
import { linePose, stagePose } from "../../../../watch/mainspring.ts";
import { Motion, stillPose } from "../../../../watch/model.ts";
import { stageState } from "../../../../watch/state.ts";
import type { WatchState } from "../../../../watch/state.ts";
import { STILL_TIME } from "../../../../watch/stills.ts";
import { Renderer } from "../../../../webgl/renderer.ts";
import type { Palette } from "../../../../webgl/scene.ts";

/** How the parts under a wheel are hidden. */
interface Variant {
  /** clip: today's discs. paper: a paper disc at the covering part's
   *  bottom, a plain face. raised: a paper disc `raise` above it. holdout: a
   *  paper disc at its bottom, a holdout. */
  mode: "clip" | "paper" | "raised" | "holdout";
  /** Slide px. */
  tolerance: number;
  /** Slide px: the raised disc's height above the part's bottom. */
  raise: number;
  /** Slide px: `GenerateOptions.stackGap`. */
  gap: number;
  /** `RendererOptions.exactLineDepth`. */
  exact?: boolean;
}

interface Frame {
  state: WatchState;
  /** Degrees: instead of the state's tilt. */
  tilt?: number;
  /** Device px. */
  size: [number, number];
}

declare global {
  interface Window {
    paperProbe?: {
      render: (variant: Variant, frame: Frame) => string;
      discs: () => object[];
    };
    paperProbeReady?: boolean;
  }
}

// Ledger's values, as webgl/probe/probe.ts has them.
const PALETTE: Palette = {
  paper: "#FAF7F0",
  subject: "#143C6B",
  subjectWash: "#D3DCE3",
  muted: "#736A60",
  mutedWash: "#E2DED6",
  ink: "#2A2520",
  second: "#B5601E",
  secondWash: "#ECD8C4",
};
/** Add the paper discs of `variant`, as the probe's report. */
function addPaperDiscs(watch: Watch, variant: Variant): object[] {
  return addDiscs(watch, {
    raise: variant.mode === "raised" ? variant.raise : 0,
    // with the exact test, a paper disc is a holdout: the line test takes
    // its depth exactly
    holdout:
      variant.mode === "holdout" ||
      (variant.mode === "paper" && (variant.exact ?? false)),
    overlay: variant.mode === "holdout",
  }).map((disc) => ({
    group: disc.cover.name,
    radius: disc.radius,
    z: disc.height,
    under: disc.under.name,
  }));
}

/** Today's watch: its views frame every variant. */
const todays = generate();

let current: { key: string; watch: Watch; renderer: Renderer; canvas: HTMLCanvasElement; motion: Motion; discs: object[] } | null = null;

function setUp(variant: Variant): NonNullable<typeof current> {
  const key = JSON.stringify(variant);
  if (current?.key === key) return current;
  if (current) {
    current.renderer.dispose();
    current.canvas.remove();
  }
  const watch = generate(undefined, { stackGap: variant.gap });
  const discs = variant.mode === "clip" ? [] : addPaperDiscs(watch, variant);
  const canvas = document.createElement("canvas");
  document.body.append(canvas);
  const renderer = new Renderer(canvas, watch.scene, PALETTE, {
    preserveDrawingBuffer: true,
    hiddenLineTolerance: variant.tolerance,
    clipDiscs: variant.mode === "clip",
    exactLineDepth: variant.exact ?? false,
  });
  current = { key, watch, renderer, canvas, motion: new Motion(watch), discs };
  return current;
}

window.paperProbe = {
  discs: () => current?.discs ?? [],
  render(variant, frame) {
    const { watch, renderer, canvas, motion } = setUp(variant);
    const state = frame.tilt === undefined ? frame.state : { ...frame.state, tilt: frame.tilt };
    const { time, swing } = stillPose(watch.design.timing, state.settled, STILL_TIME);
    const stage = stageState(watch, state);
    // today's view, so that a variant with other heights is framed the same
    const view = stageState(todays, state).view;
    const spring = state.mainspring === null ? linePose(0) : stagePose(state.mainspring);
    renderer.updateMesh(watch.spring, motion.springGeometry(swing));
    renderer.updateMesh(watch.mainspring, motion.mainspringGeometry(spring));
    renderer.render({
      view,
      tilt: stage.tilt,
      groupMatrices: motion.matrices(time, swing, motion.beats(time), spring.arbor),
      keep: stage.shown,
      rest: 0,
      ...(stage.dim ? { dim: stage.dim } : {}),
      size: frame.size,
    });
    return canvas.toDataURL();
  },
};
window.paperProbeReady = true;

<script setup lang="ts">
// The watch, the diving board, "tick" and "tock" and the time scale in one
// figure of the article (addons/narration): what the live layer draws
// (global-bottom.vue), at the figure's click, with the renderer that all the
// page's figures share (webgl/shared.ts), not a WebGL context of its own.
// global-bottom.vue draws this in place of the live layer when it finds the
// figure (`FIGURE`). docs/article.md has the rules and the reasons.
//
// A change of the figure's click is a step, forward or back by the clicks'
// order (`moveTo`), with the moves of a step in the talk
// (watch/navigation.ts), from whatever shows. Not as in the talk, a step
// past a neighbour moves too: the reader asked for that click. A step
// forward flashes, as in the talk: the reader is looking at the figure. All
// of it runs on the figure's time (`figure.now`), which stands while the
// figure is paused. So a step in a paused figure starts from the picture
// that shows; the figure's time runs to the end of the step's change
// (`busyUntil`: the watch's, the voyage's and the board's), and stands
// again. While `figure.jumps`, a step is a jump. A slider's change is drawn
// at once. At every click, the figure marks the pieces that its run flashed
// (`figureMarks`, watch/article.ts): a steady flash, for a reader whose eyes
// are on the words.
//
// THE TURN. Where the figure shows the watch (not the globe, a story map, or
// the diving board's picture over it), the reader can turn it (`FigureTurner`,
// addons/narration/figure.ts): an orbit after the step's camera
// (webgl/orbit.ts), clamped short of edge-on from the camera's angles at the
// time. `reset` eases it back on the page's clock. A step, or the `release`
// button, keeps the turn: it changes what the watch does, not where the reader
// looks from, and the orbit follows the step's camera. A click where the watch
// cannot turn ends it. While the watch is turned, what the board still draws
// over it (the rest shape and its sentence, after the curl) fades out, as the
// labels do: it is drawn flat, for the step's view.
//
// THE CROP. The canvas covers only the part of the slide that the figure
// shows (`figure.crop`), and the view draws only that part
// (webgl/shared.ts, "A VIEW DRAWS ITS CROP").
//
// THE SLIDERS (a slide's `article` settings). `curl` holds the diving board
// at a point of its curl. `twist` winds the hairspring from rest, by up to
// the balance's amplitude, and holds it; when the reader lets go, it swings
// from there, and the thumb follows it back to rest, in a quarter of the
// balance's period, ready to catch it again. In a paused figure, the
// hairspring goes back to rest, and stands there.
// `wind` holds the Mainspring slide's story at a point from the bare spring
// through the key's turns; the spring winds at an even rate with the slider,
// with no rests (`windSliderTime`).
//
// THE BUTTON. A figure's `button` shows the click before the figure's until
// the reader presses it; then it plays the step to the figure's click, as
// the talk does (on the Mainspring slide: `release`, the stud flashes and
// goes, and the spring uncoils; `run down`, the time-lapse). A second press
// shows the click before again, at once.
//
// THE SPEED-UP. A figure with `speedUp` has a button that runs the whole
// mechanism at that speed-up, in step, as the Recap slide's stops do
// (`watchLapse`, watch/lapse.ts), for a part too slow to see move: the
// centre wheel, the hour hand. It eases up and back down; it starts at real
// speed, and goes back to it at a click with no speed-up.
import { frontmatterOf } from "../addons/narration/plan.ts";
import { injectionSlidevContext } from "@slidev/client/constants.ts";
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch as onChange,
} from "vue";
import { FIGURE } from "../addons/narration/figure.ts";
import type {
  Box,
  FigureContext,
  FigureControl,
  FigureSlider,
  FigureTurner,
} from "../addons/narration/figure.ts";
import DivingBoard from "./DivingBoard.vue";
import StoryMaps from "./StoryMaps.vue";
import { movesByItself, settled, voyageEndAt } from "../globe/voyage.ts";
import type { VoyageStep } from "../globe/voyage.ts";
import TickTock from "./TickTock.vue";
import TimeScale from "./TimeScale.vue";
import { isNoOrbit, movedOrbit, NO_ORBIT } from "../webgl/orbit.ts";
import type { Orbit } from "../webgl/orbit.ts";
import { SharedView } from "../webgl/shared.ts";
import { ease, HIDE_STYLE } from "../webgl/timeline.ts";
import type { FrameListener } from "../webgl/stage.ts";
import type { SlideRect } from "../webgl/scene.ts";
import {
  BUTTON_WORDS,
  figureMarks,
  speedUpWords,
  figureSettings,
  figureState,
  SLIDER_WORDS,
} from "../watch/article.ts";
import type { SliderKind } from "../watch/article.ts";
import { boardState } from "../watch/board.ts";
import type { BoardTarget } from "../watch/board.ts";
import { tickTockAt } from "../watch/callouts.ts";
import {
  figureModel,
  loadedArt,
  loadedGlobe,
  sharedStage,
} from "../watch/instance.ts";
import { storyRuns, windSliderTime } from "../watch/mainspring.ts";
import { twistAngle, WatchModel } from "../watch/model.ts";
import type { WatchModelState } from "../watch/model.ts";
import type { Move } from "../watch/navigation.ts";
import { slidePalette } from "../watch/palette.ts";
import {
  modelState,
  stageState,
  stepMove,
  meshesOf,
  piecesNamed,
  timeScaleAt,
  voyageStepTo,
} from "../watch/state.ts";
import type { WatchState } from "../watch/state.ts";

/** The page's art (watch/instance.ts), and its globe's pieces and story
 *  maps: none on a page that does not show the globe. */
const art = loadedArt();
const globePieces = loadedGlobe()?.pieces ?? [];
const stories = loadedGlobe()?.stories ?? [];

const slidev = inject(injectionSlidevContext);
const injected = inject(FIGURE);
if (!slidev || !injected) throw new Error("FigureLayer is for a figure");
const figure: FigureContext = injected;
const frontmatter = computed(() => frontmatterOf(slidev.nav.currentSlideRoute));
const settings = computed(() =>
  figureSettings(frontmatter.value, figure.clicks.value),
);
const palette = computed(() => slidePalette(frontmatter.value["class"]));

/** The sliders' values, 0 to 1. The board starts ready to curl; the
 *  hairspring at rest; the mainspring bare. */
const curl = ref(0);
const twist = ref(0);
const wind = ref(0);
/** Each slider's value, and what happens when the reader lets go. */
const sliderControls: Record<
  SliderKind,
  Pick<FigureSlider, "value"> & Partial<Pick<FigureSlider, "release">>
> = {
  curl: { value: curl },
  twist: { value: twist, release: letGo },
  wind: { value: wind },
};
/** Whether the reader has pressed the figure's `button`. */
const played = ref(false);
/** Whether the reader has pressed the speed-up button. */
const spedUp = ref(false);

/** Degrees: the balance's angle at the `twist` slider's value. Negative: the
 *  coils draw in (`springPoints`). */
function twistDegrees(value: number): number {
  return -value * art.design.timing.amplitude;
}

/** The thumb's way back to rest after a let-go: the value that it last
 *  set, and its frame. `null` while the reader holds it or it is at rest. */
let thumbReturn: { value: number; frame: number } | null = null;

function stopThumbReturn(): void {
  if (thumbReturn) cancelAnimationFrame(thumbReturn.frame);
  thumbReturn = null;
}

/** The reader lets go of the `twist` slider: the hairspring swings from
 *  where it was held, and the thumb follows it to rest, as the balance's
 *  angle does (`twistAngle`), in a quarter period. */
function letGo(): void {
  stopThumbReturn();
  const from = twist.value;
  const start = figure.now();
  model.value?.twist(twistDegrees(from), start, true);
  const { period } = art.design.timing;
  setEnd("watch", start + (period / 4) * 1000);
  const follow = (): void => {
    const now = figure.now();
    const seconds = (now - start) / 1000;
    const value =
      seconds < period / 4
        ? twistAngle({ angle: from, letGo: start }, now, period)
        : 0;
    thumbReturn = {
      value,
      frame: value === 0 ? 0 : requestAnimationFrame(follow),
    };
    twist.value = value;
    if (value === 0) thumbReturn = null;
  };
  follow();
}

/** Story time (s) on the Mainspring slide's line, for `wind`: from the bare
 *  spring to the end of the key's turns, with no rests. */
const windTime = computed(() => windSliderTime(wind.value));
/** The click whose state shows: the figure's, or, with a `button`, the
 *  click before it until the reader presses the button. */
const clicks = computed(() =>
  settings.value.button !== null && !played.value
    ? figure.clicks.value - 1
    : figure.clicks.value,
);
const state = computed(() => {
  const own = figureState(frontmatter.value, clicks.value);
  const { speedUp } = settings.value;
  return own && spedUp.value && speedUp !== null
    ? { ...own, lapse: speedUp }
    : own;
});

/** The figure's crop as a rectangle (slide px), and the canvas's place. */
function cropRect(box: Box): SlideRect {
  return {
    left: box.left,
    top: box.top,
    width: box.right - box.left,
    height: box.bottom - box.top,
  };
}
const crop = computed(() => cropRect(figure.crop.value));
const canvasStyle = computed(() => ({
  inset: "auto",
  left: `${String(crop.value.left)}px`,
  top: `${String(crop.value.top)}px`,
  width: `${String(crop.value.width)}px`,
  height: `${String(crop.value.height)}px`,
}));

const covered = ref(false);
const hidden = computed(() => !state.value || covered.value);
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
/** The view's frames, once it is made: the story maps ride them. */
const frames = shallowRef<(listener: FrameListener) => () => void>();
/** The story map's marks: the step to the click's, on the figure's clock. */
const voyage = shallowRef<VoyageStep>(settled(null));
const model = shallowRef<WatchModel>();
let view: SharedView<WatchModelState> | undefined;
let shown: { clicks: number; state: WatchState | undefined } | undefined;
/** When the watch's change ends, and the board's (ms, the figure's time):
 *  the figure is busy until both have. */
const ends = { watch: 0, board: 0 };

function setEnd(part: keyof typeof ends, at: number): void {
  ends[part] = at;
  figure.busyUntil.value = Math.max(ends.watch, ends.board);
}

/** Whether the slide shows the board at all (its `board` key): a figure of
 *  a slide without one mounts no board, and fetches no SVG. */
const hasBoard = computed(() => boardState(frontmatter.value, 0) !== undefined);
/** The layers over the canvas draw nothing while the figure is paused or far
 *  from the screen (the contract: addons/narration/figure.ts). */
const layersStill = computed(() => !figure.moving.value || !figure.near.value);
/** Set when the click changes, which says if the board jumps. */
const board = shallowRef<BoardTarget>({
  state: boardState(frontmatter.value, clicks.value),
  atOnce: false,
});
const boardScrub = computed(() =>
  settings.value.slider === "curl" ? curl.value : null,
);
/** The reader's turn of the watch (THE TURN). */
const orbit = shallowRef<Orbit>(NO_ORBIT);
const tickTock = computed(() =>
  tickTockAt(art, frontmatter.value, clicks.value, !hidden.value, orbit.value),
);
const timeScale = computed(() =>
  timeScaleAt(frontmatter.value, clicks.value, state.value, !hidden.value),
);

/** Whether nothing moves by itself at the figure's click, so that the
 *  figure needs no pause button: the watch does not show (the globe's
 *  slides), or its balance is at rest, the train neither spins nor unwinds,
 *  and the mainspring story is before the watch runs (a step's change, such
 *  as the release, plays once and ends); no wind blows on a story map; the
 *  board does not swing; and there is no `twist` slider (a let-go swings
 *  for ever). */
const still = computed(() => {
  const now = hidden.value ? undefined : state.value;
  const watchStill =
    !now ||
    !showsWatch(now) ||
    (now.settled &&
      now.spin === null &&
      (now.mainspring === null || !storyRuns(now.mainspring)) &&
      !now.unwind);
  const boardStill =
    board.value.state?.place !== "swing" || boardScrub.value !== null;
  return (
    watchStill &&
    !movesByItself(voyage.value.to) &&
    boardStill &&
    settings.value.slider !== "twist"
  );
});

/** Whether the watch shows: not only the globe, and not under the diving
 *  board's picture (`hidden`). */
const turnable = computed(
  () => !hidden.value && !!state.value && showsWatch(state.value),
);
const turned = computed(() => !isNoOrbit(orbit.value));
/** ms: how long the turn takes to ease back to the step's view. */
const RESET_MS = 600;
/** The frame of the ease back, while it runs. */
let resetFrame = 0;

/** Set the turn, and end an ease back. */
function setOrbit(to: Orbit): void {
  cancelAnimationFrame(resetFrame);
  orbit.value = to;
}

const turner: FigureTurner = {
  turn(yaw, pitch) {
    if (!view) return;
    const angles = view.timeline.valuesAt(figure.now());
    setOrbit(movedOrbit(angles, orbit.value, yaw, pitch));
  },
  // While the camera moves to a step (the reset comes with a step), the
  // turn eases back with it, on its clock and its curve: one motion from
  // the turned picture to the step's view. With no move, it eases back in
  // RESET_MS on the page's clock, which also runs in a paused figure.
  reset(atOnce) {
    const from = orbit.value;
    setOrbit(atOnce ? NO_ORBIT : from);
    if (atOnce || isNoOrbit(from) || !view) return;
    const moveEnd = view.viewEndAt();
    const withMove = moveEnd > figure.now();
    const clock = withMove ? figure.now : () => performance.now();
    const start = clock();
    const length = withMove ? moveEnd - start : RESET_MS;
    const frame = (): void => {
      const part = Math.min(1, (clock() - start) / length);
      const left = 1 - ease(part);
      orbit.value =
        part === 1
          ? NO_ORBIT
          : { yaw: from.yaw * left, pitch: from.pitch * left };
      if (part < 1) resetFrame = requestAnimationFrame(frame);
    };
    frame();
  },
  turned,
};

/** Whether `now` shows a piece of the watch, not only the globe. */
function showsWatch(now: WatchState): boolean {
  return [...stageState(art, now).shown].some(
    (mesh) => !globePieces.some((piece) => piece.meshes.has(mesh)),
  );
}

/** The move to `to` from the click that shows: forward or back by the
 *  clicks' order, past the neighbours too (the reader asked for it); a jump
 *  at once, or from nothing. */
function moveTo(to: number, atOnce: boolean): Move {
  if (atOnce || !shown || to === shown.clicks) return "jump";
  return to > shown.clicks ? "forward" : "back";
}

/** Show the state at `to` (a click): a move or a jump from what shows. */
function show(to: number, atOnce: boolean): void {
  const now = state.value;
  if (!view || !now) {
    shown = { clicks: to, state: now };
    return;
  }
  const move = moveTo(to, atOnce);
  const flash = move === "forward" ? now.flash : undefined;
  view.show(
    stageState(art, {
      ...now,
      flash,
      move: stepMove(shown?.state, now, move),
    }),
    modelState(now),
    move === "jump",
  );
  view.marked = meshesOf(
    piecesNamed(art, "marks", figureMarks(art, frontmatter.value, to)),
  );
  shown = { clicks: to, state: now };
  voyage.value = voyageStepTo(
    voyage.value,
    art,
    stories,
    now,
    frontmatter.value,
    to,
    {
      at: figure.now(),
      cameraEnd: view.viewEndAt(),
      jump: move === "jump",
      forward: move === "forward",
    },
  );
  setEnd("watch", Math.max(view.endAt(), voyageEndAt(voyage.value)));
}

onMounted(() => {
  if (!canvas.value || !state.value) return;
  model.value = new WatchModel(art, figure.now());
  view = new SharedView(
    canvas.value,
    figureModel(model.value),
    palette.value.palette,
    figure.now,
    art.scene.slide,
  );
  view.crop = crop.value;
  const made = view;
  frames.value = (listener) => made.onFrame(listener);
  show(clicks.value, true);
  if (settings.value.slider === "twist") {
    model.value.twist(twistDegrees(twist.value), figure.now(), false);
  }
  if (settings.value.slider === "wind") {
    model.value.scrub(windTime.value, figure.now());
  }
  view.paused = !figure.moving.value;
  sharedStage().add(view);
});
onBeforeUnmount(() => {
  stopThumbReturn();
  cancelAnimationFrame(resetFrame);
  if (view) sharedStage().remove(view);
});

// the press that undoes a `button` is no step: the state changes at once
onChange(clicks, (to) => {
  const atOnce =
    (settings.value.button !== null && !played.value) || figure.jumps.value;
  board.value = { state: boardState(frontmatter.value, to), atOnce };
  show(to, atOnce);
});
// at once, so that the thumb's own way back (`letGo`) is told from the
// reader's move: the reader's move catches the hairspring and holds it
onChange(
  twist,
  (value) => {
    if (settings.value.slider !== "twist" || thumbReturn?.value === value)
      return;
    stopThumbReturn();
    model.value?.twist(twistDegrees(value), figure.now(), false);
    view?.redraw();
  },
  { flush: "sync" },
);
// not a step: only the mechanism's speed changes, and it eases
onChange(spedUp, () => {
  if (!state.value) return;
  model.value?.show(modelState(state.value), figure.now(), false);
  view?.redraw();
});
onChange(
  () => settings.value.speedUp,
  () => {
    spedUp.value = false;
  },
);
onChange(windTime, (time) => {
  if (settings.value.slider === "wind") {
    model.value?.scrub(time, figure.now());
    view?.redraw();
  }
});
onChange(figure.moving, (moving) => {
  if (!view) return;
  view.paused = !moving;
  // A paused step must draw its exact endpoint. The last animation frame
  // can precede the clock's stop, leaving a count one day short.
  // Manual pauses keep their last picture (webgl/shared.ts): the prerender
  // pauses every figure before each still, so avoid drawing them all again.
  if (!moving && figure.now() === figure.busyUntil.value) view.redraw();
});
onChange(
  still,
  (now) => {
    figure.still.value = now;
  },
  { immediate: true },
);
onChange(
  turnable,
  (now) => {
    figure.turner.value = now ? turner : null;
    if (!now) setOrbit(NO_ORBIT);
  },
  { immediate: true },
);
onChange(orbit, (now) => {
  if (!view) return;
  view.orbit = isNoOrbit(now) ? null : now;
  view.redraw();
});
onChange(palette, (now) => {
  if (view) view.palette = now.palette;
});
onChange(crop, (now) => {
  if (!view) return;
  view.crop = now;
  view.redraw();
});
onChange(
  settings,
  ({ slider, button, speedUp }) => {
    const controls: FigureControl[] = [];
    if (slider !== null) {
      controls.push({
        kind: "slider",
        ...SLIDER_WORDS[slider],
        ...sliderControls[slider],
      });
    }
    if (button !== null) {
      controls.push({
        kind: "button",
        ...BUTTON_WORDS[button],
        pressed: played,
      });
    }
    if (speedUp !== null) {
      controls.push({
        kind: "button",
        ...speedUpWords(speedUp),
        pressed: spedUp,
      });
    }
    figure.controls.value = controls;
  },
  { immediate: true },
);
</script>

<template>
  <div
    class="slidev-layout watch-layer"
    :class="{ 'watch-off': hidden }"
    :style="[palette.variables, HIDE_STYLE]"
  >
    <canvas ref="canvas" class="watch-canvas" :style="canvasStyle" />
    <StoryMaps :frames="frames" :voyage="voyage" :paused="layersStill" />
    <DivingBoard
      v-if="hasBoard"
      :target="board"
      :live="true"
      :scrub="boardScrub"
      :paused="layersStill"
      :now="figure.now"
      :class="{ 'diving-board-turned': turned }"
      @cover="(covers: boolean) => (covered = covers)"
      @ends="(at: number) => setEnd('board', at)"
    />
    <TickTock
      :model="model"
      :shown="tickTock"
      :now="figure.now"
      :paused="layersStill"
    />
    <TimeScale
      :model="model"
      :shown="timeScale"
      :now="figure.now"
      :paused="layersStill"
    />
  </div>
</template>

<script setup lang="ts">
// One live watch under every slide, for the whole talk, drawn with WebGL by the
// stage of webgl/stage.ts. Each slide names the pieces that it shows in its
// frontmatter (`watch: [hairspring, collet, stud]`, `watchTilt: 20`, and see
// watch/state.ts); a slide without `watch` hides the layer. A click can change the state (`watchClicks`).
// Above the watch, the one live diving board (components/DivingBoard.vue),
// which the Hairspring slide's frontmatter shows (`board`, and see watch/board.ts). While
// the board's picture shows, it covers the watch: the canvas fades out, and the
// stage stops. The board's clock decides when (its `cover` event), so the
// hairspring takes the board's place when the curl ends, with no click.
// Above both, the words "tick" and "tock" at each strike of a tooth on a pallet
// stone (components/TickTock.vue), where a slide's `watchTickTock` shows them: they follow
// the model's clock. And the time scale (components/TimeScale.vue), where a
// slide's `watchTimeScale` shows it: it reads the model's speed-up.
//
// A slide names targets, not moves (../docs/navigation.md). At each change of
// slide or click, this decides the kind of move (watch/navigation.ts): a step
// animates from what is on the screen, in either direction, and a jump shows
// the target at once. A flash plays only on the step forward into the slide
// or the click that names it. A step during a move (the stage's change, or
// the board's story, still runs), or soon after a step that was one, is a
// jump: the screen shows at once the place that a viewer who looks for it
// has reached (../docs/navigation.md, "A press during a move").
// On a step between two slides, the later one says what shows while the
// camera moves (`watchMoveWith`, `watchMoveAlso`), in either direction. On
// any step, the later click says how the camera moves (`watchMove`,
// `stepMove`).
// The new slide's text waits for the camera, in either direction
// (`--watch-text-delay`, from the stage). A click's text can wait for the
// balance to come to rest (`--watch-rest-delay`, from the model), or for the
// watch's change to end, with its flash and the model's story
// (`--watch-end-delay`, from the stage).
//
// In a figure of the article (addons/narration, which provides `FIGURE`), the
// layer is the figure's (components/FigureLayer.vue): the slide at the
// figure's click, drawn by the renderer that the page's figures share. The
// live layer is not made.
//
// Print mode (export) has no live layer: slide-bottom.vue draws a still and a
// posed board on each page. `data-watch` on the canvas is the state it shows,
// for art/print-check.ts. Print mode comes from the page's nav: each printed
// page gets a fixed nav of its own, which does not know it. The class
// slidev-layout gives the layer the theme's page colour. The layer is outside
// the slide, so a slide class that changes the palette (a palette class,
// ../docs/theme.md) does not reach it: the layer sets the slide's palette
// variables on itself, and gives the stage the slide's colours.
import { useNav } from "@slidev/client";
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
import { FIGURE } from "./addons/narration/figure.ts";
import DivingBoard from "./components/DivingBoard.vue";
import FigureLayer from "./components/FigureLayer.vue";
import TickTock from "./components/TickTock.vue";
import TimeScale from "./components/TimeScale.vue";
import { Stage } from "./webgl/stage.ts";
import { FADE_SECONDS } from "./webgl/timeline.ts";
import { boardState } from "./watch/board.ts";
import { stoneStrikes } from "./watch/callouts.ts";
import type { BoardTarget } from "./watch/board.ts";
import { WatchModel } from "./watch/model.ts";
import type { WatchModelState } from "./watch/model.ts";
import { WATCH, watchStills } from "./watch/instance.ts";
import { moveOf } from "./watch/navigation.ts";
import type { Move, Place } from "./watch/navigation.ts";
import { slidePalette } from "./watch/palette.ts";
import { slideState } from "./watch/slide-state.ts";
import {
  modelState,
  MOVE_WITH_COMMON,
  moveWithBefore,
  stageState,
  stepMove,
  tickTockState,
  timeScaleState,
  watchState,
} from "./watch/state.ts";
import type { StepMoveWith, WatchState } from "./watch/state.ts";
import type { CameraMove } from "./webgl/timeline.ts";

/** ms: a step this soon after a press that jumped jumps too. A jump leaves
 *  nothing that runs, so without this, every other press of a burst would
 *  animate, and show its place only at the end of its change. */
const BURST_MS = 1000;

const slidev = inject(injectionSlidevContext);
if (!slidev) throw new Error("no Slidev context");
const nav = useNav();
const figure = inject(FIGURE, null);
const live = !nav.isPrintMode.value && !figure;
const frontmatter = computed(
  () => slidev.nav.currentSlideRoute.meta.slide?.frontmatter ?? {},
);
const state = computed(() => watchState(frontmatter.value, slidev.nav.clicks));
/** The current slide's palette: the theme's, as the slide's classes change it. */
const palette = computed(() => slidePalette(frontmatter.value["class"]));
/** The diving board's picture covers the watch. */
const covered = ref(false);
/** The diving board's story (a bend, a curl or an uncurl) runs. */
const boardBusy = ref(false);
const hidden = computed(() => !state.value || covered.value);
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const board = shallowRef<BoardTarget>({ state: undefined, atOnce: true });
let stage: Stage<WatchModelState> | undefined;
/** The stage's model: it says when the balance comes to rest, and when a
 *  tooth strikes a pallet stone. */
const model = shallowRef<WatchModel>();
/** Where the teeth strike the pallet stones, while the slide shows the words
 *  at the strikes. */
const tickTock = computed(() =>
  tickTockState(frontmatter.value, slidev.nav.clicks) && !hidden.value
    ? { strikes: stoneStrikes(WATCH, frontmatter.value) }
    : undefined,
);
/** The time-lapse's speed-up at the click, while the slide shows the time
 *  scale. */
const timeScale = computed(() =>
  state.value &&
  timeScaleState(frontmatter.value, slidev.nav.clicks) &&
  !hidden.value
    ? state.value.lapse
    : undefined,
);
/** Set while the canvas fades out: then the stage goes out of sight. */
let hideTimer: ReturnType<typeof setTimeout> | undefined;
/** The last state given to the stage. */
let stageTarget: WatchState | undefined;
let unmounted = false;
/** The place and the watch state that the layer shows. */
let place: Place | undefined;
/** Until when (ms) a step is a press in a burst. */
let burstUntil = 0;
let shownWatch = "null";
/** The same state without its flash: what shows. */
let shownPicture = "null";

function showWatch(
  now: WatchState | undefined,
  move: Move,
  moveWith: StepMoveWith,
  /** How the camera moves on this step (`stepMove`). */
  cameraMove: CameraMove | undefined,
): void {
  // a flash points to where the camera goes, or to what fades in: only on
  // the step forward into the slide or the click that names it. It is not
  // part of what shows, so a click that changes nothing else does not cut
  // it. Nor is the order of the fades (`later`, `goLater`), or which pieces
  // go at once (`cut`)
  const flash = move === "forward" ? now?.flash : undefined;
  const picture = JSON.stringify(
    now
      ? {
          ...now,
          flash: undefined,
          later: undefined,
          cut: undefined,
          goLater: undefined,
          linger: undefined,
        }
      : null,
  );
  const old = shownPicture;
  shownWatch = JSON.stringify(now ?? null);
  shownPicture = picture;
  if (picture === old && move !== "jump" && !flash) {
    showEndDelay();
    return;
  }
  if (!now || !stage) {
    // nothing on the screen moves, so nothing is to wait for
    document.documentElement.style.setProperty("--watch-end-delay", "0s");
    run();
    return;
  }
  const at = performance.now();
  // a watch that is fading out or hidden first reaches its last target at
  // once: it comes back from its slide's state, not from a move cut short
  if (hideTimer !== undefined || hidden.value) goOutOfSight();
  // a slide reached from a slide without the watch starts at its state
  stage.show(
    stageState(
      WATCH,
      { ...now, flash, move: cameraMove ?? now.move },
      moveWith,
    ),
    modelState(now),
    move === "jump" || old === "null",
  );
  stageTarget = now;
  document.documentElement.style.setProperty(
    "--watch-text-delay",
    `${String((stage.viewEndAt(at) - at) / 1000)}s`,
  );
  showRestDelay();
  showEndDelay();
  run();
}

/** Set `--watch-end-delay`: how long until the watch's change ends, with
 *  its flash, or 0 if it has. */
function showEndDelay(): void {
  const at = performance.now();
  const milliseconds = stage ? stage.endAt(at) - at : 0;
  document.documentElement.style.setProperty(
    "--watch-end-delay",
    `${String(milliseconds / 1000)}s`,
  );
}

/** Set `--watch-rest-delay`: how long until the balance is at rest, or 0 if
 *  it is not going to rest. */
function showRestDelay(): void {
  const milliseconds = model.value?.untilRest(performance.now()) ?? 0;
  document.documentElement.style.setProperty(
    "--watch-rest-delay",
    `${String(milliseconds / 1000)}s`,
  );
}

/** Draw while the watch shows. Once it hides, after the canvas's fade, go
 *  out of sight. */
function run(): void {
  if (hidden.value) {
    // a click while it fades does not restart the fade's timer
    hideTimer ??= setTimeout(goOutOfSight, 400); // after the canvas's fade
  } else {
    clearTimeout(hideTimer);
    hideTimer = undefined;
    stage?.start();
  }
}

/** Go to the last target at once, and stop drawing: a move that nobody sees
 *  has no reason to go on. So the watch comes back in the state of its click,
 *  however fast the clicks came: a camera move that the board covers ends
 *  under it, not when the board fades. */
function goOutOfSight(): void {
  clearTimeout(hideTimer);
  hideTimer = undefined;
  if (stageTarget && stage) {
    stage.show(stageState(WATCH, stageTarget), modelState(stageTarget), true);
    showRestDelay();
  }
  stage?.stop();
}

/** Whether a step at `at` (ms) is a press during a move, and so a jump: the
 *  stage's change or the board's story runs, or a burst has not ended. */
function pressJumps(at: number): boolean {
  return boardBusy.value || at < burstUntil || (stage?.endAt(at) ?? at) > at;
}

/** The frontmatter of the slide numbered `slide` (1-based). */
function frontmatterOf(slide: number): Record<string, unknown> {
  const route = nav.slides.value.find((each) => each.no === slide);
  return route?.meta.slide?.frontmatter ?? {};
}

function showBoard(clicks: number, move: Move): void {
  const target = boardState(frontmatter.value, clicks);
  if (
    JSON.stringify(target) === JSON.stringify(board.value.state) &&
    move !== "jump"
  )
    return;
  board.value = { state: target, atOnce: move === "jump" };
}

onMounted(() => {
  if (!live || !canvas.value) return;
  model.value = new WatchModel(WATCH);
  stage = new Stage(
    canvas.value,
    WATCH.scene,
    palette.value.palette,
    model.value,
  );
  window.watchStage = stage;
  window.slideState = () =>
    slideState(stage, canvas.value, shownWatch, pressJumps(performance.now()));
  document.documentElement.style.setProperty(
    "--watch-fade",
    `${String(FADE_SECONDS)}s`,
  );
  onChange(
    () => JSON.stringify([slidev.nav.currentSlideNo, slidev.nav.clicks]),
    () => {
      const to = {
        slide: slidev.nav.currentSlideNo,
        clicks: slidev.nav.clicks,
      };
      const at = performance.now();
      const step = moveOf(place, to);
      const move = step !== "jump" && pressJumps(at) ? "jump" : step;
      if (move !== step) burstUntil = at + BURST_MS;
      const intoSlide = place?.slide !== to.slide;
      const moveWith =
        place && intoSlide
          ? moveWithBefore(frontmatterOf(Math.max(place.slide, to.slide)))
          : MOVE_WITH_COMMON;
      const from = place
        ? watchState(frontmatterOf(place.slide), place.clicks)
        : undefined;
      place = to;
      showWatch(
        state.value,
        move,
        moveWith,
        state.value && stepMove(from, state.value, move),
      );
      showBoard(to.clicks, move);
    },
    { immediate: true },
  );
  onChange(covered, run);
  onChange(palette, (now) => {
    stage?.setPalette(now.palette);
  });
});
onBeforeUnmount(() => {
  unmounted = true;
  clearTimeout(hideTimer);
  stage?.dispose();
  stage = undefined;
  delete window.watchStage;
  delete window.slideState;
});

// The presenter view draws the next slide's still in its "next" pane. Draw
// them all once, while the page is idle after it loads, so that a slide
// change finds its still ready (?stills=lazy turns this off, to compare).
onMounted(() => {
  const lazy = new URLSearchParams(location.search).get("stills") === "lazy";
  if (!live || lazy || !location.pathname.startsWith("/presenter")) return;
  const ratio = window.devicePixelRatio || 1;
  const size: [number, number] = [
    Math.round(WATCH.scene.slide[0] * ratio),
    Math.round(WATCH.scene.slide[1] * ratio),
  ];
  const pending = nav.slides.value.flatMap((route) => {
    const slide = route.meta.slide?.frontmatter ?? {};
    const shown = watchState(slide, 0);
    return shown
      ? [{ shown, palette: slidePalette(slide["class"]).palette }]
      : [];
  });
  const next = (): void => {
    const slide = pending.shift();
    if (!slide || unmounted) return;
    void watchStills().of(slide.shown, size, slide.palette);
    requestIdleCallback(next);
  };
  setTimeout(() => {
    requestIdleCallback(next);
  }, 1000);
});
</script>

<template>
  <FigureLayer v-if="figure" />
  <div
    v-else-if="live"
    class="slidev-layout watch-layer"
    :class="{ 'watch-off': hidden }"
    :style="palette.variables"
  >
    <canvas
      ref="canvas"
      class="watch-canvas"
      :data-watch="JSON.stringify(state ?? null)"
    />
    <DivingBoard
      :target="board"
      :live="true"
      @cover="(covers: boolean) => (covered = covers)"
      @busy="(busy: boolean) => (boardBusy = busy)"
    />
    <TickTock :model="model" :shown="tickTock" />
    <TimeScale :model="model" :shown="timeScale" />
  </div>
</template>

<style>
.watch-layer {
  position: absolute;
  inset: 0;
  padding: 0;
  transition: opacity 0.3s;
}
/* Only the canvas fades. The layer keeps painting the paper: a slide with a
   `watch:` is see-through (see .watch-marker below), and when the diving board
   covers the watch the slide is still that slide, so the layer is its
   background. */
.watch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transition: opacity 0.3s;
}
.watch-layer.watch-off .watch-canvas {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.3s,
    visibility 0s 0.3s;
}
/* see-through, and positioned, so it paints above a still (which is positioned) */
.watch-marker ~ .slidev-layout {
  background: transparent;
  position: relative;
}
.watch-still {
  position: absolute;
  inset: 0;
}
.watch-still-covered {
  visibility: hidden;
}
.watch-still img {
  width: 100%;
  height: 100%;
  display: block;
}
/* `transition: watch-zoom`: the old slide's text fades while the watch
   flashes. The camera then moves; the new slide's text comes in after
   the move. The script sets --watch-text-delay from the stage's times. */
.watch-zoom-leave-active {
  transition: opacity 0.9s ease-in;
}
.watch-zoom-enter-active {
  transition: opacity 0.5s ease-out var(--watch-text-delay);
}
.watch-zoom-leave-to,
.watch-zoom-enter-from {
  opacity: 0;
}
</style>

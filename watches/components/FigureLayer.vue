<script setup lang="ts">
// The watch, the diving board, "tick" and "tock" and the time scale in one
// figure of the article (addons/narration): what the live layer draws
// (global-bottom.vue), at the figure's click, with the renderer that all the
// page's figures share (webgl/shared.ts), not a WebGL context of its own.
// global-bottom.vue draws this in place of the live layer when it finds the
// figure (`FIGURE`). docs/article.md has the rules and the reasons.
//
// A change of the figure's click is a step (one click either way) or a jump,
// as in the talk (watch/navigation.ts). A step forward flashes, as in the
// talk: the reader asked for it, and is looking at the figure. At every
// click, the figure marks the pieces that its run flashed (`figureMarks`,
// watch/article.ts): a steady flash, for a reader whose eyes are on the
// words.
//
// THE SLIDERS (a slide's `article` settings). `curl` holds the diving board
// at a point of its curl. `twist` winds the hairspring from rest, by up to
// the balance's amplitude, and holds it; when the reader lets go, it swings
// from there, and the thumb follows it back to rest, in a quarter of the
// balance's period, ready to catch it again.
// `wind` holds the Mainspring
// slide's story at a point from the bare spring, through the key's turns, to
// the release: the stud shows until the spring is let go.
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
  FigureContext,
  FigureControl,
} from "../addons/narration/figure.ts";
import DivingBoard from "./DivingBoard.vue";
import TickTock from "./TickTock.vue";
import TimeScale from "./TimeScale.vue";
import { SharedView } from "../webgl/shared.ts";
import type { Mesh } from "../webgl/scene.ts";
import { figureMarks, figureSettings, figureState } from "../watch/article.ts";
import { boardState } from "../watch/board.ts";
import type { BoardTarget } from "../watch/board.ts";
import { jewelStrikes } from "../watch/callouts.ts";
import { sharedStage, WATCH } from "../watch/instance.ts";
import { placeFor } from "../watch/mainspring.ts";
import type { MainspringStage } from "../watch/mainspring.ts";
import { twistAngle, WatchModel } from "../watch/model.ts";
import type { WatchModelState } from "../watch/model.ts";
import { moveOf } from "../watch/navigation.ts";
import { slidePalette } from "../watch/palette.ts";
import {
  modelState,
  stageState,
  stepMove,
  tickTockState,
  timeScaleState,
  watchState,
} from "../watch/state.ts";
import type { WatchState } from "../watch/state.ts";

const slidev = inject(injectionSlidevContext);
const injected = inject(FIGURE);
if (!slidev || !injected) throw new Error("FigureLayer is for a figure");
const figure: FigureContext = injected;
const frontmatter = computed(
  () => slidev.nav.currentSlideRoute.meta.slide?.frontmatter ?? {},
);
const total = computed(() => Number(frontmatter.value["clicks"] ?? 0));
const settings = computed(() =>
  figureSettings(frontmatter.value, figure.clicks.value),
);
const palette = computed(() => slidePalette(frontmatter.value["class"]));

/** The sliders' values, 0 to 1. The board starts ready to curl; the
 *  hairspring at rest; the mainspring bare. */
const curl = ref(0);
const twist = ref(0);
const wind = ref(0);

/** Degrees: the balance's angle at the `twist` slider's value. Negative: the
 *  coils draw in (`springPoints`). */
function twistDegrees(value: number): number {
  return -value * WATCH.design.timing.amplitude;
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
  const start = performance.now();
  model.value?.twist(twistDegrees(from), start, true);
  const { period } = WATCH.design.timing;
  const follow = (now: number): void => {
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
  follow(start);
}

/** The first click at which the slide's story is at `stage`. */
function clickOfStage(stage: MainspringStage): number {
  for (let clicks = 0; clicks <= total.value; clicks++) {
    if (watchState(frontmatter.value, clicks)?.mainspring === stage) {
      return clicks;
    }
  }
  throw new Error(`the slide has no watchMainspring: ${stage}`);
}

/** Story time (s) on the Mainspring slide's line, for `wind`: from the bare
 *  spring to the end of the release. */
const windTime = computed(() => wind.value * placeFor("released"));
/** The click whose state shows: the figure's, or, with the `wind` slider,
 *  the story's stage at the slider's place. */
const clicks = computed(() => {
  if (settings.value.slider !== "wind") return figure.clicks.value;
  return clickOfStage(
    windTime.value <= placeFor("wound") ? "wound" : "released",
  );
});
const state = computed(() => figureState(frontmatter.value, clicks.value));

const covered = ref(false);
const hidden = computed(() => !state.value || covered.value);
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const model = shallowRef<WatchModel>();
let view: SharedView<WatchModelState> | undefined;
let shown: { clicks: number; state: WatchState | undefined } | undefined;

const board = computed<BoardTarget>(() => ({
  state: boardState(frontmatter.value, clicks.value),
  atOnce: false,
}));
const boardScrub = computed(() =>
  settings.value.slider === "curl" ? curl.value : null,
);
const tickTock = computed(() =>
  tickTockState(frontmatter.value, clicks.value) && !hidden.value
    ? { strikes: jewelStrikes(WATCH, frontmatter.value) }
    : undefined,
);
const timeScale = computed(() =>
  state.value &&
  timeScaleState(frontmatter.value, clicks.value) &&
  !hidden.value
    ? state.value.lapse
    : undefined,
);

/** The meshes of the pieces named. */
function meshesOf(names: readonly string[]): Set<Mesh> {
  return new Set(
    WATCH.scene.pieces
      .filter((piece) => names.includes(piece.name))
      .flatMap((piece) => [...piece.meshes]),
  );
}

/** Show the state at `to` (a click): a step or a jump from what shows. */
function show(to: number, atOnce: boolean): void {
  const now = state.value;
  if (!view || !now) {
    shown = { clicks: to, state: now };
    return;
  }
  const move = atOnce
    ? "jump"
    : moveOf(shown && { slide: 0, clicks: shown.clicks }, {
        slide: 0,
        clicks: to,
      });
  const flash = move === "forward" ? now.flash : undefined;
  view.show(
    stageState(WATCH, {
      ...now,
      flash,
      move: stepMove(shown?.state, now, move),
    }),
    modelState(now),
    move === "jump",
  );
  view.marked = meshesOf(figureMarks(WATCH, frontmatter.value, to));
  shown = { clicks: to, state: now };
  figure.busyUntil.value = view.endAt(performance.now());
}

onMounted(() => {
  if (!canvas.value || !state.value) return;
  model.value = new WatchModel(WATCH);
  view = new SharedView(canvas.value, model.value, palette.value.palette);
  show(clicks.value, true);
  if (settings.value.slider === "twist") {
    model.value.twist(twistDegrees(twist.value), performance.now(), false);
  }
  if (settings.value.slider === "wind") {
    model.value.scrub(windTime.value, performance.now());
  }
  view.paused = figure.paused.value;
  sharedStage().add(view);
});
onBeforeUnmount(() => {
  stopThumbReturn();
  if (view) sharedStage().remove(view);
});

// a slider's own moves are no steps: the state changes at once
onChange(clicks, (to) => {
  show(to, settings.value.slider === "wind");
  if (settings.value.slider === "wind") {
    model.value?.scrub(windTime.value, performance.now());
  }
});
// at once, so that the thumb's own way back (`letGo`) is told from the
// reader's move: the reader's move catches the hairspring and holds it
onChange(
  twist,
  (value) => {
    if (settings.value.slider !== "twist" || thumbReturn?.value === value)
      return;
    stopThumbReturn();
    model.value?.twist(twistDegrees(value), performance.now(), false);
  },
  { flush: "sync" },
);
onChange(windTime, (time) => {
  if (settings.value.slider === "wind")
    model.value?.scrub(time, performance.now());
});
onChange(figure.paused, (paused) => {
  if (view) view.paused = paused;
});
onChange(palette, (now) => {
  if (view) view.palette = now.palette;
});
onChange(
  () => settings.value.slider,
  (slider) => {
    const controls: FigureControl[] = [];
    if (slider === "curl") {
      controls.push({
        kind: "slider",
        label: "Curl the diving board into the hairspring",
        start: "Board",
        end: "Hairspring",
        value: curl,
      });
    } else if (slider === "twist") {
      controls.push({
        kind: "slider",
        label: "Give it a twist, then let go",
        start: "Rest",
        end: "Wound",
        value: twist,
        release: letGo,
      });
    } else if (slider === "wind") {
      controls.push({
        kind: "slider",
        label: "Wind the mainspring, then let it go",
        start: "Bare",
        end: "Let go",
        value: wind,
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
    :style="palette.variables"
  >
    <canvas ref="canvas" class="watch-canvas" />
    <DivingBoard
      :target="board"
      :live="true"
      :scrub="boardScrub"
      :paused="figure.paused.value || !figure.near.value"
      @cover="(covers: boolean) => (covered = covers)"
    />
    <TickTock :model="model" :shown="tickTock" />
    <TimeScale :model="model" :shown="timeScale" />
  </div>
</template>

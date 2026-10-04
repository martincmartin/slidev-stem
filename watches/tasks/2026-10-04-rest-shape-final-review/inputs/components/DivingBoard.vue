<script setup lang="ts">
// The diving board of public/diving-board.svg, for a slide. The SVG is a SMIL
// animation with one timeline (art/diving_board.py writes it). This component
// owns the clock: the file is inlined, its animations are paused, and the
// timeline is set by hand. `visible` fades the picture in; `playing` runs the
// timeline from 0 (bend, hold, swing); `curling` fades the pool and the stand
// at once, and curls the board at the next bottom of its swing, where it is
// still (the SVG's `data-curl-start`). Until then the SVG's time stays inside
// the swing's one cycle, so it can jump to the curl without a change of pose.
// The clock runs only while the slide is the one on screen: Slidev keeps a left
// slide mounted and gives it its last click, so `playing` alone would keep it
// running off-screen. Each entry into the playing state starts again from 0,
// and going back a click is exact.
// The rest outline and its callout use this same curl clock. `restVisible`
// keeps them on the slide after the moving board fades into the real spring.
import { useNav, useSlideContext } from "@slidev/client";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";

const props = defineProps<{
  visible: boolean;
  playing: boolean;
  curling: boolean;
  restVisible: boolean;
  noBend?: boolean;
}>();

const { $renderContext, $page } = useSlideContext();
const LIVE = ["slide", "presenter"];
const { currentSlideNo } = useNav();
const running = computed(
  () =>
    props.playing &&
    currentSlideNo.value === $page.value &&
    LIVE.includes($renderContext.value),
);
const CURLING_CLASS = "diving-board-curling";

const host = useTemplateRef<HTMLDivElement>("host");
const markup = ref("");
let frame = 0;
let startedAt = 0; // ms: the SVG's time 0
let curlAt = Infinity; // ms: when the curl starts

function svg(): SVGSVGElement | null {
  return host.value?.querySelector("svg") ?? null;
}

function timing(board: SVGSVGElement, name: string): number {
  const seconds = Number(board.dataset[name]);
  if (!Number.isFinite(seconds))
    throw new Error(`diving-board.svg has no data-${name}`);
  return seconds;
}

/** The SVG's time for the clock's `now` (ms): inside the swing's cycle until
 *  the curl, then the curl's. */
function svgTime(board: SVGSVGElement, now: number): number {
  const swingStart = timing(board, "swingStart");
  const period = timing(board, "swingPeriod");
  if (now >= curlAt) return timing(board, "curlStart") + (now - curlAt) / 1000;
  const elapsed = (now - startedAt) / 1000;
  return elapsed < swingStart
    ? elapsed
    : swingStart + ((elapsed - swingStart) % period);
}

/** When the board is next at the bottom of its swing, as a time of the clock
 *  (ms): the swing starts at the bottom, and is there each period. */
function nextBottom(board: SVGSVGElement, now: number): number {
  const swingStart = timing(board, "swingStart");
  const period = timing(board, "swingPeriod");
  const elapsed = (now - startedAt) / 1000;
  const cycles =
    elapsed <= swingStart ? 0 : Math.ceil((elapsed - swingStart) / period);
  return startedAt + (swingStart + cycles * period) * 1000;
}

function run(now: number): void {
  const board = svg();
  if (board) {
    const curlEnd = timing(board, "curlStart") + timing(board, "curlDuration");
    const time = svgTime(board, now);
    board.setCurrentTime(Math.min(time, curlEnd));
    if (time >= curlEnd) {
      frame = 0;
      return;
    }
  }
  frame = requestAnimationFrame(run);
}

function stop(): void {
  cancelAnimationFrame(frame);
  frame = 0;
}

function apply(): void {
  stop();
  const board = svg();
  if (!board) return;
  board.pauseAnimations();
  board.setCurrentTime(0);
  curlAt = Infinity;
  showCurling();
  // A direct entry or a click back from the next slide must show the
  // completed rest spring when the real spring is already visible.
  if (props.curling && !props.visible) {
    board.setCurrentTime(
      timing(board, "curlStart") + timing(board, "curlDuration"),
    );
    return;
  }
  if (running.value) {
    startedAt = performance.now();
    if (props.curling) curlAt = nextBottom(board, startedAt);
    frame = requestAnimationFrame(run);
  }
}

function showCurling(): void {
  svg()?.classList.toggle(CURLING_CLASS, props.curling);
}

function curl(): void {
  const board = svg();
  if (board && running.value && curlAt === Infinity)
    curlAt = nextBottom(board, performance.now());
  showCurling();
}

onMounted(async () => {
  const source = props.noBend
    ? "/diving-board-no-bend.svg"
    : "/diving-board.svg";
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${source}: ${String(response.status)}`);
  markup.value = await response.text();
  await nextTick(); // v-html puts the SVG in the page
  requestAnimationFrame(apply);
});
watch(running, apply);
watch(
  () => props.visible,
  (visible) => {
    if (!visible && props.curling) apply();
  },
);
watch(
  () => props.curling,
  (curling) => {
    if (curling) curl();
    else apply();
  },
);
onBeforeUnmount(stop);
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- our own file, public/diving-board.svg -->
  <div
    ref="host"
    class="diving-board"
    :class="{
      'diving-board-on': visible || restVisible,
      'diving-board-picture-on': visible,
      'diving-board-rest-on': restVisible,
    }"
    aria-hidden="true"
    v-html="markup"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<style>
.diving-board {
  position: absolute;
  /* the drawing is the whole slide's width, 980 x 452, from its left edge to
     its bottom: its x 0 is the slide's x -50 (its viewBox starts at 50), so its
     spiral's centre, (325, 176), is the hairspring's on the slide, (275, 276).
     The ground and the pool run off the bottom of the slide, and the ground and
     the stand off its left. The pool fades to the paper by 60% of the slide's
     width (`fade_end` in art/diving_board.py) */
  left: 0;
  top: 100px;
  width: 980px;
  height: 452px;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}
.diving-board-on {
  opacity: 1;
}
.diving-board [data-layer="board"],
.diving-board [data-layer="rest"],
.diving-board [data-layer="rest-callout"] {
  opacity: 0;
  transition: opacity 0.4s;
}
.diving-board [data-layer="set"] {
  opacity: 0;
}
.diving-board-picture-on [data-layer="board"],
.diving-board-picture-on svg:not(.diving-board-curling) [data-layer="set"],
.diving-board-rest-on [data-layer="rest"],
.diving-board-rest-on [data-layer="rest-callout"] {
  opacity: 1;
}
/* the curling board rises above the drawing's top edge, into the title's
   space: do not crop it to the SVG's box (the slide crops the rest) */
.diving-board svg {
  overflow: visible;
}
@media (prefers-reduced-motion: reduce) {
  .diving-board {
    transition: none;
  }
  .diving-board [data-layer="board"],
  .diving-board [data-layer="rest"],
  .diving-board [data-layer="rest-callout"] {
    transition: none;
  }
}
</style>

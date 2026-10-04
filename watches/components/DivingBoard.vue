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
// A page that does not run the clock (print and export, the overview) shows the
// pose of its click: bent, or part-way through the curl (watch/board.ts).
// `data-waitfor` makes `slidev export` wait until the SVG is in place and posed.
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
import { boardPoseTime } from "../watch/board.ts";

const props = defineProps<{
  visible: boolean;
  playing: boolean;
  curling: boolean;
}>();

const { $renderContext, $page } = useSlideContext();
const LIVE = ["slide", "presenter"];
const { currentSlideNo, isPrintMode } = useNav();
const running = computed(
  () =>
    props.playing &&
    currentSlideNo.value === $page.value &&
    LIVE.includes($renderContext.value) &&
    !isPrintMode.value,
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

/** The SVG's time for a page that does not run the clock. */
function poseTime(board: SVGSVGElement): number {
  return boardPoseTime(
    {
      swingStart: timing(board, "swingStart"),
      curlStart: timing(board, "curlStart"),
      curlDuration: timing(board, "curlDuration"),
    },
    props.playing,
    props.curling,
  );
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
  if (board) board.setCurrentTime(svgTime(board, now));
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
  curlAt = Infinity;
  if (running.value) {
    board.setCurrentTime(0);
    startedAt = performance.now();
    if (props.curling) curlAt = nextBottom(board, startedAt);
    frame = requestAnimationFrame(run);
  } else {
    board.setCurrentTime(poseTime(board));
  }
  board.setAttribute("data-posed", "");
  showCurling();
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
  const response = await fetch("/diving-board.svg");
  if (!response.ok)
    throw new Error(`diving-board.svg: ${String(response.status)}`);
  markup.value = await response.text();
  await nextTick(); // v-html puts the SVG in the page
  requestAnimationFrame(apply);
});
watch(running, apply);
watch(
  () => props.curling,
  (curling) => {
    if (curling && running.value) curl();
    else apply();
  },
);
watch(
  () => props.playing,
  () => {
    if (!running.value) apply(); // a page that does not run the clock
  },
);
onBeforeUnmount(stop);
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- our own file, public/diving-board.svg -->
  <div
    ref="host"
    class="diving-board"
    :class="{ 'diving-board-on': visible }"
    data-waitfor="svg[data-posed]"
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
/* the curling board rises above the drawing's top edge, into the title's
   space: do not crop it to the SVG's box (the slide crops the rest) */
.diving-board svg {
  overflow: visible;
}
@media (prefers-reduced-motion: reduce) {
  .diving-board {
    transition: none;
  }
}
</style>

<script setup lang="ts">
// The diving board of public/diving-board.svg. The SVG is a SMIL animation with
// one timeline (art/diving_board.py writes it). This component owns the clock:
// the file is inlined, its animations are paused, and the timeline is set by
// hand, from `BoardClock` (watch/board.ts).
//
// There is one live board for the whole talk, in the watch's layer
// (global-bottom.vue), as there is one live watch. It takes each slide's
// target (`boardState` of the slide's frontmatter and click) and goes there
// from what is on the screen: the picture and the rest shape fade in or out
// (CSS transitions), and the clock bends, curls or uncurls the board. So a
// move back is the move forward reversed, with no code for it
// (../../docs/navigation.md). With `atOnce` (a jump), it shows the target with
// no fade and no motion.
//
// `live` false: a page that does not run the clock (print and export, the
// overview, the presenter's "next" pane: slide-bottom.vue). It shows the pose
// of its click (`boardPoseTime`). `data-waitfor` makes `slidev export` wait
// until the SVG is in place and posed.
//
// `data-phase` and `data-busy` on the host are for tools/navcheck.py
// (watch/slide-state.ts).
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { BoardClock, boardPoseTime } from "../watch/board.ts";
import type { BoardState, BoardTarget, BoardTiming } from "../watch/board.ts";

const props = defineProps<{ target: BoardTarget; live: boolean }>();

const CURLING_CLASS = "diving-board-curling";
const BUSY_PHASES = new Set(["bend", "curl", "uncurl"]);

const host = useTemplateRef<HTMLDivElement>("host");
const markup = ref("");
/** The state that the classes show; it changes when the target is applied. */
const shown = ref<BoardState | undefined>(undefined);
const instant = ref(false);
let clock: BoardClock | null = null;
let frame = 0;

function svg(): SVGSVGElement | null {
  return host.value?.querySelector("svg") ?? null;
}

function timingOf(board: SVGSVGElement): BoardTiming {
  const read = (name: string): number => {
    const seconds = Number(board.dataset[name]);
    if (!Number.isFinite(seconds))
      throw new Error(`diving-board.svg has no data-${name}`);
    return seconds;
  };
  return {
    swingStart: read("swingStart"),
    swingPeriod: read("swingPeriod"),
    curlStart: read("curlStart"),
    curlDuration: read("curlDuration"),
  };
}

/** Set the SVG's time and the host's phase at `now`; go on while it moves. */
function draw(now: number): void {
  frame = 0;
  const board = svg();
  if (!board || !clock || !host.value) return;
  board.setCurrentTime(clock.time(now));
  const phase = shown.value ? clock.phase(now) : "off";
  host.value.dataset["phase"] = phase;
  host.value.dataset["busy"] = String(BUSY_PHASES.has(phase));
  if (shown.value && clock.moving(now)) frame = requestAnimationFrame(draw);
}

function apply(target: BoardTarget): void {
  const board = svg();
  if (!board) return; // onMounted applies the target when the SVG is in
  board.pauseAnimations();
  const state = target.state;
  board.classList.toggle(CURLING_CLASS, state?.curling ?? false);
  if (!props.live) {
    shown.value = state;
    if (state) board.setCurrentTime(boardPoseTime(timingOf(board), state));
    board.setAttribute("data-posed", "");
    return;
  }
  cancelAnimationFrame(frame);
  clock ??= new BoardClock(timingOf(board));
  const now = performance.now();
  // a slide with no board leaves the clock where it is: its rest shape fades
  // out in the pose that it had, and comes back in it
  if (state) clock.show(state.place, now, target.atOnce);
  if (target.atOnce) {
    // no CSS transition for this change: on, and off again after it is drawn
    instant.value = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        instant.value = false;
      });
    });
  }
  shown.value = state;
  draw(now);
}

onMounted(async () => {
  const source = "/diving-board.svg";
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${source}: ${String(response.status)}`);
  markup.value = await response.text();
  await nextTick(); // v-html puts the SVG in the page
  apply({ state: props.target.state, atOnce: true });
});
watch(
  () => props.target,
  (target) => {
    apply(target);
  },
);
onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
});

const classes = computed(() => ({
  "diving-board-on": shown.value !== undefined,
  "diving-board-picture-on": shown.value?.picture ?? false,
  "diving-board-rest-on": shown.value?.rest ?? false,
  "diving-board-instant": instant.value,
}));
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- our own file, public/diving-board.svg -->
  <div
    ref="host"
    class="diving-board"
    :data-waitfor="live ? undefined : 'svg[data-posed]'"
    :class="classes"
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
  pointer-events: none;
}
/* Each layer fades on its own. The picture fades in 0.4 s, with the watch's
   0.3 s fade at the clicks where one takes the other's place. The rest shape
   fades with the watch's swap, when the balance wheel joins (`--watch-fade`,
   which global-bottom.vue sets from FADE_SECONDS in webgl/timeline.ts). */
.diving-board [data-layer="board"],
.diving-board [data-layer="rest"],
.diving-board [data-layer="rest-callout"] {
  opacity: 0;
  transition: opacity 0.4s;
}
.diving-board [data-layer="rest"],
.diving-board [data-layer="rest-callout"] {
  transition-duration: var(--watch-fade, 0.8s);
  /* the stage's cubic ease-in-out (`ease` in webgl/timeline.ts), so that the
     two fades cross at the same moment */
  transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
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
.diving-board-instant [data-layer] {
  transition: none !important;
}
@media (prefers-reduced-motion: reduce) {
  .diving-board [data-layer="board"],
  .diving-board [data-layer="rest"],
  .diving-board [data-layer="rest-callout"] {
    transition: none;
  }
}
</style>

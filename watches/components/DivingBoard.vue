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
// The picture shows until the clock passes the curl's end (`pictureShown`).
// While it shows, it covers the watch: the component emits `cover`, and the
// layer under it hides the watch.
//
// `live` false: a page that does not run the clock (print and export, the
// overview, the presenter's "next" pane: slide-bottom.vue). It shows the pose
// of its click (`boardPoseTime`). `data-waitfor` makes `slidev export` wait
// until the SVG is in place and posed.
//
// `data-phase` and `data-busy` on the host are for tools/navcheck.py
// (watch/slide-state.ts).
//
// THE CALLOUT'S SENTENCE is here, as HTML, not in the SVG: HTML is the simpler
// tool for text (the browser lays it out, so a strike is its word's width).
// It is the leader's label, so it fades with the
// leader (`data-layer="rest-callout"`), and its line "from straight," starts
// where the SVG's root says (`data-label-x`, `data-label-y`). After the curl,
// on the board's clock, "Bend" and "straight" are struck out and "Wind" and
// "rest" written above them (`editStep`): the label names the rest shape that
// the dashed outline now is. The rows for the new words are there from the
// start, so no line moves.
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import {
  BoardClock,
  boardPoseTime,
  EDIT_STEPS,
  editStep,
  pictureShown,
} from "../watch/board.ts";
import type { BoardState, BoardTarget, BoardTiming } from "../watch/board.ts";

const props = defineProps<{ target: BoardTarget; live: boolean }>();
const emit = defineEmits<{
  /** Whether the board's picture shows, and so covers the watch. */
  cover: [covers: boolean];
}>();

const CURLING_CLASS = "diving-board-curling";
const BUSY_PHASES = new Set(["bend", "curl", "uncurl"]);

const host = useTemplateRef<HTMLDivElement>("host");
const markup = ref("");
/** The state that the classes show; it changes when the target is applied. */
const shown = ref<BoardState | undefined>(undefined);
/** Whether the picture shows at the clock's time. */
const picture = ref(false);
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
    editDuration: read("editDuration"),
  };
}

/** Put the sentence where the SVG's root says: its x is in the SVG's units,
 *  whose viewBox starts right of the host's left edge. */
function placeSentence(board: SVGSVGElement): void {
  const x = Number(board.dataset["labelX"]);
  const y = Number(board.dataset["labelY"]);
  if (!Number.isFinite(x) || !Number.isFinite(y))
    throw new Error("diving-board.svg has no data-label-x or data-label-y");
  host.value?.style.setProperty(
    "--label-x",
    `${String(x - board.viewBox.baseVal.x)}px`,
  );
  host.value?.style.setProperty("--label-y", `${String(y)}px`);
}

/** Draw what depends on the SVG's `time` (s) and not on the SVG: the edit
 *  of the sentence, and whether the picture shows. */
function drawAt(timing: BoardTiming, time: number): void {
  for (let index = 0; index < EDIT_STEPS; index++) {
    host.value?.style.setProperty(
      `--edit-${String(index)}`,
      String(editStep(timing, time, index)),
    );
  }
  picture.value = shown.value ? pictureShown(timing, shown.value, time) : false;
}

/** Set the SVG's time and the host's phase at `now`; go on while it moves. */
function draw(now: number): void {
  frame = 0;
  const board = svg();
  if (!board || !clock || !host.value) return;
  const time = clock.time(now);
  board.setCurrentTime(time);
  drawAt(timingOf(board), time);
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
    const timing = timingOf(board);
    const time = state ? boardPoseTime(timing, state) : 0;
    board.setCurrentTime(time);
    drawAt(timing, time);
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
  const board = svg();
  if (board) placeSentence(board);
  apply({ state: props.target.state, atOnce: true });
});
watch(
  () => props.target,
  (target) => {
    apply(target);
  },
);
watch(
  picture,
  (covers) => {
    emit("cover", covers);
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
});

const classes = computed(() => ({
  "diving-board-on": shown.value !== undefined,
  "diving-board-picture-on": picture.value,
  "diving-board-rest-on": shown.value?.rest ?? false,
  "diving-board-instant": instant.value,
}));
</script>

<template>
  <div
    ref="host"
    class="diving-board"
    :data-waitfor="live ? undefined : 'svg[data-posed]'"
    :class="classes"
    aria-hidden="true"
  >
    <!-- eslint-disable-next-line vue/no-v-html -- our own file, public/diving-board.svg -->
    <div class="diving-board-art" v-html="markup" />
    <div v-if="markup" class="diving-board-sentence" data-layer="rest-callout">
      <!-- no space inside a struck word's span: the strike is the span's width -->
      <!-- prettier-ignore -->
      <div><span class="diving-board-edit" style="--strike: var(--edit-0)">Bend<span class="diving-board-insert" style="--insert: var(--edit-1)">Wind</span></span> it away</div>
      <!-- prettier-ignore -->
      <div>from <span class="diving-board-edit" style="--strike: var(--edit-2)">straight<span class="diving-board-insert" style="--insert: var(--edit-3)">rest</span></span>,</div>
      <div>it pushes back</div>
    </div>
  </div>
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
   which global-bottom.vue sets from FADE_SECONDS in webgl/timeline.ts). The
   callout is text: it fades as text does (--text-fade, in style.css), and
   fades in only after the text that it replaces has faded out. */
.diving-board [data-layer="board"],
.diving-board [data-layer="rest"],
.diving-board [data-layer="rest-callout"] {
  opacity: 0;
  transition: opacity 0.4s;
}
.diving-board [data-layer="rest"] {
  transition-duration: var(--watch-fade, 0.8s);
  /* the stage's cubic ease-in-out (`ease` in webgl/timeline.ts), so that the
     two fades cross at the same moment */
  transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
}
.diving-board [data-layer="rest-callout"] {
  transition-duration: var(--text-fade);
}
.diving-board-rest-on [data-layer="rest-callout"] {
  transition-delay: var(--text-fade);
}
.diving-board [data-layer="set"] {
  opacity: 0;
}
/* THE SENTENCE. 35 px: in the column right of the picture, sentence case at
   35 px is as wide as capitals at 29 px, and its lowercase is 18 px high
   (tasks/2026-10-04-hairspring-sentence-placement/). Each line is 2.1 em, room
   for a written-in word above a word and the line above's descenders, so the
   edit moves no line. The second line's baseline is at --label-y: IBM Plex
   Sans's ascent and descent are 1.025 and 0.275 em, so a baseline is 0.375 em
   below the middle of its line, and the second line's is 1.5 lines + 0.375 em
   = 3.525 em from the top. */
.diving-board-sentence {
  position: absolute;
  left: var(--label-x);
  top: calc(var(--label-y) - 3.525em);
  font-size: 35px;
  font-weight: 600;
  line-height: 2.1;
  white-space: nowrap;
  color: var(--palette-ink);
}
.diving-board-edit {
  position: relative;
}
/* the strike: 3 px (the stroke ladder), through the middle of the x-height
   (0.26 em above the baseline, which is 1.025 em below the content's top),
   drawn left to right */
.diving-board-edit::after {
  content: "";
  position: absolute;
  left: -0.06em;
  right: -0.06em;
  top: calc(0.765em - 1.5px);
  height: 3px;
  background: var(--palette-accent);
  transform: scaleX(var(--strike, 0));
  transform-origin: left;
}
/* the new word, centred above the old one: its baseline 0.91 em above the old
   word's, clear of the old word's ascenders (0.74 em) */
.diving-board-insert {
  position: absolute;
  left: 50%;
  top: -0.91em;
  line-height: 1.3;
  transform: translateX(-50%);
  color: var(--palette-accent);
  opacity: var(--insert, 0);
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

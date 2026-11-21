<script setup lang="ts">
// One figure of the article: the slide at a click, live, drawn by Slidev's
// print component with the talk's own layers, cropped to the picture's box
// and scaled to the page. The talk's layers find `FIGURE` and draw the
// figure's click (../figure.ts).
//
// A figure with steps has a control for each step; the talk's layers move
// from step to step as the talk does (a step animates). A playing figure (the
// Recap slide's tour) steps by itself while it is on the screen: each step
// waits for the change at the click to end (`busyUntil`), then for
// DWELL_MS, and after the last step it starts again. Its caption is the
// narration of its step.
//
// The reader can pause a figure that moves or plays; "pause all" on the
// page pauses every one. A still figure has no pause button. A paused
// figure's time stands (`FigureClock`, ../clock.ts). A step in it still
// moves: the time runs to the end of the step's change (`busyUntil`), and
// stands there. For a reader who asks for reduced motion, a step in a paused
// figure is a jump (`jumps`).
//
// THE TURN. Where the talk's layer gives a `turner` (../figure.ts), a drag
// on the figure turns its picture, and a "Reset view" button shows once it
// is turned. Three traps of 3D on a page, and how the figure avoids them:
// it does not listen to the wheel, so the wheel always scrolls the page; on
// a touch screen it lets the browser take a vertical swipe (`touch-action:
// pan-y`), so a thumb on a figure still scrolls, and only a sideways drag
// turns it; and the layer clamps the turn short of edge-on.
//
// "Reset view" eases the picture back (the layer's `reset`: with the
// camera's move, if a step moves it); until it is back, a drag turns
// nothing (`returning`). The rest of the step's change (a fade, a flash)
// does not wait: it does not move the view. A step keeps the turn, but in a playing figure: there, a
// turn holds the tour at its step (`held`), and a press of a step's button
// or of "Reset view" goes back to the tour. The picture eases back while
// the camera moves to the step, and the tour goes on from there.
//
// THE CROP. A figure of a picture is cropped to the picture's box (the
// talk's), widened to hold the labels: the elements with `in-figure` that
// show at its steps, measured on the page once they are drawn. The figure
// emits its own labels' box, and the page gives back `labels`, the box over
// the figures that share its crop (views/ArticlePage.vue). Where the talk
// gives no box, a slide's `in-figure` elements are its picture (a painting,
// a photo): the figure is cropped to them, and hides the slide's text. A
// slide with neither is the whole slide.
import { createFixedClicks } from "@slidev/client/composables/useClicks.ts";
import { useFixedNav } from "@slidev/client/composables/useNav.ts";
import { slideHeight, slideWidth } from "@slidev/client/env.ts";
import PrintSlideClick from "@slidev/client/internals/PrintSlideClick.vue";
import type { SlideRoute } from "@slidev/client";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import { FigureClock } from "../clock.ts";
import { FIGURE } from "../figure.ts";
import type { Box, FigureControl, FigureTurner } from "../figure.ts";
import type { FigureBlock } from "../plan.ts";

const props = defineProps<{
  figure: FigureBlock;
  route: SlideRoute;
  /** The clicks of the figure's steps (the figure's own, or the slide's
   *  last for a slide that does not say how many it has). */
  steps: readonly number[];
  /** The talk's box of the picture, in slide px, or `null`: the talk
   *  gives none. */
  box: Box | null;
  /** px: the width that the figure may take on the page. */
  width: number;
  /** px: the height that the figure may take (a part of the window). */
  height: number;
  /** "Pause all". */
  pausedByPage: boolean;
  /** Whether the reader asks for reduced motion. */
  reducedMotion: boolean;
  /** The labels' box, in slide px, over the figures that share this one's
   *  crop, or `null`: none measured yet. */
  labels: Box | null;
}>();
const emit = defineEmits<{
  /** This figure's own labels' box, in slide px, once measured. */
  labels: [box: Box | null];
}>();

/** The largest scale of a figure: its lines and text grow past the
 *  slide's with it. */
const MAX_SCALE = 1.25;
/** ms: how long a playing figure stays at a step after its change ends. */
const DWELL_MS = 4500;
/** Degrees that a drag across the whole figure turns its picture. */
const DRAG_DEGREES = 180;
/** px: how far a touch moves before the figure knows its direction. */
const TOUCH_SLOP = 10;

const step = ref(0);
const clicks = computed(() => props.steps[step.value] ?? 0);
const nav = useFixedNav(props.route, createFixedClicks(props.route, clicks));
const near = ref(false);
const pausedByReader = ref(false);
const paused = computed(() => props.pausedByPage || pausedByReader.value);
const busyUntil = ref(0);
const controls = shallowRef<readonly FigureControl[]>([]);
const still = ref(false);
const turner = shallowRef<FigureTurner | null>(null);
/** Whether the picture is on its way back to the step's view, after
 *  "Reset view" or a step that ends a playing figure's turn. */
const returning = ref(false);
/** Whether a turn holds a playing figure at its step. */
const held = ref(false);
/** Whether a drag turns the picture. */
const turnable = computed(() => turner.value !== null && !returning.value);
const turned = computed(() => turner.value?.turned.value ?? false);
const clock = new FigureClock();
const now = (): number => clock.time(performance.now());
/** Whether the figure's time runs: while it plays, and in a run to
 *  `busyUntil`. */
const moving = ref(true);
const jumps = computed(() => paused.value && props.reducedMotion);
const pausable = computed(() => props.figure.play || !still.value);

/** px: room around a label. */
const LABEL_MARGIN = 8;

function union(first: Box | null, second: Box): Box {
  if (!first) return second;
  return {
    left: Math.min(first.left, second.left),
    top: Math.min(first.top, second.top),
    right: Math.max(first.right, second.right),
    bottom: Math.max(first.bottom, second.bottom),
  };
}

/** Whether the figure is of a picture (the talk's box, or the labels where
 *  the talk gives none), not of the whole slide with its text. */
const picture = computed(() => props.box !== null || props.labels !== null);
const crop = computed<Box>(() => {
  const whole = {
    left: 0,
    top: 0,
    right: slideWidth.value,
    bottom: slideHeight.value,
  };
  const box = props.labels ? union(props.box, props.labels) : props.box;
  if (!box) return whole;
  return {
    left: Math.max(whole.left, box.left),
    top: Math.max(whole.top, box.top),
    right: Math.min(whole.right, box.right),
    bottom: Math.min(whole.bottom, box.bottom),
  };
});
provide(FIGURE, {
  clicks,
  near,
  crop,
  now,
  moving,
  jumps,
  busyUntil,
  controls,
  still,
  turner,
});
const cropWidth = computed(() => crop.value.right - crop.value.left);
const cropHeight = computed(() => crop.value.bottom - crop.value.top);
const scale = computed(() =>
  Math.min(
    MAX_SCALE,
    props.width / cropWidth.value,
    props.height / cropHeight.value,
  ),
);
const frameStyle = computed(() => ({
  width: `${String(cropWidth.value * scale.value)}px`,
  height: `${String(cropHeight.value * scale.value)}px`,
}));
const slideStyle = computed(() => ({
  transform: `scale(${String(scale.value)}) translate(${String(-crop.value.left)}px, ${String(-crop.value.top)}px)`,
}));
const caption = computed(() => props.figure.captions[step.value] ?? null);

const frame = useTemplateRef<HTMLElement>("frame");
let observer: IntersectionObserver | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
/** Watches the slide while it loads, to measure its labels when they come. */
let mutations: MutationObserver | undefined;
let measureFrame = 0;
/** Ends a paused figure's run to `busyUntil`. */
let runEnd: ReturnType<typeof setTimeout> | undefined;
/** ms: how long the slide is watched for its labels. */
const LABELS_WAIT_MS = 4000;

/** Measure the labels that show at the figure's steps (with one step, those
 *  that its click shows), each with all that it draws (a leader too), in
 *  slide px. A label's own element may be a layer as big as the slide (a
 *  callout is), and an <svg> may draw past its box: their parts say where
 *  they draw. */
function measureLabels(): void {
  const slide = frame.value?.querySelector(".print-slide-container");
  if (!slide) return;
  const origin = slide.getBoundingClientRect();
  const ratio = origin.width / slideWidth.value;
  const layer = (rect: DOMRect): boolean =>
    rect.width >= 0.9 * origin.width && rect.height >= 0.9 * origin.height;
  let box: Box | null = null;
  // the slide's own labels, and those of the talk's global layers (the
  // diving board's sentence)
  for (const label of slide.querySelectorAll(".in-figure")) {
    if (props.steps.length === 1 && label.closest(".slidev-vclick-hidden")) {
      continue;
    }
    for (const element of [label, ...label.querySelectorAll("*")]) {
      // an <svg>'s box is its viewport (a callout's is 1 px at the slide's
      // corner, with `overflow: visible`): its shapes say where it draws
      if (element instanceof SVGSVGElement) continue;
      // with one step, a part that does not show at it needs no room (the
      // diving board's words that its edit writes in, after the curl)
      if (props.steps.length === 1 && getComputedStyle(element).opacity === "0")
        continue;
      const rect = element.getBoundingClientRect();
      if ((rect.width === 0 && rect.height === 0) || layer(rect)) continue;
      box = union(box, {
        left: (rect.left - origin.left) / ratio - LABEL_MARGIN,
        top: (rect.top - origin.top) / ratio - LABEL_MARGIN,
        right: (rect.right - origin.left) / ratio + LABEL_MARGIN,
        bottom: (rect.bottom - origin.top) / ratio + LABEL_MARGIN,
      });
    }
  }
  emit("labels", box);
}

/** Measure the labels at the next frame, once what changed is drawn. */
function measureSoon(): void {
  cancelAnimationFrame(measureFrame);
  measureFrame = requestAnimationFrame(measureLabels);
}

/** Set `moving` from the clock, and again when its run ends. */
function trackClock(): void {
  clearTimeout(runEnd);
  const remaining = clock.remaining(performance.now());
  moving.value = remaining > 0;
  if (remaining > 0 && remaining < Number.POSITIVE_INFINITY) {
    runEnd = setTimeout(trackClock, remaining);
  }
}

/** A playing figure's next step: after the change at its click ends. */
function schedule(): void {
  clearTimeout(timer);
  if (!props.figure.play || !near.value || paused.value || held.value) return;
  if (returning.value) return;
  const wait = Math.max(0, busyUntil.value - now()) + DWELL_MS;
  timer = setTimeout(() => {
    step.value = (step.value + 1) % props.steps.length;
  }, wait);
}

function go(index: number): void {
  step.value = Math.min(Math.max(index, 0), props.steps.length - 1);
  // after the talk's layer has taken the step, so that `busyUntil` is the
  // step's: the picture eases back while the camera moves
  if (held.value) void nextTick(resetView);
}

/** Ease the picture back to the step's view; a drag turns nothing until it
 *  is there. */
function resetView(): void {
  if (!turner.value) return;
  returning.value = true;
  turner.value.reset(props.reducedMotion);
  endReturn();
}

/** End `returning` once the picture is back (with the camera, if a step
 *  moves it); then a held tour goes on, after its dwell. */
function endReturn(): void {
  if (!returning.value || turned.value) return;
  returning.value = false;
  held.value = false;
}

/** The pointer that turns the picture, and where it was last. A touch
 *  turns nothing until it has moved `TOUCH_SLOP` px (`turning`): until
 *  then, the browser can still take it as a vertical swipe, and scroll. */
let drag: { id: number; x: number; y: number; turning: boolean } | null = null;
const dragging = ref(false);

function startTurn(event: PointerEvent): void {
  if (!turnable.value || !event.isPrimary || event.button !== 0) return;
  if (!frame.value) return;
  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    turning: event.pointerType === "mouse",
  };
  dragging.value = true;
  frame.value.setPointerCapture(event.pointerId);
}

function moveTurn(event: PointerEvent): void {
  if (drag?.id !== event.pointerId) return;
  if (!drag.turning) {
    const [across, down] = [event.clientX - drag.x, event.clientY - drag.y];
    if (Math.hypot(across, down) < TOUCH_SLOP) return;
    // a swipe up or down is the page's: the browser scrolls it
    if (Math.abs(down) > Math.abs(across)) {
      drag = null;
      dragging.value = false;
      return;
    }
    drag = { ...drag, turning: true };
  }
  const width = frame.value?.getBoundingClientRect().width ?? 0;
  if (width > 0) {
    const degrees = DRAG_DEGREES / width;
    turner.value?.turn(
      (event.clientX - drag.x) * degrees,
      (event.clientY - drag.y) * degrees,
    );
    if (props.figure.play) held.value = true;
  }
  drag = { ...drag, x: event.clientX, y: event.clientY };
}

/** The drag ends: the pointer lets go, or the browser takes it (a swipe
 *  that scrolls). */
function endTurn(event: PointerEvent): void {
  if (drag?.id !== event.pointerId) return;
  drag = null;
  dragging.value = false;
}

onMounted(() => {
  observer = new IntersectionObserver(
    // one call can hold more than one change of the frame: the last is now
    (entries) => {
      near.value = entries.at(-1)?.isIntersecting ?? false;
    },
    { rootMargin: "200px" },
  );
  if (frame.value) observer.observe(frame.value);
  // the slide's component loads after the figure mounts, and a callout
  // draws its leader after it mounts; the words' widths wait for the fonts
  if (frame.value) {
    mutations = new MutationObserver(measureSoon);
    mutations.observe(frame.value, { childList: true, subtree: true });
    setTimeout(() => mutations?.disconnect(), LABELS_WAIT_MS);
  }
  measureSoon();
  void document.fonts.ready.then(measureSoon);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  mutations?.disconnect();
  cancelAnimationFrame(measureFrame);
  clearTimeout(timer);
  clearTimeout(runEnd);
});
// at once, before the slide's layers mount and read the time
watch(
  paused,
  (pause) => {
    if (pause) clock.pause(performance.now());
    else clock.play(performance.now());
    trackClock();
  },
  { immediate: true },
);
watch(busyUntil, (end) => {
  clock.runTo(performance.now(), end);
  trackClock();
});
watch([step, near, paused, busyUntil, held, returning], schedule);
watch(turned, endReturn);
// a figure of the whole slide hides its title, and one of a picture keeps
// the title's room: the labels can move when it turns into one
watch(picture, measureSoon);
</script>

<template>
  <figure :id="figure.id" class="article-figure">
    <div class="article-figure-view">
      <div
        ref="frame"
        class="article-figure-frame"
        :style="frameStyle"
        :class="{
          'article-figure-turnable': turnable,
          'article-figure-dragging': dragging,
          'article-figure-turned': turned,
        }"
        :role="figure.alt ? 'img' : undefined"
        :aria-label="figure.alt ?? undefined"
        @pointerdown="startTurn"
        @pointermove="moveTurn"
        @pointerup="endTurn"
        @pointercancel="endTurn"
        @lostpointercapture="endTurn"
      >
        <div
          class="article-figure-slide"
          :class="{ 'article-figure-picture': picture }"
          :style="slideStyle"
        >
          <PrintSlideClick :nav="nav" />
        </div>
      </div>
      <!-- over the picture's corner, where the labels were: they hide
           while the picture is turned -->
      <button
        v-if="turner"
        type="button"
        class="article-button article-reset"
        :class="{ 'article-reset-shown': turned && !returning }"
        @click="resetView"
      >
        Reset view
      </button>
    </div>
    <!-- eslint-disable vue/no-v-html -- the narration, rendered by setup/preparser.ts -->
    <div
      v-if="caption"
      class="article-figure-caption"
      aria-live="polite"
      v-html="caption"
    />
    <!-- eslint-enable vue/no-v-html -->
    <div
      v-if="steps.length > 1 || controls.length > 0 || pausable"
      class="article-figure-controls"
    >
      <template v-if="steps.length > 1">
        <button
          type="button"
          class="article-button"
          :disabled="step === 0"
          aria-label="Previous step"
          @click="go(step - 1)"
        >
          ‹
        </button>
        <span class="article-steps">
          <button
            v-for="(_, index) of steps"
            :key="index"
            type="button"
            class="article-step"
            :class="{ 'article-step-current': index === step }"
            :aria-label="`Step ${String(index + 1)} of ${String(steps.length)}`"
            :aria-current="index === step ? 'step' : undefined"
            @click="go(index)"
          />
        </span>
        <button
          type="button"
          class="article-button"
          :disabled="step === steps.length - 1"
          aria-label="Next step"
          @click="go(step + 1)"
        >
          ›
        </button>
      </template>
      <template v-for="control of controls" :key="control.label">
        <label v-if="control.kind === 'slider'" class="article-slider">
          <span class="article-slider-label">{{ control.label }}</span>
          <span class="article-slider-row">
            <span class="article-slider-end">{{ control.start }}</span>
            <input
              v-model.number="control.value.value"
              type="range"
              min="0"
              max="1"
              step="0.001"
              @change="control.release?.()"
            />
            <span class="article-slider-end">{{ control.end }}</span>
          </span>
        </label>
        <button
          v-else
          type="button"
          class="article-button article-action"
          @click="control.pressed.value = !control.pressed.value"
        >
          <!-- both labels in one cell, as the pause button's words -->
          <span :class="{ 'article-word-hidden': control.pressed.value }">{{
            control.label
          }}</span>
          <span :class="{ 'article-word-hidden': !control.pressed.value }">{{
            control.undo
          }}</span>
        </button>
      </template>
      <button
        v-if="pausable"
        type="button"
        class="article-button article-pause"
        :disabled="pausedByPage"
        @click="pausedByReader = !pausedByReader"
      >
        <!-- both words in one cell: the button is as wide as the wider, so
             nothing beside it moves when it changes. The hidden word is not
             in its accessible name, so the name says what a press does; no
             aria-pressed as well, or a screen reader says "Play, pressed" -->
        <span :class="{ 'article-word-hidden': !paused }">Play</span>
        <span :class="{ 'article-word-hidden': paused }">Pause</span>
      </button>
    </div>
  </figure>
</template>

<style>
.article-figure {
  margin: 2.2em 0;
  clear: right;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* A copy of the page takes the prose, not the figures' words: a label, the
     board's sentence (also where it has faded out), a control's words. So a
     reader can paste the text into a spell checker or quote it. Safari needs
     the prefix. */
  -webkit-user-select: none;
  user-select: none;
}
.article-figure-frame {
  position: relative;
  overflow: hidden;
}
.article-figure-slide {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
}
/* A figure that turns (THE TURN): the wheel and a vertical swipe scroll the
   page; a sideways drag turns the picture. */
.article-figure-turnable {
  touch-action: pan-y;
  cursor: grab;
}
.article-figure-dragging {
  cursor: grabbing;
}
/* While the picture is turned, the slide's own content (the labels and
   their leaders) fades out: it is drawn for the step's view. The canvas is
   in the talk's global layer, outside .slidev-page. */
.article-figure-slide .slidev-page {
  transition: opacity 0.25s ease;
}
.article-figure-turned .slidev-page {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .article-figure-slide .slidev-page {
    transition: none;
  }
}
.article-figure-view {
  position: relative;
}
.article-reset {
  position: absolute;
  right: 0.5em;
  top: 0.5em;
  font-size: 0.8em;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.25s ease,
    visibility 0s 0.25s;
}
.article-reset-shown {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.25s ease;
}
/* the caption is narration */
.article-figure-caption {
  -webkit-user-select: text;
  user-select: text;
}
/* Slidev's print page puts each slide on a page of its own; a figure flows. */
.article-figure-slide .print-slide-container {
  break-after: auto;
}
/* A figure of a picture shows the picture and its labels, not the slide's
   text: the prose says it (figure.ts, "IN A FIGURE OF A PICTURE"). */
.article-figure-picture .slidev-page .slidev-layout {
  visibility: hidden;
}
.article-figure-picture .slidev-page .slidev-layout .in-figure {
  visibility: visible;
}
/* A figure of the whole slide shows its text, but not its title or the
   title's subtitle (the paragraph right after it): the article's heading
   just above says the title, and the subtitle belongs to it. They take no
   room, so the rest of the slide's layout fills the figure. */
.article-figure-slide:not(.article-figure-picture)
  .slidev-page
  .slidev-layout
  :is(h1, h1 + p) {
  display: none;
}
.article-figure-caption {
  max-width: 34em;
  margin-top: 0.6em;
  min-height: 3.2em;
  text-align: center;
  font-size: 0.95em;
}
.article-figure-caption p {
  margin: 0;
}
/* the column's width, not its content's: a slider's length must not change
   with the pause button's word or the slider's end labels */
.article-figure-controls {
  align-self: stretch;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.6em 1em;
  margin-top: 0.6em;
  font-size: 0.85em;
  color: var(--palette-muted);
}
.article-button {
  min-width: 2.2em;
  padding: 0.15em 0.6em;
  border: 1px solid var(--palette-border);
  border-radius: 999px;
  background: var(--palette-panel);
  color: var(--palette-ink);
  font: inherit;
  cursor: pointer;
}
.article-pause,
.article-action {
  display: inline-grid;
}
.article-pause > span,
.article-action > span {
  grid-area: 1 / 1;
}
/* A button that does the figure's one thing, as a slider does: as large as
   a slider's label, and marked in the accent, as a slider's thumb is. */
.article-action {
  padding: 0.3em 1.1em;
  border: 2px solid var(--palette-accent);
  font-size: 1.1em;
}
.article-action:focus-visible {
  outline: 2px solid var(--palette-accent);
  outline-offset: 2px;
}
.article-word-hidden {
  visibility: hidden;
}
.article-button:disabled {
  opacity: 0.45;
  cursor: default;
}
/* Each dot is a 1.5em (25 px) button, so that a finger can hit it: WCAG
   2.5.8's 24 px target. The dot itself is drawn smaller, inside it. */
.article-steps {
  display: inline-flex;
}
.article-step {
  display: inline-grid;
  place-items: center;
  width: 1.5em;
  height: 1.5em;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.article-step::before {
  content: "";
  box-sizing: border-box;
  width: 0.7em;
  height: 0.7em;
  border: 1px solid var(--palette-muted);
  border-radius: 50%;
}
.article-step-current::before {
  background: var(--palette-ink);
  border-color: var(--palette-ink);
}
/* A slider that a reader sees at once, as on Bartosz Ciechanowski's pages:
   what it does, above a long track with a large thumb in the accent, the
   figure's one emphasised thing. */
.article-slider {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.2em;
  flex: 1 1 100%;
  max-width: 36em;
  font-size: 1.1em;
  color: var(--palette-ink);
}
.article-slider-label {
  text-align: center;
}
.article-slider-row {
  display: flex;
  align-items: center;
  gap: 0.8em;
}
.article-slider-end {
  white-space: nowrap;
  color: var(--palette-muted);
}
.article-slider input {
  flex: 1;
  height: 32px;
  margin: 0;
  background: transparent;
  appearance: none;
  cursor: grab;
}
.article-slider input:active {
  cursor: grabbing;
}
.article-slider input::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: var(--palette-border);
}
.article-slider input::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: var(--palette-border);
}
.article-slider input::-webkit-slider-thumb {
  width: 26px;
  height: 26px;
  margin-top: -10px;
  border: 3px solid var(--palette-background);
  border-radius: 50%;
  background: var(--palette-accent);
  box-shadow: 0 0 0 1px var(--palette-accent);
  appearance: none;
}
.article-slider input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border: 3px solid var(--palette-background);
  border-radius: 50%;
  background: var(--palette-accent);
  box-shadow: 0 0 0 1px var(--palette-accent);
}
.article-slider input:focus-visible {
  outline: 2px solid var(--palette-accent);
  outline-offset: 2px;
}
</style>

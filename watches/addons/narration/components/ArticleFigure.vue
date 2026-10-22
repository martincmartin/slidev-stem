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
// page pauses every one. A still figure has no pause button.
//
// THE CROP. A figure of a picture is cropped to the picture's box (the
// talk's), widened to hold the labels: the elements with `in-figure` that
// show at its steps, measured on the page once they are drawn. The figure
// emits its own labels' box, and the page gives back `labels`, the box over
// the figures that share its crop (views/ArticlePage.vue).
import { createFixedClicks } from "@slidev/client/composables/useClicks.ts";
import { useFixedNav } from "@slidev/client/composables/useNav.ts";
import { slideHeight, slideWidth } from "@slidev/client/env.ts";
import PrintSlideClick from "@slidev/client/internals/PrintSlideClick.vue";
import type { SlideRoute } from "@slidev/client";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import { FIGURE } from "../figure.ts";
import type { Box, FigureControl } from "../figure.ts";
import type { FigureBlock } from "../plan.ts";

const props = defineProps<{
  figure: FigureBlock;
  route: SlideRoute;
  /** The clicks of the figure's steps (the figure's own, or the slide's
   *  last for a slide that does not say how many it has). */
  steps: readonly number[];
  /** The crop, in slide px, or `null`: the whole slide, with its text. */
  box: Box | null;
  /** px: the width that the figure may take on the page. */
  width: number;
  /** px: the height that the figure may take (a part of the window). */
  height: number;
  /** "Pause all". */
  pausedByPage: boolean;
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

const step = ref(0);
const clicks = computed(() => props.steps[step.value] ?? 0);
const nav = useFixedNav(props.route, createFixedClicks(props.route, clicks));
const near = ref(false);
const pausedByReader = ref(false);
const paused = computed(() => props.pausedByPage || pausedByReader.value);
const busyUntil = ref(0);
const controls = shallowRef<readonly FigureControl[]>([]);
const still = ref(false);
provide(FIGURE, { clicks, near, paused, busyUntil, controls, still });
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

const crop = computed<Box>(() => {
  const whole = {
    left: 0,
    top: 0,
    right: slideWidth.value,
    bottom: slideHeight.value,
  };
  if (!props.box) return whole;
  const box = props.labels ? union(props.box, props.labels) : props.box;
  return {
    left: Math.max(whole.left, box.left),
    top: Math.max(whole.top, box.top),
    right: Math.min(whole.right, box.right),
    bottom: Math.min(whole.bottom, box.bottom),
  };
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
/** ms: how long the slide is watched for its labels. */
const LABELS_WAIT_MS = 4000;

/** Measure the labels that show at the figure's steps (with one step, those
 *  that its click shows), each with all that it draws (a leader too), in
 *  slide px. A label's own element may be a layer as big as the slide (a
 *  callout is), and an <svg> may draw past its box: their parts say where
 *  they draw. */
function measureLabels(): void {
  const slide = frame.value?.querySelector(".print-slide-container");
  if (!props.box || !slide) return;
  const origin = slide.getBoundingClientRect();
  const ratio = origin.width / slideWidth.value;
  const layer = (rect: DOMRect): boolean =>
    rect.width >= 0.9 * origin.width && rect.height >= 0.9 * origin.height;
  let box: Box | null = null;
  for (const label of slide.querySelectorAll(".slidev-page .in-figure")) {
    if (props.steps.length === 1 && label.closest(".slidev-vclick-hidden")) {
      continue;
    }
    for (const element of [label, ...label.querySelectorAll("*")]) {
      // an <svg>'s box is its viewport (a callout's is 1 px at the slide's
      // corner, with `overflow: visible`): its shapes say where it draws
      if (element instanceof SVGSVGElement) continue;
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

/** A playing figure's next step: after the change at its click ends. */
function schedule(): void {
  clearTimeout(timer);
  if (!props.figure.play || !near.value || paused.value) return;
  const wait = Math.max(0, busyUntil.value - performance.now()) + DWELL_MS;
  timer = setTimeout(() => {
    step.value = (step.value + 1) % props.steps.length;
  }, wait);
}

function go(index: number): void {
  step.value = Math.min(Math.max(index, 0), props.steps.length - 1);
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      near.value = entry?.isIntersecting ?? false;
    },
    { rootMargin: "200px" },
  );
  if (frame.value) observer.observe(frame.value);
  // the slide's component loads after the figure mounts, and a callout
  // draws its leader after it mounts; the words' widths wait for the fonts
  const measureSoon = (): void => {
    cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(measureLabels);
  };
  if (frame.value && props.box) {
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
});
watch([step, near, paused, busyUntil], schedule);
</script>

<template>
  <figure :id="figure.id" class="article-figure">
    <!-- eslint-disable vue/no-v-html -- the narration, rendered by setup/preparser.ts -->
    <div
      ref="frame"
      class="article-figure-frame"
      :style="frameStyle"
      :role="figure.alt ? 'img' : undefined"
      :aria-label="figure.alt ?? undefined"
    >
      <div
        class="article-figure-slide"
        :class="{ 'article-figure-picture': box !== null }"
        :style="slideStyle"
      >
        <PrintSlideClick :nav="nav" />
      </div>
    </div>
    <div
      v-if="caption"
      class="article-figure-caption"
      aria-live="polite"
      v-html="caption"
    />
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
      <label
        v-for="control of controls"
        :key="control.label"
        class="article-slider"
      >
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
        v-if="pausable"
        type="button"
        class="article-button article-pause"
        :aria-pressed="paused"
        :disabled="pausedByPage"
        @click="pausedByReader = !pausedByReader"
      >
        <!-- both words in one cell: the button is as wide as the wider, so
             nothing beside it moves when it changes -->
        <span :class="{ 'article-pause-hidden': !paused }">Play</span>
        <span :class="{ 'article-pause-hidden': paused }">Pause</span>
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
.article-pause {
  display: inline-grid;
}
.article-pause > span {
  grid-area: 1 / 1;
}
.article-pause-hidden {
  visibility: hidden;
}
.article-button:disabled {
  opacity: 0.45;
  cursor: default;
}
.article-steps {
  display: inline-flex;
  gap: 0.45em;
}
.article-step {
  width: 0.7em;
  height: 0.7em;
  padding: 0;
  border: 1px solid var(--palette-muted);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}
.article-step-current {
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

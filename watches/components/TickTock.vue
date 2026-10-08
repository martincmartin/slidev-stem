<script setup lang="ts">
// The words "tick" and "tock", one at each strike of the impulse jewel on the
// fork, in the watch's layer (global-bottom.vue): docs/watch.md, "Tick and
// tock". The slide says whether they show, at each click (`watchTickTock`);
// `shown` is then how they show (`tickTockState` in watch/state.ts) and where
// the jewel strikes, one for each tick window (`jewelStrikes` in
// watch/callouts.ts), or `undefined` if they do not. With `watchTickTock:
// burst`, each word is a comic burst, the 1960s _Batman_ style: a trial, to
// compare with the plain words.
//
// The words follow the model's clock, not a timer: at each animation frame
// this asks the model for the strikes since the last frame, with the moment of
// each. A word starts at that moment: CSS fades it and moves it along its
// strike's `away`, with a negative delay for the part of a frame that has
// passed. A word that has started ends its fade, in its own style, even if
// the words stop or change (a click, another slide): the sound has been made.
//
// Not an oversight: a word appears at once, where all other text fades in
// (docs/slide-patterns.md, "Text fades"). It is a sound.
import { onBeforeUnmount, ref, watch as onChange } from "vue";
import type { Point2 } from "../webgl/mesh.ts";
import type { Strike } from "../watch/callouts.ts";
import type { WatchModel } from "../watch/model.ts";
import type { TickTockState } from "../watch/state.ts";

const props = defineProps<{
  model: WatchModel | undefined;
  shown: (TickTockState & { strikes: readonly [Strike, Strike] }) | undefined;
}>();

/** s: from a strike until its word is gone. */
const WORD_SECONDS = 0.8;
/** px: from the strike to the word's centre, when the word appears: the word
 *  is clear of the fork's horn. A burst is larger, so it starts farther out. */
const WORD_START = 40;
const BURST_START = 72;
/** px: how far the word moves while it fades. */
const WORD_DRIFT = 40;
/** Degrees: a burst's tilt, one way for "tick" and the other for "tock". */
const BURST_TILT = 7;

/** The burst's outline, in a box from -50 to 50 each way: spikes of uneven
 *  length, as a comic artist draws them, between points on an inner ring. */
const SPIKES = [
  1, 0.8, 0.95, 0.74, 1, 0.84, 0.92, 0.78, 1, 0.8, 0.96, 0.75, 0.98, 0.86,
];
const BURST_POINTS = SPIKES.flatMap((spike, index) => {
  const point = (radius: number, step: number): string => {
    const angle = (2 * Math.PI * (index + step)) / SPIKES.length;
    return `${(50 * radius * Math.cos(angle)).toFixed(1)},${(50 * radius * Math.sin(angle)).toFixed(1)}`;
  };
  return [point(spike, 0), point(0.66, 0.5)];
}).join(" ");

interface Word {
  key: number;
  /** "tick", at the upper strike; else "tock". */
  tick: boolean;
  burst: boolean;
  /** Degrees. */
  tilt: number;
  from: Point2;
  to: Point2;
  /** s since the strike, when the word was made. */
  late: number;
}

const words = ref<Word[]>([]);
let nextKey = 0;
/** The last frame's time (ms) and the mechanism's time then. */
let last: { now: number; time: number } | undefined;
let request: number | undefined;

/** The upper strike's window: its word is "tick", in reading order. */
function upperWindow(strikes: readonly [Strike, Strike]): number {
  return strikes[0].at[1] < strikes[1].at[1] ? 0 : 1;
}

function frame(now: number): void {
  request = undefined;
  const { model, shown } = props;
  if (!model || !shown) {
    last = undefined;
    return;
  }
  const found = model.strikes(last, now);
  for (const { at, window } of found.strikes) {
    const strike = shown.strikes[window];
    if (!strike) throw new Error(`no strike for window ${String(window)}`);
    const along = (distance: number): Point2 => [
      strike.at[0] + distance * strike.away[0],
      strike.at[1] + distance * strike.away[1],
    ];
    const tick = window === upperWindow(shown.strikes);
    const start = shown.burst ? BURST_START : WORD_START;
    words.value.push({
      key: nextKey++,
      tick,
      burst: shown.burst,
      tilt: shown.burst ? (tick ? -BURST_TILT : BURST_TILT) : 0,
      from: along(start),
      to: along(start + WORD_DRIFT),
      late: (now - at) / 1000,
    });
  }
  last = { now, time: found.time };
  request = requestAnimationFrame(frame);
}

function remove(key: number): void {
  words.value = words.value.filter((word) => word.key !== key);
}

onChange(
  () => [props.model, props.shown] as const,
  ([model, shown]) => {
    if (model && shown) request ??= requestAnimationFrame(frame);
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  if (request !== undefined) cancelAnimationFrame(request);
  request = undefined;
});

const px = (value: number): string => `${String(value)}px`;
</script>

<template>
  <div
    class="tick-tock"
    :data-style="!shown ? 'off' : shown.burst ? 'burst' : 'plain'"
  >
    <span
      v-for="word in words"
      :key="word.key"
      class="tick-tock-word"
      :class="{
        'tick-tock-burst': word.burst,
        'tick-tock-burst-tick': word.burst && word.tick,
      }"
      :style="{
        '--from-x': px(word.from[0]),
        '--from-y': px(word.from[1]),
        '--to-x': px(word.to[0]),
        '--to-y': px(word.to[1]),
        '--tilt': `${String(word.tilt)}deg`,
        animationDuration: `${String(WORD_SECONDS)}s`,
        animationDelay: `${String(-word.late)}s`,
      }"
      @animationend="remove(word.key)"
    >
      <svg
        v-if="word.burst"
        class="tick-tock-burst-shape"
        viewBox="-50 -50 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          :points="BURST_POINTS"
          :transform="word.tick ? undefined : 'scale(-1 1)'"
        />
      </svg>
      <span class="tick-tock-text">{{
        `${word.tick ? "tick" : "tock"}${word.burst ? "!" : ""}`
      }}</span>
    </span>
  </div>
</template>

<style scoped>
.tick-tock {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
/* lowercase, bold, no quotes: a sound, not a label. The paper's outline keeps
   it legible over the drawing. */
.tick-tock-word {
  position: absolute;
  left: 0;
  top: 0;
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  color: var(--palette-ink);
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
  animation-name: tick-tock-fade, tick-tock-drift;
  animation-timing-function: ease-in, linear;
  animation-fill-mode: both;
}
/* The trial: the 1960s Batman style, in the theme's colours. A burst in the
   second ("TOCK!") or the accent ("TICK!"), outlined in ink; capitals in the
   paper's colour, outlined in ink, with an ink shadow; tilted. */
.tick-tock-burst {
  isolation: isolate;
  padding: 30px 40px;
  font-size: 30px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--palette-background);
  -webkit-text-stroke: 5px var(--palette-ink);
  text-shadow: 3px 3px 0 var(--palette-ink);
}
.tick-tock-text {
  position: relative;
  display: inline-block;
}
.tick-tock-burst-shape {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  z-index: -1;
}
.tick-tock-burst-shape polygon {
  fill: var(--palette-second);
  stroke: var(--palette-ink);
  stroke-width: 3px;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.tick-tock-burst-tick .tick-tock-burst-shape polygon {
  fill: var(--palette-accent);
}
@keyframes tick-tock-fade {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes tick-tock-drift {
  from {
    transform: translate(var(--from-x), var(--from-y)) translate(-50%, -50%)
      rotate(var(--tilt));
  }
  to {
    transform: translate(var(--to-x), var(--to-y)) translate(-50%, -50%)
      rotate(var(--tilt));
  }
}
@media (prefers-reduced-motion: reduce) {
  .tick-tock-word {
    animation-name: tick-tock-fade;
    transform: translate(var(--from-x), var(--from-y)) translate(-50%, -50%)
      rotate(var(--tilt));
  }
}
</style>

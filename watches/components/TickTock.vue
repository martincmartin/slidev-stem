<script setup lang="ts">
// The words "tick" and "tock", one at each strike of the impulse jewel on the
// fork, in the watch's layer (global-bottom.vue): docs/watch.md, "Tick and
// tock". The slide says whether they show, at each click (`watchTickTock`);
// `shown` is then where the jewel strikes, one for each tick window
// (`jewelStrikes` in watch/callouts.ts), or `undefined` if they do not.
//
// The words follow the model's clock, not a timer: at each animation frame
// this asks the model for the strikes since the last frame, with the moment of
// each. A word starts at that moment: CSS fades it and moves it along its
// strike's `away`, with a negative delay for the part of a frame that has
// passed. In a figure, `now` gives the figure's time, which stands while the
// figure is paused; without it, the frame's time. A word that has started ends its fade, in its own style, even if
// the words stop (a click, another slide): the sound has been made.
//
// Not an oversight: a word appears at once, where all other text fades in
// (docs/slide-patterns.md, "Text fades"). It is a sound.
import { onBeforeUnmount, ref, watch as onChange } from "vue";
import type { Point2 } from "../webgl/mesh.ts";
import type { Strike } from "../watch/callouts.ts";
import type { WatchModel } from "../watch/model.ts";

const props = defineProps<{
  model: WatchModel | undefined;
  shown: { strikes: readonly [Strike, Strike] } | undefined;
  /** The time (ms); the frame's without it. */
  now?: (() => number) | undefined;
}>();

/** s: from a strike until its word is gone. */
const WORD_SECONDS = 0.8;
/** px: from the strike to the word's centre, when the word appears: the word
 *  is clear of the fork's horn. */
const WORD_START = 40;
/** px: how far the word moves while it fades. */
const WORD_DRIFT = 40;

interface Word {
  key: number;
  /** "tick", at the upper strike; else "tock". */
  tick: boolean;
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

function frame(stamp: number): void {
  request = undefined;
  const { model, shown } = props;
  const now = props.now?.() ?? stamp;
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
    words.value.push({
      key: nextKey++,
      tick: window === upperWindow(shown.strikes),
      from: along(WORD_START),
      to: along(WORD_START + WORD_DRIFT),
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
  <div class="tick-tock" :data-shown="String(shown !== undefined)">
    <span
      v-for="word in words"
      :key="word.key"
      class="tick-tock-word"
      :style="{
        '--from-x': px(word.from[0]),
        '--from-y': px(word.from[1]),
        '--to-x': px(word.to[0]),
        '--to-y': px(word.to[1]),
        animationDuration: `${String(WORD_SECONDS)}s`,
        animationDelay: `${String(-word.late)}s`,
      }"
      @animationend="remove(word.key)"
      >{{ word.tick ? "tick" : "tock" }}</span
    >
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
    transform: translate(var(--from-x), var(--from-y)) translate(-50%, -50%);
  }
  to {
    transform: translate(var(--to-x), var(--to-y)) translate(-50%, -50%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .tick-tock-word {
    animation-name: tick-tock-fade;
    transform: translate(var(--from-x), var(--from-y)) translate(-50%, -50%);
  }
}
</style>

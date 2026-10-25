<script setup lang="ts">
// The time scale: the words "time scale", and under them the time-lapse's
// speed-up (`watchLapse`, and see watch/lapse.ts), as "1440×", in the slide's
// lower right corner: docs/watch.md, "The Recap slide". The slide says whether
// it shows, at each click (`watchTimeScale`); `shown` is then the click's
// speed-up, or `undefined` if it does not.
//
// With a model (the watch's layer, global-bottom.vue), the number is the
// model's speed-up at each animation frame, to the nearest whole number: while
// it eases from one click's to the next, the number goes through the speed-ups
// between. Without one (a printed page, slide-bottom.vue), it is the click's.
// In a figure, `now` gives the figure's time, which stands while the figure is
// paused; without it, the frame's time.
//
// Not an oversight: the number changes at once, where all other text fades
// (docs/slide-patterns.md, "Text fades"). It is a gauge, and the user chose
// it. The time scale itself fades in and out.
//
// For watch/slide-state.ts: `data-speed-up` is the number shown, and
// `data-busy` is true until it is the click's.
import { onBeforeUnmount, ref, watch as onChange } from "vue";
import type { WatchModel } from "../watch/model.ts";

const props = defineProps<{
  model: WatchModel | undefined;
  shown: number | undefined;
  /** The time (ms); the frame's without it. */
  now?: (() => number) | undefined;
}>();

const speedUp = ref(props.shown ?? 1);
let request: number | undefined;

function frame(stamp: number): void {
  request = undefined;
  const { model, shown } = props;
  if (!model || shown === undefined) return;
  speedUp.value = Math.round(model.speedUp(props.now?.() ?? stamp));
  request = requestAnimationFrame(frame);
}

onChange(
  () => [props.model, props.shown] as const,
  ([model, shown]) => {
    if (shown === undefined) return;
    if (model) request ??= requestAnimationFrame(frame);
    else speedUp.value = shown;
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  if (request !== undefined) cancelAnimationFrame(request);
  request = undefined;
});
</script>

<template>
  <Transition name="time-scale">
    <div
      v-if="shown !== undefined"
      class="time-scale"
      :data-speed-up="speedUp"
      :data-busy="String(speedUp !== shown)"
    >
      <div class="time-scale-label">time scale</div>
      <div class="time-scale-value">{{ speedUp }}×</div>
    </div>
  </Transition>
</template>

<style scoped>
/* The words are muted: they name the number, which is in ink. The paper's
   outline keeps both legible where the movement runs under them. */
.time-scale {
  position: absolute;
  right: 28px;
  bottom: 20px;
  text-align: right;
  line-height: 1.1;
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
  pointer-events: none;
}
.time-scale-label {
  font-size: 17px;
  color: var(--palette-muted);
}
.time-scale-value {
  font-size: 22px;
  font-variant-numeric: tabular-nums;
  color: var(--palette-ink);
}
.time-scale-leave-active {
  transition: opacity var(--text-fade) ease-in;
}
.time-scale-enter-active {
  transition: opacity var(--text-fade) ease-out var(--text-fade);
}
.time-scale-leave-to,
.time-scale-enter-from {
  opacity: 0;
}
</style>

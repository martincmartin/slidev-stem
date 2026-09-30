<script setup lang="ts">
// The ruler of public/flexing-ruler.svg, for a slide. The SVG is a SMIL
// animation with one timeline (art/flexing_ruler.py writes it). This component
// owns the clock: the file is inlined, its animations are paused, and the
// timeline is set by hand. `visible` fades the ruler in, face-on and still.
// The timeline runs from 0 only while the slide is the one on screen and
// `playing` is true; otherwise the ruler is face-on and still. Slidev keeps a
// left slide mounted, and gives it its last click when a later slide is
// shown, so `playing` alone does not say the slide is being watched: the
// slide's `$isActive` (from useSlideContext) does. Each entry into the playing
// state starts again from 0, and going back a click is exact.
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

const props = defineProps<{ visible: boolean; playing: boolean }>();

const { $renderContext, $page } = useSlideContext();
const LIVE = ["slide", "presenter"];
const { currentSlideNo } = useNav();
const running = computed(
  () =>
    props.playing &&
    currentSlideNo.value === $page.value &&
    LIVE.includes($renderContext.value),
);

const host = useTemplateRef<HTMLDivElement>("host");
const markup = ref("");
let frame = 0;
let startedAt = 0;

function svg(): SVGSVGElement | null {
  return host.value?.querySelector("svg") ?? null;
}

function run(now: number): void {
  svg()?.setCurrentTime((now - startedAt) / 1000);
  frame = requestAnimationFrame(run);
}

function stop(): void {
  cancelAnimationFrame(frame);
  frame = 0;
}

function apply(): void {
  stop();
  const ruler = svg();
  if (!ruler) return;
  ruler.pauseAnimations();
  ruler.setCurrentTime(0);
  if (running.value) {
    startedAt = performance.now();
    frame = requestAnimationFrame(run);
  }
}

onMounted(async () => {
  const response = await fetch("/flexing-ruler.svg");
  if (!response.ok)
    throw new Error(`flexing-ruler.svg: ${String(response.status)}`);
  markup.value = await response.text();
  await nextTick(); // v-html puts the SVG in the page
  requestAnimationFrame(apply);
});
watch(running, apply);
onBeforeUnmount(stop);
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- our own file, public/flexing-ruler.svg -->
  <div
    ref="host"
    class="flexing-ruler"
    :class="{ 'flexing-ruler-on': visible }"
    aria-hidden="true"
    v-html="markup"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<style>
.flexing-ruler {
  position: absolute;
  /* the ruler's centre is at the hairspring's: y 276; the drawing is 600 x 400
     with the ruler's axis 176 px from its top, and it ends at the slide's edge */
  left: 380px;
  top: 100px;
  width: 600px;
  height: 400px;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}
.flexing-ruler-on {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .flexing-ruler {
    transition: none;
  }
}
</style>

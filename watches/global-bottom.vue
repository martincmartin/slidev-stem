<script setup lang="ts">
// One live watch under every slide, for the whole talk, drawn with WebGL by the
// stage of webgl/stage.ts. Each slide names a view in its frontmatter
// (`watch: hairspring`, `watchTilt: 45`, and see watch/state.ts); a slide
// without one hides the layer. A click can change the state (`watchSettle`).
// Print mode (export) has no live layer: slide-bottom.vue draws a still on each
// page. Print mode comes from the page's nav: each printed page gets a fixed
// nav of its own, which does not know it. The class slidev-layout gives the
// layer the theme's palette variables and page colour.
import { useNav } from "@slidev/client";
import { injectionSlidevContext } from "@slidev/client/constants.ts";
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  useTemplateRef,
  watch as onChange,
} from "vue";
import { MOVE_SECONDS, Stage } from "./webgl/stage.ts";
import { WatchModel } from "./watch/model.ts";
import type { WatchModelState } from "./watch/model.ts";
import { WATCH, watchStills } from "./watch/instance.ts";
import { themePalette } from "./watch/palette.ts";
import { modelState, stageState, watchState } from "./watch/state.ts";

declare global {
  interface Window {
    /** For the measurement scripts. */
    watchStage?: Stage<WatchModelState>;
  }
}

const slidev = inject(injectionSlidevContext);
if (!slidev) throw new Error("no Slidev context");
const live = !useNav().isPrintMode.value;
const frontmatter = computed(
  () => slidev.nav.currentSlideRoute.meta.slide?.frontmatter ?? {},
);
const state = computed(() => watchState(frontmatter.value, slidev.nav.clicks));
const name = computed(() => state.value?.view);
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
let stage: Stage<WatchModelState> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let unmounted = false;

onMounted(() => {
  if (!live || !canvas.value) return;
  stage = new Stage(
    canvas.value,
    WATCH.scene,
    themePalette(),
    new WatchModel(WATCH),
  );
  window.watchStage = stage;
  onChange(
    () => JSON.stringify(state.value ?? null),
    (_value, old) => {
      clearTimeout(hideTimer);
      const now = state.value;
      if (!now) {
        hideTimer = setTimeout(() => stage?.stop(), 400); // after the layer's fade
        return;
      }
      // a slide reached from a slide without the watch starts at its state
      const flashSeconds =
        stage?.show(
          stageState(WATCH.scene, now),
          modelState(now),
          old === undefined || old === "null",
        ) ?? 0;
      // the new slide's text comes in after the flash and the move
      document.documentElement.style.setProperty(
        "--watch-text-delay",
        `${String(flashSeconds + MOVE_SECONDS)}s`,
      );
      stage?.start();
    },
    { immediate: true },
  );
});
onBeforeUnmount(() => {
  unmounted = true;
  clearTimeout(hideTimer);
  stage?.dispose();
  stage = undefined;
  delete window.watchStage;
});

// The presenter view draws the next slide's still in its "next" pane. Draw
// them all once, while the page is idle after it loads, so that a slide
// change finds its still ready (?stills=lazy turns this off, to compare).
onMounted(() => {
  const lazy = new URLSearchParams(location.search).get("stills") === "lazy";
  if (!live || lazy || !location.pathname.startsWith("/presenter")) return;
  const ratio = window.devicePixelRatio || 1;
  const size: [number, number] = [
    Math.round(WATCH.scene.slide[0] * ratio),
    Math.round(WATCH.scene.slide[1] * ratio),
  ];
  const pending = useNav()
    .slides.value.map((route) =>
      watchState(route.meta.slide?.frontmatter ?? {}, 0),
    )
    .filter((slide) => slide !== undefined);
  const next = (): void => {
    const slide = pending.shift();
    if (!slide || unmounted) return;
    void watchStills().of(slide, size);
    requestIdleCallback(next);
  };
  setTimeout(() => {
    requestIdleCallback(next);
  }, 1000);
});
</script>

<template>
  <div
    v-if="live"
    class="slidev-layout watch-layer"
    :class="{ 'watch-off': !name }"
  >
    <canvas ref="canvas" class="watch-canvas" />
  </div>
</template>

<style>
.watch-layer {
  position: absolute;
  inset: 0;
  padding: 0;
  transition: opacity 0.3s;
}
.watch-layer.watch-off {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.3s,
    visibility 0s 0.3s;
}
.watch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
/* see-through, and positioned, so it paints above a still (which is positioned) */
.watch-marker ~ .slidev-layout {
  background: transparent;
  position: relative;
}
.watch-still {
  position: absolute;
  inset: 0;
}
.watch-still img {
  width: 100%;
  height: 100%;
  display: block;
}
/* `transition: watch-zoom`: the old slide's text fades while the watch
   flashes or the camera starts its move; the new slide's text comes in after
   the move. The script sets --watch-text-delay from the stage's times. */
.watch-zoom-leave-active {
  transition: opacity 0.9s ease-in;
}
.watch-zoom-enter-active {
  transition: opacity 0.5s ease-out var(--watch-text-delay);
}
.watch-zoom-leave-to,
.watch-zoom-enter-from {
  opacity: 0;
}
</style>

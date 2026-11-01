<script setup lang="ts">
// The story maps over the globe (docs/globe.md, "The story maps"): an SVG
// above the canvas, with each map's sea and land in slide px. Each map rides
// the camera on its plane, and shows only near its own view
// (`mapOnSlide`): so a slide shows a map by naming its view, with no key of
// its own. The live layer (global-bottom.vue) and an article's figure
// (components/FigureLayer.vue) give their stage's frames, and the maps move
// after each frame, in the same animation frame; a still (slide-bottom.vue)
// gives its pose. `draw` sets the attributes itself, not through Vue: it
// runs at each frame.
import {
  onBeforeUnmount,
  onMounted,
  useTemplateRef,
  watch as onChange,
} from "vue";
import { mapOnSlide } from "../globe/maps.ts";
import type { CameraPose } from "../webgl/scene.ts";
import type { FrameListener } from "../webgl/stage.ts";
import { ART, GLOBE } from "../watch/instance.ts";

const props = defineProps<{
  /** A still's pose. */
  pose?: CameraPose | undefined;
  /** A stage's `onFrame`: the maps move after each of its frames. */
  frames?: ((listener: FrameListener) => () => void) | undefined;
}>();

const [width, height] = ART.scene.slide;
const groups = useTemplateRef<SVGGElement[]>("groups");

/** Place each map for a frame drawn at `pose`. */
function draw(pose: CameraPose): void {
  GLOBE.maps.forEach((placed, index) => {
    const group = groups.value?.[index];
    if (!group) return;
    const { matrix, opacity } = mapOnSlide(placed, pose, ART.scene.slide);
    group.setAttribute("opacity", String(opacity));
    group.setAttribute("visibility", opacity > 0 ? "visible" : "hidden");
    if (opacity > 0)
      group.setAttribute("transform", `matrix(${matrix.join(" ")})`);
  });
}

let leave: (() => void) | undefined;

onMounted(() => {
  onChange(
    () => props.pose,
    (pose) => {
      if (pose) draw(pose);
    },
    { immediate: true },
  );
  onChange(
    () => props.frames,
    (frames) => {
      leave?.();
      leave = frames?.(draw);
    },
    { immediate: true },
  );
});
onBeforeUnmount(() => leave?.());
</script>

<template>
  <svg
    class="story-maps"
    :viewBox="`0 0 ${width} ${height}`"
    aria-hidden="true"
  >
    <g
      v-for="placed in GLOBE.maps"
      ref="groups"
      :key="placed.map.name"
      opacity="0"
      visibility="hidden"
    >
      <rect class="story-sea" :width="width" :height="height" />
      <path class="story-land" :d="placed.land.land" />
    </g>
  </svg>
</template>

<style>
/* The sea in the water's wash, the land in the paper, and the coast in the
   subject, 3 px at every zoom, as the globe's (docs/globe.md). */
.story-maps {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.story-sea {
  fill: var(--palette-water-wash);
}
.story-land {
  fill: var(--palette-background);
  fill-rule: evenodd;
  stroke: var(--palette-subject);
  stroke-width: 3;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
</style>

<script setup lang="ts">
// Under each slide that shows the watch, a marker, so one sibling rule can make
// the slide see-through. Where the slide is not the live one (print and export,
// the overview, the presenter's "next" pane), a still of its view, from one
// renderer shared by the page. `data-waitfor` makes `slidev export` wait until
// the still is drawn. A printed page's render context is "slide", so print mode
// comes from the page's nav.
import { useNav, useSlideContext } from "@slidev/client";
import { computed, onMounted, ref } from "vue";
import { WATCH, watchStills } from "./watch/instance.ts";
import { watchState } from "./watch/state.ts";

const { $frontmatter, $renderContext } = useSlideContext();
const LIVE = ["slide", "presenter"];
const { isPrintMode } = useNav();
const state = computed(() => watchState($frontmatter, 0));
const needsStill = computed(
  () =>
    state.value !== undefined &&
    (isPrintMode.value || !LIVE.includes($renderContext.value)),
);
const source = ref<string>();

onMounted(async () => {
  if (!needsStill.value || !state.value) return;
  const ratio = window.devicePixelRatio || 1;
  const [width, height] = WATCH.scene.slide;
  source.value = await watchStills().of(state.value, [
    Math.round(width * ratio),
    Math.round(height * ratio),
  ]);
});
</script>

<template>
  <i v-if="state" class="watch-marker" aria-hidden="true" />
  <div v-if="needsStill" class="watch-still" data-waitfor=".watch-still-image">
    <img v-if="source" class="watch-still-image" :src="source" alt="" />
  </div>
</template>

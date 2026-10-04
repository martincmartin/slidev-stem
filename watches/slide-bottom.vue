<script setup lang="ts">
// Under each slide that shows the watch or the diving board, a marker, so one
// sibling rule can make the slide see-through. Where the slide is not the live one (print and export,
// the overview, the presenter's "next" pane), a still of its view, from one
// renderer shared by the page. The still shows the slide's state at the click
// of this page (`$clicks`): an export has one page for each click. The global
// nav is not that click: a printed page gets a fixed nav of its own. `data-waitfor`
// makes `slidev export` wait until the still is drawn. A printed page's render
// context is "slide", so print mode comes from the page's nav. `data-watch` is
// the state that the still shows, for art/print_check.py. The diving board is
// posed the same way, at its pose for this page's click (components/
// DivingBoard.vue with `live` false); the live board is in global-bottom.vue.
import { useNav, useSlideContext } from "@slidev/client";
import { computed, ref, watch as onChange } from "vue";
import DivingBoard from "./components/DivingBoard.vue";
import { boardState } from "./watch/board.ts";
import { WATCH, watchStills } from "./watch/instance.ts";
import { watchState } from "./watch/state.ts";

const { $frontmatter, $renderContext, $clicks } = useSlideContext();
const LIVE = ["slide", "presenter"];
const { isPrintMode } = useNav();
const state = computed(() => watchState($frontmatter, $clicks.value));
const notLive = computed(
  () => isPrintMode.value || !LIVE.includes($renderContext.value),
);
const needsStill = computed(() => state.value !== undefined && notLive.value);
const posed = computed(() => boardState($frontmatter, $clicks.value));
const board = computed(() =>
  notLive.value && posed.value
    ? { state: posed.value, atOnce: true }
    : undefined,
);
const source = ref<string>();

onChange(
  () => (needsStill.value ? state.value : undefined),
  async (shown) => {
    if (!shown) return;
    const ratio = window.devicePixelRatio || 1;
    const [width, height] = WATCH.scene.slide;
    const picture = await watchStills().of(shown, [
      Math.round(width * ratio),
      Math.round(height * ratio),
    ]);
    if (state.value === shown) source.value = picture; // not a click that has passed
  },
  { immediate: true },
);
</script>

<template>
  <!-- the live board is in the watch's layer too: the slide must show it -->
  <i v-if="state || posed" class="watch-marker" aria-hidden="true" />
  <div
    v-if="needsStill"
    class="watch-still"
    :data-watch="JSON.stringify(state)"
    data-waitfor=".watch-still-image"
  >
    <img v-if="source" class="watch-still-image" :src="source" alt="" />
  </div>
  <DivingBoard v-if="board" :target="board" :live="false" />
</template>

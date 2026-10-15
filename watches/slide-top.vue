<script setup lang="ts">
// Over each slide that has a `history` line in its frontmatter (when its
// subject became practical), the line, in ink, in the slide's lower left
// corner: docs/slide-patterns.md, "The history line". The speaker does not
// say it. The article shows it under the slide's heading instead,
// so a figure hides it (style.css). This layer is outside the slide's
// `.slidev-layout`, so it takes the slide's palette as slide-bottom.vue does.
import { useSlideContext } from "@slidev/client";
import { computed } from "vue";
import { historyOf } from "./addons/narration/history.ts";
import { slidePalette } from "./watch/palette.ts";

const { $frontmatter } = useSlideContext();
const history = computed(() => historyOf($frontmatter));
const palette = computed(() =>
  history.value === null ? undefined : slidePalette($frontmatter["class"]),
);
</script>

<template>
  <p v-if="history !== null" class="slide-history" :style="palette?.variables">
    {{ history }}
  </p>
</template>

<style scoped>
/* In ink, at the subtitle's 22 px (../docs/legibility.md): the speaker does
   not say it, so it must be easy to see. The paper's outline keeps it
   legible where the watch runs under it, as the time scale's. */
.slide-history {
  position: absolute;
  left: 28px;
  bottom: 20px;
  margin: 0;
  font-size: 22px;
  line-height: 1.1;
  color: var(--palette-ink);
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
  pointer-events: none;
}
</style>

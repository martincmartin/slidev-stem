<script setup lang="ts">
// One timekeeper card. Purely presentational: the slide decides when it
// appears and dims (v-click and the slide's CSS).
//
// The diagram is inlined, not an <img>: an <img> is a separate document that
// no page CSS reaches, so its colours would stay the reference palette's
// (its fallbacks). Inlined, its
// `var(--palette-*)` classes take the slide's theme and class
// (stem/docs/illustrations.md, "The page's theme paints the drawing").
import { onMounted, ref, useId } from "vue";

const props = defineProps<{
  name: string;
  date: string;
  img: string; // SVG diagram
  stat: string;
  unit: string;
  problem: string;
  unknown?: boolean; // no reliable accuracy data: stat drawn in muted grey
}>();

const markup = ref("");
// Each copy of a slide (the overview, print, the presenter's panes) inlines
// the SVG again, so each copy's ids get a suffix of their own: otherwise
// every copy's clip paths would resolve to the first copy's.
const suffix = useId();

onMounted(async () => {
  const response = await fetch(props.img);
  if (!response.ok) throw new Error(`${props.img}: ${String(response.status)}`);
  const source = await response.text();
  const ids = [...source.matchAll(/id="([^"]+)"/g)].map(([, id]) => id ?? "");
  markup.value = ids.reduce(
    (text, id) =>
      text
        .replaceAll(`id="${id}"`, `id="${id}-${suffix}"`)
        .replaceAll(`url(#${id})`, `url(#${id}-${suffix})`),
    source,
  );
});
</script>

<template>
  <div class="tk-card">
    <div class="tk-art">
      <!-- eslint-disable vue/no-v-html -- our own file, in public/timekeepers/ -->
      <div
        class="tk-diagram"
        role="img"
        :aria-label="`${name} diagram`"
        v-html="markup"
      />
      <!-- eslint-enable vue/no-v-html -->
      <span class="tk-date">{{ date }}</span>
    </div>
    <div class="tk-text">
      <div class="tk-name">{{ name }}</div>
      <div class="tk-stat" :class="{ 'tk-unknown': unknown }">{{ stat }}</div>
      <div class="tk-unit">{{ unit }}</div>
      <div class="tk-problem">{{ problem }}</div>
    </div>
  </div>
</template>

<style scoped>
/* Sizes are for Slidev's default 980×552 canvas (half the 1920-wide design).
   Colors come from the --palette-* variables and fonts from the house theme
   (themes/house/). */
.tk-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: var(--palette-panel);
  border: 1px solid var(--palette-border);
  border-radius: 12px;
}

/* No image size here: the image is shown at the width and height its SVG
   states, which is the size the checks in stem/tools/ measure. */
.tk-art {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.tk-date {
  font-size: 17px;
  color: var(--palette-muted);
}

.tk-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.tk-name {
  @apply font-serif;
  font-weight: 600;
  font-size: 29px;
  line-height: 1.05;
  color: var(--palette-ink);
}
.tk-stat {
  @apply font-mono;
  font-weight: 600;
  font-size: 37px;
  line-height: 1;
  color: var(--palette-accent);
}
.tk-unknown {
  color: var(--palette-muted);
}
.tk-unit {
  font-size: 17px;
  line-height: 1.2;
  color: var(--palette-muted);
}
.tk-problem {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.15;
  color: var(--palette-second);
}
</style>

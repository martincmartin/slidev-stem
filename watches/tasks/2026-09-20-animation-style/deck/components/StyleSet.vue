<script setup lang="ts">
// One comparison slide's worth of a drawing set: the four timekeepers drawn
// large, and again at the 122px width the real deck actually uses.
//
// Both rows are the point. The decision is about what survives at 122px on a
// projector, not about what looks best at 200px on a laptop — and the two
// answers are not the same set.
defineProps<{
  n: number; // set number, 1-5
  title: string; // style name
  dir: string; // folder under /public/timekeepers
  weight: string; // total bytes for the four files
  note: string; // what this set buys, and what it gives up
}>();

const ITEMS = [
  { file: "sundial", label: "Sundial" },
  { file: "water-clock", label: "Water clock" },
  { file: "candle", label: "Candle" },
  { file: "hourglass", label: "Hourglass" },
];
</script>

<template>
  <div class="ss">
    <div class="ss-head">
      <span class="ss-n">Set {{ n }}</span>
      <span class="ss-title">{{ title }}</span>
      <span class="ss-weight">{{ weight }}</span>
    </div>

    <div class="ss-big">
      <figure v-for="it in ITEMS" :key="it.file">
        <img :src="`/timekeepers/${dir}/${it.file}.svg`" :alt="it.label" />
        <figcaption>{{ it.label }}</figcaption>
      </figure>
    </div>

    <div class="ss-rule">
      <span>as the deck really shows them — 122 px</span>
    </div>

    <div class="ss-small">
      <img
        v-for="it in ITEMS"
        :key="it.file"
        :src="`/timekeepers/${dir}/${it.file}.svg`"
        :alt="it.label"
      />
    </div>

    <div class="ss-note">{{ note }}</div>
  </div>
</template>

<style scoped>
.ss {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ss-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.ss-n {
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 19px;
  font-weight: 600;
  color: var(--tk-accent, #1f5fa8);
}
.ss-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 34px;
  line-height: 1.05;
  color: var(--tk-ink, #2a2520);
}
.ss-weight {
  margin-left: auto;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 17px;
  color: var(--tk-muted, #736a60);
}

.ss-big {
  display: flex;
  gap: 22px;
}
.ss-big figure {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.ss-big img {
  width: 200px;
  height: 158px;
  display: block;
}
.ss-big figcaption {
  font-size: 15px;
  color: var(--tk-muted, #736a60);
}

/* A labelled hairline, so the size change below is read as deliberate. */
.ss-rule {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--tk-muted, #736a60);
}
.ss-rule::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--tk-border, #e0d9ca);
}

.ss-small {
  display: flex;
  gap: 22px;
  align-items: flex-start;
}
.ss-small img {
  width: 122px;
  height: 97px;
  display: block;
}

.ss-note {
  font-size: 18px;
  line-height: 1.3;
  color: var(--tk-ink, #2a2520);
  max-width: 860px;
}
</style>

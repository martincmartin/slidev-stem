<script setup lang="ts">
// One timekeeper card. Purely presentational: the slide decides when it
// appears (v-click) and when it is dimmed (the `dim` prop).
defineProps<{
  name: string;
  date: string;
  img: string; // SVG diagram, or the poster frame when `video` is set
  video?: string; // optional looping time-lapse clip (mp4/webm in /public)
  stat: string;
  unit: string;
  problem: string;
  unknown?: boolean; // no reliable accuracy data: stat drawn in muted grey
  dim?: boolean; // de-emphasize while another card is being discussed
}>();
</script>

<template>
  <div class="tk-card" :class="{ 'tk-dim': dim }">
    <div class="tk-art">
      <video
        v-if="video"
        :src="video"
        :poster="img"
        autoplay
        loop
        muted
        playsinline
      />
      <img v-else :src="img" :alt="`${name} diagram`" />
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
   Colors come from --tk-* variables set by the slide; the fallbacks are the
   original dark theme, so the card still works on a slide that sets nothing. */
.tk-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: var(--tk-panel, #1f222a);
  border: 1px solid var(--tk-border, #2e333d);
  border-radius: 12px;
  transition: opacity 0.35s ease;
}
.tk-dim {
  opacity: 0.35;
}

.tk-art {
  flex: none;
  width: 122px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.tk-art img,
.tk-art video {
  width: 122px;
  height: 97px;
  object-fit: contain;
  border-radius: 6px;
}
/* The SVG diagrams are drawn to fit this box; a photographed clip is not, so
   it fills the box and crops instead of sitting letterboxed inside it. */
.tk-art video {
  object-fit: cover;
}
.tk-date {
  font-size: 17px;
  color: var(--tk-muted, #a39c8e);
}

.tk-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.tk-name {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 29px;
  line-height: 1.05;
  color: var(--tk-ink, #f0e9dc);
}
.tk-stat {
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-weight: 600;
  font-size: 37px;
  line-height: 1;
  color: var(--tk-accent, #e0b25a);
}
.tk-unknown {
  color: var(--tk-muted, #a39c8e);
}
.tk-unit {
  font-size: 17px;
  line-height: 1.2;
  color: var(--tk-muted, #a39c8e);
}
.tk-problem {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.15;
  color: var(--tk-warn, #ec8a6b);
}

@media (prefers-reduced-motion: reduce) {
  .tk-card {
    transition: none;
  }
}
</style>

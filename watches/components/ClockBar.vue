<script setup lang="ts">
// One clock on a timeline: its photo, and a bar from the year it began to the year
// it was done. The slide sets --first-year and --px-a-year on a parent, so that the
// bars and its axis share one scale. Words under the bar go in the slot. The clocks
// must be siblings: the newest shown has the accent, and those before it are grey and dim.
const props = defineProps<{
  picture: string;
  alt: string;
  from: number;
  to: number;
}>();

const source = `${import.meta.env.BASE_URL}${props.picture}`;
</script>

<template>
  <div class="clock-bar" :style="{ '--from': from, '--to': to }">
    <img class="clock-photo" :src="source" :alt="alt" />
    <div class="clock-track">
      <div class="clock-span"></div>
      <div class="clock-words text-dims"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.clock-bar {
  display: flex;
  align-items: flex-start;
  gap: var(--clock-photo-gap);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}
.clock-photo {
  flex: none;
  width: var(--clock-photo-size);
  height: var(--clock-photo-size);
  object-fit: cover;
  border-radius: 4px;
}
.clock-track {
  margin-left: calc((var(--from) - var(--first-year)) * var(--px-a-year));
}
.clock-span {
  width: calc((var(--to) - var(--from)) * var(--px-a-year));
  height: 30px;
  background: var(--palette-accent);
  border-radius: 4px;
  transition: background-color var(--text-fade);
}
.clock-bar:has(~ .clock-bar:not(.slidev-vclick-hidden)) .clock-span {
  background: var(--palette-muted);
}
.clock-bar:has(~ .clock-bar:not(.slidev-vclick-hidden)) .clock-words {
  --text-dim: var(--text-dimmed);
}
</style>

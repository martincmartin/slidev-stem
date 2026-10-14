<script setup lang="ts">
import { sideClass } from "../utils/side";

// A part's title, with an optional `eyebrow` above it (`PART 1`), and `side`
// as on the cover (utils/side.ts).
const props = defineProps<{ eyebrow?: string; side?: string }>();
const placement = sideClass(props.side);
</script>

<template>
  <div class="slidev-layout section" :class="placement">
    <div>
      <div v-if="eyebrow" class="section-eyebrow">{{ eyebrow }}</div>
      <slot />
    </div>
  </div>
</template>

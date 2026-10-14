<script setup lang="ts">
import { sideClass } from "../utils/side";

// Slidev's cover, with `side` (utils/side.ts): centred by default, or
// `side: left` beside an illustration.
const props = defineProps<{ side?: string }>();
const placement = sideClass(props.side);
</script>

<template>
  <div class="slidev-layout cover" :class="placement">
    <slot />
  </div>
</template>

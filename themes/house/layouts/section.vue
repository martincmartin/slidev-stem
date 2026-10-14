<script setup lang="ts">
defineProps<{ eyebrow?: string }>();
</script>

<template>
  <div class="slidev-layout section cover-left">
    <div>
      <div v-if="eyebrow" class="section-eyebrow">{{ eyebrow }}</div>
      <slot />
    </div>
  </div>
</template>

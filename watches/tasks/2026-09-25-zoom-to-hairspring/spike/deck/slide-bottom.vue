<script setup lang="ts">
// Spike: a marker before the layout of each slide that shows the watch, so
// one sibling rule can make that slide see-through.
import { useSlideContext } from '@slidev/client'

const { $frontmatter } = useSlideContext()
</script>

<template>
  <i v-if="$frontmatter.watch" class="watch-marker" aria-hidden="true" />
</template>

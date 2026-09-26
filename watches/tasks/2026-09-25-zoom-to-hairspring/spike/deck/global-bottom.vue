<script setup lang="ts">
// Spike: one watch under every slide, for the whole talk. The class
// slidev-layout gives it the theme's palette variables and page colour.
import { injectionSlidevContext } from '@slidev/client/constants.ts'
import { computed, inject, useTemplateRef, watchEffect } from 'vue'
import source from './watch/skeleton-watch.svg?raw'

const slidev = inject(injectionSlidevContext)!
const view = computed(
  () => slidev.nav.currentSlideRoute.meta?.slide?.frontmatter?.watch as string | undefined,
)
const holder = useTemplateRef<HTMLElement>('holder')
watchEffect(() => {
  const svg = holder.value?.querySelector('svg')
  if (!svg) return
  if (view.value && view.value !== 'cover') svg.setAttribute('data-view', view.value)
  else svg.removeAttribute('data-view')
})
</script>

<template>
  <div class="slidev-layout watch-layer" :class="{ 'watch-off': !view }">
    <div ref="holder" class="watch-holder" v-html="source" />
  </div>
</template>

<style>
.watch-layer { position: absolute; inset: 0; padding: 0; transition: opacity 0.3s; }
.watch-layer.watch-off { opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0s 0.3s; }
.watch-holder, .watch-holder > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.watch-holder svg * { vector-effect: non-scaling-stroke; }
.watch-holder .camera { transition: transform 1.8s ease-in-out; }
.watch-holder svg[data-view] .camera {
  transform: translate(calc(var(--cam-x) * 1px), calc(var(--cam-y) * 1px)) scale(var(--cam-s));
}
.watch-holder svg [data-part] { transition: opacity 0.8s ease 0s; }
.watch-holder svg[data-view] [data-part] { transition-delay: 1.8s; }
.watch-marker ~ .slidev-layout { background: transparent; }
</style>

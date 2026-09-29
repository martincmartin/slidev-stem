<script setup lang="ts">
// Spike: one live watch under every slide, for the whole talk, drawn with
// WebGL by ../tools/webgl/stage.js. Each slide names a view in its
// frontmatter (`watch: hairspring`, `watchTilt: 45`, and see watch-state.ts);
// a slide without one hides the layer. A click can change the state
// (`watchSettle`). Print mode (export) has no live layer: slide-bottom.vue
// draws a still on each page. Print mode comes from the page's nav: each
// printed page gets a fixed nav of its own, which does not know it. The class slidev-layout gives the layer the
// theme's palette variables and page colour.
import { useNav } from '@slidev/client'
import { injectionSlidevContext } from '@slidev/client/constants.ts'
import { computed, inject, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import scene from '../out/scene.json'
import { Stage, stillOf } from '../tools/webgl/stage.js'
import { watchState } from './watch-state'

const slidev = inject(injectionSlidevContext)!
const live = !useNav().isPrintMode.value
const frontmatter = computed(() => slidev.nav.currentSlideRoute.meta?.slide?.frontmatter ?? {})
const state = computed(() => watchState(frontmatter.value, slidev.nav.clicks))
const name = computed(() => state.value?.view)
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
let stage: Stage | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (!live) return
  stage = new Stage(canvas.value!, scene)
  ;(window as any).watchStage = stage // for the measurement scripts
  watch(
    () => JSON.stringify(state.value ?? null),
    (value, old) => {
      clearTimeout(hideTimer)
      if (!state.value) {
        hideTimer = setTimeout(() => stage!.stop(), 400) // after the layer's fade
        return
      }
      // a slide reached from a slide without the watch starts at its state
      stage!.show(state.value, { instantly: old === undefined || old === 'null' })
      stage!.start()
    },
    { immediate: true },
  )
})
onBeforeUnmount(() => stage?.stop())

// The presenter view draws the next slide's still in its "next" pane. Draw
// them all once, while the page is idle after it loads, so that a slide
// change finds its still ready (?stills=lazy turns this off, to compare).
onMounted(() => {
  const lazy = new URLSearchParams(location.search).get('stills') === 'lazy'
  if (!live || lazy || !location.pathname.startsWith('/presenter')) return
  const ratio = window.devicePixelRatio || 1
  const size = scene.slide.map((length: number) => Math.round(length * ratio))
  const pending = useNav()
    .slides.value.map((route) => watchState(route.meta?.slide?.frontmatter ?? {}, 0))
    .filter((slide) => slide)
  const next = () => {
    const slide = pending.shift()
    if (!slide) return
    stillOf(scene, slide, size)
    requestIdleCallback(next)
  }
  setTimeout(() => requestIdleCallback(next), 1000)
})
</script>

<template>
  <div v-if="live" class="slidev-layout watch-layer" :class="{ 'watch-off': !name }">
    <canvas ref="canvas" class="watch-canvas" />
  </div>
</template>

<style>
.watch-layer { position: absolute; inset: 0; padding: 0; transition: opacity 0.3s; }
.watch-layer.watch-off { opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0s 0.3s; }
.watch-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
/* see-through, and positioned, so it paints above a still (which is positioned) */
.watch-marker ~ .slidev-layout { background: transparent; position: relative; }
.watch-still { position: absolute; inset: 0; }
.watch-still img { width: 100%; height: 100%; display: block; }
/* `transition: watch-zoom`: the old slide's text fades while the camera
   starts its move; the new slide's text comes in after the move. */
.watch-zoom-leave-active { transition: opacity 0.9s ease-in; }
.watch-zoom-enter-active { transition: opacity 0.5s ease-out 1.8s; }
.watch-zoom-leave-to, .watch-zoom-enter-from { opacity: 0; }
</style>

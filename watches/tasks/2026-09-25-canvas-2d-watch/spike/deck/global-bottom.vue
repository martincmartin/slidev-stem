<script setup lang="ts">
// Spike: one watch under every slide, for the whole talk, drawn on a canvas
// by ../site/watch_stage.js. Each slide names a view in its frontmatter
// (`watch: hairspring`); a slide without one hides the layer. The class
// slidev-layout gives the layer the theme's palette variables and page colour.
import { injectionSlidevContext } from '@slidev/client/constants.ts'
import { computed, inject, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import source from '../site/watch-1dp.svg?raw'
import { DRAW_OPTIONS, readDrawing } from '../site/watch_player.js'
import { TIMING, WatchStage, viewsFrom } from '../site/watch_stage.js'
import { selfTest } from '../site/watch_self_test.js'

const slidev = inject(injectionSlidevContext)!
const name = computed(
  () => slidev.nav.currentSlideRoute.meta?.slide?.frontmatter?.watch as string | undefined,
)
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
let stage: WatchStage | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  const drawing = readDrawing(source)
  // spike only: ?clips=erase draws each clipped group and then erases its
  // hole, instead of clipping (the same picture here; cheaper in Firefox)
  const params = new URLSearchParams(location.search)
  const options = { ...DRAW_OPTIONS, clips: params.get('clips') ?? DRAW_OPTIONS.clips }
  stage = new WatchStage(canvas.value!, drawing, viewsFrom(source, drawing), TIMING, options)
  ;(window as any).watchStage = stage // for the measurement scripts
  watch(
    name,
    (value, old) => {
      clearTimeout(hideTimer)
      if (!value) {
        hideTimer = setTimeout(() => stage!.stop(), 400) // after the layer's fade
        return
      }
      const view = stage!.views.find((candidate) => candidate.name === value)
      if (!view) throw new Error(`no watch view ${value}`)
      // print draws every page at once; a slide reached from a slide without
      // the watch starts at its view, since there is nothing to zoom from
      stage!.show(view, { instantly: slidev.nav.isPrintMode || old === undefined })
      stage!.start()
    },
    { immediate: true },
  )
  // measurement only: ?auto=3&label=…&report=… (real_browsers.py)
  if (params.has('auto')) selfTest(stage, () => slidev.nav.next(), () => slidev.nav.prev(), params)
})
onBeforeUnmount(() => stage?.stop())
</script>

<template>
  <div class="slidev-layout watch-layer" :class="{ 'watch-off': !name }">
    <canvas ref="canvas" class="watch-canvas" />
  </div>
</template>

<style>
.watch-layer { position: absolute; inset: 0; padding: 0; transition: opacity 0.3s; }
.watch-layer.watch-off { opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0s 0.3s; }
.watch-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.watch-marker ~ .slidev-layout { background: transparent; }
</style>

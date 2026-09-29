<script setup lang="ts">
// Spike: under each slide that shows the watch, a marker, so one sibling
// rule can make the slide see-through. Where the slide is not the live one
// (print and export, the overview, the presenter's "next" pane), a still of
// its view, from one renderer shared by the page. `data-waitfor` makes
// `slidev export` wait until the still is drawn. A printed page's render
// context is "slide", so print mode comes from the page's nav.
import { useNav, useSlideContext } from '@slidev/client'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import scene from '../out/scene.json'
import { stillOf } from '../tools/webgl/stage.js'
import { watchState } from './watch-state'

const { $frontmatter, $renderContext } = useSlideContext()
const LIVE = ['slide', 'presenter']
const { isPrintMode } = useNav()
const needsStill = computed(
  () => Boolean($frontmatter.watch) && (isPrintMode.value || !LIVE.includes($renderContext.value)),
)
const source = ref<string>()
const box = useTemplateRef<HTMLElement>('box')

onMounted(async () => {
  if (!needsStill.value) return
  const ratio = window.devicePixelRatio || 1
  const [width, height] = scene.slide
  const size = [Math.round(width * ratio), Math.round(height * ratio)]
  source.value = await stillOf(scene, watchState($frontmatter, 0)!, size)
})
</script>

<template>
  <i v-if="$frontmatter.watch" class="watch-marker" aria-hidden="true" />
  <div v-if="needsStill" ref="box" class="watch-still" data-waitfor=".watch-still-image">
    <img v-if="source" class="watch-still-image" :src="source" alt="" />
  </div>
</template>

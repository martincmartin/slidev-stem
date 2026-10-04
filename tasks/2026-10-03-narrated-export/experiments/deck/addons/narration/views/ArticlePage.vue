<script setup lang="ts">
// The article: one long page, like an annotated talk. For each part of a
// slide's narration, the slide at that part's click, then the part. A slide
// with no narration is drawn once, at its last click. Each slide is drawn by
// Slidev's own print component, as `slidev export` draws it, and scaled to the
// column with CSS `zoom`. (With `transform: scale`, Chromium printed some
// figures blank: those last on a page.) The browser's "Print to PDF" of this
// page is the handout.
import type { SlideRoute } from "@slidev/types";
import type { SlidevContextNav } from "@slidev/client/composables/useNav.ts";
import { useNav } from "@slidev/client";
import { createFixedClicks } from "@slidev/client/composables/useClicks.ts";
import { useFixedNav } from "@slidev/client/composables/useNav.ts";
import { CLICKS_MAX, injectionSlideScale } from "@slidev/client/constants.ts";
import { configs, slideWidth } from "@slidev/client/env.ts";
import PrintSlideClick from "@slidev/client/internals/PrintSlideClick.vue";
import { provideLocal, useElementSize, useStyleTag } from "@vueuse/core";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  provide,
  useTemplateRef,
} from "vue";
import { narrationOf } from "../narration.ts";

// Tells a deck's own layers that they draw a figure of the article, not the
// talk's one live slide. The watches deck uses it to share one renderer
// among the figures (its global-bottom.vue, with `?shared`).
provide("narration:figure", true);

interface Figure {
  key: string;
  route: SlideRoute;
  /** The fixed nav that draws the slide at one click. */
  nav: SlidevContextNav;
  html: string;
}

const { slides } = useNav();
const column = useTemplateRef<HTMLElement>("column");
const { width } = useElementSize(column);
const scale = computed(() => width.value / slideWidth.value);
provideLocal(injectionSlideScale, scale);

/** `?copies=N` repeats the figures N times: a longer page, for the
 *  measurements of experiments/embed.py. */
const copies = Number(new URLSearchParams(location.search).get("copies") ?? 1);

function figure(
  route: SlideRoute,
  clicks: number,
  html: string,
  copy: number,
): Figure {
  return {
    key: `${String(copy)}-${String(route.no)}-${String(clicks)}`,
    route,
    nav: useFixedNav(route, createFixedClicks(route, clicks)),
    html,
  };
}

const figures = computed(() =>
  Array.from({ length: copies }, (_, copy) =>
    slides.value.flatMap((route) => {
      const parts = narrationOf(route);
      if (parts.length === 0) return [figure(route, CLICKS_MAX, "", copy)];
      return parts.map((part) => figure(route, part.clicks, part.html, copy));
    }),
  ).flat(),
);

// Print mode gives every page the slide's size (Slidev's usePrintStyles). An
// article prints on paper: this tag comes later, so its @page wins.
useStyleTag("@page { size: letter portrait; margin: 0.5in; }");

onMounted(() => document.documentElement.classList.add("narration-article"));
onBeforeUnmount(() =>
  document.documentElement.classList.remove("narration-article"),
);
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- our own narration, rendered by setup/preparser.ts -->
  <main class="slidev-layout article-page">
    <div ref="column" class="article-column">
      <h1>{{ configs.title }}</h1>
      <template v-for="item of figures" :key="item.key">
        <figure class="article-figure">
          <div class="article-slide" :style="{ zoom: scale }">
            <PrintSlideClick :nav="item.nav" />
          </div>
        </figure>
        <div v-if="item.html" class="article-text" v-html="item.html" />
      </template>
    </div>
  </main>
</template>

<style>
html.narration-article,
html.narration-article body,
html.narration-article #app {
  height: auto;
  overflow: auto;
}
.slidev-layout.article-page {
  height: auto;
  min-height: 100vh;
  padding: 48px 16px 96px;
  font-size: 18px;
  line-height: 1.6;
}
.article-column {
  max-width: 760px;
  margin: 0 auto;
}
.article-figure {
  margin: 40px 0 20px;
  overflow: hidden;
  border: 1px solid var(--palette-border);
  break-inside: avoid;
}
/* Slidev's print page puts each slide on a page of its own; an article
   flows. */
.article-slide .print-slide-container {
  break-after: auto !important;
}
.article-text em {
  color: var(--palette-accent);
}
</style>

<script setup lang="ts">
// The narrated mode: `?narration` on the play route (http://localhost:3030/1?narration).
// The live slide shrinks, and a panel beside it (on a wide screen) or below it
// holds the narration of the whole talk, as one article. The part said at the
// current click is marked. Two ways to read it:
// - click through: the arrow keys move the slide, and the panel scrolls to its part;
// - scroll: scroll the panel, and when it stops, the slide goes to the part on
//   the reading line.
// The slide is Slidev's own play view, so every animation and transition runs
// as in the talk. Slidev's go() keeps the query, so the mode survives
// navigation. GlobalTop is drawn once per play view, inside the scaled slide;
// the panel is teleported to <body> to escape the scale.
import type { SlideRoute } from "@slidev/types";
import { useNav } from "@slidev/client";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  useTemplateRef,
  watch,
} from "vue";
import type { NarrationPart } from "./narration.ts";
import { currentPart, narrationOf, narrationRequested } from "./narration.ts";

/** Where on the panel, as a fraction of its height, the current part sits. */
const READING_LINE = 0.3;
/** How long the panel must be still before a scroll moves the slide. */
const SETTLE_MS = 180;

const nav = useNav();
const enabled = nav.isPlaying.value && narrationRequested();
const panel = useTemplateRef<HTMLElement>("panel");

const sections = computed(() =>
  nav.slides.value.map((route) => ({ route, parts: narrationOf(route) })),
);

function isCurrent(route: SlideRoute, part: NarrationPart): boolean {
  return (
    route.no === nav.currentSlideNo.value &&
    currentPart(narrationOf(route), nav.clicks.value) === part
  );
}

function anchorOfCurrent(): HTMLElement | null {
  const route = nav.currentSlideRoute.value;
  const part = currentPart(narrationOf(route), nav.clicks.value);
  const selector = `[data-no="${String(route.no)}"][data-clicks="${String(part?.clicks ?? 0)}"]`;
  return panel.value?.querySelector<HTMLElement>(selector) ?? null;
}

// A scroll that we start must not move the slide: only the reader's own
// scrolling (wheel, touch, keys in the panel) does.
let readerScrolling = false;
let settleTimer: ReturnType<typeof setTimeout> | undefined;

function scrollToCurrent(): void {
  const anchor = anchorOfCurrent();
  const box = panel.value;
  if (!anchor || !box) return;
  readerScrolling = false;
  box.scrollTo({
    top: anchor.offsetTop - box.clientHeight * READING_LINE,
    behavior: "smooth",
  });
}

function onReaderInput(): void {
  readerScrolling = true;
}

function onScroll(): void {
  if (!readerScrolling) return;
  clearTimeout(settleTimer);
  settleTimer = setTimeout(goToReadingLine, SETTLE_MS);
}

/** Go to the last anchor whose top is above the reading line. */
function goToReadingLine(): void {
  const box = panel.value;
  if (!box) return;
  const line = box.scrollTop + box.clientHeight * READING_LINE + 1;
  let chosen: HTMLElement | undefined;
  for (const anchor of box.querySelectorAll<HTMLElement>("[data-no]")) {
    if (anchor.offsetTop <= line) chosen = anchor;
    else break;
  }
  if (!chosen) return;
  const no = Number(chosen.dataset["no"]);
  const clicks = Number(chosen.dataset["clicks"]);
  const route = nav.currentSlideRoute.value;
  const now = currentPart(narrationOf(route), nav.clicks.value)?.clicks ?? 0;
  if (no !== route.no || clicks !== now) void nav.go(no, clicks);
}

function paintLetterbox(): void {
  // The slide's letterbox takes the page's paper, read from the theme.
  const box = panel.value;
  if (!box) return;
  const paper = getComputedStyle(box).getPropertyValue("--palette-background");
  document.documentElement.style.setProperty(
    "--slidev-slide-container-background",
    paper,
  );
}

if (enabled) {
  onMounted(() => {
    document.documentElement.classList.add("narrated");
    paintLetterbox();
    void nextTick(scrollToCurrent);
  });
  onBeforeUnmount(() => {
    clearTimeout(settleTimer);
    document.documentElement.classList.remove("narrated");
    document.documentElement.style.removeProperty(
      "--slidev-slide-container-background",
    );
  });
  watch(
    () => [nav.currentSlideNo.value, nav.clicks.value],
    () => {
      if (!readerScrolling) void nextTick(scrollToCurrent);
      readerScrolling = false;
    },
  );
}
</script>

<template>
  <Teleport v-if="enabled" to="body">
    <!-- eslint-disable vue/no-v-html -- our own narration, rendered by setup/preparser.ts -->
    <aside
      ref="panel"
      class="slidev-layout narration-panel"
      tabindex="0"
      @wheel.passive="onReaderInput"
      @touchmove.passive="onReaderInput"
      @keydown="onReaderInput"
      @scroll.passive="onScroll"
    >
      <section
        v-for="{ route, parts } of sections"
        :key="route.no"
        class="narration-slide"
      >
        <h2
          :data-no="route.no"
          data-clicks="0"
          @click="nav.go(route.no, 0)"
        >
          {{ route.meta.slide.title }}
        </h2>
        <div
          v-for="part of parts"
          :key="part.clicks"
          class="narration-part"
          :class="{ current: isCurrent(route, part) }"
          :data-no="route.no"
          :data-clicks="part.clicks"
          @click="nav.go(route.no, part.clicks)"
          v-html="part.html"
        />
      </section>
      <div class="narration-end" />
    </aside>
  </Teleport>
</template>

<style>
/* Wide screens: a column on the right. 8/5 is a 16:10 laptop: on a squarer
   screen the slide is larger with the panel below it. */
html.narrated {
  --narration-size: clamp(320px, 32vw, 560px);
}
html.narrated #page-root {
  width: calc(100vw - var(--narration-size));
}
.slidev-layout.narration-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--narration-size);
  overflow-y: auto;
  padding: 24px 28px;
  box-sizing: border-box;
  font-size: 17px;
  line-height: 1.55;
  border-left: 1px solid var(--palette-border);
  z-index: 10;
}
@media (max-aspect-ratio: 8/5) {
  html.narrated {
    --narration-size: 34vh;
  }
  html.narrated #page-root {
    width: 100vw;
    height: calc(100vh - var(--narration-size));
  }
  .slidev-layout.narration-panel {
    top: auto;
    left: 0;
    width: auto;
    height: var(--narration-size);
    border-left: 0;
    border-top: 1px solid var(--palette-border);
  }
}
.slidev-layout.narration-panel h2 {
  font-family: theme("fontFamily.serif");
  font-weight: 600;
  font-size: 21px;
  margin: 1.4em 0 0.4em;
  cursor: pointer;
}
.narration-part {
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.3s;
  padding-left: 12px;
  border-left: 3px solid transparent;
}
.narration-part.current {
  opacity: 1;
  border-left-color: var(--palette-accent);
}
.narration-part p {
  margin: 0 0 0.7em;
}
.narration-part em {
  color: var(--palette-accent);
}
/* Room below the last part, so that it can reach the reading line. */
.narration-end {
  height: 70%;
}
</style>

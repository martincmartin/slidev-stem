<script setup lang="ts">
// The article: the talk as one long page, for readers. The cover's title and
// the author, the contents, then each slide's heading, its narration, its
// asides (in the margin on a wide window), and its figures: the slides
// themselves, live (components/ArticleFigure.vue). What goes where is the
// page model's (../plan.ts), with the talk's rules (`ARTICLE_HOOKS`,
// ../figure.ts). docs/article.md has the rules and the reasons.
//
// "Pause all" stops every figure. A reader who asks for reduced motion
// starts with it on.
import { useNav } from "@slidev/client";
import { CLICKS_MAX } from "@slidev/client/constants.ts";
import { configs } from "@slidev/client/env.ts";
import type { SlideRoute } from "@slidev/client";
import { useWindowSize } from "@vueuse/core";
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import ArticleFigure from "../components/ArticleFigure.vue";
import { ARTICLE_HOOKS, DEFAULT_HOOKS } from "../figure.ts";
import type { Box } from "../figure.ts";
import { pagePlan } from "../plan.ts";
import type {
  FigureBlock,
  PageBlock,
  RenderedPart,
  SlideInput,
} from "../plan.ts";

const hooks = inject(ARTICLE_HOOKS, DEFAULT_HOOKS);
const { slides } = useNav();

/** px: the widest a figure may be, and the room around the page. */
const FIGURE_MAX_WIDTH = 980;
const GUTTER = 16;
/** The part of the window's height that a figure may take. */
const FIGURE_HEIGHT_SHARE = 0.8;

function frontmatterOf(route: SlideRoute): Record<string, unknown> {
  return route.meta.slide?.frontmatter ?? {};
}

/** The slide's clicks, as its frontmatter says; 0 if it does not. */
function totalOf(route: SlideRoute): number {
  return Number(frontmatterOf(route)["clicks"] ?? 0);
}

function inputOf(route: SlideRoute): SlideInput {
  const frontmatter = frontmatterOf(route);
  const text = (key: string): string | null => {
    const value = frontmatter[key];
    return typeof value === "string" ? value : null;
  };
  const narration = frontmatter["narration"];
  return {
    no: route.no,
    title: route.meta.slide?.title ?? null,
    layout: text("layout"),
    eyebrow: text("eyebrow"),
    parts: Array.isArray(narration) ? (narration as RenderedPart[]) : null,
    defaults: hooks.defaultFigures(frontmatter, totalOf(route)),
    keyOf: (clicks) =>
      hooks.pictureKey(frontmatter, clicks) ??
      `slide ${String(route.no)} @${String(clicks)}`,
  };
}

const routeOf = computed(
  () => new Map(slides.value.map((route) => [route.no, route])),
);
const page = computed<PageBlock[]>(() => pagePlan(slides.value.map(inputOf)));
const title = computed(
  () =>
    page.value.find((block) => block.kind === "title")?.text ?? configs.title,
);
const contents = computed(() =>
  page.value.flatMap((block) =>
    block.kind === "part" || block.kind === "heading" ? [block] : [],
  ),
);
/** Where the contents go: before the first heading. */
const contentsAt = computed(() =>
  page.value.findIndex(
    (block) => block.kind === "part" || block.kind === "heading",
  ),
);

function routeOfFigure(figure: FigureBlock): SlideRoute {
  const route = routeOf.value.get(figure.slide);
  if (!route) throw new Error(`no slide ${String(figure.slide)}`);
  return route;
}

/** A figure's steps. A slide that does not say how many clicks it has, and
 *  is shown whole, shows all its text: its last click. */
function stepsOf(figure: FigureBlock): number[] {
  const route = routeOfFigure(figure);
  const unknown = frontmatterOf(route)["clicks"] === undefined;
  return figure.steps.map((clicks) =>
    unknown && boxOf(figure) === null ? CLICKS_MAX : clicks,
  );
}

/** The crop of a figure: the picture's box over all its steps. */
function boxOf(figure: FigureBlock): Box | null {
  const frontmatter = frontmatterOf(routeOfFigure(figure));
  let box: Box | null = null;
  for (const clicks of figure.steps) {
    const each = hooks.pictureBox(frontmatter, clicks);
    if (!each) return null;
    box = box
      ? {
          left: Math.min(box.left, each.left),
          top: Math.min(box.top, each.top),
          right: Math.max(box.right, each.right),
          bottom: Math.max(box.bottom, each.bottom),
        }
      : each;
  }
  return box;
}

const windowSize = useWindowSize();
const figureWidth = computed(() =>
  Math.min(FIGURE_MAX_WIDTH, windowSize.width.value - 2 * GUTTER),
);
const figureHeight = computed(
  () => windowSize.height.value * FIGURE_HEIGHT_SHARE,
);

const reducedMotion =
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;
const pausedAll = ref(reducedMotion);

onMounted(() => {
  document.documentElement.classList.add("article-mode");
  document.title = title.value;
  // the page is made by script: go to the fragment once it is there
  const target = location.hash
    ? document.getElementById(location.hash.slice(1))
    : null;
  target?.scrollIntoView();
});
onBeforeUnmount(() => {
  document.documentElement.classList.remove("article-mode");
});
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- the narration, rendered by setup/preparser.ts -->
  <main class="slidev-layout article-page">
    <article class="article-column">
      <template v-for="(block, index) of page" :key="index">
        <nav
          v-if="index === contentsAt"
          class="article-contents"
          aria-label="Contents"
        >
          <p class="article-contents-title">Contents</p>
          <ol>
            <li
              v-for="entry of contents"
              :key="entry.id"
              :class="{ 'article-contents-part': entry.kind === 'part' }"
            >
              <a :href="`#${entry.id}`">{{ entry.text }}</a>
            </li>
          </ol>
        </nav>
        <header v-if="block.kind === 'title'" class="article-header">
          <h1 class="font-serif">{{ block.text }}</h1>
          <p v-if="configs.author" class="article-byline">
            {{ configs.author }}
          </p>
          <p class="article-motion">
            The figures are the talk's slides, live.
            <button
              type="button"
              class="article-link-button"
              :aria-pressed="pausedAll"
              @click="pausedAll = !pausedAll"
            >
              {{ pausedAll ? "Play them all" : "Pause them all" }}
            </button>
          </p>
        </header>
        <h2
          v-else-if="block.kind === 'part'"
          :id="block.id"
          class="article-part font-serif"
        >
          <span v-if="block.eyebrow" class="article-eyebrow">{{
            block.eyebrow
          }}</span>
          {{ block.text }}
        </h2>
        <h3
          v-else-if="block.kind === 'heading'"
          :id="block.id"
          class="font-serif"
        >
          {{ block.text }}
        </h3>
        <div
          v-else-if="block.kind === 'prose'"
          class="article-prose"
          v-html="block.html"
        />
        <aside v-else-if="block.kind === 'aside'" class="article-aside">
          <p class="article-aside-title" v-html="block.title" />
          <div v-html="block.html" />
        </aside>
        <ArticleFigure
          v-else-if="block.kind === 'figure'"
          :figure="block"
          :route="routeOfFigure(block)"
          :steps="stepsOf(block)"
          :box="boxOf(block)"
          :width="figureWidth"
          :height="figureHeight"
          :paused-by-page="pausedAll"
        />
      </template>
    </article>
  </main>
</template>

<style>
/* Slidev fixes the page to the window, for slides; an article scrolls. */
html.article-mode,
html.article-mode body,
html.article-mode #app {
  height: auto;
  min-height: 100%;
  overflow: visible;
  overflow-x: hidden;
}
.slidev-layout.article-page {
  height: auto;
  min-height: 100vh;
  padding: 56px 16px 120px;
  font-size: 20px;
  line-height: 1.6;
  color: var(--palette-ink);
  background: var(--palette-background);
}
.article-column {
  max-width: 700px;
  margin: 0 auto;
}
/* A figure may be wider than the text: it is centred on the column. */
.article-column > .article-figure {
  width: min(980px, 100vw - 32px);
  margin-left: calc((100% - min(980px, 100vw - 32px)) / 2);
}
.article-header {
  text-align: left;
}
.article-header h1 {
  text-align: left;
  font-size: 2.4em;
  line-height: 1.15;
  margin: 0 0 0.3em;
}
.article-byline {
  margin: 0;
  color: var(--palette-muted);
}
.article-motion {
  margin: 0.4em 0 1.6em;
  font-size: 0.85em;
  color: var(--palette-muted);
}
.article-link-button {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: var(--palette-ink);
  text-decoration: underline;
  cursor: pointer;
}
.article-contents {
  margin: 2em 0;
  font-size: 0.9em;
}
.article-contents-title {
  margin: 0 0 0.3em;
  color: var(--palette-muted);
}
.article-contents ol {
  margin: 0;
  padding-left: 1.2em;
  list-style: none;
}
.article-contents li.article-contents-part {
  margin-left: -1.2em;
  margin-top: 0.4em;
}
.article-contents a {
  color: var(--palette-ink);
}
.article-page h2.article-part {
  margin: 2.4em 0 0.6em;
  font-size: 1.9em;
  font-weight: 600;
  line-height: 1.2;
}
.article-eyebrow {
  display: block;
  font-family: inherit;
  font-size: 0.45em;
  letter-spacing: 0.12em;
  color: var(--palette-muted);
}
.article-page h3 {
  margin: 2em 0 0.5em;
  font-size: 1.45em;
  font-weight: 600;
  line-height: 1.25;
}
.article-prose p {
  margin: 0 0 1em;
}
.article-prose table {
  margin: 0 0 1em;
  border-collapse: collapse;
}
.article-prose :is(th, td) {
  padding: 0.2em 1.2em 0.2em 0;
  text-align: left;
  border: 0;
}
.article-prose th {
  font-weight: 400;
  color: var(--palette-muted);
}
/* An aside: a sidenote in the margin on a wide window, a box in the text on
   a narrow one. */
.article-aside {
  margin: 0 0 1em;
  padding: 0.6em 0.9em;
  border-left: 2px solid var(--palette-border);
  font-size: 0.8em;
  line-height: 1.5;
  color: var(--palette-ink);
}
.article-aside-title {
  margin: 0 0 0.2em;
  font-weight: 600;
}
.article-aside p {
  margin: 0 0 0.5em;
}
@media (min-width: 1280px) {
  .article-aside {
    float: right;
    clear: right;
    width: 250px;
    margin: 0.3em -290px 1em 0;
    padding: 0 0 0 0.9em;
  }
}
</style>

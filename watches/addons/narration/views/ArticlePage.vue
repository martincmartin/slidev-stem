<script setup lang="ts">
// The article: the talk as a page for each part, for readers (`part`, from
// the route: setup/routes.ts). The cover's title and the author, links to
// the other parts, the contents, then each slide's heading, its narration, its
// asides (beside their paragraphs in the margin on a wide window, after them
// on a narrow one), its pull quotes
// (components/ArticleQuote.vue), and its figures: the slides themselves,
// live (components/ArticleFigure.vue). What goes where is the
// page model's (../plan.ts), with the talk's rules (`ARTICLE_HOOKS`,
// ../figure.ts). The page ends with a link to the next part, if that part
// is linked. docs/article.md has the rules and the reasons.
//
// "Pause all" stops every figure. A reader who asks for reduced motion
// starts with it on.
import { useNav } from "@slidev/client";
import { CLICKS_MAX } from "@slidev/client/constants.ts";
import { configs } from "@slidev/client/env.ts";
import type { SlideRoute } from "@slidev/client";
import { useWindowSize } from "@vueuse/core";
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import ArticleFigure from "../components/ArticleFigure.vue";
import ArticleQuote from "../components/ArticleQuote.vue";
import { ARTICLE_HOOKS, DEFAULT_HOOKS } from "../figure.ts";
import type { Box } from "../figure.ts";
import {
  articlePages,
  cropGroups,
  pagedSlide,
  pageInput,
  pagePlan,
  slideInput,
} from "../plan.ts";
import type {
  ArticlePage,
  FigureBlock,
  PageBlock,
  RenderedPart,
  SlideInput,
} from "../plan.ts";

const props = defineProps<{
  /** The part that the page shows, from 1. */
  part: number;
}>();

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

function inputOf(route: SlideRoute): SlideInput {
  const frontmatter = frontmatterOf(route);
  const narration = frontmatter["narration"];
  return slideInput(
    {
      no: route.no,
      title: route.meta.slide?.title ?? null,
      frontmatter,
      parts: Array.isArray(narration) ? (narration as RenderedPart[]) : null,
    },
    hooks,
  );
}

const routeOf = computed(
  () => new Map(slides.value.map((route) => [route.no, route])),
);
/** The article's pages. The split reads only the frontmatter: the talk's
 *  rules (`hooks`) run only for the page's own slides, whose art the page
 *  has made (setup/main.ts in the talk). */
const pages = computed(() =>
  articlePages(
    slides.value.map((route) =>
      pagedSlide({
        no: route.no,
        title: route.meta.slide?.title ?? null,
        frontmatter: frontmatterOf(route),
      }),
    ),
  ),
);
/** The page's part, or `null` if the talk has no such part. */
const current = computed(() => pages.value[props.part - 1] ?? null);
const page = computed<PageBlock[]>(() =>
  current.value
    ? pagePlan(
        current.value.slides.map(({ slide, titleOnly }) =>
          pageInput(inputOf(routeOfSlide(slide.no)), titleOnly),
        ),
      )
    : [],
);
/** The page's title, its <h1>, for the browser's tab and a link's preview:
 *  a link to the page shows the title that the page shows. The prerender
 *  reads it, and the description, from <main>'s data, for the static page's
 *  head. */
const title = computed(
  () =>
    page.value.find((block) => block.kind === "title")?.text ?? configs.title,
);

/** A part's name: "Part 2: Changed The World". */
function partName(each: ArticlePage): string {
  const name = each.section?.title;
  return name
    ? `Part ${String(each.number)}: ${name}`
    : `Part ${String(each.number)}`;
}

/** What the page needs of Slidev's head manager (unhead), which writes the
 *  page's <title>, and would overwrite one set on `document`. */
interface HeadManager {
  push(input: { title: string }): {
    patch(input: { title: string }): void;
    dispose(): void;
  };
}
function isHeadManager(value: unknown): value is HeadManager {
  return (
    typeof value === "object" &&
    value !== null &&
    "push" in value &&
    typeof value.push === "function"
  );
}
// unhead provides itself under this key: not a public API of Slidev's
// (../../docs/article.md, "How the code is split")
const head: unknown = inject("usehead", null);
if (!isHeadManager(head)) throw new Error("no head manager (unhead) to inject");
const titleEntry = head.push({ title: title.value });
watch(title, (text) => {
  titleEntry.patch({ title: text });
});
onBeforeUnmount(() => {
  titleEntry.dispose();
});
/** The page's description, for a link's preview: its part's
 *  `articleDescription`. */
const description = computed(() => current.value?.section?.description);

/** The deck's base (Slidev's --base): the article's pages are under it. */
const baseUrl = import.meta.env.BASE_URL;
/** The talk's source code (the headmatter's `articleSource`, a URL), or
 *  `null`: the page's end links to it. Slidev puts each headmatter key in
 *  `configs`, but its type names only Slidev's own. */
const sourceUrl: unknown = Reflect.get(configs, "articleSource");
const source = typeof sourceUrl === "string" ? sourceUrl : null;

/** A part's page. */
function partHref(each: ArticlePage): string {
  return `${baseUrl}article/${String(each.number)}/`;
}

/** The parts that the page links to, and its own: a part that is not
 *  linked yet (`articleLinked: false`) only on its own page. None if the
 *  page links to no other part. */
const partLinks = computed(() => {
  const shown = pages.value.filter(
    (each) => each === current.value || (each.section?.linked ?? true),
  );
  return shown.length < 2 ? [] : shown;
});
/** The next part, if it is linked. */
const nextPart = computed(() => {
  const next = current.value ? pages.value[current.value.number] : undefined;
  return next && (next.section?.linked ?? true) ? next : null;
});
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

function routeOfSlide(no: number): SlideRoute {
  const route = routeOf.value.get(no);
  if (!route) throw new Error(`no slide ${String(no)}`);
  return route;
}

function routeOfFigure(figure: FigureBlock): SlideRoute {
  return routeOfSlide(figure.slide);
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

function union(first: Box | null, second: Box): Box {
  if (!first) return second;
  return {
    left: Math.min(first.left, second.left),
    top: Math.min(first.top, second.top),
    right: Math.max(first.right, second.right),
    bottom: Math.max(first.bottom, second.bottom),
  };
}

/** The picture's box over all of a figure's steps, or `null`: the whole
 *  slide. */
function ownBoxOf(figure: FigureBlock): Box | null {
  const frontmatter = frontmatterOf(routeOfFigure(figure));
  let box: Box | null = null;
  for (const clicks of figure.steps) {
    const each = hooks.pictureBox(frontmatter, clicks);
    if (!each) return null;
    box = union(box, each);
  }
  return box;
}

/** The figures that share each figure's crop (`cropGroups`). */
const cropGroupOf = computed(() =>
  cropGroups(
    page.value.flatMap((block) => (block.kind === "figure" ? [block] : [])),
    (figure) => {
      const frontmatter = frontmatterOf(routeOfFigure(figure));
      return figure.steps.flatMap(
        (clicks) => hooks.frameKey(frontmatter, clicks) ?? [],
      );
    },
  ),
);

function groupOf(figure: FigureBlock): readonly FigureBlock[] {
  return cropGroupOf.value.get(figure) ?? [figure];
}

/** The crop of a figure: the picture's box over its crop group's steps. */
function boxOf(figure: FigureBlock): Box | null {
  let box: Box | null = null;
  for (const each of groupOf(figure)) {
    const own = ownBoxOf(each);
    if (!own) return null;
    box = union(box, own);
  }
  return box;
}

/** The labels' box of each figure, in slide px, once it has measured them. */
const labelsOf = reactive(new Map<string, Box>());

/** The labels' box over a figure's crop group. */
function labelsBoxOf(figure: FigureBlock): Box | null {
  let box: Box | null = null;
  for (const each of groupOf(figure)) {
    const labels = labelsOf.get(each.id);
    if (labels) box = union(box, labels);
  }
  return box;
}

function setLabels(figure: FigureBlock, box: Box | null): void {
  if (box) labelsOf.set(figure.id, box);
  else labelsOf.delete(figure.id);
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
  <main
    class="slidev-layout article-page"
    :data-article-pages="pages.length"
    :data-article-title="title"
    :data-article-description="description ?? undefined"
  >
    <article class="article-column">
      <p v-if="!current" class="article-prose">
        This talk has no Part {{ part }}.
        <a :href="`${baseUrl}article/1/`">Go to the start.</a>
      </p>
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
          <p v-if="block.series" class="article-series">
            {{ block.series
            }}<template v-if="block.eyebrow"> · {{ block.eyebrow }}</template>
          </p>
          <h1 class="font-serif">{{ block.text }}</h1>
          <p v-if="block.subtitle" class="article-subtitle font-serif">
            {{ block.subtitle }}
          </p>
          <p v-if="configs.author" class="article-byline">
            {{ configs.author }}
          </p>
          <p class="article-motion">
            <button
              type="button"
              class="article-link-button"
              :data-paused="pausedAll"
              @click="pausedAll = !pausedAll"
            >
              {{ pausedAll ? "Play all figures" : "Pause all figures" }}
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
        <p
          v-if="block.kind === 'heading' && block.history"
          class="article-history"
        >
          {{ block.history }}
        </p>
        <!-- eslint-disable vue/no-v-html -- the narration, rendered by setup/preparser.ts -->
        <div
          v-else-if="block.kind === 'prose' && block.asides.length > 0"
          class="article-with-asides"
        >
          <aside
            v-for="(aside, asideIndex) in block.asides"
            :key="asideIndex"
            class="article-aside"
          >
            <p class="article-aside-title" v-html="aside.title" />
            <div v-html="aside.text" />
          </aside>
          <div class="article-prose" v-html="block.text" />
        </div>
        <div
          v-else-if="block.kind === 'prose'"
          class="article-prose"
          v-html="block.text"
        />
        <p
          v-else-if="block.kind === 'credit'"
          class="article-credit"
          v-html="block.text"
        />
        <!-- eslint-enable vue/no-v-html -->
        <ArticleQuote
          v-else-if="block.kind === 'quote'"
          :classes="block.classes"
          :lines="block.lines"
        />
        <ArticleFigure
          v-else-if="block.kind === 'figure'"
          :figure="block"
          :route="routeOfFigure(block)"
          :steps="stepsOf(block)"
          :box="boxOf(block)"
          :labels="labelsBoxOf(block)"
          :width="figureWidth"
          :height="figureHeight"
          :paused-by-page="pausedAll"
          :reduced-motion="reducedMotion"
          @labels="(box: Box | null) => setLabels(block, box)"
        />
      </template>
      <nav v-if="nextPart" class="article-next" aria-label="Next part">
        <a :href="partHref(nextPart)">Next: {{ partName(nextPart) }}</a>
      </nav>
      <nav v-if="partLinks.length > 0" class="article-parts" aria-label="Parts">
        <ol>
          <li v-for="each of partLinks" :key="each.number">
            <span v-if="each === current" aria-current="page">{{
              partName(each)
            }}</span>
            <a v-else :href="partHref(each)">{{ partName(each) }}</a>
          </li>
        </ol>
      </nav>
      <footer class="article-colophon">
        <a v-if="source" :href="source">Source code</a>
        <a :href="`${baseUrl}licenses.txt`">Third-party licenses</a>
      </footer>
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
/* A figure may be wider than the text: it is centred on the column. So may a
   pull quote: its type is large, so even a wide line has few words, and the
   eye finds the next line (docs/article.md, "A pull quote"). */
.article-column > :is(.article-figure, .article-quote) {
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
/* The talk's title over the part's: small, as a section slide's eyebrow. */
.article-series {
  margin: 0 0 0.5em;
  font-size: 0.8em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--palette-muted);
}
/* Two classes: a slide's subtitle rule (`.slidev-layout h1 + p`, in the
   theme and the talk) centres the line after a title, and sets its size. */
.article-header .article-subtitle {
  margin: -0.1em 0 0.6em;
  text-align: left;
  font-size: 1.35em;
  font-style: italic;
  line-height: 1.25;
}
.article-header .article-byline {
  margin: 0;
  text-align: left;
  font-size: 1em;
  line-height: inherit;
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
  /* a control, not prose: a copy of the page leaves it out, as it leaves out
     a figure's words (ArticleFigure.vue) */
  -webkit-user-select: none;
  user-select: none;
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
/* The parts, on one line at the page's end: the page's own is not a link. */
.article-parts ol {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2em 1.4em;
  margin: 2em 0 0;
  padding: 0;
  font-size: 0.9em;
  list-style: none;
}
/* Slidev's lists indent each item */
.article-parts li {
  margin: 0;
}
.article-parts a {
  color: var(--palette-ink);
}
.article-parts [aria-current="page"] {
  font-weight: 600;
}
/* The links to the source and the licences, small, last on the page. */
.article-colophon {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2em 1.4em;
  margin: 3em 0 0;
  font-size: 0.75em;
}
.article-colophon a {
  color: var(--palette-muted);
}
/* A photo's credit, small, close under its figure. */
.article-column > .article-credit {
  margin: -1.2em 0 1.6em;
  font-size: 0.75em;
  line-height: 1.4;
  text-align: center;
  color: var(--palette-muted);
}
.article-credit a {
  color: inherit;
}
.article-next {
  margin: 3em 0 0;
  font-size: 1.1em;
}
.article-next a {
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
/* A slide's history line, close under its heading: a dateline. */
.article-page h3:has(+ .article-history) {
  margin-bottom: 0.15em;
}
.article-history {
  margin: 0 0 1em;
  font-weight: 600;
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
   a narrow one. Its paragraph holds it (../plan.ts). It comes before the
   paragraph in the page, so that it floats beside it: a float can only go
   down the page. A narrow window shows the paragraph first. */
@media (width < 1280px) {
  .article-with-asides {
    display: flex;
    flex-direction: column;
    /* the margins of a flex item do not collapse: the last one moves here */
    margin-bottom: 1em;
  }
  .article-with-asides > .article-prose {
    order: -1;
  }
  .article-with-asides > .article-aside:last-of-type {
    margin-bottom: 0;
  }
}
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

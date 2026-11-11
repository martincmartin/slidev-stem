<script setup lang="ts">
// A pull quote of the article (`> [!quote]` in the narration): large words,
// as wide as a figure, a line for each line of the quote. Its size and font
// are the talk's classes' (`classes`), or the page's default. The classes go
// on the element that holds the lines, not on the <blockquote>: Slidev's own
// rule for a <blockquote> (small type in a box) is stronger than a class.
// Each line stays one line: where the widest would not fit, the quote's type
// shrinks until it does (`fit`). Without JavaScript, a line that does not fit
// wraps.
// docs/article.md, "A pull quote".
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";

const props = defineProps<{
  readonly classes: readonly string[];
  /** Each line, as inline HTML (the preparser renders it). */
  readonly lines: readonly string[];
}>();

/** A little room at the right, so that a line that just fits does not wrap
 *  from a rounding of its width. */
const SLACK = 0.99;

const quote = useTemplateRef<HTMLElement>("quote");
/** The type's size, as a share of the size that its classes give. */
const fit = ref(1);
let observer: ResizeObserver | undefined;
let lastWidth = -1;
let measureFrame = 0;

/** Measure each line unwrapped, at the present size, and scale the type so
 *  that the widest fits the quote's width. A line's width is in proportion
 *  to the type's size. */
function measure(): void {
  const element = quote.value;
  if (!element) return;
  const room = element.clientWidth;
  if (room === 0) return;
  element.classList.add("article-quote-measure");
  const widest = Math.max(
    0,
    ...Array.from(
      element.querySelectorAll(".article-quote-line"),
      (line) => line.getBoundingClientRect().width,
    ),
  );
  element.classList.remove("article-quote-measure");
  if (widest === 0) return;
  fit.value = Math.min(1, (SLACK * room * fit.value) / widest);
}

/** Measure at the next frame. Not in a ResizeObserver's callback: the fit
 *  changes the quote's height there, and WebKit reports a ResizeObserver
 *  loop as a page error. */
function measureSoon(): void {
  cancelAnimationFrame(measureFrame);
  measureFrame = requestAnimationFrame(measure);
}

onMounted(() => {
  const element = quote.value;
  if (!element) return;
  // the width changes with the window; the height changes with the fit, so
  // a change of height alone needs no new measure
  observer = new ResizeObserver(() => {
    if (element.clientWidth === lastWidth) return;
    lastWidth = element.clientWidth;
    measureSoon();
  });
  observer.observe(element);
  // the talk's font may load after the quote mounts, at another width
  document.fonts.addEventListener("loadingdone", measureSoon);
  void document.fonts.ready.then(measureSoon);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  cancelAnimationFrame(measureFrame);
  document.fonts.removeEventListener("loadingdone", measureSoon);
});
</script>

<template>
  <blockquote ref="quote" class="article-quote">
    <div class="article-quote-text" :class="props.classes">
      <!-- eslint-disable vue/no-v-html -- the narration, rendered by setup/preparser.ts -->
      <span
        v-for="(line, index) in props.lines"
        :key="index"
        class="article-quote-line"
        :style="{ fontSize: `${String(fit)}em` }"
        v-html="line"
      />
      <!-- eslint-enable vue/no-v-html -->
    </div>
  </blockquote>
</template>

<style>
/* Not Slidev's <blockquote>, small type in a box: the text's own. */
.slidev-layout .article-quote {
  margin: 0.4em 0 0.8em;
  /* below an aside in the margin, as a figure is: it is as wide as one */
  clear: right;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  color: inherit;
  font-size: inherit;
}
/* The page's default for a quote: the talk's classes override it, so it has
   no weight of its own (`:where`). */
:where(.article-quote-text) {
  font-size: 2em;
  line-height: 1.3;
  text-align: center;
}
.article-quote-line {
  display: block;
}
/* Italics in a pull quote are its accent, not a slant: the words that the
   quote is for, as a slide's punchline (docs/article.md, "A pull quote"). */
.article-quote-text :is(em, i) {
  font-style: normal;
  color: var(--palette-accent);
}
.article-quote-measure .article-quote-line {
  width: max-content;
  white-space: nowrap;
}
</style>

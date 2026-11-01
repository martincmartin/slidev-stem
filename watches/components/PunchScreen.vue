<template>
  <div class="punch-screen">
    <!-- A slide's punchline, at its last click (docs/slide-patterns.md,
    "Punchlines"): a screen of paper over the whole slide, picture and all,
    with a few words in a screen's big type, its number in the accent
    (<em>). It is not `in-figure`: an article says the punchline in its
    narration, and a figure does not show the screen (docs/article.md). This
    comment is inside the root: before it, the build gives the component two
    roots, and the slide's v-click does not reach it. -->
    <div class="punch-screen-words"><slot /></div>
  </div>
</template>

<style scoped>
/* Over the slide's labels and title. Fraunces 600 at 76 px, centered: the
   Lessig screen of the visual language task (section 16). */
.punch-screen {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 0 60px;
  background: var(--palette-background);
}
.punch-screen-words {
  @apply font-serif;
  font-size: 76px;
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
  color: var(--palette-ink);
}
.punch-screen-words :slotted(em) {
  font-style: normal;
  color: var(--palette-accent);
}
</style>

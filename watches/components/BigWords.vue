<template>
  <div class="big-words">
    <!-- A few words in a screen's big type, its number in the accent (<em>),
    and a word that qualifies it in smaller type (<small>). Alone, it is a slide's punchline, at its
    last click (docs/slide-patterns.md, "Punchlines"): a screen of paper over
    the whole slide, picture and all. It is not `in-figure`: an article says
    the punchline in its narration, and a figure does not show the screen
    (docs/article.md). With `class="card"`, it is a card in the slide's
    layout (docs/slide-patterns.md, "A slide of words"). The class is static:
    a :class here would drop v-click's classes. This comment is inside the
    root: before it, the build gives the component two roots, and the slide's
    v-click does not reach it. -->
    <div class="big-words-text"><slot /></div>
  </div>
</template>

<style scoped>
/* Over the slide's labels and title. Fraunces 600 at 76 px, centered: the
   Lessig screen of the visual language task (section 16). */
.big-words {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 0 60px;
  background: var(--palette-background);
}
/* The panel is TimekeeperCard's. */
.big-words.card {
  position: static;
  z-index: auto;
  padding: 16px;
  white-space: nowrap;
  background: var(--palette-panel);
  border: 1px solid var(--palette-border);
  border-radius: 12px;
}
.big-words-text {
  @apply font-serif;
  font-size: 76px;
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
  color: var(--palette-ink);
}
.big-words-text :slotted(em) {
  font-style: normal;
  color: var(--palette-accent);
}
.big-words-text :slotted(small) {
  @apply font-sans;
  font-size: 32px;
  font-weight: 500;
}
</style>

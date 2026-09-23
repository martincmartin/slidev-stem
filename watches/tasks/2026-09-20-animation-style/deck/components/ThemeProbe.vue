<script setup lang="ts">
// One candidate theme, hosting the two dark-field drawing sets.
//
// The question this slide answers is narrow: with the drawings recoloured into
// the theme's own role colours, does the card still read as a hole punched in
// the slide, or as art sitting on it? Everything is shown at 122px, the size the
// deck really renders, because that is the size the decision is made at.
//
// The palette is passed in as props rather than looked up, so the slide source
// stays the record of what was tried — the theme-colours archive lost its
// scratch directory once and survived only because the palettes lived in the deck.
defineProps<{
  name: string;
  blurb: string; // what this theme is, in a few words
  bg: string;
  panel: string;
  border: string;
  ink: string;
  muted: string;
  accent: string;
  second: string;
  guide: string; // folder under /public/timekeepers for the recoloured Guide set
  vector: string; // ditto, Vector display
  metrics: string; // the measured numbers, so the eye and the arithmetic sit together
}>();

const ITEMS = ["sundial", "water-clock", "candle", "hourglass"];
const ROWS = [
  { label: "Guide", key: "guide" as const },
  { label: "Vector display", key: "vector" as const },
];
</script>

<template>
  <div class="tp" :style="{ background: bg, color: ink }">
    <div class="tp-head">
      <span class="tp-name">{{ name }}</span>
      <span class="tp-blurb" :style="{ color: muted }">{{ blurb }}</span>
      <span class="tp-sw">
        <i
          v-for="c in [panel, ink, muted, accent, second]"
          :key="c"
          :style="{ background: c, borderColor: border }"
        />
      </span>
    </div>

    <div v-for="row in ROWS" :key="row.label" class="tp-row">
      <span class="tp-label" :style="{ color: muted }">{{ row.label }}</span>
      <div class="tp-cards">
        <div
          v-for="it in ITEMS"
          :key="it"
          class="tp-card"
          :style="{ background: panel, borderColor: border }"
        >
          <img
            :src="`/timekeepers/${row.key === 'guide' ? guide : vector}/${it}.svg`"
            :alt="`${it}, ${name}`"
          />
        </div>
      </div>
    </div>

    <!-- The art next to the card's real typography. A drawing can survive on its
         own and still fight the 37px stat number beside it, which is the thing
         the deck actually puts there. --tk-* are what TimekeeperCard reads. -->
    <div
      class="tp-live"
      :style="{
        '--tk-ink': ink,
        '--tk-muted': muted,
        '--tk-accent': accent,
        '--tk-warn': second,
        '--tk-panel': panel,
        '--tk-border': border,
      }"
    >
      <TimekeeperCard
        name="Sundial"
        date="c. 1500 BCE"
        :img="`/timekeepers/${guide}/sundial.svg`"
        stat="±16 min"
        unit="the Sun vs. a steady clock"
        problem="No sun, no time"
      />
      <TimekeeperCard
        name="Hourglass"
        date="by 1338"
        :img="`/timekeepers/${vector}/hourglass.svg`"
        stat="?"
        unknown
        unit="no good data found"
        problem="Someone must flip it"
      />
    </div>

    <div class="tp-metrics" :style="{ color: muted, borderColor: border }">
      {{ metrics }}
    </div>
  </div>
</template>

<style scoped>
/* Fill the slide rather than sitting in it: the whole point is to see the theme's
   own field behind the cards, so a default white margin would defeat the slide. */
.tp {
  position: absolute;
  inset: 0;
  padding: 26px 48px 18px;
  font-family: "IBM Plex Sans", Arial, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tp-head {
  display: flex;
  align-items: baseline;
  gap: 14px;
}
.tp-name {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 34px;
  line-height: 1.05;
}
.tp-blurb {
  font-size: 17px;
}
.tp-sw {
  margin-left: auto;
  display: flex;
  gap: 5px;
}
.tp-sw i {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid;
  display: block;
}

.tp-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.tp-label {
  width: 104px;
  flex: none;
  font-size: 16px;
  text-align: right;
}
.tp-cards {
  display: flex;
  gap: 14px;
}
/* The card chrome the deck puts around every drawing. Without it this slide
   would not show the thing being judged, which is the seam at its edge. */
.tp-card {
  padding: 9px;
  border: 1px solid;
  border-radius: 12px;
}
.tp-card img {
  width: 122px;
  height: 97px;
  display: block;
  border-radius: 6px;
}

.tp-live {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 2px;
}

.tp-metrics {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 14px;
  line-height: 1.5;
}
</style>

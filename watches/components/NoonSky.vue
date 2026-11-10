<script setup lang="ts">
// The Longitude From Time slide's Sun and night (docs/globe.md, "The Longitude
// From Time slide"): an SVG over the canvas, which stays as the Earth turns under
// it. The Sun is on the Equator on the noon line. It is under the globe on the
// slide, so it fits, and the night is where it would be: a crescent whose inner
// edge is the half ellipse through the North Pole. It also has the word on the
// clock's dial, whose hands are on the canvas: the clock keeps Greenwich's time.
// In an article's figure, the clock is beside the globe (`FIGURE_CLOCK_AT`).
import { inject } from "vue";
import { FIGURE } from "../addons/narration/figure.ts";
import { FIGURE_CLOCK_AT, NOON_CLOCK, NOON_GLOBE } from "../globe/noon.ts";
import { ART } from "../watch/instance.ts";

const [width, height] = ART.scene.slide;
const [clockX, clockY] =
  inject(FIGURE, null) === null ? NOON_CLOCK.at : FIGURE_CLOCK_AT;
/** Under the pivot, above the 6. */
const wordY = clockY + 24;
const [x, y] = NOON_GLOBE.at;
const { radius, lat } = NOON_GLOBE;
const toPole = radius * Math.cos((lat * Math.PI) / 180);
const night = [
  `M${String(x - radius)} ${String(y)}`,
  `A${String(radius)} ${String(radius)} 0 0 1 ${String(x + radius)} ${String(y)}`,
  `A${String(radius)} ${String(toPole)} 0 0 0 ${String(x - radius)} ${String(y)}`,
  "Z",
].join(" ");

const SUN_RADIUS = 42;
/** Slide px under the slide's bottom edge. */
const SUN_BELOW = 18;
const sunY = height + SUN_BELOW;
/** Half the Sun's width at the slide's bottom edge, where it is cut. */
const sunHalf = Math.sqrt(SUN_RADIUS ** 2 - SUN_BELOW ** 2);
const sun = [
  `M${String(x - sunHalf)} ${String(height)}`,
  `A${String(SUN_RADIUS)} ${String(SUN_RADIUS)} 0 0 1 ${String(x + sunHalf)} ${String(height)}`,
  "Z",
].join(" ");
/** Each ray: within the Sun's width, all one length, just off its edge. */
const RAY_GAP = 6;
const RAY_LENGTH = 24;
const rays = [-34, -17, 0, 17, 34].map((offset) => {
  const start = Math.sqrt(SUN_RADIUS ** 2 - offset ** 2) + RAY_GAP;
  return {
    x: x + offset,
    from: sunY - start,
    to: sunY - start - RAY_LENGTH,
  };
});
</script>

<template>
  <svg
    class="noon-sky in-figure"
    :viewBox="`0 0 ${width} ${height}`"
    aria-hidden="true"
  >
    <!-- in-figure: an article's figure shows it over the picture. -->
    <path class="noon-night" :d="night" />
    <path class="noon-sun" :d="sun" />
    <line
      v-for="ray in rays"
      :key="ray.x"
      class="noon-ray"
      :x1="ray.x"
      :y1="ray.from"
      :x2="ray.x"
      :y2="ray.to"
    />
    <!-- no paint: it says where the clock is, on the canvas, so that an article's
    figure keeps it in its crop (ArticleFigure.vue, `measureLabels`) -->
    <circle :cx="clockX" :cy="clockY" :r="NOON_CLOCK.radius" fill="none" />
    <text class="noon-clock-word" :x="clockX" :y="wordY">Greenwich</text>
  </svg>
</template>

<style scoped>
/* The Sun in the second: "look here", as the noon line that it makes. */
.noon-sky {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.noon-night {
  fill: var(--palette-ink);
  opacity: 0.3;
}
.noon-sun {
  fill: var(--palette-second);
}
.noon-ray {
  stroke: var(--palette-second);
  stroke-width: 3;
  stroke-linecap: round;
}
/* 17 px: the floor (stem/docs/legibility.md, "Text sizes") */
.noon-clock-word {
  font:
    600 17px "IBM Plex Sans",
    sans-serif;
  fill: var(--palette-ink);
  text-anchor: middle;
}
</style>

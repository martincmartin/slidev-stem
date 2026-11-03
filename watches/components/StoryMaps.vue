<script setup lang="ts">
// The story maps over the globe (docs/globe.md, "The story maps"): an SVG
// above the canvas, with each map's sea and land in slide px. Each map rides
// the camera on its plane, and shows only near its own view
// (`mapOnSlide`): so a slide shows a map by naming its view, with no key of
// its own. The live layer (global-bottom.vue) and an article's figure
// (components/FigureLayer.vue) give their stage's frames, and the maps move
// after each frame, in the same animation frame; a still (slide-bottom.vue)
// gives its pose. `draw` sets the attributes itself, not through Vue: it
// runs at each frame.
// Over each map, its story's marks (docs/globe.md, "The marks"): the
// voyage's tracks, its dots and its ship, and the other marks, as
// `voyageAt` gives them for the step at the frame's time. A still shows its
// step settled, and its wind stands.
// Also the Longitude From Time slide's labels and ship (docs/globe.md, "The
// Longitude From Time slide"), which ride the globe as it turns, and show only
// while the camera is on that turn (`noonMarksAt`).
import {
  h,
  onBeforeUnmount,
  onMounted,
  useId,
  useTemplateRef,
  watch as onChange,
} from "vue";
import type { FunctionalComponent } from "vue";
import { MARGIN, mapOnSlide } from "../globe/maps.ts";
import { NOON_LABELS, NOON_SHIP_SCALE, noonMarksAt } from "../globe/noon.ts";
import { SHIP_FLAG, SHIP_PARTS, SHIP_SCALE } from "../globe/stories.ts";
import type { Story } from "../globe/stories.ts";
import { dayDots, voyageAt } from "../globe/voyage.ts";
import type { VoyageStep } from "../globe/voyage.ts";
import type { CameraPose } from "../webgl/scene.ts";
import type { FrameListener } from "../webgl/stage.ts";
import { ART, GLOBE } from "../watch/instance.ts";

const props = defineProps<{
  /** A still's pose. */
  pose?: CameraPose | undefined;
  /** A stage's `onFrame`: the maps move after each of its frames. */
  frames?: ((listener: FrameListener) => () => void) | undefined;
  /** The step of the marks: on the frames' clock, or settled for a still. */
  voyage: VoyageStep;
  /** An article's figure whose time stands: its wind stands, drawn, as in
   *  a still. */
  paused?: boolean;
}>();

const [width, height] = ART.scene.slide;
/** Each story's group: its map and its marks. */
const groups = new Map<Story, SVGGElement>();
/** A group's template ref: kept while it is mounted. */
function keep(story: Story, element: unknown): void {
  if (element instanceof SVGGElement) groups.set(story, element);
  else groups.delete(story);
}
/** The masks' ids: a printed deck holds a still's maps on every page. */
const masks = useId();
const point = ([x, y]: readonly [number, number]): string =>
  `${String(x)},${String(y)}`;
/** The ship's transform at a point. */
const shipAt = (at: readonly [number, number]): string =>
  `translate(${point(at)}) scale(${String(SHIP_SCALE)})`;
/** The ship's parts, in its own px, with its bow to the right: the pennant
 *  streams east whichever way it faces. */
const ShipParts: FunctionalComponent = () =>
  h("g", [
    h(
      "g",
      { class: "ship-facing" },
      SHIP_PARTS.map(({ kind, d }) => h("path", { class: kind, d })),
    ),
    h("path", { class: "ship-flag", d: SHIP_FLAG }),
  ]);

/** Show a mark at `opacity`, or hide it at 0. */
function fade(element: Element | undefined, opacity: number): void {
  element?.setAttribute("opacity", String(opacity));
  element?.setAttribute("visibility", opacity > 0 ? "visible" : "hidden");
}

/** Draw the marks of `story`, in its `group`, at `now`. */
function drawMarks(group: SVGGElement, story: Story, now: number): void {
  const voyage = voyageAt(story, props.voyage, now);
  const marks = group.querySelectorAll(":scope > .marks > .mark");
  const tracks = group.querySelectorAll(".track");
  const dots = group.querySelectorAll(".day-dots");
  const ship = group.querySelector(".ship");
  story.marks.forEach((mark, place) => {
    fade(marks[place], voyage?.marks.get(mark) ?? 0);
    const number = marks[place]?.querySelector(".count-number");
    if (mark.count && number)
      number.textContent = String(mark.count.perDay * (voyage?.days ?? 0));
  });
  story.legs.forEach((_, leg) => {
    const share = voyage?.tracks[leg];
    fade(tracks[leg], share == null ? 0 : 1);
    tracks[leg]?.setAttribute("stroke-dashoffset", String(1 - (share ?? 0)));
    const shown = voyage?.dots[leg] ?? 0;
    [...(dots[leg]?.children ?? [])].forEach((dot, day) => {
      fade(dot, day < shown ? 1 : 0);
    });
  });
  const at = voyage?.ship;
  fade(ship ?? undefined, at ? 1 : 0);
  if (at) {
    ship?.setAttribute("transform", shipAt(at.at));
    ship?.classList.toggle("west", at.heading === "west");
  }
  // for watch/slide-state.ts: what the voyage shows, however it was reached
  group.dataset["legs"] = String(
    voyage?.tracks.filter((share) => share !== null).length ?? 0,
  );
  group.dataset["ship"] = at
    ? `${point([Math.round(at.at[0]), Math.round(at.at[1])])} ${at.heading}`
    : "";
}

/** Each label that rides the globe: kept while it is mounted. */
const noonLabels = new Map<number, SVGTextElement>();
function keepNoonLabel(index: number, element: unknown): void {
  if (element instanceof SVGTextElement) noonLabels.set(index, element);
  else noonLabels.delete(index);
}
/** Their group, and the ship in it. */
const noonGroup = useTemplateRef<SVGGElement>("noonGroup");
const noonShip = useTemplateRef<SVGGElement>("noonShip");

/** Show and place the marks that ride the globe, for a frame at `pose`. */
function drawNoonLabels(pose: CameraPose): void {
  const group = noonGroup.value;
  if (!group) return;
  const marks = noonMarksAt(pose, ART.scene.slide);
  fade(group, marks ? 1 : 0);
  // for watch/slide-state.ts: where they are, however it was reached
  group.dataset["places"] = marks
    ? [...marks.labels, marks.ship]
        .map(([x, y]) => point([Math.round(x), Math.round(y)]))
        .join(" ")
    : "";
  noonShip.value?.setAttribute(
    "transform",
    marks
      ? `translate(${point(marks.ship)}) scale(${String(NOON_SHIP_SCALE)})`
      : "",
  );
  marks?.labels.forEach(([x, y], index) => {
    const label = noonLabels.get(index);
    label?.setAttribute("x", String(x + (NOON_LABELS[index]?.offset ?? 0)));
    label?.setAttribute("y", String(y));
  });
}

/** Place each map for a frame drawn at `pose`, and its marks at `now`. */
function draw(pose: CameraPose, now: number): void {
  drawNoonLabels(pose);
  for (const story of GLOBE.stories) {
    const group = groups.get(story);
    if (!group) continue;
    const { matrix, opacity } = mapOnSlide(story.placed, pose, ART.scene.slide);
    fade(group, opacity);
    if (opacity > 0) {
      group.setAttribute("transform", `matrix(${matrix.join(" ")})`);
      drawMarks(group, story, now);
    }
  }
}

let leave: (() => void) | undefined;

onMounted(() => {
  onChange(
    () => [props.pose, props.voyage] as const,
    ([pose]) => {
      if (pose) draw(pose, 0);
    },
    { immediate: true },
  );
  onChange(
    () => props.frames,
    (frames) => {
      leave?.();
      leave = frames?.(draw);
    },
    { immediate: true },
  );
});
onBeforeUnmount(() => leave?.());
</script>

<template>
  <svg
    class="story-maps"
    :class="{ still: pose !== undefined || paused }"
    :viewBox="`0 0 ${width} ${height}`"
    aria-hidden="true"
  >
    <!-- The land, clipped between the slide and the cut (`MARGIN`): a map
    that leaves shows smaller than the slide, and the coast line along the
    cut's edges would show. The clip is in each map's own px, so it rides
    with the map. The sea's rect ends at the slide: its color is the globe's
    sea, so its edge does not show. -->
    <clipPath :id="`${masks}-cut`">
      <rect
        :x="-MARGIN / 2"
        :y="-MARGIN / 2"
        :width="width + MARGIN"
        :height="height + MARGIN"
      />
    </clipPath>
    <g
      v-for="(story, index) in GLOBE.stories"
      :key="story.placed.map.name"
      :ref="(element) => keep(story, element)"
      :data-map="story.placed.map.name"
      opacity="0"
      visibility="hidden"
    >
      <mask :id="`${masks}-sea-${index}`">
        <rect fill="white" :width="width" :height="height" />
        <path fill="black" fill-rule="evenodd" :d="story.placed.land.land" />
      </mask>
      <rect class="story-sea" :width="width" :height="height" />
      <path
        class="story-land"
        :d="story.placed.land.land"
        :clip-path="`url(#${masks}-cut)`"
      />
      <g class="marks">
        <g
          v-for="mark in story.marks"
          :key="mark.name"
          class="mark"
          :data-mark="mark.name"
          :mask="
            mark.parts.some((part) => part.kind === 'gust')
              ? `url(#${masks}-sea-${index})`
              : undefined
          "
          visibility="hidden"
        >
          <path
            v-for="(part, gust) in mark.parts"
            :key="gust"
            :class="part.kind"
            :d="part.d"
            :pathLength="part.kind === 'gust' ? 1 : undefined"
            :style="
              part.kind === 'gust'
                ? { animationDelay: `${-gust * 0.9}s` }
                : undefined
            "
          />
          <g v-if="mark.ghost" class="ghost" :transform="shipAt(mark.ghost)">
            <ShipParts />
          </g>
          <text
            v-if="mark.label"
            :class="mark.label.kind"
            :x="mark.label.at[0]"
            :y="mark.label.at[1]"
          >
            {{ mark.label.text }}
          </text>
          <text
            v-if="mark.count"
            class="count-number"
            :x="mark.count.at[0]"
            :y="mark.count.at[1]"
          />
        </g>
      </g>
      <template v-for="leg in story.legs" :key="leg.name">
        <path
          class="track"
          :d="`M${leg.route.map(point).join('L')}`"
          pathLength="1"
          visibility="hidden"
        />
        <g class="day-dots">
          <circle
            v-for="(dot, day) in dayDots(leg)"
            :key="day"
            class="dot"
            :cx="dot[0]"
            :cy="dot[1]"
            r="4.5"
            visibility="hidden"
          />
        </g>
      </template>
      <g class="ship" visibility="hidden"><ShipParts /></g>
    </g>
    <g ref="noonGroup" class="noon-labels" visibility="hidden">
      <g ref="noonShip" class="ship west noon-ship"><ShipParts /></g>
      <text
        v-for="(label, index) in NOON_LABELS"
        :key="label.words"
        :ref="(element) => keepNoonLabel(index, element)"
        :class="{ 'noon-degrees': label.degrees }"
        :text-anchor="label.anchor"
        dy="0.35em"
      >
        {{ label.words }}
      </text>
    </g>
  </svg>
</template>

<style>
/* The sea in the water's wash, the land in the paper, and the coast in the
   subject, 3 px at every zoom, as the globe's (docs/globe.md). The marks
   are in the map's slide px: they grow with the map as the camera
   leaves. */
.story-maps {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.story-sea {
  fill: var(--palette-water-wash);
}
.story-land {
  fill: var(--palette-background);
  fill-rule: evenodd;
  stroke: var(--palette-subject);
  stroke-width: 3;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.story-maps .latitude {
  fill: none;
  stroke: var(--palette-ink);
  stroke-width: 2;
  stroke-dasharray: 8 7;
}
.story-maps .track {
  fill: none;
  stroke: var(--palette-ink);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 1;
}
.story-maps .dot {
  fill: var(--palette-ink);
  stroke: var(--palette-background);
  stroke-width: 2;
}
/* The ship, loosely HMS Centurion: the hull in the subject, the sails in
   its wash, a pennant in the second color. It turns about its middle. */
.story-maps .ship.west .ship-facing {
  transform: scaleX(-1);
}
.story-maps .ship-hull {
  fill: var(--palette-subject);
  stroke: var(--palette-subject);
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.story-maps .ship-wale {
  fill: none;
  stroke: var(--palette-background);
  stroke-width: 2;
}
.story-maps .ship-sail {
  fill: var(--palette-subject-wash);
  stroke: var(--palette-subject);
  stroke-width: 2;
  stroke-linejoin: round;
}
.story-maps .ship-line {
  fill: none;
  stroke: var(--palette-subject);
  stroke-width: 2.5;
  stroke-linecap: round;
}
.story-maps .ship-flag {
  fill: var(--palette-second);
}
/* Where a ship thought it was: the ship's outline in the paper, dashed,
   with no fill. */
.story-maps .ghost .ship-hull,
.story-maps .ghost .ship-sail,
.story-maps .ghost .ship-flag {
  fill: none;
  stroke: var(--palette-background);
  stroke-width: 2;
  stroke-dasharray: 4 3;
}
.story-maps .ghost .ship-line,
.story-maps .ghost .ship-wale {
  stroke: var(--palette-background);
  stroke-dasharray: 4 3;
}
/* The gap between where a ship was and where it thought it was. */
.story-maps .gap {
  fill: none;
  stroke: var(--palette-ink);
  stroke-width: 3;
  stroke-linecap: round;
}
.story-maps .scale {
  fill: none;
  stroke: var(--palette-ink);
  stroke-width: 3;
}
/* A count: what it counts at a label's size, and its number at the
   title's, with digits of one width, so that the number does not shift as
   it ticks. On the land, in ink with the paper's outline, as a label. */
.story-maps .count-label,
.story-maps .count-number {
  font-family: "IBM Plex Sans", sans-serif;
  font-weight: 600;
  fill: var(--palette-ink);
  stroke: var(--palette-background);
  stroke-width: 6px;
  stroke-linejoin: round;
  paint-order: stroke fill;
}
.story-maps .count-label {
  font-size: 24px;
}
.story-maps .count-number {
  font-size: 37px;
  font-variant-numeric: tabular-nums;
}
.story-maps .scale-label {
  font:
    600 18px "IBM Plex Sans",
    sans-serif;
  fill: var(--palette-ink);
  stroke: var(--palette-background);
  stroke-width: 5px;
  paint-order: stroke fill;
}
/* A label that rides the globe, over land and sea in turn: so always in ink,
   with the paper's outline, at a label's size. A meridian's label is smaller:
   two of them can be 42 px apart, and "30°" at 24 px is about 40 px wide. */
.story-maps .noon-labels text {
  font:
    600 24px "IBM Plex Sans",
    sans-serif;
  fill: var(--palette-ink);
  stroke: var(--palette-background);
  stroke-width: 6px;
  stroke-linejoin: round;
  paint-order: stroke fill;
}
.story-maps .noon-labels text.noon-degrees {
  font-size: 20px;
}
/* The ship is smaller here (NOON_SHIP_SCALE, 0.8): its own px for lines of 2
   slide px, the bottom of the stroke ladder. */
.story-maps .noon-ship .ship-sail,
.story-maps .noon-ship .ship-line,
.story-maps .noon-ship .ship-wale {
  stroke-width: 2.5;
}
/* The wind: each gust draws itself from west to east, curls, and fades. In
   a still, and in a paused figure, it stands, drawn: a figure paused from
   the start (reduced motion) would otherwise show a gust not yet drawn. */
.story-maps .gust {
  fill: none;
  stroke: var(--palette-background);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  animation: story-gust 3.6s linear infinite;
}
.story-maps.still .gust {
  animation: none;
}
@keyframes story-gust {
  0% {
    stroke-dashoffset: 1;
    opacity: 1;
  }
  45% {
    stroke-dashoffset: 0;
  }
  75% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}
</style>

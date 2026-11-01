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
import {
  h,
  onBeforeUnmount,
  onMounted,
  useId,
  useTemplateRef,
  watch as onChange,
} from "vue";
import type { FunctionalComponent } from "vue";
import { mapOnSlide } from "../globe/maps.ts";
import { SHIP_FLAG, SHIP_PARTS, SHIP_SCALE } from "../globe/stories.ts";
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
}>();

const [width, height] = ART.scene.slide;
const groups = useTemplateRef<SVGGElement[]>("groups");
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

/** Draw the marks of the story at `index`, in `group`, at `now`. */
function drawMarks(group: SVGGElement, index: number, now: number): void {
  const story = GLOBE.stories[index];
  const voyage = story && voyageAt(story, props.voyage, now);
  const marks = group.querySelectorAll(":scope > .marks > .mark");
  const tracks = group.querySelectorAll(".track");
  const dots = group.querySelectorAll(".day-dots");
  const ship = group.querySelector(".ship");
  story?.marks.forEach((mark, place) => {
    fade(marks[place], voyage?.marks.get(mark) ?? 0);
  });
  story?.legs.forEach((_, leg) => {
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
}

/** Place each map for a frame drawn at `pose`, and its marks at `now`. */
function draw(pose: CameraPose, now: number): void {
  GLOBE.maps.forEach((placed, index) => {
    const group = groups.value?.[index];
    if (!group) return;
    const { matrix, opacity } = mapOnSlide(placed, pose, ART.scene.slide);
    fade(group, opacity);
    if (opacity > 0) {
      group.setAttribute("transform", `matrix(${matrix.join(" ")})`);
      drawMarks(group, index, now);
    }
  });
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
    :class="{ still: pose !== undefined }"
    :viewBox="`0 0 ${width} ${height}`"
    aria-hidden="true"
  >
    <g
      v-for="(placed, index) in GLOBE.maps"
      ref="groups"
      :key="placed.map.name"
      opacity="0"
      visibility="hidden"
    >
      <mask :id="`${masks}-sea-${index}`">
        <rect fill="white" :width="width" :height="height" />
        <path fill="black" fill-rule="evenodd" :d="placed.land.land" />
      </mask>
      <rect class="story-sea" :width="width" :height="height" />
      <path class="story-land" :d="placed.land.land" />
      <g class="marks">
        <g
          v-for="mark in GLOBE.stories[index]?.marks"
          :key="mark.name"
          class="mark"
          :mask="
            mark.name === 'wind' ? `url(#${masks}-sea-${index})` : undefined
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
            class="scale-label"
            :x="mark.label.at[0]"
            :y="mark.label.at[1]"
          >
            {{ mark.label.text }}
          </text>
        </g>
      </g>
      <template v-for="leg in GLOBE.stories[index]?.legs" :key="leg.name">
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
.story-maps .scale-label {
  font:
    600 18px "IBM Plex Sans",
    sans-serif;
  fill: var(--palette-ink);
  stroke: var(--palette-background);
  stroke-width: 5px;
  paint-order: stroke fill;
}
/* The wind: each gust draws itself from west to east, curls, and fades. In
   a still, it stands, drawn. */
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

<script setup lang="ts">
// A label on Part 2's globe or story map (docs/globe.md, "The words"): words
// at a place of the slide's view. It is placed from an anchor: a place
// (`on`, degrees), a dashed ship (`mark`) or the end of a leg (`leg`) of the
// view's story, as the frontmatter names them; then `offset` px to its top
// left, or to its centre if `centred`. With no anchor, `offset` is its top
// left on the slide. A leader can point at a place (`pointsTo`), and stops
// `stop` px short of it (stem/docs/illustrations.md, "Leaders").
//
// Where only the sea is under its box, its words are in the paper, with no
// outline; else in ink, with the paper's outline (`overSea`). The box is
// where the browser lays the words out, so the component measures it, once
// the fonts have loaded and again when its size changes, as WatchCallout.vue
// does. The slide decides when it shows (`v-click`, or `v-click.hide` for a
// label from click 0, where a range cannot start) and when it dims
// (`:dimmed="$clicks >= 2"`): a prop, as `v-click.hide` gives no class to
// dim by. Do not bind `:class` on the root, as `v-click` puts its classes
// there.
import { computed, ref, useTemplateRef } from "vue";
import { onLaidOut } from "./laid-out.ts";
import { anchorPoint, overSea } from "../globe/labels.ts";
import type { WordsBox } from "../globe/labels.ts";
import { LEADER_GAP, straightStart, toward } from "../watch/callouts.ts";
import { GLOBE } from "../watch/instance.ts";

const props = withDefaults(
  defineProps<{
    /** The view that the label is on: a name of `artView`. */
    view: string;
    on?: [number, number] | undefined;
    mark?: string | undefined;
    leg?: string | undefined;
    offset?: [number, number];
    centred?: boolean;
    pointsTo?: [number, number] | undefined;
    stop?: number;
    /** The label is no longer the focus: its colors mix halfway toward
     *  what is under it (style.css, "TEXT DIMS"). */
    dimmed?: boolean;
  }>(),
  {
    on: undefined,
    mark: undefined,
    leg: undefined,
    offset: () => [0, 0],
    centred: false,
    pointsTo: undefined,
    stop: LEADER_GAP,
    dimmed: false,
  },
);

const picture = computed(() => {
  const found = GLOBE.pictures.find(({ view }) => view.name === props.view);
  if (!found) throw new Error(`a label: no view "${props.view}" of the globe`);
  return found;
});
const anchor = computed(() =>
  anchorPoint(picture.value, {
    on: props.on,
    mark: props.mark,
    leg: props.leg,
  }),
);
const text = useTemplateRef<HTMLDivElement>("text");
/** The words' size in px, once laid out. */
const size = ref<[number, number]>();
const box = computed((): WordsBox | undefined => {
  if (!size.value) return undefined;
  const [width, height] = size.value;
  const [x, y] = [
    anchor.value[0] + props.offset[0],
    anchor.value[1] + props.offset[1],
  ];
  return props.centred
    ? { left: x - width / 2, top: y - height / 2, width, height }
    : { left: x, top: y, width, height };
});
const sea = computed(() =>
  box.value ? overSea(picture.value, box.value) : false,
);
const leader = computed(() => {
  const to = props.pointsTo && picture.value.point(props.pointsTo);
  if (!to || !box.value) return undefined;
  const { left, top, width, height } = box.value;
  const start = straightStart(
    [left + width / 2, top + height / 2],
    width,
    height,
    to,
  );
  const length = Math.hypot(to[0] - start[0], to[1] - start[1]);
  const end = toward(start, to, length - props.stop);
  return `M${start.join(" ")} L${end.join(" ")}`;
});

function measure(): void {
  const words = text.value;
  if (!words || words.offsetWidth === 0) return; // the slide is hidden
  size.value = [words.offsetWidth, words.offsetHeight];
}

onLaidOut(text, measure);
</script>

<template>
  <div class="map-label in-figure">
    <!-- in-figure: an article's figure shows it over the picture. This
    comment is inside the root: before it, the build gives the component two
    roots, and the slide's class and v-click do not reach it. -->
    <div
      class="map-label-body"
      :class="{ 'map-label-sea': sea, 'map-label-dimmed': dimmed }"
    >
      <svg
        v-if="leader"
        class="map-label-leader"
        width="1"
        height="1"
        aria-hidden="true"
      >
        <path :d="leader" />
      </svg>
      <div
        ref="text"
        class="map-label-text"
        :style="{
          left: `${String(box?.left ?? anchor[0] + offset[0])}px`,
          top: `${String(box?.top ?? anchor[1] + offset[1])}px`,
        }"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 24 px semibold, in ink with the paper's outline over the land; over the
   sea alone, in the paper with no outline. A dimmed label mixes toward what
   is under it: ink toward the paper, the paper toward the sea (style.css,
   "TEXT DIMS"). The leader is in the label's color, 4 px. */
.map-label {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* text fades (style.css, "TEXT FADES"), not v-click's 0.1 s */
  transition: opacity var(--text-fade);
}
.map-label-body {
  transition: --text-dim var(--text-fade);
  color: color-mix(
    in srgb,
    var(--palette-ink),
    var(--palette-background) var(--text-dim)
  );
}
.map-label-body.map-label-sea {
  color: color-mix(
    in srgb,
    var(--palette-background),
    var(--palette-water-wash) var(--text-dim)
  );
}
.map-label-dimmed {
  --text-dim: var(--text-dimmed);
}
.map-label-text {
  position: absolute;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
}
.map-label-sea .map-label-text {
  -webkit-text-stroke: 0;
}
.map-label-leader {
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
}
.map-label-leader path {
  fill: none;
  stroke: currentColor;
  stroke-width: 4;
  stroke-linecap: round;
}
/* A yell: the word on its own line, at the title's size and face. */
.map-label-text :slotted(.shout) {
  @apply font-serif;
  font-size: 37px;
  line-height: 1.1;
}
</style>

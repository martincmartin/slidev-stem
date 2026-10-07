<script setup lang="ts">
// A callout over the watch: a label, and a straight leader from one word of
// the label to a point of the picture. The slide places the label (`left`,
// `top`, its top left corner in slide px) and marks the word with
// `<span class="callout-word">`; the leader leaves the word's box on the side
// that faces `to`, and stops `stop` px short of it. With `clear` (closed
// outlines, in slide px), it stops `stop` px short of where it first meets
// one of them instead, so it ends outside them. `arrow` (none by default)
// is a path drawn with the callout, from its tail to its head. A `bent`
// leader leaves the word's side that faces `to`, runs level for ELBOW_RUN
// px, and turns there to `to`: for a word with another line of the label
// under or over it, which a straight leader would cross.
//
// The leader starts where the browser lays the word out, so the component
// measures it, and again when the label's size changes (a font loads, or the
// slide is shown). The slide decides when the callout appears (`v-click`):
// do not bind `:class` on the root, as `v-click` puts its classes there.
// docs/watch.md, "Slide 4: the escapement".
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { at } from "../webgl/checked.ts";
import type { Point2 } from "../webgl/mesh.ts";
import { firstCrossing } from "../watch/callouts.ts";

const props = withDefaults(
  defineProps<{
    to: Point2;
    left: number;
    top: number;
    stop?: number;
    arrow?: readonly Point2[];
    clear?: readonly (readonly Point2[])[];
    bent?: boolean;
  }>(),
  { stop: 0, arrow: () => [], clear: () => [], bent: false },
);

/** px between the word's box and the leader. */
const GAP = 4;
/** A bent leader's level run, in px: slide 2's (`LeaderDesign`, from `start`
 *  to `elbow`, in art/diving_board.py). Keep them equal. */
const ELBOW_RUN = 40;
/** The arrow's head: its length and its half width, in px. */
const HEAD_LENGTH = 16;
const HEAD_HALF_WIDTH = 9;

const label = useTemplateRef<HTMLDivElement>("label");
/** The word's box in slide px: left, top, width, height. */
const word = ref<[number, number, number, number]>();
let observer: ResizeObserver | undefined;

function measure(): void {
  const box = label.value;
  if (!box) return;
  const found = box.querySelector<HTMLElement>(".callout-word");
  if (!found) throw new Error("a callout needs a <span class='callout-word'>");
  if (found.offsetWidth === 0) return; // not laid out: the slide is hidden
  word.value = [
    props.left + found.offsetLeft,
    props.top + found.offsetTop,
    found.offsetWidth,
    found.offsetHeight,
  ];
}

onMounted(() => {
  measure();
  observer = new ResizeObserver(measure);
  if (label.value) observer.observe(label.value);
  void document.fonts.ready.then(measure);
});
onBeforeUnmount(() => {
  observer?.disconnect();
});

const toward = (from: Point2, to: Point2, distance: number): Point2 => {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const fraction = length > 0 ? distance / length : 0;
  return [
    from[0] + (to[0] - from[0]) * fraction,
    from[1] + (to[1] - from[1]) * fraction,
  ];
};

/** Where a straight leader from the word's centre to `to` leaves the word's
 *  box, grown by GAP. */
function straightStart(centre: Point2, width: number, height: number): Point2 {
  const [dx, dy] = [props.to[0] - centre[0], props.to[1] - centre[1]];
  const reach = Math.min(
    dx === 0 ? Infinity : (width / 2 + GAP) / Math.abs(dx),
    dy === 0 ? Infinity : (height / 2 + GAP) / Math.abs(dy),
  );
  return [centre[0] + dx * reach, centre[1] + dy * reach];
}

const leader = computed(() => {
  if (!word.value) return undefined;
  const [left, top, width, height] = word.value;
  const centre: Point2 = [left + width / 2, top + height / 2];
  // a bent leader: level from the side of the word that faces `to`
  const side = Math.sign(props.to[0] - centre[0]) || 1;
  const corners: Point2[] = props.bent
    ? [
        [centre[0] + side * (width / 2 + GAP), centre[1]],
        [centre[0] + side * (width / 2 + GAP + ELBOW_RUN), centre[1]],
      ]
    : [straightStart(centre, width, height)];
  // the last straight part ends at `to`, or short of it
  const from = at(corners, corners.length - 1);
  const length = Math.hypot(props.to[0] - from[0], props.to[1] - from[1]);
  const meets = firstCrossing(from, props.to, props.clear) ?? 1;
  const end = toward(from, props.to, meets * length - props.stop);
  return `M${[...corners, end].map((point) => point.join(" ")).join(" L")}`;
});

const arrowPaths = computed(() => {
  const points = props.arrow;
  if (points.length < 2) return undefined;
  const head = at(points, points.length - 1);
  const before = at(points, points.length - 2);
  const length = Math.hypot(head[0] - before[0], head[1] - before[1]);
  const along: Point2 = [
    (head[0] - before[0]) / length,
    (head[1] - before[1]) / length,
  ];
  const base: Point2 = [
    head[0] - along[0] * HEAD_LENGTH,
    head[1] - along[1] * HEAD_LENGTH,
  ];
  const side: Point2 = [
    -along[1] * HEAD_HALF_WIDTH,
    along[0] * HEAD_HALF_WIDTH,
  ];
  // the line ends inside the head, so its round cap does not show at the tip
  const shaft = [...points.slice(0, -1), toward(base, head, HEAD_LENGTH / 3)];
  return {
    shaft: `M${shaft.map((point) => point.join(" ")).join(" L")}`,
    head: `M${head.join(" ")} L${String(base[0] + side[0])} ${String(base[1] + side[1])} L${String(base[0] - side[0])} ${String(base[1] - side[1])} Z`,
  };
});
</script>

<template>
  <div class="callout">
    <svg class="callout-art" width="1" height="1" aria-hidden="true">
      <path v-if="leader" class="callout-leader" :d="leader" />
      <template v-if="arrowPaths">
        <path class="callout-arrow" :d="arrowPaths.shaft" />
        <path class="callout-head" :d="arrowPaths.head" />
      </template>
    </svg>
    <div
      ref="label"
      class="callout-label"
      :style="{ left: `${String(left)}px`, top: `${String(top)}px` }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* The leader is in ink, at 4 px, the width of every leader (stem/docs/
   illustrations.md, "Leaders"). The arrow shows a force that acts on the
   watch: muted, the art's colour for what acts on the subject, at 4 px
   (docs/watch.md, "The callouts"). */
.callout {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.callout-art {
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
}
.callout-leader,
.callout-arrow {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.callout-leader {
  stroke: var(--palette-ink);
  stroke-width: 4;
}
.callout-arrow {
  stroke: var(--palette-muted);
  stroke-width: 4;
}
.callout-head {
  fill: var(--palette-muted);
}
.callout-label {
  position: absolute;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}
</style>

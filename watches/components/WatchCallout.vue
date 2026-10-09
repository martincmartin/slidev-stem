<script setup lang="ts">
// A callout over the watch: a label, and a straight leader from one word of
// the label to a point of the picture. The leader and the label are ink. With
// `keyword`, the word and its leader are in the second instead: the leader
// then points at what that word names ("Pallet"), not at the whole label
// ("Pallet blocks wheel"). stem/docs/illustrations.md, "Leaders". The slide places the label (`left`,
// `top`, its top left corner in slide px) and marks the word with
// `<span class="callout-word">`; the leader leaves the word's box on the side
// that faces `to`, and stops `stop` px short of it. With `clear` (closed
// outlines, in slide px), it stops `stop` px short of where it first meets
// one of them instead, so it ends outside them. A `bent` leader leaves the word's side that faces `to`, runs level for ELBOW_RUN
// px, and turns there to `to`: for a word with another line of the label
// under or over it, which a straight leader would cross. With `showLeader`
// false, the leader fades out and the label stays: for a part that moves
// away from where the leader ends.
//
// The leader starts where the browser lays the word out, so the component
// measures it, and again when the label's size changes (a font loads, or the
// slide is shown). The slide decides when the callout appears (`v-click`):
// do not bind `:class` on the root, as `v-click` puts its classes there.
// docs/watch.md, "The Escapement slide".
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
} from "vue";
import { at } from "../webgl/checked.ts";
import type { Point2 } from "../webgl/mesh.ts";
import { firstCrossing } from "../watch/callouts.ts";

const props = withDefaults(
  defineProps<{
    to: Point2;
    left: number;
    top: number;
    stop?: number;
    clear?: readonly (readonly Point2[])[];
    bent?: boolean;
    showLeader?: boolean;
    keyword?: boolean;
  }>(),
  {
    stop: 0,
    clear: () => [],
    bent: false,
    showLeader: true,
    keyword: false,
  },
);

/** px between the word's box and the leader. */
const GAP = 4;
/** A bent leader's level run, in px: the Hairspring slide's (`LeaderDesign`, from `start`
 *  to `elbow`, in art/diving_board.py). Keep them equal. */
const ELBOW_RUN = 40;

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

// Not an oversight: nothing here makes the browser compute the page's styles
// (a size, or `document.fonts.ready`) at once. Vue runs each callout's
// `v-click` just before its onMounted, so a later callout is not hidden yet:
// styles computed now would show it, and it would fade out from shown when
// the page loads. The observer's first call measures the word once the page
// is laid out, before the first paint; the fonts are awaited after Vue's
// flush, when every callout's `v-click` has run.
onMounted(() => {
  observer = new ResizeObserver(measure);
  if (label.value) observer.observe(label.value);
  void nextTick(() => document.fonts.ready.then(measure));
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
</script>

<template>
  <div class="callout">
    <svg
      class="callout-art"
      :class="{ 'callout-keyword': keyword }"
      width="1"
      height="1"
      aria-hidden="true"
    >
      <path
        v-if="leader"
        class="callout-leader"
        :class="{ 'callout-leader-hidden': !showLeader }"
        :d="leader"
      />
    </svg>
    <div
      ref="label"
      class="callout-label"
      :class="{ 'callout-keyword': keyword }"
      :style="{ left: `${String(left)}px`, top: `${String(top)}px` }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* The leader is in ink, the colour of its label, at 4 px, the width of every
   leader (stem/docs/illustrations.md, "Leaders"). A keyword callout draws its
   word and its leader in the second, the art's colour for "look here". */
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
.callout-leader {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.callout-leader {
  stroke: var(--palette-ink);
  stroke-width: 4;
  /* it fades as text does (style.css, "TEXT FADES") */
  transition: opacity var(--text-fade);
}
.callout-leader-hidden {
  opacity: 0;
}
.callout-label {
  position: absolute;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}
.callout-keyword .callout-leader {
  stroke: var(--palette-second);
}
.callout-label.callout-keyword :slotted(.callout-word) {
  color: var(--palette-second);
}
</style>

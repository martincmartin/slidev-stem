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
// under or over it, which a straight leader would cross. A `fromEnd` leader
// is for a one-line label with its part to the left or below: it aims at a
// point half the cap height in from the label's left edge and up from its
// baseline, and starts GAP outside the quarter-plane that the left edge and
// the baseline bound. So, followed back, it runs into the first letter, and
// its start does not depend on the words. With `showLeader`
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
    fromEnd?: boolean;
    showLeader?: boolean;
    keyword?: boolean;
  }>(),
  {
    stop: 0,
    clear: () => [],
    bent: false,
    fromEnd: false,
    showLeader: true,
    keyword: false,
  },
);

/** px between the word's box and the leader. */
const GAP = 4;
/** A bent leader's level run, in px: the Hairspring slide's (`LeaderDesign`, from `start`
 *  to `elbow`, in art/diving_board.py). Keep them equal. */
const ELBOW_RUN = 40;
/** The label's type: the theme's sans, IBM Plex Sans, at this size (px) and
 *  line height. Set here, not in a stylesheet, as a `fromEnd` leader is
 *  placed from them. */
const LABEL_SIZE = 28;
const LABEL_LINE_HEIGHT = 1.2;
/** IBM Plex Sans's metrics, in ems (its OS/2 and hhea tables). The font sets
 *  USE_TYPO_METRICS, and its typo and hhea ascent and descent agree, so every
 *  browser lays a line out with them. */
const PLEX_SANS = { ascent: 1.025, descent: 0.275, capHeight: 0.698 };

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

/** Where a `fromEnd` leader starts: on the line from its aim, half the cap
 *  height in from the label's left edge and up from its first baseline, to
 *  `to`, GAP outside the quarter-plane right of the edge and above the
 *  baseline. */
function fromEndStart(): Point2 {
  const halfLeading =
    (LABEL_LINE_HEIGHT - PLEX_SANS.ascent - PLEX_SANS.descent) / 2;
  const baseline = props.top + (halfLeading + PLEX_SANS.ascent) * LABEL_SIZE;
  const halfCap = (PLEX_SANS.capHeight * LABEL_SIZE) / 2;
  const aim: Point2 = [props.left + halfCap, baseline - halfCap];
  const [dx, dy] = [props.to[0] - aim[0], props.to[1] - aim[1]];
  const reach = Math.min(
    dx < 0 ? (halfCap + GAP) / -dx : Infinity,
    dy > 0 ? (halfCap + GAP) / dy : Infinity,
  );
  if (reach === Infinity) {
    throw new Error("a fromEnd leader's part must be left of or below it");
  }
  return [aim[0] + dx * reach, aim[1] + dy * reach];
}

/** Where the leader leaves the label, then its corner if it bends; or
 *  `undefined` while the word is not measured. */
function corners(): Point2[] | undefined {
  if (props.fromEnd) return [fromEndStart()];
  if (!word.value) return undefined;
  const [left, top, width, height] = word.value;
  const centre: Point2 = [left + width / 2, top + height / 2];
  // a bent leader: level from the side of the word that faces `to`
  const side = Math.sign(props.to[0] - centre[0]) || 1;
  return props.bent
    ? [
        [centre[0] + side * (width / 2 + GAP), centre[1]],
        [centre[0] + side * (width / 2 + GAP + ELBOW_RUN), centre[1]],
      ]
    : [straightStart(centre, width, height)];
}

const leader = computed(() => {
  const points = corners();
  if (!points) return undefined;
  // the last straight part ends at `to`, or short of it
  const from = at(points, points.length - 1);
  const length = Math.hypot(props.to[0] - from[0], props.to[1] - from[1]);
  const meets = firstCrossing(from, props.to, props.clear) ?? 1;
  const end = toward(from, props.to, meets * length - props.stop);
  return `M${[...points, end].map((point) => point.join(" ")).join(" L")}`;
});
</script>

<template>
  <div class="callout in-figure">
    <!-- in-figure: an article's figure shows it over the picture. This
    comment is inside the root: before it, the build gives the component two
    roots, and the slide's class and v-click do not reach it. -->

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
      :style="{
        left: `${String(left)}px`,
        top: `${String(top)}px`,
        fontSize: `${String(LABEL_SIZE)}px`,
        lineHeight: String(LABEL_LINE_HEIGHT),
      }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* The leader is in ink, the colour of its label, at 4 px, the width of every
   leader (stem/docs/illustrations.md, "Leaders"). A keyword callout draws its
   word and its leader in the second, the art's colour for "look here". Each
   colour mixes toward the paper by --text-dim, so a slide can dim the
   callout (style.css, "TEXT DIMS"). */
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
  stroke: color-mix(
    in srgb,
    var(--palette-ink),
    var(--palette-background) var(--text-dim)
  );
  stroke-width: 4;
  /* it fades as text does (style.css, "TEXT FADES") */
  transition: opacity var(--text-fade);
}
.callout-leader-hidden {
  opacity: 0;
}
.callout-label {
  position: absolute;
  color: color-mix(
    in srgb,
    var(--palette-ink),
    var(--palette-background) var(--text-dim)
  );
  font-weight: 600;
  white-space: nowrap;
}
.callout-keyword .callout-leader {
  stroke: color-mix(
    in srgb,
    var(--palette-second),
    var(--palette-background) var(--text-dim)
  );
}
.callout-label.callout-keyword :slotted(.callout-word) {
  color: color-mix(
    in srgb,
    var(--palette-second),
    var(--palette-background) var(--text-dim)
  );
}
</style>

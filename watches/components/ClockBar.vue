<script setup lang="ts">
// One clock on a timeline: its photo, and a bar from the year it began to the year
// it was done (docs/slide-patterns.md, "A timeline can be a slide's picture").
// The photo shows large at `bigFrom` (`big`, in the slide's px), and at `dockAt`
// it moves to the start of its bar, at its row; then the bar and the words under
// it (`words`) fade in. The slide sets, on a parent that covers the slide: the
// scale (--first-year, --px-a-year), where the rows start (--rows-left,
// --rows-top), the photo's docked size and gap, the row pitch, and the move's
// length (--clock-move). A docked clock has the accent until `dimAt`, when the
// focus moves to a later clock; then its bar is grey and its words dim.
import { useSlideContext } from "@slidev/client";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    picture: string;
    alt: string;
    from: number;
    to: number;
    /** What happened, under the bar. */
    words: string;
    /** Its row on the timeline, from 0 at the top. */
    row: number;
    /** The photo's large frame, before it docks: the slide's px. Give it the
     *  picture's own aspect ratio, so that it shows all of the picture. */
    big: { left: number; top: number; width: number; height: number };
    /** The click at which the large photo fades in. */
    bigFrom?: number;
    /** The click at which the photo docks, and the bar and words fade in. */
    dockAt: number;
    /** The click at which the focus moves to a later clock, and this one
     *  dims; none for the last. */
    dimAt?: number | undefined;
  }>(),
  { bigFrom: 0, dimAt: undefined },
);

if (!(props.bigFrom < props.dockAt)) {
  throw new Error(
    `ClockBar ${props.picture}: bigFrom (${String(props.bigFrom)}) must come before dockAt (${String(props.dockAt)})`,
  );
}
if (props.dimAt !== undefined && !(props.dockAt < props.dimAt)) {
  throw new Error(
    `ClockBar ${props.picture}: dockAt (${String(props.dockAt)}) must come before dimAt (${String(props.dimAt)})`,
  );
}

const source = `${import.meta.env.BASE_URL}${props.picture}`;
// The click of this slide, or of the printed page: never the global nav.
const { $clicks } = useSlideContext();
const shown = computed(() => $clicks.value >= props.bigFrom);
const docked = computed(() => $clicks.value >= props.dockAt);
const dimmed = computed(
  () => props.dimAt !== undefined && $clicks.value >= props.dimAt,
);
</script>

<template>
  <div
    class="clock-bar"
    :class="{ docked, dimmed }"
    :style="{
      '--from': from,
      '--to': to,
      '--row': row,
      '--big-left': `${big.left}px`,
      '--big-top': `${big.top}px`,
      '--big-width': `${big.width}px`,
      '--big-height': `${big.height}px`,
    }"
  >
    <img class="clock-photo" :class="{ shown }" :src="source" :alt="alt" />
    <div class="clock-track">
      <div class="clock-span"></div>
      <div class="clock-words text-dims">{{ words }}</div>
    </div>
  </div>
</template>

<style scoped>
/* The photo and the track are placed in the slide's px: the containing block is
   the slide's parent of the rows, which covers the slide. A row's top is its
   index times the pitch, so the photo can find its docked place in CSS. */
.clock-photo,
.clock-track {
  position: absolute;
  --row-top: calc(var(--rows-top) + var(--row) * var(--clock-row-pitch));
  --bar-left: calc(
    var(--rows-left) + var(--clock-photo-size) + var(--clock-photo-gap) +
      (var(--from) - var(--first-year)) * var(--px-a-year)
  );
}

/* Large, until it docks: on top of the timeline. object-fit crops it to a
   square as it shrinks, so the crop moves with the size. Going back, the bar
   and words fade out first, then the photo moves (docs/navigation.md, "Text
   timing"). */
.clock-photo {
  z-index: 1;
  left: var(--big-left);
  top: var(--big-top);
  width: var(--big-width);
  height: var(--big-height);
  object-fit: cover;
  border-radius: 4px;
  opacity: 0;
  transition-property: left, top, width, height, opacity;
  transition-duration:
    var(--clock-move), var(--clock-move), var(--clock-move), var(--clock-move),
    var(--text-fade);
  transition-timing-function: ease-in-out;
  transition-delay:
    var(--text-fade), var(--text-fade), var(--text-fade), var(--text-fade), 0s;
}
.clock-photo.shown {
  opacity: 1;
}
.docked .clock-photo {
  left: calc(
    var(--bar-left) - var(--clock-photo-gap) - var(--clock-photo-size)
  );
  top: var(--row-top);
  width: var(--clock-photo-size);
  height: var(--clock-photo-size);
  transition-delay: 0s;
}

/* The bar and the words fade in when the photo has docked, and fade out at
   once when it leaves. */
.clock-track {
  left: var(--bar-left);
  top: var(--row-top);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  opacity: 0;
  transition: opacity var(--text-fade);
}
.docked .clock-track {
  opacity: 1;
  transition-delay: var(--clock-move);
}
.clock-span {
  width: calc((var(--to) - var(--from)) * var(--px-a-year));
  height: 30px;
  background: var(--palette-accent);
  border-radius: 4px;
  transition: background-color var(--text-fade);
}
.dimmed .clock-span {
  background: var(--palette-muted);
}
.dimmed .clock-words {
  --text-dim: var(--text-dimmed);
}
</style>

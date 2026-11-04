<script setup lang="ts">
// Words that run on their own while the slide is the current one (docs/slide-patterns.md,
// "Words that run on their own"). A screen's animation is its timer: when it finishes,
// the next screen starts. They start again from the first screen each time the slide
// starts. Off the current slide (a printed page, a preview), the first screen stands
// still. The song lines are in a file beside the worktrees, not in this repo: with no
// such file, as on the publish run, the glob finds nothing, and the titles show.
import { useNav, useSlideContext } from "@slidev/client";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { fadeFrames, songScreens, titleScreens } from "../watch/songs.ts";

const props = defineProps<{ titles: unknown; secondsATitle: unknown }>();

const [songs] = Object.values(
  import.meta.glob<unknown>("../../../stem-private/watches/songs.json", {
    eager: true,
    import: "default",
  }),
);
const screens =
  songs === undefined
    ? titleScreens(props.titles, props.secondsATitle)
    : songScreens(songs);
const shown = ref(0);
const screen = computed(() => {
  const current = screens[shown.value];
  if (current === undefined) throw new Error("no such screen");
  return current;
});
const words = useTemplateRef<HTMLElement>("words");
const { $page, $renderContext } = useSlideContext();
const { currentSlideNo, isPrintMode } = useNav();
const active = computed(
  () =>
    !isPrintMode.value &&
    ($renderContext.value === "slide" ||
      $renderContext.value === "presenter") &&
    $page.value === currentSlideNo.value,
);
let playing: Animation | undefined;

function stop(): void {
  playing?.cancel();
  playing = undefined;
  shown.value = 0;
}

/** The house's fade (style.css), or none for a viewer who asks for less motion. */
function fadeSeconds(element: HTMLElement): number {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  return Number.parseFloat(
    getComputedStyle(element).getPropertyValue("--text-fade"),
  );
}

async function play(index: number): Promise<void> {
  shown.value = index;
  await nextTick();
  const element = words.value;
  if (element === null || !active.value) return;
  const { seconds } = screen.value;
  const frames = fadeFrames(seconds, fadeSeconds(element));
  const next = element.animate(frames, {
    duration: seconds * 1000,
    fill: "both",
  });
  // A finished animation holds its last frame until it is cancelled: the old screen
  // stays faded out until this one has taken over.
  playing?.cancel();
  playing = next;
  next.onfinish = () => {
    void play((index + 1) % screens.length);
  };
}

watch(
  active,
  (isActive) => {
    stop();
    if (isActive) void play(0);
  },
  { immediate: true },
);
onBeforeUnmount(stop);
</script>

<template>
  <div class="song-lines">
    <div ref="words">
      <div v-for="line in screen.lines" :key="line">{{ line }}</div>
    </div>
  </div>
</template>

<style scoped>
.song-lines {
  font-size: 27px;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  white-space: nowrap;
}
</style>

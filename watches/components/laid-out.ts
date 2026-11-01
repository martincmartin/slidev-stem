import { nextTick, onBeforeUnmount, onMounted } from "vue";
import type { Ref } from "vue";

/** Measure after layout, after fonts load, and when the element resizes.
 *  The component supplies a template ref that lasts until unmount. */
export function onLaidOut(
  element: Readonly<Ref<HTMLElement | null>>,
  measure: () => void,
): void {
  let observer: ResizeObserver | undefined;
  let disposed = false;
  // Not an oversight: do not read sizes or document.fonts.ready at mount.
  // Vue runs each v-click just before that component's onMounted. Later
  // labels are not hidden yet. Reading styles now makes them fade out
  // from shown on load. The observer measures after layout, before paint;
  // fonts are awaited after Vue's flush, when every v-click has run.
  onMounted(() => {
    observer = new ResizeObserver(measure);
    if (element.value) observer.observe(element.value);
    void nextTick(() =>
      document.fonts.ready.then(() => {
        if (!disposed) measure();
      }),
    );
  });
  onBeforeUnmount(() => {
    disposed = true;
    observer?.disconnect();
  });
}

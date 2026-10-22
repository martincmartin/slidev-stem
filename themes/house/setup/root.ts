import { useDrawings, useNav } from "@slidev/client";
import { onBeforeUnmount } from "vue";

/** What a click must not move past: it works on these itself. */
const INTERACTIVE =
  "a, button, input, select, textarea, label, summary, [contenteditable], " +
  "[role='button'], [role='slider']";

export default function setupRoot(): void {
  setupNavigationProbe();
  setupClickToAdvance();
}

// Fast validation uses Slidev's next target and final position.
// See docs/navigation.md. Animation state is deliberately excluded.
function setupNavigationProbe(): void {
  const navigation = useNav();
  const probe = () => {
    const slide = navigation.currentSlideNo.value;
    const click = navigation.clicks.value;
    const clicksTotal = navigation.clicksTotal.value;
    const lastSlide = navigation.slides.value.at(-1)?.no ?? 0;
    const next =
      click < clicksTotal
        ? { slide, click: click + 1 }
        : slide < lastSlide
          ? { slide: navigation.nextRoute.value.no, click: 0 }
          : null;
    return { slide, click, clicksTotal, lastSlide, next };
  };
  Object.assign(window, { slideNavigation: probe });
  onBeforeUnmount(() => {
    Reflect.deleteProperty(window, "slideNavigation");
  });
}

// A click on the slide or its letterbox goes to the next click or slide, and
// never back. Slidev goes forward or back only for a click on the letterbox;
// styles/house.css lets that click through to the page under it. See
// docs/navigation.md, "Mouse clicks".
function setupClickToAdvance(): void {
  const navigation = useNav();
  const { drawingEnabled } = useDrawings();
  const onClick = (event: MouseEvent) => {
    if (event.button !== 0) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (!navigation.isPlaying.value && !navigation.isPresenter.value) return;
    if (drawingEnabled.value) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    // the slide on the screen (in the presenter view, not the next slide), or
    // the letterbox around it
    const letterbox = target.id === "page-root";
    if (!letterbox && !target.closest("#slide-content")) return;
    if (target.closest(INTERACTIVE)) return;
    // the end of a drag that selects text
    if (document.getSelection()?.isCollapsed === false) return;
    void navigation.next();
  };
  document.addEventListener("click", onClick);
  onBeforeUnmount(() => {
    document.removeEventListener("click", onClick);
  });
}

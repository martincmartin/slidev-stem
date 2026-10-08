import { useNav } from "@slidev/client";
import { onBeforeUnmount } from "vue";

// Fast validation uses Slidev's next target and final position.
// See docs/navigation.md. Animation state is deliberately excluded.
export default function setupNavigationProbe(): void {
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

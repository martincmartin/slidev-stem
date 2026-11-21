// The page's art, made before the app mounts, and the watch talk's rules for
// its article (addons/narration).
//
// THE ART (watch/instance.ts). Slidev waits for this setup before it mounts
// the app, so the art is there when the layers and the figures mount, and a
// static article page stays on the screen until the live one can take its
// place. The slides load the globe; an article page loads it only if one of
// its slides shows it (docs/article.md, "What a page loads").
//
// THE RULES: which clicks get a figure, a key for each click's picture, and
// where the picture is, so that each figure is cropped to it, and its camera,
// so that the figures that share one share a crop (watch/article.ts;
// docs/article.md).
import { slides } from "@slidev/client/logic/slides.ts";
import { defineAppSetup } from "@slidev/types";
import { ARTICLE_HOOKS } from "../addons/narration/figure.ts";
import { frontmatterOf, routePages } from "../addons/narration/plan.ts";
import { showsGlobe } from "../watch/art.ts";
import {
  defaultFigures,
  frameKey,
  pictureBox,
  pictureKey,
} from "../watch/article.ts";
import { loadArt, loadedArt, loadedGlobe } from "../watch/instance.ts";

/** What this setup reads of a route (vue-router's, which the talk does not
 *  depend on directly). */
interface PageRoute {
  readonly name?: unknown;
  readonly params: Readonly<Record<string, unknown>>;
}

/** Whether the page at `route` shows the globe: an article page if one of its
 *  slides does; any other page (the slides, the presenter, a print) does. */
function pageShowsGlobe(route: PageRoute): boolean {
  if (route.name !== "article") return true;
  const part = Number(route.params["part"]);
  // the page's slides: the split into pages needs no art
  const shown = new Set(
    routePages(slides.value)[part - 1]?.slides.map((each) => each.slide.no) ??
      [],
  );
  return slides.value.some(
    (each) => shown.has(each.no) && showsGlobe(frontmatterOf(each)),
  );
}

export default defineAppSetup(async ({ app, router }) => {
  app.provide(ARTICLE_HOOKS, {
    defaultFigures: (frontmatter, total) =>
      defaultFigures(loadedArt(), frontmatter, total),
    pictureKey,
    pictureBox: (frontmatter, clicks) =>
      pictureBox(loadedArt(), frontmatter, clicks),
    frameKey,
  });
  await router.isReady();
  await loadArt(pageShowsGlobe(router.currentRoute.value));
  // A page made without the globe loads anew to go to one that shows it:
  // the article's links do so anyway, and a page keeps the art it started
  // with.
  router.beforeEach((to) => {
    if (loadedGlobe() === null && pageShowsGlobe(to)) {
      location.assign(router.resolve(to).href);
      return false;
    }
    return true;
  });
});

// The article page, /article: every slide, still, with its narration.
// Print mode (`?print`) makes each slide draw as in an export: no live layers,
// no transitions. The route adds it if the URL lacks it.
//
// /article-live is the same page without print mode: each figure is a live
// slide, with its own live layers (for the watch, its own WebGL stage). It is
// for the follow-up's measurements (experiments/embed.py), not for readers.
import { defineRoutesSetup } from "@slidev/types";

export default defineRoutesSetup((routes) => [
  {
    name: "narration-article",
    path: "/article",
    component: () => import("../views/ArticlePage.vue"),
    beforeEnter: (to) =>
      "print" in to.query
        ? true
        : { path: to.path, query: { ...to.query, print: "true" } },
  },
  {
    name: "narration-article-live",
    path: "/article-live",
    component: () => import("../views/ArticlePage.vue"),
  },
  ...routes,
]);

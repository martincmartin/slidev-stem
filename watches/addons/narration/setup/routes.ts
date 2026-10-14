// The article: the talk as one long page, with the narration and live
// figures (views/ArticlePage.vue), at /article. It needs no change to the
// talk's own routes: the slides stay at /1, /2, and so on.
import { defineRoutesSetup } from "@slidev/types";

export default defineRoutesSetup((routes) => [
  {
    name: "article",
    path: "/article",
    component: () => import("../views/ArticlePage.vue"),
  },
  ...routes,
]);

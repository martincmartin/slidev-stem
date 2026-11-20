// The article: the talk as a page for each part, with the narration and live
// figures (views/ArticlePage.vue), at /article/1, /article/2 and so on;
// /article goes to the first. It needs no change to the talk's own routes:
// the slides stay at /1, /2, and so on.
import { defineRoutesSetup } from "@slidev/types";

export default defineRoutesSetup((routes) => [
  { path: "/article", redirect: "/article/1" },
  {
    name: "article",
    path: "/article/:part(\\d+)",
    component: () => import("../views/ArticlePage.vue"),
    props: (route) => ({ part: Number(route.params["part"]) }),
  },
  ...routes,
]);

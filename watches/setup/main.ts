// The watch talk's rules for its article (addons/narration): which clicks get
// a figure, a key for each click's picture, and where the picture is, so
// that each figure is cropped to it (watch/article.ts; docs/article.md).
import { defineAppSetup } from "@slidev/types";
import { ARTICLE_HOOKS } from "../addons/narration/figure.ts";
import { defaultFigures, pictureBox, pictureKey } from "../watch/article.ts";
import { WATCH } from "../watch/instance.ts";

export default defineAppSetup(({ app }) => {
  app.provide(ARTICLE_HOOKS, {
    defaultFigures: (frontmatter, total) =>
      defaultFigures(WATCH, frontmatter, total),
    pictureKey,
    pictureBox: (frontmatter, clicks) => pictureBox(WATCH, frontmatter, clicks),
  });
});

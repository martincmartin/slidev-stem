// The little of Slidev's client API that the watch's layers use. tsconfig.json
// maps "@slidev/client" here, because importing the real one makes `vue-tsc`
// check Slidev's own sources, which are TypeScript and do not pass our strict
// settings.

import type { Ref } from "vue";

export interface SlideRoute {
  meta: { slide?: { frontmatter?: Record<string, unknown> } };
}

export function useNav(): {
  isPrintMode: Ref<boolean>;
  slides: Ref<SlideRoute[]>;
};

/** `$frontmatter` is a reactive object; `$renderContext` is the way the slide
 *  is drawn: "slide", "presenter", "overview", "print"... */
export function useSlideContext(): {
  $frontmatter: Record<string, unknown>;
  $renderContext: Ref<string>;
};

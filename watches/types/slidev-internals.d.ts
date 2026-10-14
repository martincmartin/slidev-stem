// See slidev-client.d.ts: what the article (addons/narration) uses of Slidev's
// internals, which are not its public API. tsconfig.json maps each of these
// module names here. docs/article.md lists them: an upgrade of Slidev may
// change them.

declare module "@slidev/client/composables/useClicks.ts" {
  import type { MaybeRefOrGetter } from "vue";
  import type { SlideRoute } from "@slidev/client";
  /** A slide's clicks, held at `current` (which may change). */
  export interface ClicksContext {
    readonly current: number;
  }
  export function createFixedClicks(
    route: SlideRoute,
    current: MaybeRefOrGetter<number>,
  ): ClicksContext;
}

declare module "@slidev/client/composables/useNav.ts" {
  import type { SlideRoute } from "@slidev/client";
  import type { ClicksContext } from "@slidev/client/composables/useClicks.ts";
  /** A nav that shows one slide at its clicks, and goes nowhere. */
  export interface SlidevContextNav {
    readonly __fixed: true;
  }
  export function useFixedNav(
    route: SlideRoute,
    clicks: ClicksContext,
  ): SlidevContextNav;
}

declare module "@slidev/client/env.ts" {
  import type { Ref } from "vue";
  export const slideWidth: Ref<number>;
  export const slideHeight: Ref<number>;
  /** The headmatter's settings. */
  export const configs: { title: string; author?: string };
}

declare module "@slidev/client/internals/PrintSlideClick.vue" {
  import type { DefineComponent } from "vue";
  import type { SlidevContextNav } from "@slidev/client/composables/useNav.ts";
  /** One slide at one click, with the global and slide layers, as an export
   *  draws it. */
  const component: DefineComponent<{ nav: SlidevContextNav }>;
  export default component;
}

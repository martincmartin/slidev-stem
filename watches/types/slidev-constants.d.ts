// See slidev-client.d.ts: what the watch's layers use of "@slidev/client/constants.ts".

import type { InjectionKey } from "vue";
import type { SlideRoute } from "./slidev-client";

export const injectionSlidevContext: InjectionKey<{
  nav: {
    currentSlideRoute: SlideRoute;
    currentSlideNo: number;
    clicks: number;
  };
}>;

/** A click past a slide's last: every `v-click` shows. */
export const CLICKS_MAX: number;

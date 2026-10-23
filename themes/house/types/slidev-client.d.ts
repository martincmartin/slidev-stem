// The little of Slidev's client API that the house theme uses. The tools'
// tsconfig.json maps "@slidev/client" here, as a talk's maps it to its own
// copy: the real one makes the type check read Slidev's own sources. Keep it
// to what the theme calls, with Slidev's names and types.

import type { Ref } from "vue";

export interface SlideRoute {
  /** The slide's number (1-based). */
  readonly no: number;
}

export function useNav(): {
  readonly currentSlideNo: Ref<number>;
  readonly clicks: Ref<number>;
  readonly clicksTotal: Ref<number>;
  readonly slides: Ref<SlideRoute[]>;
  readonly nextRoute: Ref<SlideRoute>;
  readonly isPlaying: Ref<boolean>;
  readonly isPresenter: Ref<boolean>;
  next(): Promise<void>;
};

export function useDrawings(): { readonly drawingEnabled: Ref<boolean> };

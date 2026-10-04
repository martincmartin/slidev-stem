// The narration that setup/preparser.ts puts in each slide's frontmatter.
import type { SlideRoute } from "@slidev/types";

export interface NarrationPart {
  /** The click from which this part is said. */
  clicks: number;
  html: string;
}

export function narrationOf(route: SlideRoute): NarrationPart[] {
  const value: unknown = route.meta.slide.frontmatter["narration"];
  return Array.isArray(value) ? (value as NarrationPart[]) : [];
}

/** The part said at this click: the last part that starts at or before it. */
export function currentPart(
  parts: NarrationPart[],
  clicks: number,
): NarrationPart | undefined {
  return parts.findLast((part) => part.clicks <= clicks);
}

/** True if the URL asks for the narrated mode: `?narration` on a slide. */
export function narrationRequested(): boolean {
  return new URLSearchParams(location.search).has("narration");
}

// What the house theme tells the checks about navigation: its contract with
// tools/smokecheck.ts (../../docs/navigation.md, "Validation: fast smoke
// navigation"). setup/root.ts gives it; the tools type their reads with it.

/** A place in a deck: a slide, and a click on it. */
export interface Position {
  readonly slide: number;
  readonly click: number;
}

/** Where the deck is now, from Slidev's navigation. */
export interface SlideNavigation extends Position {
  /** The current slide's clicks. */
  readonly clicksTotal: number;
  readonly lastSlide: number;
  /** Where the next click or slide goes, or null at the end. */
  readonly next: Position | null;
}

declare global {
  interface Window {
    slideNavigation?: () => SlideNavigation;
  }
}

// The mockup's choices: each is a name in the address and a dropdown in the
// bar under the slide. The first name of each is the default: the one chosen
// for the talk (PLAN.md, section 17). main.ts makes
// the dropdowns from CHOICE_NAMES; tools/shots.ts takes the same names.
export const CHOICES = {
  /** where the wind blows (main.ts, WIND) */
  wind: ["near", "bands", "all"],
  /** how a label stands out from the picture under it: the paper's outline,
   *  a card, or words in the paper where the sea is under them */
  label: ["paper", "outline", "card"],
  /** a label that stays to the end of its slide (story.ts, `stays`):
   *  dimmed, or it leaves as the others do */
  old: ["dim", "remove"],
  /** what a punchline is on: a dark card over the picture, the picture
   *  under a veil of paper, a screen of paper (Lessig), or a paper card */
  punch: ["screen", "card", "veil", "card-paper"],
  /** the first view: the whole globe, or South America (geo.ts) */
  start: ["america", "globe"],
} as const;

export type Choice = keyof typeof CHOICES;
export type Chosen<C extends Choice> = (typeof CHOICES)[C][number];

/** Each choice's name in the bar, in the bar's order. A choice with no name
 *  here fails the type check, so the bar cannot leave one out. */
export const CHOICE_NAMES: Readonly<Record<Choice, string>> = {
  wind: "wind",
  label: "labels",
  old: "old labels",
  punch: "punchline",
  start: "start",
};

/** Each choice, in the bar's order: main.ts and tools/shots.ts read the
 *  choices from here, so that neither can leave one out. */
export const CHOICE_LIST: readonly Choice[] = Object.keys(CHOICE_NAMES).filter(
  (name): name is Choice => name in CHOICES,
);

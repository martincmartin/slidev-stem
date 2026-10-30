// The mockup's choices: each is a name in the address and a dropdown in the
// bar under the slide. The first name of each is the default. main.ts draws
// them; tools/shots.ts takes the same names.
export const CHOICES = {
  /** where the wind blows (main.ts, WIND) */
  wind: ["bands", "near", "all"],
  /** how a label stands out from the picture under it: the paper's outline,
   *  a card, or words in the paper where the sea is under them */
  label: ["outline", "card", "paper"],
  /** the first view: the whole globe, or South America (geo.ts) */
  start: ["globe", "america"],
} as const;

export type Choice = keyof typeof CHOICES;
export type Chosen<C extends Choice> = (typeof CHOICES)[C][number];

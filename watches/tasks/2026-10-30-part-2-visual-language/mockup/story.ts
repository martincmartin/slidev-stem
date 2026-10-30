// Anson's search for Juan Fernández, May–June 1741, told four ways: the
// same picture and the same facts, with the words in a reading rail, in
// cards, on Lessig-style screens, or as labels on the map. Each style is data
// here; main.ts draws any of them. The facts are from Richard Walter's
// account (PLAN.md, "The facts"). Round 1 compared the four styles; round 2
// works on the labels (PLAN.md, section 12).
import { ANSON, ANSON_RAIL, project, SLIDE } from "./geo.ts";
import type { LonLat, MapView, Point } from "./geo.ts";

/** What the picture shows. Each state adds to the one before it. */
export const PICTURES = ["south", "start", "east", "west", "found"] as const;
export type Picture = (typeof PICTURES)[number];

/** Seconds of animation for each day at sea. */
export const DAY = 0.7;

/** The story's places on one map, in slide px. */
export interface Places {
  /** Robinson Crusoe Island, which Anson's men called Juan Fernández */
  readonly island: Point;
  /** May 28: in the islands' latitude, a few hours east of them */
  readonly start: Point;
  /** May 30: Chile in sight, 12 or 13 leagues (about 38 nautical miles) off */
  readonly turn: Point;
  /** the coast of Chile, in the islands' latitude */
  readonly coast: Point;
  /** below the slide, where the ship's track comes from */
  readonly entry: Point;
  /** the ship as the slide opens: at its bottom, on the way north */
  readonly south: Point;
  /** June 9, at daybreak: the ship as it sights the island (SIGHTING) */
  readonly found: Point;
  /** Then it sailed north, to anchor on the island's north side. It is
   *  drawn north-west of the island, with sea between: a ship drawn at the
   *  anchorage would hide it, and a track to the north-east would touch the
   *  dot of May 28. */
  readonly anchorage: Point;
}

const ISLAND: LonLat = [-78.83, -33.64];
/** "we first descried the island of Juan Fernandes, bearing N. by E.½E., at
 *  eleven or twelve leagues distance" (Walter, Book II, chapter I): the ship
 *  was south-southwest of it. A league is 3 nautical miles, and N. by E.½E.
 *  is 16.875° east of north. */
const SIGHTING = { leagues: 11.5, bearing: 16.875 } as const;

function sighting(): LonLat {
  const miles = SIGHTING.leagues * 3;
  const bearing = (SIGHTING.bearing * Math.PI) / 180;
  const lat = ISLAND[1] - (miles * Math.cos(bearing)) / 60;
  const shorten = Math.cos((lat * Math.PI) / 180);
  return [ISLAND[0] - (miles * Math.sin(bearing)) / 60 / shorten, lat];
}

export function placesOn(view: MapView): Places {
  const island = project(view, ISLAND);
  const start = project(view, [-78.35, ISLAND[1]]);
  return {
    island,
    start,
    turn: project(view, [-72.4, ISLAND[1]]),
    coast: project(view, [-71.62, ISLAND[1]]),
    entry: [start[0], SLIDE.height + 60],
    south: [start[0], SLIDE.height - 24],
    found: project(view, sighting()),
    anchorage: [island[0] - 46, island[1] - 16],
  };
}

/** The kinds of text. A rail paragraph follows the one before it; the others
 *  are placed. A screen fills the slide (Lessig). */
export type Kind = "rail" | "card" | "label" | "screen";

export interface Text {
  readonly kind: Kind;
  /** HTML: <b> leads, <em> is the slide's one accent. */
  readonly html: string;
  /** the top left corner, in slide px; not for a rail paragraph or a screen */
  readonly at?: Point;
  readonly width?: number;
  /** the place that the text is about: how far the eye travels to it */
  readonly about?: Point;
  /** a smaller label: a name, not a sentence */
  readonly small?: boolean;
}

export interface Step {
  readonly picture: Picture;
  readonly texts: readonly Text[];
}

export interface Style {
  readonly name: string;
  readonly view: MapView;
  readonly title: string | null;
  readonly subtitle: string | null;
  /** Text stays, dimmed, at later steps. Lessig's screens replace it. */
  readonly keeps: boolean;
  readonly steps: readonly Step[];
}

const TITLE = "Anson's Search, 1741";

/** The middle of the west leg, which runs due west to the sighting. */
const westMiddle = ({ turn, found }: Places): Point => [
  (turn[0] + found[0]) / 2,
  found[1],
];

// Round 1's three styles, on round 1's view (geo.ts, ANSON_RAIL).
const railPlaces = placesOn(ANSON_RAIL);

const rail: Style = {
  name: "rail",
  view: ANSON_RAIL,
  title: TITLE,
  subtitle: null,
  keeps: true,
  steps: [
    {
      picture: "start",
      texts: [
        {
          kind: "rail",
          html: "<b>May 28, 1741.</b> Scurvy kills 4–6 of Anson's men a day. He reaches the island's latitude, but can't measure longitude. East or west?",
          about: railPlaces.start,
        },
      ],
    },
    {
      picture: "east",
      texts: [
        {
          kind: "rail",
          html: "<b>East,</b> with the wind behind him: 340 miles in 2 days. <b>May 30:</b> Chile, an enemy coast. Turn back.",
          about: railPlaces.turn,
        },
      ],
    },
    {
      picture: "west",
      texts: [
        {
          kind: "rail",
          html: "<b>West,</b> into the wind and calms: the same 340 miles take 9 days.",
          about: westMiddle(railPlaces),
        },
      ],
    },
    {
      picture: "found",
      texts: [
        {
          kind: "rail",
          html: "<b>June 9:</b> the island, hours west of where he turned. The detour cost <em>70–80 men</em>.",
          about: railPlaces.island,
        },
      ],
    },
  ],
};

const cards: Style = {
  name: "cards",
  view: ANSON_RAIL,
  title: TITLE,
  subtitle: null,
  keeps: true,
  steps: [
    {
      picture: "start",
      texts: [
        {
          kind: "card",
          html: "<b>May 28, 1741.</b> Scurvy kills 4–6 men a day. Anson reaches the island's latitude. East or west?",
          at: [36, 92],
          width: 330,
          about: railPlaces.start,
        },
      ],
    },
    {
      picture: "east",
      texts: [
        {
          kind: "card",
          html: "<b>East,</b> with the wind behind: 2 days. <b>May 30:</b> Chile, an enemy coast. Turn back.",
          at: [626, 196],
          width: 320,
          about: railPlaces.turn,
        },
      ],
    },
    {
      picture: "west",
      texts: [
        {
          kind: "card",
          html: "<b>West,</b> into the wind and calms: the same 340 miles take 9 days.",
          at: [150, 350],
          width: 360,
          about: westMiddle(railPlaces),
        },
      ],
    },
    {
      picture: "found",
      texts: [
        {
          kind: "card",
          html: "<b>June 9:</b> the island, hours west of where he turned. The detour cost <em>70–80 men</em>.",
          at: [626, 352],
          width: 320,
          about: railPlaces.island,
        },
      ],
    },
  ],
};

const lessig: Style = {
  name: "lessig",
  view: ANSON_RAIL,
  title: null,
  subtitle: null,
  keeps: false,
  steps: [
    // Under the first screens, the ship waits at the bottom of the map; it
    // sails north once the screens have faded out.
    { picture: "south", texts: [{ kind: "screen", html: "May 28, 1741" }] },
    {
      picture: "south",
      texts: [{ kind: "screen", html: "Scurvy:<br>4–6 dead a day" }],
    },
    { picture: "start", texts: [] },
    { picture: "start", texts: [{ kind: "screen", html: "East or west?" }] },
    { picture: "east", texts: [] },
    {
      picture: "east",
      texts: [{ kind: "screen", html: "2 days east.<br>Chile: the enemy." }],
    },
    { picture: "west", texts: [] },
    { picture: "west", texts: [{ kind: "screen", html: "9 days back" }] },
    { picture: "found", texts: [] },
    {
      picture: "found",
      texts: [{ kind: "screen", html: "<em>70–80 men</em><br>died" }],
    },
  ],
};

// The labels, on their own view (geo.ts, ANSON): the islands show only when
// Anson finds them, so the first label names them.
const labelPlaces = placesOn(ANSON);

const labels: Style = {
  name: "labels",
  view: ANSON,
  title: TITLE,
  subtitle: "Scurvy kills 4–6 of his men a day",
  keeps: true,
  steps: [
    // the slide opens with the ship at the bottom, before it sails north
    { picture: "south", texts: [] },
    {
      picture: "start",
      texts: [
        {
          kind: "label",
          html: "May 28: the latitude of<br>the Juan Fernández Islands.<br>East or west?",
          at: [16, 152],
          about: labelPlaces.start,
        },
      ],
    },
    {
      picture: "east",
      texts: [
        {
          kind: "label",
          html: "Wind from the west",
          at: [16, 112],
          about: [260, 128],
        },
        {
          kind: "label",
          html: "2 days east,<br>wind behind",
          at: [420, 228],
          about: [
            (labelPlaces.start[0] + labelPlaces.turn[0]) / 2,
            labelPlaces.start[1],
          ],
        },
        {
          kind: "label",
          html: "May 30: Chile,<br>an enemy coast",
          at: [696, 262],
          about: labelPlaces.turn,
        },
      ],
    },
    {
      picture: "west",
      texts: [
        {
          kind: "label",
          html: "9 days back:<br>headwinds and calms",
          at: [340, 360],
          about: westMiddle(labelPlaces),
        },
      ],
    },
    {
      picture: "found",
      texts: [
        {
          kind: "label",
          html: "Juan Fernández<br>Islands",
          at: [16, 314],
          about: labelPlaces.island,
          small: true,
        },
        {
          kind: "label",
          html: "June 9: found",
          at: [16, 368],
          about: labelPlaces.found,
        },
        // the takeaway: about the whole story, not one place
        {
          kind: "label",
          html: "The detour cost<br><em>70–80 men</em>",
          at: [712, 400],
        },
      ],
    },
  ],
};

export const STYLES: readonly Style[] = [rail, cards, lessig, labels];

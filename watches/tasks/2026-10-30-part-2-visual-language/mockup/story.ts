// Anson's search for Juan Fernández, May–June 1741, told two ways: the same
// picture and the same facts, with the words on Lessig-style screens, or as
// labels on the map. Each style is data here; main.ts draws either. The facts
// are from Richard Walter's account (PLAN.md, "The facts"). Round 1 compared
// four styles; round 2 works on the labels (PLAN.md, section 12); round 3
// retired the reading rail and the cards (section 13).
import { ANSON, project, SLIDE } from "./geo.ts";
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

/** The kinds of text. A label is placed; a screen fills the slide (Lessig). */
export type Kind = "label" | "screen";

export interface Text {
  readonly kind: Kind;
  /** HTML: <em> is the slide's one accent. */
  readonly html: string;
  /** the top left corner of a label's words, in slide px */
  readonly at?: Point;
  /** the place that the text is about: how far the eye travels to it */
  readonly about?: Point;
}

export interface Step {
  readonly picture: Picture;
  readonly texts: readonly Text[];
}

export interface Style {
  readonly name: string;
  readonly view: MapView;
  readonly title: string | null;
  /** Text can stay at later steps: the `old` choice (choices.ts) says
   *  whether it does, dimmed. Lessig's screens always replace it. */
  readonly keeps: boolean;
  readonly steps: readonly Step[];
}

/** Who searches, and for what: "Anson's Search" alone left both open. */
const TITLE = "Commodore Anson Hunts for an Island, 1741";

/** The middle of the west leg, which runs due west to the sighting. */
const westMiddle = ({ turn, found }: Places): Point => [
  (turn[0] + found[0]) / 2,
  found[1],
];

const lessig: Style = {
  name: "lessig",
  view: ANSON,
  title: null,
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

// The islands show only when Anson finds them, so the first label names them.
const labelPlaces = placesOn(ANSON);

const labels: Style = {
  name: "labels",
  view: ANSON,
  title: TITLE,
  keeps: true,
  steps: [
    // The slide opens with the ship at the bottom, before it sails north,
    // and the stakes. They are about the whole crew, not one place, so they
    // are on the land, above the takeaway: the slide opens with what scurvy
    // costs a day, and ends with what the detour cost.
    {
      picture: "south",
      texts: [
        {
          kind: "label",
          html: "Scurvy kills 4–6<br>of his men a day",
          at: [712, 120],
        },
      ],
    },
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
          // 18 px above the next label: room for two cards (`label=card`)
          at: [16, 104],
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
        // one label, so one card (`label=card`): the islands' name, smaller,
        // and the day that Anson found them
        {
          kind: "label",
          html: '<div class="name">Juan Fernández<br>Islands</div>June 9: found',
          // a card's top clears Alejandro Selkirk Island, which ends at y 315
          at: [16, 324],
          about: labelPlaces.island,
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

export const STYLES: readonly Style[] = [lessig, labels];

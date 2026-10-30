// Two slides of Anson's voyage, told two ways: the same pictures and facts,
// with the words on Lessig-style screens, or as labels on the map. First the
// globe, and Cape Noir in April 1741, where the squadron was 400 miles east of
// where it thought; then the search for Juan Fernández, May–June 1741. Each
// style is data here; main.ts draws either. The facts are from Richard
// Walter's account (PLAN.md, "The facts"). Round 1 compared four styles;
// round 2 works on the labels (PLAN.md, section 12); round 3 retired the
// reading rail and the cards (section 13); round 4 adds the globe and Cape
// Noir (section 14).
import { ANSON, NOIR, project, SLIDE } from "./geo.ts";
import type { LonLat, MapView, Point } from "./geo.ts";

/** What the picture shows. Each state adds to the one before it. */
export const PICTURES = [
  "globe",
  "thought",
  "real",
  "gap",
  "south",
  "start",
  "east",
  "west",
  "found",
] as const;
export type Picture = (typeof PICTURES)[number];

/** The story's map that each picture shows over the globe, or null: the
 *  globe alone, at the start view (the `start` choice). */
export const REGION: Readonly<Record<Picture, MapView | null>> = {
  globe: null,
  thought: NOIR,
  real: NOIR,
  gap: NOIR,
  south: ANSON,
  start: ANSON,
  east: ANSON,
  west: ANSON,
  found: ANSON,
};

/** Seconds of animation for each day at sea. */
export const DAY = 0.7;

/** The places of the search for Juan Fernández, in slide px. */
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

/** The places at Cape Noir, in slide px. */
export interface NoirPlaces {
  /** Isla Noir, "that point called by [Frezier] Cape Noir" */
  readonly cape: Point;
  /** April 14, 1741, between 1 and 2 a.m.: land "right ahead", "but two
   *  miles distant", as the squadron stood north. The ship is drawn south
   *  of the island, with sea between. */
  readonly ship: Point;
  /** where the ship comes from, as it sails north */
  readonly approach: Point;
  /** where they thought they were: "upwards of ten degrees more westerly
   *  than this land", on the same parallel */
  readonly thought: Point;
  /** slide y of the bracket that measures the gap between the ships: below
   *  where the track starts, so the two do not join into one line */
  readonly bracket: number;
}

const CAPE_NOIR: LonLat = [-73.03, -54.47];
/** Degrees of longitude between where the squadron was and where it thought
 *  it was: 10° at 54.5° S is 646 km, 401 miles. */
const RECKONED_WEST = 10;

export function noirPlacesOn(view: MapView): NoirPlaces {
  const cape = project(view, CAPE_NOIR);
  const ship: Point = [cape[0] - 6, cape[1] + 46];
  const scale = view.scale * Math.cos((view.centre[1] * Math.PI) / 180);
  return {
    cape,
    ship,
    approach: [ship[0], ship[1] + 60],
    thought: [ship[0] - RECKONED_WEST * scale, ship[1]],
    bracket: ship[1] + 90,
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
  /** or the place on the globe that a label is centred on, at the start
   *  view */
  readonly on?: LonLat;
  /** the place that the text is about: how far the eye travels to it */
  readonly about?: Point;
}

export interface Step {
  /** the slide's title: steps with the same title are one slide */
  readonly title?: string;
  readonly picture: Picture;
  readonly texts: readonly Text[];
}

export interface Style {
  readonly name: string;
  readonly steps: readonly Step[];
}

/** Who, and where: the labels then tell what went wrong. */
const NOIR_TITLE = "Commodore Anson Rounds Cape Horn, 1741";
/** Who searches, and for what: "Anson's Search" alone left both open. */
const TITLE = "Commodore Anson Hunts for an Island, 1741";

/** The middle of the west leg, which runs due west to the sighting. */
const westMiddle = ({ turn, found }: Places): Point => [
  (turn[0] + found[0]) / 2,
  found[1],
];

const lessig: Style = {
  name: "lessig",
  steps: [
    {
      picture: "globe",
      texts: [{ kind: "screen", html: "April 1741:<br>around Cape Horn" }],
    },
    { picture: "globe", texts: [] },
    { picture: "thought", texts: [] },
    {
      picture: "thought",
      texts: [{ kind: "screen", html: "Where they<br>thought they were" }],
    },
    { picture: "real", texts: [] },
    {
      picture: "real",
      texts: [{ kind: "screen", html: "2 a.m.: land,<br>2 miles ahead" }],
    },
    { picture: "gap", texts: [] },
    {
      picture: "gap",
      texts: [{ kind: "screen", html: "<em>400 miles</em> off" }],
    },
    // The camera flies to Juan Fernández with no screen over it. Under the
    // next screens, the ship waits at the bottom of the map; it sails north
    // once the screens have faded out.
    { picture: "south", texts: [] },
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
const noir = noirPlacesOn(NOIR);

const labels: Style = {
  name: "labels",
  steps: [
    // The globe, or South America (the `start` choice), and where on it.
    {
      title: NOIR_TITLE,
      picture: "globe",
      texts: [{ kind: "label", html: "South America", on: [-58, -12] }],
    },
    {
      title: NOIR_TITLE,
      picture: "thought",
      texts: [
        {
          kind: "label",
          html: "April 14, 1741:<br>where they think they are",
          at: [40, 168],
          about: noir.thought,
        },
      ],
    },
    {
      title: NOIR_TITLE,
      picture: "real",
      texts: [
        {
          kind: "label",
          html: "2 a.m.: land,<br>2 miles ahead!",
          at: [noir.ship[0] - 210, noir.ship[1] - 70],
          about: noir.ship,
        },
      ],
    },
    {
      title: NOIR_TITLE,
      picture: "gap",
      texts: [
        {
          kind: "label",
          html: "Same latitude:<br>from the Sun at noon",
          at: [noir.thought[0] + 60, noir.ship[1] - 74],
          about: [(noir.thought[0] + noir.ship[0]) / 2, noir.ship[1]],
        },
        {
          kind: "label",
          html: "Longitude: <em>400 miles</em> off",
          at: [noir.thought[0] + 40, noir.bracket + 18],
          about: [(noir.thought[0] + noir.ship[0]) / 2, noir.bracket],
        },
      ],
    },
    // The slide opens with the ship at the bottom, before it sails north,
    // and the stakes. They are about the whole crew, not one place, so they
    // are on the land, above the takeaway: the slide opens with what scurvy
    // costs a day, and ends with what the detour cost.
    {
      title: TITLE,
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
      title: TITLE,
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
      title: TITLE,
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
      title: TITLE,
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
      title: TITLE,
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

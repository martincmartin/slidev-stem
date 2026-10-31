// Three slides of the longitude problem, told two ways: the same pictures
// and facts, with the words on Lessig-style screens, or as labels on the
// map. First the globe, and Cape Noir in April 1741, where Anson's squadron
// was 400 miles east of where it thought; then the search for Juan
// Fernández, May–June 1741; then the Isles of Scilly in October 1707, where
// a fleet that had not seen the Sun since the noon before ran onto the
// rocks. Each style is data here; main.ts draws either. The facts are from
// Richard Walter's account and the sources of PLAN.md, "The facts". Round 1
// compared four styles; round 2 works on the labels (PLAN.md, section 12);
// round 3 retired the reading rail and the cards (section 13); round 4 adds
// the globe and Cape Noir (section 14); round 5 adds Scilly (section 15).
import { ANSON, CHANNEL, NOIR, project, SCILLY, seen, SLIDE } from "./geo.ts";
import type { Camera, LonLat, MapView, Point } from "./geo.ts";

/** What the picture shows. Each state adds to the one before it. */
export const PICTURES = [
  "globe",
  "thought",
  "real",
  "parallel",
  "gap",
  "south",
  "start",
  "east",
  "west",
  "found",
  "channel",
  "reckoned",
  "wreck",
  "toll",
] as const;
export type Picture = (typeof PICTURES)[number];

/** The story's map that each picture shows over the globe, or null: the
 *  globe alone (GLOBE_VIEW). */
export const REGION: Readonly<Record<Picture, MapView | null>> = {
  globe: null,
  thought: NOIR,
  real: NOIR,
  parallel: NOIR,
  gap: NOIR,
  south: ANSON,
  start: ANSON,
  east: ANSON,
  west: ANSON,
  found: ANSON,
  channel: null,
  reckoned: SCILLY,
  wreck: SCILLY,
  toll: SCILLY,
};

/** The camera of a picture with no story map: its own here, or else the
 *  start view (the `start` choice). */
export const GLOBE_VIEW: Partial<Readonly<Record<Picture, Camera>>> = {
  channel: CHANNEL,
};

/** The middle of the Isles of Scilly. In the view of the Channel they are a
 *  few px across, so a callout points them out. */
const ISLES: LonLat = [-6.32, 49.93];
/** Slide px from the islands' middle to the outside of their coast, in the
 *  view of the Channel: they are about 8 by 11 px. */
const ISLES_RADIUS = 7;
/** Slide px outside a part's outline where a leader ends
 *  (stem/docs/illustrations.md, "Leaders"). */
const LEADER_GAP = 10;

/** Seconds of animation for each day at sea. */
export const DAY = 0.7;

/** The places of the search for Juan Fernández, in slide px. */
export interface Places {
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

/** The place a run of nautical miles from a place, on a bearing in degrees
 *  east of north, on a flat chart: near enough over a few dozen miles. */
function sail([lon, lat]: LonLat, bearing: number, miles: number): LonLat {
  const radians = (bearing * Math.PI) / 180;
  const to = lat + (miles * Math.cos(radians)) / 60;
  const shorten = Math.cos((to * Math.PI) / 180);
  return [lon + (miles * Math.sin(radians)) / 60 / shorten, to];
}

const sighting = (): LonLat =>
  sail(ISLAND, SIGHTING.bearing + 180, SIGHTING.leagues * 3);

export function placesOn(view: MapView): Places {
  const island = project(view, ISLAND);
  const start = project(view, [-78.35, ISLAND[1]]);
  return {
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
    thought: [ship[0] - RECKONED_WEST * scale, ship[1]],
    bracket: ship[1] + 90,
  };
}

/** The places of the wreck on the Isles of Scilly, in slide px. */
export interface ScillyPlaces {
  /** October 22, 1707, about 8 p.m.: the Outer Gilstone, where the
   *  Association struck */
  readonly rock: Point;
  /** the ship on the rocks, with its bow at the rock */
  readonly wreck: Point;
  /** about 6 p.m.: where the fleet sailed on from, LAST_RUN before */
  readonly sailed: Point;
  /** where they thought they were at 8 p.m.: Orford's reckoning, LAST_RUN
   *  on */
  readonly thought: Point;
  /** the bracket that measures the gap between the ships: parallel to it,
   *  on its south side, clear of the track */
  readonly bracket: readonly [Point, Point];
}

/** Where the Association struck: the Outer Gilstone, among the Western
 *  Rocks (Wikipedia's place of the wreck). */
const GILSTONE: LonLat = [-6.3972, 49.8656];
/** HMS Orford's reckoning when the fleet hove to at 4 p.m. on October 22,
 *  from Lieutenant Lochard's log, as a map of W. E. May's data shows it:
 *  about 49°40' N, 7°20' W (PLAN.md, section 15). The fleet thought that
 *  the Channel was open: it was "much to ye Northward of what was expected,
 *  and likewise more to the Eastward", the captain of the Torbay wrote. */
const ORFORD_RECKONED: LonLat = [-7.33, 49.67];
/** At about 6 p.m. the fleet sailed on east by north, and struck at about
 *  8 p.m.: two hours, at an assumed 6 knots. The ship and the reckoning
 *  run the same course and distance, so the gap between them stays the
 *  same. */
const LAST_RUN = { bearing: 78.75, miles: 12 } as const;
/** Slide px from the ship's middle to its bow (main.ts, SHIP_PARTS). */
const BOW = 21;
/** Slide px between the gap and its bracket. */
const BRACKET_OFFSET = 40;

export function scillyPlacesOn(view: MapView): ScillyPlaces {
  const rock = project(view, GILSTONE);
  const from = project(
    view,
    sail(GILSTONE, LAST_RUN.bearing + 180, LAST_RUN.miles),
  );
  const run: Point = [rock[0] - from[0], rock[1] - from[1]];
  const length = Math.hypot(...run);
  const wreck: Point = [
    rock[0] - (BOW * run[0]) / length,
    rock[1] - (BOW * run[1]) / length,
  ];
  const thought = project(
    view,
    sail(ORFORD_RECKONED, LAST_RUN.bearing, LAST_RUN.miles),
  );
  // the gap's direction, turned a right angle clockwise: its south side
  const gap = Math.hypot(wreck[0] - thought[0], wreck[1] - thought[1]);
  const [x, y] = [
    (-(wreck[1] - thought[1]) / gap) * BRACKET_OFFSET,
    ((wreck[0] - thought[0]) / gap) * BRACKET_OFFSET,
  ];
  return {
    rock,
    wreck,
    sailed: [wreck[0] - run[0], wreck[1] - run[1]],
    thought,
    bracket: [
      [thought[0] + x, thought[1] + y],
      [wreck[0] + x, wreck[1] + y],
    ],
  };
}

/** The kinds of text. A label is placed; a screen fills the slide (Lessig);
 *  a punchline is a slide's last words, in a screen's type, on the backing
 *  that the `punch` choice gives (choices.ts); a count is a label with a
 *  number that counts up with the days at sea, to the end of its slide. */
export type Kind = "label" | "screen" | "punch" | "count";

export interface Text {
  readonly kind: Kind;
  /** HTML: <em> is the slide's one accent. */
  readonly html: string;
  /** the top left corner of a label's words, in slide px */
  readonly at?: Point;
  /** or the place on the globe that a label is centred on, through its
   *  picture's camera */
  readonly on?: LonLat;
  /** the place that the text is about: how far the eye travels to it */
  readonly about?: Point;
  /** a callout's leader, to `about`: slide px short of it where it ends */
  readonly leader?: number;
  /** a label that stays, dimmed, to the end of its slide, when the next
   *  text shows: one that the rest of the slide refers to, or all of a
   *  slide told by its picture, with a few words at each step (PLAN.md,
   *  section 16). Else a label leaves at the next step. */
  readonly stays?: true;
  /** the picture at which a label that stays leaves, as a mark's `until`
   *  (main.ts), if before the end of its slide */
  readonly until?: Picture;
  /** a label that, at its `until`, leaves with that click's new labels,
   *  after the picture's change, and not as the click starts */
  readonly lingers?: true;
  /** a count's number for each day at sea, from its own picture on: it
   *  ticks at each day's dot (main.ts, DAYS) */
  readonly perDay?: number;
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

/** The point, for every ship of the time, not for Anson alone: the slide
 *  is its example. The clicks show how far off; the title does not give
 *  the number (PLAN.md, section 16). */
const NOIR_TITLE = "At Sea, Longitude Was a Guess";
/** What is searched for, by name; who searches is the speaker's to say, and
 *  the labels then say "the island" (PLAN.md, section 16). */
const TITLE = "Hunt for Juan Fernández Island, 1741";
/** Who, and where to: the labels then tell how the voyage ended. */
const SCILLY_TITLE = "Admiral Shovell Sails Home, 1707";

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
      texts: [{ kind: "screen", html: "2 a.m.: cliffs,<br>2 miles ahead" }],
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
    // The camera flies to the English Channel, and then zooms in to the
    // Isles of Scilly, with no screen over it.
    {
      picture: "found",
      texts: [{ kind: "screen", html: "October 1707:<br>a fleet sails home" }],
    },
    { picture: "channel", texts: [] },
    { picture: "reckoned", texts: [] },
    {
      picture: "reckoned",
      texts: [{ kind: "screen", html: "Where they<br>thought they were" }],
    },
    { picture: "wreck", texts: [] },
    {
      picture: "wreck",
      texts: [{ kind: "screen", html: "8 p.m.: the rocks<br>of Scilly" }],
    },
    { picture: "toll", texts: [] },
    {
      picture: "toll",
      texts: [{ kind: "screen", html: "<em>Over 1,300</em><br>men died" }],
    },
  ],
};

// The islands show only when Anson finds them, so the first label names them.
const labelPlaces = placesOn(ANSON);
const noir = noirPlacesOn(NOIR);
const scilly = scillyPlacesOn(SCILLY);
/** The Isles of Scilly in the view of the Channel. */
const isles: Point = [seen(CHANNEL, ISLES)[0], seen(CHANNEL, ISLES)[1]];
/** The middle of the gap at Scilly, on its bracket. */
const gapMiddle: Point = [
  (scilly.bracket[0][0] + scilly.bracket[1][0]) / 2,
  (scilly.bracket[0][1] + scilly.bracket[1][1]) / 2,
];

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
          html: "Estimated position",
          // the dashed ship that the next click measures from; it leaves
          // when "Latitude: correct" shows (PLAN.md, section 16)
          stays: true,
          until: "parallel",
          // above the dashed ship, as "21 ships" is at Scilly
          at: [noir.thought[0] - 105, noir.thought[1] - 76],
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
          // a yell: the word large, on its own line (PLAN.md, section 16)
          html: '<div class="shout">Cliffs!</div>2 a.m., 2 miles ahead',
          at: [noir.ship[0] - 270, noir.ship[1] - 104],
          about: noir.ship,
        },
      ],
    },
    {
      title: NOIR_TITLE,
      picture: "parallel",
      texts: [
        {
          kind: "label",
          // as the punchline's "Longitude: 400 miles off"; how they knew
          // it, from the Sun, is for the narration (PLAN.md, section 16)
          html: "Latitude: correct",
          // one line, so near its parallel, as "2 days east" is to its leg
          at: [noir.thought[0] + 60, noir.ship[1] - 50],
          about: [(noir.thought[0] + noir.ship[0]) / 2, noir.ship[1]],
        },
      ],
    },
    // The gap in longitude, a click of its own: the parallel's click is
    // about latitude.
    { title: NOIR_TITLE, picture: "gap", texts: [] },
    // Each slide ends on its punchline, a click of its own.
    {
      title: NOIR_TITLE,
      picture: "gap",
      texts: [{ kind: "punch", html: "Longitude:<br><em>400 miles</em> off" }],
    },
    // The slide opens with the ship at the bottom, before it sails north,
    // and the stakes. They are about the whole crew, not one place, so they
    // are on the land: the slide opens with what scurvy costs a day, and
    // ends with what the detour cost, its punchline. The slide is told by
    // its map, with a few words at each step, so its labels stay, dimmed
    // (`stays`), to the last step.
    {
      title: TITLE,
      picture: "south",
      texts: [
        // by the ship, where the eyes are; it gives way to the count
        {
          kind: "label",
          html: "Scurvy kills<br>4–6 men a day",
          stays: true,
          until: "east",
          at: [labelPlaces.south[0] + 44, labelPlaces.south[1] - 74],
          about: labelPlaces.south,
        },
      ],
    },
    {
      title: TITLE,
      picture: "start",
      texts: [
        {
          kind: "label",
          html: "Sail to latitude.<br>Then east or west?",
          // it asks the question that the east leg answers, and leaves
          // with the answer, "2 days east"
          stays: true,
          until: "east",
          lingers: true,
          at: [16, 152],
          about: labelPlaces.start,
        },
      ],
    },
    {
      title: TITLE,
      picture: "east",
      texts: [
        // The deaths, from the start of the detour: at Walter's "six in a
        // day", 12 days to the anchorage make 72, within his 70–80
        // (PLAN.md, section 16).
        {
          kind: "count",
          html: "Scurvy deaths:",
          perDay: 6,
          at: [712, 120],
        },
        // The gusts show the wind, so no label names it.
        {
          kind: "label",
          html: "2 days east",
          stays: true,
          // as far above its leg as "9 days back" is below its own: 23 px
          at: [420, 251],
          about: [
            (labelPlaces.start[0] + labelPlaces.turn[0]) / 2,
            labelPlaces.start[1],
          ],
        },
        {
          kind: "label",
          html: "Chile:<br>an enemy coast",
          stays: true,
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
          html: "9 days back",
          stays: true,
          at: [340, 360],
          about: westMiddle(labelPlaces),
        },
      ],
    },
    {
      title: TITLE,
      picture: "found",
      // The islands show: that they are found needs no words.
      texts: [],
    },
    {
      title: TITLE,
      picture: "found",
      texts: [{ kind: "punch", html: "The detour cost<br><em>70–80 men</em>" }],
    },
    // Where in the world: both coasts of the Channel, and the islands that
    // the camera zooms in to next.
    {
      title: SCILLY_TITLE,
      picture: "channel",
      texts: [
        // west of the Channel Islands, which it would hide
        { kind: "label", html: "English Channel", on: [-4, 49.55] },
        { kind: "label", html: "England", on: [-1.6, 51.2] },
        { kind: "label", html: "France", on: [0.4, 48.7] },
        // a callout from the open sea south-west of the islands
        {
          kind: "label",
          html: "Isles of Scilly",
          at: [24, isles[1] + 80],
          about: isles,
          leader: ISLES_RADIUS + LEADER_GAP,
        },
      ],
    },
    // The fleet, and where it thought it was. The stakes have a place here,
    // unlike the Anson slide's: the dashed ship stands for the fleet, so they
    // are above it.
    {
      title: SCILLY_TITLE,
      picture: "reckoned",
      texts: [
        // "Ships", as the source counts them: 15 ships of the line, and
        // others.
        {
          kind: "label",
          html: "21 ships",
          at: [scilly.thought[0] - 48, scilly.thought[1] - 76],
        },
        {
          kind: "label",
          html: "Estimated position",
          stays: true,
          // below the dashed ship, and below the bracket's end
          at: [scilly.thought[0] - 150, scilly.thought[1] + 52],
          about: scilly.thought,
        },
      ],
    },
    {
      title: SCILLY_TITLE,
      picture: "wreck",
      texts: [
        {
          kind: "label",
          html: "8 p.m.: the rocks<br>of Scilly!",
          at: [scilly.rock[0] + 60, scilly.rock[1] + 10],
          about: scilly.rock,
        },
      ],
    },
    // The gap is mostly east: by Orford's reckoning, 24 nautical miles east
    // and 9 north. So the label says what the outline says, in the form of
    // Cape Noir's "Longitude: 400 miles off" (PLAN.md, section 15).
    {
      title: SCILLY_TITLE,
      picture: "toll",
      texts: [
        {
          kind: "label",
          html: "Longitude: unsure how<br>far east they had come",
          at: [gapMiddle[0] - 10, gapMiddle[1] + 36],
          about: gapMiddle,
        },
      ],
    },
    {
      title: SCILLY_TITLE,
      picture: "toll",
      texts: [
        { kind: "punch", html: "4 warships lost,<br>over <em>1,300 men</em>" },
      ],
    },
  ],
};

export const STYLES: readonly Style[] = [lessig, labels];

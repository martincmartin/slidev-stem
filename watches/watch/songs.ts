// The words on the Questions slide (docs/slide-patterns.md, "Words that run on their
// own"). This makes the screens: two lines of a song, as long as they take in the song,
// or one song title, when there are no lines to show.

export interface SongLine {
  readonly text: string;
  readonly beats: number;
}

export interface Song {
  readonly title: string;
  readonly bpm: number;
  readonly lines: readonly SongLine[];
}

export interface SongScreen {
  readonly lines: readonly string[];
  readonly seconds: number;
}

const LINES_ON_A_SCREEN = 2;
const SECONDS_A_MINUTE = 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositive(value: unknown): value is number {
  return typeof value === "number" && value > 0;
}

function songLine(value: unknown, title: string): SongLine {
  if (
    isRecord(value) &&
    typeof value["text"] === "string" &&
    isPositive(value["beats"])
  )
    return { text: value["text"], beats: value["beats"] };
  throw new Error(`${title}: each line needs a text and a number of beats`);
}

function song(value: unknown): Song {
  if (
    !isRecord(value) ||
    typeof value["title"] !== "string" ||
    !isPositive(value["bpm"]) ||
    !Array.isArray(value["lines"]) ||
    value["lines"].length === 0
  )
    throw new Error("each song needs a title, bpm and lines");
  const title = value["title"];
  return {
    title,
    bpm: value["bpm"],
    lines: value["lines"].map((line: unknown) => songLine(line, title)),
  };
}

/** The screens of all the songs, in order. A song with an odd number of lines ends on
 *  a screen of one line. This data is from outside, so this checks it. */
export function songScreens(songs: unknown): SongScreen[] {
  if (!Array.isArray(songs)) throw new Error("songs must be a list");
  if (songs.length === 0) throw new Error("there must be at least one song");
  return songs.flatMap((value: unknown) => {
    const parsed = song(value);
    const screens: SongScreen[] = [];
    for (
      let start = 0;
      start < parsed.lines.length;
      start += LINES_ON_A_SCREEN
    ) {
      const lines = parsed.lines.slice(start, start + LINES_ON_A_SCREEN);
      const beats = lines.reduce((sum, line) => sum + line.beats, 0);
      screens.push({
        lines: lines.map((line) => line.text),
        seconds: (beats * SECONDS_A_MINUTE) / parsed.bpm,
      });
    }
    return screens;
  });
}

/** One screen for each title, each for the same time. This data is from outside, so
 *  this checks it. */
export function titleScreens(titles: unknown, seconds: unknown): SongScreen[] {
  if (!Array.isArray(titles) || titles.length === 0)
    throw new Error("titles must be a list with at least one title");
  if (!isPositive(seconds))
    throw new Error("the time for a title must be above 0");
  return titles.map((title: unknown) => {
    if (typeof title !== "string") throw new Error("each title must be text");
    return { lines: [title], seconds };
  });
}

/** A screen's opacity over its time. It fades in from its start and has faded out by
 *  its end, so that the next screen starts as it ends. */
export function fadeFrames(seconds: number, fade: number): Keyframe[] {
  if (seconds < 2 * fade)
    throw new Error(
      `a screen of ${String(seconds)} s is too short for its fades`,
    );
  const part = fade / seconds;
  return [
    { opacity: fade === 0 ? 1 : 0, offset: 0 },
    { opacity: 1, offset: part },
    { opacity: 1, offset: 1 - part },
    { opacity: fade === 0 ? 1 : 0, offset: 1 },
  ];
}

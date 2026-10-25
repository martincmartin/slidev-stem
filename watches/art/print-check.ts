// Does each printed page show the watch that the live slide shows at that click?
//
//     node art/print-check.ts DECK_DIR                    # also `pnpm art:print DECK_DIR`
//     node art/print-check.ts DECK_DIR --browser firefox  # or webkit
//
// DECK_DIR is the built deck (`pnpm build --out DECK_DIR`). An export has one
// page for each click (`slidev export --with-clicks`), and a page's still
// must be the live slide's watch at the same click. The two layers write the
// state that they show in a `data-watch` attribute: the live canvas
// (global-bottom.vue) and the still (slide-bottom.vue). First this steps
// through the live deck with the right arrow, as the viewer does, and records
// the state at each slide and click. While the board shows, it waits before a
// press until the press would be a step (`slideState().busy`): a press during
// a move jumps, and the curl click's picture is the step's. Then it loads each slide in print mode
// at each click (`/N?print=clicks&clicks=C`, the address that
// `slidev export --format png --with-clicks` opens), in PRINTED_BROWSERS
// browsers at once, and fails if a printed state differs from the live one.
// It compares states, not pixels: the live watch swings, and the still draws
// one pose of it. It does not check that the still's picture matches its
// state.
//
// The two phases do not share a browser, so the printed loads do not compete
// with the live watch's animation. A printed page mounts every slide but
// draws the still of its own slide only (slide-bottom.vue). Chromium draws
// WebGL on the GPU, as Chrome does in a talk, or in software where there is
// none (browser.ts); the check is the same, but slower. The output names the
// renderer.
//
// The diving board (components/DivingBoard.vue) is checked the same way: the
// printed page must show the board when the live slide does, its picture when
// the live one does, curling when it curls, and its SVG clock must be at the
// pose of its click: the bottom of the swing, inside the curl, or, once only
// the rest shape shows, the end of the sentence's edit. The live board
// bounces, so its time is not compared. The live board is the watch layer's
// (global-bottom.vue), and a printed page's is the page's own
// (slide-bottom.vue). A page with no board shows none.
//
// --browser runs it in Firefox or in Playwright's WebKit, which is not Safari
// itself.
//
// Not covered: the PDF export, which Slidev draws on a route (`/print`) that
// only its export mode has, so a build cannot open it. It reads the same
// `$clicks` through a nav of its own for each page. After a change to the
// stills, look at `pnpm export`'s pages for the Hairspring slide.
//
// A page with no still is a page with no watch: its state is "null", the same
// as the live canvas's on a slide that hides the watch. Every outside request
// fails the check, as in stem/tools/offline-check.ts.

import { parseArgs } from "node:util";
import type { Browser, Page } from "playwright-chromium";
import { boardPoseTime } from "../watch/board.ts";
import type { BoardTiming } from "../watch/board.ts";
import {
  ENGINES,
  ORIGIN,
  isEngine,
  openDeck,
  requireDeck,
  withBrowser,
} from "./browser.ts";
import type { Engine, ServedPage } from "./browser.ts";

const STEP_LIMIT = 1000; // no talk has this many steps
/** s: the SVG's clock reads a little after it is set. */
const BOARD_TIME_TOLERANCE_S = 0.05;
const VIEWPORT = { width: 1960, height: 1104 };
/** Browsers that load printed pages at once. On an Apple M3 Pro, 47 pages
 *  took 21.5 s in one and 8.9 s in three. */
const PRINTED_BROWSERS = 3;
const LIVE_BOARD = ".watch-layer .diving-board";

/** A slide and a click of it. */
export interface Position {
  readonly slide: number;
  readonly click: number;
}

/** A diving board on a page: whether its picture and its rest shape show,
 *  whether it curls, its SVG clock (s), and the times of its file. */
export interface BoardPose {
  readonly picture: boolean;
  readonly rest: boolean;
  readonly curling: boolean;
  readonly time: number;
  readonly timing: BoardTiming;
}

/** What a page shows: the watch's state, its `data-watch` ("null" for no
 *  watch), and the diving board. */
export interface PrintedView {
  readonly watch: string;
  readonly board: BoardPose | null;
}

/** What the live slide shows at one position. */
export interface LiveView extends PrintedView {
  readonly position: Position;
}

/** A printed page that did not load, and why. */
export interface Unloaded {
  readonly failure: string;
}

/** What is wrong with a printed page's board, against the live one's. */
export function boardProblems(
  live: BoardPose | null,
  printed: BoardPose | null,
): string[] {
  const shown = (pose: BoardPose | null) =>
    pose !== null && (pose.picture || pose.rest);
  if (live === null || printed === null) {
    return shown(live) || shown(printed)
      ? ["only one of the two pages shows the board"]
      : [];
  }
  const flags = (pose: BoardPose) => ({
    shown: shown(pose),
    picture: pose.picture,
    curling: pose.curling,
  });
  const [seen, wanted] = [flags(printed), flags(live)];
  const problems = (["shown", "picture", "curling"] as const)
    .filter((name) => seen[name] !== wanted[name])
    .map(
      (name) =>
        `the board's ${name} is ${String(seen[name])}, live ${String(wanted[name])}`,
    );
  if (!shown(printed)) return problems;
  // The pose of its click: what slide-bottom.vue sets the clock to. The
  // picture shows with the curl only at the curl's click.
  const { picture, rest, curling, time, timing } = printed;
  const pose = boardPoseTime(timing, {
    rest,
    curling,
    curlsHere: curling && picture,
    place: curling ? "curled" : "swing",
  });
  if (Math.abs(time - pose) > BOARD_TIME_TOLERANCE_S) {
    problems.push(
      `the board's clock, ${time.toFixed(2)} s, is not at its click's pose, ${pose.toFixed(2)} s`,
    );
  }
  return problems;
}

/** What is wrong with the printed pages, against the live views. Also the
 *  number of printed pages that show the watch. */
export function pageProblems(
  live: readonly LiveView[],
  printed: ReadonlyMap<Position, PrintedView | Unloaded>,
): { problems: string[]; withWatch: number } {
  const problems: string[] = [];
  let withWatch = 0;
  for (const view of live) {
    const where = `slide ${String(view.position.slide)}, click ${String(view.position.click)}`;
    const page = printed.get(view.position);
    if (page === undefined || "failure" in page) {
      const why = page ? `: ${page.failure}` : "";
      problems.push(`${where}: the printed page did not load${why}`);
      continue;
    }
    if (page.watch !== view.watch) {
      problems.push(
        `${where}: the printed page shows ${page.watch}, the live slide ${view.watch}`,
      );
    }
    problems.push(
      ...boardProblems(view.board, page.board).map(
        (problem) => `${where}: ${problem}`,
      ),
    );
    if (page.watch !== "null") withWatch++;
  }
  // a check of no watch compares nothing
  if (withWatch === 0)
    problems.push("no page shows the watch: nothing was compared");
  return { problems, withWatch };
}

/** The selector of slide `slide`'s page. */
function slideSelector(slide: number): string {
  return `[data-slidev-no="${String(slide)}"]`;
}

/** Let Vue apply its changes and the browser paint them. */
async function paint(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

/** Go to `path` and wait until `slide` is on the screen and settled. In
 *  print mode Slidev draws every slide, and only this one has a size. */
async function show(
  { page }: ServedPage,
  path: string,
  slide: number,
): Promise<void> {
  await page.goto(`${ORIGIN}/${path}`);
  const selector = slideSelector(slide);
  await page.waitForSelector(selector, { state: "visible" });
  await page.waitForFunction((selector) => {
    const slide = document.querySelector(selector);
    return (
      slide !== null &&
      [...slide.querySelectorAll<HTMLElement>("[data-waitfor]")].every(
        (host) => {
          const target = host.querySelector(host.dataset["waitfor"] ?? "");
          return (
            target !== null &&
            (!(target instanceof HTMLImageElement) ||
              (target.complete && target.naturalWidth > 0))
          );
        },
      )
    );
  }, selector);
  await paint(page);
}

/** Wait until the live layers have loaded and settled; a story that runs
 *  goes on, so the curl click keeps its intermediate picture. The paint
 *  first lets Slidev apply the step. No paint after: what is read next is
 *  the page's state, not its pixels, and in software WebGL a paint takes
 *  most of a second. */
async function liveReady(page: Page): Promise<void> {
  await paint(page);
  await page.waitForFunction((board) => {
    const host = document.querySelector<HTMLElement>(board);
    const canvas = document.querySelector(".watch-canvas");
    return (
      window.slideState !== undefined &&
      canvas !== null &&
      window.slideState().settled["watch"] ===
        canvas.getAttribute("data-watch") &&
      host?.querySelector("svg") != null &&
      host.dataset["phase"] !== undefined
    );
  }, LIVE_BOARD);
}

/** Wait until a press would be a step, not a jump: a press during a move
 *  jumps (../../docs/navigation.md, "A press during a move"), and the
 *  board's story plays only on a step. */
async function stepReady(page: Page): Promise<void> {
  await page.waitForFunction(() => window.slideState?.().busy === false);
}

/** The `data-watch` of the first element that `selector` finds, or "null". */
async function watchState(page: Page, selector: string): Promise<string> {
  const state = await page.evaluate(
    (selector) => document.querySelector(selector)?.getAttribute("data-watch"),
    selector,
  );
  return state ?? "null";
}

/** The diving board that `selector` finds, or null if there is none. */
async function boardPose(
  page: Page,
  selector: string,
): Promise<BoardPose | null> {
  return page.evaluate((selector) => {
    const host = document.querySelector(selector);
    const board = host?.querySelector("svg");
    if (!host || !board) return null;
    const time = (name: string) => Number(board.dataset[name]);
    return {
      picture: host.classList.contains("diving-board-picture-on"),
      rest: host.classList.contains("diving-board-rest-on"),
      curling: board.classList.contains("diving-board-curling"),
      time: board.getCurrentTime(),
      timing: {
        swingStart: time("swingStart"),
        swingPeriod: time("swingPeriod"),
        curlStart: time("curlStart"),
        curlDuration: time("curlDuration"),
        editDuration: time("editDuration"),
      },
    };
  }, selector);
}

/** The renderer that draws the live watch: the GPU, or SwiftShader where
 *  there is none. */
async function renderer(page: Page): Promise<string> {
  return page.evaluate(() => {
    if (!window.watchStage) throw new Error("no live watch");
    return window.watchStage.renderer.info().renderer;
  });
}

/** Step through the live deck, and record what each position shows. */
async function walkLive(browser: Browser, deck: string) {
  const live = await openDeck(browser, deck, { viewport: VIEWPORT });
  await show(live, "1", 1);
  await liveReady(live.page);
  const gl = await renderer(live.page);
  const views: LiveView[] = [];
  for (let url = live.page.url(); views.length < STEP_LIMIT;) {
    const address = new URL(url);
    const board = await boardPose(live.page, LIVE_BOARD);
    views.push({
      position: {
        slide: Number(address.pathname.slice(1)),
        click: Number(address.searchParams.get("clicks") ?? 0),
      },
      watch: await watchState(live.page, ".watch-canvas"),
      board,
    });
    // only while the board shows: elsewhere a jump shows the same state
    // as a step, and the waits would make the walk slow
    if (board?.picture) await stepReady(live.page);
    await live.page.keyboard.press("ArrowRight");
    await liveReady(live.page);
    if (live.page.url() === url) {
      return { views, gl, problems: live.problems() };
    }
    url = live.page.url();
  }
  const endless = `the walk did not end within ${String(STEP_LIMIT)} steps`;
  return { views, gl, problems: [endless, ...live.problems()] };
}

/** What the printed page of `position` shows. */
async function printedView(
  printed: ServedPage,
  { slide, click }: Position,
): Promise<PrintedView> {
  await show(
    printed,
    `${String(slide)}?print=clicks&clicks=${String(click)}`,
    slide,
  );
  const page = slideSelector(slide);
  return {
    watch: await watchState(printed.page, `${page} .watch-still`),
    board: await boardPose(printed.page, `${page} .diving-board`),
  };
}

/** Load the printed page of each position that `queue` gives, in one
 *  browser. The browsers share the queue, so each takes the next position
 *  when it is free. A page that fails is recorded, and the next one loads. */
async function loadPrinted(
  browser: Browser,
  deck: string,
  queue: IterableIterator<Position>,
) {
  const printed = await openDeck(browser, deck, { viewport: VIEWPORT });
  const views = new Map<Position, PrintedView | Unloaded>();
  for (const position of queue) {
    try {
      views.set(position, await printedView(printed, position));
    } catch (error) {
      const failure = error instanceof Error ? error.message : String(error);
      views.set(position, { failure: failure.split("\n")[0] ?? failure });
    }
  }
  return { views, problems: printed.problems() };
}

async function check(deck: string, engine: Engine): Promise<boolean> {
  const live = await withBrowser(engine, (browser) => walkLive(browser, deck));
  const queue = live.views.map((view) => view.position).values();
  const loads = await Promise.all(
    Array.from({ length: PRINTED_BROWSERS }, () =>
      withBrowser(engine, (browser) => loadPrinted(browser, deck, queue)),
    ),
  );
  const printed = new Map(loads.flatMap((load) => [...load.views]));
  const { problems, withWatch } = pageProblems(live.views, printed);
  console.log(`WebGL renderer: ${live.gl}`);
  console.log(
    `slides and clicks compared: ${String(live.views.length)}, with the watch: ${String(withWatch)}`,
  );
  const all = [
    ...live.problems,
    ...loads.flatMap((load) => load.problems),
    ...problems,
  ];
  for (const problem of all) console.log(`FAIL ${problem}`);
  return all.length === 0;
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { browser: { type: "string", default: "chromium" } },
  });
  const [deck] = positionals;
  if (
    deck === undefined ||
    positionals.length > 1 ||
    !isEngine(values.browser)
  ) {
    console.error(
      `usage: node art/print-check.ts DECK_DIR [--browser ${Object.keys(ENGINES).join("|")}]`,
    );
    process.exit(2);
  }
  requireDeck(deck);
  process.exitCode = (await check(deck, values.browser)) ? 0 : 1;
}

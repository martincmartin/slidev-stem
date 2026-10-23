// Check a built deck with a fast forward smoke walk.
//
//     pnpm smokecheck /tmp/deck                     # at the root; Chromium
//     pnpm smokecheck /tmp/deck --browser firefox
//     pnpm smokecheck /tmp/deck --browser all --no-canvas-readback
//
// Full validation runs it in Chromium, Firefox and WebKit at once, with
// --no-canvas-readback (2D canvas pixel reads throw, as a privacy protection
// can make them). Each walk is in a fresh context, as a private window is, and
// Chromium draws WebGL on the GPU where there is one (browser.ts). This is not
// a copy of each browser's privacy policy. Quick validation has no browser
// walk.
//
// The house theme gives window.slideNavigation(), typed by
// ../themes/house/navigation.ts (../docs/navigation.md, "Validation: fast
// smoke navigation").
// Each press of the right arrow must reach the next position that it declares,
// and the walk must end at the last slide's last click. A page error, a
// request to another host, missing or wrong navigation data, and a stall fail.
// It does not check animations, going back, or loading a place directly: run
// navcheck.ts when you suspect a navigation problem. It exits 1 on a failure,
// and 2 on a usage error.

import { parseArgs } from "node:util";
import type { Browser, Page } from "playwright-chromium";
import type { Position, SlideNavigation } from "../themes/house/navigation.ts";
import {
  DECK_VIEWPORT,
  describeProblem,
  ENGINES,
  FIRST,
  isEngine,
  MOST_POSITIONS,
  named,
  openDeck,
  ORIGIN,
  outsideUrls,
  pathOf,
  READY_TIMEOUT_MS,
  reasonOf,
  requireDeck,
  same,
  showSlide,
  withBrowser,
} from "./browser.ts";
import type { Engine, PageProblem } from "./browser.ts";

/** The walk's deadlines and bounds. */
export interface SmokeLimits {
  /** ms: for the deck to start. */
  readonly readyTimeoutMs: number;
  /** ms: for a press to reach its position. */
  readonly moveTimeoutMs: number;
  /** ms: to wait after the start, before the first press. */
  readonly startupMs: number;
  /** ms: to stay at each position. */
  readonly visitMs: number;
}

export const DEFAULT_LIMITS: SmokeLimits = {
  readyTimeoutMs: READY_TIMEOUT_MS,
  moveTimeoutMs: 2_000,
  startupMs: 1_500,
  visitMs: 100,
};

/** One engine's walk: the positions it reached, or why it stopped; and the
 *  page's errors and outside requests. */
export interface Walk {
  readonly engine: Engine;
  readonly result:
    | { readonly kind: "walked"; readonly positions: readonly Position[] }
    | { readonly kind: "failed"; readonly reason: string };
  readonly problems: readonly PageProblem[];
}

function isPosition(value: unknown): value is Position {
  if (typeof value !== "object" || value === null) return false;
  const { slide, click } = value as Record<string, unknown>;
  return (
    Number.isInteger(slide) &&
    Number.isInteger(click) &&
    (slide as number) >= 1 &&
    (click as number) >= 0
  );
}

/** `data`, from the page, if it is navigation data that holds together; else
 *  an error. */
export function checkedNavigation(data: unknown): SlideNavigation {
  if (!isPosition(data)) throw new Error("the deck gave no navigation data");
  const { clicksTotal, lastSlide, next } = data as Position &
    Record<string, unknown>;
  if (
    !Number.isInteger(clicksTotal) ||
    !Number.isInteger(lastSlide) ||
    (next !== null && !isPosition(next)) ||
    (lastSlide as number) < data.slide ||
    (clicksTotal as number) < data.click
  ) {
    throw new Error(
      "the deck gave navigation data that does not hold together",
    );
  }
  return data as SlideNavigation;
}

async function navigation(page: Page): Promise<SlideNavigation> {
  return checkedNavigation(
    await page.evaluate(() => window.slideNavigation?.() ?? null),
  );
}

/** Press the right arrow from slide 1 to the end. Returns the positions, or
 *  throws at the first that is not the declared one. */
async function walk(page: Page, limits: SmokeLimits): Promise<Position[]> {
  await page.waitForTimeout(limits.startupMs);
  let state = await navigation(page);
  if (!same(state, FIRST)) {
    throw new Error(`the walk started at ${named(state)}, not 1:0`);
  }
  const positions: Position[] = [FIRST];
  while (state.next !== null) {
    if (positions.length >= MOST_POSITIONS) {
      throw new Error(`the walk passed ${String(MOST_POSITIONS)} positions`);
    }
    const target = state.next;
    if (positions.some((position) => same(position, target))) {
      throw new Error(`the deck declared ${named(target)} a second time`);
    }
    await page.keyboard.press("ArrowRight");
    await page.waitForURL(`${ORIGIN}${pathOf(target)}`, {
      timeout: limits.moveTimeoutMs,
    });
    await page.waitForTimeout(limits.visitMs);
    const lastSlide = state.lastSlide;
    state = await navigation(page);
    if (!same(state, target) || state.lastSlide !== lastSlide) {
      throw new Error(
        `a press went to ${named(state)}, not the declared ${named(target)}`,
      );
    }
    positions.push(target);
  }
  if (!same(state, { slide: state.lastSlide, click: state.clicksTotal })) {
    throw new Error(`the walk stopped at ${named(state)}, before the end`);
  }
  return positions;
}

/** How to walk: the limits, and whether a 2D canvas's pixel reads throw. */
export interface WalkOptions {
  readonly limits?: SmokeLimits;
  readonly noCanvasReadback?: boolean;
}

/** Walk the built deck in `deck` in `engine`. An engine that does not start
 *  is a failed walk, so that the other engines' walks still report. */
export async function check(
  deck: string,
  engine: Engine,
  { limits = DEFAULT_LIMITS, noCanvasReadback = false }: WalkOptions = {},
): Promise<Walk> {
  const walkIn = async (browser: Browser): Promise<Walk> => {
    const { page, problems } = await openDeck(browser, deck, {
      viewport: DECK_VIEWPORT,
    });
    if (noCanvasReadback) {
      await page.context().addInitScript(() => {
        CanvasRenderingContext2D.prototype.getImageData = () => {
          throw new Error("canvas pixel reads are blocked by the smoke check");
        };
      });
    }
    let result: Walk["result"];
    try {
      await showSlide(page, ORIGIN, pathOf(FIRST), limits.readyTimeoutMs);
      await page.waitForFunction(
        () => typeof window.slideNavigation === "function",
        undefined,
        { timeout: limits.readyTimeoutMs },
      );
      result = { kind: "walked", positions: await walk(page, limits) };
    } catch (error) {
      result = { kind: "failed", reason: reasonOf(error) };
    }
    return { engine, result, problems: problems() };
  };
  try {
    return await withBrowser(engine, walkIn);
  } catch (error) {
    return {
      engine,
      result: {
        kind: "failed",
        reason: `the browser failed: ${reasonOf(error)}`,
      },
      problems: [],
    };
  }
}

/** `walks` as lines of text: each engine's, then a summary. */
export function report(
  walks: readonly Walk[],
  noCanvasReadback: boolean,
): string[] {
  const lines: string[] = [];
  for (const { engine, result, problems } of walks) {
    const blocked = noCanvasReadback ? ", canvas reads blocked" : "";
    if (result.kind === "walked") {
      const final = result.positions.at(-1);
      const end = final ? named(final) : "nowhere";
      lines.push(
        `${engine}${blocked}: ${String(result.positions.length)} positions, to ${end}`,
      );
    } else {
      lines.push(`FAIL  ${engine}${blocked}: ${result.reason}`);
    }
    for (const problem of problems) {
      lines.push(`FAIL  ${engine}: ${describeProblem(problem)}`);
    }
  }
  const outside = outsideUrls(walks.flatMap((walk) => walk.problems)).length;
  lines.push(
    `${walks.map((walk) => walk.engine).join(", ")}: outside requests: ${String(outside)}`,
  );
  return lines;
}

export function passed(walks: readonly Walk[]): boolean {
  return walks.every(
    (walk) => walk.result.kind === "walked" && walk.problems.length === 0,
  );
}

if (import.meta.main) {
  const usage =
    "usage: pnpm smokecheck DECK [--browser chromium|firefox|webkit|all]" +
    " [--no-canvas-readback]";
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        browser: { type: "string", default: "chromium" },
        "no-canvas-readback": { type: "boolean", default: false },
      },
    });
  } catch (error) {
    console.error(`${String(error)}\n${usage}`);
    process.exit(2);
  }
  const { positionals, values } = parsed;
  const [deck] = positionals;
  const engines =
    values.browser === "all"
      ? (Object.keys(ENGINES) as Engine[])
      : isEngine(values.browser)
        ? [values.browser]
        : [];
  if (deck === undefined || positionals.length > 1 || engines.length === 0) {
    console.error(usage);
    process.exit(2);
  }
  requireDeck(deck);
  const noCanvasReadback = values["no-canvas-readback"];
  const walks = await Promise.all(
    engines.map((engine) => check(deck, engine, { noCanvasReadback })),
  );
  for (const line of report(walks, noCanvasReadback)) console.log(line);
  process.exitCode = passed(walks) ? 0 : 1;
}

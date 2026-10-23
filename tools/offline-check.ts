// Load a built Slidev deck with every outside request blocked, and report.
//
//     pnpm exec slidev build --out /tmp/deck          # in the talk's directory
//     pnpm offline-check /tmp/deck 1:0 2:0 2:5 3:0    # at the root; slide:click ...
//     pnpm offline-check /tmp/deck 2:5 --shots /tmp/png/after
//     pnpm offline-check /tmp/deck --clicks 2 --back  # step through slide 2
//     pnpm offline-check /tmp/deck --walk             # every slide and click
//
// A diagnostic tool, for screenshots and walks: full validation uses
// smokecheck.ts. It serves the build from disk (browser.ts): no web server is
// needed, and every request to another host is aborted and listed. A talk
// passes the offline rule only if that list is empty.
//
// For each slide:click it prints the slide's classes, background, text
// colour, body font, the h1's font, weight, size and colour, and the families
// of the loaded web fonts. --shots PREFIX also saves
// PREFIX-<slide>-<click>.png (1960 x 1104). --clicks SLIDE presses the right
// arrow --presses times (7) from that slide, and prints, for each press, one
// character for each v-click element, from its opacity: '-' hidden, 'd'
// dimmed, 'V' shown. --back then presses the left arrow as many times. After
// each string, "classes k/n" says how many of the n v-click elements still
// have Slidev's slidev-vclick-target class. --walk presses the right arrow
// from slide 1 until the URL stops changing, so every slide and click loads,
// and a request from any of them is caught.
//
// It fails (exit 1) on an outside request, and also if the deck does not
// work: a page error, a page that shows no slide in time, a walk that does
// not move from slide 1, or one that reaches MOST_POSITIONS (browser.ts)
// without an end. A deck that cannot start requests nothing, so a count of
// requests alone would pass it. It exits 2 on a usage error.

import { parseArgs } from "node:util";
import type { Page } from "playwright-chromium";
import type { Position } from "../themes/house/navigation.ts";
import {
  DECK_VIEWPORT,
  describeProblem,
  FIRST,
  isEngine,
  MOST_POSITIONS,
  named,
  openDeck,
  ORIGIN,
  outsideUrls,
  pathOf,
  positionOf,
  requireDeck,
  showSlide,
  withBrowser,
} from "./browser.ts";

/** ms: the wait after a deck starts, and after each press of a walk. */
const STARTUP_MS = 1_500;
const PRESS_MS = 500;

/** What a walk needs of a page. */
export interface Walkable {
  url(): string;
  waitForTimeout(timeout: number): Promise<void>;
  readonly keyboard: { press(key: string): Promise<void> };
}

/** A walk's URLs, and why it failed, if it did. */
interface RapidWalk {
  readonly urls: readonly string[];
  readonly failure:
    | { readonly kind: "did not move" }
    | { readonly kind: "did not end"; readonly steps: number }
    | null;
}

/** Press the right arrow every PRESS_MS until the URL stops changing, at
 *  most `steps` times. The presses can cut an animation short. */
export async function rapidWalk(
  page: Walkable,
  steps: number = MOST_POSITIONS,
): Promise<RapidWalk> {
  await page.waitForTimeout(STARTUP_MS);
  const urls = [page.url()];
  while (urls.length < steps) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(PRESS_MS);
    if (page.url() === urls.at(-1)) break;
    urls.push(page.url());
  }
  const failure =
    urls.length === 1
      ? ({ kind: "did not move" } as const)
      : urls.length >= steps
        ? ({ kind: "did not end", steps } as const)
        : null;
  return { urls, failure };
}

/** The path and query of `url`, at the deck's origin. */
const routeOf = (url: string) => {
  const { pathname, search } = new URL(url);
  return pathname + search;
};

/** Walk rapidly from where `page` is, print where the walk went, and return
 *  why it failed, as text, or null. */
export async function reportRapidWalk(page: Page): Promise<string | null> {
  const { urls, failure } = await rapidWalk(page);
  const end = urls.at(-1);
  console.log(
    `walked ${String(urls.length)} steps, to ${end ? routeOf(end) : "nowhere"}`,
  );
  if (failure === null) return null;
  return failure.kind === "did not move"
    ? "the walk did not move from slide 1"
    : `the walk did not end within ${String(failure.steps)} steps`;
}

/** The shown slide's look. It runs in the page. */
function slideLook() {
  const layouts = [...document.querySelectorAll<HTMLElement>(".slidev-layout")];
  const layout =
    layouts.find((element) => element.offsetParent !== null) ?? layouts[0];
  if (!layout) return null;
  const style = getComputedStyle(layout);
  const heading = layout.querySelector("h1");
  const headingStyle = heading ? getComputedStyle(heading) : null;
  const firstFamily = (family: string) => family.split(",")[0] ?? "";
  return {
    classes: layout.className,
    background: style.backgroundColor,
    color: style.color,
    font: firstFamily(style.fontFamily),
    h1: headingStyle
      ? [
          firstFamily(headingStyle.fontFamily),
          headingStyle.fontWeight,
          headingStyle.fontSize,
          headingStyle.color,
        ].join(" ")
      : null,
    webfonts: [
      ...new Set(
        [...document.fonts]
          .filter((font) => font.status === "loaded")
          .map((font) => `${font.family} ${font.weight}`),
      ),
    ],
  };
}

// Mark each v-click element once, at click 0, then judge each by its
// computed opacity. Not by Slidev's classes: when a component renders its own
// :class binding again, Vue can drop the classes that the v-click directive
// added, though the element still shows and hides. The opacity is multiplied
// down through descendants that are an only child, so a v-click wrapper
// around a dimmed component reads as dimmed.

/** Mark the v-click elements of the shown slide. It runs in the page. */
function markClicks(): void {
  for (const element of document.querySelectorAll<HTMLElement>(
    ".slidev-vclick-target",
  )) {
    const slide = element.closest<HTMLElement>(".slidev-page");
    if (slide?.offsetParent != null) element.dataset["vc"] = "1";
  }
}

/** Each marked element's state, as one character, and how many still have
 *  Slidev's class. It runs in the page. */
function clickStates() {
  const marked = [...document.querySelectorAll<HTMLElement>("[data-vc]")];
  const states = marked.map((element) => {
    let opacity = 1;
    for (
      let at: Element | undefined = element;
      at;
      at = at.children.length === 1 ? at.children[0] : undefined
    ) {
      opacity *= parseFloat(getComputedStyle(at).opacity);
    }
    return opacity < 0.05 ? "-" : opacity < 0.9 ? "d" : "V";
  });
  const classed = marked.filter((element) =>
    element.classList.contains("slidev-vclick-target"),
  ).length;
  return { states: states.join(""), classed, marked: marked.length };
}

interface Options {
  readonly places: readonly Position[];
  readonly shots: string | undefined;
  readonly clicks: number | undefined;
  readonly presses: number;
  readonly back: boolean;
  readonly walk: boolean;
}

/** Do what `options` asks on `page`, print what it sees, and return the
 *  problems that it found. */
async function inspect(page: Page, options: Options): Promise<string[]> {
  const problems: string[] = [];
  const show = async (path: string) => {
    try {
      await showSlide(page, ORIGIN, path);
      return true;
    } catch (error) {
      // by name: each Playwright package can have its own TimeoutError
      if (!(error instanceof Error) || error.name !== "TimeoutError")
        throw error;
      problems.push(`${path} showed no slide in time: ${error.message}`);
      return false;
    }
  };
  for (const place of options.places) {
    if (!(await show(pathOf(place)))) continue;
    await page.waitForTimeout(1_800);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    console.log(named(place), JSON.stringify(await page.evaluate(slideLook)));
    if (options.shots !== undefined) {
      const [slide, click] = [String(place.slide), String(place.click)];
      await page.screenshot({ path: `${options.shots}-${slide}-${click}.png` });
    }
  }
  if (
    options.clicks !== undefined &&
    (await show(`/${String(options.clicks)}`))
  ) {
    await page.waitForTimeout(STARTUP_MS);
    await page.evaluate(markClicks);
    const keys = [
      ...Array<string>(options.presses).fill("ArrowRight"),
      ...Array<string>(options.back ? options.presses : 0).fill("ArrowLeft"),
    ];
    for (const [presses, key] of keys.entries()) {
      const { states, classed, marked } = await page.evaluate(clickStates);
      console.log(
        `after ${String(presses)} presses: ${states.padEnd(12)} ` +
          `classes ${String(classed)}/${String(marked)}  url=${routeOf(page.url())}`,
      );
      await page.keyboard.press(key);
      await page.waitForTimeout(PRESS_MS);
    }
  }
  if (options.walk && (await show(pathOf(FIRST)))) {
    const failure = await reportRapidWalk(page);
    if (failure !== null) problems.push(failure);
  }
  return problems;
}

if (import.meta.main) {
  const usage =
    "usage: pnpm offline-check DECK [SLIDE:CLICK...] [--shots PREFIX]\n" +
    "         [--clicks SLIDE [--presses N] [--back]] [--walk]\n" +
    "         [--browser chromium|firefox|webkit] [--color-scheme light|dark]";
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        browser: { type: "string", default: "chromium" },
        shots: { type: "string" },
        clicks: { type: "string" },
        presses: { type: "string", default: "7" },
        back: { type: "boolean", default: false },
        walk: { type: "boolean", default: false },
        "color-scheme": { type: "string", default: "light" },
      },
    });
  } catch (error) {
    console.error(`${String(error)}\n${usage}`);
    process.exit(2);
  }
  const { positionals, values } = parsed;
  const [deck, ...placeNames] = positionals;
  const places = placeNames.map(positionOf);
  const engine = values.browser;
  const colorScheme = values["color-scheme"];
  const clicks =
    values.clicks === undefined ? undefined : Number(values.clicks);
  const presses = Number(values.presses);
  const wellFormed =
    deck !== undefined &&
    isEngine(engine) &&
    (colorScheme === "light" || colorScheme === "dark") &&
    places.every((place) => place !== null) &&
    (clicks === undefined || (Number.isInteger(clicks) && clicks >= 1)) &&
    Number.isInteger(presses) &&
    presses >= 0;
  if (!wellFormed) {
    console.error(usage);
    process.exit(2);
  }
  requireDeck(deck);
  const options: Options = {
    places,
    shots: values.shots,
    clicks,
    presses,
    back: values.back,
    walk: values.walk,
  };
  const { found, outside } = await withBrowser(engine, async (browser) => {
    const served = await openDeck(browser, deck, {
      viewport: DECK_VIEWPORT,
      colorScheme,
    });
    const inspected = await inspect(served.page, options);
    const problems = served.problems();
    return {
      found: [
        ...inspected,
        ...problems
          .filter((problem) => problem.kind === "page error")
          .map(describeProblem),
      ],
      outside: outsideUrls(problems),
    };
  });
  console.log(`outside requests: ${String(outside.length)}`);
  for (const url of outside) console.log(`   ${url}`);
  for (const problem of found) console.log(`FAIL ${problem}`);
  process.exitCode = found.length > 0 || outside.length > 0 ? 1 : 0;
}

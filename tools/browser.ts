// The browsers that the house's deck checks drive, and what they give them: a
// built deck from a directory, with no server and no port, and no request to
// any other host. A talk's art scripts have their own copy
// (watches/art/browser.ts): a talk does not import the house tools.

import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { chromium } from "playwright-chromium";
import type { Browser, BrowserContextOptions, Page } from "playwright-chromium";
import { firefox } from "playwright-firefox";
import { webkit } from "playwright-webkit";
import type { Position } from "../themes/house/navigation.ts";
// Chromium's arguments: WebGL on the GPU, as Chrome draws a talk, or, where
// there is none (Linux without /dev/dri), ANGLE's SwiftShader, the faster of
// its software renderers (browsers.py, which reads the same file;
// ../docs/talks.md, "Browser support").
import CHROMIUM_ARGS from "./chromium-args.json" with { type: "json" };

/** The engines that a talk must work in (../docs/talks.md, "Browser
 *  support"). Playwright's WebKit is not Safari itself. */
export const ENGINES = { chromium, firefox, webkit };
export type Engine = keyof typeof ENGINES;

export function isEngine(name: string): name is Engine {
  return Object.hasOwn(ENGINES, name);
}

/** The host that a served deck answers for. No real host ends in `.test`. */
const HOST = "deck.test";
/** Where a served deck is: https, a secure context, as a published deck is. */
export const ORIGIN = `https://${HOST}`;
/** CSS px: the size of a deck's window in the checks, 2 slide widths. */
export const DECK_VIEWPORT = { width: 1960, height: 1104 };

/** ms: the longest wait for a deck's page to show a slide. */
export const READY_TIMEOUT_MS = 15_000;
/** The most positions that a walk goes to: no talk has this many. */
export const MOST_POSITIONS = 1_000;

/** Where a deck starts. */
export const FIRST: Position = { slide: 1, click: 0 };

/** The path of `position` in a deck: Slidev's route. */
export function pathOf({ slide, click }: Position): string {
  return `/${String(slide)}${click > 0 ? `?clicks=${String(click)}` : ""}`;
}

/** The position that a deck's `url` shows: `pathOf` read back. */
export function placeOf(url: string): Position {
  const { pathname, searchParams } = new URL(url);
  const slide = pathname.split("/").filter(Boolean).at(-1) ?? "1";
  return {
    slide: Number(slide),
    click: Number(searchParams.get("clicks") ?? 0),
  };
}

/** The position that `text` names ("slide:click", as `named` writes it), or
 *  null if it names none. */
export function positionOf(text: string): Position | null {
  const match = /^(\d+):(\d+)$/.exec(text);
  if (!match) return null;
  const slide = Number(match[1]);
  return slide >= 1 ? { slide, click: Number(match[2]) } : null;
}

export const same = (one: Position, other: Position) =>
  one.slide === other.slide && one.click === other.click;

/** `position` as text: "slide:click". */
export const named = ({ slide, click }: Position) =>
  `${String(slide)}:${String(click)}`;

/** Exit with a message if `deck` is not a built deck. */
export function requireDeck(deck: string): void {
  if (!existsSync(join(deck, "index.html"))) {
    console.error(`${deck} has no index.html: build the deck first`);
    process.exit(2);
  }
}

async function isFile(path: string): Promise<boolean> {
  return (await stat(path).catch(() => undefined))?.isFile() ?? false;
}

/** An X server of its own, where there is no display: on Linux without one,
 *  headless Firefox has no WebGL, and draws no watch; with one, it draws in
 *  software, with Mesa (../docs/talks.md, "Cloud sessions"). Null where a display exists,
 *  where Xvfb is not installed, and off Linux. */
async function privateDisplay(): Promise<{
  readonly name: string;
  readonly stop: () => void;
} | null> {
  if (process.platform !== "linux" || process.env["DISPLAY"]) return null;
  // -displayfd: Xvfb picks a free display and writes its number to fd 3
  const server = spawn(
    "Xvfb",
    ["-displayfd", "3", "-screen", "0", "1280x1024x24", "-nolisten", "tcp"],
    { stdio: ["ignore", "ignore", "ignore", "pipe"] },
  );
  const failed = once(server, "error").then(() => "");
  const output = server.stdio[3];
  const number =
    output instanceof Readable
      ? (async () => {
          let text = "";
          for await (const chunk of output) {
            text += String(chunk);
            if (text.includes("\n")) break;
          }
          return text.trim();
        })()
      : Promise.resolve("");
  const display = await Promise.race([number, failed]);
  if (display === "") {
    server.kill();
    return null;
  }
  return { name: `:${display}`, stop: () => server.kill() };
}

/** Start `engine`, give `use` the browser, and close it after. Chromium
 *  draws WebGL on the GPU where there is one; Firefox gets an X server of its
 *  own where there is no display. */
export async function withBrowser<T>(
  engine: Engine,
  use: (browser: Browser) => Promise<T>,
): Promise<T> {
  const gpu = process.platform === "darwin" || existsSync("/dev/dri");
  const display = engine === "firefox" ? await privateDisplay() : null;
  try {
    const browser = await ENGINES[engine].launch(
      engine === "chromium"
        ? { args: gpu ? CHROMIUM_ARGS.gpu : CHROMIUM_ARGS.noGpu }
        : display
          ? { env: { ...process.env, DISPLAY: display.name } }
          : {},
    );
    try {
      return await use(browser);
    } finally {
      await browser.close();
    }
  } finally {
    display?.stop();
  }
}

/** What went wrong on a page: an error that its scripts threw, or a request
 *  to another host. */
export type PageProblem =
  | { readonly kind: "page error"; readonly message: string }
  | { readonly kind: "outside request"; readonly url: string };

/** The URLs of the outside requests in `problems`. */
export function outsideUrls(problems: readonly PageProblem[]): string[] {
  return problems.flatMap((problem) =>
    problem.kind === "outside request" ? [problem.url] : [],
  );
}

/** An error, or anything thrown, as text. */
export const reasonOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function describeProblem(problem: PageProblem): string {
  return problem.kind === "page error"
    ? `page error: ${problem.message}`
    : `outside request: ${problem.url}`;
}

/** A page in a fresh context of its own (no saved data, as a private
 *  window). */
export interface DeckPage {
  readonly page: Page;
  /** What went wrong on the page so far, in order. */
  readonly problems: () => readonly PageProblem[];
}

/** Open a page in `browser`, in a new context with `options`. With `deck`, a
 *  built deck's directory, the page gets the deck at ORIGIN: a file at its
 *  path, and index.html for a path that is not a file (Slidev's routes). A
 *  request to any other host is aborted, and is a problem: a talk must work
 *  offline. Without `deck`, the page goes where the caller sends it (a dev
 *  server). Either way it has a screen wake lock, which a headless browser
 *  cannot give, and which Slidev asks for at a secure origin
 *  (../docs/talks.md, "Browser support"). */
export async function openDeck(
  browser: Browser,
  deck: string | undefined,
  options: BrowserContextOptions = {},
): Promise<DeckPage> {
  const context = await browser.newContext(options);
  const problems: PageProblem[] = [];
  if (deck !== undefined) {
    const root = resolve(deck);
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      // the page's own; WebKit routes them too
      if (url.protocol === "blob:" || url.protocol === "data:") {
        await route.continue();
        return;
      }
      if (url.host !== HOST) {
        problems.push({ kind: "outside request", url: url.href });
        await route.abort();
        return;
      }
      const file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
      const served =
        file.startsWith(root + sep) && (await isFile(file))
          ? file
          : join(root, "index.html");
      // Playwright gives the content type from the file's extension.
      await route.fulfill({ path: served });
    });
  }
  await context.addInitScript(() => {
    const sentinel = {
      released: false,
      type: "screen",
      onrelease: null,
      release: () => Promise.resolve(),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    };
    Object.defineProperty(navigator, "wakeLock", {
      value: {
        request: (type: string) =>
          type === "screen"
            ? Promise.resolve(sentinel)
            : Promise.reject(new TypeError(`no wake lock of type ${type}`)),
      },
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => {
    problems.push({ kind: "page error", message: error.message });
  });
  return { page, problems: () => [...problems] };
}

/** Go to `path` of the deck at `base` (within Playwright's default 30 s),
 *  and wait `timeout` ms more for a slide to show. Slidev draws its first one
 *  after its scripts run, so a deck that cannot start never shows one. */
export async function showSlide(
  page: Page,
  base: string,
  path: string,
  timeout: number = READY_TIMEOUT_MS,
): Promise<void> {
  await page.goto(`${base}${path}`);
  await page.waitForSelector(".slidev-layout", { state: "visible", timeout });
}

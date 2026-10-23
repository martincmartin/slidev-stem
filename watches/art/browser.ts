// The browsers that the art scripts drive, and what they give them: files
// from a directory, with no server and no port, and no request to any other
// host.

import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { chromium } from "playwright-chromium";
import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
} from "playwright-chromium";
import { firefox } from "playwright-firefox";
import { webkit } from "playwright-webkit";

/** The engines that a talk must work in (../../docs/talks.md, "Browser
 *  support"). Playwright's WebKit is not Safari itself. */
export const ENGINES = { chromium, firefox, webkit };
export type Engine = keyof typeof ENGINES;

export function isEngine(name: string): name is Engine {
  return Object.hasOwn(ENGINES, name);
}

/** Chromium's arguments: WebGL on the GPU, as Chrome draws a talk, or, where
 *  there is none (Linux without /dev/dri), ANGLE's SwiftShader, the faster of
 *  its software renderers. The same as stem/tools/browser.ts's: a talk does
 *  not import the house tools. */
const CHROMIUM_GPU = [
  "--use-angle=metal",
  "--enable-gpu",
  "--ignore-gpu-blocklist",
];
const CHROMIUM_NO_GPU = ["--use-angle=swiftshader"];

/** ms: the longest wait for a page. */
const TIMEOUT_MS = 60_000;

/** The host that a served page answers for. No real host ends in `.test`. */
const HOST = "files.test";
/** Where to load a served page from: https, a secure context, as a published
 *  deck is. */
export const ORIGIN = `https://${HOST}`;

async function isFile(path: string): Promise<boolean> {
  return (await stat(path).catch(() => undefined))?.isFile() ?? false;
}

/** Exit with a message if `deck` is not a built deck. */
export function requireDeck(deck: string): void {
  if (!existsSync(join(deck, "index.html"))) {
    console.error(`${deck} has no index.html: build the deck first`);
    process.exit(2);
  }
}

/** An X server of its own, where there is no display: on Linux without one,
 *  headless Firefox has no WebGL, and draws no watch; with one, it draws in
 *  software, with Mesa (../../docs/talks.md, "Cloud sessions"). Null where a display exists,
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
        ? { args: gpu ? CHROMIUM_GPU : CHROMIUM_NO_GPU }
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

/** Answer the requests of `context` from `directory`: a file at its path, and
 *  index.html for a path that is not a file (a deck's routes: Slidev uses
 *  history routing). A request to any other host is aborted and recorded in
 *  `outside`, which the caller checks: the art must work offline. */
async function serveFrom(
  context: BrowserContext,
  directory: string,
  outside: string[],
): Promise<void> {
  const root = resolve(directory);
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    // the page's own; WebKit routes them too
    if (url.protocol === "blob:" || url.protocol === "data:") {
      await route.continue();
      return;
    }
    if (url.host !== HOST) {
      outside.push(url.href);
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

/** A page in a fresh context of its own (no saved data, as a private
 *  window), served from a directory. */
export interface ServedPage {
  readonly page: Page;
  /** The page's errors and its requests outside the directory, so far. */
  readonly problems: () => string[];
}

/** Open a page in `browser`, in a new context with `options`, served from
 *  `directory`. */
export async function openPage(
  browser: Browser,
  directory: string,
  options: BrowserContextOptions = {},
): Promise<ServedPage> {
  const context = await browser.newContext(options);
  context.setDefaultTimeout(TIMEOUT_MS);
  const outside: string[] = [];
  await serveFrom(context, directory, outside);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page error: ${error.message}`));
  return {
    page,
    problems: () => [
      ...errors,
      ...outside.map((url) => `outside request: ${url}`),
    ],
  };
}

/** Open a page of the built deck in `deck`, as `openPage` does, with a
 *  screen wake lock that a headless browser cannot give
 *  (../../docs/talks.md, "Browser support"). */
export async function openDeck(
  browser: Browser,
  deck: string,
  options: BrowserContextOptions = {},
): Promise<ServedPage> {
  const served = await openPage(browser, deck, options);
  await served.page.context().addInitScript(() => {
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
  return served;
}

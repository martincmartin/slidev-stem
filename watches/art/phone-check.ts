// Does each page of the article read on a phone?
//
//     node art/phone-check.ts DECK_DIR [--shots DIR]   # also `pnpm art:phone`
//
// DECK_DIR is the built deck. Each page loads in each engine at a phone's
// size: WebKit as an iPhone, Chromium as an Android phone, and Firefox at the
// Android phone's size (Playwright cannot make Firefox a phone: no mobile
// viewport, no touch). It fails on a page error, an error that the page logs
// (a production Vue build logs an error in a render, and goes on: the
// figures of Chrome before 142 failed so), a request outside the deck,
// a page that scrolls sideways, an element past the screen's edge, and a
// small touch target (phone.ts). With --shots, it writes the top of each page
// and each figure as a PNG to DIR, for a person to look at: the check cannot
// tell whether a figure reads well (../docs/article.md, "On a phone").
// Emulation is not a phone: its GPU, memory and touch scrolling are the
// computer's.

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { devices } from "playwright-chromium";
import type { BrowserContextOptions, Page } from "playwright-chromium";
import { ORIGIN, openDeck, requireDeck, withBrowser } from "./browser.ts";
import type { Engine } from "./browser.ts";
import { phoneProblems } from "./phone.ts";
import type { PhonePage } from "./phone.ts";

/** A phone that an engine plays. */
interface Phone {
  readonly name: string;
  readonly engine: Engine;
  readonly options: BrowserContextOptions;
}

const IPHONE = devices["iPhone 15"];
const ANDROID = devices["Pixel 7"];
const PHONES: readonly Phone[] = [
  { name: "iphone", engine: "webkit", options: IPHONE },
  { name: "android", engine: "chromium", options: ANDROID },
  {
    name: "firefox",
    engine: "firefox",
    options: {
      viewport: ANDROID.viewport,
      deviceScaleFactor: ANDROID.deviceScaleFactor,
    },
  },
];

/** ms for a figure in view to draw, before its screenshot. */
const DRAW_MS = 1_000;

/** Measure the page that `page` shows (phone.ts). */
async function measure(page: Page): Promise<PhonePage> {
  return page.evaluate(() => {
    const name = (element: Element): string => {
      const id = element.closest("[id]")?.id;
      const kind = `${element.tagName.toLowerCase()}.${element.classList[0] ?? ""}`;
      const label = element.getAttribute("aria-label") ?? "";
      return `${kind}${label ? ` "${label}"` : ""}${id ? ` in #${id}` : ""}`;
    };
    const box = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      };
    };
    const main = document.querySelector("main");
    const placed = [...(main?.querySelectorAll("*") ?? [])]
      .filter(
        (element) =>
          element.parentElement?.closest(".article-figure-frame") === null,
      )
      .map((element) => ({ name: name(element), box: box(element) }));
    const targets = [
      ...(main?.querySelectorAll("button, input, select, nav a") ?? []),
    ]
      .map((element) => ({ name: name(element), box: box(element) }))
      .filter(({ box }) => box.right > box.left && box.bottom > box.top);
    return {
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      placed,
      targets,
    };
  });
}

/** Write the top of the page and each figure to `shots`. */
async function screenshots(
  page: Page,
  shots: string,
  prefix: string,
): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(DRAW_MS);
  await page.screenshot({ path: join(shots, `${prefix}-top.png`) });
  const figures = page.locator("figure.article-figure");
  for (let index = 0; index < (await figures.count()); index++) {
    const figure = figures.nth(index);
    await figure.scrollIntoViewIfNeeded();
    await page.waitForTimeout(DRAW_MS);
    const number = String(index + 1).padStart(2, "0");
    await figure.screenshot({
      path: join(shots, `${prefix}-figure-${number}.png`),
    });
  }
}

/** The problems of every page on `phone`. */
async function checkPhone(
  deck: string,
  phone: Phone,
  shots: string | undefined,
): Promise<string[]> {
  return withBrowser(phone.engine, async (browser) => {
    const { page, problems } = await openDeck(browser, deck, phone.options);
    const found: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        found.push(`logged error: ${message.text().split("\n")[0] ?? ""}`);
      }
    });
    let pages = 1;
    for (let part = 1; part <= pages; part++) {
      await page.goto(`${ORIGIN}/article/${String(part)}`);
      await page.locator("header.article-header").waitFor();
      await page.waitForLoadState("networkidle");
      pages = Number(
        await page.locator("main").getAttribute("data-article-pages"),
      );
      found.push(
        ...phoneProblems(await measure(page)).map(
          (problem) => `part ${String(part)}: ${problem}`,
        ),
      );
      if (shots !== undefined) {
        await screenshots(page, shots, `${phone.name}-part-${String(part)}`);
      }
    }
    return [...found, ...problems()];
  });
}

if (import.meta.main) {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { shots: { type: "string" } },
  });
  const [deck] = positionals;
  if (deck === undefined || positionals.length > 1) {
    console.error("usage: node art/phone-check.ts DECK_DIR [--shots DIR]");
    process.exit(2);
  }
  requireDeck(deck);
  if (values.shots !== undefined) {
    await mkdir(values.shots, { recursive: true });
  }
  const results = await Promise.all(
    PHONES.map(async (phone) => ({
      phone,
      problems: await checkPhone(deck, phone, values.shots),
    })),
  );
  for (const { phone, problems } of results) {
    for (const problem of problems)
      console.log(`FAIL ${phone.name}: ${problem}`);
    if (problems.length === 0) {
      console.log(`ok ${phone.name}: every article page fits a phone`);
    }
  }
  if (values.shots !== undefined) console.log(`screenshots: ${values.shots}`);
  process.exitCode = results.some(({ problems }) => problems.length > 0)
    ? 1
    : 0;
}

// Frozen phase 8 check. Run from watches with:
// pnpm exec node tasks/2026-10-31-part-2-production/checks/check-article.ts DECK OUT
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import { openDeck, withBrowser, ORIGIN } from "../../../../tools/browser.ts";
import type { Engine } from "../../../../tools/browser.ts";
import type { Page, Locator } from "playwright-chromium";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { "reduced-only": { type: "boolean", default: false } },
});
const [deckArg, outputArg] = positionals;
if (!deckArg || !outputArg || positionals.length !== 2)
  throw new Error("usage: check-article.ts DECK OUT");
const deck = resolve(deckArg);
const output = resolve(outputArg);
await mkdir(output, { recursive: true });
const JUAN = "#hunt-for-juan-fernandez-island-1741-0";
const FINAL = "#hunt-for-juan-fernandez-island-1741-5";
const MAP = '[data-map="juan fernandez"]';

async function nextFrame(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      ),
  );
}
async function countOf(figure: Locator): Promise<number> {
  return Number(await figure.locator(`${MAP} .count-number`).textContent());
}
async function check(
  engine: Engine,
  phone: boolean,
  reduced: boolean,
): Promise<object> {
  return withBrowser(engine, async (browser) => {
    const label = `${engine}-${phone ? "phone" : "desktop"}${reduced ? "-reduced" : ""}`;
    const served = await openDeck(browser, deck, {
      viewport: phone
        ? { width: 393, height: 851 }
        : { width: 1280, height: 900 },
      deviceScaleFactor: phone ? 2 : 1,
      hasTouch: phone,
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    const { page } = served;
    try {
      // Serve the actual static HTML before the live article replaces it.
      await page
        .context()
        .route(`${ORIGIN}/article/`, (route) =>
          route.fulfill({
            path: join(deck, "article/index.html"),
            contentType: "text/html",
          }),
        );
      await page.context().addInitScript(() => {
        CanvasRenderingContext2D.prototype.getImageData = () => {
          throw new Error("2D readback blocked");
        };
      });
      await page.goto(`${ORIGIN}/article/`);
      const pause = page.locator(".article-motion button");
      await pause.waitFor();
      if ((await pause.getAttribute("aria-pressed")) !== "true")
        await pause.click();
      const figure = page.locator(JUAN);
      await figure.scrollIntoViewIfNeeded();
      const steps = figure.locator(".article-step");
      assert.equal(await steps.count(), 5, label);
      await figure
        .getByRole("button", { name: "Step 1 of 5", exact: true })
        .click();
      await nextFrame(page);
      const initialShip = await figure.locator(MAP).getAttribute("data-ship");
      const counts: number[] = [];
      for (const [name, wanted] of [
        ["Step 3 of 5", 12],
        ["Step 4 of 5", 66],
        ["Step 5 of 5", 72],
      ] as const) {
        await figure.getByRole("button", { name, exact: true }).click();
        if (!reduced)
          await page.waitForTimeout(
            wanted === 66 ? 7200 : wanted === 12 ? 4500 : 1700,
          );
        else await nextFrame(page);
        const count = await countOf(figure);
        assert.equal(count, wanted, `${label}: ${name}`);
        counts.push(count);
      }
      assert.equal(
        await figure
          .locator(".story-maps")
          .getAttribute("class")
          .then((value) => value?.includes("still")),
        true,
        "paused gusts stand",
      );
      if (!reduced) {
        await pause.dispatchEvent("click");
        await page.waitForTimeout(180);
        assert.ok(
          !(
            await figure.locator(".story-maps").getAttribute("class")
          )?.includes("still"),
          "gusts run while playing",
        );
        await pause.dispatchEvent("click");
      }
      await figure
        .getByRole("button", { name: "Step 1 of 5", exact: true })
        .click();
      if (!reduced) await page.waitForTimeout(11500);
      else await nextFrame(page);
      assert.equal(
        await figure.locator(MAP).getAttribute("data-ship"),
        initialShip,
        `${label}: backward target`,
      );
      assert.equal(await figure.locator(".punch-screen:visible").count(), 0);
      await page.waitForTimeout(600); // let the labels' 0.4 s text fade settle
      // Expected: ship near the bottom, initial scurvy label, no east/west route or paper punchline.
      await figure.screenshot({
        path: join(output, `${label}-voyage-start.png`),
      });
      const final = page.locator(FINAL);
      await final.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      assert.equal(await countOf(final), 72);
      assert.equal(await final.locator(".punch-screen:visible").count(), 0);
      // Expected: complete return route and 72 deaths, with no title or punchline screen.
      await final.screenshot({
        path: join(output, `${label}-voyage-final.png`),
      });
      for (const id of [
        "age-of-sail-longitude-was-a-guess-5",
        "admiral-shovell-sails-home-1707-4",
      ]) {
        const map = page.locator(`#${id}`);
        await map.scrollIntoViewIfNeeded();
        await page.waitForTimeout(250);
        assert.equal(await map.locator(".punch-screen:visible").count(), 0);
        const image = map.locator(".article-figure-frame");
        assert.ok(
          (await image.evaluate(
            (element) => element.getBoundingClientRect().height,
          )) > 100,
        );
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      );
      assert.ok(overflow <= 1, `${label}: page overflow ${overflow}`);
      assert.deepEqual(served.problems(), [], label);
      console.log(
        `${label}: counts ${counts.join(", ")}, pause, backward steps, crops and offline checks passed`,
      );
      return {
        engine,
        profile: label,
        counts,
        overflow,
        physicalPhone: false,
        problems: served.problems(),
      };
    } finally {
      await page.context().close();
    }
  });
}

const results: object[] = [];
for (const engine of ["chromium", "firefox", "webkit"] as const) {
  if (!values["reduced-only"]) results.push(await check(engine, false, false));
  results.push(await check(engine, false, true));
  results.push(await check(engine, true, true));
}
// Without JavaScript, the final map must remain a complete picture.
await withBrowser("chromium", async (browser) => {
  const served = await openDeck(browser, deck, { javaScriptEnabled: false });
  await served.page
    .context()
    .route(`${ORIGIN}/article/`, (route) =>
      route.fulfill({
        path: join(deck, "article/index.html"),
        contentType: "text/html",
      }),
    );
  await served.page.goto(`${ORIGIN}/article/`);
  const final = served.page.locator(`${FINAL} img`);
  assert.ok(await final.getAttribute("src"));
  assert.ok(
    await final.evaluate(
      (image) =>
        image instanceof HTMLImageElement &&
        image.complete &&
        image.naturalWidth > 0,
    ),
  );
  assert.equal(await served.page.locator(`${FINAL} button`).count(), 0);
  // Expected: a readable still of the complete voyage and final count, with no interactive controls.
  await served.page
    .locator(FINAL)
    .screenshot({ path: join(output, "no-js-voyage-final.png") });
  assert.deepEqual(served.problems(), []);
  results.push({
    profile: "no-js",
    finalImage: await final.getAttribute("src"),
  });
});
await writeFile(
  join(output, "article-checks.json"),
  JSON.stringify(results, null, 2) + "\n",
);

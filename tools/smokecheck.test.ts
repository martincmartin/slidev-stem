import assert from "node:assert/strict";
import { mkdtempDisposable, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { check, checkedNavigation, passed } from "./smokecheck.ts";
import type { Engine } from "./browser.ts";
import type { SmokeLimits, Walk } from "./smokecheck.ts";

const FAST: SmokeLimits = {
  readyTimeoutMs: 3_000,
  moveTimeoutMs: 1_000,
  startupMs: 0,
  visitMs: 10,
};

/** A deck of one slide with one click, whose navigation has `fault`. */
function deck(fault: string): string {
  return `<div class="slidev-layout">slide</div><script>
    const fault = ${JSON.stringify(fault)};
    let click = 0;
    window.slideNavigation = () => ({ slide: 1, click, clicksTotal: 1,
      lastSlide: fault === "early" ? 2 : 1,
      next: fault === "early" || click === 1 ? null : { slide: 1, click: 1 } });
    if (fault === "missing") delete window.slideNavigation;
    if (fault === "page error") setTimeout(() => { throw Error("fixture") }, 0);
    if (fault === "outside") fetch("https://outside.test/image").catch(() => {});
    addEventListener("keydown", () => {
      if (fault === "stall") return;
      setTimeout(() => { click = 1; history.pushState({}, "", "/1?clicks=1") }, 80);
    });
  </script>`;
}

/** Walk a deck whose page is `html` in `engine`, from a directory of its
 *  own, so that walks can run at once. */
async function walkOf(
  html: string,
  engine: Engine,
  noCanvasReadback = false,
): Promise<Walk> {
  await using directory = await mkdtempDisposable(join(tmpdir(), "smoke-"));
  await writeFile(join(directory.path, "index.html"), html);
  return await check(directory.path, engine, {
    limits: FAST,
    noCanvasReadback,
  });
}

test("the walk passes a good deck, and fails each fault", async () => {
  const faults = ["none", "stall", "early", "missing", "page error", "outside"];
  const walks = await Promise.all(
    faults.map((fault) => walkOf(deck(fault), "chromium")),
  );
  for (const [index, fault] of faults.entries()) {
    const walk = walks[index];
    assert.ok(walk);
    assert.equal(passed([walk]), fault === "none", fault);
  }
  assert.deepEqual(walks[0]?.result, {
    kind: "walked",
    positions: [
      { slide: 1, click: 0 },
      { slide: 1, click: 1 },
    ],
  });
});

test("with canvas reads blocked, a deck that reads one fails", async () => {
  const cases = (["chromium", "firefox", "webkit"] as const).flatMap((engine) =>
    [false, true].map((reads) => ({ engine, reads })),
  );
  const walks = await Promise.all(
    cases.map(({ engine, reads }) =>
      walkOf(
        `<div class="slidev-layout">slide</div><script>
          window.slideNavigation = () => ({ slide: 1, click: 0, clicksTotal: 0,
            lastSlide: 1, next: null });
          if (${String(reads)}) {
            document.createElement("canvas").getContext("2d").getImageData(0, 0, 1, 1);
          }
        </script>`,
        engine,
        true,
      ),
    ),
  );
  for (const [index, { engine, reads }] of cases.entries()) {
    const walk = walks[index];
    assert.ok(walk);
    assert.equal(passed([walk]), !reads, `${engine}, reads ${String(reads)}`);
  }
});

test("navigation data that does not hold together is refused", () => {
  const good = { slide: 2, click: 1, clicksTotal: 3, lastSlide: 4, next: null };
  assert.deepEqual(checkedNavigation(good), good);
  for (const bad of [
    null,
    { ...good, slide: 0 },
    { ...good, click: -1 },
    { ...good, lastSlide: 1 },
    { ...good, clicksTotal: 0 },
    { ...good, next: { slide: 1 } },
    { ...good, clicksTotal: "3" },
  ]) {
    assert.throws(() => checkedNavigation(bad), JSON.stringify(bad));
  }
});

// The How Good a Watch slide as built, at each click, in Chromium, with what each
// click must show measured from the page. In watches/, with the deck's server running:
//   node tasks/2026-10-30-part-2-visual-language/tools/seconds-deck.ts http://localhost:3456/ OUT_DIR
// It writes OUT_DIR/chosen-click-<click>.png, and prints each text's ink and type.
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright-chromium";

const LAST_SLIDE_TO_TRY = 80;
const LAST_CLICK = 3;
const TITLE = "How Good a Watch Wins the Prize?";

const [base, out] = process.argv.slice(2);
if (base === undefined || out === undefined)
  throw new Error("usage: seconds-deck.ts URL OUT_DIR");
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 980, height: 552 },
    deviceScaleFactor: 2,
  });
  let slide = 0;
  for (let number = 1; number <= LAST_SLIDE_TO_TRY; number += 1) {
    await page.goto(`${base}${String(number)}`);
    const found = await page
      .getByRole("heading", { name: TITLE })
      .first()
      .waitFor({ timeout: 1500 })
      .then(() => true)
      .catch(() => false);
    if (found) {
      slide = number;
      break;
    }
  }
  if (slide === 0) throw new Error(`no slide titled ${TITLE}`);
  console.log("slide", slide);
  for (let click = 0; click <= LAST_CLICK; click += 1) {
    await page.goto(`${base}${String(slide)}?clicks=${String(click)}`);
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: join(out, `chosen-click-${String(click)}.png`),
    });
    const seen = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          ".slidev-layout.seconds-a-day .seconds-step, .slidev-layout.seconds-a-day .seconds-number, .slidev-layout.seconds-a-day .seconds-caption",
        ),
      ].map((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return [
          element.textContent.trim().slice(0, 24),
          style.opacity,
          style.getPropertyValue("--text-dim"),
          style.fontFamily.slice(0, 16),
          style.fontSize,
          style.fontWeight,
          Math.round(box.right),
          Math.round(box.bottom),
        ].join(" | ");
      }),
    );
    console.log(`click ${String(click)}\n  ${seen.join("\n  ")}`);
  }
} finally {
  await browser.close();
}

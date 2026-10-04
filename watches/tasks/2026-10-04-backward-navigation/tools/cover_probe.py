"""Forward and back over the cover's edge: the cover title's opacity, the
stage's phase and its flash, every 6 frames."""

from playwright.sync_api import sync_playwright

SAMPLE = """async () => {
  const rows = [];
  const start = performance.now();
  for (let frame = 0; frame < 330; frame++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (frame % 15) continue;
    const now = performance.now();
    const title = [...document.querySelectorAll('h1')].find(
      (h1) => h1.textContent.includes('Every Nerd'));
    const page = title && title.closest('.slidev-page');
    const opacity = page ? Number(getComputedStyle(page).opacity) : null;
    const shown = page ? page.offsetParent !== null : false;
    const flash = window.watchStage.flashingAt(now) ? 'F' : '';
    rows.push(`${((now - start) / 1000).toFixed(2)}s cover ${shown ? opacity?.toFixed(2) : 'off'} ${window.watchStage.phaseAt(now)} ${flash}`);
  }
  return rows.join('\\n');
}"""

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={"width": 980, "height": 552})
    page.goto("http://localhost:3999/1")
    page.wait_for_timeout(4000)
    page.keyboard.press("ArrowRight")
    print("cover -> 2\n" + page.evaluate(SAMPLE))
    page.keyboard.press("ArrowLeft")
    print("2 -> cover\n" + page.evaluate(SAMPLE))
    browser.close()

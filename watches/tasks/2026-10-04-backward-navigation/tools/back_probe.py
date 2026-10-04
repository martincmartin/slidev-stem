"""Per frame, after a key press: the on-screen rest shape's opacity and the
stage's fade. Shows whether the rest shape and the wheel move together."""

from playwright.sync_api import sync_playwright

SAMPLE = """async () => {
  const rows = [];
  for (let frame = 0; frame < 70; frame++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const shown = [...document.querySelectorAll('.diving-board')].filter(
      (host) => host.offsetParent !== null);
    const rest = shown.map((host) => {
      const layer = host.querySelector('[data-layer=rest]');
      const own = layer ? Number(getComputedStyle(layer).opacity) : 0;
      return Math.round(Number(getComputedStyle(host).opacity) * own * 100) / 100;
    });
    const values = window.watchStage.valuesAt(performance.now());
    rows.push(`${frame}: rest ${JSON.stringify(rest)} stage rest ${values.rest.toFixed(2)} fading ${values.fading ? 'yes' : 'no'}`);
  }
  return rows.filter((row, index) => index % 5 === 0 || index < 4).join('\\n');
}"""

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={"width": 980, "height": 552})
    page.goto("http://localhost:3999/4")
    page.wait_for_timeout(5000)
    page.keyboard.press("ArrowLeft")
    print("4 -> 3\n" + page.evaluate(SAMPLE))
    page.wait_for_timeout(1000)
    page.keyboard.press("ArrowLeft")
    print("3 -> 2 (click 4)\n" + page.evaluate(SAMPLE))
    browser.close()

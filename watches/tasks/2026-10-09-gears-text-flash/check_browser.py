"""Check both Gears cues in three engines. Run from watches/ with a deck path."""

import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent / "support"))
from print_check import BROWSERS, serve_from

SAMPLE = """async (line) => {
  const stage = window.watchStage;
  const text = [...document.querySelectorAll('.gears-sentence > div')]
    .find(element => element.textContent.trim() === line && element.offsetParent !== null);
  const samples = [];
  let fadeEnd = null;
  text.addEventListener('transitionend', event => {
    if (event.propertyName === 'opacity') fadeEnd = performance.now();
  }, {once: true});
  const start = performance.now();
  await new Promise(resolve => window.addEventListener('keydown', resolve, {once: true}));
  while (performance.now() - start < 3200) {
    await new Promise(requestAnimationFrame);
    const now = performance.now();
    const recolour = stage.timeline.recolourAt(now);
    samples.push({time: now, opacity: Number(getComputedStyle(text).opacity),
      meshes: recolour ? [...recolour.meshes].map(mesh => mesh.name) : [],
      inks: recolour ? [...recolour.inks].map(([from, to]) => [from.name, to.name]) : []});
  }
  return {start, fadeEnd, samples};
}"""

results = []
with sync_playwright() as playwright:
    for name, browser_type in BROWSERS.items():
        browser = browser_type(playwright).launch()
        context = browser.new_context(viewport={"width": 980, "height": 552})
        page = context.new_page()
        outside = []
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" and not message.text.startswith("Failed to patch FloatingVue") else None)
        serve_from(Path(sys.argv[1]), page, outside)
        page.goto("http://deck.test/8?clicks=1")
        page.wait_for_function("window.watchStage && window.slideNavigation().click === 1")
        page.wait_for_timeout(1200)
        for line, piece in [("Half of the small gear", "escape pinion"), ("A quarter of the big gear", "fourth wheel")]:
            page.evaluate("line => { window.captureCue = (" + SAMPLE + ")(line); }", line)
            page.keyboard.press("ArrowRight")
            observed = page.evaluate("window.captureCue")
            samples = observed["samples"]
            flashing = [sample for sample in samples if sample["meshes"]]
            assert flashing, (name, line, "no flash", errors)
            assert all(sample["opacity"] == 1 for sample in flashing), (name, line, "flash before fade end", flashing[0])
            assert all(len(sample["meshes"]) == 1 and all(piece in mesh for mesh in sample["meshes"]) for sample in flashing)
            assert all(sample["inks"] == [["second", "subject"], ["secondWash", "subjectWash"]] for sample in flashing)
            cycles = sum(bool(sample["meshes"]) and (index == 0 or not samples[index - 1]["meshes"]) for index, sample in enumerate(samples))
            assert cycles == 5, (name, line, cycles)
            assert not samples[-1]["meshes"]
            assert 0 <= flashing[0]["time"] - observed["fadeEnd"] <= 40
            results.append({"browser": name, "text": line, "first_flash_ms": round(flashing[0]["time"] - observed["start"], 1), "cycles": cycles, "opacity_at_first_flash": flashing[0]["opacity"], "flash_after_transition_end_ms": round(flashing[0]["time"] - observed["fadeEnd"], 1)})
        page.goto("http://deck.test/8?clicks=3")
        page.wait_for_function("window.watchStage && window.slideNavigation().click === 3")
        page.keyboard.press("ArrowLeft")
        page.wait_for_timeout(600)
        assert page.evaluate("window.watchStage.flashingAt(performance.now()) === null")
        page.goto("http://deck.test/8?clicks=1")
        page.wait_for_function("window.watchStage && window.slideNavigation().click === 1")
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(100)
        page.keyboard.press("ArrowLeft")
        page.wait_for_timeout(600)
        assert page.evaluate("window.watchStage.flashingAt(performance.now()) === null")
        assert not errors, errors
        assert not outside, outside
        context.close()
        browser.close()
print(json.dumps(results, indent=2))

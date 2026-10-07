"""Does getComputedStyle list custom properties, with each var() worked out?

The watch's layer copies a slide's `--palette-*` values from a probe, so it
needs the list (PLAN.md §2.3). Run from stem/:
uv run python tasks/2026-10-07-palette-preview/tools/custom_properties.py
"""

from playwright.sync_api import sync_playwright

HTML = """<style>
.a { --palette-x: #123456; --palette-y: color-mix(in srgb, var(--palette-x) 20%, white) }
.a.b { --palette-x: #ff0000 }
</style><div class="a b" id="probe"></div>"""

SCRIPT = """() => {
  const style = getComputedStyle(document.getElementById('probe'));
  return [...style].filter(name => name.startsWith('--palette-'))
    .map(name => name + '=' + style.getPropertyValue(name));
}"""

with sync_playwright() as playwright:
    for kind in (playwright.chromium, playwright.firefox, playwright.webkit):
        browser = kind.launch()
        page = browser.new_page()
        page.set_content(HTML)
        print(kind.name, page.evaluate(SCRIPT))
        browser.close()

"""Check same-instance overview clicks offline in both browsers."""

import json
import mimetypes
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import Route, sync_playwright

TASK = Path(__file__).resolve().parent
BUILD = TASK / "deck"
EVIDENCE = TASK / "evidence"


def main() -> None:
    results = {}
    with sync_playwright() as playwright:
        for browser_type in (playwright.chromium, playwright.firefox):
            browser = browser_type.launch()
            page = browser.new_page(viewport={"width": 1200, "height": 900})
            errors = []
            outside = []
            page.on("pageerror", lambda error, captured=errors: captured.append(str(error)))
            page.add_init_script("""Object.defineProperty(navigator, 'wakeLock', {
                value: {request: async () => ({addEventListener() {}, release: async () => {}})}
            });""")

            def serve(route: Route) -> None:
                url = urlparse(route.request.url)
                if url.netloc != "deck.test":
                    outside.append(route.request.url)
                    route.abort()
                    return
                path = BUILD / url.path.lstrip("/")
                if not path.is_file():
                    path = BUILD / "index.html"
                route.fulfill(body=path.read_bytes(), content_type=mimetypes.guess_type(path)[0] or "application/octet-stream")

            page.route("**/*", serve)
            page.goto("http://deck.test/overview")
            block = page.locator(".overview-slide-block").nth(1)
            block.scroll_into_view_if_needed()
            host = block.locator(".diving-board")
            host.locator("svg").wait_for(state="attached")
            page.evaluate("window.savedBoard = document.querySelector('.overview-slide-block:nth-child(2) .diving-board svg')")
            slider = block.locator('[title="Clicks in this slide: 5"]')
            slider.wait_for()
            cells = slider.locator("[touch-none]")
            # The slide uses five equally sized click cells, from zero to four.
            rail = cells.bounding_box()
            assert rail is not None
            snapshots = []
            images = {}
            for click in (0, 1, 2, 3, 4, 3, 2, 1, 0, 4, 2, 3):
                page.mouse.click(rail["x"] + rail["width"] * (click + 0.5) / 5, rail["y"] + rail["height"] / 2)
                page.wait_for_timeout(180)
                snapshot = host.evaluate("""host => {
                    const svg = host.querySelector('svg');
                    return {same: svg === window.savedBoard, time: svg.getCurrentTime(),
                        swing: Number(svg.dataset.swingStart), end: Number(svg.dataset.curlStart) + Number(svg.dataset.curlDuration),
                        opacity: getComputedStyle(host).opacity,
                        single: getComputedStyle(svg.querySelector('[data-rest-phase=edge]')).visibility === 'visible'};
                }""")
                assert snapshot["same"]
                expected = 0 if click == 0 else snapshot["swing"] if click == 1 else snapshot["end"]
                assert abs(snapshot["time"] - expected) < 0.001, (click, snapshot)
                assert snapshot["single"] == (click >= 2)
                still = block.locator(".watch-still-image")
                if click in (1, 2):
                    assert still.count() == 0
                else:
                    still.wait_for()
                    source = still.get_attribute("src")
                    if click in images:
                        assert images[click] == source
                    images[click] = source
                snapshots.append({"click": click, **snapshot})
            assert images[3] != images[4]
            assert not errors, errors
            assert not outside, outside
            page.screenshot(path=str(EVIDENCE / f"overview-{browser_type.name}.png"))
            results[browser_type.name] = {"snapshots": snapshots, "outside": outside, "errors": errors}
            browser.close()
    (EVIDENCE / "static-views.json").write_text(json.dumps(results, indent=2) + "\n")
    print("Both browsers pass forward, reverse, and rapid same-instance static click changes.")


if __name__ == "__main__":
    main()

"""Check the cover-to-slide-2 transition in the built deck, offline, in both browsers."""

from __future__ import annotations

import json
import mimetypes
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import Route, sync_playwright

TASK = Path(__file__).resolve().parent
BUILD = TASK / "live-deck"
STATE = """() => {
  const stage = window.watchStage;
  const values = stage.valuesAt(performance.now());
  const spring = stage.renderer.scene.meshes.find(mesh => mesh.dynamic);
  const heights = Array.from(spring.triangles).filter((_, index) => index % 3 === 2);
  return {
    rest: values.rest, tilt: values.tilt, view: values.view,
    springHeights: [Math.min(...heights), Math.max(...heights)],
    kept: values.subject ? [...values.subject.meshes].map(mesh => mesh.name) : [],
    flashed: stage.flashingAt(performance.now())?.name ?? null,
  };
}"""


def main() -> None:
    results: dict[str, object] = {}
    for_browser = []
    with sync_playwright() as playwright:
        for browser_type in (playwright.chromium, playwright.firefox):
            browser = browser_type.launch()
            page = browser.new_page(
                viewport={"width": 980, "height": 552}, device_scale_factor=2
            )
            page.set_default_timeout(30_000)
            errors: list[str] = []
            outside: list[str] = []
            page.on(
                "pageerror", lambda error, captured=errors: captured.append(str(error))
            )

            def route_request(route: Route, blocked: list[str] = outside) -> None:
                url = urlparse(route.request.url)
                if url.netloc != "deck.test":
                    blocked.append(route.request.url)
                    route.abort()
                    return
                file = BUILD / url.path.lstrip("/")
                if not file.is_file():
                    file = BUILD / "index.html"
                route.fulfill(
                    body=file.read_bytes(),
                    content_type=mimetypes.guess_type(file)[0]
                    or "application/octet-stream",
                )

            page.route("**/*", route_request)
            page.goto("http://deck.test/1")
            page.wait_for_function(
                "window.watchStage && document.querySelector('.slidev-page')"
            )
            page.screenshot(
                path=str(TASK / "evidence" / f"live-cover-{browser_type.name}.png")
            )
            page.keyboard.press("ArrowRight")
            page.wait_for_function(
                "window.watchStage.flashingAt(performance.now()) !== null"
            )
            flash = page.evaluate(STATE)
            assert flash["flashed"] == "balance and hairspring"
            page.wait_for_function(
                "(() => { const v = window.watchStage.valuesAt(performance.now()); return v.rest < 0.9 && v.rest > 0.1; })()"
            )
            page.evaluate("window.watchStage.stop()")
            during = page.evaluate(STATE)
            page.screenshot(
                path=str(TASK / "evidence" / f"live-fade-{browser_type.name}.png")
            )
            page.evaluate("window.watchStage.start()")
            page.wait_for_function(
                "window.watchStage.valuesAt(performance.now()).rest === 0"
            )
            page.evaluate("window.watchStage.stop()")
            after = page.evaluate(STATE)
            assert after["tilt"] == 20
            assert after["springHeights"] == [-11, -3]
            assert sorted(after["kept"]) == [
                "hairspring 1",
                "hairspring 2",
                "hairspring stud (added)",
            ]
            view = after["view"]
            assert abs(view["scale"] * view["pivot"][0] + view["shift"][0] - 705) < 1e-9
            assert abs(view["scale"] * view["pivot"][1] + view["shift"][1] - 276) < 1e-9
            assert view["pivot"][2] == -7
            page.screenshot(
                path=str(TASK / "evidence" / f"live-slide2-{browser_type.name}.png")
            )
            assert errors == [], errors
            assert outside == [], outside
            results[browser_type.name] = {
                "during_fade": during,
                "after_fade": after,
                "page_errors": errors,
                "outside_requests": outside,
            }
            browser.close()
            for_browser.append(browser_type.name)
    (TASK / "evidence" / "live-slide-checks.json").write_text(
        json.dumps(results, indent=2) + "\n"
    )
    print(f"Slide 2 placement and fade passed in {', '.join(for_browser)}.")


if __name__ == "__main__":
    main()

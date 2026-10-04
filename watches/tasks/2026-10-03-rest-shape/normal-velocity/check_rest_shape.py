"""Check the saved deck offline in Chromium and Firefox.

Run from watches: uv run tasks/2026-10-03-rest-shape/check_rest_shape.py
"""

import json
import mimetypes
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import Page, Route, sync_playwright

TASK = Path(__file__).resolve().parent
BUILD = TASK / "deck"
EVIDENCE = TASK / "evidence"
STATE = """() => {
  const host = document.querySelector('.diving-board');
  const svg = host.querySelector('svg');
  const pathState = id => {
    const path = svg.querySelector('#' + id);
    const length = path.getTotalLength();
    return Array.from({length: 41}, (_, index) => {
      const point = path.getPointAtLength(length * index / 40);
      return [point.x, point.y].map(value => Math.round(value * 1000) / 1000);
    });
  };
  const leader = svg.querySelector('#diving-board-rest-leader');
  const endpoint = leader.getPointAtLength(leader.getTotalLength());
  const start = leader.getPointAtLength(0);
  let distance = Infinity;
  let nearestDistance = Infinity;
  for (const id of ['diving-board-rest-top', 'diving-board-rest-front']) {
    const ghost = svg.querySelector('#' + id);
    const ghostLength = ghost.getTotalLength();
    for (let index = 0; index <= 3000; index++) {
      const point = ghost.getPointAtLength(ghostLength * index / 3000);
      distance = Math.min(distance, Math.hypot(endpoint.x - point.x, endpoint.y - point.y));
      nearestDistance = Math.min(nearestDistance, Math.hypot(start.x - point.x, start.y - point.y));
    }
  }
  const label = svg.querySelector('text');
  const font = getComputedStyle(label);
  const opacity = id => Number(getComputedStyle(svg.querySelector('#' + id)).opacity);
  return {
    time: svg.getCurrentTime(),
    ghost: pathState('diving-board-rest-top'),
    board: pathState('diving-board-top'),
    leader: pathState('diving-board-rest-leader'),
    leaderDistance: distance,
    nearestExcess: Math.hypot(start.x - endpoint.x, start.y - endpoint.y) - nearestDistance,
    leaderWidth: getComputedStyle(leader).strokeWidth,
    hostOpacity: Number(getComputedStyle(host).opacity),
    ghostOpacity: opacity('diving-board-rest'),
    boardOpacity: opacity('diving-board-board'),
    poolOpacity: opacity('diving-board-set'),
    label: label.textContent,
    font: [font.fontFamily, font.fontWeight, font.fontSize],
    loadedFont: [...document.fonts].some(face => face.family.replaceAll('"', '') === 'IBM Plex Sans' && face.weight === '600' && face.status === 'loaded'),
  };
}"""


def state(page: Page) -> dict[str, object]:
    result: dict[str, object] = page.evaluate(STATE)
    assert result["label"] == "Rest Shape"
    assert (
        page.evaluate(
            "getComputedStyle(document.querySelector('.diving-board text')).fontFamily.replaceAll('\"', '')"
        )
        == "IBM Plex Sans"
    )
    assert (
        page.evaluate(
            "getComputedStyle(document.querySelector('.diving-board text')).fontWeight"
        )
        == "600"
    )
    assert result["loadedFont"] is True
    assert float(str(result["leaderDistance"])) < 1
    assert result["leaderWidth"] == "4px"
    return result


def main() -> None:
    results: dict[str, object] = {}
    with sync_playwright() as playwright:
        for browser_type in (playwright.chromium, playwright.firefox):
            browser = browser_type.launch()
            page = browser.new_page(
                viewport={"width": 980, "height": 552}, device_scale_factor=2
            )
            errors: list[str] = []
            outside: list[str] = []
            page.on(
                "pageerror", lambda error, captured=errors: captured.append(str(error))
            )
            page.add_init_script("""Object.defineProperty(navigator, 'wakeLock', {
              value: {request: async () => ({addEventListener() {}, release: async () => {}})}
            });""")

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
            page.goto("http://deck.test/2")
            page.wait_for_selector("#diving-board-rest", state="attached")
            page.wait_for_timeout(500)
            initial = state(page)
            assert initial["hostOpacity"] == 0
            assert (
                page.evaluate(
                    "document.querySelector('#diving-board-rest-leader').getTotalLength()"
                )
                < 85
            )
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(1100)
            bend_start = state(page)
            page.wait_for_timeout(700)
            bend_end = state(page)
            assert bend_start["ghost"] == bend_end["ghost"]
            assert bend_start["leader"] == bend_end["leader"]
            assert bend_start["board"] != bend_end["board"]
            page.screenshot(path=str(EVIDENCE / f"board-{browser_type.name}.png"))
            hidden = page.add_style_tag(
                content=".watch-layer, h1, #diving-board-board, #diving-board-set { visibility: hidden; }"
            )
            page.screenshot(
                path=str(EVIDENCE / f"rest-board-only-{browser_type.name}.png")
            )
            hidden.evaluate("element => element.remove()")
            page.wait_for_timeout(1000)
            swing_start = state(page)
            page.wait_for_timeout(250)
            swing_end = state(page)
            assert swing_start["ghost"] == swing_end["ghost"]
            assert swing_start["board"] != swing_end["board"]
            page.keyboard.press("ArrowRight")
            page.wait_for_function("""() => {
              const svg = document.querySelector('.diving-board svg');
              return svg.getCurrentTime() > Number(svg.dataset.curlStart) + 0.8;
            }""")
            curling = state(page)
            assert curling["ghost"] != bend_end["ghost"]
            assert curling["leader"] != bend_end["leader"]
            page.screenshot(path=str(EVIDENCE / f"curling-{browser_type.name}.png"))
            page.wait_for_function("""() => {
              const svg = document.querySelector('.diving-board svg');
              return svg.getCurrentTime() >= Number(svg.dataset.curlStart) + Number(svg.dataset.curlDuration) - 0.001;
            }""")
            page.wait_for_timeout(100)  # Let SMIL paint the final frozen pose.
            curled = state(page)
            assert curled["poolOpacity"] == 0
            assert curled["ghost"] == curled["board"]
            page.screenshot(path=str(EVIDENCE / f"curled-{browser_type.name}.png"))
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(1100)
            spring_rest = state(page)
            assert spring_rest["ghost"] == curled["ghost"]
            assert spring_rest["leader"] == curled["leader"]
            assert spring_rest["boardOpacity"] == 0
            assert spring_rest["ghostOpacity"] == 1
            page.screenshot(path=str(EVIDENCE / f"spring-rest-{browser_type.name}.png"))
            hidden = page.add_style_tag(
                content=".watch-layer, h1 { visibility: hidden; }"
            )
            page.screenshot(
                path=str(EVIDENCE / f"rest-spring-only-{browser_type.name}.png")
            )
            hidden.evaluate("element => element.remove()")
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(800)
            moving_before = page.locator(".watch-canvas").screenshot(
                path=str(EVIDENCE / f"spring-motion-a-{browser_type.name}.png")
            )
            resumed = state(page)
            page.wait_for_timeout(450)
            moving_after = page.locator(".watch-canvas").screenshot(
                path=str(EVIDENCE / f"spring-motion-b-{browser_type.name}.png")
            )
            resumed_after = state(page)
            assert moving_before != moving_after
            assert resumed["ghost"] == resumed_after["ghost"] == curled["ghost"]
            assert resumed["leader"] == resumed_after["leader"] == curled["leader"]
            page.screenshot(
                path=str(EVIDENCE / f"spring-swing-{browser_type.name}.png")
            )
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(600)
            assert page.url.endswith("/3")
            assert page.locator(".slidev-page-3 .diving-board").count() == 0
            page.screenshot(path=str(EVIDENCE / f"slide-exit-{browser_type.name}.png"))
            page.keyboard.press("ArrowLeft")
            page.wait_for_timeout(700)
            reentered = state(page)
            assert reentered["ghost"] == curled["ghost"]
            page.keyboard.press("ArrowLeft")
            page.keyboard.press("ArrowLeft")
            page.keyboard.press("ArrowLeft")
            page.wait_for_timeout(500)
            reset = state(page)
            assert reset["ghost"] == bend_start["ghost"]
            page.keyboard.press("ArrowLeft")
            page.wait_for_timeout(600)
            assert state(page)["hostOpacity"] == 0
            page.goto("http://deck.test/2?clicks=4")
            page.wait_for_selector("#diving-board-rest", state="attached")
            page.wait_for_timeout(800)
            direct = state(page)
            assert direct["ghost"] == curled["ghost"]
            assert direct["ghostOpacity"] == 1
            page.goto("http://deck.test/2")
            page.wait_for_selector("#diving-board-rest", state="attached")
            page.keyboard.press("ArrowRight")
            page.keyboard.press("ArrowRight")
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(700)
            quick = state(page)
            assert quick["ghost"] == curled["ghost"]
            assert quick["boardOpacity"] == 0
            assert errors == [], errors
            assert outside == [], outside
            results[browser_type.name] = {
                "initial": initial,
                "bend_start": bend_start,
                "bend_end": bend_end,
                "swing_start": swing_start,
                "swing_end": swing_end,
                "curling": curling,
                "curled": curled,
                "spring_rest": spring_rest,
                "resumed": resumed,
                "resumed_after": resumed_after,
                "reentered": reentered,
                "reset": reset,
                "direct": direct,
                "quick_advance": quick,
                "errors": errors,
                "outside_requests": outside,
            }
            browser.close()
            print(f"{browser_type.name}: all rest-shape checks passed", flush=True)
    (EVIDENCE / "browser-checks.json").write_text(json.dumps(results, indent=2) + "\n")


if __name__ == "__main__":
    main()

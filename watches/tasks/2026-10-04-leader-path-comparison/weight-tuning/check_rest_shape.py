"""Check the saved deck offline in Chromium and Firefox.

Run from watches: uv run tasks/2026-10-04-leader-path-comparison/weight-tuning/check_rest_shape.py
"""

import json
import math
import mimetypes
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import Page, Route, sync_playwright

TASK = Path(__file__).resolve().parent
BUILD = TASK / "deck"
EVIDENCE = TASK / "evidence"
STATE = """() => {
  const host = window.restHost();
  const svg = host.querySelector('svg');
  const prefix = svg.querySelector('[data-layer=rest]').id.slice(0, -4);
  const edge = svg.querySelector('#' + prefix + 'rest-edge');
  const singleEdge = edge && getComputedStyle(edge).visibility === 'visible';
  const pathState = (id, fraction = 1) => {
    const path = svg.querySelector('#' + prefix + id);
    const length = path.getTotalLength();
    return Array.from({length: 41}, (_, index) => {
      const point = path.getPointAtLength(length * fraction * index / 40);
      return [point.x, point.y].map(value => Math.round(value * 1000) / 1000);
    });
  };
  let expectedRestEdge = null;
  if (edge) {
    const expected = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    expected.id = prefix + 'expected-rest-edge';
    expected.setAttribute('d', edge.querySelector('animate').getAttribute('values').split(';').at(-1));
    expected.style.visibility = 'hidden';
    svg.append(expected);
    expectedRestEdge = pathState('expected-rest-edge');
    expected.remove();
  }
  const leader = svg.querySelector('#' + prefix + 'rest-leader');
  const endpoint = leader.getPointAtLength(leader.getTotalLength());
  const start = leader.getPointAtLength(0);
  let distance = Infinity;
  let nearestDistance = Infinity;
  for (const id of singleEdge ? ['rest-edge'] : ['rest-top', 'rest-front']) {
    const ghost = svg.querySelector('#' + prefix + id);
    const ghostLength = ghost.getTotalLength();
    for (let index = 0; index <= 3000; index++) {
      const point = ghost.getPointAtLength(ghostLength * index / 3000);
      distance = Math.min(distance, Math.hypot(endpoint.x - point.x, endpoint.y - point.y));
      nearestDistance = Math.min(nearestDistance, Math.hypot(start.x - point.x, start.y - point.y));
    }
  }
  const label = svg.querySelector('text');
  const font = getComputedStyle(label);
  const opacity = id => Number(getComputedStyle(svg.querySelector('#' + prefix + id)).opacity);
  return {
    time: svg.getCurrentTime(),
    ghost: pathState(singleEdge ? 'rest-edge' : 'rest-top'),
    singleEdge: Boolean(singleEdge),
    expectedRestEdge,
    outlineVisibility: getComputedStyle(svg.querySelector('[data-rest-phase=outline]') || svg.querySelector('[data-layer=rest]')).visibility,
    board: pathState('top'),
    leader: pathState('rest-leader'),
    leaderDistance: distance,
    nearestExcess: Math.hypot(start.x - endpoint.x, start.y - endpoint.y) - nearestDistance,
    leaderWidth: getComputedStyle(leader).strokeWidth,
    hostOpacity: Number(getComputedStyle(host).opacity),
    ghostOpacity: opacity('rest'),
    boardOpacity: opacity('board'),
    poolOpacity: opacity('set'),
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
            "getComputedStyle(window.restHost().querySelector('text')).fontFamily.replaceAll('\"', '')"
        )
        == "IBM Plex Sans"
    )
    assert (
        page.evaluate(
            "getComputedStyle(window.restHost().querySelector('text')).fontWeight"
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
        for browser_type, slide_no in (
            (playwright.chromium, 2),
            (playwright.chromium, 3),
            (playwright.chromium, 4),
            (playwright.firefox, 2),
            (playwright.firefox, 3),
            (playwright.firefox, 4),
        ):
            label = f"{browser_type.name}-slide-{slide_no}"
            prefix = (
                "diving-board-comparison-"
                if slide_no == 3
                else "diving-board-strong-movement-"
                if slide_no == 4
                else "diving-board-"
            )
            browser = browser_type.launch()
            page = browser.new_page(
                viewport={"width": 980, "height": 552}, device_scale_factor=2
            )
            errors: list[str] = []
            outside: list[str] = []
            page.on(
                "pageerror", lambda error, captured=errors: captured.append(str(error))
            )
            page.add_init_script("""window.restHost = () => document.querySelector(`.slidev-page-${location.pathname.split("/").at(-1)} .diving-board`);
            Object.defineProperty(navigator, 'wakeLock', {
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
            page.goto(f"http://deck.test/{slide_no}")
            page.wait_for_selector(f"#{prefix}rest", state="attached")
            page.wait_for_timeout(500)
            initial = state(page)
            assert initial["hostOpacity"] == 0
            initial_length = page.evaluate(
                "window.restHost().querySelector('[id$=rest-leader]').getTotalLength()"
            )
            assert initial_length < 85 if slide_no != 3 else initial_length > 200
            if slide_no != 3:
                page.evaluate(
                    "() => { const svg=window.restHost().querySelector('svg'); svg.setCurrentTime(Number(svg.dataset.curlStart)-0.001); }"
                )
                before_switch = state(page)
                page.evaluate(
                    "() => { const svg=window.restHost().querySelector('svg'); svg.setCurrentTime(Number(svg.dataset.curlStart)); }"
                )
                after_switch = state(page)
                assert before_switch["singleEdge"] is False
                assert after_switch["singleEdge"] is True
                assert after_switch["outlineVisibility"] == "hidden"
                page.evaluate(
                    "window.restHost().querySelector('svg').setCurrentTime(0)"
                )
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(1100)
            bend_start = state(page)
            page.wait_for_timeout(700)
            bend_end = state(page)
            assert bend_start["ghost"] == bend_end["ghost"]
            assert bend_start["leader"] == bend_end["leader"]
            assert bend_start["board"] != bend_end["board"]
            page.screenshot(path=str(EVIDENCE / f"board-{label}.png"))
            hidden = page.add_style_tag(
                content=".watch-layer, h1, [data-layer=board], [data-layer=set] { visibility: hidden; }"
            )
            page.screenshot(path=str(EVIDENCE / f"rest-board-only-{label}.png"))
            hidden.evaluate("element => element.remove()")
            page.wait_for_timeout(1000)
            swing_start = state(page)
            page.wait_for_timeout(250)
            swing_end = state(page)
            assert swing_start["ghost"] == swing_end["ghost"]
            assert swing_start["board"] != swing_end["board"]
            page.keyboard.press("ArrowRight")
            page.wait_for_function("""() => {
              const svg = window.restHost().querySelector('svg');
              return svg.getCurrentTime() > Number(svg.dataset.curlStart) + 0.8;
            }""")
            curling = state(page)
            assert curling["ghost"] != bend_end["ghost"]
            assert curling["leader"] != bend_end["leader"]
            page.screenshot(path=str(EVIDENCE / f"curling-{label}.png"))
            page.wait_for_function("""() => {
              const svg = window.restHost().querySelector('svg');
              return svg.getCurrentTime() >= Number(svg.dataset.curlStart) + Number(svg.dataset.curlDuration) - 0.001;
            }""")
            page.wait_for_timeout(100)  # Let SMIL paint the final frozen pose.
            curled = state(page)
            assert curled["poolOpacity"] == 0
            page.screenshot(path=str(EVIDENCE / f"curled-{label}.png"))
            if slide_no != 3:
                final_edge_error = max(
                    math.dist(first, second)
                    for first, second in zip(
                        curled["ghost"], curled["expectedRestEdge"], strict=True
                    )
                )
                assert final_edge_error < 0.1, final_edge_error
            else:
                assert curled["ghost"] == curled["board"]
            assert curled["singleEdge"] is (slide_no != 3)
            page.screenshot(path=str(EVIDENCE / f"curled-{label}.png"))
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(1100)
            spring_rest = state(page)
            assert spring_rest["ghost"] == curled["ghost"]
            assert spring_rest["leader"] == curled["leader"]
            assert spring_rest["boardOpacity"] == 0
            assert spring_rest["ghostOpacity"] == 1
            page.screenshot(path=str(EVIDENCE / f"spring-rest-{label}.png"))
            hidden = page.add_style_tag(
                content=".watch-layer, h1 { visibility: hidden; }"
            )
            page.screenshot(path=str(EVIDENCE / f"rest-spring-only-{label}.png"))
            hidden.evaluate("element => element.remove()")
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(800)
            moving_before = page.locator(".watch-canvas").screenshot(
                path=str(EVIDENCE / f"spring-motion-a-{label}.png")
            )
            resumed = state(page)
            page.wait_for_timeout(450)
            moving_after = page.locator(".watch-canvas").screenshot(
                path=str(EVIDENCE / f"spring-motion-b-{label}.png")
            )
            resumed_after = state(page)
            assert moving_before != moving_after
            assert resumed["ghost"] == resumed_after["ghost"] == curled["ghost"]
            assert resumed["leader"] == resumed_after["leader"] == curled["leader"]
            page.screenshot(path=str(EVIDENCE / f"spring-swing-{label}.png"))
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(600)
            assert page.url.endswith(f"/{slide_no + 1}")
            if slide_no == 4:
                assert page.locator(".slidev-page-5 .diving-board").count() == 0
            else:
                assert state(page)["hostOpacity"] == 0
            page.screenshot(path=str(EVIDENCE / f"slide-exit-{label}.png"))
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
            page.goto(f"http://deck.test/{slide_no}?clicks=4")
            page.wait_for_selector(f"#{prefix}rest", state="attached")
            page.wait_for_timeout(800)
            direct = state(page)
            assert direct["ghost"] == curled["ghost"]
            assert direct["ghostOpacity"] == 1
            page.goto(f"http://deck.test/{slide_no}")
            page.wait_for_selector(f"#{prefix}rest", state="attached")
            page.keyboard.press("ArrowRight")
            page.keyboard.press("ArrowRight")
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(700)
            quick = state(page)
            assert quick["ghost"] == curled["ghost"]
            assert quick["boardOpacity"] == 0
            ids = page.evaluate(
                "[...document.querySelectorAll('.diving-board [id]')].map(element => element.id)"
            )
            assert len(ids) == len(set(ids)), "Mounted drawings have duplicate IDs"
            assert errors == [], errors
            assert outside == [], outside
            results[label] = {
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
            print(f"{label}: all rest-shape checks passed", flush=True)
    (EVIDENCE / "browser-checks.json").write_text(json.dumps(results, indent=2) + "\n")


if __name__ == "__main__":
    main()

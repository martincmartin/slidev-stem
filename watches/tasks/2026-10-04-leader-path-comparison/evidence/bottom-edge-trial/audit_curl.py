"""Measure contact error between stored curl frames in both browsers, offline."""

import json
import mimetypes
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import Route, sync_playwright

TASK = Path(__file__).resolve().parent
BUILD = TASK / "deck"
AUDIT = """() => {
  const host = document.querySelector(`.slidev-page-${location.pathname.split('/').at(-1)} .diving-board`);
  const svg = host.querySelector('svg');
  const leader = svg.querySelector('[id$=rest-leader]');
  const edge = svg.querySelector('[data-rest-phase=edge]');
  const outlines = [...svg.querySelectorAll('[id$=rest-front], [id$=rest-top]')];
  const start = Number(svg.dataset.curlStart);
  const duration = Number(svg.dataset.curlDuration);
  const distances = [];
  const endpoints = [];
  function nearest(path, endpoint) {
    const length = path.getTotalLength();
    function distance(along) {
      const point = path.getPointAtLength(along);
      return Math.hypot(point.x-endpoint.x, point.y-endpoint.y);
    }
    let best = 0;
    for (let index = 1; index <= 1000; index++) {
      if (distance(length*index/1000) < distance(length*best/1000)) best=index;
    }
    let lower = length*Math.max(0,best-1)/1000;
    let upper = length*Math.min(1000,best+1)/1000;
    for (let iteration=0; iteration<24; iteration++) {
      const left=lower+(upper-lower)/3, right=upper-(upper-lower)/3;
      if (distance(left)<distance(right)) upper=right; else lower=left;
    }
    return Math.min(distance((lower+upper)/2),distance(0),distance(length));
  }
  for (let index=0; index<=288; index++) {
    svg.setCurrentTime(start+duration*index/288);
    const endpoint = leader.getPointAtLength(leader.getTotalLength());
    endpoints.push([endpoint.x,endpoint.y]);
    distances.push(Math.min(...(edge ? [edge] : outlines).map(path=>nearest(path,endpoint))));
  }
  return {maxContactError:Math.max(...distances), distances, endpoints};
}"""


def main() -> None:
    results = {}
    with sync_playwright() as playwright:
        for browser_type in (playwright.chromium, playwright.firefox):
            browser = browser_type.launch()
            page = browser.new_page(viewport={"width": 980, "height": 552})
            page.add_init_script("""Object.defineProperty(navigator,'wakeLock', {
                value: {request: async () => ({addEventListener() {}, release: async () => {}})}
            });""")

            def serve(route: Route) -> None:
                url = urlparse(route.request.url)
                assert url.netloc == "deck.test", route.request.url
                path = BUILD / url.path.lstrip("/")
                if not path.is_file():
                    path = BUILD / "index.html"
                route.fulfill(
                    body=path.read_bytes(),
                    content_type=mimetypes.guess_type(path)[0]
                    or "application/octet-stream",
                )

            page.route("**/*", serve)
            for slide in (2, 3):
                page.goto(f"http://deck.test/{slide}?clicks=3")
                page.wait_for_selector(f".slidev-page-{slide} .diving-board svg")
                page.wait_for_timeout(500)
                result = page.evaluate(AUDIT)
                results[f"{browser_type.name}-slide-{slide}"] = result
                print(
                    f"{browser_type.name} slide {slide}: maximum contact error {result['maxContactError']:.4f} px",
                    flush=True,
                )
            browser.close()
    (TASK / "evidence/curl-contact-audit.json").write_text(
        json.dumps(results, indent=2) + "\n"
    )
    assert all(result["maxContactError"] < 1 for result in results.values())


if __name__ == "__main__":
    main()

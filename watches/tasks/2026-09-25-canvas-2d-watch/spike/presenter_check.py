#!/usr/bin/env python3
"""C18: frame gaps with Slidev's presenter view open, so that two stages
animate at once, as when presenting with the presenter on the laptop. One
visible full-screen window holds two iframes side by side, so neither is
hidden behind the other: the presenter view on the left, the audience view
on the right. The arrow keys go to the presenter, and Slidev moves both.
The control has the audience view alone, in the same half of the window.
Writes ../out/presenter.json.

    ../../../../node_modules/.bin/slidev slides.md --port 3132   # in deck/
    ../../../../.venv/bin/python3 presenter_check.py http://localhost:3132   # in spike/
"""

import json
import sys
from dataclasses import asdict

from frame_gaps import GapSummary
from headed_check import NATIVE_ARGS, settle
from playwright.sync_api import Frame, Page, sync_playwright
from spike_browser import OUT

REPEATS = 3
# name -> (the presenter's path, or None for none; the deck's query)
SETUPS = {
    "presenter and audience": ("/presenter/1", ""),
    "audience alone": (None, ""),
    "presenter and audience, erase": ("/presenter/1", "?clips=erase"),
}
PAGE = """<!doctype html><style>
html, body { margin: 0; height: 100%; background: #333; }
iframe { position: absolute; top: 0; width: 50%; height: 100%; border: 0; }
#presenter { left: 0; } #audience { left: 50%; }
</style>
<iframe id="presenter" src="PRESENTER"></iframe>
<iframe id="audience" src="AUDIENCE"></iframe>"""
# Start recording 3 s of frames in a frame; `window.recording` resolves to
# the gaps.
START = """() => {
  window.recording = new Promise(done => {
    const gaps = [];
    let last = performance.now();
    const start = last;
    function frame(now) {
      gaps.push(now - last);
      last = now;
      if (now - start < 3000) requestAnimationFrame(frame); else done(gaps);
    }
    requestAnimationFrame(frame);
  });
}"""

Change = dict[str, dict[str, object]]  # frame name -> its GapSummary


def frame_of(page: Page, name: str) -> Frame:
    """The iframe `name` once its stage runs. Look it up each time: Chromium
    moves a cross-origin iframe to a new frame when it leaves about:blank."""
    for _ in range(120):
        for frame in page.frames:
            if (
                frame.name == name
                and frame.url.startswith("http")
                and frame.evaluate("() => !!window.watchStage?.running")
            ):
                return frame
        page.wait_for_timeout(500)
    raise SystemExit(f"no running stage in the {name} frame")


def change(page: Page, frames: dict[str, Frame], target: str, key: str) -> Change:
    """Press `key` in the `target` frame; the gaps in every frame."""
    for frame in frames.values():
        frame.evaluate(START)
    page.focus(f"#{target}")
    page.keyboard.press(key)
    result = {
        name: asdict(
            GapSummary.of([float(gap) for gap in frame.evaluate("window.recording")])
        )
        for name, frame in frames.items()
    }
    page.wait_for_timeout(1000)
    return result


def run_setup(
    page: Page, base: str, presenter: str | None, query: str
) -> list[dict[str, Change]]:
    """The page is served as if from the deck's own origin: headed Chromium
    denies localStorage to a third-party iframe, and Slidev then fails."""
    source = PAGE.replace(
        "PRESENTER", base + presenter + query if presenter else "about:blank"
    )
    source = source.replace("AUDIENCE", f"{base}/1{query}")
    wrapper = f"{base}/two-views.html"
    page.unroute(wrapper)
    page.route(
        wrapper, lambda route: route.fulfill(body=source, content_type="text/html")
    )
    page.goto(wrapper)
    frames = {"audience": frame_of(page, "audience")}
    if presenter:
        frames["presenter"] = frame_of(page, "presenter")
    target = "presenter" if presenter else "audience"
    page.wait_for_timeout(2000)
    return [
        {
            direction: change(page, frames, target, key)
            for direction, key in (("in", "ArrowRight"), ("out", "ArrowLeft"))
        }
        for _ in range(REPEATS)
    ]


def main() -> None:
    base = sys.argv[1]
    results: dict[str, list[dict[str, Change]]] = {}
    with sync_playwright() as playwright:
        for kind in (playwright.firefox, playwright.chromium):
            browser = kind.launch(headless=False, args=NATIVE_ARGS[kind.name])
            page = browser.new_page(no_viewport=True)
            page.set_content("<p>settling</p>")
            window = settle(page)
            for setup, (presenter, query) in SETUPS.items():
                name = f"{kind.name} {browser.version}, window {window}, {setup}"
                results[name] = run_setup(page, base, presenter, query)
                print(name)
                for pair in results[name]:
                    for direction, frames in pair.items():
                        for frame, row in frames.items():
                            print(
                                f"  {direction:3} {frame:9} >12.5ms {row['over_12ms']:3}"
                                f"  >25ms {row['over_25ms']:3}  max {row['largest_ms']}"
                            )
            browser.close()
    (OUT / "presenter.json").write_text(json.dumps(results, indent=1) + "\n")


if __name__ == "__main__":
    main()

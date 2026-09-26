#!/usr/bin/env python3
"""C2-C5 and C7: frame gaps during the zoom, in visible windows on this laptop's
screen. A copy of the zoom task's headed_check.py (E13), with the canvas
renderer, an idle check, Firefox preferences, and native windows. ROUNDS
lists the rounds in the order they were run. Writes ../out/headed-<name>.json.

    ../../../../.venv/bin/python3 headed_check.py svg-canvas   # in spike/

For each zoom in: load, wait 1 s, then record each frame's gap and the
camera's scale for 2 s. The screen runs at 120 Hz, so a normal gap is 8.3 ms;
a gap over 25 ms is at least one lost frame even at 60 Hz. Before each
browser's zooms, 2 s of an idle page check that the window is not throttled.

Two kinds of window:
- emulated: Playwright's viewport, devicePixelRatio 1, as in E13;
- native: no emulation, the screen's own devicePixelRatio (2), the window as
  large as the screen (Firefox in kiosk mode). With host=1.7 the stage is
  3332 x 1877 device px, about Martin's full-screen Slidev on this laptop.
"""

import json
import statistics
import sys
from collections.abc import Mapping
from dataclasses import asdict, dataclass, field

from frame_gaps import IDLE, GapSummary
from playwright.sync_api import Browser, BrowserType, Page, Playwright, sync_playwright
from spike_browser import OUT, SITE, serve_site

BASE_QUERY = "mode=js&ease=linear&fadelater=1&stroke=compensated"
CANVAS = "&renderer=canvas"
NATIVE_ARGS = {"chromium": ["--window-size=1728,1117"], "firefox": ["-kiosk"]}


@dataclass(frozen=True)
class Round:
    """One round of measurements."""

    browsers: tuple[str, ...]
    repeats: int
    variants: tuple[str, ...]  # added to BASE_QUERY
    viewport: tuple[int, int] | None  # CSS px; None for a native window
    firefox_prefs: Mapping[str, str | float | bool] = field(default_factory=dict)
    interleave: bool = False  # zoom each variant in turn, `repeats` times


BOTH = ("firefox", "chromium")
ROUNDS = {
    # C2: the SVG baseline of E13 and the canvas, side by side.
    "svg-canvas": Round(
        BOTH,
        3,
        ("", CANVAS, "&host=2", CANVAS + "&host=2"),
        (2000, 1150),
    ),
    # C3: like Martin's full-screen presentation on this laptop.
    "native": Round(BOTH, 3, ("&host=1.7", CANVAS + "&host=1.7"), None),
    # C4: which Canvas 2D path does Firefox take by default?
    "firefox-accelerated": Round(
        ("firefox",),
        3,
        (CANVAS + "&host=1.7",),
        None,
        {"gfx.canvas.accelerated": True, "gfx.canvas.accelerated.force-enabled": True},
    ),
    "firefox-unaccelerated": Round(
        ("firefox",),
        3,
        (CANVAS + "&host=1.7",),
        None,
        {"gfx.canvas.accelerated": False},
    ),
    # C5: where do Firefox's 6-8 ms per canvas frame go?
    "firefox-cost": Round(
        ("firefox",),
        3,
        (
            *(
                CANVAS + "&host=1.7" + extra
                for extra in ("&clips=off", "&smil=paused", "&only=hairspring")
            ),
            CANVAS + "&host=1",
        ),
        None,
    ),
    # C7: does clipping each clipped group to its limit first remove that cost?
    # Run with ../out/superseded/watch_player-with-limits.js as site/watch_player.js
    # and a `limits` page option; it did not help, so both were removed.
    "firefox-limits": Round(
        ("firefox", "chromium"),
        3,
        tuple(
            CANVAS + "&host=1.7" + extra for extra in ("&limits=off", "", "&clips=off")
        ),
        None,
    ),
    # C16: is erasing each clip's hole (clips=erase) cheaper than clipping?
    "erase": Round(
        ("firefox", "chromium"),
        3,
        tuple(
            CANVAS + "&host=1.7" + extra for extra in ("", "&clips=erase", "&clips=off")
        ),
        None,
    ),
    # C16 again: more zooms, and the variants in turn, so drift cannot favour one.
    "erase-interleaved": Round(
        ("firefox",),
        8,
        tuple(
            CANVAS + "&host=1.7" + extra for extra in ("", "&clips=erase", "&clips=off")
        ),
        None,
        interleave=True,
    ),
}
FRAMES = """async () => {
  const frames = [];
  spike.zoom(true);
  await new Promise(done => {
    let last = performance.now();
    const start = last;
    function frame(now) {
      frames.push([now - start, now - last, spike.matrix()]);
      last = now;
      if (now - start < 2000) requestAnimationFrame(frame); else done();
    }
    requestAnimationFrame(frame);
  });
  return frames;
}"""
WINDOW = "[innerWidth, innerHeight, devicePixelRatio]"


def scale_of(matrix: str) -> float:
    return 1.0 if matrix == "none" else float(matrix[7:].split(",")[0])


def one_zoom(page: Page, base: str, query: str) -> dict[str, object]:
    page.goto(f"{base}/zoom.html?{query}")
    page.evaluate("window.ready")
    page.wait_for_timeout(1000)  # let the page settle before the zoom
    frames = page.evaluate(FRAMES)
    gaps = [(float(at), float(gap), scale_of(str(m))) for at, gap, m in frames]
    worst = sorted(gaps, key=lambda frame: frame[1], reverse=True)[:3]
    draw_times = [float(time) for time in page.evaluate("spike.drawTimes")]
    return {
        "window": page.evaluate(WINDOW),
        **asdict(GapSummary.of([gap for _, gap, _ in gaps])),
        "worst_gaps_ms_at_scale": [
            (round(gap, 1), round(scale, 2)) for _, gap, scale in worst
        ],
        "draw_ms_median_max": (
            [round(statistics.median(draw_times), 2), round(max(draw_times), 2)]
            if draw_times
            else None
        ),
        "gaps_ms": [round(gap, 1) for _, gap, _ in gaps],
    }


def launch(kind: BrowserType, plan: Round) -> tuple[Browser, Page]:
    native = plan.viewport is None
    browser = kind.launch(
        headless=False,
        args=NATIVE_ARGS[kind.name] if native else [],
        firefox_user_prefs=dict(plan.firefox_prefs) if kind.name == "firefox" else None,
    )
    if plan.viewport is None:
        return browser, browser.new_page(no_viewport=True)
    width, height = plan.viewport
    return browser, browser.new_page(viewport={"width": width, "height": height})


def settle(page: Page) -> list[float]:
    """Wait until the window has kept its size for 2 s (kiosk mode grows the
    window some time after launch); return that size."""
    window, steady = page.evaluate(WINDOW), 0
    while steady < 4:
        page.wait_for_timeout(500)
        now = page.evaluate(WINDOW)
        window, steady = now, steady + 1 if now == window else 0
    return [float(value) for value in window]


@dataclass(frozen=True)
class BrowserRun:
    """One browser's results: the idle check, then each variant's zooms."""

    browser: str
    idle: dict[str, object]
    zooms: dict[str, list[dict[str, object]]]


def run(playwright: Playwright, base: str, plan: Round) -> list[BrowserRun]:
    results = []
    for kind in (getattr(playwright, name) for name in plan.browsers):
        browser, page = launch(kind, plan)
        page.goto(f"{base}/zoom.html")
        window = settle(page)
        idle = [float(gap) for gap in page.evaluate(IDLE)]
        zooms: dict[str, list[dict[str, object]]] = {
            variant or "(baseline)": [] for variant in plan.variants
        }
        order = (
            [variant for _ in range(plan.repeats) for variant in plan.variants]
            if plan.interleave
            else [variant for variant in plan.variants for _ in range(plan.repeats)]
        )
        for variant in order:
            zooms[variant or "(baseline)"].append(
                one_zoom(page, base, BASE_QUERY + variant)
            )
        name = f"{kind.name} {browser.version}, window {window}"
        results.append(BrowserRun(name, asdict(GapSummary.of(idle)), zooms))
        browser.close()
    return results


def main() -> None:
    name = sys.argv[1]
    plan = ROUNDS[name]
    assert (SITE / "zoom.html").exists()
    with sync_playwright() as playwright, serve_site() as base:
        results = run(playwright, base, plan)
    table = {
        result.browser: {"idle": result.idle, **result.zooms} for result in results
    }
    (OUT / f"headed-{name}.json").write_text(json.dumps(table, indent=1) + "\n")
    for result in results:
        print(result.browser)
        print(f"  idle {result.idle}")
        for variant, zooms in result.zooms.items():
            print(f"  {variant}")
            for zoom in zooms:
                print(
                    f"    frames {zoom['frames']:4}  median {zoom['median_ms']:5}"
                    f"  >12.5ms {zoom['over_12ms']:3}  >25ms {zoom['over_25ms']:3}"
                    f"  worst {zoom['worst_gaps_ms_at_scale']}"
                    f"  window {zoom['window']}  draw {zoom['draw_ms_median_max']}"
                )


if __name__ == "__main__":
    main()

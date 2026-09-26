#!/usr/bin/env python3
"""Timing questions of PLAN.md, step 1, in Chromium and Firefox, sampled at
every animation frame in the page. Writes out/timing.json.

    ../../../../.venv/bin/python3 measure_timing.py      # in spike/

1. Continuity: across a zoom in and a zoom out, does the mechanism's clock
   run on at one second a second, and does the balance stay where its
   keyframes put it at that clock time?
2. The zoom curve of each camera mode: where in the zoom the log of the scale
   changes fastest, as a fraction of the zoom (0.5 is symmetric), and the
   rate a quarter of the way in over the rate three quarters of the way in
   (1 is symmetric; more is a lurch then a crawl).
3. Frame pacing during the zoom: the gaps between animation frames.
"""

import itertools
import json
import math
import statistics

from playwright.sync_api import Page, sync_playwright
from spike_browser import OUT, browser_name, browsers, open_page, serve_site

PERIOD, AMPLITUDE, KEYFRAMES = 2.0, 150.0, 24  # skeleton_watch.py
DURATION = 1.8  # s, the zoom
SAMPLE = """async ([milliseconds, schedule]) => {
  const balance = [...spike.svg.querySelectorAll("animateTransform")]
    .find(animation => animation.getAttribute("values").startsWith("150;"))
    .parentElement;
  const samples = [], start = performance.now();
  for (const [at, on] of schedule) setTimeout(() => spike.zoom(on), at);
  await new Promise((done, fail) => {
    function frame(now) {
      try {
        const rotation = balance.transform.animVal.getItem(0);  // read-only
        samples.push([now - start, spike.svg.getCurrentTime(), rotation.angle,
          spike.matrix()]);
      } catch (error) { fail(error); return; }
      if (now - start < milliseconds) requestAnimationFrame(frame); else done();
    }
    requestAnimationFrame(frame);
  });
  return samples;
}"""


def keyframed_angle(time: float) -> float:
    """The balance angle at `time` s: the keyframes of skeleton_watch.py,
    AMPLITUDE cos(2 pi t / PERIOD) at 1/24 steps, joined by straight lines."""
    position = (time % PERIOD) / PERIOD * KEYFRAMES
    index = math.floor(position)

    def at(step: int) -> float:
        return AMPLITUDE * math.cos(2 * math.pi * step / KEYFRAMES)

    return at(index) + (position - index) * (at(index + 1) - at(index))


def sample(
    page: Page, milliseconds: int, schedule: list[tuple[int, bool]]
) -> list[list[object]]:
    page.set_default_timeout(milliseconds + 10_000)  # fail, do not hang
    return list(page.evaluate(SAMPLE, [milliseconds, schedule]))


def continuity(page: Page) -> dict[str, float]:
    rows = sample(page, 7500, [(1000, True), (4200, False)])
    walls = [float(str(row[0])) / 1000 for row in rows]
    clocks = [float(str(row[1])) for row in rows]
    errors = [
        abs((float(str(row[2])) - keyframed_angle(clock) + 180) % 360 - 180)
        for row, clock in zip(rows, clocks)
    ]
    steps = [
        (clocks[index + 1] - clocks[index]) - (walls[index + 1] - walls[index])
        for index in range(len(rows) - 1)
    ]
    return {
        "frames": len(rows),
        "clock_minus_wall_largest_step_s": max(abs(step) for step in steps),
        "clock_ever_went_back": float(
            any(b < a for a, b in itertools.pairwise(clocks))
        ),
        "balance_angle_largest_error_deg": max(errors),
    }


def scale_of(matrix: str) -> float:
    """The scale of a computed transform: "none" before the zoom starts."""
    return 1.0 if matrix == "none" else float(matrix[7:].split(",")[0])


def zoom_curve(page: Page) -> dict[str, float]:
    rows = sample(page, 2400, [(100, True)])
    points = [
        (float(str(row[0])) / 1000 - 0.1, math.log(scale_of(str(row[3]))))
        for row in rows
        if float(str(row[0])) >= 100
    ]
    total = points[-1][1]
    rates = [
        ((a[0] + b[0]) / 2 / DURATION, (b[1] - a[1]) / (b[0] - a[0]) / total)
        for a, b in itertools.pairwise(points)
        if b[0] > a[0]
    ]

    def rate_near(fraction: float) -> float:
        return min(rates, key=lambda rate: abs(rate[0] - fraction))[1]

    gaps = [1000 * (b[0] - a[0]) for a, b in itertools.pairwise(points)]
    return {
        "fastest_at_fraction": max(rates, key=lambda rate: rate[1])[0],
        "rate_quarter_over_three_quarters": rate_near(0.25) / rate_near(0.75),
        "frame_gap_ms_median": statistics.median(gaps),
        "frame_gap_ms_max": max(gaps),
    }


def main() -> None:
    OUT.mkdir(exist_ok=True)
    results: dict[str, dict[str, object]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for browser in browsers(playwright):
            entry: dict[str, object] = {}
            with open_page(browser, base, "mode=js") as page:
                entry["continuity"] = continuity(page)
            for mode, ease in (("svg", "linear"), ("svg", "exp"), ("js", "exp")):
                with open_page(browser, base, f"mode={mode}&ease={ease}") as page:
                    entry[f"zoom curve, {mode}, {ease}"] = zoom_curve(page)
            results[browser_name(browser)] = entry
    (OUT / "timing.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Where in the zoom do frames stall, in a visible window (the real GPU path)?
ROUNDS lists the four rounds run on 2026-09-25, on Martin's laptop, with the
window visible. Writes out/headed-round<N>.json. (Round 1's own file was
overwritten by round 2; its numbers are in README.md.)

    ../../../../.venv/bin/python3 headed_check.py 4    # in spike/: round 4

Martin saw one freeze of 100-200 ms in Firefox, about a third of the way into
the zoom, and less with the mechanism stopped. For each frame this records the
gap before it and the camera's scale, so a stall shows at which scale it
happens and whether it happens there every time.
"""

import json
import sys
from dataclasses import dataclass

from playwright.sync_api import Page, sync_playwright
from spike_browser import OUT, SITE, serve_site

BASE_QUERY = "mode=js&ease=linear&fadelater=1&stroke=compensated"


@dataclass(frozen=True)
class Round:
    """One round of measurements, run in the order they were decided."""

    browsers: tuple[str, ...]
    repeats: int
    variants: tuple[str, ...]  # added to BASE_QUERY
    window: tuple[int, int]  # the page's viewport, in CSS px


ROUNDS = {
    # What Martin saw: a freeze in Firefox. Where, and what removes it?
    1: Round(
        ("firefox", "chromium"),
        5,
        ("", "&smil=paused", "&clips=off", "&only=hairspring"),
        (1100, 700),
    ),
    # Does the stall move with the host scale? Which moving part triggers it?
    2: Round(
        ("firefox",),
        3,
        (
            "",
            "&smil=paused",
            "&clips=off",
            "&only=hairspring",
            "&host=1.5",
            "&drop=spring",
            "&drop=balance",
            "&drop=fork",
            "&drop=train",
            "&drop=seconds",
        ),
        (1600, 1000),
    ),
    # Does any animation cost the same, or only big moving parts? And at host
    # scale 2, about full-screen Slidev on a 1920 x 1080 projector.
    3: Round(
        ("firefox",),
        3,
        (
            "&drop=train,seconds",
            "&drop=spring,balance,fork",
            "&host=2",
            "&host=2&smil=paused",
        ),
        (2000, 1150),
    ),
    # Is Chromium smooth at host scale 2 too?
    4: Round(("chromium",), 3, ("&host=2", "&host=2&smil=paused"), (2000, 1150)),
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


def scale_of(matrix: str) -> float:
    return 1.0 if matrix == "none" else float(matrix[7:].split(",")[0])


def one_zoom(page: Page, base: str, query: str) -> dict[str, object]:
    page.goto(f"{base}/zoom.html?{query}")
    page.evaluate("window.ready")
    page.wait_for_timeout(1000)  # let the page settle before the zoom
    frames = page.evaluate(FRAMES)
    gaps = [(float(at), float(gap), scale_of(str(m))) for at, gap, m in frames]
    worst = sorted(gaps, key=lambda frame: frame[1], reverse=True)[:3]
    return {
        "frames": len(gaps),
        "over_25ms": sum(gap > 25 for _, gap, _ in gaps),
        "worst_gaps_ms_at_scale": [(round(gap, 1), round(s, 2)) for _, gap, s in worst],
    }


def main() -> None:
    number = int(sys.argv[1])
    plan = ROUNDS[number]
    assert (SITE / "zoom.html").exists()
    results: dict[str, dict[str, list[dict[str, object]]]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for kind in (getattr(playwright, name) for name in plan.browsers):
            browser = kind.launch(headless=False)
            width, height = plan.window
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(f"{base}/zoom.html")
            ratio = page.evaluate("window.devicePixelRatio")
            name = f"{kind.name} {browser.version}, headed, devicePixelRatio {ratio}"
            results[name] = {
                variant or "(baseline)": [
                    one_zoom(page, base, BASE_QUERY + variant)
                    for _ in range(plan.repeats)
                ]
                for variant in plan.variants
            }
            browser.close()
    path = OUT / f"headed-round{number}.json"
    path.write_text(json.dumps(results, indent=2) + "\n")
    for name, rows in results.items():
        print(name)
        for variant, zooms in rows.items():
            print(f"  {variant}")
            for zoom in zooms:
                print(
                    f"    frames {zoom['frames']:4}  >25ms {zoom['over_25ms']:3}"
                    f"  worst {zoom['worst_gaps_ms_at_scale']}"
                )


if __name__ == "__main__":
    main()

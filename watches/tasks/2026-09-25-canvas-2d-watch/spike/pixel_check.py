#!/usr/bin/env python3
"""C1: does the canvas draw what the SVG draws? In Chromium and Firefox, at
device pixel ratios 1 and 2, the same still (mechanism time, camera position,
view) is captured with renderer=svg and with renderer=canvas. Writes
../out/pixels.json and, for each pair, an amplified difference image in
../out/pixels/.

    ../../../../.venv/bin/python3 pixel_check.py      # in spike/
    ../../../../.venv/bin/python3 pixel_check.py --canvas "&clips=erase" --label erase

--canvas adds to the canvas's query only; --label writes ../out/pixels-<label>.json
and ../out/pixels-<label>/ instead.

The control is the SVG in Chromium against the SVG in Firefox: two renderers
that both draw the SVG correctly. `areas` counts pixels that differ by more
than 64 together with all 8 neighbours: a wrong or missing shape, not an
anti-aliased edge.
"""

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy
from playwright.sync_api import Browser, sync_playwright
from spike_browser import OUT, browser_name, browsers, open_page, serve_site
from spike_pixels import Pixels, grab, save

BASE_QUERY = "mode=js&stroke=compensated&smil=paused"
TWO_FRAMES = (
    "new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))"
)


@dataclass(frozen=True)
class Still:
    time: float  # s on the mechanism's clock
    along: float  # how far into the zoom: 0 (the cover) to 1 (the balance)
    only_spring: bool = False  # the view after the fade
    device_scale_factor: float = 1

    @property
    def query(self) -> str:
        only = "&only=hairspring" if self.only_spring else ""
        return f"{BASE_QUERY}&t={self.time}{only}"

    @property
    def label(self) -> str:
        only = "-spring" if self.only_spring else ""
        return f"t{self.time}-at{self.along}{only}-dpr{self.device_scale_factor:g}"


# Times: rest; mid-swing; a hand mid-step; past one repeat (accumulate); past
# the seconds hand's 60 s loop and 30 repeats of the train.
STILLS = (
    *(Still(time, 0) for time in (0, 0.5, 0.25, 1.3, 2.9, 17.25, 61.3)),
    *(Still(time, 0.35) for time in (0.5, 17.25)),
    *(Still(time, 1) for time in (0.5, 61.3)),
    Still(0.5, 1, only_spring=True),
    Still(1.7, 1, only_spring=True),
    Still(0.5, 0, device_scale_factor=2),
    Still(61.3, 0.35, device_scale_factor=2),
    Still(1.7, 1, only_spring=True, device_scale_factor=2),
)


@dataclass(frozen=True)
class Difference:
    mean: float  # mean over pixels of the largest channel difference (0-255)
    over_32: float  # fraction of pixels that differ by more than 32
    largest: int
    areas: int  # pixels over 64 whose 8 neighbours are also over 64


def compare(first: Pixels, second: Pixels) -> tuple[Difference, Pixels]:
    difference = numpy.abs(first - second).max(axis=2)
    big = difference > 64
    solid = big[1:-1, 1:-1].copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            solid &= big[1 + dy : big.shape[0] - 1 + dy, 1 + dx : big.shape[1] - 1 + dx]
    picture = numpy.repeat(
        255 - numpy.clip(difference * 4, 0, 255)[..., None], 3, axis=2
    )
    result = Difference(
        float(difference.mean()),
        float((difference > 32).mean()),
        int(difference.max()),
        int(solid.sum()),
    )
    return result, picture


def capture(browser: Browser, base: str, still: Still, query: str) -> Pixels:
    with open_page(
        browser, base, f"{still.query}&{query}", still.device_scale_factor
    ) as page:
        page.set_default_timeout(20000)
        page.evaluate(f"spike.jump({still.along})")
        page.evaluate(TWO_FRAMES)
        page.wait_for_timeout(200)
        return grab(page)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--canvas", default="")
    parser.add_argument("--label", default="")
    arguments = parser.parse_args()
    suffix = f"-{arguments.label}" if arguments.label else ""
    pictures: Path = OUT / f"pixels{suffix}"
    pictures.mkdir(exist_ok=True)
    results: dict[str, dict[str, dict[str, object]]] = {}
    svgs: dict[Still, list[Pixels]] = {still: [] for still in STILLS}
    with sync_playwright() as playwright, serve_site() as base:
        for browser in browsers(playwright):
            kind = browser.browser_type.name
            rows: dict[str, dict[str, object]] = {}
            for still in STILLS:
                svg = capture(browser, base, still, "renderer=svg")
                canvas = capture(
                    browser, base, still, f"renderer=canvas{arguments.canvas}"
                )
                svgs[still].append(svg)
                difference, picture = compare(svg, canvas)
                save(picture, str(pictures / f"{kind}-{still.label}-diff.png"))
                if still.along or still.device_scale_factor != 1:
                    save(canvas, str(pictures / f"{kind}-{still.label}-canvas.png"))
                rows[still.label] = asdict(difference)
            results[browser_name(browser)] = rows
    control: dict[str, dict[str, object]] = {}
    for still, (chromium, firefox) in svgs.items():
        difference, picture = compare(chromium, firefox)
        save(picture, str(pictures / f"control-{still.label}-diff.png"))
        control[still.label] = asdict(difference)
    results["control: SVG in Chromium against SVG in Firefox"] = control
    (OUT / f"pixels{suffix}.json").write_text(json.dumps(results, indent=2) + "\n")
    for name, rows in results.items():
        print(name)
        for label, row in rows.items():
            print(
                f"  {label:28} mean {row['mean']:6.3f}  >32 {row['over_32']:8.5f}"
                f"  max {row['largest']:3}  areas {row['areas']:5}"
            )


if __name__ == "__main__":
    main()

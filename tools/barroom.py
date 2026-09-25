#!/usr/bin/env python3
"""What the back row of a lit room actually sees, measured rather than imagined.

    .venv/bin/python3 tools/barroom.py                        # every talk's art
    .venv/bin/python3 tools/barroom.py new.svg                # one new drawing
    .venv/bin/python3 tools/barroom.py a.svg b.svg --save /tmp/

Needs playwright (+ `playwright install chromium`), Pillow and numpy.

This is the criterion that settles "can we use this?" when taste and arithmetic
disagree, and it is the one tool here that answers a question nothing else can.
Run it on the first day of a new drawing, not the last: every failure it finds is
cheap while the art is still being drawn and expensive afterwards.

TWO THINGS STAND BETWEEN YOUR LAPTOP AND THE BACK ROW, and this applies both to
the real rendered pixels.

1. ACUITY. One arcminute is a good eye's resolution limit. The venue's screen
   width and back-row distance give CSS px per arcmin; blur by a Gaussian of that
   width (FWHM = 1 arcmin, so sigma = FWHM/2.355).
2. AMBIENT FLARE. Room light lands on the screen and ADDS to every pixel:
   lin' = lin + F.

BOTH IN LINEAR LIGHT, which matters twice. Blurring 8-bit sRGB -- what PIL does by
default, and what most "simulate distance" hacks do -- is the wrong average and
shifts edge luminance. And in linear light the two COMMUTE, so the order is not a
hidden assumption. Flare is deliberately NOT clipped at white: reflected ambient
adds to the emitted image, the screen's white really does rise above its nominal
white, and the eye adapts to that new maximum. Clipping invents a penalty for any
design with large bright areas -- that is, every light one, including this deck's.

WHAT IT REPORTS, for each drawing at the size its file states (its width and
height attributes: the size a slide shows it at):

    ink%   share of the drawing's box carrying a mark at all: its density
    hold   MEDIAN contrast of those marks against the field, after the blur.
           Deliberately edge-weighted: a thin line really is mostly antialiased
           edge, so half its pixels carry less than its nominal colour
    p90     the same at the 90th percentile: whether the strongest marks survive.
           Thin styles score far apart on these two and the gap IS the finding
    Fmax   the ambient flare at which the typical mark falls through 3:1. A
           property of the drawing in units of room light. 0.30 is the physical
           ceiling for any design whatsoever, so an Fmax of 0.09 means roughly
           "fine in a dim room, gone under the lights"

READING THE NUMBER. `hold >= 3.0` at the design venue is the gate -- below it the
drawing costs attention and returns nothing. Above the gate, more headroom stops
deciding anything and taste takes over. watches/docs/measurements.md has the
timekeepers' numbers, for comparison. Read docs/legibility.md before assuming a
new drawing is fine.
"""

import argparse
import io
import math
import pathlib
import re
import sys
from collections.abc import Sequence

import lib
import numpy as np
from numpy.typing import NDArray
from PIL import Image

Linear = NDArray[np.float64]  # an H x W x 3 image in linear light
Plane = NDArray[np.float64]  # an H x W array: luminance or contrast
Mask = NDArray[np.bool_]

DSF = 2  # device scale factor we render at
_LIN = np.array([lib.srgb_to_lin(value) for value in range(256)], dtype=np.float64)


def to_linear(image: Image.Image) -> Linear:
    return _LIN[np.asarray(image.convert("RGB"), dtype=np.uint8)]


def to_srgb(linear: Linear) -> Image.Image:
    linear = np.clip(linear, 0.0, 1.0)
    encoded = np.where(
        linear <= 0.0031308, 12.92 * linear, 1.055 * linear ** (1 / 2.4) - 0.055
    )
    return Image.fromarray(np.round(encoded * 255).astype(np.uint8), mode="RGB")


def gauss(linear: Linear, sigma: float) -> Linear:
    """Separable Gaussian on a linear-light HxWx3 array, edges held (reflect)."""
    if sigma < 0.05:
        return linear
    radius = max(1, math.ceil(3 * sigma))
    offsets = np.arange(-radius, radius + 1, dtype=np.float64)
    kernel = np.exp(-(offsets**2) / (2 * sigma**2))
    kernel /= kernel.sum()
    out = linear
    for axis in (0, 1):
        pad = [(0, 0)] * 3
        pad[axis] = (radius, radius)
        padded = np.pad(out, pad, mode="reflect")
        total = np.zeros_like(out)
        for index, weight in enumerate(kernel):
            window = [slice(None)] * 3
            window[axis] = slice(index, index + out.shape[axis])
            total += weight * padded[tuple(window)]
        out = total
    return out


def luminance(linear: Linear) -> Plane:
    return 0.2126 * linear[..., 0] + 0.7152 * linear[..., 1] + 0.0722 * linear[..., 2]


def wcag(first: Plane | float, second: Plane | float) -> Plane:
    return np.asarray(
        (np.maximum(first, second) + 0.05) / (np.minimum(first, second) + 0.05)
    )


def field_of(plane: Plane) -> float:
    """The card's background luminance: modal value over a 256-bin histogram."""
    counts, edges = np.histogram(
        plane, bins=256, range=(float(plane.min()), float(plane.max()) + 1e-9)
    )
    index = int(counts.argmax())
    return float((edges[index] + edges[index + 1]) / 2)


def prep(image: Image.Image, sigma: float) -> tuple[Mask, Linear]:
    """-> (ink mask from the CLEAN art, blurred linear image). Blur is venue-only."""
    linear = to_linear(image)
    clean = luminance(linear)
    return wcag(clean, field_of(clean)) >= 1.5, gauss(linear, sigma)


def hold(ink: Mask, blurred: Linear, flare: float, percentile: float = 50) -> float:
    lit = luminance(blurred + flare)  # NOT clipped -- see the module docstring
    return (
        0.0
        if ink.sum() < 20
        else float(np.percentile(wcag(lit[ink], field_of(lit)), percentile))
    )


def fmax(ink: Mask, blurred: Linear, floor: float = lib.CONTRAST_FLOOR) -> float:
    if hold(ink, blurred, 0.0) < floor:
        return 0.0
    low, high = 0.0, 0.30
    for _ in range(24):
        middle = (low + high) / 2
        low, high = (
            (middle, high) if hold(ink, blurred, middle) >= floor else (low, middle)
        )
    return low


def label_for(file: pathlib.Path, others: Sequence[pathlib.Path] = ()) -> str:
    """A row label that stays unique when comparing variants of one subject.

    Comparing eight versions of `water-clock.svg` used to print "water-clock"
    eight times, which made the table useless for exactly the job it was most
    needed for. Fall back to the containing directory when the stem repeats.
    """
    stems = [other.stem for other in others]
    if others and stems.count(file.stem) > 1:
        return f"{file.parent.name}/{file.stem}"[:21]
    return file.stem[:21]


def sizes(files: Sequence[pathlib.Path]) -> list[tuple[float, float]]:
    """Each drawing's (width, height) in CSS px, from its file. Exits if one is missing."""
    out = []
    for file in files:
        width, height, _scale = lib.shown_size(file.read_text())
        if not (width and height):
            sys.exit(
                f"{lib.rel(file)}: no width/height -- the size a slide shows it at. "
                f"Run tools/artcheck.py"
            )
        out.append((width, height))
    return out


def render(
    files: Sequence[pathlib.Path], time: float = 4.0
) -> tuple[Image.Image, list[Image.Image]]:
    """Screenshot every drawing at the size its file states, on the panel, with its
    animation pinned to `time`. -> (whole screenshot, one crop per file)."""
    from playwright.sync_api import sync_playwright

    shown = sizes(files)
    page_parts = [
        "<!doctype html><meta charset=utf-8>",
        f"<style>body{{margin:0;background:{lib.ART_FIELD};padding:0}}",
        "div{display:flex;align-items:flex-start}svg{display:block;flex:none}</style><div>",
    ]
    for index, file in enumerate(files):
        source = file.read_text()
        for name in set(re.findall(r'id="([^"]+)"', source)):
            source = source.replace(f'id="{name}"', f'id="{name}-{index}"').replace(
                f"url(#{name})", f"url(#{name}-{index})"
            )
        page_parts.append(source)
    page_parts.append(
        '</div><script>document.querySelectorAll("svg").forEach(s=>{'
        f"s.pauseAnimations();s.setCurrentTime({time});}});</script>"
    )
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(
            viewport={
                "width": math.ceil(sum(width for width, _ in shown)),
                "height": math.ceil(max(height for _, height in shown)),
            },
            device_scale_factor=DSF,
        )
        page.set_content("".join(page_parts), wait_until="load")
        page.wait_for_timeout(600)
        shot = page.screenshot(full_page=True)
        browser.close()
    raw = Image.open(io.BytesIO(shot))
    crops, left = [], 0.0
    for width, height in shown:
        crops.append(
            raw.crop(
                (
                    round(left * DSF),
                    0,
                    round((left + width) * DSF),
                    round(height * DSF),
                )
            )
        )
        left += width
    return raw, crops


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument(
        "paths", nargs="*", help="SVG files or directories (default: every talk's art)"
    )
    parser.add_argument(
        "--save",
        default=None,
        metavar="DIR",
        help="also write what each venue looks like, clean and at 10%% flare",
    )
    arguments = parser.parse_args()

    files = lib.art_files(arguments.paths or None)
    if not files:
        sys.exit("no SVGs found")
    raw, cards = render(files)

    print(f"{'drawing':<22}{'ink%':>6}", end="")
    for venue_label, *_ in lib.VENUES:
        print(f"{venue_label:>26}", end="")
    print(f"\n{'':<22}{'':>6}", end="")
    for _ in lib.VENUES:
        print(f"{'hold':>9}{'p90':>8}{'Fmax':>9}", end="")
    print()

    at_design_venue = {}
    for file, card in zip(files, cards, strict=True):
        clean_ink, _ = prep(card, 0.0)
        print(f"{label_for(file, files):<22}{100 * clean_ink.mean():>6.1f}", end="")
        for venue_label, screen_width, distance in lib.VENUES:
            sigma = (1.0 / lib.arcmin_per_csspx(screen_width, distance)) / 2.355 * DSF
            ink, blurred = prep(card, sigma)
            median, p90, flare_limit = (
                hold(ink, blurred, 0.0),
                hold(ink, blurred, 0.0, 90),
                fmax(ink, blurred),
            )
            flag = (
                "!"
                if venue_label == lib.DESIGN_VENUE and median < lib.CONTRAST_FLOOR
                else " "
            )
            print(f"{median:>9.2f}{p90:>8.2f}{flare_limit:>8.3f}{flag}", end="")
            if venue_label == lib.DESIGN_VENUE:
                at_design_venue[label_for(file, files)] = (median, p90, flare_limit)
        print()

    print(
        f"\ngate: hold >= {lib.CONTRAST_FLOOR:.1f} at {lib.DESIGN_VENUE}"
        f"   (marked ! if it fails)"
    )
    failing = {
        name: (median, p90)
        for name, (median, p90, _) in at_design_venue.items()
        if median < lib.CONTRAST_FLOOR
    }
    if failing:
        for name, (median, p90) in failing.items():
            print(f"\nBELOW THE GATE: {name}  hold {median:.2f}, p90 {p90:.2f}")
            if p90 >= 2 * lib.CONTRAST_FLOOR:
                print(
                    f"  BUT ITS STRONG MARKS ARE FINE (p90 {p90:.2f}). `hold` is a median "
                    f"over every\n  non-background pixel, so a large deliberate WASH -- a "
                    f"low-opacity fill -- drags it\n  down without anything being wrong. "
                    f"What this is really saying is that at the\n  back row the drawing "
                    f"reduces to its outline. Check that the outline alone still\n  reads, "
                    f"and run `.venv/bin/python3 tools/artcheck.py` to see which fills are the washes."
                )
            else:
                print(
                    f"  Its strong marks fail too (p90 {p90:.2f}), so this is a real "
                    f"legibility failure.\n  Read docs/legibility.md before redrawing: a "
                    f"drawing that fails on stroke WEIGHT is\n  one remap from fixed, and "
                    f"one that fails on PALETTE cannot be fixed with ink."
                )
    else:
        print(
            "all clear the gate. Above it, headroom stops deciding and taste takes over."
        )
    print(
        "\nRead `hold` with `p90`, never alone. Fmax is room light tolerated; 0.30 is "
        "the\nceiling for any design. watches/docs/measurements.md has the timekeepers' numbers."
    )

    if arguments.save:
        out = pathlib.Path(arguments.save)
        out.mkdir(parents=True, exist_ok=True)
        for venue_label, screen_width, distance in lib.VENUES:
            arcmin = lib.arcmin_per_csspx(screen_width, distance)
            blurred = gauss(to_linear(raw), (1.0 / arcmin) / 2.355 * DSF)
            tag = venue_label.replace(" ", "").replace("@", "at")
            to_srgb(blurred).save(out / f"barroom-{tag}-clean.png")
            to_srgb(blurred + 0.10).save(out / f"barroom-{tag}-flare10.png")
        print(f"\nwrote {2 * len(lib.VENUES)} images to {out}")


if __name__ == "__main__":
    main()

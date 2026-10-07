#!/usr/bin/env python3
"""What the back row of a lit room actually sees, measured rather than imagined.

    .venv/bin/python3 tools/barroom.py watches/public/        # a talk's art
    .venv/bin/python3 tools/barroom.py new.svg                # one new drawing
    .venv/bin/python3 tools/barroom.py cover.png              # a picture, not an SVG
    .venv/bin/python3 tools/barroom.py a.svg b.svg --save /tmp/
    .venv/bin/python3 tools/barroom.py new.svg --json         # for another program
    .venv/bin/python3 tools/barroom.py new.svg --gate-only    # validation gate only

--gate-only calculates the design venue's median contrast and failure decision.
It omits other venues, p90, and Fmax. Identical decoded PNG pixels share a score.
The default report and its JSON schema retain all existing measurements.

Needs playwright, Pillow and numpy. It installs Chromium if it is missing
(`browsers.py`).

A PNG is a picture that something else drew (a talk's WebGL art, which has no
SVG). Give it as a file: a directory means its SVGs only. It must be at
DEVICE_SCALE (2) device px for each CSS px of the size a slide shows it at, and
on its own background: it is scored as it is, with no card behind it.

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
import json
import math
import pathlib
import sys
from collections.abc import Iterator, Mapping, Sequence
from contextlib import contextmanager
from dataclasses import dataclass

import browsers
import lib
import numpy as np
from numpy.typing import NDArray
from PIL import Image
from playwright.sync_api import Page, sync_playwright

Linear = NDArray[np.float64]  # an H x W x 3 image in linear light
Plane = NDArray[np.float64]  # an H x W array: luminance or contrast
Mask = NDArray[np.bool_]

DEVICE_SCALE = 2  # the device scale factor we render at
LINEAR_OF_CHANNEL = np.array(
    [lib.srgb_to_linear(value) for value in range(256)], dtype=np.float64
)


def to_linear(image: Image.Image) -> Linear:
    return LINEAR_OF_CHANNEL[np.asarray(image.convert("RGB"), dtype=np.uint8)]


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
    return lib.bisect(
        lambda flare: hold(ink, blurred, flare) >= floor,
        passing=0.0,
        failing=0.30,
        steps=24,
    )


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


def is_picture(file: pathlib.Path) -> bool:
    """Whether the file is a PNG, not an SVG."""
    return file.suffix.lower() == ".png"


def sizes(files: Sequence[pathlib.Path]) -> list[lib.ShownSize]:
    """The size each file states a slide shows it at: an SVG's, or a PNG's
    pixels over DEVICE_SCALE. Exits if an SVG has none."""
    out = []
    for file in files:
        if is_picture(file):
            with Image.open(file) as picture:
                width, height = picture.size
            out.append(lib.ShownSize(width / DEVICE_SCALE, height / DEVICE_SCALE, 1.0))
            continue
        size = lib.shown_size(file.read_text())
        if size is None:
            sys.exit(
                f"{lib.display_path(file)}: no width/height -- the size a slide shows "
                f"it at. Run tools/artcheck.py"
            )
        out.append(size)
    return out


def render(
    files: Sequence[pathlib.Path], time: float = 4.0
) -> tuple[Image.Image | None, list[Image.Image]]:
    """One picture of each file: an SVG screenshotted at the size its file
    states, on the panel, with its animation pinned to `time`; a PNG as it is.
    -> (the screenshot of the SVGs, or None if there are none; one picture per
    file, in the order of `files`)."""
    svgs = [file for file in files if not is_picture(file)]
    raw, drawn = render_svgs(svgs, time) if svgs else (None, [])
    made = iter(drawn)
    return raw, [
        Image.open(file).convert("RGB") if is_picture(file) else next(made)
        for file in files
    ]


@contextmanager
def svg_page(
    files: Sequence[pathlib.Path], browser_name: str = "chromium"
) -> Iterator[tuple[Page, list[lib.ShownSize]]]:
    """Load SVGs once. Close the page and browser when the caller leaves."""
    shown = sizes(files)
    if not shown:
        raise ValueError("At least one SVG is required.")
    page_parts = [
        "<!doctype html><meta charset=utf-8>",
        f"<style>body{{margin:0;background:{lib.ART_FIELD};padding:0}}",
        "div{display:flex;align-items:flex-start}svg{display:block;flex:none}</style><div>",
        *(
            lib.namespace_ids(file.read_text(), str(index))
            for index, file in enumerate(files)
        ),
        "</div>",
    ]
    with sync_playwright() as playwright:
        match browser_name:
            case "chromium":
                engine = playwright.chromium
            case "firefox":
                engine = playwright.firefox
            case _:
                raise ValueError(f"Unsupported browser: {browser_name}")
        browsers.install(engine)
        browser = engine.launch()
        try:
            page = browser.new_page(
                viewport={
                    "width": math.ceil(sum(size.width for size in shown)),
                    "height": math.ceil(max(size.height for size in shown)),
                },
                device_scale_factor=DEVICE_SCALE,
            )
            page.set_content("".join(page_parts), wait_until="load")
            page.evaluate("document.fonts.ready")
            yield page, shown
        finally:
            browser.close()


def svg_frame(
    page: Page, shown: Sequence[lib.ShownSize], times: Sequence[float]
) -> tuple[Image.Image, list[Image.Image]]:
    """Pose each SVG, wait for paint, and crop its stated display size."""
    if len(shown) != len(times):
        raise ValueError("Each SVG needs one sample time.")
    page.evaluate(
        """async times => {
            document.querySelectorAll('svg').forEach((svg, index) => {
                svg.pauseAnimations();
                svg.setCurrentTime(times[index]);
            });
            await new Promise(resolve => requestAnimationFrame(() =>
                requestAnimationFrame(resolve)));
        }""",
        list(times),
    )
    raw = Image.open(io.BytesIO(page.screenshot(full_page=True)))
    crops, left = [], 0.0
    for size in shown:
        crops.append(
            raw.crop(
                (
                    round(left * DEVICE_SCALE),
                    0,
                    round((left + size.width) * DEVICE_SCALE),
                    round(size.height * DEVICE_SCALE),
                )
            )
        )
        left += size.width
    return raw, crops


def render_svgs(
    files: Sequence[pathlib.Path], time: float
) -> tuple[Image.Image, list[Image.Image]]:
    """Render the SVGs at one time, on their original card background."""
    with svg_page(files) as (page, shown):
        return svg_frame(page, shown, [time] * len(files))


def render_samples(
    samples: Mapping[pathlib.Path, Sequence[float]], browser_name: str = "chromium"
) -> dict[pathlib.Path, dict[float, Image.Image]]:
    """Render only requested times. One screenshot can pose each SVG differently."""
    if not samples:
        return {}
    if any(not times for times in samples.values()):
        raise ValueError("Each SVG needs at least one sample time.")
    files = list(samples)
    frames: dict[pathlib.Path, dict[float, Image.Image]] = {file: {} for file in files}
    with svg_page(files, browser_name) as (page, shown):
        for index in range(max(map(len, samples.values()))):
            times = [
                samples[file][min(index, len(samples[file]) - 1)] for file in files
            ]
            _, cards = svg_frame(page, shown, times)
            for file, time, card in zip(files, times, cards, strict=True):
                if index < len(samples[file]):
                    frames[file][time] = card
    return frames


@dataclass(frozen=True)
class VenueScore:
    """What the back row at one venue gets from one drawing."""

    hold: float  # median contrast of the marks, after the blur
    p90: float  # the same at the 90th percentile
    fmax: float  # the ambient flare at which `hold` falls through the floor


@dataclass(frozen=True)
class DrawingScore:
    file: pathlib.Path
    ink_percent: float  # the share of the drawing's box that carries a mark
    venues: dict[lib.Venue, VenueScore]

    @property
    def passes_gate(self) -> bool:
        return self.venues[lib.DESIGN_VENUE].hold >= lib.CONTRAST_FLOOR


def score(file: pathlib.Path, card: Image.Image) -> DrawingScore:
    """One drawing, rendered on its card, at every venue."""
    clean_ink, _ = prep(card, 0.0)
    venues = {}
    for venue in lib.VENUES:
        ink, blurred = prep(card, venue.blur_sigma(DEVICE_SCALE))
        venues[venue] = VenueScore(
            hold(ink, blurred, 0.0), hold(ink, blurred, 0.0, 90), fmax(ink, blurred)
        )
    return DrawingScore(file, 100 * float(clean_ink.mean()), venues)


@dataclass(frozen=True)
class GateScore:
    file: pathlib.Path
    hold: float

    @property
    def passes_gate(self) -> bool:
        return self.hold >= lib.CONTRAST_FLOOR


def gate_scores(
    files: Sequence[pathlib.Path], cards: Sequence[Image.Image]
) -> list[GateScore]:
    """Measure the existing gate. Reuse scores for identical decoded PNG pixels."""
    cache: dict[tuple[tuple[int, int], bytes], float] = {}
    results = []
    for file, card in zip(files, cards, strict=True):
        key = (card.size, card.tobytes()) if is_picture(file) else None
        value = cache.get(key) if key is not None else None
        if value is None:
            ink, blurred = prep(card, lib.DESIGN_VENUE.blur_sigma(DEVICE_SCALE))
            value = hold(ink, blurred, 0.0)
            if key is not None:
                cache[key] = value
        results.append(GateScore(file, value))
    return results


def print_gates(scores: Sequence[GateScore], as_machine_json: bool) -> None:
    if as_machine_json:
        print(
            json.dumps(
                {
                    "design_venue": lib.DESIGN_VENUE.label,
                    "floor": lib.CONTRAST_FLOOR,
                    "drawings": [
                        {
                            "path": str(lib.display_path(score.file)),
                            "hold": score.hold,
                            "passes_gate": score.passes_gate,
                        }
                        for score in scores
                    ],
                },
                indent=2,
            )
        )
        return
    for score in scores:
        status = "ok" if score.passes_gate else "FAIL"
        print(f"{status}  {lib.display_path(score.file)}: hold {score.hold:.2f}")
    print(f"gate: hold >= {lib.CONTRAST_FLOOR:.1f} at {lib.DESIGN_VENUE.label}")


def print_table(scores: list[DrawingScore]) -> None:
    files = [drawing.file for drawing in scores]
    print(f"{'drawing':<22}{'ink%':>6}", end="")
    for venue in lib.VENUES:
        print(f"{venue.label:>26}", end="")
    print(f"\n{'':<22}{'':>6}", end="")
    for _ in lib.VENUES:
        print(f"{'hold':>9}{'p90':>8}{'Fmax':>9}", end="")
    print()
    for drawing in scores:
        print(
            f"{label_for(drawing.file, files):<22}{drawing.ink_percent:>6.1f}", end=""
        )
        for venue in lib.VENUES:
            venue_score = drawing.venues[venue]
            flag = (
                "!"
                if venue is lib.DESIGN_VENUE and venue_score.hold < lib.CONTRAST_FLOOR
                else " "
            )
            print(
                f"{venue_score.hold:>9.2f}{venue_score.p90:>8.2f}"
                f"{venue_score.fmax:>8.3f}{flag}",
                end="",
            )
        print()

    print(
        f"\ngate: hold >= {lib.CONTRAST_FLOOR:.1f} at {lib.DESIGN_VENUE.label}"
        f"   (marked ! if it fails)"
    )
    failing = [drawing for drawing in scores if not drawing.passes_gate]
    for drawing in failing:
        design = drawing.venues[lib.DESIGN_VENUE]
        print(
            f"\nBELOW THE GATE: {label_for(drawing.file, files)}  "
            f"hold {design.hold:.2f}, p90 {design.p90:.2f}"
        )
        if design.p90 >= 2 * lib.CONTRAST_FLOOR:
            print(
                f"  BUT ITS STRONG MARKS ARE FINE (p90 {design.p90:.2f}). `hold` is a median "
                f"over every\n  non-background pixel, so a large deliberate WASH -- a "
                f"low-opacity fill -- drags it\n  down without anything being wrong. "
                f"What this is really saying is that at the\n  back row the drawing "
                f"reduces to its outline. Check that the outline alone still\n  reads, "
                f"and run `.venv/bin/python3 tools/artcheck.py` to see which fills are the washes."
            )
        else:
            print(
                f"  Its strong marks fail too (p90 {design.p90:.2f}), so this is a real "
                f"legibility failure.\n  Read docs/legibility.md before redrawing: a "
                f"drawing that fails on stroke WEIGHT is\n  one remap from fixed, and "
                f"one that fails on PALETTE cannot be fixed with ink."
            )
    if not failing:
        print(
            "all clear the gate. Above it, headroom stops deciding and taste takes over."
        )
    print(
        "\nRead `hold` with `p90`, never alone. Fmax is room light tolerated; 0.30 is "
        "the\nceiling for any design. watches/docs/measurements.md has the timekeepers' numbers."
    )


def as_json(scores: list[DrawingScore]) -> str:
    files = [drawing.file for drawing in scores]
    return json.dumps(
        {
            "design_venue": lib.DESIGN_VENUE.label,
            "floor": lib.CONTRAST_FLOOR,
            "drawings": [
                {
                    "path": str(lib.display_path(drawing.file)),
                    "label": label_for(drawing.file, files),
                    "ink_percent": drawing.ink_percent,
                    "passes_gate": drawing.passes_gate,
                    "venues": {
                        venue.label: {
                            "hold": venue_score.hold,
                            "p90": venue_score.p90,
                            "fmax": venue_score.fmax,
                        }
                        for venue, venue_score in drawing.venues.items()
                    },
                }
                for drawing in scores
            ],
        },
        indent=2,
    )


def save_views(raw: Image.Image, out: pathlib.Path) -> None:
    """What each venue's back row sees of the whole screenshot, clean and at
    10% flare."""
    out.mkdir(parents=True, exist_ok=True)
    for venue in lib.VENUES:
        blurred = gauss(to_linear(raw), venue.blur_sigma(DEVICE_SCALE))
        tag = venue.label.replace(" ", "").replace("@", "at")
        to_srgb(blurred).save(out / f"barroom-{tag}-clean.png")
        to_srgb(blurred + 0.10).save(out / f"barroom-{tag}-flare10.png")


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument(
        "paths", nargs="+", help="SVG files or directories, or PNG files"
    )
    parser.add_argument(
        "--save",
        default=None,
        metavar="DIR",
        help="also write what each venue looks like, clean and at 10%% flare",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="print the scores as JSON, for another program, not as a table",
    )
    parser.add_argument(
        "--gate-only",
        action="store_true",
        help="calculate only the design-venue failure gate",
    )
    arguments = parser.parse_args()
    if arguments.gate_only and arguments.save:
        parser.error("--gate-only cannot be used with --save")

    files = lib.art_files(arguments.paths)
    if not files:
        sys.exit("no SVGs or PNGs found")
    raw, cards = render(files)
    if arguments.gate_only:
        gates = gate_scores(files, cards)
        print_gates(gates, arguments.json)
        if not all(gate.passes_gate for gate in gates):
            sys.exit(1)
        return
    scores = [score(file, card) for file, card in zip(files, cards, strict=True)]
    if arguments.json:
        print(as_json(scores))
    else:
        print_table(scores)
    if arguments.save and raw is not None:
        out = pathlib.Path(arguments.save)
        save_views(raw, out)
        if not arguments.json:
            print(f"\nwrote {2 * len(lib.VENUES)} images to {out}")
    if not all(drawing.passes_gate for drawing in scores):
        sys.exit(1)  # a drawing is below the gate


if __name__ == "__main__":
    main()

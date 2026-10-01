"""Measure candidate flash colours for the balance assembly.

    uv run tasks/2026-09-30-flash/tools/flash_colours.py   # in watches/, or at stem/

A flash replaces a part's normal inks (art-line lines on an art-knockout fill)
with flash inks for 0.25 s, five times. This script measures, for each candidate
pair of (flash line, flash fill):

  * how far each colour moves from the normal one (dE76, and the smaller dE
    under deuteranopia and protanopia): the signal of the flash;
  * how much of the balance's area each colour covers at the cover view: the
    signal is (colour change) x (area);
  * whether the flash line still reads on the flash fill (contrast), and the
    same-hue lightness rule (>= 1.4x) from docs/theme.md.

It reads the palette from the theme's CSS through stem/tools/lib.py.
"""

import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[4] / "tools"))

import lib

PALETTE = lib.LEDGER
PAPER = PALETTE["background"]
ART_LINE = PALETTE["art-line"]
KNOCKOUT = PALETTE["art-knockout"]
SECOND = PALETTE["second"]

# watch/generate.ts, at the cover view (scale 1: one unit is one slide px)
BALANCE_RADIUS = 56
BALANCE_RIM = 8
BALANCE_HUB = 10
BALANCE_ARM_WIDTH = 6
ARM_COUNT = 3


def over(colour: lib.Colour, opacity: float, paper: lib.Colour = PAPER) -> lib.Colour:
    """`colour` at `opacity` over `paper`, as the renderer mixes a fill."""
    mixed = [
        round(opacity * own + (1 - opacity) * base)
        for own, base in zip(
            (colour.red, colour.green, colour.blue),
            (paper.red, paper.green, paper.blue),
            strict=True,
        )
    ]
    return lib.Colour(*mixed)


def tint_like_knockout() -> tuple[float, lib.Colour]:
    """The opacity of SECOND over the paper that has the knockout's contrast
    against the paper: the second's analogue of the knockout."""
    target = lib.contrast(KNOCKOUT, PAPER)
    low, high = 0.0, 1.0
    for _ in range(40):
        middle = (low + high) / 2
        if lib.contrast(over(SECOND, middle), PAPER) < target:
            low = middle
        else:
            high = middle
    return high, over(SECOND, high)


def floor_tint() -> tuple[float, lib.Colour]:
    """The darkest tint of SECOND over the paper on which a SECOND line still
    holds the 3:1 floor."""
    low, high = 0.0, 1.0
    for _ in range(40):
        middle = (low + high) / 2
        if lib.contrast(SECOND, over(SECOND, middle)) >= lib.CONTRAST_FLOOR:
            low = middle
        else:
            high = middle
    return low, over(SECOND, low)


def deepened(colour: lib.Colour, target: float) -> lib.Colour:
    """`colour` scaled towards black until it has `target` contrast on the
    panel, as art-line is the accent deepened (docs/illustrations.md)."""
    low, high = 0.0, 1.0  # the scale
    for _ in range(40):
        middle = (low + high) / 2
        scaled = lib.Colour(
            *(
                round(middle * channel)
                for channel in (colour.red, colour.green, colour.blue)
            )
        )
        if lib.contrast(scaled, PALETTE["panel"]) < target:
            high = middle
        else:
            low = middle
    return lib.Colour(
        *(round(low * channel) for channel in (colour.red, colour.green, colour.blue))
    )


def balance_areas() -> tuple[float, float]:
    """The balance's fill and 3 px outline areas, in slide px squared, at the
    cover view: a disc less three openings between the hub and the rim."""
    inner = BALANCE_RADIUS - BALANCE_RIM
    annulus = math.pi * (inner**2 - BALANCE_HUB**2)
    arms = ARM_COUNT * BALANCE_ARM_WIDTH * (inner - BALANCE_HUB)
    openings = annulus - arms
    fill = math.pi * BALANCE_RADIUS**2 - openings
    opening_edge = 2 * math.pi * (inner + BALANCE_HUB) / 1 + 2 * ARM_COUNT * (
        inner - BALANCE_HUB
    )
    lines = 2 * math.pi * BALANCE_RADIUS * 3 + opening_edge * 2.5
    return fill, lines


def row(label: str, first: lib.Colour, second: lib.Colour) -> str:
    return (
        f"  {label:<34} dE {lib.de76(first, second):5.1f}"
        f"   colour-blind dE {lib.cvd(first, second):5.1f}"
        f"   contrast {lib.contrast(first, second):5.2f}"
    )


def main() -> None:
    opacity, knockout_tint = tint_like_knockout()
    floor_opacity, floor_colour = floor_tint()
    print(f"art-line {ART_LINE.hex}  art-knockout {KNOCKOUT.hex}  second {SECOND.hex}")
    print(f"paper {PAPER.hex}  panel {PALETTE['panel'].hex}\n")

    fill_area, line_area = balance_areas()
    print(
        f"balance at the cover view: fill {fill_area:,.0f} px^2,"
        f" outline {line_area:,.0f} px^2 ({fill_area / line_area:.1f}x)\n"
    )

    print("the line's change: art-line to a flash line")
    deep_second = deepened(SECOND, lib.contrast(ART_LINE, PALETTE["panel"]))
    for label, candidate in (("second", SECOND), ("second, deepened", deep_second)):
        print(row(f"art-line -> {label} {candidate.hex}", ART_LINE, candidate))
    print()

    print("the fill's change: art-knockout to a flash fill")
    fills = [
        ("unchanged (knockout)", KNOCKOUT),
        (f"second at {opacity:.2f} (knockout's contrast)", knockout_tint),
        ("second at 0.25", over(SECOND, 0.25)),
        (f"second at {floor_opacity:.2f} (3:1 floor)", floor_colour),
        ("second at 0.40", over(SECOND, 0.40)),
        ("second, solid", SECOND),
    ]
    for label, candidate in fills:
        print(row(f"{label} {candidate.hex}", KNOCKOUT, candidate))
    print()

    print("does the flash line read on the flash fill (normal: art-line on knockout)")
    print(row("art-line on knockout", ART_LINE, KNOCKOUT))
    for label, candidate in fills[1:]:
        print(row(f"second on {label}", SECOND, candidate))
    print()

    print("the flash fill against the paper and the panel")
    for label, candidate in fills:
        print(
            f"  {label:<40} paper {lib.contrast(candidate, PAPER):5.2f}"
            f"   panel {lib.contrast(candidate, PALETTE['panel']):5.2f}"
        )
    print()

    print(
        "the options, on the balance at the cover view. signal: sum of dE x area,"
        " in thousands;\nstructure: the flash line on the flash fill"
        " (normal 8.00; floor 3.00)"
    )
    options = [
        ("A lines only", SECOND, KNOCKOUT),
        ("B one colour, lines and fill", SECOND, SECOND),
        (f"C lines + tint {opacity:.2f}", SECOND, knockout_tint),
        (f"C lines + tint {floor_opacity:.2f}", SECOND, floor_colour),
        ("D fill only", ART_LINE, SECOND),
        ("E inverted: knockout on second", KNOCKOUT, SECOND),
    ]
    for label, line, fill in options:
        signal = (
            lib.de76(ART_LINE, line) * line_area + lib.de76(KNOCKOUT, fill) * fill_area
        )
        blind = (
            lib.cvd(ART_LINE, line) * line_area + lib.cvd(KNOCKOUT, fill) * fill_area
        )
        print(
            f"  {label:<34} signal {signal / 1000:6.0f}   colour-blind {blind / 1000:6.0f}"
            f"   structure {lib.contrast(line, fill):5.2f}"
        )


if __name__ == "__main__":
    main()

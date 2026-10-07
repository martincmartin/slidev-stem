#!/usr/bin/env python3
"""Is this colour allowed, and does the palette still pass its own gates?

    .venv/bin/python3 tools/palette.py                  # the palette, every gate, pass/fail
    .venv/bin/python3 tools/palette.py --talk watches   # only: does this talk set it?
                                                        # (only a slide class may)
    .venv/bin/python3 tools/palette.py "#C0451C"        # can I use this? measured in every role
    .venv/bin/python3 tools/palette.py "#C0451C" accent # ... and specifically as the accent

Stdlib only. The thresholds live in `lib.py`; this file only applies them. The
palette values come from the theme's CSS (`lib.THEME_CSS`), the one place they
are set.

WHY YOU WOULD RUN THIS. Sooner or later a slide wants a colour the roles do
not cover -- a third series in a chart, a highlight on a diagram, "just this one
red". The honest answer is usually to reuse a role, and this tells you what the
new colour would actually cost if you do not: what it contrasts at against the
surfaces it will sit on, whether a red-green deficient viewer can tell it from the
accent and the second, and how much room light it survives.

THE THREE MISTAKES THIS CATCHES, all of which were made for real (see
watches/tasks/2026-09-18-theme-colors/README.md, insights 3, 8 and 11):

  * measuring a mark against the slide BACKGROUND when it will sit on a card
    PANEL -- every gate here is stated against the surface the mark lands on;
  * measuring emphasis against the background instead of against INK. A dark
    accent beside dark ink does not read as emphasis however well it contrasts
    with the paper behind it. Seven themes had this defect and nobody saw it;
  * eyeballing colour-blind risk. Hand estimates were wrong in both directions.
"""

import argparse
import pathlib
import sys

import lib

FLARES = (0.0, 0.05, 0.10, 0.15, 0.20)  # the room-light table's columns


def rule(passed: bool) -> str:
    return "ok  " if passed else "FAIL"


def show_palette() -> bool:
    palette = lib.LEDGER
    print(f"Ledger, from {lib.display_path(lib.THEME_CSS)}\n")
    for role, value in palette.items():
        recipe = lib.THEME_RECIPES[role]
        made = "" if recipe.upper() == str(value) else f"   = {recipe}"
        print(f"  {lib.PALETTE_PREFIX}{role:<20} {value}{made}")

    print("\ngates\n")
    passed = show_gates(palette)

    print("\nroom light: contrast at additive ambient flare\n")
    print(
        f"  {'pair':<24}"
        + "".join(f"{flare:>8.2f}" for flare in FLARES)
        + f"{'Fmax':>8}"
    )
    for mark, surface in (
        ("ink", "background"),
        ("ink", "panel"),
        ("accent", "panel"),
        ("second", "panel"),
        ("muted", "panel"),
    ):
        row = "".join(
            f"{lib.contrast(palette[mark], palette[surface], flare):>8.2f}"
            for flare in FLARES
        )
        print(
            f"  {mark + ' vs ' + surface:<24}{row}"
            f"{lib.max_flare(palette[mark], palette[surface]):>8.3f}"
        )
    print(
        f"  {'ceiling for ANY design':<24}"
        + "".join(f"{lib.flare_ceiling(flare):>8.2f}" for flare in FLARES)
        + f"{0.30:>8.3f}"
    )

    print(f"\n{'ALL GATES PASS' if passed else 'SOMETHING FAILS -- see above'}")
    return passed


def gate_line(gate: lib.Gate, palette: lib.Palette) -> str:
    passed = gate.passes(palette)
    verdict = rule(passed) if gate.required or passed else "note"
    measured = gate.value(palette)
    shown = (
        f"{measured:>6.2f}:1"
        if gate.measure is lib.Measure.CONTRAST
        else f"{gate.measure.value} {measured:>4.0f}"
    )
    return (
        f"  {verdict} {gate.role:<12} vs {gate.against:<12} {shown:>10}  "
        f"({gate.limit}{'' if gate.required else ' preferred'})   {gate.why}"
    )


def show_gates(palette: lib.Palette) -> bool:
    """Print every gate of `palette`. True if every required gate passes."""
    passed = True
    for gate in lib.GATES:
        print(gate_line(gate, palette))
        passed = passed and (gate.passes(palette) or not gate.required)
    for hue_gate in lib.HUE_GATES:
        ok = hue_gate.passes(palette)
        _, chroma, hue = lib.lch(palette[hue_gate.role])
        print(
            f"  {rule(ok)} {hue_gate.role:<12} hue {hue:>5.0f}, chroma {chroma:>4.0f}   "
            f"(hue {hue_gate.low:g}-{hue_gate.high:g}, chroma >= {hue_gate.min_chroma:g}"
            + (
                f"; or chroma < {hue_gate.grey_below:g}"
                if hue_gate.grey_below is not None
                else ""
            )
            + f")   {hue_gate.why}"
        )
        passed = passed and ok
    return passed


def show_talks(talks: list[pathlib.Path]) -> bool:
    """Fail if one of `talks` sets the palette, except for the slides with a
    class, or if such a slide's palette fails a gate."""
    css_name = lib.display_path(lib.THEME_CSS)
    print(f"\nthe theme sets the palette ({css_name}); a slide class may override it\n")
    found = lib.talk_palette_declarations(talks, lib.THEME_RECIPES)
    for declaration, fault in found.faults:
        print(
            f"  FAIL {declaration.path}:{declaration.line} sets "
            f"{lib.PALETTE_PREFIX}{declaration.role}: {fault.value}"
        )
    passed = not found.faults
    for override in found.overrides:
        first = override.declarations[0]
        roles = ", ".join(declaration.role for declaration in override.declarations)
        print(f"\n  {override.selector} ({first.path}:{first.line}) sets {roles}\n")
        passed = show_gates(override.palette(lib.THEME_RECIPES)) and passed
    if not found.faults and not found.overrides:
        print(
            f"  ok   no talk declares a {lib.PALETTE_PREFIX}* variable "
            f"({len(talks)} talk(s) checked)"
        )
    return passed


def show_candidate(candidate: lib.Colour, role: str | None = None) -> None:
    palette = lib.LEDGER
    print(f"{candidate}  L={candidate.luminance:.4f}\n")

    print("  against every surface it might sit on")
    for surface in ("background", "panel", "border"):
        ratio = lib.contrast(candidate, palette[surface])
        print(
            f"    vs {surface:<11} {palette[surface]}  {ratio:>6.2f}:1   "
            f"Fmax {lib.max_flare(candidate, palette[surface]):.3f}"
        )

    print("\n  against the marks it will sit next to")
    for other in ("ink", "accent", "second", "muted", "subject"):
        print(
            f"    vs {other:<11} {palette[other]}  dE76 {lib.de76(candidate, palette[other]):>5.0f}"
            f"   colour-blind dE {lib.cvd(candidate, palette[other]):>5.0f}"
            f"   lightness {lib.contrast(candidate, palette[other]):.2f}x"
        )

    # as a replacement: the theme with the candidate in the role, and each
    # recipe made from that role made again
    roles = [role] if role else list(dict.fromkeys(gate.role for gate in lib.GATES))
    print("\n  as a replacement for each role")
    for replaced in roles:
        if replaced not in lib.THEME_RECIPES:
            sys.exit(f"{replaced} is not a role of the theme")
        replaced_palette = lib.resolve(lib.THEME_RECIPES | {replaced: str(candidate)})
        for gate in lib.GATES:
            if replaced in (gate.role, gate.against):
                print(
                    "  "
                    + gate_line(gate, replaced_palette).replace(
                        "  ", f"  as {replaced}: ", 1
                    )
                )

    print(
        "\n  Before adding a colour, check docs/theme.md -- the usual right answer\n"
        "  is to reuse a role."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument(
        "colour", nargs="?", help="a candidate colour, in hex: measure it in every role"
    )
    parser.add_argument(
        "role", nargs="?", help="with a colour: measure it against this role's gates"
    )
    parser.add_argument(
        "--talk",
        action="append",
        default=[],
        type=pathlib.Path,
        metavar="DIR",
        help=(
            "without a colour: check only that this talk sets the palette just "
            "for slide classes, and that each such palette passes the gates"
        ),
    )
    arguments = parser.parse_args()
    if arguments.colour is None and arguments.talk:
        return 0 if show_talks(arguments.talk) else 1
    if arguments.colour is None:
        return 0 if show_palette() else 1
    try:
        candidate = lib.Colour.from_hex(arguments.colour)
    except ValueError as error:
        sys.exit(str(error))
    show_candidate(candidate, arguments.role)
    return 0


if __name__ == "__main__":
    sys.exit(main())

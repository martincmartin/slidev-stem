#!/usr/bin/env python3
"""Is this colour allowed, and does the palette still pass its own gates?

    .venv/bin/python3 tools/palette.py                  # the palette, every gate, pass/fail
    .venv/bin/python3 tools/palette.py "#C0451C"        # can I use this? measured in every role
    .venv/bin/python3 tools/palette.py "#C0451C" accent # ... and specifically as the accent

Stdlib only. The thresholds live in `lib.py`; this file only applies them. The
palette values come from the theme's CSS (`lib.THEME_CSS`), the one place they
are set.

WHY YOU WOULD RUN THIS. Sooner or later a slide wants a colour the seven roles do
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

import sys

import lib

FLARES = (0.0, 0.05, 0.10, 0.15, 0.20)  # the room-light table's columns


def rule(passed: bool) -> str:
    return "ok  " if passed else "FAIL"


def show_palette() -> bool:
    palette = lib.LEDGER
    print(f"Ledger, from {lib.rel(lib.THEME_CSS)}\n")
    for role, value in palette.items():
        print(f"  {lib.PALETTE_PREFIX}{role:<11} {value}")

    print("\ncontrast gates\n")
    passes = []
    for role, against, minimum, why in lib.GATES:
        ratio = lib.contrast(palette[role], palette[against])
        passed = ratio >= minimum
        passes.append(passed)
        print(
            f"  {rule(passed)} {role:<7} vs {against:<11} {ratio:>6.2f}:1  "
            f"(>= {minimum})   {why}"
        )

    difference = lib.de76(palette["accent"], palette["ink"])
    passes.append(difference >= lib.ACCENT_VS_INK_DE)
    print(
        f"  {rule(difference >= lib.ACCENT_VS_INK_DE)} accent  vs ink         "
        f"dE {difference:>5.0f}    (>= {lib.ACCENT_VS_INK_DE})   emphasis must read as emphasis"
    )

    colour_blind = lib.cvd(palette["accent"], palette["second"])
    passes.append(colour_blind >= lib.CVD_DE)
    print(
        f"  {rule(colour_blind >= lib.CVD_DE)} accent  vs second      dE {colour_blind:>5.0f}    "
        f"(>= {lib.CVD_DE})   worst of deuter/protan"
    )

    lightness = lib.lightness_ratio(palette["accent"], palette["second"])
    print(
        f"  {'ok  ' if lightness >= 1.4 else 'note'} accent  vs second      "
        f"{lightness:>5.2f}x   (>= 1.4 preferred)   hue fails before lightness does"
    )

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

    passes.append(show_stray())

    print(f"\n{'ALL GATES PASS' if all(passes) else 'SOMETHING FAILS -- see above'}")
    return all(passes)


def show_stray() -> bool:
    """Fail if a talk sets the palette. Only the theme may."""
    css_name = lib.rel(lib.THEME_CSS)
    print(f"\nonly the theme sets the palette ({css_name})\n")
    stray = lib.stray_palette_declarations()
    for path, number, text in stray:
        print(f"  FAIL {path}:{number} sets {text!r}")
    if not stray:
        print(
            f"  ok   no talk declares a {lib.PALETTE_PREFIX}* variable "
            f"({len(lib.TALKS)} talk(s) checked)"
        )
    return not stray


def show_candidate(candidate: str, role: str | None = None) -> None:
    palette = lib.LEDGER
    candidate = candidate.upper()
    if not candidate.startswith("#"):
        candidate = "#" + candidate
    print(f"{candidate}  L={lib.luminance(candidate):.4f}\n")

    print("  against every surface it might sit on")
    for surface in ("background", "panel", "border"):
        ratio = lib.contrast(candidate, palette[surface])
        print(
            f"    vs {surface:<11} {palette[surface]}  {ratio:>6.2f}:1   "
            f"Fmax {lib.max_flare(candidate, palette[surface]):.3f}"
        )

    print("\n  against the marks it will sit next to")
    for other in ("ink", "accent", "second", "muted"):
        print(
            f"    vs {other:<11} {palette[other]}  dE76 {lib.de76(candidate, palette[other]):>5.0f}"
            f"   colour-blind dE {lib.cvd(candidate, palette[other]):>5.0f}"
            f"   lightness {lib.lightness_ratio(candidate, palette[other]):.2f}x"
        )

    roles = [role] if role else [gate_role for gate_role, *_ in lib.GATES]
    print("\n  as a replacement for each role")
    seen = set()
    for replaced in roles:
        if replaced in seen:
            continue
        seen.add(replaced)
        for gate_role, against, minimum, _why in lib.GATES:
            if gate_role != replaced:
                continue
            ratio = lib.contrast(candidate, palette[against])
            print(
                f"    {rule(ratio >= minimum)} as {replaced:<7} vs {against:<11} "
                f"{ratio:>6.2f}:1 (>= {minimum})"
            )
        if replaced == "accent":
            difference = lib.de76(candidate, palette["ink"])
            colour_blind = lib.cvd(candidate, palette["second"])
            print(
                f"    {rule(difference >= lib.ACCENT_VS_INK_DE)} as accent  vs ink        "
                f"dE {difference:>5.0f} (>= {lib.ACCENT_VS_INK_DE})"
            )
            print(
                f"    {rule(colour_blind >= lib.CVD_DE)} as accent  vs second     "
                f"dE {colour_blind:>5.0f} (>= {lib.CVD_DE}, colour-blind)"
            )
        if replaced == "second":
            colour_blind = lib.cvd(candidate, palette["accent"])
            print(
                f"    {rule(colour_blind >= lib.CVD_DE)} as second  vs accent     "
                f"dE {colour_blind:>5.0f} (>= {lib.CVD_DE}, colour-blind)"
            )

    print(
        "\n  Before adding a colour, check docs/theme.md -- the usual right answer\n"
        "  is to reuse a role. Seven is already more than most slides need."
    )


if __name__ == "__main__":
    if len(sys.argv) > 1:
        show_candidate(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
    else:
        sys.exit(0 if show_palette() else 1)

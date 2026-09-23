#!/usr/bin/env python3
"""Is this colour allowed, and does the palette still pass its own gates?

    python3 tools/palette.py                  # the palette, every gate, pass/fail
    python3 tools/palette.py "#C0451C"        # can I use this? measured in every role
    python3 tools/palette.py "#C0451C" accent # ... and specifically as the accent

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


def rule(ok):
    return "ok  " if ok else "FAIL"


def show_palette():
    P = lib.LEDGER
    print(f"Ledger, from {lib.rel(lib.THEME_CSS)}\n")
    for k, v in P.items():
        print(f"  {lib.PALETTE_PREFIX}{k:<11} {v}")

    print("\ncontrast gates\n")
    worst = []
    for role, against, minimum, why in lib.GATES:
        c = lib.contrast(P[role], P[against])
        ok = c >= minimum
        worst.append(ok)
        print(f"  {rule(ok)} {role:<7} vs {against:<11} {c:>6.2f}:1  "
              f"(>= {minimum})   {why}")

    de = lib.de76(P["accent"], P["ink"])
    worst.append(de >= lib.ACCENT_VS_INK_DE)
    print(f"  {rule(de >= lib.ACCENT_VS_INK_DE)} accent  vs ink         "
          f"dE {de:>5.0f}    (>= {lib.ACCENT_VS_INK_DE})   emphasis must read as emphasis")

    cv = lib.cvd(P["accent"], P["second"])
    worst.append(cv >= lib.CVD_DE)
    print(f"  {rule(cv >= lib.CVD_DE)} accent  vs second      dE {cv:>5.0f}    "
          f"(>= {lib.CVD_DE})   worst of deuter/protan")

    lr = lib.lightness_ratio(P["accent"], P["second"])
    print(f"  {'ok  ' if lr >= 1.4 else 'note'} accent  vs second      "
          f"{lr:>5.2f}x   (>= 1.4 preferred)   hue fails before lightness does")

    print("\nroom light: contrast at additive ambient flare\n")
    print(f"  {'pair':<24}" + "".join(f"{f:>8.2f}" for f in (0.0, 0.05, 0.10, 0.15, 0.20))
          + f"{'Fmax':>8}")
    for a, b in (("ink", "background"), ("ink", "panel"), ("accent", "panel"),
                 ("second", "panel"), ("muted", "panel")):
        row = "".join(f"{lib.contrast(P[a], P[b], f):>8.2f}"
                      for f in (0.0, 0.05, 0.10, 0.15, 0.20))
        print(f"  {a + ' vs ' + b:<24}{row}{lib.max_flare(P[a], P[b]):>8.3f}")
    print(f"  {'ceiling for ANY design':<24}"
          + "".join(f"{lib.flare_ceiling(f):>8.2f}" for f in (0.0, 0.05, 0.10, 0.15, 0.20))
          + f"{0.30:>8.3f}")

    worst.append(show_stray())

    print(f"\n{'ALL GATES PASS' if all(worst) else 'SOMETHING FAILS -- see above'}")
    return all(worst)


def show_stray():
    """Fail if a talk sets the palette. Only the theme may."""
    css_name = lib.rel(lib.THEME_CSS)
    print(f"\nonly the theme sets the palette ({css_name})\n")
    stray = lib.stray_palette_declarations()
    for path, n, text in stray:
        print(f"  FAIL {path}:{n} sets {text!r}")
    if not stray:
        print(f"  ok   no talk declares a {lib.PALETTE_PREFIX}* variable "
              f"({len(lib.TALKS)} talk(s) checked)")
    return not stray


def show_candidate(hexcol, role=None):
    P = lib.LEDGER
    hexcol = hexcol.upper()
    if not hexcol.startswith("#"):
        hexcol = "#" + hexcol
    print(f"{hexcol}  L={lib.luminance(hexcol):.4f}\n")

    print("  against every surface it might sit on")
    for surf in ("background", "panel", "border"):
        c = lib.contrast(hexcol, P[surf])
        print(f"    vs {surf:<11} {P[surf]}  {c:>6.2f}:1   Fmax {lib.max_flare(hexcol, P[surf]):.3f}")

    print("\n  against the marks it will sit next to")
    for other in ("ink", "accent", "second", "muted"):
        print(f"    vs {other:<11} {P[other]}  dE76 {lib.de76(hexcol, P[other]):>5.0f}"
              f"   colour-blind dE {lib.cvd(hexcol, P[other]):>5.0f}"
              f"   lightness {lib.lightness_ratio(hexcol, P[other]):.2f}x")

    roles = [role] if role else [r for r, *_ in lib.GATES]
    print("\n  as a replacement for each role")
    seen = set()
    for r in roles:
        if r in seen:
            continue
        seen.add(r)
        for gr, against, minimum, why in lib.GATES:
            if gr != r:
                continue
            c = lib.contrast(hexcol, P[against])
            print(f"    {rule(c >= minimum)} as {r:<7} vs {against:<11} {c:>6.2f}:1 (>= {minimum})")
        if r == "accent":
            de = lib.de76(hexcol, P["ink"])
            cv = lib.cvd(hexcol, P["second"])
            print(f"    {rule(de >= lib.ACCENT_VS_INK_DE)} as accent  vs ink        "
                  f"dE {de:>5.0f} (>= {lib.ACCENT_VS_INK_DE})")
            print(f"    {rule(cv >= lib.CVD_DE)} as accent  vs second     "
                  f"dE {cv:>5.0f} (>= {lib.CVD_DE}, colour-blind)")
        if r == "second":
            cv = lib.cvd(hexcol, P["accent"])
            print(f"    {rule(cv >= lib.CVD_DE)} as second  vs accent     "
                  f"dE {cv:>5.0f} (>= {lib.CVD_DE}, colour-blind)")

    print("\n  Before adding a colour, check docs/theme.md -- the usual right answer\n"
          "  is to reuse a role. Seven is already more than most slides need.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        show_candidate(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
    else:
        sys.exit(0 if show_palette() else 1)

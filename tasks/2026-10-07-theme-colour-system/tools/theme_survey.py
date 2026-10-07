"""How the 23 candidate themes of watches/tasks/2026-09-18-theme-colors fit a
step-by-step procedure for making a theme, and how much hue freedom the gates
leave.

1. Each role's CIE L*, C* (chroma: how much colour) and hue h, per theme.
2. The house gates (stem/tools/lib.py on 2026-10-07, copied below) per theme.
3. For a light paper (Ledger's panel) and a dark one (Beacon's panel): for
   each hue, the most chroma an sRGB colour can have at the lightness each
   contrast target needs. A hue with little chroma left there cannot carry
   its colour at that darkness.
4. Ledger's pairs that no house gate checks (values copied from
   themes/ledger/styles/ledger.css on 2026-10-07).

Run from stem/: uv run python tasks/2026-10-07-theme-colour-system/tools/theme_survey.py
"""

import importlib.util
import math
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
STEM = HERE.parents[2]


def load(name: str, path: pathlib.Path):  # noqa: ANN201
    """A module by its path: both helper modules are called lib.py."""
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


house = load("house_lib", STEM / "tools" / "lib.py")  # the house colour maths
theme_task = load(
    "theme_task_lib", STEM / "watches" / "tasks" / "2026-09-18-theme-colors" / "tools" / "lib.py"
)
Colour, Deficiency = house.Colour, house.Deficiency
contrast, cvd, de76 = house.contrast, house.cvd, house.de76

# The house gates on 2026-10-07 (tools/lib.py GATES), copied.
GATES = [("ink", "bg", 12.0), ("ink", "panel", 12.0), ("accent", "panel", 4.5),
         ("warn", "panel", 3.5), ("muted", "panel", 4.5)]
ACCENT_VS_INK_DE = 35
CVD_DE = 25


def lch(colour: Colour) -> tuple[float, float, float]:
    light, a, b = house.lab(house.simulate(colour, Deficiency.NORMAL))
    return light, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def survey() -> None:
    print("1. L* C* h per role (C* < 5 reads as grey; C* > 20 reads as a colour)\n")
    print(f"{'theme':24} {'bg L C':>9} {'panel C':>7} {'ink L C':>9} {'muted L C h':>13} "
          f"{'accent L C h':>14} {'second L C h':>14}")
    for theme in theme_task.load_themes():
        colours = {role: Colour.from_hex(theme[role]) for role in
                   ("bg", "panel", "ink", "muted", "accent", "warn")}
        values = {role: lch(colour) for role, colour in colours.items()}
        cell = lambda role, hue=False: (  # noqa: E731
            f"{values[role][0]:3.0f} {values[role][1]:3.0f}" + (f" {values[role][2]:3.0f}" if hue else ""))
        print(f"{theme['name']:24} {cell('bg'):>9} {values['panel'][1]:7.0f} {cell('ink'):>9} "
              f"{cell('muted', True):>13} {cell('accent', True):>14} {cell('warn', True):>14}")

    print("\n2. The house gates per theme (FAIL marks a miss)\n")
    for theme in theme_task.load_themes():
        colours = {role: Colour.from_hex(theme[role]) for role in
                   ("bg", "panel", "ink", "muted", "accent", "warn")}
        misses = [f"{role}/{against} {contrast(colours[role], colours[against]):.2f}<{floor}"
                  for role, against, floor in GATES
                  if contrast(colours[role], colours[against]) < floor]
        accent_ink = de76(colours["accent"], colours["ink"])
        accent_second = cvd(colours["accent"], colours["warn"])
        if accent_ink < ACCENT_VS_INK_DE:
            misses.append(f"accent/ink dE {accent_ink:.0f}<{ACCENT_VS_INK_DE}")
        if accent_second < CVD_DE:
            misses.append(f"accent/second CVD dE {accent_second:.0f}<{CVD_DE}")
        print(f"{theme['name']:24} {'ok' if not misses else 'FAIL ' + ', '.join(misses)}")


def luminance_for(paper: Colour, ratio: float, darker: bool) -> float:
    paper_luminance = paper.luminance
    return (paper_luminance + 0.05) / ratio - 0.05 if darker else ratio * (paper_luminance + 0.05) - 0.05


def max_chroma(hue: float, luminance: float) -> float:
    """The most chroma an sRGB colour of this hue can have at this luminance."""
    lightness = 116 * (luminance ** (1 / 3) if luminance > 216 / 24389 else (841 / 108) * luminance + 4 / 29) - 16
    best = 0.0
    low, high = 0.0, 150.0
    for _ in range(30):
        chroma = (low + high) / 2
        a, b = chroma * math.cos(math.radians(hue)), chroma * math.sin(math.radians(hue))
        fy = (lightness + 16) / 116
        fx, fz = fy + a / 500, fy - b / 200
        inverse = lambda f: f ** 3 if f > 6 / 29 else 3 * (6 / 29) ** 2 * (f - 4 / 29)  # noqa: E731
        x, y, z = 0.95047 * inverse(fx), inverse(fy), 1.08883 * inverse(fz)
        rgb = (3.2406 * x - 1.5372 * y - 0.4986 * z,
               -0.9689 * x + 1.8758 * y + 0.0415 * z,
               0.0557 * x - 0.2040 * y + 1.0570 * z)
        if all(-1e-6 <= channel <= 1 + 1e-6 for channel in rgb):
            best, low = chroma, chroma
        else:
            high = chroma
    return best


def hue_freedom() -> None:
    print("\n3. The most chroma each hue can have at the lightness a contrast target needs")
    names = {0: "magenta-red", 30: "red", 60: "orange", 90: "yellow", 120: "yellow-green",
             150: "green", 180: "teal", 210: "cyan", 240: "sky", 270: "blue", 300: "violet",
             330: "purple"}
    for label, paper, darker in (("light: on Ledger's panel #F2EEE4", Colour.from_hex("#F2EEE4"), True),
                                 ("dark: on Beacon's panel", Colour.from_hex("#212C41"), False)):
        targets = (3.5, 4.5, 9.6)
        print(f"\n{label}; the colour is {'darker' if darker else 'lighter'} than the paper")
        print(f"{'hue':>4} {'name':14} " + " ".join(f"{'at ' + str(t) + ':1':>9}" for t in targets))
        for hue, name in names.items():
            cells = [max_chroma(hue, luminance_for(paper, t, darker)) for t in targets]
            print(f"{hue:4} {name:14} " + " ".join(f"{c:9.0f}" for c in cells))


LEDGER_PAIRS = {
    "art-line vs muted": ("#143C6B", "#736A60"),
    "art-line vs ink": ("#143C6B", "#2A2520"),
    "second vs art-line": ("#9A6238", "#143C6B"),
    "accent vs ink": ("#1F5FA8", "#2A2520"),
    "accent vs second": ("#1F5FA8", "#9A6238"),
    "(10,0,0) vs black": ("#0A0000", "#000000"),
}


def pairs() -> None:
    print("\n4. Ledger's pairs, gated or not\n")
    for name, (first, second) in LEDGER_PAIRS.items():
        one, two = Colour.from_hex(first), Colour.from_hex(second)
        print(f"{name:22} dE {de76(one, two):5.1f}  CVD dE {cvd(one, two):5.1f}  "
              f"contrast {contrast(one, two):.2f}")


survey()
hue_freedom()
pairs()

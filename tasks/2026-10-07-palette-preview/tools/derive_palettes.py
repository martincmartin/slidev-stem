"""Derive the full palettes of three dark candidate themes, and measure them.

The candidates (watches/tasks/2026-09-18-theme-colors/deck/slides.md) set only
the text roles: background, panel, border, ink, muted, accent and second. A
palette class must also set the art roles. This derives them by the steps of
docs/theme.md, "Making a theme", as tasks/2026-10-07-theme-colour-system/
tools/gate_data.py did (its functions are copied here):

- subject: the accent's hue and chroma, moved away from the panel until it is
  9.6:1 on it (Ledger's value); chroma is cut to the sRGB gamut if needed.
- subject-wash: the paper's side, at the subject's hue and chroma 5, at 1.2:1
  on the panel.
- second-wash: the second over the background, at the blend that gives the
  subject wash's contrast on the panel.
- muted-wash, ground, ground-wash: the theme's recipes (muted at 0.18 over the
  background; ground is muted).
- water: the second, if its hue reads as water; otherwise a blue (h 250, C* 30)
  at the second's contrast on the panel.

Then it prints each palette as a CSS rule and every house gate on it.

Run from stem/: uv run python tasks/2026-10-07-palette-preview/tools/derive_palettes.py
"""

import importlib.util
import math
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
STEM = HERE.parents[2]


def load(name: str, path: pathlib.Path):  # noqa: ANN201
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


house = load("house_lib", STEM / "tools" / "lib.py")
Colour, contrast = house.Colour, house.contrast

SUBJECT_CONTRAST = 9.6
WASH_CONTRAST = 1.2
WASH_CHROMA = 5.0
WATER_HUE, WATER_CHROMA = 250.0, 30.0

# The text roles, copied from the candidates' slides (2026-09-18 deck).
CANDIDATES = {
    "campfire": {
        "background": "#241E1A",
        "panel": "#332A24",
        "border": "#4A3D34",
        "ink": "#F6EEE3",
        "muted": "#B5A594",
        "accent": "#FFB340",
        "second": "#54BCD6",
    },
    "marmalade": {
        "background": "#2B2420",
        "panel": "#38302C",
        "border": "#514944",
        "ink": "#FFF4E8",
        "muted": "#A49B92",
        "accent": "#E8883C",
        "second": "#93D096",
    },
    "after-hours": {
        "background": "#17202A",
        "panel": "#242C35",
        "border": "#3F454B",
        "ink": "#F6F0DF",
        "muted": "#94948F",
        "accent": "#FFB84D",
        "second": "#7FB3E8",
    },
}


def lch(colour: Colour) -> tuple[float, float, float]:
    return house.lch(colour)


def from_lch(light: float, chroma: float, hue: float) -> Colour | None:
    """The sRGB colour, or None outside the gamut."""
    a, b = chroma * math.cos(math.radians(hue)), chroma * math.sin(math.radians(hue))
    fy = (light + 16) / 116
    fx, fz = fy + a / 500, fy - b / 200
    inverse = lambda f: f**3 if f > 6 / 29 else 3 * (6 / 29) ** 2 * (f - 4 / 29)  # noqa: E731
    x, y, z = 0.95047 * inverse(fx), inverse(fy), 1.08883 * inverse(fz)
    linear = (
        3.2406 * x - 1.5372 * y - 0.4986 * z,
        -0.9689 * x + 1.8758 * y + 0.0415 * z,
        0.0557 * x - 0.2040 * y + 1.0570 * z,
    )
    if not all(-1e-4 <= channel <= 1 + 1e-4 for channel in linear):
        return None
    encode = lambda c: 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055  # noqa: E731
    return Colour(*(round(255 * min(1.0, max(0.0, encode(c)))) for c in linear))


def in_gamut(light: float, chroma: float, hue: float) -> Colour:
    """The colour, with its chroma cut until it is in sRGB."""
    while chroma >= 0:
        colour = from_lch(light, chroma, hue)
        if colour is not None:
            return colour
        chroma -= 0.5
    raise ValueError("no colour")


def at_contrast(paper: Colour, chroma: float, hue: float, target: float) -> Colour:
    """The colour of this hue and chroma whose contrast on `paper` is `target`:
    darker than the paper if the paper is light, lighter if it is dark."""
    paper_light = lch(paper)[0]
    toward_black = paper_light > 50
    low, high = (0.0, paper_light) if toward_black else (paper_light, 100.0)
    for _ in range(40):
        middle = (low + high) / 2
        too_far = contrast(in_gamut(middle, chroma, hue), paper) > target
        if toward_black:
            low, high = (middle, high) if too_far else (low, middle)
        else:
            low, high = (low, middle) if too_far else (middle, high)
    return in_gamut((low + high) / 2, chroma, hue)


def blend_for(line: Colour, paper: Colour, surface: Colour, target: float) -> Colour:
    """`line` over `paper` at the blend that gives `target` on `surface`."""
    low, high = 0.0, 1.0
    for _ in range(40):
        middle = (low + high) / 2
        if contrast(line.blend(paper, middle), surface) < target:
            low = middle
        else:
            high = middle
    return line.blend(paper, (low + high) / 2)


def water_gate() -> object:
    return next(gate for gate in house.HUE_GATES if gate.role == "water")


def derived(text_roles: dict[str, str]) -> dict[str, str]:
    """The roles that the palette class sets: the text roles, and the derived
    art roles. A role it does not set keeps the theme's recipe."""
    colour = {role: Colour.from_hex(value) for role, value in text_roles.items()}
    _, accent_chroma, accent_hue = lch(colour["accent"])
    subject = at_contrast(colour["panel"], accent_chroma, accent_hue, SUBJECT_CONTRAST)
    subject_wash = at_contrast(colour["panel"], WASH_CHROMA, lch(subject)[2], WASH_CONTRAST)
    second_wash = blend_for(
        colour["second"], colour["background"], colour["panel"], contrast(subject_wash, colour["panel"])
    )
    roles = dict(text_roles) | {
        "subject": subject.hex,
        "subject-wash": subject_wash.hex,
        "second-wash": second_wash.hex,
    }
    if water_gate().passes({"water": colour["second"]}):
        roles["water"] = "var(--palette-second)"
    else:
        roles["water"] = at_contrast(
            colour["panel"], WATER_CHROMA, WATER_HUE, contrast(colour["second"], colour["panel"])
        ).hex
    return roles


def main() -> None:
    for name, text_roles in CANDIDATES.items():
        roles = derived(text_roles)
        palette = house.resolve(house.THEME_RECIPES | roles)
        print(f".slidev-layout.palette-{name} {{")
        for role, value in roles.items():
            print(f"  --palette-{role}: {value.lower()};")
        print("}")
        misses = []
        for gate in house.GATES:
            passed = gate.passes(palette)
            if not passed and gate.required:
                misses.append(f"{gate.role} vs {gate.against}: {gate.value(palette):.2f} ({gate.limit})")
        for gate in house.HUE_GATES:
            if not gate.passes(palette):
                _, chroma, hue = lch(palette[gate.role])
                misses.append(f"{gate.role} hue {hue:.0f}, chroma {chroma:.0f}")
        print(f"  {len(misses)} required gate(s) missed" + "".join(f"\n    {miss}" for miss in misses))
        print()


main()

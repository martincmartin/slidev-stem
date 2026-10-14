#!/usr/bin/env python3
"""Derive a palette's art roles from its text roles, and print its rule.

    uv run tools/derive_palette.py campfire "Campfire" --background "#241E1A" \\
        --panel "#332A24" --border "#4A3D34" --ink "#F6EEE3" --muted "#B5A594" \\
        --accent "#FFB340" --second "#54BCD6"

Prints the rule of themes/palettes/<name>/palette.css, which sets every role
(docs/theme.md, "Palettes", says what else the palette's addon needs). Then
`uv run tools/palette.py` reports its gates. Stdlib only.

The steps are those of docs/theme.md, "Making a palette":

- subject: the accent's hue and chroma, moved away from the panel until it is
  SUBJECT_CONTRAST on it. Chroma is cut to the sRGB gamut if needed.
- subject-wash: on the paper's side of the panel, at the subject's hue and
  WASH_CHROMA, at WASH_CONTRAST on the panel.
- second-wash: the second over the background, at the blend that gives the
  subject wash's contrast on the panel.
- water: the second, if its hue reads as water (lib.HUE_GATES); otherwise a
  blue (WATER_HUE, WATER_CHROMA) at the second's contrast on the panel. On
  dark paper the subject is a pale accent, which is seldom a water colour.
- muted-wash, ground and ground-wash are the usual recipes (RECIPES).
"""

import argparse
import math
import sys
from dataclasses import dataclass

import lib
from lib import Colour

SUBJECT_CONTRAST = 9.6  # Ledger's subject on its panel (docs/theme.md)
WASH_CONTRAST = 1.2
WASH_CHROMA = 5.0
WATER_HUE = 250.0
WATER_CHROMA = 30.0
BISECTION_STEPS = 40
TEXT_ROLES = ("background", "panel", "border", "ink", "muted", "accent", "second")
# The roles that follow others by the usual recipe (docs/theme.md, "Making a
# palette", steps 10 and 11). Tune one in the palette's file if it misses a gate.
RECIPES = {
    "muted-wash": "color-mix(in srgb, var(--palette-muted) 18%, var(--palette-background))",
    "ground": "var(--palette-muted)",
    "ground-wash": "color-mix(in srgb, var(--palette-ground) 18%, var(--palette-background))",
}


def from_lch(light: float, chroma: float, hue: float) -> Colour | None:
    """The sRGB colour of CIE L*C*h (D65), or None outside the gamut."""
    a = chroma * math.cos(math.radians(hue))
    b = chroma * math.sin(math.radians(hue))
    f_y = (light + 16) / 116
    f_x, f_z = f_y + a / 500, f_y - b / 200

    def inverse(value: float) -> float:
        return value**3 if value > 6 / 29 else 3 * (6 / 29) ** 2 * (value - 4 / 29)

    x, y, z = 0.95047 * inverse(f_x), inverse(f_y), 1.08883 * inverse(f_z)
    linear = (
        3.2406 * x - 1.5372 * y - 0.4986 * z,
        -0.9689 * x + 1.8758 * y + 0.0415 * z,
        0.0557 * x - 0.2040 * y + 1.0570 * z,
    )
    if not all(-1e-4 <= channel <= 1 + 1e-4 for channel in linear):
        return None

    def encode(channel: float) -> int:
        channel = min(1.0, max(0.0, channel))
        encoded = (
            12.92 * channel
            if channel <= 0.0031308
            else 1.055 * channel ** (1 / 2.4) - 0.055
        )
        return round(255 * encoded)

    red, green, blue = (encode(channel) for channel in linear)
    return Colour(red, green, blue)


def in_gamut(light: float, chroma: float, hue: float) -> Colour:
    """The colour, with its chroma cut until it is in sRGB."""
    while chroma >= 0:
        colour = from_lch(light, chroma, hue)
        if colour is not None:
            return colour
        chroma -= 0.5
    raise ValueError(f"no sRGB colour at L* {light:.1f}, h {hue:.0f}")


def at_contrast(paper: Colour, chroma: float, hue: float, target: float) -> Colour:
    """The colour of this hue and chroma at `target` contrast on `paper`, on
    the side away from the paper: darker on light paper, lighter on dark."""
    paper_light = lib.lch(paper)[0]
    toward_black = paper_light > 50
    low, high = (0.0, paper_light) if toward_black else (paper_light, 100.0)
    for _ in range(BISECTION_STEPS):
        middle = (low + high) / 2
        too_far = lib.contrast(in_gamut(middle, chroma, hue), paper) > target
        if toward_black == too_far:
            low = middle
        else:
            high = middle
    return in_gamut((low + high) / 2, chroma, hue)


def blend_for(line: Colour, paper: Colour, surface: Colour, target: float) -> Colour:
    """`line` over `paper`, at the blend that gives `target` on `surface`."""
    low, high = 0.0, 1.0
    for _ in range(BISECTION_STEPS):
        middle = (low + high) / 2
        if lib.contrast(line.blend(paper, middle), surface) < target:
            low = middle
        else:
            high = middle
    return line.blend(paper, (low + high) / 2)


@dataclass(frozen=True)
class PaletteRule:
    """A palette: its name, its display name, and every role."""

    name: str  # "campfire": the class is palette-campfire
    display_name: str  # "Campfire": a preview shows it in its corner
    recipes: lib.Recipes

    def css(self) -> str:
        lines = [lib.palette_selector(self.name).replace(", ", ",\n") + " {"]
        lines.append(
            f'  --preview-name: "{self.display_name}"; /* for .palette-preview (house.css) */'
        )
        lines += [
            f"  {lib.PALETTE_PREFIX}{role}: {value.lower()};"
            for role, value in self.recipes.items()
        ]
        return "\n".join([*lines, "}"])


def derive(name: str, display_name: str, text: dict[str, Colour]) -> PaletteRule:
    """The palette whose text roles are `text` (each of TEXT_ROLES)."""
    missing = set(TEXT_ROLES) - set(text)
    if missing:
        raise ValueError(f"the text roles lack {sorted(missing)}")
    panel = text["panel"]
    _, accent_chroma, accent_hue = lib.lch(text["accent"])
    subject = at_contrast(panel, accent_chroma, accent_hue, SUBJECT_CONTRAST)
    subject_wash = at_contrast(panel, WASH_CHROMA, lib.lch(subject)[2], WASH_CONTRAST)
    second_wash = blend_for(
        text["second"], text["background"], panel, lib.contrast(subject_wash, panel)
    )
    water_gate = next(gate for gate in lib.HUE_GATES if gate.role == "water")
    water = (
        f"var({lib.PALETTE_PREFIX}second)"
        if water_gate.passes({"water": text["second"]})
        else at_contrast(
            panel, WATER_CHROMA, WATER_HUE, lib.contrast(text["second"], panel)
        ).hex
    )
    recipes = (
        {role: text[role].hex for role in TEXT_ROLES}
        | {
            "subject": subject.hex,
            "subject-wash": subject_wash.hex,
            "second-wash": second_wash.hex,
            "water": water,
        }
        | RECIPES
    )
    return PaletteRule(name, display_name, {role: recipes[role] for role in lib.ROLES})


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument(
        "name", help="the palette's name; its class is palette-<name>: campfire"
    )
    parser.add_argument("display_name", help="the name in a preview's corner: Campfire")
    for role in TEXT_ROLES:
        parser.add_argument(f"--{role}", required=True, metavar="HEX")
    arguments = parser.parse_args()
    try:
        text = {role: Colour.from_hex(getattr(arguments, role)) for role in TEXT_ROLES}
        print(derive(arguments.name, arguments.display_name, text).css())
    except ValueError as error:
        sys.exit(str(error))
    return 0


if __name__ == "__main__":
    sys.exit(main())

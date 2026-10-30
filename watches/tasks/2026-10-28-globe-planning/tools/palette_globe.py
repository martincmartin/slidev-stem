"""The globe's colours in every house palette: the sea filled with the water
colour as the pool's substance (0.6) or as a wash (18%), and the coast drawn
in the water colour or the ground colour. Prints the contrasts.

Run it at the repo root, with the house's tools on the import path:
    PYTHONPATH=tools uv run python \
        watches/tasks/2026-10-28-globe-planning/tools/palette_globe.py
"""

import json
from dataclasses import dataclass

from lib import Colour, contrast, house_palettes, lch, palette_recipes, resolve

# The diving board's water (watches/art/diving_board.py, WATER_OPACITY): the
# water colour as a substance.
SUBSTANCE = 0.6
# A wash made as the muted and ground washes are (docs/theme.md): 18% over
# the paper.
WASH = 0.18
# The spike's meridians: the ink mixed half with the paper (PLAN.md, section 5).
MERIDIAN_MIX = 0.5


@dataclass(frozen=True)
class Fill:
    name: str
    alpha: float


FILLS = (Fill("substance", SUBSTANCE), Fill("wash", WASH))


def report(name: str) -> dict[str, object]:
    palette = resolve(palette_recipes(name))
    paper = palette["background"]
    water = palette["water"]
    ground = palette["ground"]
    meridian = palette["ink"].blend(paper, MERIDIAN_MIX)
    hue = lch(water)[2]
    result: dict[str, object] = {
        "palette": name,
        "paper": paper.hex,
        "water": water.hex,
        "water hue": round(hue),
        "ground": ground.hex,
        "water line on paper": round(contrast(water, paper), 2),
        "ground line on paper": round(contrast(ground, paper), 2),
    }
    for fill in FILLS:
        sea: Colour = water.blend(paper, fill.alpha)
        result[f"{fill.name}: sea"] = sea.hex
        result[f"{fill.name}: sea against land"] = round(contrast(sea, paper), 2)
        result[f"{fill.name}: water line on sea"] = round(contrast(water, sea), 2)
        result[f"{fill.name}: ground line on sea"] = round(contrast(ground, sea), 2)
        result[f"{fill.name}: meridian on sea"] = round(contrast(meridian, sea), 2)
    return result


def main() -> None:
    print(json.dumps([report(name) for name in house_palettes()], indent=1))


if __name__ == "__main__":
    main()

from pathlib import Path

import derive_palette
import lib
import pytest
from lib import Colour

CAMPFIRE = {
    "background": "#241E1A",
    "panel": "#332A24",
    "border": "#4A3D34",
    "ink": "#F6EEE3",
    "muted": "#B5A594",
    "accent": "#FFB340",
    "second": "#54BCD6",
}


def text_roles(values: dict[str, str]) -> dict[str, Colour]:
    return {role: Colour.from_hex(value) for role, value in values.items()}


def test_the_house_campfire_palette_is_what_the_steps_give() -> None:
    derived = derive_palette.derive("campfire", "Campfire", text_roles(CAMPFIRE))
    assert derived.recipes == {
        role: value.upper() if value.startswith("#") else value
        for role, value in lib.palette_recipes("campfire").items()
    }


def test_the_subject_and_its_wash_are_at_their_contrasts() -> None:
    rule = derive_palette.derive("campfire", "Campfire", text_roles(CAMPFIRE))
    palette = lib.resolve(rule.recipes)
    subject = lib.contrast(palette["subject"], palette["panel"])
    wash = lib.contrast(palette["subject-wash"], palette["panel"])
    assert subject == pytest.approx(derive_palette.SUBJECT_CONTRAST, abs=0.1)
    assert wash == pytest.approx(derive_palette.WASH_CONTRAST, abs=0.02)


def test_a_green_second_gives_water_a_blue_of_its_own() -> None:
    rule = derive_palette.derive(
        "mint", "Mint", text_roles(CAMPFIRE | {"second": "#93D096"})
    )
    water = next(gate for gate in lib.HUE_GATES if gate.role == "water")
    assert rule.recipes["water"].startswith("#")
    assert water.passes({"water": Colour.from_hex(rule.recipes["water"])})


def test_the_rule_names_its_class_and_its_title() -> None:
    css = derive_palette.derive("campfire", "Campfire", text_roles(CAMPFIRE)).css()
    assert css.startswith(
        ":where(.palette-campfire) .slidev-layout,\n.slidev-layout.palette-campfire {"
    )
    assert '--preview-name: "Campfire";' in css


def test_the_rule_is_one_that_the_tools_read(tmp_path: Path) -> None:
    css = derive_palette.derive("campfire", "Campfire", text_roles(CAMPFIRE)).css()
    path = tmp_path / "campfire" / "palette.css"
    path.parent.mkdir()
    path.write_text(css)
    assert lib.css_recipes(path) == {
        role: value.lower()
        for role, value in derive_palette.derive(
            "campfire", "Campfire", text_roles(CAMPFIRE)
        ).recipes.items()
    }


def test_a_missing_text_role_is_an_error() -> None:
    partial = text_roles(CAMPFIRE)
    del partial["ink"]
    with pytest.raises(ValueError, match="ink"):
        derive_palette.derive("campfire", "Campfire", partial)

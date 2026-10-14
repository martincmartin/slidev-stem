import json
import math
import re
from pathlib import Path

import lib
import pytest
from lib import Colour

BLACK = Colour(0, 0, 0)
WHITE = Colour(255, 255, 255)


def write(path: Path, text: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


# ---- colour ---------------------------------------------------------------------
def test_hex_round_trip() -> None:
    assert Colour.from_hex("#2a2520").hex == "#2A2520"
    assert Colour.from_hex("2A2520") == Colour(0x2A, 0x25, 0x20)


@pytest.mark.parametrize("text", ["#fff", "#12345", "#GGGGGG", "", "#1234567"])
def test_from_hex_rejects_what_is_not_six_digits(text: str) -> None:
    with pytest.raises(ValueError, match="6-digit"):
        Colour.from_hex(text)


def test_blend_at_the_ends_and_the_middle() -> None:
    assert BLACK.blend(WHITE, 1.0) == BLACK
    assert BLACK.blend(WHITE, 0.0) == WHITE
    assert BLACK.blend(WHITE, 0.5) == Colour(128, 128, 128)  # 127.5 rounds to even


def test_contrast_of_black_on_white_is_21() -> None:
    assert lib.contrast(BLACK, WHITE) == pytest.approx(21.0)
    assert lib.contrast(WHITE, BLACK) == pytest.approx(21.0)
    assert lib.contrast(WHITE, WHITE) == pytest.approx(1.0)


def test_flare_lowers_contrast_and_has_a_ceiling() -> None:
    assert lib.contrast(BLACK, WHITE, flare=0.1) < lib.contrast(BLACK, WHITE)
    assert lib.flare_ceiling(0.3) == pytest.approx(3.0)
    assert lib.flare_ceiling(0.0) == pytest.approx(21.0)
    assert lib.flare_ceiling(0.1) < lib.flare_ceiling(0.05)


def test_max_flare_is_where_the_pair_falls_through_the_floor() -> None:
    grey = Colour(0x77, 0x77, 0x77)
    flare = lib.max_flare(grey, WHITE)
    assert lib.contrast(grey, WHITE, flare) >= lib.CONTRAST_FLOOR
    assert lib.contrast(grey, WHITE, flare + 0.001) < lib.CONTRAST_FLOOR


def test_max_flare_is_zero_for_a_pair_already_under_the_floor() -> None:
    assert lib.max_flare(Colour(0xCC, 0xCC, 0xCC), WHITE) == 0.0


def test_min_opacity_round_trips_through_blend() -> None:
    alpha = lib.min_opacity(BLACK, WHITE)
    assert alpha is not None
    assert lib.contrast(BLACK.blend(WHITE, alpha), WHITE) >= lib.CONTRAST_FLOOR
    assert lib.contrast(BLACK.blend(WHITE, alpha - 0.01), WHITE) < lib.CONTRAST_FLOOR


def test_min_opacity_is_none_when_opaque_is_under_the_floor() -> None:
    assert lib.min_opacity(Colour(0xCC, 0xCC, 0xCC), WHITE) is None


def test_a_colour_has_no_difference_from_itself() -> None:
    colour = Colour(0xC0, 0x45, 0x1C)
    assert lib.de76(colour, colour) == pytest.approx(0.0)
    assert lib.cvd(colour, colour) == pytest.approx(0.0)


def test_black_and_white_differ_by_about_100_in_lab() -> None:
    assert lib.de76(BLACK, WHITE) == pytest.approx(100.0, abs=0.5)
    assert math.isfinite(lib.cvd(BLACK, WHITE))


# ---- the palettes ----------------------------------------------------------------
def palette_rule(name: str, roles: dict[str, str]) -> str:
    body = "".join(f"  --palette-{role}: {value};\n" for role, value in roles.items())
    return (
        f"/* .slidev-layout.palette-{name} {{ --palette-ink: #111111; }} */\n"
        f":where(.palette-{name}) .slidev-layout,\n.slidev-layout.palette-{name} {{\n"
        f'  --preview-name: "{name}";\n{body}}}\n'
    )


def every_role(**changed: str) -> dict[str, str]:
    """The reference palette's roles, with some changed."""
    return dict(lib.REFERENCE_RECIPES) | {
        role.replace("_", "-"): value for role, value in changed.items()
    }


def test_css_recipes_reads_its_palettes_rule_and_skips_comments(tmp_path: Path) -> None:
    path = write(
        tmp_path / "warm" / "palette.css", palette_rule("warm", {"ink": "#2A2520"})
    )
    assert lib.css_recipes(path) == {"ink": "#2A2520"}


def test_css_recipes_is_none_without_the_rule_of_its_directory(tmp_path: Path) -> None:
    path = write(
        tmp_path / "warm" / "palette.css", palette_rule("cool", {"ink": "#000000"})
    )
    assert lib.css_recipes(path) is None


def test_a_palette_must_set_every_role(tmp_path: Path) -> None:
    roles = every_role()
    del roles["ground-wash"]
    write(tmp_path / "warm" / "palette.css", palette_rule("warm", roles))
    with pytest.raises(ValueError, match="ground-wash"):
        lib.palette_recipes("warm", tmp_path)


def test_a_palette_may_set_no_other_role(tmp_path: Path) -> None:
    write(
        tmp_path / "warm" / "palette.css",
        palette_rule("warm", every_role(glow="#FFFFFF")),
    )
    with pytest.raises(ValueError, match="glow"):
        lib.palette_recipes("warm", tmp_path)


def test_a_name_that_is_not_a_palette_is_an_error(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="not a house palette"):
        lib.palette_recipes("no-such-palette", tmp_path)


def test_a_palette_value_that_is_not_a_colour_is_an_error(tmp_path: Path) -> None:
    write(
        tmp_path / "warm" / "palette.css", palette_rule("warm", every_role(ink="red"))
    )
    with pytest.raises(ValueError, match="6-digit"):
        lib.resolve(lib.palette_recipes("warm", tmp_path))


# ---- the house palettes -----------------------------------------------------------
def test_the_reference_palette_is_the_first_house_palette() -> None:
    palettes = lib.house_palettes()
    assert palettes[0] == lib.REFERENCE_PALETTE
    assert lib.palette_recipes(lib.REFERENCE_PALETTE) == lib.REFERENCE_RECIPES
    assert {"campfire", "after-hours", "beacon"} <= set(palettes)


@pytest.mark.parametrize("name", lib.house_palettes())
def test_each_house_palette_passes_every_gate(name: str) -> None:
    palette = lib.resolve(lib.palette_recipes(name))
    assert [
        gate for gate in lib.GATES if gate.required and not gate.passes(palette)
    ] == []
    assert all(gate.passes(palette) for gate in lib.HUE_GATES)


@pytest.mark.parametrize("name", lib.house_palettes())
def test_each_palettes_addon_makes_it_the_talks(name: str) -> None:
    """The addon's index.html puts the palette's class on <html>, and its
    package is the name a talk's `addons:` resolves (`palette-<name>`)."""
    directory = lib.PALETTES_DIR / name
    page = (directory / "index.html").read_text("utf-8")
    assert re.search(rf'<html class="palette-{name}">', page)
    package = json.loads((directory / "package.json").read_text("utf-8"))
    assert package["name"] == f"slidev-addon-palette-{name}"


def test_the_house_theme_sets_no_role() -> None:
    """The colours are the palettes'. A role that the theme set would hide a
    palette's value, with no error."""
    found = lib.talk_palette_declarations(
        [lib.ROOT / "themes/house"], lib.REFERENCE_RECIPES
    )
    assert found.faults == [] and found.overrides == []


def test_light_and_dark_paper() -> None:
    assert lib.paper_schema(lib.resolve(lib.palette_recipes("ledger"))) == "light"
    assert lib.paper_schema(lib.resolve(lib.palette_recipes("campfire"))) == "dark"


# ---- a talk's palette ---------------------------------------------------------------
def test_a_talk_names_its_palette_and_schema_in_its_headmatter(tmp_path: Path) -> None:
    write(
        tmp_path / "slides.md",
        "---\ntheme: house\ncolorSchema: dark # Campfire\naddons:\n"
        '  - "@/addons/narration"\n  - palette-campfire # the palette\n---\n',
    )
    assert lib.talk_palette(tmp_path) == "campfire"
    assert lib.talk_color_schema(tmp_path) == "dark"


@pytest.mark.parametrize(
    "addons",
    ["", "addons:\n  - other\n", "addons:\n  - palette-ledger\n  - palette-beacon\n"],
)
def test_a_talk_must_load_one_palette(tmp_path: Path, addons: str) -> None:
    write(
        tmp_path / "slides.md",
        f"---\ntheme: house\n{addons}---\n\naddons:\n  - palette-x\n",
    )
    with pytest.raises(ValueError, match="one palette addon"):
        lib.talk_palette(tmp_path)


def test_a_talk_without_a_schema_has_none(tmp_path: Path) -> None:
    write(tmp_path / "slides.md", "---\ntheme: house\n---\n")
    assert lib.talk_color_schema(tmp_path) is None


# ---- recipes ------------------------------------------------------------------------
def test_a_recipe_is_a_role_or_a_mix_of_roles() -> None:
    palette = lib.resolve(
        {
            "paper": "#FFFFFF",
            "line": "#000000",
            "same": "var(--palette-line)",
            "wash": "color-mix(in srgb, var(--palette-line) 20%, var(--palette-paper))",
            "other-way": "color-mix(in srgb, var(--palette-paper), #000000 20%)",
            "half": "color-mix(in srgb, var(--palette-paper), var(--palette-line))",
        }
    )
    assert palette["same"] == Colour(0, 0, 0)
    assert palette["wash"] == palette["other-way"] == Colour(204, 204, 204)
    assert palette["half"] == Colour(128, 128, 128)


def test_ledger_washes_are_their_recipes() -> None:
    ledger = lib.resolve(lib.palette_recipes("ledger"))
    muted, paper = ledger["muted"], ledger["background"]
    assert ledger["muted-wash"] == muted.blend(paper, 0.18)
    assert ledger["ground-wash"] == ledger["muted-wash"]
    assert ledger["water"] == ledger["subject"]


@pytest.mark.parametrize(
    ("recipes", "message"),
    [
        ({"a": "var(--palette-b)", "b": "var(--palette-a)"}, "refer to each other"),
        ({"a": "var(--palette-missing)"}, "not a role"),
        ({"a": "color-mix(in srgb, #000000)"}, "two colours"),
        ({"a": "color-mix(in oklch, #000000, #FFFFFF)"}, "6-digit"),
    ],
)
def test_a_bad_recipe_is_an_error(recipes: dict[str, str], message: str) -> None:
    with pytest.raises(ValueError, match=message):
        lib.resolve(recipes)


def test_a_wash_variation_is_a_wash_moved_toward_its_line_or_the_paper() -> None:
    wash, muted = lib.REFERENCE["muted-wash"], lib.REFERENCE["muted"]
    shaded = muted.blend(wash, 0.1)
    lit = lib.REFERENCE["background"].blend(wash, 0.2)
    assert lib.wash_variation(shaded) == "muted-wash"
    assert lib.wash_variation(lit) == "muted-wash"
    assert lib.wash_variation(Colour(0xC0, 0x45, 0x1C)) is None


def test_the_hue_gates_tell_water_from_mud() -> None:
    water = next(gate for gate in lib.HUE_GATES if gate.role == "water")
    assert water.passes(lib.REFERENCE)
    assert not water.passes(lib.REFERENCE | {"water": lib.REFERENCE["second"]})


# ---- sizes -------------------------------------------------------------------------
@pytest.mark.parametrize(
    ("text", "number"),
    [
        ("12", 12.0),
        ("1.5", 1.5),
        (".5", 0.5),
        ("2.", 2.0),
        ("1.2.3", None),
        ("", None),
        (None, None),
        ("12px", None),
        ("-3", None),
    ],
)
def test_plain_number(text: str | None, number: float | None) -> None:
    assert lib.plain_number(text) == number


def test_shown_size_is_css_px_per_viewbox_unit() -> None:
    size = lib.shown_size('<svg width="120" height="60" viewBox="0 0 240 120">')
    assert size is not None
    assert size.css_px_per_unit == 0.5
    assert (size.width, size.height) == (120, 60)


@pytest.mark.parametrize(
    "source",
    [
        '<svg width="120" viewBox="0 0 240 120">',
        '<svg width="0" height="60" viewBox="0 0 240 120">',
        '<svg width="1.2.3" height="60" viewBox="0 0 240 120">',
        '<svg width="120" height="60">',
        "no svg",
    ],
)
def test_shown_size_is_none_when_the_root_does_not_say(source: str) -> None:
    assert lib.shown_size(source) is None


# ---- the palette in a talk's files ----------------------------------------------------
def declarations(talk: Path) -> lib.PaletteDeclarations:
    return lib.talk_palette_declarations([talk], lib.REFERENCE_RECIPES)


OVERRIDE = ".slidev-layout.warm { --palette-ink: #112233; }\n"
LEAK = ".watch-layer { --palette-ink: #FF0000; }\n"


def test_a_slide_class_may_set_a_role(tmp_path: Path) -> None:
    write(tmp_path / "slides.md", f"---\n---\n<style>\n{OVERRIDE}</style>\n")
    found = declarations(tmp_path)
    assert found.faults == []
    assert [rule.selector for rule in found.overrides] == [".slidev-layout.warm"]
    assert found.overrides[0].palette(lib.REFERENCE_RECIPES)["ink"] == Colour(
        0x11, 0x22, 0x33
    )


def test_a_slide_class_that_sets_a_role_changes_its_recipes_too(tmp_path: Path) -> None:
    write(
        tmp_path / "slides.md",
        "---\n---\n<style>\n.slidev-layout.blue { --palette-muted: #2040A0; }\n</style>\n",
    )
    palette = declarations(tmp_path).overrides[0].palette(lib.REFERENCE_RECIPES)
    assert palette["muted-wash"] == Colour(0x20, 0x40, 0xA0).blend(
        lib.REFERENCE["background"], 0.18
    )


@pytest.mark.parametrize(
    "where",
    [
        "global-bottom.vue",
        "slide-bottom.vue",
        "layouts/wide.vue",
        "setup/main.ts",
        "components/Card.vue",
        "styles/talk.css",
        "pages/two.md",
        "deep/er/place/index.html",
    ],
)
def test_a_declaration_in_any_source_file_of_the_talk_is_found(
    tmp_path: Path, where: str
) -> None:
    write(tmp_path / where, f"<style>\n{LEAK}</style>\n")
    found = declarations(tmp_path)
    assert [fault for _, fault in found.faults] == [lib.Fault.NOT_A_SLIDE_CLASS]
    assert found.faults[0][0].path.name == Path(where).name


def test_a_style_attribute_is_found_too(tmp_path: Path) -> None:
    write(tmp_path / "layouts/x.vue", '<div style="--palette-ink:#ff0000">')
    assert [fault for _, fault in declarations(tmp_path).faults] == [
        lib.Fault.NOT_A_SLIDE_CLASS
    ]


@pytest.mark.parametrize(
    "where",
    [
        "docs/theme.md",
        "tasks/x/NOTES.md",
        "node_modules/p/a.css",
        "public/a.svg",
        "README.md",
        "AGENTS.md",
        ".hidden/a.css",
        "dist/a.css",
    ],
)
def test_the_docs_the_tasks_and_the_dependencies_are_not_read(
    tmp_path: Path, where: str
) -> None:
    write(tmp_path / where, LEAK)
    assert declarations(tmp_path).faults == []


def test_a_comment_is_not_a_declaration(tmp_path: Path) -> None:
    write(tmp_path / "global-bottom.vue", f"/* {LEAK} */\n")
    assert declarations(tmp_path).faults == []


def test_an_unknown_role_and_a_bad_value_are_faults(tmp_path: Path) -> None:
    write(
        tmp_path / "slides.md",
        ".slidev-layout.warm { --palette-nope: #112233; --palette-ink: red; }\n",
    )
    faults = [fault for _, fault in declarations(tmp_path).faults]
    assert faults == [lib.Fault.UNKNOWN_ROLE, lib.Fault.NOT_A_COLOUR]


def test_a_fault_names_its_line(tmp_path: Path) -> None:
    write(tmp_path / "global-bottom.vue", f"<template/>\n\n<style>\n{LEAK}</style>\n")
    assert declarations(tmp_path).faults[0][0].line == 4

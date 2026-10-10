"""The palette of Ledger, the house theme, for the art scripts that write files.

The theme sets each role as `--palette-<role>` in its CSS (stem/docs/theme.md):
a #rrggbb colour, `var()` of another role, or `color-mix(in srgb, ...)` of
those. A file has no browser to work out a recipe, so this does it, as the
browser does: an sRGB mix of the 8-bit channels. The house tools do the same
in stem/tools/lib.py (`resolve`); the talk and the house are separate
projects, so each has its own copy.
"""

import pathlib
import re

from watch_design import TALK


def theme_css(talk: pathlib.Path = TALK) -> pathlib.Path:
    """The CSS of Ledger, the house theme that every other house theme is
    built on (stem/docs/theme.md, "The house themes"). The files that the art
    scripts write take their fallback colours from it, whichever house theme
    the `theme:` line of the talk's headmatter names: the house tools measure
    the art in Ledger, and the gates hold each house theme to the same pairs.
    On a slide, the theme paints the art through its `var()`s. So a talk
    changes its theme with its `theme:` line alone."""
    return talk.parent / "themes" / "ledger" / "styles" / "ledger.css"


def mix(first: str, second: str, share: float) -> str:
    """`first` at `share` and `second` at the rest, as #RRGGBB: what CSS's
    `color-mix(in srgb, first share, second)` and SVG's opacity give."""
    channels = [
        round(int(one, 16) * share + int(other, 16) * (1 - share))
        for one, other in zip(
            (first[1:3], first[3:5], first[5:7]),
            (second[1:3], second[3:5], second[5:7]),
            strict=True,
        )
    ]
    return "#" + "".join(f"{channel:02X}" for channel in channels)


def _arguments(text: str) -> list[str]:
    """A CSS function's arguments, split at its top-level commas only."""
    parts, depth, current = [], 0, ""
    for character in text:
        if character == "," and depth == 0:
            parts.append(current.strip())
            current = ""
            continue
        depth += {"(": 1, ")": -1}.get(character, 0)
        current += character
    parts.append(current.strip())
    return parts


def theme_palette(css: pathlib.Path | None = None) -> dict[str, str]:
    """Every `--palette-<role>` of the theme, as {role: "#RRGGBB"}."""
    source = re.sub(r"/\*.*?\*/", "", (css or theme_css()).read_text(), flags=re.DOTALL)
    recipes = {
        role: " ".join(value.split())
        for role, value in re.findall(r"--palette-([\w-]+)\s*:\s*([^;]+);", source)
    }
    palette: dict[str, str] = {}

    def colour_of_value(text: str, chain: tuple[str, ...]) -> str:
        text = text.strip()
        if re.fullmatch(r"#[0-9A-Fa-f]{6}", text):
            return text.upper()
        if found := re.fullmatch(r"var\(\s*--palette-([\w-]+)\s*\)", text):
            return colour_of_role(found.group(1), chain)
        if found := re.fullmatch(r"color-mix\(\s*in srgb\s*,(.*)\)", text):
            parts = []
            for argument in _arguments(found.group(1)):
                percentage = re.fullmatch(r"(.+?)\s+([0-9.]+)%", argument)
                parts.append(
                    (percentage.group(1), float(percentage.group(2)) / 100)
                    if percentage
                    else (argument, None)
                )
            if len(parts) != 2:
                raise SystemExit(f"{text!r}: color-mix() needs two colours")
            (first, first_share), (second, second_share) = parts
            share = (
                first_share
                if first_share is not None
                else 1 - second_share
                if second_share is not None
                else 0.5
            )
            return mix(
                colour_of_value(first, chain), colour_of_value(second, chain), share
            )
        raise SystemExit(f"{text!r} is not a theme colour this script can read")

    def colour_of_role(name: str, chain: tuple[str, ...]) -> str:
        if name in chain:
            raise SystemExit(
                f"the roles refer to each other: {' -> '.join((*chain, name))}"
            )
        if name not in recipes:
            raise SystemExit(f"the theme sets no --palette-{name}")
        if name not in palette:
            palette[name] = colour_of_value(recipes[name], (*chain, name))
        return palette[name]

    for name in recipes:
        colour_of_role(name, ())
    return {name: palette[name] for name in recipes}

"""One-off migration (2026-10-14): write themes/palettes/<name>/ for each
house theme built on Ledger, from its styles/<name>.css and Ledger's recipes.

Each palette gets every role: the theme's own, then each role of Ledger's
that the theme did not set (a recipe, made from the palette's own roles).
So a palette shows what its theme showed. Run from stem/, before the old
theme directories are deleted. Ledger's own palette is written by hand.
"""

import json
import pathlib
import re

THEMES = pathlib.Path("themes")
NAMES = {
    "campfire": "Campfire",
    "after-hours": "After-Hours Observatory",
    "beacon": "Beacon",
    "kraft-ink": "Kraft & Ink",
    "field-notes": "Field Notes",
    "electric-terracotta": "Electric Terracotta",
}
# Ledger's recipes, as its rule writes them (themes/ledger/styles/ledger.css).
LEDGER_RECIPES = {
    "muted-wash": "  /* {look} */\n  --palette-muted-wash: color-mix(\n    in srgb,\n    var(--palette-muted) 18%,\n    var(--palette-background)\n  );",
    "water": "  --palette-water: var(--palette-subject);",
    "ground": "  --palette-ground: var(--palette-muted);",
    "ground-wash": "  --palette-ground-wash: color-mix(\n    in srgb,\n    var(--palette-ground) 18%,\n    var(--palette-background)\n  );",
}
BOILERPLATE = re.compile(r"\n   The roles that it changes from ledger\.css.*?can show this palette\.\n", re.S)
NEW_BOILERPLATE = """
   Every role is set here, and only here. This rule is the palette of a talk
   that loads this addon (its index.html puts the class on <html>), and of
   any slide whose `class:` names it. stem/tools/lib.py reads it, and `uv run
   tools/palette.py` (in stem/) measures it against every gate. How to make a
   palette: stem/docs/theme.md.
"""

for name, display in NAMES.items():
    source = (THEMES / name / "styles" / f"{name}.css").read_text()
    comment, body = re.match(r"(?s)(/\*.*?\*/)\s*\.slidev-layout \{\n(.*?)\n\}", source).groups()
    comment = BOILERPLATE.sub(NEW_BOILERPLATE, comment).replace(
        "A dark house theme, built on Ledger.", "A dark house palette."
    ).replace("A light house theme, built on Ledger.", "A light house palette.")
    lines = body.rstrip()
    for role, text in LEDGER_RECIPES.items():
        if f"--palette-{role}:" not in body:
            look = "muted at 18% over the paper" if role == "muted-wash" else ""
            lines += "\n" + text.format(look=look)
    rule = (
        f"{comment}\n:where(.palette-{name}) .slidev-layout,\n.slidev-layout.palette-{name} {{\n"
        f'  --preview-name: "{display}"; /* for .palette-preview (house.css) */\n{lines}\n}}\n'
    )
    directory = THEMES / "palettes" / name
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "palette.css").write_text(rule)
    print(name, "roles:", len(re.findall(r"--palette-[\w-]+:", rule)))

"""The Top picks table of docs/theme.md, from the resolved palettes.

Run from stem/: uv run python tasks/2026-10-07-palette-preview/tools/top_picks.py
"""
import sys; sys.path.insert(0, "tools")
import lib
ROLES = ["background","panel","border","ink","muted","accent","second","subject","subject-wash","muted-wash","second-wash","water","ground","ground-wash"]
classes = {c.name: c.palette(lib.THEME_RECIPES) for c in lib.css_palette_classes()}
COLUMNS = [
  ("Ledger", lib.LEDGER, ["a warm off-white","a light cream","a light beige","a near-black brown","a warm grey-brown","a mid blue","a burnt orange","a dark navy blue","a very pale blue-grey","a pale warm grey","a pale apricot","a dark navy blue (the subject)","a warm grey-brown (muted)","a pale warm grey (the muted wash)"]),
  ("Campfire", classes["palette-campfire"], ["a near-black espresso brown","a dark brown","a mid-dark brown","a warm off-white","a warm grey-beige","an amber","a sky cyan","a pale amber","a dark warm grey","a dark brown-grey","a dark slate teal","a sky cyan (the second)","a warm grey-beige (muted)","a dark brown-grey (the muted wash)"]),
  ("Marmalade", classes["palette-marmalade"], ["a near-black brown","a dark brown","a mid-dark grey-brown","a warm white","a warm grey","an orange","a mint green","a pale peach","a dark warm grey","a dark grey-brown","a dark olive grey","a sky blue (its own)","a warm grey (muted)","a dark grey-brown (the muted wash)"]),
  ("After-Hours Observatory", classes["palette-after-hours"], ["a near-black navy","a dark slate blue","a dark grey","a warm off-white","a neutral grey","an amber","a sky blue","a pale amber","a dark warm grey","a dark blue-grey","a dark slate blue","a sky blue (the second)","a neutral grey (muted)","a dark blue-grey (the muted wash)"]),
]
def cell(colour, words):
    h = str(colour).upper()
    return f'<span style="display:inline-block;width:1.5em;height:1.5em;background:{h};border:1px solid #888;vertical-align:middle">&nbsp;</span> `{h}`, {words}'
print("| Role | " + " | ".join(n for n, _, _ in COLUMNS) + " |")
print("| --- " * (len(COLUMNS) + 1) + "|")
for i, role in enumerate(ROLES):
    print(f"| {role} | " + " | ".join(cell(p[role], w[i]) for _, p, w in COLUMNS) + " |")

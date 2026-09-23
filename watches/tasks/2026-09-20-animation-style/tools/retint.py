#!/usr/bin/env python3
"""Recolour the two dark-field sets (Guide, Vector display) into a candidate theme.

    .venv/bin/python3 tasks/2026-09-20-animation-style/tools/retint.py beacon afterhours campfire blueprint

Writes deck/public/timekeepers/guide-<theme>/ and vector-<theme>/.

The point is NOT to tint the black rectangle a different colour. It is to delete the
rectangle: the drawing's field becomes the card's own panel, so the art sits on the
card like every other set instead of punching a hole in it (README S6 T1).

Every output colour is one of the theme's own six role colours, or a mix of two of
them. Nothing is invented, so the theme's measured contrast and colour-blind
separation carry over unchanged.

Role assignment, chosen so the two sets stay distinguishable on any theme:
  Guide  is WARM-led  (structure = the warmer of accent/second)
  Vector is COOL-led  (structure = the cooler of the two)
so water is always cool and flame always warm, whichever way round a given theme
happens to define accent and second.
"""
import sys, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[3]
# The art these tools read. Until 2026-09-21 this was the project root's
# public/timekeepers/, which held all sixteen sets because the live deck showed all
# sixteen. The live deck now ships one set, so the sets live in this archive's own
# deck/ and the tools read them from there -- which is also what makes the archive
# runnable after the live deck has moved on. See README S14.
ART = pathlib.Path(__file__).resolve().parents[1] / "deck/public/timekeepers"

sys.path.insert(0, str(ROOT / "tasks/2026-09-18-theme-colors/tools"))
import lib

SUBJECTS = ["sundial", "water-clock", "candle", "hourglass"]
# theme key (as load_themes reports name) -> output folder suffix
WANT = {"ledger": "Ledger", "beacon": "Beacon", "afterhours": "After-Hours Observatory",
        "nightledger": "Night Ledger", "campfire": "Campfire",
        "marmalade": "Marmalade", "coffeecode": "Coffee + Code",
        "blueprint": "Blueprint", "harbor": "Harbor", "conservatory": "Conservatory"}


def warmth(h):
    h = h.lstrip("#")
    return int(h[0:2], 16) - int(h[4:6], 16)      # red minus blue


def is_light(t):
    return lib.luminance(t["panel"]) > 0.5


def palette(t):
    a, w = t["accent"], t["warn"]
    warm, cool = (a, w) if warmth(a) > warmth(w) else (w, a)
    return dict(panel=t["panel"], ink=t["ink"], muted=t["muted"], warm=warm, cool=cool,
                hot=lib.mix(t["ink"], warm, 0.35), light=is_light(t),
                # "the current reading" on a light field. Plain ink puts it 2.36x above
                # the structure line; on a dark field the same role sits 1.53x above.
                # Softening it toward the panel restores that ratio (8.45:1 vs 5.56:1)
                # so one mark does not dominate an otherwise light drawing.
                read=lib.mix(t["ink"], t["panel"], 0.15))


def guide_map(p, subject):
    if p["light"]:
        # Prominence INVERTS on paper: on black the brightest mark dominates, on
        # cream the darkest does. So this is not the dark map with hues swapped --
        # the roles are re-ranked. The clearest case is the hot core, the most
        # prominent thing on black, which becomes UNMARKED PAPER here: that is how
        # engraving and linocut have always rendered a highlight, and the deck's
        # own light sets already do it.
        return {
            "#000000": p["panel"],   # field, and the interiors that keep forms opaque
            "#54E88A": p["ink"],     # structure — the heaviest mark, so the darkest
            "#3FE04A": p["ink"],     # emphasis
            "#4D9FE8": p["cool"],    # liquid body, hatched blue
            "#8FC9F5": p["read"],    # liquid surface: darker than the body, not lighter
            # substance and scale. On the sundial this value is the SHADOW, which on
            # paper is a mid grey — the same treatment Pop Art and Riso already use.
            "#F5D44D": p["muted"] if subject == "sundial" else p["warm"],
            "#E8452A": p["warm"],    # flame rim
            "#FFF8E0": p["panel"],   # hot core, sand crest: the absence of ink
        }
    return {
        "#000000": p["panel"],   # field, and the opaque interiors that make it read solid
        "#54E88A": p["warm"],    # structure: vessels, frames, gnomon, dial, shaft
        "#3FE04A": p["warm"],    # emphasis marks
        "#4D9FE8": p["cool"],    # liquid body
        "#8FC9F5": p["ink"],     # liquid surface
        # The scale/substance. On the sundial this same value is the SHADOW, so it
        # gets the cool colour there: muted (the obvious "shadow" choice) measures
        # 4.8:1 on Beacon against the dial mesh's 8.7:1 and all but vanished at
        # 122 px. Cool restores it to 7.2:1 and mirrors Vector, whose shadow is warm
        # against a cool structure -- so each set's shadow is the opposite of its
        # own line colour, and both stay legible.
        "#F5D44D": p["cool"] if subject == "sundial" else p["ink"],
        "#E8452A": p["warm"],    # flame rim
        "#FFF8E0": p["hot"],     # hot core, sand crest
    }


def vector_map(p, subject):
    if p["light"]:
        return {
            "#070A0E": p["panel"],
            # blue line work on cream is the classic plotter-on-paper look, and it
            # keeps Vector distinct from Guide, which goes to ink here
            "#A8C4D8": p["cool"],
            # construction stays `muted`. Mixing it toward the panel for a wider
            # hierarchy costs visibility: mix(muted,panel,0.22) is 3.06:1 on a
            # 2.2-unit line. The gap vs structure is only 1.21x against 1.88x on the
            # dark themes -- that compression is archive insight 4, not a choice.
            "#6E8FA6": p["muted"],
            "#E2EDF5": p["read"],    # the current reading — most prominent
            "#C8412F": p["warm"],    # whatever moves
        }
    return {
        "#070A0E": p["panel"],   # field
        "#A8C4D8": p["cool"],    # structure
        "#6E8FA6": p["muted"],   # construction lines
        "#E2EDF5": p["ink"],     # the current reading
        "#C8412F": p["warm"],    # whatever moves
    }


def retint(src_dir, out_dir, mapper, p):
    out = ART / out_dir
    out.mkdir(parents=True, exist_ok=True)
    for s in SUBJECTS:
        raw = (ART / src_dir / f"{s}.svg").read_text()
        m = mapper(p, s)
        # On a dark theme the full-bleed field rect IS the look: the card becomes a
        # lit screen. On a light theme it is just a faint panel-coloured box that
        # shows wherever the art sits on anything but the card panel. Every other
        # light set is transparent, so drop it and let the art composite.
        if p["light"]:
            for field in ('<rect width="240" height="190" fill="#000000"/>\n',
                          '<rect width="240" height="190" fill="#070A0E"/>\n'):
                raw = raw.replace(field, "")

        # Guide's sundial shadow is fill="#000000", the same token as the field, so a
        # plain substitution would turn it into bare panel. On a dark theme that is
        # right (the shadow is a hole in the lit mesh); on paper it must be a solid
        # mid grey instead, so lift it out first.
        # Same problem, other direction: Guide uses the structure token as a SOLID
        # FILL for the molten wax (topper and drips). A bright fill reads as lit wax
        # on black; the same token as ink on cream reads as a burnt black cap. Wax
        # is warm on paper.
        if p["light"] and src_dir == "guide" and s == "candle":
            for frag in ('rx="4.4" ry="6" fill="#54E88A"',
                         'L96 69 Z" fill="#54E88A"'):
                assert frag in raw, f"candle wax fragment missing: {frag}"
                raw = raw.replace(frag, frag.replace('#54E88A', "@WAX@"))
            m = dict(m); m["@WAX@"] = p["warm"]
        if p["light"] and s == "sundial" and src_dir == "guide":
            shadow = 'L174 138 L199.8 151.5 Z" fill="#000000"'
            assert shadow in raw, "guide sundial shadow not found"
            raw = raw.replace(shadow, 'L174 138 L199.8 151.5 Z" fill="@SHADOW@"')
            m = dict(m); m["@SHADOW@"] = p["muted"]
        # longest-first is irrelevant here (all keys are 7 chars) but case is not
        for old, new in m.items():
            raw = re.sub(re.escape(old), new, raw, flags=re.I)
        left = set(re.findall(r"#[0-9A-Fa-f]{6}", raw)) - set(v.upper() for v in m.values()) \
                                                        - set(v.lower() for v in m.values())
        assert not left, f"{out_dir}/{s}.svg has unmapped colours {left}"
        (out / f"{s}.svg").write_text(raw)


def main():
    # default = the six on the probe slides, in background order (cool -> warm)
    keys = sys.argv[1:] or ["beacon", "afterhours", "campfire", "marmalade"]
    themes = {t["name"]: t for t in lib.load_themes()}
    for k in keys:
        t = themes[WANT[k]]
        p = palette(t)
        retint("guide", f"guide-{k}", guide_map, p)
        retint("vector", f"vector-{k}", vector_map, p)
        print(f'{t["name"]:24} panel {p["panel"]}  warm {p["warm"]}  cool {p["cool"]}  '
              f'ink {p["ink"]}  muted {p["muted"]}  hot {p["hot"]}')


if __name__ == "__main__":
    main()

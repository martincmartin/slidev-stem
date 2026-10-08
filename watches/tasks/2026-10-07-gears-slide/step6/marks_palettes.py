import sys, itertools
sys.path.insert(0, "/Users/martin/Develop/slidev/stem2/tools")
from lib import LEDGER, de76, cvd, lch, contrast, css_palette_classes, resolve, THEME_RECIPES
palettes = {"ledger": LEDGER}
for pc in css_palette_classes():
    palettes[pc.name] = resolve({**THEME_RECIPES, **pc.recipes})
cands = ["subject", "second", "accent", "ink", "muted", "second-wash"]
for name, P in palettes.items():
    print(f"\n=== {name}: paper {P['background'].hex}, subject {P['subject'].hex}, subject-wash {P['subject-wash'].hex}")
    print("solid tooth   hex      L*   vs subject dE/CVD   vs subj-wash dE/CVD")
    for c in cands:
        col = P[c]
        print(f"  {c:11} {col.hex}  {lch(col)[0]:5.1f}   {de76(col,P['subject']):5.1f}/{cvd(col,P['subject']):5.1f}        {de76(col,P['subject-wash']):5.1f}/{cvd(col,P['subject-wash']):5.1f}")
    print("  pairs (dE / CVD):", ", ".join(
        f"{a}+{b} {de76(P[a],P[b]):.0f}/{cvd(P[a],P[b]):.0f}"
        for a, b in [("subject","second"),("accent","second"),("subject","accent"),("ink","second"),("second","second-wash")]))

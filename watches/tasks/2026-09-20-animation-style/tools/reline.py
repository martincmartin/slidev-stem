#!/usr/bin/env python3
"""Derive set 2, "Line, weighted", from set 1, "Line".

    .venv/bin/python3 tasks/2026-09-20-animation-style/tools/reline.py

Writes deck/public/timekeepers/line-weighted/. EDIT THIS FILE, not those SVGs.
The live deck ships this set: copy it to ../../public/timekeepers/ after regenerating.

WHY THIS SET EXISTS. Set 1 was the one a non-participant picked as the nicest
looking, on a laptop, with no knowledge of any of the measurements. §8 ranks it
12th of 14 and it fails the back row outright. Both are true, and the second does
not overrule the first: the laptop judgement is about whether anyone WANTS to look
at it, which no number here measures.

So set 1 stays exactly as chosen, and this is the same drawing with its three
measured deficits fixed and nothing else touched -- same geometry, same hue, same
sparseness, same idea. The deck carries both so the comparison can be made by eye.

THE THREE DEFICITS (§8.7), each independently enough to sink it:

 1. It draws its PRIMARY LINE WORK in the theme's ACCENT, 5.56:1 on the card.
    Bold and Linocut draw structure in ink at 13.10:1, so set 1 starts 2.36x down
    before anything degrades. The accent's gate in the theme archive is 4.5:1 and
    was written for a 37 px numeral; set 1 spends it on a 1.52 px line.
 2. Its secondary detail is an INVENTED GREY, #928E88, in no theme palette and
    below every gate in the archive: 2.81:1 on the card panel, and only 2.34:1
    where it matters most -- the sundial's tick marks sit on the dial FACE, not on
    the panel. That is below the 3:1 floor on a laptop, before any room is involved.
 3. Its modal stroke is 1.52 CSS px, under the 1.64 px an eye resolves at the
    hostile venue. The typical line is literally below the resolution limit.

THE FIX, and what was rejected. The obvious move -- promote the grey to ink -- was
measured and looks wrong: the grey carries the hourglass frame and the candle
plate, so inking it makes the SECONDARY structure the heaviest mark on the card and
inverts the hierarchy. Deepening the blue along its own hue keeps the drawing
blue-led, which is the thing being preserved. Measured at 55in @ 7 m, hold/p90/Fmax:

    set 1 as shipped                      2.27 / 4.17 / 0.000
    grey -> ink (hierarchy inverts)       2.82 / 7.87 / 0.030
    everything -> ink (stops being Line)  3.41 / 9.97 / 0.052
    THIS SET                              3.70 / 7.84 / 0.086

0.086 is level with Riso and Shaded: rank 12 to about rank 5, with the identity
intact. It does not reach Linocut (0.207) and was never going to -- a blue-led
sparse line drawing cannot reach the ink ceiling, which is finding 4 of §8.4.
"""
import re, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
# The art these tools read. Until 2026-09-21 this was the project root's
# public/timekeepers/, which held all sixteen sets because the live deck showed all
# sixteen. The live deck now ships one set, so the sets live in this archive's own
# deck/ and the tools read them from there -- which is also what makes the archive
# runnable after the live deck has moved on. See README S14.
ART = pathlib.Path(__file__).resolve().parents[1] / "deck/public/timekeepers"

SRC = ART / "t13"
OUT = ART / "line-weighted"
SUBJECTS = ["sundial", "water-clock", "candle", "hourglass"]

# old -> new, with the contrast each lands at on the card panel #F2EEE4
COLOURS = {
    "#1F5FA8": "#143C6B",   # accent blue -> deeper, same hue:  5.56 -> 9.60:1
    "#928E88": "#736A60",   # invented grey -> Ledger's muted:  2.81 -> 4.58:1
}                           # (and on the dial face:            2.34 -> 3.82:1)
KEEP = {"#2A2520",          # Ledger ink, already correct where it is used
        "#D3DCE3"}          # the dial face: a fill, not a mark. 1.20:1 is fine
STROKE_K = 2.0              # modal 3 units -> 6 = 3.05 CSS px, over the 1.64 floor


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for s in SUBJECTS:
        raw = (SRC / f"{s}.svg").read_text()
        before = set(re.findall(r"#[0-9A-Fa-f]{6}", raw))
        unknown = {c.upper() for c in before} - set(COLOURS) - KEEP
        assert not unknown, f"{s}.svg has colours this tool does not know: {unknown}"

        raw = re.sub(r'stroke-width="([0-9.]+)"',
                     lambda m: f'stroke-width="{float(m.group(1)) * STROKE_K:g}"', raw)
        for old, new in COLOURS.items():
            raw = re.sub(re.escape(old), new, raw, flags=re.I)

        left = {c.upper() for c in re.findall(r"#[0-9A-Fa-f]{6}", raw)}
        assert not (left & set(COLOURS)), f"{s}.svg still holds a source colour: {left}"
        (OUT / f"{s}.svg").write_text(raw)

    n = sum((OUT / f"{s}.svg").stat().st_size for s in SUBJECTS)
    o = sum((SRC / f"{s}.svg").stat().st_size for s in SUBJECTS)
    print(f"line-weighted: {n/1024:.1f} KB  (set 1 is {o/1024:.1f} KB)")
    for old, new in COLOURS.items():
        print(f"   {old} -> {new}")
    print(f"   stroke-width x{STROKE_K:g}")


if __name__ == "__main__":
    main()

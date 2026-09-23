#!/usr/bin/env python3
"""What each drawing set IS, as a recipe you could draw a different subject with.

    .venv/bin/python3 tasks/2026-09-20-animation-style/tools/spec.py            # all sets
    .venv/bin/python3 tasks/2026-09-20-animation-style/tools/spec.py riso bold  # some

Stdlib only. Reads `deck/public/timekeepers/*/` and prints, per set:

    field      the paper/background colour, i.e. the largest fill area
    ink        every colour the set uses, most-used first, with its share of the
               marks and its WCAG contrast against that set's own field
    weights    every stroke-width, in SVG units and in CSS px on the 122 px card,
               with how many times each is used -- this is the set's HIERARCHY,
               and §8.8 is the story of what happens when its bottom is below the
               venue's resolution floor
    texture    the <pattern>, <linearGradient>, <radialGradient> and <filter>
               primitives, with the parameters that actually characterise them
    motion     which attributes are animated, and over what durations

WHY THIS EXISTS. §5 describes each set in a sentence and §4 pins the shared
geometry, but neither tells you how to draw something that is NOT a sundial in a
given set's language. The sixteen sets are not filters you can apply to art; each
is a small grammar -- a field, two to seven inks with fixed jobs, a weight
hierarchy, one or two texture primitives, and a convention for what moves. That
grammar is four numbers and a habit, and it is entirely portable to a locomotive,
an interferometer, a lunar module or a block diagram. This prints the grammar so
nobody has to reverse-engineer it out of the SVGs again. See README §13.

The one thing it cannot print is the SEMANTICS -- that Guide draws the reading in
yellow because yellow is the readout colour on the Guide's own screens, so a
sundial's shadow is yellow. §11 records those by hand for the two sets that have
them, and a new subject has to decide its own.
"""
import re, sys, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parents[3]
# The art these tools read. Until 2026-09-21 this was the project root's
# public/timekeepers/, which held all sixteen sets because the live deck showed all
# sixteen. The live deck now ships one set, so the sets live in this archive's own
# deck/ and the tools read them from there -- which is also what makes the archive
# runnable after the live deck has moved on. See README S14.
ART = pathlib.Path(__file__).resolve().parents[1] / "deck/public/timekeepers"

SETS = ART
SUBJECTS = ["sundial", "water-clock", "candle", "hourglass"]
CARD_K = 122 / 240.0          # SVG units -> CSS px at the size the deck renders


def lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hexcol):
    r, g, b = (int(hexcol[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def field_of(srcs):
    """The set's background: the colour of the biggest axis-aligned filled area.

    Every set paints its field either as the card's own background (no rect at
    all -- the light sets sit on the Ledger panel) or as a full-bleed rect. So:
    prefer a rect covering most of the 240x190 box; fall back to the lightest or
    darkest colour depending on which way the set leans.
    """
    best, best_area = None, 0
    for src in srcs:
        for m in re.finditer(r'<rect[^>]*>', src):
            t = m.group(0)
            g = lambda k: float(re.search(rf'{k}="([-0-9.]+)"', t).group(1)) if re.search(rf'{k}="([-0-9.]+)"', t) else 0.0
            fill = re.search(r'fill="(#[0-9A-Fa-f]{6})"', t)
            area = g("width") * g("height")
            if fill and area > best_area and area > 0.6 * 240 * 190:
                best, best_area = fill.group(1).upper(), area
    return best


def spec(d: pathlib.Path):
    srcs = [(d / f"{s}.svg").read_text() for s in SUBJECTS if (d / f"{s}.svg").exists()]
    if not srcs:
        return None
    blob = "\n".join(srcs)

    colours = collections.Counter(c.upper() for c in re.findall(r"#[0-9A-Fa-f]{6}", blob))
    field = field_of(srcs)
    if field is None:
        # No painted field: the set sits on the deck's own card panel.
        field = "#F2EEE4"
        field_note = "(unpainted -- sits on the deck's card panel #F2EEE4)"
    else:
        field_note = ""

    widths = collections.Counter(round(float(w), 2) for w in re.findall(r'stroke-width="([0-9.]+)"', blob))
    motion = collections.Counter(re.findall(r'attributeName="([^"]+)"', blob))
    motion.update(f"transform/{t}" for t in re.findall(r'<animateTransform[^>]*type="([^"]+)"', blob))
    durs = sorted({float(x) for x in re.findall(r'dur="([0-9.]+)s"', blob)})

    prims = []
    for m in re.finditer(r'<pattern\b[^>]*id="([^"]+)"[^>]*width="([0-9.]+)"[^>]*height="([0-9.]+)"([^>]*)>(.*?)</pattern>',
                         blob, re.S):
        pid, w, h, rest, inner = m.groups()
        rot = re.search(r"rotate\(([-0-9.]+)\)", rest)
        kind = "hatch" if "<line" in inner else "dots" if "<circle" in inner else "pattern"
        detail = ""
        if kind == "hatch":
            lw = re.search(r'stroke-width="([0-9.]+)"', inner)
            if lw:
                cov = float(lw.group(1)) / float(w)
                detail = f"line {lw.group(1)}u on {w}u pitch = {100*cov:.0f}% coverage"
        elif kind == "dots":
            r = re.search(r'r="([0-9.]+)"', inner)
            n = len(re.findall(r"<circle", inner))
            if r:
                detail = f"{n} dots r={r.group(1)}u on a {w}x{h}u cell"
        prims.append((kind, f"{w}x{h}u" + (f" @{rot.group(1)}deg" if rot else "")
                      + (f"  {detail}" if detail else "")))
    for m in re.finditer(r'<(linear|radial)Gradient\b[^>]*id="([^"]+)"[^>]*>(.*?)</\1Gradient>', blob, re.S):
        kind, gid, inner = m.groups()
        stops = re.findall(r'stop-color="(#[0-9A-Fa-f]{6})"', inner)
        prims.append((kind + "-grad",
                      f"{len(stops)} stops  {' -> '.join(x.upper() for x in stops[:4])}"))
    for m in re.finditer(r'<filter\b[^>]*id="([^"]+)"[^>]*>(.*?)</filter>', blob, re.S):
        fid, inner = m.groups()
        fx = re.findall(r"<fe([A-Za-z]+)", inner)
        bf = re.search(r'baseFrequency="([^"]+)"', inner)
        prims.append(("filter", "+".join(fx) + (f"  baseFrequency={bf.group(1)}" if bf else "")))

    return dict(field=field, field_note=field_note, colours=colours, widths=widths,
                motion=motion, durs=durs, prims=prims,
                kb=sum((d / f"{s}.svg").stat().st_size for s in SUBJECTS if (d / f"{s}.svg").exists()) / 1024)


def show(name, sp):
    print(f"\n{'='*78}\n{name}   {sp['kb']:.1f} KB\n{'='*78}")
    print(f"field    {sp['field']} {sp['field_note']}")
    total = sum(sp["colours"].values())
    print("ink      colour    uses          vs field   role is yours to assign")
    for c, n in sp["colours"].most_common():
        if c == sp["field"]:
            continue
        print(f"         {c}  {n:>4} ({100*n/total:>4.1f}%)   {contrast(c, sp['field']):>5.2f}:1")
    print("weights  units   CSS px @122   uses      <- the hierarchy; floor is 1.64 px at 55in @ 7 m")
    for w, n in sorted(sp["widths"].items()):
        flag = "" if w * CARD_K >= 1.64 else "   under the floor"
        print(f"         {w:<7} {w*CARD_K:>6.2f}        x{n:<4}{flag}")
    if sp["prims"]:
        # Sets that tint several subjects with the same primitive (Riso defines 24
        # screens that are 3 densities x 2 inks x 4 drawings) would otherwise bury
        # the recipe in near-duplicates, so identical specs collapse to a count.
        print("texture")
        shapes = collections.Counter(sp["prims"])
        for (kind, detail), n in shapes.most_common():
            print(f"         {kind:<13} {detail}" + (f"   x{n} ids" if n > 1 else ""))
    print("motion   " + ", ".join(f"{k} x{v}" for k, v in sp["motion"].most_common()))
    print("         durations " + ", ".join(f"{d:g}s" for d in sp["durs"]))


def main():
    want = sys.argv[1:]
    dirs = sorted(p for p in SETS.iterdir() if p.is_dir() and (p / "sundial.svg").exists())
    for d in dirs:
        if want and d.name not in want:
            continue
        sp = spec(d)
        if sp:
            show(d.name, sp)


if __name__ == "__main__":
    main()

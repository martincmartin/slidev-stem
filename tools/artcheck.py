#!/usr/bin/env python3
"""Does this illustration belong to the series? Structure, grammar and legibility.

    .venv/bin/python3 tools/artcheck.py                          # every SVG in every talk's public/
    .venv/bin/python3 tools/artcheck.py path/to/new.svg          # one new drawing
    .venv/bin/python3 tools/artcheck.py watches/public/timekeepers/  # a directory of them

Stdlib only, so it is fast and can go in a pre-commit hook. Exits non-zero
on any FAIL. Thresholds come from `lib.py`; this file only applies them.

THREE KINDS OF CHECK, and they fail for three different reasons.

1. STRUCTURE -- is this valid, working SVG? These four are subject-independent and
   are the failures that actually happened while the sets were being drawn. All are
   invisible in a thumbnail and obvious in a diff, which is why they are asserted:
     * not well-formed XML     (a duplicated attribute made one file non-parsing;
                                note XML forbids "--" inside a comment, which is
                                easy to type as an em dash and breaks the file)
     * duplicate ids           (the second definition wins, so an animation silently
                                targets the wrong node)
     * dangling url(#...)      (the clip or pattern does nothing, silently)
     * malformed colour tokens (a corrupted stop-color renders as black, silently)

2. GRAMMAR -- is this the house style? The talks draw in set 2, "Line, weighted",
   and the whole of that style is a palette, a four-step stroke ladder and a file
   that states the size it is shown at. A drawing that invents a fifth weight or
   a sixth colour does not read as "another drawing by the same hand", which is
   the entire job the art does.

3. LEGIBILITY -- can the back row see it? Every stroke, at the size the file
   states, must clear the venue's resolution floor. THIS IS THE ONE THAT KEEPS BEING GOT WRONG: a whole drawing
   set spent an entire exercise ranked last because nothing in it reached the
   floor, and the fix was one number. Run this on day one of a new drawing, not
   the last day.

OPACITY IS PART OF LEGIBILITY, so it is checked too. A 3 px line at
`stroke-opacity="0.3"` is wide enough to resolve and too faint to see: the deep
blue needs 0.55 on the panel to hold 3:1, the muted brown 0.77. Anything fainter
is a WASH -- fine to draw, because it is doing a job for the front three rows,
but the drawing has to still read when it is gone. Those come out as notes with
the number rather than failures, because faintness can be the intent and
thinness never is.

WHAT THIS STILL CANNOT SEE: overlap, texture that dissolves at distance, and
anything about how the marks compose. `tools/barroom.py` renders and measures,
and is the authority when the two disagree.
"""
import re, sys, pathlib, xml.etree.ElementTree as ET

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import lib

HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
INHERIT = ("fill", "stroke", "fill-opacity", "stroke-opacity", "opacity")


def marks(el, inherited=None):
    """Every (kind, colour, effective alpha) this tree paints.

    SVG presentation attributes inherit, so a <g stroke-opacity="0.5"> makes
    every line under it half strength. This walks the tree carrying them down,
    which is the only way to see what a mark is actually drawn at.
    """
    st = dict(inherited or {})
    st.update({k: v for k, v in el.attrib.items() if k in INHERIT})
    tag = el.tag.split("}")[-1]
    # An attribute that is ANIMATED is not the attribute the viewer sees. A contour
    # that starts at opacity="0" and animates to 1 is fully opaque for most of the
    # cycle; reading the static value called it a wash. Drop any attribute an
    # <animate> child targets, and let tools/motion.py judge what moves.
    animated = {k.attrib.get("attributeName") for k in el
                if k.tag.split("}")[-1] in ("animate", "set")}
    for k in animated & set(INHERIT):
        st.pop(k, None)
        el.attrib.pop(k, None)
    if tag not in ("defs", "clipPath", "mask", "pattern", "marker"):
        group = float(st.get("opacity", 1))
        for kind in ("fill", "stroke"):
            c = st.get(kind)
            if c and c != "none" and HEX.match(c) and tag not in ("g", "svg", "title"):
                yield kind, c.upper(), float(st.get(f"{kind}-opacity", 1)) * group
        for kid in el:
            yield from marks(kid, st)


def check_file(f: pathlib.Path):
    """-> (fails, notes) for one SVG."""
    fails, notes = [], []
    raw = f.read_text()

    # ---- 1. structure ----------------------------------------------------
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        return [f"not well-formed XML: {e}"
                + ("  (XML forbids '--' inside a comment -- an em dash typed as "
                   "two hyphens does this)" if "--" in raw else "")], notes

    ids = [e.attrib["id"] for e in root.iter() if "id" in e.attrib]
    for i in sorted({i for i in ids if ids.count(i) > 1}):
        fails.append(f"duplicate id {i!r}: the second definition wins")
    for i in sorted(set(re.findall(r"url\(#([^)]+)\)", raw)) - set(ids)):
        fails.append(f"dangling ref url(#{i}): that clip/pattern does nothing")
    for el in root.iter():
        for attr in ("fill", "stroke", "stop-color"):
            v = el.attrib.get(attr)
            if v and v != "none" and not v.startswith("url(") and not HEX.match(v):
                fails.append(f"bad {attr}={v!r}: use a 6-digit hex from the palette")

    # ---- 2. grammar ------------------------------------------------------
    # The file states the size a slide shows it at, so its strokes can be read in
    # CSS px. Without that, no stroke check below means anything.
    w, h, scale = lib.shown_size(raw)
    vb = root.attrib.get("viewBox", "").split()
    if not (w and h and scale and len(vb) == 4):
        return fails + [f'needs width and height (the CSS px a slide shows it at) and a '
                        f'viewBox; has width={root.attrib.get("width")!r} '
                        f'height={root.attrib.get("height")!r} viewBox={root.attrib.get("viewBox")!r}'
                        ], notes
    if abs((w / h) / (float(vb[2]) / float(vb[3])) - 1) > lib.ASPECT_TOLERANCE:
        fails.append(f"width:height {w:g}:{h:g} is not the viewBox's {vb[2]}:{vb[3]}, "
                     f"so the drawing is letterboxed or squashed")

    for c in sorted(lib.colours_in(raw) - set(lib.ART_INK) - {lib.ART_FIELD.upper()}):
        fails.append(f"colour {c} is not in the drawing palette "
                     f"({', '.join(sorted(lib.ART_INK))}) -- see docs/illustrations.md")

    for sw in sorted(set(lib.strokes_in(raw))):
        px = sw * scale
        if not any(abs(px / step - 1) <= lib.LADDER_TOLERANCE for step in lib.STROKE_LADDER):
            fails.append(f"stroke-width {sw:g} units = {px:.2f} CSS px as shown, off the "
                         f"ladder {lib.STROKE_LADDER} CSS px (within {lib.LADDER_TOLERANCE:.0%})")

    # ---- 3. legibility ---------------------------------------------------
    for sw in sorted(set(lib.strokes_in(raw))):
        px = sw * scale
        if px < lib.STROKE_FLOOR_CSSPX:
            fails.append(f"stroke-width {sw:g} units = {px:.2f} CSS px as shown, under the "
                         f"{lib.STROKE_FLOOR_CSSPX} px floor at {lib.DESIGN_VENUE}")

    # ---- opacity: a wide line drawn too faint is still invisible ---------
    seen = set()
    for kind, colour, alpha in marks(root):
        if (kind, colour, round(alpha, 3)) in seen or colour not in lib.ART_INK:
            continue
        seen.add((kind, colour, round(alpha, 3)))
        need = lib.min_opacity(colour)
        if alpha >= 0.999 or need is None:
            continue
        eff = lib.contrast(lib.blend(colour, lib.ART_FIELD, alpha), lib.ART_FIELD)
        # A hair under the floor is rounding, not a wash: 0.55 of the deep blue
        # lands at 2.99:1. Only complain when it is actually faint.
        if eff < lib.CONTRAST_FLOOR * 0.99:
            notes.append(f"{kind} {colour} at {alpha:g} reads {eff:.2f}:1 on the panel, "
                         f"under {lib.CONTRAST_FLOOR:.0f}:1 (needs {need:.2f}). "
                         f"A wash: the drawing must read without it")

    # ---- notes: true but not disqualifying -------------------------------
    if "<text" in re.sub(r"<!--.*?-->", "", raw, flags=re.S):
        notes.append("contains <text>: at this size a glyph's stems land well under "
                     "the floor. See docs/legibility.md on why labels do not fit on a card")
    if "repeatCount" in raw and 'repeatCount="indefinite"' not in raw:
        notes.append("an animation does not repeat indefinitely; it will stop mid-talk")
    return fails, notes


def main(argv):
    files = lib.art_files(argv or None)
    if not files:
        print("no SVGs found")
        return 1
    bad = 0
    for f in files:
        rel = lib.rel(f)
        fails, notes = check_file(f)
        if fails:
            bad += 1
            print(f"FAIL  {rel}")
            for m in fails:
                print(f"        {m}")
        else:
            print(f"ok    {rel}")
        for m in notes:
            print(f"      note: {m}")
    print(f"\n{len(files)} file(s), {bad} failing.")
    if not bad:
        print(f"Grammar: strokes {lib.STROKE_LADDER} CSS px as shown, "
              f"floor {lib.STROKE_FLOOR_CSSPX} CSS px at {lib.DESIGN_VENUE}.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

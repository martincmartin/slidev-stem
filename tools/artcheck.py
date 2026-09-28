#!/usr/bin/env python3
"""Does this illustration belong to the series? Structure, grammar and legibility.

    .venv/bin/python3 tools/artcheck.py watches/public/          # every SVG in a talk
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

import pathlib
import re
import sys
from collections.abc import Iterator
from xml.etree import ElementTree

import lib

HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
INHERIT = ("fill", "stroke", "fill-opacity", "stroke-opacity", "opacity")


def marks(
    element: ElementTree.Element, inherited: dict[str, str] | None = None
) -> Iterator[tuple[str, lib.Colour, float]]:
    """Every (kind, colour, effective alpha) this tree paints.

    SVG presentation attributes inherit, so a <g stroke-opacity="0.5"> makes
    every line under it half strength. This walks the tree carrying them down,
    which is the only way to see what a mark is actually drawn at.
    """
    style = dict(inherited or {})
    style.update(
        {key: value for key, value in element.attrib.items() if key in INHERIT}
    )
    tag = element.tag.split("}")[-1]
    # An attribute that is ANIMATED is not the attribute the viewer sees. A contour
    # that starts at opacity="0" and animates to 1 is fully opaque for most of the
    # cycle; reading the static value called it a wash. Drop any attribute an
    # <animate> child targets, and let tools/motion.py judge what moves.
    animated = {
        child.attrib.get("attributeName", "")
        for child in element
        if child.tag.split("}")[-1] in ("animate", "set")
    }
    for key in animated & set(INHERIT):
        style.pop(key, None)
        element.attrib.pop(key, None)
    if tag not in ("defs", "clipPath", "mask", "pattern", "marker"):
        group = float(style.get("opacity", 1))
        for kind in ("fill", "stroke"):
            colour = style.get(kind)
            if (
                colour
                and colour != "none"
                and HEX.match(colour)
                and tag not in ("g", "svg", "title")
            ):
                yield (
                    kind,
                    lib.Colour.from_hex(colour),
                    float(style.get(f"{kind}-opacity", 1)) * group,
                )
        for child in element:
            yield from marks(child, style)


def check_file(file: pathlib.Path) -> tuple[list[str], list[str]]:
    """-> (fails, notes) for one SVG."""
    fails: list[str] = []
    notes: list[str] = []
    raw = file.read_text()

    # ---- 1. structure ----------------------------------------------------
    try:
        root = ElementTree.fromstring(raw)
    except ElementTree.ParseError as error:
        return [
            f"not well-formed XML: {error}"
            + (
                "  (XML forbids '--' inside a comment -- an em dash typed as "
                "two hyphens does this)"
                if "--" in raw
                else ""
            )
        ], notes

    ids = [element.attrib["id"] for element in root.iter() if "id" in element.attrib]
    for duplicate in sorted({name for name in ids if ids.count(name) > 1}):
        fails.append(f"duplicate id {duplicate!r}: the second definition wins")
    for missing in sorted(set(re.findall(r"url\(#([^)]+)\)", raw)) - set(ids)):
        fails.append(f"dangling ref url(#{missing}): that clip/pattern does nothing")
    for element in root.iter():
        for attribute in ("fill", "stroke", "stop-color"):
            value = element.attrib.get(attribute)
            if (
                value
                and value != "none"
                and not value.startswith("url(")
                and not HEX.match(value)
            ):
                fails.append(
                    f"bad {attribute}={value!r}: use a 6-digit hex from the palette"
                )

    # ---- 2. grammar ------------------------------------------------------
    # The file states the size a slide shows it at, so its strokes can be read in
    # CSS px. Without that, no stroke check below means anything.
    size = lib.shown_size(raw)
    view_box = root.attrib.get("viewBox", "").split()
    if size is None or len(view_box) != 4:
        missing_size = (
            f"needs width and height (the CSS px a slide shows it at) and a "
            f"viewBox; has width={root.attrib.get('width')!r} "
            f"height={root.attrib.get('height')!r} viewBox={root.attrib.get('viewBox')!r}"
        )
        return [*fails, missing_size], notes
    if (
        abs((size.width / size.height) / (float(view_box[2]) / float(view_box[3])) - 1)
        > lib.ASPECT_TOLERANCE
    ):
        fails.append(
            f"width:height {size.width:g}:{size.height:g} is not the viewBox's "
            f"{view_box[2]}:{view_box[3]}, so the drawing is letterboxed or squashed"
        )

    for colour in sorted(lib.colours_in(raw) - set(lib.ART_INK) - {lib.ART_FIELD}):
        fails.append(
            f"colour {colour} is not in the drawing palette "
            f"({', '.join(str(ink) for ink in sorted(lib.ART_INK))}) -- see docs/illustrations.md"
        )

    for stroke in sorted(set(lib.strokes_in(raw))):
        shown = stroke * size.css_px_per_unit
        if not any(
            abs(shown / step - 1) <= lib.LADDER_TOLERANCE for step in lib.STROKE_LADDER
        ):
            fails.append(
                f"stroke-width {stroke:g} units = {shown:.2f} CSS px as shown, off the "
                f"ladder {lib.STROKE_LADDER} CSS px (within {lib.LADDER_TOLERANCE:.0%})"
            )

    # ---- 3. legibility ---------------------------------------------------
    for stroke in sorted(set(lib.strokes_in(raw))):
        shown = stroke * size.css_px_per_unit
        if shown < lib.STROKE_FLOOR_CSSPX:
            fails.append(
                f"stroke-width {stroke:g} units = {shown:.2f} CSS px as shown, under the "
                f"{lib.STROKE_FLOOR_CSSPX:.2f} px floor at {lib.DESIGN_VENUE.label}"
            )

    # ---- opacity: a wide line drawn too faint is still invisible ---------
    seen = set()
    for kind, colour, alpha in marks(root):
        if (kind, colour, round(alpha, 3)) in seen or colour not in lib.ART_INK:
            continue
        seen.add((kind, colour, round(alpha, 3)))
        need = lib.min_opacity(colour)
        if alpha >= 0.999 or need is None:
            continue
        effective = lib.contrast(colour.blend(lib.ART_FIELD, alpha), lib.ART_FIELD)
        # A hair under the floor is rounding, not a wash: 0.55 of the deep blue
        # lands at 2.99:1. Only complain when it is actually faint.
        if effective < lib.CONTRAST_FLOOR * 0.99:
            notes.append(
                f"{kind} {colour} at {alpha:g} reads {effective:.2f}:1 on the panel, "
                f"under {lib.CONTRAST_FLOOR:.0f}:1 (needs {need:.2f}). "
                f"A wash: the drawing must read without it"
            )

    # ---- notes: true but not disqualifying -------------------------------
    if "<text" in re.sub(r"<!--.*?-->", "", raw, flags=re.DOTALL):
        notes.append(
            "contains <text>: at this size a glyph's stems land well under "
            "the floor. See docs/legibility.md on why labels do not fit on a card"
        )
    if "repeatCount" in raw and 'repeatCount="indefinite"' not in raw:
        notes.append("an animation does not repeat indefinitely; it will stop mid-talk")
    return fails, notes


def main(arguments: list[str]) -> int:
    if not arguments:
        print("usage: artcheck.py SVG_OR_DIRECTORY...")
        return 2
    files = lib.art_files(arguments)
    if not files:
        print("no SVGs found")
        return 1
    failing = 0
    for file in files:
        shown_path = lib.display_path(file)
        fails, notes = check_file(file)
        if fails:
            failing += 1
            print(f"FAIL  {shown_path}")
            for message in fails:
                print(f"        {message}")
        else:
            print(f"ok    {shown_path}")
        for message in notes:
            print(f"      note: {message}")
    print(f"\n{len(files)} file(s), {failing} failing.")
    if not failing:
        print(
            f"Grammar: strokes {lib.STROKE_LADDER} CSS px as shown, "
            f"floor {lib.STROKE_FLOOR_CSSPX:.2f} CSS px at {lib.DESIGN_VENUE.label}."
        )
    return 1 if failing else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

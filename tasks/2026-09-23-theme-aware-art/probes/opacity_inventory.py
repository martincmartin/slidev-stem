#!/usr/bin/env python3
"""Every static opacity in the four timekeeper drawings (the copy made on
2026-09-24, in timekeepers-2026-09-24/): the mark, its colour, its alpha, and
its contrast on the Ledger panel. Opacity attributes inherit through <g>, so
this follows them down the tree. An animated `opacity` (a fade) is motion, not
palette, and is listed only as a note."""
import pathlib, xml.etree.ElementTree as ET
from colour import on_panel, alpha_for

NS = "{http://www.w3.org/2000/svg}"
INHERIT = ("fill", "stroke", "fill-opacity", "stroke-opacity", "opacity")
SHAPES = ("rect", "path", "ellipse", "line", "circle", "polygon")


def walk(el, inherited, name, out):
    st = dict(inherited)
    st.update({k: el.attrib[k] for k in INHERIT if k in el.attrib})
    tag = el.tag.replace(NS, "")
    fades = any(k.tag.replace(NS, "") == "animate" and k.attrib.get("attributeName") == "opacity" for k in el)
    if tag in SHAPES:
        for paint in ("fill", "stroke"):
            colour = st.get(paint)
            alpha = float(st.get(f"{paint}-opacity", 1))
            if colour and colour != "none" and alpha < 1:
                out.append((name, tag, paint, colour.upper(), alpha, fades))
    for child in el:
        walk(child, st, name, out)


rows = []
for f in sorted((pathlib.Path(__file__).parent / "timekeepers-2026-09-24").glob("*.svg")):
    walk(ET.parse(f).getroot(), {"fill": "#000000"}, f.stem, rows)
print(f"{'drawing':12} {'mark':8} {'paint':6} {'colour':8} {'alpha':>5} {'on panel':>9} {'3:1 needs':>9}")
for name, tag, paint, colour, alpha, fades in rows:
    print(f"{name:12} {tag:8} {paint:6} {colour:8} {alpha:5.2f} {on_panel(colour, alpha):7.2f}:1 "
          f"{alpha_for(colour, 3.0):9.2f}{'   (also fades in and out)' if fades else ''}")
values = sorted({r[4] for r in rows})
print(f"\n{len(rows)} translucent paints; {len(values)} distinct alpha values: {values}")

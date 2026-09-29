#!/usr/bin/env python3
"""Which solids of the cover model intersect?

    uv run --project ../../.. python intersections.py      # in tools/: about 1 minute

Two solids intersect if they share heights and their outlines overlap in
plan. It tests every pair of z extrusions (the crown is along x, and is
tested against the case only by construction) at the still pose and at the
moving poses of webgl_probe.py, on a grid of PLAN_PIXEL. The method is the
2D plan's (its meshing.py). Writes ../evidence/intersections.json.

An intersection is not an error for the WebGL renderer (the depth buffer
resolves it), but it is where the slab-order reference is not exact, and
where the model is not physical.
"""

import itertools
import json
import pathlib

import numpy as np
from cover_model import CoverModel, cover_model
from depth_order import STATIC_TIME, Solid, fill_even_odd

TOOLS = pathlib.Path(__file__).resolve().parent
EVIDENCE = TOOLS.parent / "evidence"
PLAN_PIXEL = 0.1  # slide px per sample
TIMES = (STATIC_TIME, 0.1, 0.25, 0.6, 1.3)


def plan_overlap(first: Solid, second: Solid, time: float) -> float:
    """Slide px² where the two outlines' regions overlap, seen from above."""
    rings = [
        [line.points for line in solid.outline_at(time) if line.closed]
        for solid in (first, second)
    ]
    if not rings[0] or not rings[1]:
        return 0.0
    low = np.maximum(*(np.concatenate(ring).min(axis=0) for ring in rings))
    high = np.minimum(*(np.concatenate(ring).max(axis=0) for ring in rings))
    if (high <= low).any():
        return 0.0
    columns = np.arange(low[0], high[0], PLAN_PIXEL) + PLAN_PIXEL / 2
    rows = np.arange(low[1], high[1], PLAN_PIXEL) + PLAN_PIXEL / 2
    inside = fill_even_odd(rings[0], columns, rows) & fill_even_odd(
        rings[1], columns, rows
    )
    return float(inside.sum()) * PLAN_PIXEL * PLAN_PIXEL


def intersections(model: CoverModel) -> list[dict[str, object]]:
    extruded = [solid for solid in model.solids if solid not in model.cylinders]
    rows = []
    for first, second in itertools.combinations(extruded, 2):
        shared = min(first.top, second.top) - max(first.bottom, second.bottom)
        if shared <= 0 or first.ribbon or second.ribbon:
            continue
        areas = [plan_overlap(first, second, time) for time in TIMES]
        if max(areas) > 0:
            rows.append(
                {
                    "solids": [first.name, second.name],
                    "shared height": shared,
                    "worst plan overlap, px²": round(max(areas), 2),
                    "at time": TIMES[int(np.argmax(areas))],
                }
            )
    return rows


def main() -> None:
    rows = intersections(cover_model())
    for row in rows:
        print(row)
    EVIDENCE.mkdir(exist_ok=True)
    path = EVIDENCE / "intersections.json"
    path.write_text(json.dumps({"times": TIMES, "pairs": rows}, indent=1) + "\n")
    print(f"wrote {path}: {len(rows)} pairs")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""The train at meshing heights: each wheel's teeth at the height of the
pinion it drives. How many slabs and pieces, do teeth and leaves overlap in
plan, and is the slab order still exact?

    ../../../../.venv/bin/python3 meshing.py      # in tools/: about 3 minutes
    ../../../../.venv/bin/python3 svg_to_png.py ../evidence/depth/meshing-*.svg

depth_order.py stacks each wheel on everything it touches, so each wheel
sits on top of the pinion it should drive. Here depth_order.Meshing sets
the train's heights instead: each wheel sits on the wheel it drives, its
pinion is at the height of its driver's teeth, its hub is flush with the
wheel, and its arbor's end rises `cap` above the pinion. The other parts
keep depth_order.py's stacking rules.

Variants: the pinion flush with its driver's teeth (the fewest heights);
the pinion 1 px taller than the teeth, as a real pinion is longer than the
wheel is thick; flush with no arbor ends; and flush with arbor ends 3 px
high, one wheel's thickness, so that their tops land on heights that other
solids already have. Writes
../evidence/meshing.json and pictures in ../evidence/depth/.
"""

import dataclasses
import itertools
import json
from collections.abc import Sequence

import numpy as np
from depth_order import (
    EVIDENCE,
    MESHING,
    PICTURES,
    STATIC_TIME,
    TILTS,
    TRAIN,
    Camera,
    Meshing,
    OrderStats,
    Part,
    Pose,
    Solid,
    build_solids,
    compare,
    error_picture,
    fill_even_odd,
    svg_picture,
)
from watch_svg import Element, read_shapes

PLAN_PIXEL = 0.1  # slide px per pixel when measuring overlaps in plan
BEATS = 120  # the mesh overlaps are sampled over this many beats (1 s each)
FLUSH = "meshing, pinion flush with its driver's teeth"
VARIANTS: list[tuple[str, Meshing | None]] = [
    ("staircase (depth_order.py)", None),
    (FLUSH, MESHING),
    (
        "meshing, pinion 1 px taller than its driver's teeth",
        dataclasses.replace(MESHING, pinion_overhang=1.0),
    ),
    ("meshing, pinion flush, no arbor ends", dataclasses.replace(MESHING, cap=0.0)),
    (
        "meshing, pinion flush, arbor ends one wheel thick",
        dataclasses.replace(MESHING, cap=3.0),
    ),
]


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


def intersecting(solids: Sequence[Solid]) -> list[dict[str, object]]:
    """Pairs of solids that share heights and overlap in plan at the still
    pose: their volumes intersect, or one lies inside the other."""
    rows = []
    for first, second in itertools.combinations(solids, 2):
        shared = min(first.top, second.top) - max(first.bottom, second.bottom)
        if shared <= 0 or first.ribbon or second.ribbon:
            continue
        area = plan_overlap(first, second, STATIC_TIME)
        if area > 0:
            rows.append(
                {
                    "solids": [first.name, second.name],
                    "shared height": shared,
                    "plan overlap, px²": round(area, 2),
                    "smaller outline's area, px²": round(
                        min(
                            plan_overlap(first, first, STATIC_TIME),
                            plan_overlap(second, second, STATIC_TIME),
                        ),
                        2,
                    ),
                }
            )
    return rows


def teeth_and_pinion(solids: Sequence[Solid], part: Part) -> tuple[Solid, Solid]:
    """The teeth of the wheel that drives `part`, and `part`'s pinion: the
    first path after its wheel, in the generator's order."""
    assert part.driver is not None
    teeth = next(solid for solid in solids if solid.part is part.driver)
    own = [solid for solid in solids if solid.part is part]
    pinion = next(
        solid
        for solid in own[1:]
        if solid.shape is not None and solid.shape.element is Element.PATH
    )
    return teeth, pinion


def mesh_overlaps(solids: Sequence[Solid]) -> list[dict[str, object]]:
    """For each wheel and the pinion it drives: the plan overlap of teeth and
    leaves, at the still pose and at its worst over BEATS beats, sampled
    between steps and in the middle of each step."""
    samples = [beat + offset for beat in range(BEATS) for offset in (0.25, 0.5)]
    rows = []
    for part in TRAIN:
        if part.driver is None:
            continue
        teeth, pinion = teeth_and_pinion(solids, part)
        areas = [plan_overlap(teeth, pinion, time) for time in samples]
        worst = int(np.argmax(areas))
        rows.append(
            {
                "wheel": teeth.name,
                "pinion": pinion.name,
                "wheel heights": [teeth.bottom, teeth.top],
                "pinion heights": [pinion.bottom, pinion.top],
                "plan overlap at the still pose, px²": round(
                    plan_overlap(teeth, pinion, STATIC_TIME), 2
                ),
                "worst plan overlap, px²": round(areas[worst], 2),
                "at time, s": samples[worst],
                "samples": len(samples),
            }
        )
        print("   ", rows[-1], flush=True)
    return rows


def summary(solids: Sequence[Solid]) -> dict[str, object]:
    pose = Pose(list(solids), STATIC_TIME)
    heights = {solid.bottom for solid in solids} | {solid.top for solid in solids}
    stats = OrderStats()
    pieces = pose.slab(stats)
    by_tilt = compare(pose, TILTS)
    rows = by_tilt["by tilt"]
    assert isinstance(rows, list)
    worst = max(rows, key=lambda row: row["slab"])
    return {
        "solids": len(solids),
        "heights": len(heights),
        "slabs": len(heights) - 1,
        "runs": by_tilt["runs"],
        "slab pieces": len(pieces),
        "slab pairs compared": stats.pairs_compared,
        "slab crossings": stats.crossings,
        "slab cycles": stats.cycles,
        "worst slab wrong area, px²": worst["slab"],
        "at tilt": worst["tilt"],
        "worst centre-per-quad wrong area, px²": max(
            row["centre, per quad"] for row in rows
        ),
        "intersecting solids": intersecting(solids),
        "by tilt": rows,
    }


def main() -> None:
    shapes = read_shapes()
    result: dict[str, object] = {"plan pixel": PLAN_PIXEL}
    flush: list[Solid] = []
    for label, meshing in VARIANTS:
        print(label)
        solids = build_solids(shapes, meshing)
        row = summary(solids)
        row["heights of the train"] = [
            {"name": solid.name, "bottom": solid.bottom, "top": solid.top}
            for solid in solids
            if solid.part in TRAIN
        ]
        row["meshes"] = mesh_overlaps(solids)
        result[label] = row
        if label == FLUSH:
            flush = solids

    pose = Pose(flush, STATIC_TIME)
    order = pose.slab(OrderStats())
    train = [piece for piece in order if piece.solid.part in TRAIN]
    for tilt, zoom in ((89.0, 4.0), (30.0, 1.0)):
        svg_picture(
            order,
            Camera(tilt),
            PICTURES / f"meshing-watch-tilt-{tilt:g}.svg",
            f"The watch with the train at meshing heights, tilted {tilt:g} degrees",
            zoom,
        )
    for tilt in (89.0, 60.0):
        svg_picture(
            train,
            Camera(tilt),
            PICTURES / f"meshing-train-tilt-{tilt:g}.svg",
            f"The train alone at meshing heights, tilted {tilt:g} degrees",
            6.0,
        )
    error_picture(
        order, pose.quads(), Camera(60.0), PICTURES / "meshing-errors-slab-tilt-60.png"
    )
    EVIDENCE.mkdir(exist_ok=True)
    (EVIDENCE / "meshing.json").write_text(json.dumps(result, indent=1) + "\n")
    print(f"wrote {EVIDENCE / 'meshing.json'}")


if __name__ == "__main__":
    main()

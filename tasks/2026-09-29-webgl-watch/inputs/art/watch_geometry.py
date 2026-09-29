"""Clearances in the skeleton watch's layout, as the viewer sees them.

Used by validate_skeleton_watch.py and search_skeleton_watch_layout.py. Needs
numpy (stem/.venv).

WHAT "VISIBLE" MEANS HERE. The drawing stacks its round parts back to front
(escape wheel, fourth, third, centre, barrel, balance), and each part hides
what is below it inside its `inner` radius (for a wheel, the root circle of its
teeth). So the visible part of a wheel is its disc out to the tip of its teeth,
minus the inner discs of every part above it. Two wheels can overlap on paper
and be far apart to the eye, because a third wheel covers the overlap. The
gap between two parts is the gap between their visible regions.

The regions are sampled on their outlines every `spacing` px, so a gap is
exact to about half the spacing.
"""

import itertools
import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray
from skeleton_watch import (
    BALANCE,
    BANK,
    BARREL,
    BARREL_ANGLE,
    ESCAPE,
    RING_RADIUS,
    STACK,
    THIRD,
    THIRD_BARREL_CLEARANCE,
    THIRD_BARREL_TOLERANCE,
    TRAIN,
    Part,
    Placement,
    Point,
    Round,
    Wheel,
)

Points = NDArray[np.float64]  # shape (n, 2)


def label(key: Part | tuple[Part, Part]) -> str:
    """A part's name, or a pair's names joined by a hyphen, for reports."""
    return "-".join(part.name for part in key) if isinstance(key, tuple) else key.name


@dataclass(frozen=True)
class Region:
    """A part's visible region: the disc (centre, outer), minus `hiders`, the
    inner discs of the parts above it."""

    centre: Point
    outer: float
    hiders: tuple[tuple[Point, float], ...]


def regions(stack: Sequence[Round], arbor: Mapping[Part, Point]) -> dict[Round, Region]:
    """Each part's visible region. `stack` is in back-to-front order."""
    return {
        part: Region(
            arbor[part],
            part.outer,
            tuple((arbor[upper], upper.inner) for upper in stack[index + 1 :]),
        )
        for index, part in enumerate(stack)
    }


def circle_points(centre: Point, radius: float, spacing: float) -> Points:
    count = max(12, int(np.ceil(2 * np.pi * radius / spacing)))
    theta = np.linspace(0, 2 * np.pi, count, endpoint=False)
    return np.column_stack(
        (centre[0] + radius * np.cos(theta), centre[1] + radius * np.sin(theta))
    )


def inside_disc(
    points: Points, centre: Point, radius: float, strict: bool = False
) -> NDArray[np.bool_]:
    distance = np.hypot(points[:, 0] - centre[0], points[:, 1] - centre[1])
    return distance < radius - 1e-6 if strict else distance <= radius + 1e-6


def inside(region: Region, points: Points) -> NDArray[np.bool_]:
    """Which of `points` the viewer sees as part of `region`."""
    seen = inside_disc(points, region.centre, region.outer)
    for centre, radius in region.hiders:
        seen &= ~inside_disc(points, centre, radius, strict=True)
    return seen


def outline(region: Region, spacing: float) -> Points:
    """Samples of the region's outline: the visible arcs of its own edge, and
    the arcs of the hiders' edges that cross it."""
    pieces = []
    edge = circle_points(region.centre, region.outer, spacing)
    keep = np.ones(len(edge), dtype=bool)
    for centre, radius in region.hiders:
        keep &= ~inside_disc(edge, centre, radius, strict=True)
    pieces.append(edge[keep])
    for index, (centre, radius) in enumerate(region.hiders):
        arc = circle_points(centre, radius, spacing)
        keep = inside_disc(arc, region.centre, region.outer)
        for other, (other_centre, other_radius) in enumerate(region.hiders):
            if other != index:
                keep &= ~inside_disc(arc, other_centre, other_radius, strict=True)
        pieces.append(arc[keep])
    return np.concatenate(pieces) if pieces else np.empty((0, 2))


def nearest(first: Points, second: Points) -> float:
    """The smallest distance between two point sets."""
    if len(first) == 0 or len(second) == 0:
        return float("inf")
    differences = first[:, None, :] - second[None, :, :]
    return float(np.sqrt((differences**2).sum(axis=2).min()))


def region_gap(first: Region, second: Region, spacing: float = 1.0) -> float:
    """The gap between two visible regions: 0 if they overlap."""
    first_outline, second_outline = outline(first, spacing), outline(second, spacing)
    if inside(second, first_outline).any() or inside(first, second_outline).any():
        return 0.0
    return nearest(first_outline, second_outline)


def polygon_points(corners: Sequence[Point], spacing: float) -> Points:
    """Samples along a closed polygon's edges."""
    samples = []
    for start, end in zip(corners, [*corners[1:], corners[0]], strict=True):
        count = max(
            1, int(np.ceil(np.hypot(end[0] - start[0], end[1] - start[1]) / spacing))
        )
        fraction = np.linspace(0, 1, count, endpoint=False)[:, None]
        samples.append(np.array(start) + fraction * (np.array(end) - np.array(start)))
    return np.concatenate(samples)


def polygon_gap(
    corners: Sequence[Point], region: Region, spacing: float = 1.0
) -> float:
    """The gap between a polygon (drawn above everything) and a visible
    region: 0 if they overlap."""
    edge = polygon_points(corners, spacing)
    if inside(region, edge).any():
        return 0.0
    return nearest(edge, outline(region, spacing))


# ---- the whole watch ------------------------------------------------------------------
MESH_TOLERANCE = 0.01  # px: a mesh distance must be exact, up to rounding


@dataclass(frozen=True)
class Clearances:
    """A placement's clearances: what the validator checks and the search
    optimises."""

    # (driver, driven) -> what is wrong with the mesh
    mesh_errors: dict[tuple[Wheel, Wheel], str]
    # part -> px from its outer edge to the chapter ring's inside edge
    ring_gaps: dict[Round, float]
    # (part, part) -> visible gap, for parts that do not mesh
    part_gaps: dict[tuple[Round, Round], float]
    # part -> gap from the fork, at the worse end of its swing
    fork_gaps: dict[Round, float]

    def tightest_parts(self) -> tuple[tuple[Round, Round], float]:
        return min(self.part_gaps.items(), key=lambda item: item[1])

    def tightest_fork(self) -> tuple[Round, float]:
        return min(self.fork_gaps.items(), key=lambda item: item[1])

    def tightest_ring(self) -> tuple[Round, float]:
        return min(self.ring_gaps.items(), key=lambda item: item[1])


def ring_gaps(placement: Placement) -> dict[Round, float]:
    """Each round part's gap to the chapter ring's inside edge: negative if
    it reaches past it. Cheap, so the search uses it to reject a layout
    before it measures the rest."""
    return {
        part: RING_RADIUS - (math.hypot(*placement.arbor[part]) + part.outer)
        for part in STACK
    }


def layout_constraints(placement: Placement, spacing: float = 1.0) -> list[str]:
    """Fixed barrel position and the visible third-barrel clearance target."""
    problems = []
    if not math.isclose(placement.layout.barrel_angle, BARREL_ANGLE, abs_tol=1e-6):
        problems.append(f"barrel: must be at {BARREL_ANGLE:g} degrees (5 o'clock)")
    visible = regions(STACK, placement.arbor)
    gap = region_gap(visible[THIRD], visible[BARREL], spacing)
    if abs(gap - THIRD_BARREL_CLEARANCE) > THIRD_BARREL_TOLERANCE:
        problems.append(
            f"third-barrel: visible gap {gap:.1f} px, expected "
            f"{THIRD_BARREL_CLEARANCE:g} +/- {THIRD_BARREL_TOLERANCE:g} px"
        )
    return problems


def measure(placement: Placement, spacing: float = 1.0) -> Clearances:
    """The clearances of `placement`."""
    mesh_errors: dict[tuple[Wheel, Wheel], str] = {}
    meshing = set()
    for driver in TRAIN:
        if driver.driven is None:
            continue
        meshing.add(frozenset((driver, driver.driven)))
        want = driver.mesh_distance
        have = math.dist(placement.arbor[driver], placement.arbor[driver.driven])
        if abs(have - want) > MESH_TOLERANCE:
            mesh_errors[(driver, driver.driven)] = (
                f"arbors {have:.2f} px apart, the mesh needs {want:.2f}"
            )

    visible = regions(STACK, placement.arbor)
    part_gaps: dict[tuple[Round, Round], float] = {
        (first, second): region_gap(visible[first], visible[second], spacing)
        for first, second in itertools.combinations(visible, 2)
        if frozenset((first, second)) not in meshing
    }
    # the fork works on the escape wheel and the balance, and clears the rest
    forks = [placement.fork_polygon(bank) for bank in (-BANK, BANK)]
    fork_gaps: dict[Round, float] = {
        part: min(polygon_gap(fork, visible[part], spacing) for fork in forks)
        for part in visible
        if part not in (ESCAPE, BALANCE)
    }
    return Clearances(mesh_errors, ring_gaps(placement), part_gaps, fork_gaps)

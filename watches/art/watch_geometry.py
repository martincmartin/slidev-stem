"""Clearances in the skeleton watch's layout, as the viewer sees them.

Used by validate-skeleton-watch.py and search-skeleton-watch-layout.py. Needs
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

import importlib.util
import itertools
import math
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from types import ModuleType
from typing import Protocol

import numpy as np
from numpy.typing import NDArray

Point = tuple[float, float]
Points = NDArray[np.float64]  # shape (n, 2)


class Footprint(Protocol):
    """What skeleton-watch.py's Footprint provides."""

    @property
    def centre(self) -> Point: ...
    @property
    def inner(self) -> float: ...
    @property
    def outer(self) -> float: ...


@dataclass(frozen=True)
class Region:
    """A part's visible region: the disc (centre, outer), minus `hiders`, the
    inner discs of the parts above it."""

    centre: Point
    outer: float
    hiders: tuple[tuple[Point, float], ...]


def regions(footprints: dict[str, Footprint]) -> dict[str, Region]:
    """Each part's visible region. `footprints` is in back-to-front order."""
    names = list(footprints)
    return {
        name: Region(
            footprints[name].centre,
            footprints[name].outer,
            tuple(
                (footprints[upper].centre, footprints[upper].inner)
                for upper in names[index + 1 :]
            ),
        )
        for index, name in enumerate(names)
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
    for start, end in zip(corners, list(corners[1:]) + [corners[0]]):
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


# ---- the layout as a whole ------------------------------------------------------------
MESH_TOLERANCE = 0.01  # px: a mesh distance must be exact, up to rounding
FORK_WHEELS = (
    "fourth",
    "third",
    "centre",
    "barrel",
)  # the fork works on the escape wheel and balance


@dataclass(frozen=True)
class Layout:
    """What the validator checks and the search optimises."""

    # "driver-driven" -> what is wrong with the mesh
    mesh_errors: dict[str, str]
    # part -> px from the watch centre to its outer edge
    reach: dict[str, float]
    # part -> px from its outer edge to the chapter ring's inside edge
    ring_gaps: dict[str, float]
    # "part-part" -> visible gap, for parts that do not mesh
    wheel_gaps: dict[str, float]
    # wheel -> gap from the fork, at the worse end of its swing
    fork_gaps: dict[str, float]

    def tightest_wheels(self) -> tuple[str, float]:
        return min(self.wheel_gaps.items(), key=lambda item: item[1])

    def tightest_fork(self) -> tuple[str, float]:
        return min(self.fork_gaps.items(), key=lambda item: item[1])

    def tightest_ring(self) -> tuple[str, float]:
        return min(self.ring_gaps.items(), key=lambda item: item[1])


def load_watch(path: Path) -> ModuleType:
    """skeleton-watch.py as a module (its name has a hyphen, so no import)."""
    spec = importlib.util.spec_from_file_location("skeleton_watch", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def measure(watch: ModuleType, spacing: float = 1.0) -> Layout:
    """The layout that `watch`'s constants give, measured."""
    positions = watch.arbors()
    mesh_errors = {}
    for driver, driven in watch.MESHES:
        spec = watch.WHEELS[driver]
        want = spec.pitch_radius + watch.pinion_radius(spec, watch.WHEELS[driven])
        have = math.dist(positions[driver], positions[driven])
        if abs(have - want) > MESH_TOLERANCE:
            mesh_errors[f"{driver}-{driven}"] = (
                f"arbors {have:.2f} px apart, the mesh needs {want:.2f}"
            )

    footprints = watch.part_footprints(positions)
    reach = {
        name: math.hypot(*part.centre) + part.outer for name, part in footprints.items()
    }
    ring_gaps = {name: watch.RING_RADIUS - distance for name, distance in reach.items()}
    visible = regions(footprints)
    meshing = {frozenset(pair) for pair in watch.MESHES}
    wheel_gaps = {
        f"{first}-{second}": region_gap(visible[first], visible[second], spacing)
        for first, second in itertools.combinations(visible, 2)
        if frozenset((first, second)) not in meshing
    }
    forks = [watch.fork_polygon(positions, bank) for bank in (-watch.BANK, watch.BANK)]
    fork_gaps = {
        wheel: min(polygon_gap(fork, visible[wheel], spacing) for fork in forks)
        for wheel in FORK_WHEELS
    }
    return Layout(mesh_errors, reach, ring_gaps, wheel_gaps, fork_gaps)

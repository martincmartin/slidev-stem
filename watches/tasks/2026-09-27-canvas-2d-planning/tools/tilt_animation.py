#!/usr/bin/env python3
"""The train at meshing heights, tilting from 0 to 90 degrees and back, in a
loop: a standalone SVG with SMIL, no script.

    cd ../../.. && uv run python tasks/2026-09-27-canvas-2d-planning/tools/tilt_animation.py
    # in the talk's directory (it needs scipy): about 2 minutes

The pieces and their drawing order are the slab order of meshing.py's flush
model (depth_order.MESHING). The order is right at every tilt in (0, 90]
degrees, so it is fixed; only the shapes move. Each piece is one <path>
(two for a wall: its fill and its lines), and an <animate> on its `d` holds
its projection at each keyframe tilt.

Between two keyframes, SMIL mixes the two shapes: each point moves on a
straight line, while the true point moves on an arc. The mix at progress u
is still a true view, at another tilt and squashed vertically (see View), so
the drawing order stays right. By default u grows at a constant rate. A
`keySplines` curve (calcMode="spline") can make it vary within one
interval. A "1 - cos" panel gives each interval, from tilt a to tilt b, the
curve u = (cos a - cos(tilt)) / (cos a - cos b), fitted as a Bezier: it
keeps the plan's height true, as if the caliber were flat (z = 0); only the
walls come out too short. From 0 to 90 it is u = 1 - cos(tilt).

The true tilt turns at a constant rate (LAST_TILT / SWING) while it moves.
It holds HOLD seconds at 0, at LAST_TILT and at each of its Motion's
pauses, on the way up and on the way down, and turns about the middle of
the train, so the train stays in view. The equal-error panels (one and
two interior keyframes) are each compared with keyframes every 5
degrees, and hold at the middle of each of their intervals, where the
error is largest. Where a pause falls inside an interval, the interval
is split there: the new keyframe holds exactly what that panel shows at
that moment (see Blend), and a keySplines curve is split exactly, by de
Casteljau's rule.

Writes, in ../out/ (git ignores it; the files are 2-20 MB):
- meshing-train-tilt-<panel>.svg: one panel, holding at 0 and LAST_TILT
  only;
- meshing-train-tilt-<panel>-vs-<panel>....svg: panels side by side, on one
  clock, for each list in main's comparisons;
- tilt-<panels>-<browser>-<time>s.png: frames of each, paused, in Chromium
  and Firefox.
and ../evidence/depth/tilt-<panel>-still-<tilt>.svg and .png: the true
rotation next to the mix, at the middle of each interval, where the walls
look thinnest, for keyframes every 45 degrees and for both equal-error
panels;
and ../evidence/tilt_animation.json: sizes, errors, the fitted curves, and
for each paused frame, what each panel shows, how many of its pixels differ
from the first panel, and its drawing's height against the height predicted
from the keySplines arithmetic.
"""

import functools
import itertools
import json
import math
import pathlib
from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
from depth_order import (
    EVIDENCE,
    LINE,
    MESHING,
    PICTURES,
    STATIC_TIME,
    TRAIN,
    Camera,
    Face,
    Floats,
    OrderStats,
    Piece,
    Pose,
    Wall,
    build_solids,
    path_data,
    screen_polygon,
    wall_lines,
)
from keyframe_angles import keyframe_tilts
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
from scipy.optimize import minimize
from watch_svg import TASK, read_shapes

LAST_TILT = 90.0  # degrees: the slab order holds up to 90, and flips beyond
HOLD = 1.0  # s at each stop
SWING = 4.0  # s of movement from 0 to LAST_TILT
RATE = LAST_TILT / SWING  # degrees per s while it moves
ZOOM = 3.0
GAP = 20 / ZOOM  # between the panels: 20 px on the screen
LABEL = 28 / ZOOM  # room above the panels for their labels
OUT = TASK / "out"  # the files are large, so they are not kept in evidence/
BACKGROUND = "#FAF7F0"
MINUS = chr(0x2212)  # the minus sign, for labels
FIT_SAMPLES = 61  # points along the swing where a curve is fitted
ERROR_SAMPLES = 181  # points along the way up where each panel's error is taken

Spline = tuple[float, float, float, float]  # a keySplines entry: x1 y1 x2 y2
LINEAR: Spline = (0.0, 0.0, 1.0, 1.0)


# ---- what a keyframe shows ----------------------------------------------------------
@dataclass(frozen=True)
class Blend:
    """A keyframe's shapes: the mix, at `progress`, of the true projections
    at two tilts. A keyframe at a true tilt is a blend of that tilt with
    itself."""

    first: float  # degrees
    second: float  # degrees
    progress: float

    @classmethod
    def exact(cls, tilt: float) -> Blend:
        return cls(tilt, tilt, 0.0)

    @property
    def cosine(self) -> float:
        return (1 - self.progress) * math.cos(
            math.radians(self.first)
        ) + self.progress * math.cos(math.radians(self.second))

    @property
    def sine(self) -> float:
        return (1 - self.progress) * math.sin(
            math.radians(self.first)
        ) + self.progress * math.sin(math.radians(self.second))


@dataclass(frozen=True)
class Station:
    """A keyframe on the way up: the true tilt when it is reached, and what
    it shows then."""

    tilt: float
    blend: Blend


@dataclass(frozen=True)
class Keyframe:
    time: float  # s from the start of the loop
    station: Station


def key_tilts(step: float) -> list[float]:
    """0, step, 2 step, ... below LAST_TILT, then LAST_TILT."""
    return [*np.arange(0.0, LAST_TILT, step).tolist(), LAST_TILT]


MOVING = (9.0, 22.5, 67.5, 85.0)  # degrees: frames taken while it moves


@dataclass(frozen=True)
class Motion:
    """The true tilt over one loop: hold HOLD s at 0, turn at RATE to
    LAST_TILT, holding HOLD s at each pause and at the top, then back the
    same way."""

    pauses: tuple[float, ...] = ()

    def time_at(self, tilt: float) -> float:
        """When the true tilt reaches `tilt` on the way up (the start of its
        hold, if it holds there)."""
        passed = sum(1 for pause in self.pauses if pause < tilt)
        return HOLD + tilt / RATE + HOLD * passed

    def true_tilt(self, time: float) -> float:
        """The tilt of a true rotation at `time`."""
        points = [(0.0, 0.0), (HOLD, 0.0)]
        for stop in [*self.pauses, LAST_TILT]:
            points.append((points[-1][0] + (stop - points[-1][1]) / RATE, stop))
            points.append((points[-1][0] + HOLD, stop))
        for stop in [*reversed(self.pauses), 0.0]:
            points.append((points[-1][0] + (points[-1][1] - stop) / RATE, stop))
            if stop != 0:
                points.append((points[-1][0] + HOLD, stop))
        times, tilts = zip(*points, strict=True)
        return float(np.interp(time, times, tilts))

    def moments(self) -> list[tuple[str, float]]:
        """When to pause the browsers: in the middle of each hold on the way
        up, and at MOVING tilts that are not stops."""
        # the hold at 0 comes before the swing starts; the others after
        # their stop is reached
        holds = [
            ("hold at 0", HOLD / 2),
            *[
                (f"hold at {stop:g}", self.time_at(stop) + HOLD / 2)
                for stop in (*self.pauses, LAST_TILT)
            ],
        ]
        moving = [
            (f"{tilt:g}", self.time_at(tilt))
            for tilt in MOVING
            if tilt not in self.pauses
        ]
        return sorted([*holds, *moving], key=lambda moment: moment[1])


# ---- timing curves --------------------------------------------------------------------
def mirrored(spline: Spline) -> Spline:
    """The same motion played backwards: for the way down."""
    x1, y1, x2, y2 = spline
    return (1 - x2, 1 - y2, 1 - x1, 1 - y1)


def cubic(first: float, second: float, along: Floats) -> Floats:
    """One coordinate of a keySplines curve from 0 to 1, with control values
    `first` and `second`, at parameter `along`."""
    rest = 1 - along
    value: Floats = (
        3 * rest * rest * along * first + 3 * rest * along * along * second
    ) + along**3
    return value


def curve_parameter(spline: Spline, fractions: Floats) -> Floats:
    """The curve's parameter where its x is each fraction of the interval's
    time. x rises, since x1 and x2 lie in [0, 1]."""
    low = np.zeros_like(fractions)
    high = np.ones_like(fractions)
    for _ in range(50):
        middle = (low + high) / 2
        below = cubic(spline[0], spline[2], middle) < fractions
        low = np.where(below, middle, low)
        high = np.where(below, high, middle)
    middle_values: Floats = (low + high) / 2
    return middle_values


def spline_progress(spline: Spline, fractions: Floats) -> Floats:
    """The progress u that a keySplines curve gives at each fraction of its
    interval's time."""
    return cubic(spline[1], spline[3], curve_parameter(spline, fractions))


def split_spline(spline: Spline, fraction: float) -> tuple[Spline, Spline, float]:
    """The curve cut where its time is `fraction` of the interval: the two
    halves, each scaled to run from (0, 0) to (1, 1), and the progress at
    the cut. De Casteljau's rule makes the halves exact."""
    if spline == LINEAR:
        return LINEAR, LINEAR, fraction
    along = float(curve_parameter(spline, np.array([fraction]))[0])
    points = [
        np.array(point) for point in ((0.0, 0.0), spline[:2], spline[2:], (1.0, 1.0))
    ]
    first = [a + (b - a) * along for a, b in itertools.pairwise(points)]
    second = [a + (b - a) * along for a, b in itertools.pairwise(first)]
    cut = second[0] + (second[1] - second[0]) * along
    left = (first[0] / cut, second[0] / cut)
    right = ((second[1] - cut) / (1 - cut), (first[2] - cut) / (1 - cut))

    def as_spline(controls: tuple[Floats, Floats]) -> Spline:
        return (
            float(controls[0][0]),
            float(controls[0][1]),
            float(controls[1][0]),
            float(controls[1][1]),
        )

    return as_spline(left), as_spline(right), float(cut[1])


# ---- panels ------------------------------------------------------------------------------
@functools.cache
def flat_curve(first: float, second: float) -> tuple[Spline, float]:
    """The keySplines curve for one interval, from tilt `first` to `second`,
    that keeps the plan's height true for a flat caliber (z = 0): the mix's
    cosine, (1 - u) cos(first) + u cos(second), equals cos(tilt) as the tilt
    turns at a constant rate. From 0 to 90 it is u = 1 - cos(tilt). Returns
    the fitted curve and its worst miss in progress u."""
    fractions = np.linspace(0.0, 1.0, FIT_SAMPLES)
    tilts = np.radians(first + (second - first) * fractions)
    start, end = math.cos(math.radians(first)), math.cos(math.radians(second))
    return fitted_spline((start - np.cos(tilts)) / (start - end), fractions)


@dataclass(frozen=True)
class Panel:
    """One animation: keyframes at `tilts` on the way up, from 0 to
    LAST_TILT. With `flat`, each interval has the flat_curve timing (its
    mirror where the tilt falls); without, the mix runs at a steady rate."""

    tilts: tuple[float, ...]
    flat: bool = False

    @classmethod
    def every(cls, step: float, flat: bool = False) -> Panel:
        return cls(tuple(key_tilts(step)), flat)

    @property
    def step(self) -> float | None:
        """The spacing of the keyframes, if they are evenly spaced."""
        return self.tilts[1] if self.tilts == tuple(key_tilts(self.tilts[1])) else None

    @property
    def label(self) -> str:
        profile = f", speed profile 1 {MINUS} cos" if self.flat else ""
        where = (
            f"every {self.step:g}°"
            if self.step is not None
            else "at " + ", ".join(f"{tilt:g}°" for tilt in self.tilts)
        )
        return f"Keyframes {where}{profile}"

    @property
    def name(self) -> str:
        where = (
            f"{self.step:g}"
            if self.step is not None
            else "-".join(f"{tilt:g}" for tilt in self.tilts)
        )
        return where + ("-one-minus-cos" if self.flat else "")

    def curve(self, first: float, second: float) -> Spline:
        return flat_curve(first, second)[0] if self.flat else LINEAR

    def way_up(self, motion: Motion) -> tuple[list[Station], list[Spline]]:
        """The stations on the way up, with each pause inside an interval
        made a station, and the curve of each interval between them."""
        stations = [Station(tilt, Blend.exact(tilt)) for tilt in self.tilts]
        splines = [
            self.curve(below.tilt, above.tilt)
            for below, above in itertools.pairwise(stations)
        ]
        for pause in motion.pauses:
            if any(station.tilt == pause for station in stations):
                continue
            index = next(
                at
                for at in range(len(stations) - 1)
                if stations[at].tilt < pause < stations[at + 1].tilt
            )
            below, above = stations[index], stations[index + 1]
            left, right, progress = split_spline(
                splines[index], (pause - below.tilt) / (above.tilt - below.tilt)
            )
            stations.insert(
                index + 1, Station(pause, Blend(below.tilt, above.tilt, progress))
            )
            splines[index : index + 1] = [left, right]
        return stations, splines

    def timeline(self, motion: Motion) -> tuple[list[Keyframe], list[Spline]]:
        """The keyframes of one loop, and the curve of each interval: hold at
        0, up with a hold at each pause and at the top, then down."""
        stations, splines = self.way_up(motion)
        stops = {0.0, LAST_TILT, *motion.pauses}
        keyframes = [Keyframe(0.0, stations[0]), Keyframe(HOLD, stations[0])]
        curves = [LINEAR]
        time = HOLD
        for station, curve in zip(stations[1:], splines, strict=True):
            time += (station.tilt - keyframes[-1].station.tilt) / RATE
            keyframes.append(Keyframe(time, station))
            curves.append(curve)
            if station.tilt in stops:
                time += HOLD
                keyframes.append(Keyframe(time, station))
                curves.append(LINEAR)
        for index in range(len(stations) - 2, -1, -1):
            station = stations[index]
            time += (keyframes[-1].station.tilt - station.tilt) / RATE
            keyframes.append(Keyframe(time, station))
            curves.append(mirrored(splines[index]))
            if station.tilt in stops and station.tilt != 0:
                time += HOLD
                keyframes.append(Keyframe(time, station))
                curves.append(LINEAR)
        return keyframes, curves

    def mix_at(self, motion: Motion, time: float) -> tuple[Blend, Blend, float]:
        """The two keyframes' blends that SMIL mixes at `time`, and the
        progress u."""
        keyframes, curves = self.timeline(motion)
        times = [keyframe.time for keyframe in keyframes]
        index = min(
            max(int(np.searchsorted(times, time, "right")) - 1, 0), len(times) - 2
        )
        first, second = keyframes[index], keyframes[index + 1]
        span = second.time - first.time
        along = 0.0 if span == 0 else (time - first.time) / span
        progress = float(spline_progress(curves[index], np.array([along]))[0])
        return first.station.blend, second.station.blend, progress


@dataclass(frozen=True)
class View:
    """What SMIL shows between two keyframes. Each point's screen y is the
    mix (1 - u) y(a) + u y(b) = c Y - s Z, with c and s the same mix of the
    keyframes' cosines and sines: a true view at tilt atan2(s, c), squashed
    vertically by hypot(c, s). So the drawing order stays right; only the
    height and the timing are off."""

    tilt: float  # degrees
    squash: float  # the height on the screen, as a fraction of the true one


def view_at(panel: Panel, motion: Motion, time: float) -> View:
    first, second, progress = panel.mix_at(motion, time)
    cosine = (1 - progress) * first.cosine + progress * second.cosine
    sine = (1 - progress) * first.sine + progress * second.sine
    return View(math.degrees(math.atan2(sine, cosine)), math.hypot(cosine, sine))


# ---- shapes -------------------------------------------------------------------------------
class Pivot:
    """Tilt about the middle of the pieces, not about y = 0, z = 0: a shift
    of the screen's y at each tilt."""

    def __init__(self, pieces: Sequence[Piece]) -> None:
        points = np.concatenate(
            [
                polygon
                for piece in pieces
                for polygon in screen_polygon(piece, Camera(0))
            ]
        )
        self.y = float(points[:, 1].min() + points[:, 1].max()) / 2
        heights = [piece.solid.bottom for piece in pieces] + [
            piece.solid.top for piece in pieces
        ]
        self.z = (min(heights) + max(heights)) / 2

    def shifted(self, lines: list[Floats], camera: Camera) -> list[Floats]:
        shift = self.y - (self.y * camera.cosine - self.z * camera.sine)
        return [line + np.array([0.0, shift]) for line in lines]


def shapes_at(piece: Piece, pivot: Pivot, tilt: float) -> list[list[Floats]]:
    """The polylines of each of the piece's <path>s at one tilt: the fill
    (and, for a wall, its lines)."""
    camera = Camera(tilt)
    result = [pivot.shifted(screen_polygon(piece, camera), camera)]
    if isinstance(piece, Wall):
        result.append(pivot.shifted(wall_lines(piece, camera), camera))
    return result


def blended_shapes(piece: Piece, pivot: Pivot, blend: Blend) -> list[list[Floats]]:
    first = shapes_at(piece, pivot, blend.first)
    if blend.progress == 0:
        return first
    second = shapes_at(piece, pivot, blend.second)
    return [
        [
            (1 - blend.progress) * line_a + blend.progress * line_b
            for line_a, line_b in zip(lines_a, lines_b, strict=True)
        ]
        for lines_a, lines_b in zip(first, second, strict=True)
    ]


class Outlines:
    """Every fill outline's points at a tilt, in one array: a cache for one
    run."""

    def __init__(self, pieces: Sequence[Piece], pivot: Pivot) -> None:
        self.pieces = pieces
        self.pivot = pivot
        self.cache: dict[float, Floats] = {}

    def at(self, tilt: float) -> Floats:
        if tilt not in self.cache:
            self.cache[tilt] = np.concatenate(
                [
                    line
                    for piece in self.pieces
                    for line in shapes_at(piece, self.pivot, tilt)[0]
                ]
            )
        return self.cache[tilt]

    def of(self, blend: Blend) -> Floats:
        mixed: Floats = (1 - blend.progress) * self.at(
            blend.first
        ) + blend.progress * self.at(blend.second)
        return mixed

    def shown(self, panel: Panel, motion: Motion, time: float) -> Floats:
        """The points as SMIL shows them at `time`."""
        first, second, progress = panel.mix_at(motion, time)
        mixed: Floats = (1 - progress) * self.of(first) + progress * self.of(second)
        return mixed

    def true_at(self, motion: Motion, time: float) -> Floats:
        """The points of a true rotation at `time`."""
        return self.at(round(motion.true_tilt(time), 9))


# ---- errors and fits --------------------------------------------------------------------
def interpolation_error(
    pieces: Sequence[Piece], pivot: Pivot, tilts: Sequence[float]
) -> float:
    """The largest distance, in slide px, between a point halfway along its
    straight path between two keyframes and the same point at the tilt
    halfway between them."""
    worst = 0.0
    for first, second in itertools.pairwise(tilts):
        for piece in pieces:
            for lines_a, lines_b, lines_mid in zip(
                shapes_at(piece, pivot, first),
                shapes_at(piece, pivot, second),
                shapes_at(piece, pivot, (first + second) / 2),
                strict=True,
            ):
                for a, b, mid in zip(lines_a, lines_b, lines_mid, strict=True):
                    worst = max(worst, float(np.abs((a + b) / 2 - mid).max()))
    return worst


def swing_error(outlines: Outlines, panel: Panel) -> float:
    """The largest distance, in slide px, between a point as SMIL shows it
    and as a true rotation puts it, over the way up (with no pauses: a pause
    only holds a moment of the way)."""
    motion = Motion()
    return max(
        float(
            np.abs(
                outlines.shown(panel, motion, time) - outlines.true_at(motion, time)
            ).max()
        )
        for time in np.linspace(HOLD, motion.time_at(LAST_TILT), ERROR_SAMPLES)
    )


def fitted_spline(target: Floats, fractions: Floats) -> tuple[Spline, float]:
    """The keySplines curve closest to `target` (u at each fraction), and its
    worst miss."""

    def misfit(controls: Floats) -> float:
        spline: Spline = (
            float(controls[0]),
            float(controls[1]),
            float(controls[2]),
            float(controls[3]),
        )
        return float(((spline_progress(spline, fractions) - target) ** 2).sum())

    found = minimize(
        misfit, np.array([0.5, 0.0, 0.9, 0.5]), method="L-BFGS-B", bounds=[(0, 1)] * 4
    )
    spline: Spline = (
        round(float(found.x[0]), 4),
        round(float(found.x[1]), 4),
        round(float(found.x[2]), 4),
        round(float(found.x[3]), 4),
    )
    return spline, float(np.abs(spline_progress(spline, fractions) - target).max())


# ---- the files ----------------------------------------------------------------------------
def styles_of(piece: Piece) -> list[str]:
    """The attributes of the piece's <path>s: the fill (and, for a wall, its
    lines), with the lines kept at their width on the screen."""
    width = f"{piece.solid.stroke_width / ZOOM:.3f}"
    if isinstance(piece, Face):
        return [
            f'fill="{piece.solid.fill}" fill-rule="evenodd" stroke="{LINE}" stroke-width="{width}" stroke-linejoin="round"'
        ]
    return [
        f'fill="{piece.solid.fill}"',
        f'fill="none" stroke="{LINE}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"',
    ]


CLOSED = [True, False]  # the fill's outlines are closed; a wall's lines are not


def still_paths(
    pieces: Sequence[Piece], pivot: Pivot, blend: Blend
) -> tuple[list[str], Floats]:
    """One still <path> per piece (two per wall) showing `blend`, and its
    points, for the bounds."""
    elements = []
    every_point = []
    for piece in pieces:
        shapes = blended_shapes(piece, pivot, blend)
        every_point += shapes[0]
        elements += [
            f'<path d="{path_data(lines, closed)}" {style}/>'
            for lines, closed, style in zip(
                shapes, CLOSED, styles_of(piece), strict=False
            )
        ]
    return elements, np.concatenate(every_point)


def panel_paths(
    pieces: Sequence[Piece], pivot: Pivot, panel: Panel, motion: Motion
) -> tuple[list[str], Floats]:
    """One <path> per piece (two per wall) with its <animate>, and every
    point of every keyframe, for the bounds."""
    keyframes, curves = panel.timeline(motion)
    duration = keyframes[-1].time
    key_times = ";".join(f"{frame.time / duration:.5f}" for frame in keyframes)
    timing = f'keyTimes="{key_times}"'
    if any(curve != LINEAR for curve in curves):
        splines = ";".join(
            " ".join(f"{value:.4f}" for value in curve) for curve in curves
        )
        timing += f' calcMode="spline" keySplines="{splines}"'
    elements = []
    every_point = []
    for piece in pieces:
        shown = {
            frame.station: blended_shapes(piece, pivot, frame.station.blend)
            for frame in keyframes
        }
        frames = [shown[frame.station] for frame in keyframes]
        every_point += [line for frame in frames for line in frame[0]]
        for index, style in enumerate(styles_of(piece)):
            values = [path_data(frame[index], CLOSED[index]) for frame in frames]
            elements.append(
                f'<path d="{values[0]}" {style}>'
                f'<animate attributeName="d" dur="{duration:g}s" repeatCount="indefinite" '
                f'{timing} values="{";".join(values)}"/></path>'
            )
    return elements, np.concatenate(every_point)


@dataclass(frozen=True)
class Layout:
    """Where the panels go: the bounds of one panel's drawing, in slide px,
    rounded so that a panel is a whole number of screen pixels wide."""

    left: float
    top: float
    width: float
    height: float

    @property
    def pitch(self) -> float:
        """From one panel's left edge to the next one's."""
        return self.width + GAP


def layout_of(points: Sequence[Floats]) -> Layout:
    every = np.concatenate(points)
    low = every.min(axis=0) - 10 / ZOOM
    high = every.max(axis=0) + 10 / ZOOM
    return Layout(
        float(low[0]),
        float(low[1]) - LABEL,
        math.ceil((high[0] - low[0]) * ZOOM) / ZOOM,
        math.ceil((high[1] - low[1] + LABEL) * ZOOM) / ZOOM,
    )


def sheet(labelled: Sequence[tuple[str, list[str]]], layout: Layout, title: str) -> str:
    """An SVG with the panels side by side, each with its label."""
    width = layout.pitch * len(labelled) - GAP
    font = 'font-family="system-ui, -apple-system, Segoe UI, sans-serif"'
    groups = []
    for index, (label, elements) in enumerate(labelled):
        text = (
            f'<text x="{layout.left + 10 / ZOOM:.1f}" y="{layout.top + 20 / ZOOM:.1f}" {font} '
            f'font-size="{16 / ZOOM:.2f}" fill="{LINE}">{label}</text>'
        )
        groups.append(
            f'<g transform="translate({index * layout.pitch:.4f} 0)">\n{text}\n'
            + "\n".join(elements)
            + "\n</g>"
        )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width * ZOOM:.0f}" height="{layout.height * ZOOM:.0f}" '
        f'viewBox="{layout.left:.4f} {layout.top:.4f} {width:.4f} {layout.height:.4f}">\n'
        f"<title>{title}</title>\n"
        f'<rect x="{layout.left:.4f}" y="{layout.top:.4f}" width="{width:.4f}" height="{layout.height:.4f}" fill="{BACKGROUND}"/>\n'
        + "\n".join(groups)
        + "\n</svg>\n"
    )


def document(
    pieces: Sequence[Piece], panels: Sequence[Panel], motion: Motion
) -> tuple[str, Layout]:
    """An SVG with the panels side by side, on one clock."""
    pivot = Pivot(pieces)
    drawn = [panel_paths(pieces, pivot, panel, motion) for panel in panels]
    layout = layout_of([points for _, points in drawn])
    stops = ", ".join(f"{tilt:g}" for tilt in (0.0, *motion.pauses, LAST_TILT))
    title = (
        f"The train at meshing heights, tilting from 0 to {LAST_TILT:g} degrees"
        f" and back, holding at {stops}"
    )
    labelled = [
        (panel.label, elements)
        for panel, (elements, _) in zip(panels, drawn, strict=True)
    ]
    return sheet(labelled, layout, title), layout


@dataclass(frozen=True)
class Still:
    """One moment of a panel, next to the true rotation at that moment."""

    tilt: float  # the true tilt
    blend: Blend  # what the panel shows then

    @property
    def walls(self) -> float:
        """The walls' height on the screen, as a fraction of the true one."""
        return self.blend.sine / math.sin(math.radians(self.tilt))

    @property
    def plan(self) -> float:
        """The plan's height on the screen, as a fraction of the true one."""
        return self.blend.cosine / math.cos(math.radians(self.tilt))

    @property
    def apparent(self) -> float:
        return math.degrees(math.atan2(self.blend.sine, self.blend.cosine))


def still_of(panel: Panel, tilt: float) -> Still:
    """What `panel` shows when the true tilt is `tilt`: the mix of the two
    keyframes around it, at the progress its interval's curve gives. (A
    pause inside the interval splits the curve exactly, so this is what
    SMIL shows.)"""
    first, second = next(
        pair for pair in itertools.pairwise(panel.tilts) if pair[0] <= tilt <= pair[1]
    )
    fraction = np.array([(tilt - first) / (second - first)])
    progress = float(spline_progress(panel.curve(first, second), fraction)[0])
    return Still(tilt, Blend(first, second, progress))


def still_sheet(pieces: Sequence[Piece], still: Still) -> str:
    """The true rotation on the left; the panel's mix on the right."""
    pivot = Pivot(pieces)
    true = still_paths(pieces, pivot, Blend.exact(still.tilt))
    mixed = still_paths(pieces, pivot, still.blend)
    layout = layout_of([true[1], mixed[1]])
    blend = still.blend
    right = (
        f"Mix of {blend.first:g}° and {blend.second:g}°: walls {still.walls:.0%},"
        f" plan {still.plan:.0%}; looks like {still.apparent:.1f}°"
    )
    return sheet(
        [(f"True rotation, {still.tilt:g}°", true[0]), (right, mixed[0])],
        layout,
        f"The train at {still.tilt:g} degrees: true, and as the 1 - cos mix shows it",
    )


# ---- the browsers -------------------------------------------------------------------------


@dataclass(frozen=True)
class Frame:
    """What one browser drew for one panel at one paused time."""

    differing: int  # pixels that differ from the first panel by more than 64
    height: int  # rows below the label that hold any line or fill


def drawing_height(panel_image: Image.Image) -> int:
    """How many rows, below the label, hold something other than the
    background."""
    pixels = np.asarray(panel_image.convert("RGB")).astype(int)
    background = np.array([int(BACKGROUND[at : at + 2], 16) for at in (1, 3, 5)])
    rows = np.nonzero((np.abs(pixels - background).max(axis=2) > 24).any(axis=1))[0]
    rows = rows[rows >= round(LABEL * ZOOM)]
    return 0 if len(rows) == 0 else int(rows[-1] - rows[0] + 1)


def render_frames(
    path: pathlib.Path, layout: Layout, count: int, times: Sequence[float]
) -> dict[float, dict[str, list[Frame]]]:
    """Screenshots of a side-by-side file, paused at each time, in both
    browsers, and what each panel shows."""
    frames: dict[float, dict[str, list[Frame]]] = {moment: {} for moment in times}
    panel = round(layout.width * ZOOM)
    offset = round(layout.pitch * ZOOM)
    with sync_playwright() as playwright:
        for browser_type in (playwright.chromium, playwright.firefox):
            browser = browser_type.launch()
            page = browser.new_page(viewport={"width": 3200, "height": 1000})
            page.goto(path.as_uri())
            for moment in times:
                page.evaluate(
                    "time => { const svg = document.querySelector('svg');"
                    " svg.pauseAnimations(); svg.setCurrentTime(time); }",
                    moment,
                )
                page.wait_for_timeout(100)
                name = path.stem.replace("meshing-train-", "")
                shot_path = OUT / f"{name}-{browser_type.name}-{moment:.2f}s.png"
                page.locator("svg").screenshot(path=str(shot_path))
                with Image.open(shot_path) as image:
                    shot = image.convert("RGB")
                crops = [
                    shot.crop((index * offset, 0, index * offset + panel, shot.height))
                    for index in range(count)
                ]
                frames[moment][browser_type.name] = [
                    Frame(
                        int(
                            (
                                np.asarray(ImageChops.difference(crops[0], crop)).max(
                                    axis=2
                                )
                                > 64
                            ).sum()
                        ),
                        drawing_height(crop),
                    )
                    for crop in crops
                ]
            browser.close()
    return frames


def equal_errors(interior: int) -> Panel:
    """`interior` keyframes between 0 and LAST_TILT, placed so that every
    interval has the same worst error, with the 1 - cos curve in each."""
    return Panel(tuple(keyframe_tilts(0.0, LAST_TILT, interior)), flat=True)


def middles(panel: Panel) -> tuple[float, ...]:
    """The middle of each interval between keyframes, where its error is
    largest: where to hold, and where to take stills."""
    return tuple(
        round((first + second) / 2, 3)
        for first, second in itertools.pairwise(panel.tilts)
    )


def render_png(path: pathlib.Path) -> pathlib.Path:
    """A PNG of the SVG beside it, at twice its size, from Chromium."""
    png = path.with_suffix(".png")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(
            device_scale_factor=2, viewport={"width": 1800, "height": 1000}
        )
        page.goto(path.as_uri())
        page.locator("svg").screenshot(path=str(png))
        browser.close()
    return png


def main() -> None:
    order = Pose(build_solids(read_shapes(), MESHING), STATIC_TIME).slab(OrderStats())
    train = [piece for piece in order if piece.solid.part in TRAIN]
    pivot = Pivot(train)
    outlines = Outlines(train, pivot)
    one_keyframe, two_keyframes = equal_errors(1), equal_errors(2)
    # each comparison, and where it holds besides 0 and LAST_TILT: an
    # equal-error panel holds where its errors are largest
    comparisons = [
        ([Panel.every(5.0), Panel.every(10.0)], Motion()),
        ([Panel.every(10.0), Panel.every(22.5)], Motion()),
        ([Panel.every(5.0), two_keyframes], Motion(middles(two_keyframes))),
        ([Panel.every(5.0), one_keyframe], Motion(middles(one_keyframe))),
    ]
    # each panel alone holds at 0 and LAST_TILT only, as a finished file
    # would: the pauses are there to compare panels, and each costs keyframes
    singles = list(
        dict.fromkeys(panel for panels, _ in comparisons for panel in panels)
    )
    halves = Panel.every(45.0, flat=True)
    # measured, not drawn: one step from 0 to 90, steady and with 1 - cos
    measured = [
        *singles,
        halves,
        Panel.every(90.0),
        Panel.every(90.0, flat=True),
    ]
    OUT.mkdir(exist_ok=True)
    sizes = {}
    for panel in singles:
        single = OUT / f"meshing-train-tilt-{panel.name}.svg"
        single.write_text(document(train, [panel], Motion())[0])
        sizes[single.name] = single.stat().st_size
    side_by_side: dict[str, object] = {}
    for panels, motion in comparisons:
        path = OUT / (
            "meshing-train-tilt-" + "-vs-".join(panel.name for panel in panels) + ".svg"
        )
        text, layout = document(train, panels, motion)
        path.write_text(text)
        sizes[path.name] = path.stat().st_size
        moments = motion.moments()
        drawn = render_frames(path, layout, len(panels), [time for _, time in moments])
        rows = []
        for label, time in moments:
            per_panel = []
            for index, panel in enumerate(panels):
                view = view_at(panel, motion, time)
                shown = outlines.shown(panel, motion, time)
                per_panel.append(
                    {
                        "panel": panel.label,
                        "apparent tilt, degrees": round(view.tilt, 2),
                        "squash": round(view.squash, 4),
                        "predicted outline height, screen px": round(
                            float(np.ptp(shown[:, 1])) * ZOOM, 1
                        ),
                        "drawn height, screen px": {
                            browser: drawn[time][browser][index].height
                            for browser in drawn[time]
                        },
                        "pixels that differ from the first panel": {
                            browser: drawn[time][browser][index].differing
                            for browser in drawn[time]
                        },
                    }
                )
            rows.append(
                {
                    "moment": label,
                    "time, s": round(time, 3),
                    "true tilt, degrees": round(motion.true_tilt(time), 2),
                    "panels": per_panel,
                }
            )
        side_by_side[path.name] = {
            "holds, degrees": [0.0, *motion.pauses, LAST_TILT],
            "loop, s": panels[0].timeline(motion)[0][-1].time,
            "frames": rows,
        }
    stills = []
    # each interval's middle, where its error is largest
    for panel in (halves, one_keyframe, two_keyframes):
        for tilt in middles(panel):
            still = still_of(panel, tilt)
            path = PICTURES / f"tilt-{panel.name}-still-{tilt:g}.svg"
            path.write_text(still_sheet(train, still))
            stills.append(
                {
                    "panel": panel.label,
                    "true tilt, degrees": tilt,
                    "file": f"evidence/depth/{render_png(path).name}",
                    "keyframes mixed, degrees": [still.blend.first, still.blend.second],
                    "progress u": round(still.blend.progress, 4),
                    "plan height, fraction of true": round(still.plan, 4),
                    "walls' height, fraction of true": round(still.walls, 4),
                    "apparent tilt, degrees": round(still.apparent, 2),
                    "worst point error, slide px": round(
                        float(
                            np.abs(outlines.of(still.blend) - outlines.at(tilt)).max()
                        ),
                        3,
                    ),
                }
            )
    result = {
        "pieces": len(train),
        "paths": sum(2 if isinstance(piece, Wall) else 1 for piece in train),
        "hold, s (at each stop, both ways)": HOLD,
        "rate, degrees per s": RATE,
        "zoom": ZOOM,
        "pivot": {"y": round(pivot.y, 2), "z": pivot.z},
        "file sizes, bytes (in out/)": sizes,
        "interpolation error at the middle of each interval, slide px": {
            f"every {step:g} degrees": round(
                interpolation_error(train, pivot, key_tilts(step)), 3
            )
            for step in sorted(
                {panel.step for panel in measured if panel.step is not None}
            )
        },
        "worst error over the way up, slide px": {
            panel.label: round(swing_error(outlines, panel), 3) for panel in measured
        },
        "1 - cos speed profiles (keySplines x1 y1 x2 y2; worst miss in u)": {
            f"{first:g}-{second:g}": {
                "keySplines": flat_curve(first, second)[0],
                "miss": round(flat_curve(first, second)[1], 5),
            }
            for panel in measured
            if panel.flat
            for first, second in itertools.pairwise(panel.tilts)
        },
        "stills: 1 - cos panels at the middle of each interval": stills,
        "side by side (the labels alone differ in about 100-800 pixels)": side_by_side,
    }
    (EVIDENCE / "tilt_animation.json").write_text(json.dumps(result, indent=1) + "\n")
    print(
        json.dumps(
            {key: value for key, value in result.items() if not key.startswith("side")},
            indent=1,
        )
    )


if __name__ == "__main__":
    main()

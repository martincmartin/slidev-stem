"""Measure frozen inputs and check the plan's geometry and timing equations.

Run this script from any directory. It writes JSON and an SVG into evidence/.
It uses the standard library and never reads the current project drawing.
"""

from __future__ import annotations

import gzip
import json
import math
import re
import xml.etree.ElementTree as element_tree
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

TASK = Path(__file__).resolve().parent
NUMBER = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?")


def local_name(element: element_tree.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def drawing_census(path: Path) -> dict[str, object]:
    data = path.read_bytes()
    root = element_tree.fromstring(data)
    tags = Counter(local_name(element) for element in root.iter())
    drawn: Counter[str] = Counter()

    def visit(element: element_tree.Element, in_definitions: bool) -> None:
        name = local_name(element)
        in_definitions = in_definitions or name == "defs"
        if not in_definitions and name in ("path", "circle", "rect"):
            drawn[name] += 1
        for child in element:
            visit(child, in_definitions)

    visit(root, False)
    animations: list[dict[str, object]] = []
    for element in root.iter():
        if local_name(element) not in ("animate", "animateTransform"):
            continue
        frames = element.attrib["values"].split(";")
        animations.append(
            {
                "element": local_name(element),
                "attribute": element.attrib["attributeName"],
                "duration": element.attrib["dur"],
                "frames": len(frames),
                "first_frame_numbers": len(NUMBER.findall(frames[0])),
                "first_frame_commands": dict(
                    sorted(
                        Counter(
                            re.findall(r"[MLCQZAHVSTmlcqzahvst]", frames[0])
                        ).items()
                    )
                ),
                "accumulate": element.get("accumulate", "none"),
            }
        )
    return {
        "path": str(path.relative_to(TASK)),
        "bytes": len(data),
        "gzip_bytes": len(gzip.compress(data, mtime=0)),
        "elements": dict(sorted(tags.items())),
        "drawn_shapes_excluding_defs": dict(sorted(drawn.items())),
        "drawn_shape_count": sum(drawn.values()),
        "part_labels": sorted(
            {
                element.attrib["data-part"]
                for element in root.iter()
                if "data-part" in element.attrib
            }
        ),
        "animations": animations,
    }


@dataclass(frozen=True)
class Point:
    x: float
    y: float
    z: float


def project(point: Point, angle_degrees: float) -> Point:
    angle = math.radians(angle_degrees)
    return Point(
        point.x,
        point.y * math.cos(angle) - point.z * math.sin(angle),
        point.y * math.sin(angle) + point.z * math.cos(angle),
    )


def depth_checks() -> dict[str, object]:
    first = Point(0, 2, 0)
    second = Point(0, 0, 1)
    crossing = math.degrees(math.atan(0.5))
    differences = [
        {
            "angle_degrees": angle,
            "depth_difference": project(first, angle).z - project(second, angle).z,
        }
        for angle in (0, 15, crossing, 45, 90)
    ]
    assert project(first, 0).z < project(second, 0).z
    assert project(first, 45).z > project(second, 45).z
    assert math.isclose(project(first, crossing).z, project(second, crossing).z)

    # Two non-intersecting vertical strips. A: y=x, x in [0, 10].
    # B: y=8, x in [9, 10]. Both extend from z=0 to z=3.
    # At x=9.5, projected Y=5, both strips cover the same pixel at 45 degrees.
    angle = 45.0
    screen_y = 5.0
    first_local = Point(9.5, 9.5, 9.5 - screen_y * math.sqrt(2))
    second_local = Point(9.5, 8, 8 - screen_y * math.sqrt(2))
    first_centroid = project(Point(5, 5, 1.5), angle)
    second_centroid = project(Point(9.5, 8, 1.5), angle)
    first_projection = project(first_local, angle)
    second_projection = project(second_local, angle)
    assert 0 <= first_local.z <= 3 and 0 <= second_local.z <= 3
    assert math.isclose(first_projection.y, second_projection.y)
    assert first_centroid.z < second_centroid.z
    assert first_projection.z > second_projection.z
    return {
        "centroid_order_crossing_degrees": crossing,
        "centroid_order_samples": differences,
        "centroid_crossing_is_not_itself_an_occlusion_proof": True,
        "overlapping_strips": {
            "angle_degrees": angle,
            "screen_x": first_projection.x,
            "screen_y": first_projection.y,
            "first_centroid_depth": first_centroid.z,
            "second_centroid_depth": second_centroid.z,
            "first_depth_at_overlap": first_projection.z,
            "second_depth_at_overlap": second_projection.z,
            "first_z_at_overlap": first_local.z,
            "second_z_at_overlap": second_local.z,
            "centroid_sort_is_wrong": True,
        },
    }


def stop_position(start: float, end: float, fraction: float) -> float:
    return start + (end - start) * (3 * fraction**2 - 2 * fraction**3)


def stop_velocity(start: float, end: float, fraction: float, duration: float) -> float:
    return (end - start) * 6 * fraction * (1 - fraction) / duration


def next_phase(time: float, period: float, phase: float) -> float:
    cycles = math.ceil((time - phase) / period)
    return phase + cycles * period


def timing_checks() -> dict[str, object]:
    period = 2.0
    amplitude = 150.0
    frame_duration = period / 24
    linear_velocity = amplitude * (math.cos(2 * math.pi / 24) - 1) / frame_duration
    samples = [
        {
            "fraction": fraction,
            "angle_degrees": stop_position(-amplitude, 0, fraction),
            "velocity_degrees_per_second": stop_velocity(-amplitude, 0, fraction, 0.8),
        }
        for fraction in (0, 0.25, 0.5, 0.75, 1)
    ]
    assert stop_position(-amplitude, 0, 0) == -amplitude
    assert stop_position(-amplitude, 0, 1) == 0
    assert stop_velocity(-amplitude, 0, 0, 0.8) == 0
    assert stop_velocity(-amplitude, 0, 1, 0.8) == 0
    phase_requests = [
        {
            "request_seconds": time,
            "boundary_seconds": next_phase(time, period, period / 2),
        }
        for time in (0.3, 1.0, 1.001, 2.8, 60.2)
    ]
    return {
        "period_seconds": period,
        "amplitude_degrees": amplitude,
        "tightest_phase_seconds": period / 2,
        "tightest_angle_degrees": -amplitude,
        "tightest_turns": (3.25 * 360 + amplitude) / 360,
        "loosest_turns": (3.25 * 360 - amplitude) / 360,
        "linear_keyframe_velocity_after_positive_peak_degrees_per_second": linear_velocity,
        "stop_samples": samples,
        "phase_requests": phase_requests,
    }


def resource_estimates() -> dict[str, object]:
    surfaces = [
        {
            "width": width,
            "height": height,
            "rgba_mib": width * height * 4 / 1024**2,
        }
        for width, height in ((1920, 1080), (3456, 1950), (3840, 2160))
    ]
    radius = 250.0
    angular_step = math.radians(1)
    return {
        "rgba_surfaces_excluding_browser_overhead": surfaces,
        "linear_angular_interpolation_bound_css_px": radius * angular_step**2 / 8,
        "nearest_frame_angular_error_bound_css_px": radius * angular_step / 2,
        "hypothetical_projection_clip": {
            "vertices": 1000,
            "angles_inclusive_0_to_90": 91,
            "float32_xy_bytes": 1000 * 91 * 2 * 4,
            "excludes": "topology, order, styles, compression, and adaptive samples",
        },
        "quadratic_visibility_pairs_for_2000_faces": 2000 * 1999 // 2,
    }


def write_depth_plot(path: Path) -> None:
    points = []
    for angle in range(91):
        depth = 2 * math.sin(math.radians(angle)) - math.cos(math.radians(angle))
        points.append(f"{60 + angle * 6:.2f},{210 - depth * 60:.2f}")
    crossing_x = 60 + math.degrees(math.atan(0.5)) * 6
    path.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" width="680" height="340" viewBox="0 0 680 340">\n'
        '<rect width="680" height="340" fill="#fff"/>\n'
        '<g font-family="Arial,sans-serif" font-size="14" fill="#2A2520">\n'
        '<text x="30" y="30" font-size="18">Stationary points can exchange centroid depth order</text>\n'
        '<text x="30" y="53">A=(0,2,0), B=(0,0,1); depth difference = 2 sin(angle) - cos(angle)</text>\n'
        '<path d="M60 75V280H610 M60 210H610" fill="none" stroke="#736A60"/>\n'
        f'<polyline points="{" ".join(points)}" fill="none" stroke="#143C6B" stroke-width="3"/>\n'
        f'<circle cx="{crossing_x:.2f}" cy="210" r="4" fill="#143C6B"/>\n'
        f'<text x="{crossing_x + 8:.2f}" y="235">26.565 degrees</text>\n'
        '<text x="30" y="94">+2</text><text x="38" y="215">0</text><text x="30" y="274">-1</text>\n'
        '<text x="57" y="300">0</text><text x="320" y="300">45</text><text x="590" y="300">90</text>\n'
        '<text x="225" y="325">Camera angle (degrees)</text>\n'
        "</g></svg>\n"
    )


def main() -> None:
    output = TASK / "evidence"
    output.mkdir(exist_ok=True)
    results = {
        "drawings": [
            drawing_census(TASK / "inputs/watches/public/cover/skeleton-watch.svg"),
            drawing_census(
                TASK
                / "inputs/watches/tasks/2026-09-25-canvas-2d-watch/spike/site/watch-1dp.svg"
            ),
        ],
        "prototype_lines": {
            name: len(
                (
                    TASK
                    / "inputs/watches/tasks/2026-09-25-canvas-2d-watch/spike/site"
                    / name
                )
                .read_text()
                .splitlines()
            )
            for name in ("watch_player.js", "watch_stage.js")
        },
        "depth": depth_checks(),
        "timing": timing_checks(),
        "resources": resource_estimates(),
    }
    (output / "assessment.json").write_text(json.dumps(results, indent=2) + "\n")
    write_depth_plot(output / "depth_order.svg")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()

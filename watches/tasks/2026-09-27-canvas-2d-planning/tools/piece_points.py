#!/usr/bin/env python3
"""How the work of projecting a tilting 3D view divides between faces and
walls: pieces, points in plan, and points that draw_cost/index.html writes
at each frame.

    ../../../../.venv/bin/python3 piece_points.py      # in tools/: 10 s

Uses the same scenes as draw_cost.py. At each frame, project() writes a
face's rings twice (the fill and the strokes). It writes a wall's top and
bottom polylines once for the fill, once more for each edge that is the
solid's own (strokeTop, strokeBottom), and two points for each vertical
line (the two ends and each inside corner). Writes
../evidence/piece_points.json.
"""

import json

from draw_cost import EVIDENCE, scene_data


def face_points(piece: dict[str, object]) -> tuple[int, int]:
    """Points in plan, and points written at each frame."""
    rings = piece["face"]
    assert isinstance(rings, list)
    plan = sum(len(ring) // 2 for ring in rings)
    return plan, 2 * plan


def wall_points(piece: dict[str, object]) -> tuple[int, int]:
    """Points in plan, and points written at each frame."""
    xs, corners = piece["xs"], piece["corners"]
    assert isinstance(xs, list)
    assert isinstance(corners, list)
    count = len(xs)
    edges = int(bool(piece["strokeTop"])) + int(bool(piece["strokeBottom"]))
    return count, (2 + edges) * count + 2 * (2 + len(corners))


def summary(pieces: list[dict[str, object]]) -> dict[str, object]:
    faces = [face_points(piece) for piece in pieces if "face" in piece]
    walls = [wall_points(piece) for piece in pieces if "xs" in piece]
    written = sum(row[1] for row in faces) + sum(row[1] for row in walls)
    return {
        "faces": len(faces),
        "walls": len(walls),
        "face points in plan": sum(row[0] for row in faces),
        "wall points in plan": sum(row[0] for row in walls),
        "face points written per frame": sum(row[1] for row in faces),
        "wall points written per frame": sum(row[1] for row in walls),
        "faces' share of points written": round(
            sum(row[1] for row in faces) / written, 3
        ),
    }


def main() -> None:
    result = {name: summary(pieces) for name, pieces in scene_data().items()}
    EVIDENCE.mkdir(exist_ok=True)
    (EVIDENCE / "piece_points.json").write_text(json.dumps(result, indent=1) + "\n")
    print(json.dumps(result, indent=1))


if __name__ == "__main__":
    main()

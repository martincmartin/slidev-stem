#!/usr/bin/env python3
"""The whole watch (no case, no strap), still, tilted 89 degrees: nearly a
side view, to see the heights at which each wheel's teeth meet the next
arbor's pinion.

    ../../../../.venv/bin/python3 side_view.py      # in tools/
    ../../../../.venv/bin/python3 svg_to_png.py ../evidence/depth/watch-tilt-89.svg

The heights are the ones depth_order.py gives the solids (its stacking
rules), not the heights of a real movement.
"""

from depth_order import (
    PICTURES,
    STATIC_TIME,
    Camera,
    OrderStats,
    Pose,
    build_solids,
    svg_picture,
)
from watch_svg import read_shapes

TILT = 89.0
ZOOM = 4.0  # the scene is about 60 px high at this tilt


def main() -> None:
    pose = Pose(build_solids(read_shapes()), STATIC_TIME)
    path = PICTURES / f"watch-tilt-{TILT:g}.svg"
    svg_picture(
        pose.slab(OrderStats()),
        Camera(TILT),
        path,
        f"The watch extruded, tilted {TILT:g} degrees, slab order",
        ZOOM,
    )
    print(f"wrote {path}")


if __name__ == "__main__":
    main()

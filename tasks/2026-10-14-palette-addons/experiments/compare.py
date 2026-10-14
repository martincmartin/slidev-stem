"""Compare two directories of exported PNGs, page by page.

Prints, as JSON, each page whose pixels differ: the number of pixels that
differ and the largest channel difference. A page in one directory only is
also listed. Exit status 1 if anything differs.
"""

import json
import pathlib
import sys

from PIL import Image, ImageChops


def differences(before: pathlib.Path, after: pathlib.Path) -> dict[str, object]:
    found: dict[str, object] = {}
    names = sorted({path.name for path in before.glob("*.png")} | {path.name for path in after.glob("*.png")})
    for name in names:
        if not (before / name).exists() or not (after / name).exists():
            found[name] = "missing in one"
            continue
        first = Image.open(before / name).convert("RGB")
        second = Image.open(after / name).convert("RGB")
        if first.size != second.size:
            found[name] = f"size {first.size} != {second.size}"
            continue
        difference = ImageChops.difference(first, second)
        if difference.getbbox() is None:
            continue
        changed = sum(1 for pixel in difference.getdata() if pixel != (0, 0, 0))
        largest = max(high for _, high in difference.getextrema())
        found[name] = {"pixels": changed, "largest": largest, "box": difference.getbbox()}
    return found


result = differences(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))
print(json.dumps({"pages": len(list(pathlib.Path(sys.argv[1]).glob("*.png"))), "differ": result}, indent=2))
sys.exit(1 if result else 0)

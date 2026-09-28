"""Compare two Slidev builds, ignoring Vue scope ids and content hashes.

    python3 compare_dist.py <dist before> <dist after>

Vue gives each component with scoped CSS an id, `data-v-<8 hex digits>`, made
from the component's path relative to the project. When node_modules moves,
the ids change, so the files that hold them change, and so do the content
hashes in their names (`entry-CLp95y6N.css`). This script replaces each id
with `data-v-ID` and removes each hash from names and references, and then
compares the files. Output: one line per difference, and a summary.
"""

import argparse
import re
import sys
from pathlib import Path

SCOPE_ID = re.compile(rb"data-v-[0-9a-f]{8}")
HASHED_NAME = re.compile(r"-[A-Za-z0-9_-]{8}(?=\.(?:js|css)$)")
HASHED_REFERENCE = re.compile(rb"-[A-Za-z0-9_-]{8}(?=\.(?:js|css)\b)")


def normalized_files(dist: Path) -> dict[Path, bytes]:
    """Each file of `dist`, by its path without a hash, as normalized bytes."""
    files: dict[Path, bytes] = {}
    for file in sorted(dist.rglob("*")):
        if not file.is_file():
            continue
        relative = file.relative_to(dist)
        unhashed = relative.with_name(HASHED_NAME.sub("", relative.name))
        if unhashed in files:
            sys.exit(f"two files are {unhashed} without their hash")
        content = SCOPE_ID.sub(b"data-v-ID", file.read_bytes())
        files[unhashed] = HASHED_REFERENCE.sub(b"", content)
    return files


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("before", type=Path)
    parser.add_argument("after", type=Path)
    arguments = parser.parse_args()
    before = normalized_files(arguments.before)
    after = normalized_files(arguments.after)
    differences = 0
    for path in sorted(before.keys() | after.keys()):
        if path not in after:
            print(f"only before: {path}")
        elif path not in before:
            print(f"only after:  {path}")
        elif before[path] != after[path]:
            print(f"differs:     {path}")
        else:
            continue
        differences += 1
    print(f"{len(before)} files before, {len(after)} after, {differences} differ")
    sys.exit(1 if differences else 0)


if __name__ == "__main__":
    main()

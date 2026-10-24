#!/usr/bin/env python3
"""Compare two Slidev builds, ignoring Vue scope ids and content hashes.

    uv run tools/compare_dist.py <dist before> <dist after>

Vue gives each component with scoped CSS an id, `data-v-<8 hex digits>`, made
from the component's path relative to the project. When node_modules moves,
the ids change, so the files that hold them change, and so do the content
hashes in their names (`entry-CLp95y6N.css`). This script replaces each id
with `data-v-ID` and removes each hash from names and references, and then
compares the files. Output: one line per difference, and a summary.

Without its hash, a name can belong to many files: Slidev makes one
`md-<hash>.js` chunk for each slide. So the script compares the files of each
name as a multiset of normalized contents. It does not see two files of one
name that swap their contents, and a reference to such a file no longer says
which one it is.
"""

import argparse
import re
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

SCOPE_ID = re.compile(rb"data-v-[0-9a-f]{8}")
HASHED_NAME = re.compile(r"-[A-Za-z0-9_-]{8}(?=\.(?:js|css)$)")
HASHED_REFERENCE = re.compile(rb"-[A-Za-z0-9_-]{8}(?=\.(?:js|css)\b)")


@dataclass(frozen=True)
class Difference:
    """The files of one name, without its hash, that are not the same."""

    path: Path
    before: int  # the number of files of this name before
    after: int


def normalized_files(dist: Path) -> dict[Path, Counter[bytes]]:
    """The normalized contents of `dist`'s files, by path without a hash."""
    files: dict[Path, Counter[bytes]] = {}
    for file in sorted(dist.rglob("*")):
        if not file.is_file():
            continue
        relative = file.relative_to(dist)
        unhashed = relative.with_name(HASHED_NAME.sub("", relative.name))
        content = SCOPE_ID.sub(b"data-v-ID", file.read_bytes())
        files.setdefault(unhashed, Counter())[HASHED_REFERENCE.sub(b"", content)] += 1
    return files


def differences(
    before: dict[Path, Counter[bytes]], after: dict[Path, Counter[bytes]]
) -> list[Difference]:
    """Each path whose files are not the same in `before` and `after`."""
    empty: Counter[bytes] = Counter()
    return [
        Difference(
            path, before.get(path, empty).total(), after.get(path, empty).total()
        )
        for path in sorted(before.keys() | after.keys())
        if before.get(path) != after.get(path)
    ]


def describe(difference: Difference) -> str:
    if not difference.after:
        return f"only before: {difference.path}"
    if not difference.before:
        return f"only after:  {difference.path}"
    if difference.before == difference.after == 1:
        return f"differs:     {difference.path}"
    return f"differs:     {difference.path} ({difference.before} files before, {difference.after} after)"


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("before", type=Path)
    parser.add_argument("after", type=Path)
    arguments = parser.parse_args()
    before = normalized_files(arguments.before)
    after = normalized_files(arguments.after)
    found = differences(before, after)
    for difference in found:
        print(describe(difference))
    before_count = sum(counter.total() for counter in before.values())
    after_count = sum(counter.total() for counter in after.values())
    print(f"{before_count} files before, {after_count} after, {len(found)} differ")
    sys.exit(1 if found else 0)


if __name__ == "__main__":
    main()

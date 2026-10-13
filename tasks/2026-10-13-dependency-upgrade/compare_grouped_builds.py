"""Compare normalized builds, including chunks with the same base name."""

import argparse
from collections import Counter
from pathlib import Path

from compare_dist import HASHED_NAME, HASHED_REFERENCE, SCOPE_ID


def groups(directory: Path) -> dict[Path, Counter[bytes]]:
    result: dict[Path, Counter[bytes]] = {}
    for file in sorted(directory.rglob("*")):
        if not file.is_file():
            continue
        relative = file.relative_to(directory)
        name = relative.with_name(HASHED_NAME.sub("", relative.name))
        content = HASHED_REFERENCE.sub(
            b"", SCOPE_ID.sub(b"data-v-ID", file.read_bytes())
        )
        result.setdefault(name, Counter())[content] += 1
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before", type=Path)
    parser.add_argument("after", type=Path)
    arguments = parser.parse_args()
    before = groups(arguments.before)
    after = groups(arguments.after)
    changed = 0
    for name in sorted(before.keys() | after.keys()):
        old = before.get(name, Counter())
        new = after.get(name, Counter())
        if old != new:
            changed += 1
            print(
                f"{name}: {sum((old - new).values())} removed, {sum((new - old).values())} added normalized contents"
            )
    print(f"{len(before)} groups before, {len(after)} after, {changed} differ")


if __name__ == "__main__":
    main()

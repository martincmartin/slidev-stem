"""Print every package in a `pnpm list --depth Infinity --json` output.

    python3 flatten_pnpm_list.py evidence/before/pnpm-list-watches.json

One `name@version` per line, sorted and without repeats. Two runs can then be
compared with `diff`: the same lines mean the same resolved versions.
"""

import argparse
import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any


def packages(node: dict[str, Any]) -> Iterator[str]:
    """Yield `name@version` for each dependency below `node`, at any depth."""
    for group in ("dependencies", "devDependencies", "optionalDependencies"):
        for name, child in node.get(group, {}).items():
            version = child.get("version", "?")
            if version.startswith("link:"):
                version = "link"  # a local package: its path is not a version
            yield f"{name}@{version}"
            yield from packages(child)


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("listing", type=Path, help="output of pnpm list --json")
    arguments = parser.parse_args()
    projects: list[dict[str, Any]] = json.loads(arguments.listing.read_text())
    lines = {line for project in projects for line in packages(project)}
    print("\n".join(sorted(lines)))


if __name__ == "__main__":
    main()

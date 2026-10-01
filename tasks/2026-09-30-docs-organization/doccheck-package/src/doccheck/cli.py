"""doccheck: check a project's Markdown docs.

    doccheck PATH... [--skip NAME]... [--tools DIR]... [--json]

Each PATH is a Markdown file, or a directory whose `*.md` files are checked,
at any depth. A directory whose name starts with `.`, `node_modules`, and each
`--skip NAME` are not entered. Give the paths explicitly: there is no default
of "the whole repository". The checks are in `doccheck.checks`.

It exits 1 if it finds anything, and 2 if the arguments are wrong.
"""

import argparse
import json
import sys
from collections.abc import Iterable, Sequence
from pathlib import Path

from doccheck.checks import Finding, check
from doccheck.markdown import Document

ALWAYS_SKIPPED = frozenset({"node_modules"})


def markdown_files(paths: Iterable[Path], skip: frozenset[str]) -> list[Path]:
    """The Markdown files in `paths`, resolved, each once, in order."""
    found: dict[Path, None] = {}
    for path in paths:
        if path.is_file():
            found[path.resolve()] = None
            continue
        for candidate in sorted(path.rglob("*.md")):
            parts = candidate.relative_to(path).parts[:-1]
            if not any(part.startswith(".") or part in skip for part in parts):
                found[candidate.resolve()] = None
    return list(found)


def shown(path: Path) -> str:
    return str(path.relative_to(Path.cwd(), walk_up=True))


def report(findings: Sequence[Finding], checked: int) -> str:
    lines = [
        f"{shown(finding.path)}:{finding.line}: {finding.kind.value}: {finding.subject}"
        for finding in sorted(
            findings, key=lambda finding: (finding.path, finding.line)
        )
    ]
    verdict = f"{len(findings)} findings" if findings else "no findings"
    return "\n".join([*lines, f"{verdict} in {checked} Markdown files"])


def as_json(findings: Sequence[Finding], checked: int) -> str:
    return json.dumps(
        {
            "files": checked,
            "findings": [
                {
                    "path": shown(finding.path),
                    "line": finding.line,
                    "kind": finding.kind.value,
                    "subject": finding.subject,
                }
                for finding in findings
            ],
        },
        indent=1,
    )


def main(arguments: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="doccheck", description="Check a project's Markdown docs."
    )
    parser.add_argument(
        "paths", nargs="+", type=Path, help="Markdown files or directories"
    )
    parser.add_argument(
        "--skip",
        action="append",
        default=[],
        metavar="NAME",
        help="a directory name to skip",
    )
    parser.add_argument(
        "--tools",
        action="append",
        default=[],
        type=Path,
        metavar="DIR",
        help="a tools directory whose files the docs name",
    )
    parser.add_argument(
        "--json", action="store_true", help="print the findings as JSON"
    )
    parsed = parser.parse_args(arguments)
    for path in [*parsed.paths, *parsed.tools]:
        if not path.exists():
            parser.error(f"{path} does not exist")
    files = markdown_files(parsed.paths, ALWAYS_SKIPPED | set(parsed.skip))
    documents = [Document.read(path) for path in files]
    findings = check(documents, [tools.resolve() for tools in parsed.tools])
    print(
        as_json(findings, len(files)) if parsed.json else report(findings, len(files))
    )
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())

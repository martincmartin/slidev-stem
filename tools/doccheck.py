#!/usr/bin/env python3
"""Do the docs still hold together? Links, anchors, indexes and tool paths.

    uv run tools/doccheck.py PATH... [--skip NAME]... [--tools DIR]... [--json]
    uv run tools/doccheck.py docs tools themes README.md AGENTS.md --tools tools

Each PATH is a Markdown file, or a directory whose `*.md` files are checked,
at any depth. A directory whose name starts with `.`, `node_modules`, and each
`--skip NAME` are not entered. Give the paths explicitly: never a `tasks/`
directory (a finished task is frozen) or a given talk. It exits 1 if it finds
anything, and 2 if the arguments are wrong. validate.py runs it.

Stdlib only. The checks, each of which returns findings:

  * missing file: a relative link's file does not exist. A URL with a scheme
    (`https:`), and a path that starts with `/` (the deck's own public path),
    are not checked.
  * missing anchor: a link's `#anchor` is not a heading (GitHub's slug) or an
    HTML `id` of that Markdown file.
  * no index: a `docs/` directory has no `docs/README.md`, or no `AGENTS.md`
    beside it (global AGENTS.md, "Docs").
  * not indexed: a doc in `docs/` is not named in one of those two indexes, by
    a link or in code (`docs/theme.md`).
  * missing tool: code in a doc names a file in a `--tools DIR` that does not
    exist: `tools/x.py`, `../tools/x.py` or `stem/tools/x.py`.

It does not check whether a fact in a doc is still true. A parent's
`AGENTS.md` does not list its sub-projects, so that is not checked either: an
agent that works in one talk must not be pointed at the others.

It reads Markdown with regular expressions, not a full parser: ATX headings
(`## Title`), inline links and images, reference definitions (`[id]: target`),
HTML `href`, `src`, `id` and `name` attributes, code spans and fenced code
blocks. A link inside code is not a link.
"""

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from urllib.parse import unquote

# --- reading a Markdown file ---------------------------------------------------

FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})")
HEADING = re.compile(r"^ {0,3}#{1,6}[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$")
CODE_SPAN = re.compile(r"(`+)(.+?)\1")
INLINE_LINK = re.compile(r"\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+(?:\"[^\"]*\"|'[^']*'))?\s*\)")
REFERENCE = re.compile(r"^ {0,3}\[[^\]]+\]:\s*(<[^>]*>|\S+)")
HTML_TARGET = re.compile(r"\b(?:href|src)\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE)
HTML_ANCHOR = re.compile(r"\b(?:id|name)\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE)
MARKDOWN_LINK = re.compile(r"!?\[([^\]]*)\]\([^)]*\)")
HTML_TAG = re.compile(r"<[^>]+>")


@dataclass(frozen=True)
class Link:
    """A link's target as written (`../docs/theme.md#the-gates`)."""

    target: str
    line: int


@dataclass(frozen=True)
class Code:
    """The text of a code span, or one line of a fenced code block."""

    text: str
    line: int


@dataclass(frozen=True)
class Document:
    path: Path
    anchors: frozenset[str]
    links: tuple[Link, ...]
    code: tuple[Code, ...]

    @classmethod
    def read(cls, path: Path) -> Document:
        """Read `path`, which must be a Markdown file."""
        return parse(path, path.read_text(encoding="utf-8"))


def slug(heading: str) -> str:
    """The anchor that GitHub gives a heading's text, before the suffix that a
    repeated heading gets: lower case, punctuation removed except `-` and `_`,
    each space a `-`."""
    text = MARKDOWN_LINK.sub(r"\1", heading)
    text = HTML_TAG.sub("", text).replace("`", "").replace("*", "").lower()
    kept = "".join(
        character
        for character in text
        if character in " -_" or unicodedata.category(character)[0] in "LN"
    )
    return kept.replace(" ", "-")


def parse(path: Path, text: str) -> Document:
    """The document at `path`, whose text is `text`."""
    anchors: set[str] = set()
    seen: Counter[str] = Counter()
    links: list[Link] = []
    code: list[Code] = []
    fence: str | None = None
    for number, line in enumerate(text.splitlines(), start=1):
        if fence is not None:
            if line.strip().startswith(fence):
                fence = None
            else:
                code.append(Code(line, number))
            continue
        if opening := FENCE.match(line):
            fence = opening.group(1)
            continue
        if heading := HEADING.match(line):
            base = slug(heading.group(1))
            anchors.add(f"{base}-{seen[base]}" if seen[base] else base)
            seen[base] += 1
        code.extend(
            Code(span.group(2).strip(), number) for span in CODE_SPAN.finditer(line)
        )
        prose = CODE_SPAN.sub(lambda span: " " * len(span.group(0)), line)
        for pattern in (INLINE_LINK, REFERENCE, HTML_TARGET):
            links.extend(
                Link(found.group(1).strip("<>"), number)
                for found in pattern.finditer(prose)
            )
        anchors.update(found.group(1) for found in HTML_ANCHOR.finditer(prose))
    return Document(path, frozenset(anchors), tuple(links), tuple(code))


# --- the checks ----------------------------------------------------------------

SCHEME = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")
TRAILING = ",.;:)"


class Kind(Enum):
    MISSING_FILE = "missing file"
    MISSING_ANCHOR = "missing anchor"
    NO_INDEX = "no index"
    NOT_INDEXED = "not indexed"
    MISSING_TOOL = "missing tool"


@dataclass(frozen=True)
class Finding:
    path: Path
    line: int
    kind: Kind
    #: What was not found, as the document wrote it, or the file concerned.
    subject: str


class Library:
    """The documents of one run, each read once. It reads a document that is
    not checked (the target of a link) when a check first needs it."""

    def __init__(self, documents: Iterable[Document]) -> None:
        self._documents = {document.path: document for document in documents}

    def get(self, path: Path) -> Document:
        if path not in self._documents:
            self._documents[path] = Document.read(path)
        return self._documents[path]


def resolve(base: Path, target: str) -> Path:
    return (base / unquote(target)).resolve()


def is_local(target: str) -> bool:
    """Whether a link's target is a path in the repository."""
    return not SCHEME.match(target) and not target.startswith("/")


def check_links(documents: Sequence[Document], library: Library) -> list[Finding]:
    findings: list[Finding] = []
    for document in documents:
        for link in document.links:
            if not is_local(link.target):
                continue
            path_part, _, anchor = link.target.partition("#")
            destination = (
                resolve(document.path.parent, path_part) if path_part else document.path
            )
            if not destination.exists():
                findings.append(
                    Finding(document.path, link.line, Kind.MISSING_FILE, link.target)
                )
            elif (
                anchor
                and destination.suffix == ".md"
                and unquote(anchor) not in library.get(destination).anchors
            ):
                findings.append(
                    Finding(document.path, link.line, Kind.MISSING_ANCHOR, link.target)
                )
    return findings


def named_paths(index: Document) -> set[Path]:
    """The paths that an index names: its link targets, and each word of its
    code that is a path to something that exists."""
    base = index.path.parent
    named = {
        resolve(base, link.target.partition("#")[0])
        for link in index.links
        if is_local(link.target)
    }
    for code in index.code:
        for word in code.text.split():
            candidate = resolve(base, word.rstrip(TRAILING))
            if candidate.exists():
                named.add(candidate)
    return named


def check_indexes(documents: Sequence[Document], library: Library) -> list[Finding]:
    findings: list[Finding] = []
    directories = sorted(
        {doc.path.parent for doc in documents if doc.path.parent.name == "docs"}
    )
    for directory in directories:
        members = sorted(
            path.resolve()
            for path in directory.glob("*.md")
            if path.name != "README.md"
        )
        for index_path in (directory / "README.md", directory.parent / "AGENTS.md"):
            if not index_path.is_file():
                findings.append(Finding(index_path, 0, Kind.NO_INDEX, directory.name))
                continue
            named = named_paths(library.get(index_path.resolve()))
            findings.extend(
                Finding(index_path, 0, Kind.NOT_INDEXED, member.name)
                for member in members
                if member not in named
            )
    return findings


def tool_pattern(tools: Path) -> re.Pattern[str]:
    """A path into `tools` as a doc writes it: `tools/x.py`, with no prefix,
    with `../` prefixes, or with the name of the directory that holds
    `tools`. Not a `tools/` deeper in another path (a task's own tools)."""
    prefix = rf"(?:(?:\.\./)+|{re.escape(tools.parent.name)}/)?"
    return re.compile(
        rf"(?<![\w./-]){prefix}{re.escape(tools.name)}/([\w.-]+(?:/[\w.-]+)*\.\w+)"
    )


def check_tools(documents: Sequence[Document], tools: Sequence[Path]) -> list[Finding]:
    findings: list[Finding] = []
    for directory in tools:
        pattern = tool_pattern(directory)
        for document in documents:
            for code in document.code:
                findings.extend(
                    Finding(document.path, code.line, Kind.MISSING_TOOL, found.group(0))
                    for found in pattern.finditer(code.text)
                    if not (directory / found.group(1)).exists()
                )
    return findings


def check(documents: Sequence[Document], tools: Sequence[Path]) -> list[Finding]:
    """Every check, on `documents`. `tools` are the tools directories that a
    doc may name."""
    library = Library(documents)
    return [
        *check_links(documents, library),
        *check_indexes(documents, library),
        *check_tools(documents, tools),
    ]


# --- the command line ----------------------------------------------------------

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
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
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

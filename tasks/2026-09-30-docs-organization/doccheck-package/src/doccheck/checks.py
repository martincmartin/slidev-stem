"""The checks. Each takes the documents to check and returns findings; none
prints. A finding holds objects, and the command line turns them into text.

- Links: each relative link's file exists, and its `#anchor` is a heading (or
  an HTML `id`) of that file. A URL with a scheme, and a path that starts with
  `/` (a web site's own path), are not checked.
- Indexes: for each `docs/` directory that holds a checked document, each
  `*.md` in it (but `README.md`) is named in `docs/README.md` and in the
  `AGENTS.md` beside `docs/`, by a link or in code (`docs/theme.md`).
- Tools: in code, each path into a tools directory exists
  (`tools/palette.py`, `../tools/validate.py`, `stem/tools/lib.py`).
"""

import re
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from urllib.parse import unquote

from doccheck.markdown import Document

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


def check_links(documents: Sequence[Document], library: Library) -> list[Finding]:
    findings: list[Finding] = []
    for document in documents:
        for link in document.links:
            if SCHEME.match(link.target) or link.target.startswith("/"):
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
        if not SCHEME.match(link.target) and not link.target.startswith("/")
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
    `tools`. Not a `tools/` deeper in another path."""
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

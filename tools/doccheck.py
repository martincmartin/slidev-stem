#!/usr/bin/env python3
"""Do the docs still hold together? Links, anchors, indexes and tool paths.

    uv run tools/doccheck.py PATH... [--skip NAME]... [--tools DIR]... [--json]
    uv run tools/doccheck.py docs tools themes README.md AGENTS.md --tools tools

Each PATH is a Markdown file, or a directory whose `*.md` files are checked,
at any depth. A directory whose name starts with `.`, `node_modules`, and each
`--skip NAME` are not entered. Give the paths explicitly: never a `tasks/`
directory (a finished task is frozen) or a given talk. It exits 0 if it finds
nothing, 1 if it finds anything, 2 if the arguments are wrong, and 3 if it
cannot read a PATH or fails (a bug in doccheck). validate.py runs it.

Stdlib only. The checks, each of which returns findings:

  * missing file: a relative link's file does not exist, or only with other
    capitals (GitHub's file names are case-sensitive; macOS's are not). A URL
    with a scheme (`https:`), and a path that starts with `/` (the deck's own
    public path), are not checked.
  * invalid link, unreadable file: a link's target is not a possible path, or
    it is a Markdown file that has an `#anchor` and cannot be read.
  * missing anchor: a link's `#anchor` is not a heading (GitHub's slug) or an
    HTML `id` of that Markdown file.
  * no index: a `docs/` directory has no `docs/README.md`, or no `AGENTS.md`
    beside it (global AGENTS.md, "Docs").
  * not indexed: a doc in `docs/` is not named in one of those two indexes, by
    a link or in code (`docs/theme.md`).
  * missing tool: code in a doc names a file in a `--tools DIR` that does not
    exist: `tools/x.py`, `../tools/x.py` or `stem/tools/x.py` (`stem` is the
    name that the docs give the repository root, not its directory on disk).

It does not check whether a fact in a doc is still true. A parent's
`AGENTS.md` does not list its sub-projects, so that is not checked either: an
agent that works in one talk must not be pointed at the others.

It reads Markdown with regular expressions, not a full parser: YAML front
matter, ATX headings (`## Title`), inline links and images, reference
definitions (`[id]: target`), the `href`, `src`, `id` and `name` attributes of
HTML tags, code spans (which may wrap onto the next line of a paragraph) and
fenced code blocks. A link inside code or an HTML comment is not a link. Known
limits: an indented fence closes at any indentation; `\\[` is the only escape
that it understands; an inline link whose text has no `[` before it is ignored;
a footnote definition (`[^1]:`) is not a link. A link's line is the line where
the link starts.
"""

import argparse
import json
import os
import re
import sys
import traceback
import unicodedata
from collections import Counter
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from urllib.parse import unquote

# --- reading a Markdown file ---------------------------------------------------

FENCE = re.compile(r"^ *(`{3,}|~{3,})")
HEADING = re.compile(r"^ {0,3}#{1,6}[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$")
HTML_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
CODE_SPAN = re.compile(r"(`+)(.+?)\1", re.DOTALL)
ESCAPED_BRACKET = re.compile(r"\\\[")
# The target may hold one level of balanced parentheses: `foo_(bar).md`.
INLINE_LINK = re.compile(
    r"\]\(\s*(<[^>]*>|(?:[^\s()]|\([^\s()]*\))+)(?:\s+(?:\"[^\"]*\"|'[^']*'))?\s*\)"
)
REFERENCE = re.compile(r"^ {0,3}\[(?!\^)[^\]]+\]:\s*(<[^>]*>|\S+)", re.MULTILINE)
HTML_TAG = re.compile(r"<[A-Za-z][^>]*>")
HTML_TARGET = re.compile(
    r"(?<![\w-])(?:href|src)\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE
)
HTML_ANCHOR = re.compile(
    r"(?<![\w-])(?:id|name)\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE
)
MARKDOWN_LINK = re.compile(r"!?\[([^\]]*)\]\([^)]*\)")
EMPHASIS_UNDERSCORE = re.compile(r"(?<!\w)_(.+?)_(?!\w)")


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
    """A Markdown file. Its `path` is resolved: `parse` makes it so."""

    path: Path
    anchors: frozenset[str]
    links: tuple[Link, ...]
    code: tuple[Code, ...]

    @classmethod
    def read(cls, path: Path) -> Document:
        """Read `path`, which must be a Markdown file. Raises `OSError` if it
        cannot be read, and `ValueError` if it is not UTF-8."""
        return parse(path, path.read_text(encoding="utf-8"))


def slug(heading: str) -> str:
    """The anchor that GitHub gives a heading's text, before the suffix that a
    repeated heading gets: lower case, punctuation removed except `-` and `_`,
    each space a `-`."""
    text = MARKDOWN_LINK.sub(r"\1", heading)
    text = EMPHASIS_UNDERSCORE.sub(r"\1", HTML_TAG.sub("", text))
    text = unicodedata.normalize("NFC", text).replace("*", "").lower()
    kept = "".join(
        character
        for character in text
        if character in " -_" or unicodedata.category(character)[0] in "LNM"
    )
    return kept.replace(" ", "-")


def unique_slugs(bases: Iterable[str]) -> set[str]:
    """The anchors of headings whose slugs are `bases`, in order. Like GitHub
    (github-slugger), a repeat gets the first `-N` that no heading has taken."""
    taken: set[str] = set()
    repeats: Counter[str] = Counter()
    for base in bases:
        anchor = base
        while anchor in taken:
            repeats[base] += 1
            anchor = f"{base}-{repeats[base]}"
        taken.add(anchor)
    return taken


def blanked(match: re.Match[str]) -> str:
    """Spaces as long as `match`, with its line breaks kept: text changes
    nothing about where the following text is."""
    return re.sub(r"[^\n]", " ", match.group(0))


def blank_front_matter(lines: list[str]) -> list[str]:
    """`lines` with the YAML front matter, if there is one, emptied."""
    if lines and lines[0].strip() == "---":
        for index in range(1, len(lines)):
            if lines[index].strip() in ("---", "..."):
                return [""] * (index + 1) + lines[index + 1 :]
    return lines


def split_fences(lines: list[str]) -> tuple[list[str], list[Code]]:
    """`lines` with each fenced block emptied (so the line numbers stay), and
    the lines of those blocks. A fence closes on a line of the same character,
    at least as long, with nothing after it."""
    prose: list[str] = []
    code: list[Code] = []
    fence: tuple[str, int] | None = None
    for number, line in enumerate(lines, start=1):
        if fence is None:
            if opening := FENCE.match(line):
                marker = opening.group(1)
                fence = (marker[0], len(marker))
                prose.append("")
            else:
                prose.append(line)
            continue
        prose.append("")
        character, length = fence
        if re.fullmatch(rf" *{re.escape(character)}{{{length},}}[ \t]*", line):
            fence = None
        else:
            code.append(Code(line, number))
    return prose, code


def split_blocks(lines: list[str]) -> tuple[list[tuple[int, str]], list[str]]:
    """The blocks of prose in `lines`, each as its first line number and its
    text, and the slug of each heading. A heading is a block of its own; blank
    lines separate the others."""
    blocks: list[tuple[int, str]] = []
    slugs: list[str] = []
    current: list[str] = []
    start = 0

    def flush() -> None:
        if current:
            blocks.append((start, "\n".join(current)))
            current.clear()

    for number, line in enumerate(lines, start=1):
        if not line.strip():
            flush()
        elif heading := HEADING.match(line):
            flush()
            slugs.append(slug(heading.group(1)))
            blocks.append((number, line))
        else:
            if not current:
                start = number
            current.append(line)
    flush()
    return blocks, slugs


def scan_block(start: int, text: str) -> tuple[list[Code], list[Link], set[str]]:
    """The code spans, links and HTML ids in one block that starts at line
    `start`."""

    def line_at(offset: int) -> int:
        return start + text.count("\n", 0, offset)

    code = [
        Code(span.group(2).replace("\n", " ").strip(), line_at(span.start()))
        for span in CODE_SPAN.finditer(text)
    ]
    prose = ESCAPED_BRACKET.sub("  ", CODE_SPAN.sub(blanked, text))
    links = [
        Link(found.group(1).strip("<>"), line_at(found.start()))
        for found in INLINE_LINK.finditer(prose)
        if "[" in prose[: found.start()]
    ]
    links.extend(
        Link(found.group(1).strip("<>"), line_at(found.start()))
        for found in REFERENCE.finditer(prose)
    )
    anchors: set[str] = set()
    for tag in HTML_TAG.finditer(prose):
        links.extend(
            Link(found.group(1), line_at(tag.start()))
            for found in HTML_TARGET.finditer(tag.group(0))
        )
        anchors.update(found.group(1) for found in HTML_ANCHOR.finditer(tag.group(0)))
    return code, links, anchors


def parse(path: Path, text: str) -> Document:
    """The document at `path`, whose text is `text`."""
    prose, code = split_fences(blank_front_matter(text.splitlines()))
    uncommented = HTML_COMMENT.sub(blanked, "\n".join(prose)).split("\n")
    blocks, slugs = split_blocks(uncommented)
    anchors = unique_slugs(slugs)
    links: list[Link] = []
    for start, block in blocks:
        block_code, block_links, block_anchors = scan_block(start, block)
        code.extend(block_code)
        links.extend(block_links)
        anchors.update(block_anchors)
    code.sort(key=lambda item: item.line)  # document order; the sort is stable
    return Document(path.resolve(), frozenset(anchors), tuple(links), tuple(code))


# --- the checks ----------------------------------------------------------------

SCHEME = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")
PUNCTUATION_AFTER_PATH = ",.;:)"
# How the docs write the root of the repository in a path (`stem/tools/x.py`).
# It is not the name of the directory on disk: a clone may have any name.
REPOSITORY = "stem"


class Kind(Enum):
    MISSING_FILE = "missing file"
    MISSING_ANCHOR = "missing anchor"
    NO_INDEX = "no index"
    NOT_INDEXED = "not indexed"
    MISSING_TOOL = "missing tool"
    INVALID_TARGET = "invalid link"
    UNREADABLE = "unreadable file"


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
        """The document at `path`. Raises `OSError` or `ValueError` if it
        cannot be read."""
        path = path.resolve()
        if path not in self._documents:
            self._documents[path] = Document.read(path)
        return self._documents[path]


def resolve(base: Path, target: str) -> Path:
    return (base / unquote(target)).resolve()


def exists_exactly(path: Path, near: Path) -> bool:
    """Whether `path` exists, with the capitals of every name below its common
    ancestor with `near`. A macOS volume finds `Theme.md` for `theme.md`;
    GitHub does not. Both paths must be absolute."""
    if not path.exists():
        return False
    current = Path(os.path.commonpath([path, near]))
    for name in path.relative_to(current).parts:
        if all(child.name != name for child in current.iterdir()):
            return False
        current /= name
    return True


def is_local(target: str) -> bool:
    """Whether a link's target is a path in the repository."""
    return not SCHEME.match(target) and not target.startswith("/")


def check_link(document: Document, link: Link, library: Library) -> Finding | None:
    """What is wrong with `link`, a link in `document`, if anything."""
    if not is_local(link.target):
        return None

    def found(kind: Kind) -> Finding:
        return Finding(document.path, link.line, kind, link.target)

    path_part, _, anchor = link.target.partition("#")
    try:
        destination = (
            resolve(document.path.parent, path_part) if path_part else document.path
        )
        exists = exists_exactly(destination, document.path.parent)
    except OSError, ValueError:
        return found(Kind.INVALID_TARGET)
    if not exists:
        return found(Kind.MISSING_FILE)
    if anchor and destination.suffix == ".md":
        try:
            anchors = library.get(destination).anchors
        except OSError, ValueError:
            return found(Kind.UNREADABLE)
        if unquote(anchor) not in anchors:
            return found(Kind.MISSING_ANCHOR)
    return None


def check_links(documents: Sequence[Document], library: Library) -> list[Finding]:
    results = (
        check_link(document, link, library)
        for document in documents
        for link in document.links
    )
    return [finding for finding in results if finding is not None]


def named_paths(index: Document) -> set[Path]:
    """The paths that an index names: its link targets, and each word of its
    code that is a path to something that exists. It is lenient: a word in a
    sentence like "do not read `docs/x.md`" counts as naming it."""
    base = index.path.parent
    named = {
        resolve(base, link.target.partition("#")[0])
        for link in index.links
        if is_local(link.target)
    }
    for code in index.code:
        for word in code.text.split():
            candidate = resolve(base, word.rstrip(PUNCTUATION_AFTER_PATH))
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
    with `../` prefixes, or with `REPOSITORY/`. Not a `tools/` deeper in
    another path (a task's own tools)."""
    prefix = rf"(?:(?:\.\./)+|{re.escape(REPOSITORY)}/)?"
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
                    if not exists_exactly(directory / found.group(1), directory)
                )
    return findings


def check(documents: Sequence[Document], tools: Sequence[Path]) -> list[Finding]:
    """Every check, on `documents`, sorted by place. The paths of `documents`
    and `tools` must be absolute. `tools` are the tools directories that a doc
    may name."""
    library = Library(documents)
    findings = [
        *check_links(documents, library),
        *check_indexes(documents, library),
        *check_tools(documents, tools),
    ]
    return sorted(
        findings,
        key=lambda finding: (finding.path, finding.line, finding.kind.value),
    )


# --- the command line ----------------------------------------------------------

ALWAYS_SKIPPED = frozenset({"node_modules"})


def markdown_files(paths: Iterable[Path], skip: frozenset[str]) -> list[Path]:
    """The Markdown files in `paths`, resolved, each once, in order. It does
    not enter a skipped directory."""
    found: dict[Path, None] = {}  # an ordered set
    for path in paths:
        if path.is_file():
            found[path.resolve()] = None
            continue
        for directory, names, files in path.walk():
            names[:] = sorted(
                name for name in names if not name.startswith(".") and name not in skip
            )
            for name in sorted(files):
                if name.endswith(".md"):
                    found[(directory / name).resolve()] = None
    return list(found)


def shown(path: Path) -> str:
    # lib.display_path does this too, but doccheck imports only the stdlib.
    return str(path.relative_to(Path.cwd(), walk_up=True))


def report(findings: Sequence[Finding], checked: int) -> str:
    lines = [
        f"{shown(finding.path)}:{finding.line}: {finding.kind.value}: {finding.subject}"
        for finding in findings
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
    for path in parsed.paths:
        if path.is_file() and path.suffix != ".md":
            parser.error(f"{path} is not a Markdown file")
    for path in parsed.tools:
        if not path.is_dir():
            parser.error(f"{path} is not a directory")
    files = markdown_files(parsed.paths, ALWAYS_SKIPPED | set(parsed.skip))
    try:
        documents = [Document.read(path) for path in files]
    except (OSError, ValueError) as error:
        print(f"doccheck: cannot read a file: {error}", file=sys.stderr)
        return 3
    findings = check(documents, [tools.resolve() for tools in parsed.tools])
    print(
        as_json(findings, len(files)) if parsed.json else report(findings, len(files))
    )
    return 1 if findings else 0


def run() -> int:
    """`main`, with exit 3 for a failure of doccheck itself: exit 1 is only
    for findings in the docs."""
    try:
        return main()
    except Exception:  # noqa: BLE001 - any failure is exit 3, with its traceback
        traceback.print_exc()
        return 3


if __name__ == "__main__":
    sys.exit(run())

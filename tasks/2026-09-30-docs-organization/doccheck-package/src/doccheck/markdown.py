"""What doccheck reads from a Markdown file: the anchors of its headings, its
links, and its code (code spans and fenced blocks), each with its line number.

It is not a full Markdown parser. It knows ATX headings (`## Title`), inline
links and images (`[text](target)`), reference definitions (`[id]: target`),
HTML `href`, `src`, `id` and `name` attributes, code spans and fenced code
blocks. A link inside code is not a link.
"""

import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

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

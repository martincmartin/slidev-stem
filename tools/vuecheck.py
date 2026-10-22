#!/usr/bin/env python3
"""Does a Vue component keep the class and v-click that a slide gives it, and
is each lint disable in its template narrow?

    uv run tools/vuecheck.py watches
    uv run tools/vuecheck.py themes path/to/One.vue

**The root.** A comment beside the one root element of a component's template (before it or
after it) makes a second root in a production build. Vue then drops the
`class`, `v-click` and other attributes that a slide gives the component, with
no error. `slidev dev` hides this: its Vue treats the comment as no root. So
the slide is right in dev and wrong in every build (the `slidev-practices`
skill, "Clicks, slides and going back"). Put the comment inside the root
element.

A template with more than one root element is not checked: Vue gives a slide's
attributes to none of its roots, with or without a comment. A `v-else` or
`v-else-if` element is the same root as the element before it.

**Lint disables in a template.** ESLint's comment rules read only script
comments, so this does what they do for the template's `<!-- eslint-... -->`:
each disable names its rules and gives a reason after `--`, and a block
disable (`eslint-disable`) has a later `eslint-enable` for each of its rules,
even at the end of the template. ESLint itself reports a disable that
suppresses nothing (`vue/comment-directive`). See docs/talks.md, "Check your
work".

It checks each `.vue` file in the paths, apart from `node_modules/`, `dist/`,
`tasks/` and hidden directories. It exits non-zero on a failure.
"""

import argparse
import pathlib
import re
import sys
from html.parser import HTMLParser

SKIPPED_DIRECTORIES = frozenset({"node_modules", "dist", "tasks"})
# The elements that have no end tag, when a template does not close them.
VOID_ELEMENTS = frozenset(
    {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta"}
    | {"source", "track", "wbr"}
)
# The component's own template: the first one that starts a line, to the last
# end tag that starts a line. A nested <template> is indented.
TEMPLATE = re.compile(r"^<template[^>]*>(.*)^</template>", re.MULTILINE | re.DOTALL)
ELSE_BRANCHES = frozenset({"v-else", "v-else-if"})
# `eslint-disable`, `eslint-disable-next-line`, `eslint-enable`, ...: the kind,
# then the rules, then " -- " and the reason.
DIRECTIVE = re.compile(
    r"^eslint-(disable|enable)(-next-line|-line)?(?:\s+(.*))?$", re.DOTALL
)


class TopLevel(HTMLParser):
    """The roots and the comments at the top level of a template, and all its
    comments, in order."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.roots = 0
        self.comments: list[str] = []
        self.all_comments: list[str] = []
        self.depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._element(attrs)
        if tag not in VOID_ELEMENTS:
            self.depth += 1

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._element(attrs)

    def handle_endtag(self, tag: str) -> None:
        if tag not in VOID_ELEMENTS:
            self.depth -= 1

    def handle_comment(self, data: str) -> None:
        self.all_comments.append(data.strip())
        if self.depth == 0:
            self.comments.append(data.strip())

    def _element(self, attrs: list[tuple[str, str | None]]) -> None:
        if self.depth == 0 and not ELSE_BRANCHES & {name for name, _ in attrs}:
            self.roots += 1


def vue_files(paths: list[pathlib.Path]) -> list[pathlib.Path]:
    """The `.vue` files in `paths`, apart from the skipped directories."""
    found: set[pathlib.Path] = set()
    for path in paths:
        if path.is_file():
            found.add(path)
            continue
        found.update(
            file
            for file in path.rglob("*.vue")
            if not any(
                part in SKIPPED_DIRECTORIES or part.startswith(".")
                for part in file.relative_to(path).parts[:-1]
            )
        )
    return sorted(found)


def root_problem(file: pathlib.Path, top: TopLevel) -> str | None:
    """A comment beside the one root element of the template, or None."""
    if top.roots != 1 or not top.comments:
        return None
    return (
        f"{file}: a comment beside the root element of its template "
        f"({top.comments[0]!r}): a build drops the class and v-click that a "
        "slide gives the component; put the comment inside the root element"
    )


def directive_problems(file: pathlib.Path, comments: list[str]) -> list[str]:
    """What is wrong with the template's lint disables: one each."""
    found = []
    open_rules: dict[str, str] = {}  # a block disable's rule: its comment
    for comment in comments:
        directive = DIRECTIVE.match(comment)
        if directive is None:
            continue
        kind, scope, rest = directive.groups()
        names, _, reason = (rest or "").partition("--")
        rules = [rule.strip() for rule in names.split(",") if rule.strip()]
        if kind == "enable":
            for rule in rules or list(open_rules):
                open_rules.pop(rule, None)
            continue
        if not rules:
            found.append(f"{file}: <!-- {comment} --> names no rule: name each rule")
        if not reason.strip():
            found.append(f"{file}: <!-- {comment} --> gives no reason after ' -- '")
        if scope is None:
            open_rules.update(dict.fromkeys(rules, comment))
    found.extend(
        f"{file}: <!-- {comment} --> has no later eslint-enable for {rule}: "
        "enable it where the exception ends, even at the end of the template"
        for rule, comment in open_rules.items()
    )
    return found


def problems(file: pathlib.Path, text: str) -> list[str]:
    """What is wrong with the component `file`, whose source is `text`."""
    template = TEMPLATE.search(text)
    if template is None:
        return []
    top = TopLevel()
    top.feed(template.group(1))
    top.close()
    root = root_problem(file, top)
    return [*([root] if root else []), *directive_problems(file, top.all_comments)]


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument(
        "paths", type=pathlib.Path, nargs="+", help="directories or .vue files"
    )
    arguments = parser.parse_args()
    paths: list[pathlib.Path] = arguments.paths
    for path in paths:
        if not path.exists():
            sys.exit(f"{path} does not exist")
    files = vue_files(paths)
    found = [
        message
        for file in files
        for message in problems(file, file.read_text(encoding="utf-8"))
    ]
    for message in found:
        print(f"FAIL  {message}")
    if not found:
        print(
            f"ok    {len(files)} component(s): no comment beside a single root; "
            "each lint disable is narrow, named and explained"
        )
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Is a talk set up so that pnpm and Prettier cannot fail without an error?

    uv run tools/talkcheck.py watches

Two mistakes give no error (AGENTS.md, "Working in this repo"), so this tool
looks for them:

  * a talk with no `pnpm-workspace.yaml`: pnpm then uses the root's workspace,
    installs nothing for the talk, and says nothing;
  * a deck file that Prettier would not read with the Slidev parser. A deck
    file is a Markdown file of the talk that starts with `---` (frontmatter),
    other than the docs, the tasks and the READMEs. Prettier's Markdown parser
    reads a slide's frontmatter as a thematic break and a paragraph, and
    rewrites it, so the slide breaks. `.prettierrc` must list the file.

Prettier says which parser it uses (`prettier --file-info`, in the talk's own
project, with its own settings). Needs the talk's `pnpm install`. It exits
non-zero on a failure.
"""

import argparse
import json
import pathlib
import subprocess
import sys
from collections.abc import Callable

SLIDEV_PARSER = "slidev"
# Not deck files, even if one starts with `---`.
SKIPPED_DIRECTORIES = frozenset({"node_modules", "dist", "docs", "tasks", ".venv"})
SKIPPED_FILES = frozenset({"README.md", "AGENTS.md"})


def deck_files(talk: pathlib.Path) -> list[pathlib.Path]:
    """The Markdown files of `talk` that start with frontmatter, apart from the
    docs, the tasks and the READMEs."""
    return sorted(
        file
        for file in talk.rglob("*.md")
        if file.name not in SKIPPED_FILES
        and not any(
            part in SKIPPED_DIRECTORIES or part.startswith(".")
            for part in file.relative_to(talk).parts[:-1]
        )
        and file.read_text().startswith("---\n")
    )


def prettier_parser(talk: pathlib.Path, file: pathlib.Path) -> str:
    """The parser that the talk's Prettier uses for `file`."""
    result = subprocess.run(
        ["pnpm", "exec", "prettier", "--file-info", str(file)],
        cwd=talk,
        capture_output=True,
        text=True,
        check=True,
    )
    return str(json.loads(result.stdout)["inferredParser"])


def problems(
    talk: pathlib.Path,
    parser_of: Callable[[pathlib.Path], str],
) -> list[str]:
    """What is wrong with the talk's setup. `parser_of` says which Prettier
    parser reads a file."""
    found = []
    if not (talk / "pnpm-workspace.yaml").is_file():
        found.append(
            f"{talk}/pnpm-workspace.yaml is missing: pnpm would use the root's "
            "workspace and install nothing for the talk"
        )
    for file in deck_files(talk):
        parser = parser_of(file)
        if parser != SLIDEV_PARSER:
            found.append(
                f"{file} starts with frontmatter but Prettier reads it with the "
                f"{parser!r} parser, which breaks its slides: add it to the "
                f"`files` of the {SLIDEV_PARSER!r} override in .prettierrc"
            )
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("talk", type=pathlib.Path, help="the talk's directory")
    arguments = parser.parse_args()
    talk: pathlib.Path = arguments.talk
    if not talk.is_dir():
        sys.exit(f"{talk} is not a directory")
    found = problems(talk, lambda file: prettier_parser(talk, file))
    for problem in found:
        print(f"FAIL  {problem}")
    if not found:
        print(
            f"ok    {talk}: has pnpm-workspace.yaml; "
            f"{len(deck_files(talk))} deck file(s) use the {SLIDEV_PARSER} parser"
        )
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Which talks must a push to main publish on GitHub Pages?

    python3 tools/publish_plan.py SITE --before SHA   # at the root

SITE is a checkout of the gh-pages branch (empty if nothing is published
yet), and SHA is the commit before the push. It prints the names of the talks
to publish as a JSON list, and on stderr why each one is published or not.
The publish workflow (.github/workflows/publish.yml) runs it on a push to
main. The rules, and why: docs/talks.md, "Publish a talk".

A talk in progress is compared with the commit that its pages were built
from (its `build.json` on gh-pages), so a run that GitHub cancels loses
nothing. A retired talk is compared with the push only: a build that fails is
not tried again at each later push.

The workflow runs it with the runner's python3 (3.12), not with uv. So it uses
only the standard library, and no syntax newer than 3.12: Ruff checks it as
3.12 (`per-file-target-version` in pyproject.toml).
"""

import argparse
import fnmatch
import json
import pathlib
import subprocess
import sys
from collections.abc import Collection, Iterable
from dataclasses import dataclass

ROOT = pathlib.Path(__file__).resolve().parent.parent
# What the workflow writes in each talk's directory on gh-pages.
BUILD_RECORD = "build.json"

# A talk's deck files: the globs of the Slidev override in .prettierrc.
DECK_FILES = ("slides.md", "slides-*.md", "*pages/*.md")
# The files of a talk that its build does not read. `art/` holds scripts and
# checks: the files that they write for the deck are committed outside it.
TALK_UNREAD = (
    "docs/*",
    "tasks/*",
    "art/*",
    "*.md",
    "*.test.ts",
    "*.py",
    "pyproject.toml",
    "uv.lock",
    "spelling-words.txt",
    "eslint.config.js",
)
# The files outside the talks that no talk's build reads. Anything else (the
# theme and palettes in themes/, the site's pages in site/, a new top-level
# file) can change a talk's pages. The workflow installs only the talk, so the
# root's packages are not read.
HOUSE_UNREAD = (
    "docs/*",
    "tasks/*",
    "tools/*",
    ".github/*",
    ".claude/*",
    "*.md",
    "*.py",
    "pyproject.toml",
    "uv.lock",
    ".python-version",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".prettierrc",
    ".prettierignore",
    ".gitignore",
    "LICENSE",
    "LICENSE-content",
)


@dataclass(frozen=True)
class Talk:
    name: str
    retired: bool
    # The commit that the talk's pages were built from, if gh-pages records it.
    built_from: str | None


def matches(path: str, patterns: Iterable[str]) -> bool:
    """Whether `path` matches a pattern; `*` matches `/` too."""
    return any(fnmatch.fnmatchcase(path, pattern) for pattern in patterns)


def talk_renders(path: str) -> bool:
    """Whether a change to `path`, a file of a talk relative to its
    directory, can change the talk's pages."""
    return matches(path, DECK_FILES) or not matches(path, TALK_UNREAD)


def house_renders(path: str, talk_names: Collection[str]) -> bool:
    """Whether a change to `path`, relative to the root, is a house change
    that can change the pages of each talk in progress."""
    if path.split("/", 1)[0] in talk_names:
        return False
    return not matches(path, HOUSE_UNREAD)


def page_changes(
    talk: Talk,
    since_build: Iterable[str],
    in_push: Iterable[str],
    talk_names: Collection[str],
) -> list[str]:
    """The changed paths (relative to the root) that make `talk` publish. For
    a talk in progress: the talk's files and the house's that changed since
    its build. For a retired talk: its own files that the push changed."""
    prefix = f"{talk.name}/"

    def own(path: str) -> bool:
        return path.startswith(prefix) and talk_renders(path.removeprefix(prefix))

    if talk.retired:
        return [path for path in in_push if own(path)]
    return [
        path for path in since_build if own(path) or house_renders(path, talk_names)
    ]


def git(*arguments: str) -> str | None:
    """Git's output, or None if git fails (a commit that is not here)."""
    result = subprocess.run(
        ["git", *arguments], cwd=ROOT, capture_output=True, text=True, check=False
    )
    return result.stdout if result.returncode == 0 else None


def changed_since(base: str) -> list[str] | None:
    """The files that differ between `base` and HEAD, or None if `base` is not
    a commit here. A rename gives both names."""
    output = git("diff", "--name-only", "--no-renames", base, "HEAD")
    return None if output is None else output.splitlines()


def every_file() -> list[str]:
    output = git("ls-files")
    if output is None:
        raise RuntimeError("git ls-files failed: is this a git checkout?")
    return output.splitlines()


def recorded_build(site: pathlib.Path, name: str) -> str | None:
    """The commit that gh-pages says the talk was built from, or None if it
    has no valid record."""
    try:
        record: object = json.loads((site / name / BUILD_RECORD).read_text("utf-8"))
    except (OSError, ValueError):
        return None
    if not isinstance(record, dict):
        return None
    commit = record.get("commit")
    return commit if isinstance(commit, str) and commit else None


def find_talks(site: pathlib.Path) -> list[Talk]:
    """Each talk on main: a top-level directory with a package.json and a
    slides.md."""
    return [
        Talk(
            name=directory.name,
            retired=bool(git("tag", "-l", f"retired/{directory.name}/*")),
            built_from=recorded_build(site, directory.name),
        )
        for directory in sorted(ROOT.iterdir())
        if (directory / "package.json").is_file()
        and (directory / "slides.md").is_file()
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("site", type=pathlib.Path, help="a checkout of gh-pages")
    parser.add_argument("--before", required=True, help="the commit before the push")
    arguments = parser.parse_args()
    talks = find_talks(arguments.site)
    names = {talk.name for talk in talks}
    in_push = changed_since(arguments.before) or []
    published: list[Talk] = []
    for talk in talks:
        recorded = None if talk.built_from is None else changed_since(talk.built_from)
        # no record of the build: every file counts as changed
        since_build = every_file() if recorded is None else recorded
        changes = page_changes(talk, since_build, in_push, names)
        state = "retired" if talk.retired else "in progress"
        if changes:
            published.append(talk)
            more = f" and {len(changes) - 1} more" if len(changes) > 1 else ""
            cause = (
                "gh-pages has no record of its build"
                if recorded is None and not talk.retired
                else f"{changes[0]}{more} changed"
            )
            print(f"{talk.name} ({state}): publish: {cause}", file=sys.stderr)
        else:
            print(f"{talk.name} ({state}): no change to its pages", file=sys.stderr)
    print(json.dumps([talk.name for talk in published]))
    return 0


if __name__ == "__main__":
    sys.exit(main())

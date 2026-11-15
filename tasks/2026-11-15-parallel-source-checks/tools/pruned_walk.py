"""Compare the walks before this task (copied here: Path.rglob, then a filter)
with the project's current `talkcheck.deck_files` and `lib.talk_source_files`.

    PYTHONPATH=tools uv run python tasks/2026-11-15-parallel-source-checks/tools/pruned_walk.py watches .

Run it in stem/. Each argument is a directory to walk. It prints, for each
directory and each function, the number of files, whether the two lists are
the same, and the time of each.
"""

import pathlib
import sys
import time
from collections.abc import Callable

import lib
import talkcheck

Walk = Callable[[pathlib.Path], list[pathlib.Path]]


def rglob_deck_files(talk: pathlib.Path) -> list[pathlib.Path]:
    """`talkcheck.deck_files` at commit 2adf76c."""
    return sorted(
        file
        for file in talk.rglob("*.md")
        if file.is_file()
        and file.name not in talkcheck.SKIPPED_FILES
        and not any(
            part in talkcheck.SKIPPED_DIRECTORIES or part.startswith(".")
            for part in file.relative_to(talk).parts[:-1]
        )
        and file.read_text().startswith("---\n")
    )


def rglob_talk_source_files(talk: pathlib.Path) -> list[pathlib.Path]:
    """`lib.talk_source_files` at commit 2adf76c."""
    return sorted(
        file
        for file in talk.rglob("*")
        if file.is_file()
        and file.suffix in lib.TALK_SOURCE_SUFFIXES
        and file.name not in lib.TALK_SKIPPED_FILES
        and not any(
            part in lib.TALK_SKIPPED_DIRECTORIES or part.startswith(".")
            for part in file.relative_to(talk).parts[:-1]
        )
    )


def timed(walk: Walk, talk: pathlib.Path) -> tuple[list[pathlib.Path], float]:
    started = time.perf_counter()
    files = walk(talk)
    return files, time.perf_counter() - started


def main() -> None:
    pairs: list[tuple[str, Walk, Walk]] = [
        ("deck_files", rglob_deck_files, talkcheck.deck_files),
        ("talk_source_files", rglob_talk_source_files, lib.talk_source_files),
    ]
    for argument in sys.argv[1:]:
        talk = pathlib.Path(argument).resolve()
        for name, before, now in pairs:
            old_files, old_seconds = timed(before, talk)
            new_files, new_seconds = timed(now, talk)
            print(
                f"{argument}: {name}: {len(old_files)} files,"
                f" same: {old_files == new_files},"
                f" {old_seconds:.3f} s -> {new_seconds:.3f} s"
            )


if __name__ == "__main__":
    main()

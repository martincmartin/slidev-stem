from pathlib import Path

import talkcheck

DECK = "---\ntheme: house\n---\n\n# Slide\n"


def write(path: Path, text: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def test_the_deck_files_start_with_frontmatter_and_are_not_docs(tmp_path: Path) -> None:
    write(tmp_path / "slides.md", DECK)
    write(tmp_path / "pages/two.md", DECK)
    write(tmp_path / "README.md", DECK)
    write(tmp_path / "docs/note.md", DECK)
    write(tmp_path / "tasks/x/note.md", DECK)
    write(tmp_path / "node_modules/p/readme.md", DECK)
    write(tmp_path / "notes.md", "# No frontmatter\n")
    names = [
        file.relative_to(tmp_path).as_posix() for file in talkcheck.deck_files(tmp_path)
    ]
    assert names == ["pages/two.md", "slides.md"]


def test_a_talk_without_its_own_workspace_fails(tmp_path: Path) -> None:
    found = talkcheck.problems(tmp_path, lambda _: "slidev")
    assert len(found) == 1
    assert "pnpm-workspace.yaml is missing" in found[0]


def test_a_deck_file_that_prettier_reads_as_markdown_fails(tmp_path: Path) -> None:
    write(tmp_path / "pnpm-workspace.yaml", "shamefullyHoist: true\n")
    write(tmp_path / "slides.md", DECK)
    write(tmp_path / "slides-extra.md", DECK)
    found = talkcheck.problems(
        tmp_path, lambda file: "slidev" if file.name == "slides.md" else "markdown"
    )
    assert len(found) == 1
    assert "slides-extra.md" in found[0]
    assert ".prettierrc" in found[0]


def test_a_good_talk_has_no_problem(tmp_path: Path) -> None:
    write(tmp_path / "pnpm-workspace.yaml", "shamefullyHoist: true\n")
    write(tmp_path / "slides.md", DECK)
    assert talkcheck.problems(tmp_path, lambda _: "slidev") == []

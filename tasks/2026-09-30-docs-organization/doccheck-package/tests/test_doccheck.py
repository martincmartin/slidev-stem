from pathlib import Path

import pytest

from doccheck.checks import Finding, Kind, check, tool_pattern
from doccheck.cli import main, markdown_files
from doccheck.markdown import Document, parse, slug


def write(path: Path, text: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def kinds(findings: list[Finding]) -> list[tuple[Kind, str]]:
    return [(finding.kind, finding.subject) for finding in findings]


@pytest.mark.parametrize(
    ("heading", "anchor"),
    [
        ("The gates", "the-gates"),
        ("`TimekeeperCard.vue`", "timekeepercardvue"),
        ("Theme: colour roles and gates", "theme-colour-roles-and-gates"),
        ("One slide can change a role", "one-slide-can-change-a-role"),
        ("Why this is separate from `tasks/`", "why-this-is-separate-from-tasks"),
        ("A [link](x.md) in it", "a-link-in-it"),
        ("snake_case stays", "snake_case-stays"),
    ],
)
def test_slug(heading: str, anchor: str) -> None:
    assert slug(heading) == anchor


def test_repeated_headings_get_a_suffix() -> None:
    document = parse(Path("x.md"), "# Notes\n## Notes\n### Notes\n")
    assert document.anchors == {"notes", "notes-1", "notes-2"}


def test_code_is_not_a_link() -> None:
    text = "See [a](a.md).\n`[b](b.md)`\n```\n[c](c.md)\n```\n[d]: d.md\n"
    document = parse(Path("x.md"), text)
    assert [link.target for link in document.links] == ["a.md", "d.md"]
    assert [code.text for code in document.code] == ["[b](b.md)", "[c](c.md)"]


def test_links_and_anchors(tmp_path: Path) -> None:
    write(tmp_path / "target.md", "# Target\n## The gates\n")
    source = write(
        tmp_path / "source.md",
        "[ok](target.md#the-gates) [no anchor](target.md#gone) [no file](gone.md)"
        " [web](https://example.com/x) [site](/img.svg) [self](#here)\n# Here\n",
    )
    findings = check([Document.read(source)], [])
    assert kinds(findings) == [
        (Kind.MISSING_ANCHOR, "target.md#gone"),
        (Kind.MISSING_FILE, "gone.md"),
    ]


def test_indexes(tmp_path: Path) -> None:
    write(tmp_path / "AGENTS.md", "| before you draw | `docs/art.md` |\n")
    write(tmp_path / "docs/README.md", "- [art](art.md)\n- [theme](theme.md)\n")
    theme = write(tmp_path / "docs/theme.md", "# Theme\n")
    art = write(tmp_path / "docs/art.md", "# Art\n")
    findings = check([Document.read(theme), Document.read(art)], [])
    assert kinds(findings) == [(Kind.NOT_INDEXED, "theme.md")]
    assert findings[0].path == tmp_path / "AGENTS.md"


def test_a_docs_directory_needs_both_indexes(tmp_path: Path) -> None:
    doc = write(tmp_path / "docs/theme.md", "# Theme\n")
    findings = check([Document.read(doc)], [])
    assert kinds(findings) == [(Kind.NO_INDEX, "docs"), (Kind.NO_INDEX, "docs")]


def test_tool_paths(tmp_path: Path) -> None:
    tools = tmp_path / "stem/tools"
    write(tools / "palette.py", "")
    doc = write(
        tmp_path / "stem/notes.md",
        "`uv run tools/palette.py` `uv run tools/gone.py`\n"
        "```bash\nuv run ../tools/validate.py\nstem/tools/palette.py\n"
        "tasks/x/tools/own.py\n```\n",
    )
    findings = check([Document.read(doc)], [tools])
    assert kinds(findings) == [
        (Kind.MISSING_TOOL, "tools/gone.py"),
        (Kind.MISSING_TOOL, "../tools/validate.py"),
    ]


def test_tool_pattern_ignores_a_deeper_tools() -> None:
    pattern = tool_pattern(Path("/r/stem/tools"))
    assert not pattern.search("watches/tasks/x/tools/flash.py")
    assert pattern.search("stem/tools/lib.py")


def test_skipped_directories(tmp_path: Path) -> None:
    write(tmp_path / "a.md", "")
    write(tmp_path / "tasks/b.md", "")
    write(tmp_path / ".hidden/c.md", "")
    write(tmp_path / "node_modules/d.md", "")
    found = markdown_files([tmp_path], frozenset({"tasks", "node_modules"}))
    assert found == [(tmp_path / "a.md").resolve()]


def test_main_exit_codes(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    good = write(tmp_path / "good.md", "# Good\n")
    bad = write(tmp_path / "bad.md", "[x](gone.md)\n")
    assert main([str(good)]) == 0
    assert main([str(bad), "--json"]) == 1
    assert '"kind": "missing file"' in capsys.readouterr().out

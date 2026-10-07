from pathlib import Path

import pytest
from doccheck import (
    Document,
    Finding,
    Kind,
    check,
    main,
    markdown_files,
    parse,
    slug,
    tool_pattern,
)


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
    tools = tmp_path / "clone/tools"  # the directory on disk is not called stem
    write(tools / "palette.py", "")
    doc = write(
        tmp_path / "clone/notes.md",
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
    pattern = tool_pattern(Path("/r/clone/tools"))
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


# --- headings ---------------------------------------------------------------


@pytest.mark.parametrize(
    ("headings", "anchors"),
    [
        ("# X\n# X-1\n# X\n", {"x", "x-1", "x-2"}),
        ("# X\n# X\n# X-1\n", {"x", "x-1", "x-1-1"}),
        ("# Notes 1\n# Notes\n# Notes\n", {"notes-1", "notes", "notes-2"}),
    ],
)
def test_heading_suffixes_never_collide(headings: str, anchors: set[str]) -> None:
    assert parse(Path("x.md"), headings).anchors == anchors


def test_slug_keeps_combining_accents_and_drops_emphasis() -> None:
    assert slug("Cafe\u0301") == "caf\u00e9"
    assert slug("_Why_ it works") == "why-it-works"
    assert slug("snake_case_name") == "snake_case_name"


def test_front_matter_is_not_a_heading() -> None:
    assert parse(Path("x.md"), "---\n# comment\n---\n# Real\n").anchors == {"real"}


# --- fences, comments and spans ---------------------------------------------


def test_a_fence_closes_only_on_a_bare_closing_line() -> None:
    text = "```python\n``` trailing\n```bash\n[a](gone.md)\n```\n[b](b.md)\n"
    document = parse(Path("x.md"), text)
    assert [link.target for link in document.links] == ["b.md"]


def test_a_longer_fence_needs_a_long_enough_close() -> None:
    document = parse(Path("x.md"), "````\n```\n[a](a.md)\n````\n[b](b.md)\n")
    assert [link.target for link in document.links] == ["b.md"]


def test_an_indented_fence_in_a_list_is_code() -> None:
    document = parse(Path("x.md"), "- item\n\n    ```\n    [a](a.md)\n    ```\n")
    assert document.links == ()


def test_a_comment_and_a_footnote_are_not_links() -> None:
    text = "<!-- [old](gone.md)\nmore [x](y.md) -->\n[^1]: Some note\n"
    assert parse(Path("x.md"), text).links == ()


def test_a_code_span_may_wrap() -> None:
    document = parse(Path("x.md"), "Run `uv run\ntools/palette.py` now.\n")
    assert [(code.text, code.line) for code in document.code] == [
        ("uv run tools/palette.py", 1)
    ]


# --- links ------------------------------------------------------------------


def test_a_target_may_hold_parentheses() -> None:
    document = parse(Path("x.md"), "[w](foo_(bar).md) [v](not(here).md#top)\n")
    assert [link.target for link in document.links] == [
        "foo_(bar).md",
        "not(here).md#top",
    ]


def test_an_escaped_bracket_is_not_a_link() -> None:
    assert parse(Path("x.md"), "\\[not a link](gone.md)\n").links == ()


def test_a_link_line_is_where_it_starts() -> None:
    document = parse(Path("x.md"), "one\ntwo [a](a.md)\n\n[b](b.md)\n")
    assert [(link.target, link.line) for link in document.links] == [
        ("a.md", 2),
        ("b.md", 4),
    ]


def test_html_attributes_count_only_inside_a_tag() -> None:
    text = (
        'The text id="x" href="gone.md".\n<a id="y" href="z.md">w</a> <b data-id="q">\n'
    )
    document = parse(Path("x.md"), text)
    assert document.anchors == {"y"}
    assert [link.target for link in document.links] == ["z.md"]


def test_a_link_that_differs_in_case_is_missing(tmp_path: Path) -> None:
    write(tmp_path / "Target.md", "# T\n")
    source = write(tmp_path / "source.md", "[ok](Target.md) [no](target.md)\n")
    assert kinds(check([Document.read(source)], [])) == [
        (Kind.MISSING_FILE, "target.md")
    ]


def test_a_bad_target_is_a_finding_not_a_crash(tmp_path: Path) -> None:
    write(tmp_path / "latin.md", "# T\n")
    (tmp_path / "binary.md").write_bytes(b"\xff\xfe# x\n")
    (tmp_path / "dir.md").mkdir()
    source = write(
        tmp_path / "source.md", "[a](a%00.md) [b](binary.md#x) [c](dir.md#x)\n"
    )
    assert kinds(check([Document.read(source)], [])) == [
        (Kind.INVALID_TARGET, "a%00.md"),
        (Kind.UNREADABLE, "binary.md#x"),
        (Kind.UNREADABLE, "dir.md#x"),
    ]


def test_findings_are_sorted_by_place(tmp_path: Path) -> None:
    source = write(tmp_path / "source.md", "[b](b.md)\n\n[a](a.md)\n")
    assert [finding.line for finding in check([Document.read(source)], [])] == [1, 3]


# --- files and the command line ---------------------------------------------


def test_a_skipped_directory_is_not_entered(tmp_path: Path) -> None:
    write(tmp_path / "a.md", "")
    write(tmp_path / "node_modules/deep/b.md", "")
    assert markdown_files([tmp_path], frozenset({"node_modules"})) == [
        (tmp_path / "a.md").resolve()
    ]


def test_bad_arguments_exit_2(tmp_path: Path) -> None:
    write(tmp_path / "x.txt", "")
    write(tmp_path / "x.md", "")
    with pytest.raises(SystemExit, match="2"):
        main([str(tmp_path / "x.txt")])
    with pytest.raises(SystemExit, match="2"):
        main([str(tmp_path / "x.md"), "--tools", str(tmp_path / "x.md")])


def test_an_unreadable_input_exits_3(tmp_path: Path) -> None:
    (tmp_path / "binary.md").write_bytes(b"\xff\xfe")
    assert main([str(tmp_path / "binary.md")]) == 3

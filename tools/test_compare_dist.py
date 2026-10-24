from pathlib import Path

from compare_dist import Difference, differences, normalized_files


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def test_hashes_and_scope_ids_are_ignored(tmp_path: Path) -> None:
    write(
        tmp_path / "a/assets/entry-AAAAAAAA.js",
        'import "./md-BBBBBBBB.js" data-v-0123abcd',
    )
    write(
        tmp_path / "b/assets/entry-CCCCCCCC.js",
        'import "./md-DDDDDDDD.js" data-v-4567ef01',
    )
    assert (
        differences(normalized_files(tmp_path / "a"), normalized_files(tmp_path / "b"))
        == []
    )


def test_many_files_of_one_name_compare_as_a_multiset(tmp_path: Path) -> None:
    write(tmp_path / "a/assets/md-AAAAAAAA.css", "one")
    write(tmp_path / "a/assets/md-BBBBBBBB.css", "two")
    write(tmp_path / "b/assets/md-CCCCCCCC.css", "two")
    write(tmp_path / "b/assets/md-DDDDDDDD.css", "one")
    assert (
        differences(normalized_files(tmp_path / "a"), normalized_files(tmp_path / "b"))
        == []
    )


def test_a_changed_file_of_a_shared_name_is_found(tmp_path: Path) -> None:
    write(tmp_path / "a/assets/md-AAAAAAAA.css", "one")
    write(tmp_path / "a/assets/md-BBBBBBBB.css", "two")
    write(tmp_path / "b/assets/md-CCCCCCCC.css", "one")
    write(tmp_path / "b/assets/md-DDDDDDDD.css", "three")
    write(tmp_path / "b/index.html", "")
    assert differences(
        normalized_files(tmp_path / "a"), normalized_files(tmp_path / "b")
    ) == [
        Difference(Path("assets/md.css"), 2, 2),
        Difference(Path("index.html"), 0, 1),
    ]

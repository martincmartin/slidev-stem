from pathlib import Path

import pages_preview


def site(root: Path) -> Path:
    for name in ("r/index.html", "r/404.html", "r/talk/index.html", "r/talk/a.html"):
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(name, encoding="utf-8")
    return root


def test_a_file_is_itself(tmp_path: Path) -> None:
    root = site(tmp_path)
    assert pages_preview.resolve(root, "/r/talk/a.html") == root / "r/talk/a.html"


def test_a_directory_is_its_index(tmp_path: Path) -> None:
    root = site(tmp_path)
    assert pages_preview.resolve(root, "/r/talk/") == root / "r/talk/index.html"
    assert pages_preview.resolve(root, "/r/talk") == root / "r/talk/index.html"


def test_a_path_without_its_extension_is_the_html_file(tmp_path: Path) -> None:
    root = site(tmp_path)
    assert pages_preview.resolve(root, "/r/talk/a?x=1") == root / "r/talk/a.html"


def test_a_route_of_the_deck_is_not_found(tmp_path: Path) -> None:
    root = site(tmp_path)
    assert pages_preview.resolve(root, "/r/talk/5") is None
    assert pages_preview.resolve(root, "/r/talk/presenter/5?clicks=2") is None


def test_a_path_out_of_the_site_is_not_found(tmp_path: Path) -> None:
    root = site(tmp_path)
    assert pages_preview.resolve(root, "/r/../../etc/passwd") is None

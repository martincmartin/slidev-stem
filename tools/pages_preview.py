#!/usr/bin/env python3
"""Build a talk as GitHub Pages does, and serve it as GitHub Pages does.

    uv run tools/pages_preview.py watches             # the slides, and the live article
    uv run tools/pages_preview.py watches --article   # ... and the static article (slow)

It runs the publish workflow's build commands in the talk
(`.github/workflows/publish.yml`): `pnpm build --base /<repo>/<talk>/`, and
with `--article` the talk's `prerender` script. It puts the talk's `dist/` at
`/<repo>/<talk>/`, beside the site's own pages from `site/`, and serves them
on localhost until you stop it (Ctrl-C).

The server does what GitHub Pages does, so that a page that works here works
there: a path is a file; a directory is its `index.html`, after a redirect to
the path with a final `/`; `/a` is `a.html` if there is no `a`; any other path
gets the `404.html` at the root of the `gh-pages` branch (`/<repo>/404.html`),
with status 404. So a link to one slide (`/<repo>/<talk>/5`) works here only if
it works on Pages. A plain static server, or `slidev dev`, gives the deck's
`index.html` for every path, and hides a missing 404 page.

The repo's name comes from the `origin` remote. Needs the talk's
`pnpm install`. See docs/talks.md, "Publish a talk".
"""

import argparse
import contextlib
import functools
import http.server
import io
import pathlib
import shutil
import subprocess
import sys
import tempfile
from typing import Any, BinaryIO
from urllib.parse import unquote, urlsplit

import lib

SITE = lib.ROOT / "site"
NOT_FOUND = "404.html"


def repo_name() -> str:
    """The repository's name: the last part of the `origin` remote's URL."""
    url = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=lib.ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    return url.rstrip("/").rsplit("/", 1)[-1].removesuffix(".git")


def resolve(root: pathlib.Path, url_path: str) -> pathlib.Path | None:
    """The file that GitHub Pages serves for `url_path` from the site `root`,
    or None: then it serves the 404 page."""
    parts = [part for part in unquote(urlsplit(url_path).path).split("/") if part]
    if any(part in {".", ".."} for part in parts):
        return None
    path = root.joinpath(*parts)
    if path.is_dir():
        path = path / "index.html"
    elif not path.is_file() and parts:
        path = path.with_name(path.name + ".html")
    return path if path.is_file() else None


class PagesHandler(http.server.SimpleHTTPRequestHandler):
    """Serves the files in `directory` as GitHub Pages does, with
    `not_found` for a path that has none."""

    def __init__(self, *args: Any, not_found: pathlib.Path, **kwargs: Any) -> None:
        self.not_found = not_found
        super().__init__(*args, **kwargs)

    def send_head(self) -> io.BytesIO | BinaryIO | None:
        root = pathlib.Path(self.directory)
        file = resolve(root, self.path)
        if file is not None and file.name == "index.html":
            # the base class redirects a directory's path to end in "/"
            return super().send_head()
        if file is not None:
            self.path = "/" + file.relative_to(root).as_posix()
            return super().send_head()
        body = self.not_found.read_bytes()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command == "HEAD":
            return None
        self.wfile.write(body)
        return None

    def log_message(self, format: str, *args: Any) -> None:
        pass


def build(talk: pathlib.Path, base: str, article: bool) -> None:
    """The publish workflow's build commands, in the talk."""
    subprocess.run(["pnpm", "build", "--base", base], cwd=talk, check=True)
    if article:
        subprocess.run(
            ["pnpm", "run", "--if-present", "prerender"], cwd=talk, check=True
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("talk", type=pathlib.Path, help="the talk's directory")
    parser.add_argument(
        "--article",
        action="store_true",
        help="also run the talk's prerender: the article for readers without JavaScript",
    )
    parser.add_argument("--port", type=int, default=8400)
    arguments = parser.parse_args()
    talk: pathlib.Path = arguments.talk.resolve()
    if not (talk / "package.json").is_file():
        sys.exit(f"{arguments.talk} is not a talk: it has no package.json")
    repo = repo_name()
    build(talk, f"/{repo}/{talk.name}/", arguments.article)
    with tempfile.TemporaryDirectory() as directory:
        site = pathlib.Path(directory)
        # the gh-pages branch is the site at /<repo>/
        branch = site / repo
        shutil.copytree(talk / "dist", branch / talk.name)
        for page in ("index.html", NOT_FOUND):
            shutil.copy(SITE / page, branch / page)
        handler = functools.partial(
            PagesHandler, directory=str(site), not_found=branch / NOT_FOUND
        )
        with http.server.ThreadingHTTPServer(
            ("127.0.0.1", arguments.port), handler
        ) as server:
            print(
                f"http://127.0.0.1:{arguments.port}/{repo}/{talk.name}/  (Ctrl-C stops)"
            )
            with contextlib.suppress(KeyboardInterrupt):
                server.serve_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""A static host for a Slidev build, for the experiments.

An unknown path gets index.html, as Netlify's or Vercel's rewrites do. The
hashed files in assets/ are cached for a year, as a static host should serve
them; everything else must be revalidated. A test can add pages that exist
only in memory, so that the build directory stays as Slidev wrote it.
"""

import functools
import threading
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class SpaHandler(SimpleHTTPRequestHandler):
    """Serves a page from memory, a file, or else index.html."""

    def __init__(
        self, *args: object, pages: Mapping[str, str], **kwargs: object
    ) -> None:
        self.pages = pages
        super().__init__(*args, **kwargs)  # type: ignore[arg-type]

    def do_GET(self) -> None:
        path = self.path.split("?")[0]
        if path in self.pages:
            body = self.pages[path].encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def send_head(self):  # type: ignore[no-untyped-def]
        if not Path(self.translate_path(self.path)).exists():
            self.path = "/index.html"
        return super().send_head()

    def end_headers(self) -> None:
        if self.path.startswith("/assets/"):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format: str, *args: object) -> None:
        pass


@contextmanager
def serve(build: Path, pages: Mapping[str, str] | None = None) -> Iterator[str]:
    """Serve the build on a free port; yield its base URL."""
    handler = functools.partial(SpaHandler, directory=str(build), pages=pages or {})
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}"
    finally:
        server.shutdown()
        thread.join()

"""Build the talk once with each palette, and check what a reader sees.

For each palette in themes/palettes/: write a copy of the talk's slides.md
that loads it (with the colorSchema of its paper), build it, serve the build,
and read in Chromium: the <html> classes, the computed --palette-background
on the first slides, and whether a section slide shows the house's eyebrow.
Prints JSON. Run from stem/; argument 1 is the talk, argument 2 the output.
"""

import functools
import http.server
import json
import pathlib
import re
import subprocess
import sys
import threading

from playwright.sync_api import sync_playwright

DARK = {"campfire", "after-hours", "beacon"}


class SinglePage(http.server.SimpleHTTPRequestHandler):
    def send_head(self):  # type: ignore[no-untyped-def]
        if not pathlib.Path(self.translate_path(self.path)).exists():
            self.path = "/index.html"
        return super().send_head()

    def log_message(self, *args):  # type: ignore[no-untyped-def]
        pass


def build(talk: pathlib.Path, palette: str, out: pathlib.Path) -> None:
    source = (talk / "slides.md").read_text()
    schema = "dark" if palette in DARK else "light"
    source = re.sub(r"(?m)^colorSchema: \w+$", f"colorSchema: {schema}", source, count=1)
    source = re.sub(r"(?m)^  - palette-[\w-]+$", f"  - palette-{palette}", source, count=1)
    copy = talk / f"zz-palette-{palette}.md"
    copy.write_text(source)
    try:
        subprocess.run(
            ["pnpm", "exec", "slidev", "build", copy.name, "--out", str(out)],
            cwd=talk, check=True, capture_output=True, timeout=600,
        )
    finally:
        copy.unlink()


def read(build_dir: pathlib.Path) -> dict[str, object]:
    handler = functools.partial(SinglePage, directory=str(build_dir))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    found: dict[str, object] = {"html": None, "background": {}, "eyebrow": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        for number in range(1, 6):
            page.goto(f"{base}/{number}")
            page.wait_for_selector(".slidev-layout", state="attached")
            page.wait_for_timeout(300)
            state = page.evaluate(
                """() => {
                  const layout = document.querySelector('.slidev-page .slidev-layout');
                  return {
                    html: document.documentElement.className,
                    background: getComputedStyle(layout).getPropertyValue('--palette-background').trim(),
                    eyebrow: document.querySelector('.section-eyebrow')?.textContent?.trim() ?? null,
                  };
                }"""
            )
            found["html"] = state["html"]
            found["background"][str(number)] = state["background"]  # type: ignore[index]
            if state["eyebrow"]:
                found["eyebrow"].append([number, state["eyebrow"]])  # type: ignore[union-attr]
        browser.close()
    server.shutdown()
    return found


def main() -> None:
    talk, out = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve()
    palettes = sorted(path.name for path in pathlib.Path("themes/palettes").iterdir())
    results = {}
    for palette in palettes:
        build(talk, palette, out / palette)
        rule = (pathlib.Path("themes/palettes") / palette / "palette.css").read_text()
        expected = re.search(r"--palette-background:\s*(#[0-9a-f]{6})", rule).group(1)  # type: ignore[union-attr]
        results[palette] = {"expected background": expected, **read(out / palette)}
    print(json.dumps(results, indent=2))


main()

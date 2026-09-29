#!/usr/bin/env python3
"""Facts about the candidate libraries: latest version, when it was
published, licence, weekly downloads, and the size of its default browser
file, minified and gzipped.

    ../../../../.venv/bin/python3 library_facts.py      # in tools/: needs the network

Reads the npm registry and jsDelivr (read only) and writes
../evidence/libraries.json. The default file is what jsDelivr serves for the
package with no path: usually the minified browser build. For a package that
loads WebAssembly, the .wasm file is counted too.
"""

import gzip
import json
import pathlib
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass

EVIDENCE = pathlib.Path(__file__).resolve().parents[1] / "evidence"
AGENT = {"User-Agent": "stem-talks-planning/1 (library facts; read only)"}


@dataclass(frozen=True)
class Candidate:
    package: str
    role: str
    wasm: str | None = None  # the path of its .wasm file, if it loads one
    files: tuple[str, ...] = ()  # its browser files, where jsDelivr guesses wrong


CANDIDATES = [
    Candidate("canvg", "SVG to Canvas 2D renderer"),
    Candidate("@svgdotjs/svg.js", "SVG DOM building and animation"),
    Candidate("paper", "vector scene graph on Canvas 2D"),
    Candidate("konva", "scene graph on Canvas 2D"),
    Candidate("two.js", "one scene graph, SVG or Canvas 2D or WebGL renderer"),
    Candidate("pixi.js", "2D on WebGL or WebGPU", files=("dist/pixi.min.js",)),
    Candidate("zdog", "flat 3D shapes on Canvas 2D or SVG, sorted by centre depth"),
    Candidate(
        "three",
        "3D on WebGL or WebGPU",
        files=(
            "build/three.core.min.js",
            "build/three.module.min.js",
        ),  # jsDelivr minifies them
    ),
    Candidate("fabric", "canvas object model and editor"),
    Candidate("lottie-web", "Lottie player: SVG or Canvas 2D"),
    Candidate(
        "@lottiefiles/dotlottie-web",
        "Lottie player: ThorVG in WebAssembly",
        "dist/dotlottie-player.wasm",
        ("dist/index.js",),
    ),
    Candidate("canvaskit-wasm", "Skia in WebAssembly, on WebGL", "bin/canvaskit.wasm"),
    Candidate("gsap", "tweens and timelines for any number, SVG or canvas"),
]


@dataclass(frozen=True)
class Facts:
    package: str
    role: str
    version: str
    published: str
    licence: str
    weekly_downloads: int | None
    default_files: tuple[str, ...]
    minified_kib: float
    gzipped_kib: float
    wasm_kib: float | None


def get(url: str) -> bytes:
    request = urllib.request.Request(url, headers=AGENT)
    with urllib.request.urlopen(request, timeout=60) as response:
        body: bytes = response.read()
        return body


def facts(candidate: Candidate) -> Facts:
    name = candidate.package
    registry = json.loads(
        get(f"https://registry.npmjs.org/{urllib.parse.quote(name, safe='@')}")
    )
    version = registry["dist-tags"]["latest"]
    try:
        downloads = json.loads(
            get(f"https://api.npmjs.org/downloads/point/last-week/{name}")
        )["downloads"]
    except urllib.error.URLError:
        downloads = None
    files = candidate.files
    if not files:
        entry = json.loads(
            get(
                f"https://data.jsdelivr.com/v1/packages/npm/{name}@{version}/entrypoints"
            )
        )
        files = (
            entry.get("entrypoints", {}).get("js", {}).get("file", "").lstrip("/"),
        )
    body = b"".join(
        get(f"https://cdn.jsdelivr.net/npm/{name}@{version}/{file}") for file in files
    )
    wasm = None
    if candidate.wasm is not None:
        wasm = (
            len(get(f"https://cdn.jsdelivr.net/npm/{name}@{version}/{candidate.wasm}"))
            / 1024
        )
    return Facts(
        candidate.package,
        candidate.role,
        version,
        registry["time"][version][:10],
        str(registry.get("license", "")),
        downloads,
        files,
        round(len(body) / 1024, 1),
        round(len(gzip.compress(body)) / 1024, 1),
        None if wasm is None else round(wasm, 1),
    )


def main() -> None:
    rows = []
    for candidate in CANDIDATES:
        try:
            row = facts(candidate)
        except (urllib.error.URLError, KeyError, ValueError) as error:
            print(f"{candidate.package}: {error}")
            continue
        rows.append(asdict(row))
        print(row)
    EVIDENCE.mkdir(exist_ok=True)
    (EVIDENCE / "libraries.json").write_text(json.dumps(rows, indent=1) + "\n")
    print(f"wrote {EVIDENCE / 'libraries.json'}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Exercise combined offline and navigation failure contracts on small decks.

Run with the house Python environment. Give the repository root explicitly.
Browser fixtures shorten only startup and walk-limit deadlines, not animations.
"""

import argparse
import json
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Case:
    name: str
    probe: bool = True
    outside: bool = False
    page_error: bool = False
    visible: bool = True
    moves: bool = True
    endless: bool = False
    rapid_error: bool = False
    large_outside: bool = False
    expected: int = 0


def markup(case: Case) -> str:
    layout = (
        '<div class="slidev-layout">slide</div>'
        if case.visible
        else "<div>no slide</div>"
    )
    image = '<img src="https://outside.invalid/image.png">' if case.outside else ""
    probe = (
        "window.slideState = () => ({settled:{slide: position}, continuous:{}, busy:false});"
        if case.probe
        else ""
    )
    error = (
        "setTimeout(() => { throw new Error('intentional fixture error'); }, 0);"
        if case.page_error
        else ""
    )
    rapid_error = (
        "if (performance.now() - previousPress < 600) throw new Error('rapid press fixture error');"
        if case.rapid_error
        else ""
    )
    large_outside = (
        "if (innerWidth > 1500) {const image = document.createElement('img'); image.src='https://outside.invalid/large.png'; document.body.append(image);}"
        if case.large_outside
        else ""
    )
    maximum = "Infinity" if case.endless else "2"
    move = (
        'position = Math.max(1, Math.min(maximum, position + (event.key === "ArrowRight" ? 1 : -1)));'
        if case.moves
        else ""
    )
    return f"""<!doctype html>{layout}{image}<script>
        let position = Number(location.pathname.split('/').at(-1)) || 1;
        const maximum = {maximum};
        let previousPress = -Infinity;
        {large_outside}
        {probe}
        document.addEventListener('keydown', event => {{
            if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
            {rapid_error}
            previousPress = performance.now();
            {move}
            history.pushState(null, '', '/' + position);
        }});
        {error}
    </script>"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("output", type=Path)
    arguments = parser.parse_args()
    cases = (
        Case("probe passes"),
        Case("no-probe fallback passes", probe=False),
        Case("outside request fails", outside=True, expected=1),
        Case("fallback outside request fails", probe=False, outside=True, expected=1),
        Case("page error fails", page_error=True, expected=1),
        Case("startup fails", visible=False, expected=1),
        Case("no movement fails", moves=False, expected=1),
        Case("fallback no movement fails", probe=False, moves=False, expected=1),
        Case("probe walk limit fails", endless=True, expected=1),
        Case("fallback walk limit fails", probe=False, endless=True, expected=1),
        Case("rapid-only page error fails", rapid_error=True, expected=1),
        Case("large-viewport outside request fails", large_outside=True, expected=1),
    )
    # Import normally from tools/, in the house environment. Fixture deadlines
    # keep negative cases short without adding test options to production.
    driver = """import argparse, asyncio, navcheck, offline_check, sys
raise SystemExit(asyncio.run(navcheck.main(argparse.Namespace(deck=sys.argv[1], offline=True), offline_check.WalkLimits(ready_timeout_ms=500, steps=3))))
"""
    records = []
    with tempfile.TemporaryDirectory(prefix="validation-fixtures-") as directory:
        root = Path(directory)
        for index, case in enumerate(cases):
            deck = root / str(index)
            deck.mkdir()
            (deck / "index.html").write_text(markup(case))
            result = subprocess.run(
                [sys.executable, "-c", driver, str(deck)],
                cwd=arguments.root / "tools",
                capture_output=True,
                text=True,
                check=False,
            )
            records.append(
                {
                    "name": case.name,
                    "expected": case.expected,
                    "returncode": result.returncode,
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                }
            )
            print(case.name, result.returncode, flush=True)
    arguments.output.write_text(json.dumps(records, indent=2))
    if any(record["returncode"] != record["expected"] for record in records):
        sys.exit(1)


if __name__ == "__main__":
    main()

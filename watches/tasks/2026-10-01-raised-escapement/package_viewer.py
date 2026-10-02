"""Build a self-contained viewer that also opens from a local file."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

TASK = Path(__file__).resolve().parent


def main() -> None:
    subprocess.run(
        [
            "pnpm",
            "exec",
            "vite",
            "build",
            "--config",
            str(TASK / "prototype" / "viewer.config.ts"),
        ],
        cwd=TASK.parents[1],
        check=True,
    )
    built = TASK / "viewer-site"
    page = (built / "viewer.html").read_text()

    def inline_script(match: re.Match[str]) -> str:
        script = (built / match[1]).read_text().replace("</script", "<\\/script")
        return f'<script type="module">{script}</script>'

    page, count = re.subn(
        r'<script\b[^>]*\bsrc="([^"]+)"[^>]*></script>', inline_script, page
    )
    if count != 1:
        raise RuntimeError(f"Expected one bundled script, found {count}")
    (TASK / "viewer.html").write_text(page)


if __name__ == "__main__":
    main()

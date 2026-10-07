"""The numbers behind PLAN.md's colour choices.

1. A 0.18 wash of muted, over the background and the panel, in each of the 23
   candidate themes of watches/tasks/2026-09-18-theme-colors (read from that
   task's frozen deck, with its own tools).
2. Ledger's solid faces, against a blend of their line into the paper: the
   blend that each channel would need. One blend for all three channels means
   the face is a plain wash of its line; three different blends mean it is not.

Run from stem/: uv run python tasks/2026-10-07-theme-colour-system/tools/washes.py
"""

import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
THEME_TASK = HERE.parents[2] / "watches" / "tasks" / "2026-09-18-theme-colors" / "tools"
sys.path.insert(0, str(THEME_TASK))
from lib import contrast, load_themes, mix  # noqa: E402

# Ledger's values on 2026-10-07 (themes/ledger/styles/ledger.css), copied here
# so the numbers reproduce after the theme changes.
LEDGER = {
    "background": "#FAF7F0",
    "panel": "#F2EEE4",
    "muted": "#736A60",
    "art-line": "#143C6B",
    "art-knockout": "#D3DCE3",
    "second": "#9A6238",
    "art-second-knockout": "#E6D8CA",
}
WASH = 0.18


def channels(hex_colour: str) -> list[int]:
    return [int(hex_colour.lstrip("#")[index : index + 2], 16) for index in (0, 2, 4)]


def main() -> None:
    print(f"1. A {WASH} wash of muted, in each candidate theme\n")
    print(f"{'theme':24} {'background':10} {'dark':4} {'on bg':>6} {'on panel':>8} {'muted on it':>11}")
    light, dark = [], []
    for theme in load_themes():
        on_background = mix(theme["bg"], theme["muted"], WASH)
        on_panel = mix(theme["panel"], theme["muted"], WASH)
        is_dark = contrast(theme["bg"], "#000000") < contrast(theme["bg"], "#FFFFFF")
        ratio = contrast(on_background, theme["bg"])
        (dark if is_dark else light).append(ratio)
        print(
            f"{theme['name']:24} {theme['bg']:10} {'dark' if is_dark else '':4} "
            f"{ratio:6.2f} {contrast(on_panel, theme['panel']):8.2f} "
            f"{contrast(theme['muted'], on_background):11.2f}"
        )
    print(f"\nlight themes: {len(light)}, {min(light):.2f}-{max(light):.2f} on the background")
    print(f"dark themes:  {len(dark)}, {min(dark):.2f}-{max(dark):.2f} on the background")
    case = mix(LEDGER["background"], LEDGER["muted"], WASH)
    print(f"Ledger's case face (muted at {WASH} over the background): {case}")

    print("\n2. Ledger's solid faces, as a blend of their line into the background\n")
    for face, line in (("art-knockout", "art-line"), ("art-second-knockout", "second")):
        paper, own, target = (channels(LEDGER[name]) for name in ("background", line, face))
        blends = [
            (paper[index] - target[index]) / (paper[index] - own[index]) for index in range(3)
        ]
        print(
            f"{face:20} {LEDGER[face]}  from {line} {LEDGER[line]}: blend by channel "
            + ", ".join(f"{name} {value:.3f}" for name, value in zip("RGB", blends, strict=True))
        )


main()

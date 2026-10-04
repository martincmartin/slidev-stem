"""Rebuild the selected SVG from the saved source and theme."""

import argparse
from pathlib import Path

from result.art.diving_board import Inks, build


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    arguments = parser.parse_args()
    task = Path(__file__).resolve().parent
    generated = build(Inks.from_theme(task / "inputs/theme/ledger.css")).encode()
    assert generated == (task / "result/public/diving-board.svg").read_bytes()
    arguments.out.write_bytes(generated)
    print("Saved source reproduces the selected SVG byte for byte.")


if __name__ == "__main__":
    main()

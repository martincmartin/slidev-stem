"""Rebuild the selected SVG from the saved source and theme."""

import argparse
from pathlib import Path

from result.art.diving_board import LEADER_DESIGN, NO_BEND_LEADER_DESIGN, Inks, build


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--no-bend", action="store_true")
    arguments = parser.parse_args()
    task = Path(__file__).resolve().parent
    generated = build(
        Inks.from_theme(task / "inputs/theme/ledger.css"),
        leader_design=NO_BEND_LEADER_DESIGN if arguments.no_bend else LEADER_DESIGN,
        id_prefix="diving-board-no-bend-" if arguments.no_bend else "diving-board-",
    ).encode()
    filename = "diving-board-no-bend.svg" if arguments.no_bend else "diving-board.svg"
    assert generated == (task / "result/public" / filename).read_bytes()
    arguments.out.write_bytes(generated)
    print("Saved source reproduces the selected SVG byte for byte.")


if __name__ == "__main__":
    main()

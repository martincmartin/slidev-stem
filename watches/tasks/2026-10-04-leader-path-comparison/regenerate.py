"""Rebuild either saved SVG from this task's source and theme snapshots."""

import argparse
from pathlib import Path

from result.art.diving_board import Inks, build


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--original", action="store_true")
    arguments = parser.parse_args()
    task = Path(__file__).resolve().parent
    generated = build(
        Inks.from_theme(task / "inputs/theme/ledger.css"),
        original_leader=arguments.original,
    ).encode()
    filename = (
        "diving-board-original-leader.svg" if arguments.original else "diving-board.svg"
    )
    expected = (task / "result/public" / filename).read_bytes()
    assert generated == expected, "The saved generator differs from the saved SVG."
    output: Path = arguments.out
    output.write_bytes(generated)
    print(f"Wrote {output}. It matches the saved SVG byte for byte.")


if __name__ == "__main__":
    main()

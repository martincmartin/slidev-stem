"""Rebuild either saved SVG from this task's source and theme snapshots."""

import argparse
from pathlib import Path

from result.art.diving_board import (
    LEADER_DESIGN,
    STRONG_MOVEMENT_LEADER_DESIGN,
    Inks,
    build,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--original", action="store_true")
    group.add_argument("--strong", action="store_true")
    arguments = parser.parse_args()
    task = Path(__file__).resolve().parent
    generated = build(
        Inks.from_theme(task / "inputs/theme/ledger.css"),
        original_leader=arguments.original,
        leader_design=STRONG_MOVEMENT_LEADER_DESIGN
        if arguments.strong
        else LEADER_DESIGN,
        id_prefix="diving-board-strong-movement-" if arguments.strong else None,
    ).encode()
    filename = (
        "diving-board-original-leader.svg"
        if arguments.original
        else "diving-board-strong-movement.svg"
        if arguments.strong
        else "diving-board.svg"
    )
    expected = (task / "result/public" / filename).read_bytes()
    assert generated == expected, "The saved generator differs from the saved SVG."
    output: Path = arguments.out
    output.write_bytes(generated)
    print(f"Wrote {output}. It matches the saved SVG byte for byte.")


if __name__ == "__main__":
    main()

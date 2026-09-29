#!/usr/bin/env python3
"""Small figures of deck_check.py's screenshots, for PLAN.md.

    uv run --project ../../.. python deck_figures.py      # in tools/, after deck_check.py all

Reads ../out/deck/ and ../out/fade/ (fade_check.py), and writes
../evidence/figures/deck-*.png and fade-middle.png, reduced so the task stays
small.
"""

import json
import pathlib

from PIL import Image, ImageDraw

TOOLS = pathlib.Path(__file__).resolve().parent
TASK = TOOLS.parent
DECK = TASK / "out" / "deck"
FADE = TASK / "out" / "fade"
FADE_CROP = (1100, 150, 3100, 1800)  # px of the 3456 px picture: the balance
FIGURES = TASK / "evidence" / "figures"
EVIDENCE = TASK / "evidence"
WIDTH = 1600  # px, of each figure


def reduced(picture: Image.Image, width: int) -> Image.Image:
    height = round(picture.height * width / picture.width)
    return picture.convert("RGB").resize((width, height), Image.Resampling.LANCZOS)


def contact_sheet(paths: list[pathlib.Path], columns: int) -> Image.Image:
    tile_width = WIDTH // columns
    tiles = [reduced(Image.open(path), tile_width) for path in paths]
    rows = -(-len(tiles) // columns)
    tile_height = tiles[0].height
    sheet = Image.new("RGB", (WIDTH, rows * tile_height), "white")
    for index, tile in enumerate(tiles):
        sheet.paste(
            tile, ((index % columns) * tile_width, (index // columns) * tile_height)
        )
    return sheet


def labelled_sheet(frames: list[dict[str, object]], columns: int) -> Image.Image:
    """The opening's frames with their labels and times, in reading order."""
    sheet = contact_sheet([DECK / str(frame["file"]) for frame in frames], columns)
    draw = ImageDraw.Draw(sheet)
    tile_width = WIDTH // columns
    tile_height = sheet.height // -(-len(frames) // columns)
    for index, frame in enumerate(frames):
        x = (index % columns) * tile_width + 8
        y = (index // columns) * tile_height + tile_height - 22
        text = f"{index + 1}. {frame['label']} ({frame['ms after the key']} ms)"
        draw.text((x, y), text, fill=(0x14, 0x3C, 0x6B))
    return sheet


def main() -> None:
    FIGURES.mkdir(parents=True, exist_ok=True)
    outputs = {
        "deck-presenter.png": reduced(
            Image.open(DECK / "presenter-chromium-eager-slide-3.png"), WIDTH
        ),
        "deck-export.png": contact_sheet(sorted(DECK.glob("export-*.png")), 4),
        "deck-window.png": reduced(
            Image.open(DECK / "window-firefox-laptop.png"), WIDTH
        ),
        "deck-overview.png": reduced(Image.open(DECK / "overview.png"), WIDTH),
        "fade-middle.png": reduced(
            Image.open(FADE / "chromium-hairspring-rest-0.5.png").crop(FADE_CROP),
            WIDTH // 2,
        ),
        "deck-opening.png": labelled_sheet(
            json.loads((EVIDENCE / "deck_check-opening-frames.json").read_text())[
                "frames"
            ],
            4,
        ),
    }
    for name, picture in outputs.items():
        path = FIGURES / name
        picture.save(path, optimize=True)
        print(f"wrote {path} ({path.stat().st_size // 1024} KiB)")


if __name__ == "__main__":
    main()

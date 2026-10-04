"""Export each recorded half-swing once. GIF playback is slower than the capture."""

from pathlib import Path

from PIL import Image

TASK = Path(__file__).resolve().parents[1]


def main() -> None:
    for directory in sorted((TASK / "evidence" / "chromium").glob("*/*")):
        frames = [
            Image.open(directory / f"frame-{index:02}.png").convert("RGB")
            for index in range(60)
        ]
        frames[0].save(
            directory / "motion.png",
            save_all=True,
            append_images=frames[1:],
            duration=1000 / 60,
            loop=1,
        )
        previews = [
            frame.resize((frame.width // 2, frame.height // 2)) for frame in frames
        ]
        previews[0].save(
            directory / "preview.gif",
            save_all=True,
            append_images=previews[1:],
            duration=20,
        )


if __name__ == "__main__":
    main()

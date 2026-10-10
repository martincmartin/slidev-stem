"""Check that favicon.py --check compares sizes and pixels, not bytes."""

import io
import unittest

from favicon import ICON_16, ICON_32, icon_bytes, icon_pixels, image
from PIL import Image


def ico(icons: list[Image.Image]) -> bytes:
    """An .ico of `icons`, the largest first, as favicon.py writes one."""
    buffer = io.BytesIO()
    icons[0].save(
        buffer,
        format="ICO",
        sizes=[icon.size for icon in icons],
        append_images=icons[1:],
    )
    return buffer.getvalue()


class IconPixelsTests(unittest.TestCase):
    def test_the_same_pixels_compressed_otherwise_are_the_same(self) -> None:
        # As zlib on another platform does: other bytes, the same pixels.
        frames = [image(ICON_32), image(ICON_16)]
        buffer = io.BytesIO()
        frames[0].save(
            buffer,
            format="ICO",
            sizes=[(16, 16), (32, 32)],
            append_images=frames[1:],
            bitmap_format="bmp",
        )
        self.assertNotEqual(buffer.getvalue(), icon_bytes())
        self.assertEqual(icon_pixels(buffer.getvalue()), icon_pixels(icon_bytes()))

    def test_one_other_pixel_differs(self) -> None:
        small = image(ICON_16).copy()
        x, y = 3, 3
        red, green, blue, alpha = small.getpixel((x, y))  # type: ignore[misc]
        small.putpixel((x, y), (255 - red, green, blue, alpha))
        changed = ico([image(ICON_32), small])
        self.assertNotEqual(icon_pixels(changed), icon_pixels(icon_bytes()))

    def test_a_missing_size_differs(self) -> None:
        only_big = ico([image(ICON_32)])
        self.assertNotEqual(icon_pixels(only_big), icon_pixels(icon_bytes()))


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env bash
# Makes the variants of the Harrison portrait that variants.jpg shows, and
# prints their tones (PLAN.md, sections 2 and 3). Variant 7 is the slide's.
# Usage: variants.sh NEW_SCAN OLD_FILE OUT_DIR
# NEW_SCAN is Commons' "John Harrison (Gemälde) 01.jpg" (1606 x 2000 px).
# OLD_FILE is public/harrison/portrait.jpg before this task (818 x 1000 px),
# from Commons' "John Harrison (Gemälde).jpg".
# Needs ImageMagick 7 (`magick`), and Python 3 with NumPy for tones.py.
set -euo pipefail

evidence=$(cd "$(dirname "$0")" && pwd)
scan=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
old=$(cd "$(dirname "$2")" && pwd)/$(basename "$2")
mkdir -p "$3"
cd "$3"

# Each change is to CIELAB lightness only (channel R in Lab): the colours keep
# their hue. Each variant is 1080 px tall, as the slide's file is.
lab=(-colorspace Lab -channel R)
back=(+channel -colorspace sRGB -resize x1080)
# CLAHE: tiles 12% of the image, 128 bins, clip limit 1.5.
clahe=(-clahe 12x12%+128+1.5)
gamma=$(python3 "$evidence/tones.py" gamma "$scan")

magick "$old" -resize x1080 0-old-file.png
magick "$scan" -resize x1080 1-as-is.png
# The Waltham slide's method (tasks/2026-11-08-waltham/PLAN.md, section 13).
magick "$scan" "${lab[@]}" -contrast-stretch 0.5%x0.5% "${back[@]}" \
  2-waltham-stretch.png
magick "$scan" "${lab[@]}" -equalize "${back[@]}" 3-equalize.png
magick "$scan" "${lab[@]}" -gamma "$gamma" "${back[@]}" 4-flattest-gamma.png
magick "$scan" "${lab[@]}" -gamma "$gamma" "${clahe[@]}" "${back[@]}" \
  5-gamma-clahe.png
# CLAHE alone, with the Waltham variant d's clip limit of 2.5.
magick "$scan" "${lab[@]}" -clahe 12x12%+128+2.5 "${back[@]}" 6-clahe-only.png
magick "$scan" "${lab[@]}" -gamma 1.8 "${clahe[@]}" "${back[@]}" \
  7-gamma1.8-clahe.png

# The Waltham method on the old file, for its clipping only: not in the sheet.
magick "$old" "${lab[@]}" -contrast-stretch 0.5%x0.5% "${back[@]}" \
  0b-old-file-waltham-stretch.png

echo "flattest gamma: $gamma"
python3 "$evidence/tones.py" stats [0-7]-*.png 0b-*.png

# As the slide shows each one: 552 px tall.
for file in [0-7]-*.png; do
  magick "$file" -resize x552 "slide-$file"
done
font=/System/Library/Fonts/Supplemental/Arial.ttf
magick montage -font "$font" -pointsize 20 -label '%t' slide-[0-7]-*.png \
  -tile 4x2 -geometry +10+10 -background '#faf7f0' -strip -quality 85 \
  variants.jpg

#!/usr/bin/env bash
# Makes the contrast variants of the machine-room photo that
# contrast-variants.jpg and contrast-three.jpg show (PLAN.md, section 13).
# Usage: contrast-variants.sh SCAN OUT_DIR
# SCAN is the Rijksmuseum's full scan of RP-F-2001-7-980-60 (5784 x 4002 px).
# Needs ImageMagick 7 (`magick`).
set -euo pipefail

scan=$1
out=$2
mkdir -p "$out"
cd "$out"

# The lower photo on the page, as public/waltham/machine-room.jpg crops it.
crop=(-crop 1473x1097+3534+2035 +repage)
# The darkest and the brightest 0.5% of pixels go to black and white.
stretch=(-contrast-stretch 0.5%x0.5%)
# CLAHE: tiles 12% of the image, 128 bins, clip limit 2.5.
clahe=(-clahe 12x12%+128+2.5)

magick "$scan" "${crop[@]}" -resize 1080x a-current.png
# In CIELAB, channel R is the lightness: the stretch keeps each hue.
magick "$scan" "${crop[@]}" -colorspace Lab -channel R "${stretch[@]}" \
  +channel -colorspace sRGB -resize 1080x b-stretch-sepia.png
magick "$scan" "${crop[@]}" -colorspace Gray "${stretch[@]}" \
  -resize 1080x c-stretch-gray.png
magick "$scan" "${crop[@]}" -colorspace Lab -channel R "${stretch[@]}" \
  "${clahe[@]}" +channel -colorspace sRGB -resize 1080x d-local-sepia.png
magick "$scan" "${crop[@]}" -colorspace Gray "${stretch[@]}" "${clahe[@]}" \
  -resize 1080x e-local-gray.png
# c, blended 45% with an 80% sepia tone of itself.
magick c-stretch-gray.png \( +clone -sepia-tone 80% \) -compose blend \
  -define compose:args=45 -composite f-gray-warm.png

# As the slide shows each one: 552 px tall, and the centre 588 px of the
# 741 px width, so the centre 857 of 1080 px.
for file in [a-e]-*.png; do
  magick "$file" -gravity center -crop 857x804+0+0 +repage -resize 420x \
    "slide-$file"
done
for file in b-stretch-sepia.png c-stretch-gray.png f-gray-warm.png; do
  magick "$file" -gravity center -crop 857x804+0+0 +repage -resize 560x \
    "big-$file"
done
font=/System/Library/Fonts/Supplemental/Arial.ttf
magick montage -font "$font" -pointsize 18 -label '%t' slide-[a-e]-*.png \
  -tile 3x2 -geometry +8+8 -background white -strip -quality 85 \
  contrast-variants.jpg
magick montage -font "$font" -pointsize 18 -label '%t' big-b-*.png \
  big-c-*.png big-f-*.png -tile 3x1 -geometry +8+8 -background '#f8f5ee' \
  -strip -quality 85 contrast-three.jpg

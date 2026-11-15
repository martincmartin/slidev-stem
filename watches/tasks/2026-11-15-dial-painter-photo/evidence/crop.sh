#!/usr/bin/env bash
# Makes public/radium/painters.jpg from the scan of the negative, and the
# contact sheets in this directory (PLAN.md, sections 2 and 3).
# Usage: crop.sh NEGATIVE PRINT COMMONS OUT_DIR
# NEGATIVE: the SSPL scan of Daily Herald negative A4765, 3508 x 2662 px,
#   https://res.cloudinary.com/aenetworks/image/upload/v1/102730389_r1mtgc
# PRINT: the Science Museum Group's scan of print 1983-5236/47273, joined from
#   the tiles of its IIIF service, 6468 x 5214 px,
#   https://zoom.sciencemuseumgroup.org.uk/iiif/3/574%2F976%2FOne_photograph_showing_a_woman_working_in_a_clock_factory.ptif
# COMMONS: File:Las_chicas_del_radio_pintando.jpg, 1152 x 625 px,
#   https://upload.wikimedia.org/wikipedia/commons/c/cd/Las_chicas_del_radio_pintando.jpg
# Needs ImageMagick 7 (`magick`).
set -euo pipefail

negative=$1
print=$2
commons=$3
out=$4
mkdir -p "$out"
cd "$out"

# The negative's picture is x 215-3415 and y 90-2575 of the scan. Its number,
# A4765, is at x 225-727, y 100-226; the emulsion is broken along the bottom.
# Each crop has the current photo's shape, 821 x 650, so the slide's box
# does not change.
crop_whole=(-crop 2867x2270+235+240 +repage)
crop_medium=(-crop 2526x2000+235+300 +repage)
crop_tight=(-crop 2147x1700+420+420 +repage)

# The chosen crop, at 1080 px tall, grey, with no metadata.
magick "$negative" "${crop_medium[@]}" -colorspace Gray -resize x1080 \
  -strip -quality 85 painters.jpg

# Each crop as the slide shows it: 380 px tall.
magick "$negative" "${crop_whole[@]}" -resize x380 a-whole.png
magick "$negative" "${crop_medium[@]}" -resize x380 b-medium.png
magick "$negative" "${crop_tight[@]}" -resize x380 c-tight.png
font=/System/Library/Fonts/Supplemental/Arial.ttf
magick montage -font "$font" -pointsize 16 -label '%t' a-whole.png \
  b-medium.png c-tight.png -tile 3x1 -geometry +8+8 -background white \
  -strip -quality 85 crops.jpg

# The three sources, each 500 px tall.
magick "$print" -resize x500 sources-print.png
magick "$commons" -resize x500 sources-commons.png
magick "$negative" -resize x500 sources-negative.png
magick montage -font "$font" -pointsize 16 -label '%t' sources-print.png \
  sources-commons.png sources-negative.png -tile 3x1 -geometry +8+8 \
  -background white -strip -quality 85 sources.jpg

# The Harrison portrait: source, tones and place

The request is in [instructions.md](instructions.md). The painting is John
Harrison by Thomas King, c. 1767, in the Science Museum, London.

## 1. The source

The old file, `public/harrison/portrait.jpg`, came from Commons'
[John Harrison (Gemälde).jpg](<https://commons.wikimedia.org/wiki/File:John_Harrison_(Gem%C3%A4lde).jpg>)
(1600 × 1955 px, JPEG quality 85). It is a faded copy with a strong red cast:
98% of its pixels were between grey 21 and 134, and the median was 38.

Commons has three other copies of the painting
([evidence/sources.jpg](evidence/sources.jpg), each 500 px tall; read on
2026-11-12):

- **[John Harrison (Gemälde) 01.jpg](<https://commons.wikimedia.org/wiki/File:John_Harrison_(Gem%C3%A4lde)_01.jpg>)**:
  1606 × 2000 px, JPEG quality 90, PD-Art. Its source is "unknown"; its page
  refers to the Museo Galileo's zoom viewer. The sharpest, with the true
  colours: a green tablecloth, a drawing on the paper, blue eyes, and H3 in
  its case behind him.
- **[Thomas King (d.c.1769) - John Harrison … - Science Museum.jpg](<https://commons.wikimedia.org/wiki/File:Thomas_King_(d.c.1769)_-_John_Harrison_(1693%E2%80%931776)_-_1884-217_-_Science_Museum.jpg>)**:
  964 × 1200 px, JPEG quality 66, from Art UK, public domain. The same
  colours, at less resolution and more compression.
- **[John Harrison (1693 - 1776) RMG RP7416.jpg](<https://commons.wikimedia.org/wiki/File:John_Harrison_(1693_-_1776)_RMG_RP7416.jpg>)**:
  a photograph of the painting on a gallery wall, in its frame. Not usable.

The Science Museum's own image is CC BY-NC-SA, a limit that the other
pictures do not have (`tasks/2026-10-30-part-2-visual-language/PLAN.md`,
section 22).

**Chosen: Gemälde 01.** It is still dark: its median grey is 17, and 14% of
its pixels are grey 2 or less.

## 2. Why the Waltham method does not fit

The Waltham print was faded: its tones sat in a narrow middle band (grey 117
to 213), and a stretch of the lightness spread them
(`tasks/2026-11-08-waltham/PLAN.md`, section 13). This painting is low-key,
not faded. Most of the canvas is a dark room, and the wig and the face
already reach near white. A stretch has nothing to spread: on Gemälde 01, the
1st and 99th percentiles go from 0 and 236 to 0 and 242. On the old file, it
clipped 2.3% of the pixels white, in the wig and the face.

## 3. The variants

Each is from Gemälde 01, and changes only the CIELAB lightness, so the hues
stay. [evidence/variants.jpg](evidence/variants.jpg) shows each at the
slide's height, and [evidence/variants.sh](evidence/variants.sh) makes them
and measures them with [evidence/tones.py](evidence/tones.py). Grey levels
are 0 to 255; "white" is the share of pixels with a channel at 254 or more.

- 0. The old file: p1/p50/p99 21, 38, 134; white 0%.
- 1. Gemälde 01 as it is: 0, 17, 236; white 0.39%.
- 2. The Waltham stretch (0.5% at each end): 0, 18, 242; white 1.12%.
- 3. Histogram equalization: 0, 118, 251; white 5.94%. The dark room turns
  grey, and the face is bleached.
- 4. The gamma that makes the lightness histogram flattest: the most entropy
  over 64 bins, for gammas 1 to 4. It is 3.0: 0, 88, 248; white 3.61%. H3
  shows best, but the face is flat, and the JPEG blocks show as blotches in
  the background.
- 5. 4, then CLAHE (tiles 12% of the image, 128 bins, clip limit 1.5): 4, 94,
  247; white 3.02%. As 4.
- 6. CLAHE alone, clip limit 2.5: 6, 31, 231; white 0.46%. The mood of the
  painting stays, but the room stays dark, and H3 is hard to see.
- 7. Gamma 1.8, then CLAHE as in 5: 4, 57, 244; white 1.88%. The clocks show,
  and the face keeps its modelling.

A flat histogram is the wrong target for a painting: its dark areas are there
on purpose, and a gamma that flattens them also compresses the light tones of
the face. CLAHE gives back local contrast after a gamma, within its clip
limit.

**Chosen: 7** (your choice). `public/harrison/portrait.jpg` is now 7, at JPEG
quality 85, with its metadata removed. Gemälde 01 has no colour profile, so
removing the metadata does not change the colours.

## 4. The place on the slide

The painting fills the slide's height, flush with its left edge, as the
photo on the Waltham Watch Company slide does: 443 × 552 px. The title
stands on it, with a 6 px outline in the background colour. The words start
at 482 px.

The title does not cover his head. The top of the wig is 94 px down the
552 px slide, and the title's line box ends at about 81 px.

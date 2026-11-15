# Plan: the dial painter's photo

The Lip, Dip, Paint slide is the second slide of the Radium Girls section
([its task](../2026-11-05-radium-girls/PLAN.md), section 3). Its photo was
USRC's painters, about 1922. The user asked for the photo on Commons,
`Las chicas del radio pintando.jpg`, in its place (`instructions.md`).

## 1. What the photo is

- **The print.** The Science Museum Group holds it in the Daily Herald Archive:
  [1983-5236/47273](https://collection.sciencemuseumgroup.org.uk/objects/co8801010/daily-herald-photograph-clock-making),
  "Daily Herald Photograph; Clock Making", January 14, 1932, by Leslie Cardew,
  made in the United Kingdom. The back says "Hand painting luminous paint on
  dials". The record names no factory. The museum's
  [Radium Girls blog post](https://blog.sciencemuseumgroup.org.uk/the-radium-girls/)
  shows it as "a woman working in a clock factory".
- **The negative.** Its number, A4765, is scratched in its corner. The scan's
  metadata says "1983-5236_A04765", scanned in 2003.
- **The dial** reads "INGERSOLL CROWN", with an inner ring of 13 to 24: a
  24-hour ring, usual in Europe, rare in the US.
- **The factory.** A search result quotes a figure in a Cambridge article: women
  at the Ingersoll factory, January 1932 (Getty Images). The article itself gave
  HTTP 403, so this is not confirmed. The talk says only "a British clock
  factory".
- **The photographer.** Leslie Cardew worked for the _Daily Herald_, a London
  daily. Commons' category for him gives 1903–1954; no other source was found.
- **The Commons file** says "The Radium Girls", 1932, and gives as its sources
  three Spanish news sites and the museum's record. Its CC BY-SA 4.0 tag has no
  source: the uploader is not the photographer.

## 2. Britain's dial painters

- On May 9, 1928, the House of Commons asked about them
  ([Hansard](https://api.parliament.uk/historic-hansard/commons/1928/may/09/luminous-paint-workers)).
  The Factory Department knew of three works with full-time painters, eight
  people in all; jobbing watchmakers also did the work now and then. The paint
  was "a zinc compound with a tiny proportion of a radium compound". The work did
  not wet brushes with the lips, and the inspectors found no disease.
- British clock-making grew after that: Smiths English Clocks started at
  Cricklewood in 1931
  ([Grace's Guide](https://gracesguide.co.uk/Smiths_English_Clocks)).
- So the photo is not one of the American Radium Girls, and the woman does not
  point her brush with her lips. The speaker notes' `IF ASKED` says so.

## 3. The photo for the slide

The slide shows the photo 380 px tall at its left, with three paragraphs at its
right: "4,000 women painted dials", "Shaped brush with lips", "Radium goes into
bone".

- **A. USRC, about 1922 (the old photo).** The right place and time, and a room
  of women gives the scale of "4,000". But the women are small, with their backs
  to the camera, and no dial or brush shows at the slide's size.
- **B. The 1932 close-up.** A face, a hand, a fine brush and a dial, with two
  more painters behind her and tins of dials at her side. Each paragraph lands
  on it: the dial, the brush that needs a point, a person for the bone. But it is
  Britain, ten years later, with no lip-pointing. The slide does not say where
  the photo is from; the article's alt text, the credits and the `IF ASKED` say
  it.
- **C. Both,** the room and then the close-up at the second click. A second
  picture change on the slide and a second figure in the article, for little:
  B already shows the women behind her.

Ranked: B, A, C. The talk is told to a room in a bar, where only a large, simple
picture reads (`AGENTS.md` at the repo root: concrete and vivid). The user chose
B.

## 4. The scans

`evidence/sources.jpg` shows the three, each 500 px tall.

- **The negative, scanned by the Science & Society Picture Library (chosen).**
  3508 × 2662 px: the whole frame, not retouched. The lead image of
  [History.com's Radium Girls article](https://www.history.com/articles/radium-girls-workplace-safety)
  ("SSPL via Getty Images") is this scan; its image host gives the original at
  [this address](https://res.cloudinary.com/aenetworks/image/upload/v1/102730389_r1mtgc)
  (`fl_getinfo` gives 3508 × 2662).
- **The print, scanned by the Science Museum Group.** 6468 × 5214 px, from its
  IIIF service, which gives at most 512 px a request, so 143 tiles joined. More
  pixels, but a worse picture. In 1932 the print was retouched: the two women
  behind her, the window and the brick wall are airbrushed out. An editor
  painted two grey bars and two white arrows across her hair, the background
  and her blouse. The corners are torn and taped.
- **The Commons file.** 1152 × 625 px, a crop of the negative's scan, with its
  top and bottom cut.

The slide shows the photo 380 px tall. On a 1080p projector a CSS px is about
1.96 device px, so it needs about 745 px. The chosen crop is 2000 px tall, and the
file is scaled to 1080 px tall, as `public/harrison/portrait.jpg` is.

## 5. The crop

The negative's picture is x 215–3415 and y 90–2575 of the scan. Its number is at
x 225–727, y 100–226, and the emulsion is broken along the bottom. Each crop has
the old photo's shape, 821 × 650, so the slide's box and its text do not move.
`evidence/crops.jpg` shows three, each 380 px tall, as the slide does:

- **whole**, 2867 × 2270 px at 235, 240: the most context; the dial is about
  56 px wide on the slide.
- **medium (chosen)**, 2526 × 2000 px at 235, 300: the two painters behind her,
  the vials and most of the tins; the dial is about 63 px wide.
- **tight**, 2147 × 1700 px at 420, 420: the dial is about 74 px wide, but the
  painters behind her are cut at the edge, and so are the vials.

A few specks of dust show on the wall. They stay: the photo is not retouched.

## 6. The rights

- The museum credits the photo "© Mirrorpix/SMG Images". Its CC0 and CC BY 4.0
  cover the record's text, not the image.
- If Cardew died in 1954, the photo has been in the public domain in the UK
  since 2025. In the US, a photo published in 1932 is protected for 95 years,
  until January 1, 2028. Its crop marks suggest that the paper published it; that
  is not confirmed.
- So it does not meet the root `README.md`'s rule for a file from elsewhere. The
  user chose to use it (`instructions.md`, the second message). The credits say
  "© Mirrorpix/SMG Images", and `public/radium/README.md` says why.

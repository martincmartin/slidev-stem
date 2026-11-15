# Plan: the dust on the dial painter's photo

The photo on the Lip, Dip, Paint slide is a crop of the scan of the 1932
negative ([its task](../2026-11-15-dial-painter-photo/PLAN.md)). The scan has
black specks: one on her chin, and a cluster on the wall in front of her. Each
large one has a white center, so they are dust or damage on the negative, not
paint in the room.

## 1. The specks

A search for pixels much darker than their 31 px median, that are nearly black
(below 45) on an area at least 90 levels lighter, gave a list. Most of the list
is real detail: numerals, hair, shadows. These 14 are dust, each looked at
enlarged (`evidence/retouch.py`, `SPECKS`): the chin, five on the wall in front
of her (the largest are 17 × 20 and 15 × 17 px), a fiber on the wall at the top
left, and seven small dots. Each is on a smooth area: skin, a wall out of
focus, a window bar, paper.

## 2. Options

- **A. Fill each speck from the pixels around it (chosen).** OpenCV's
  inpainting (Telea), then grain: noise with the standard deviation of the fine
  detail in a ring around the speck, so the patch is not smoother than the
  photo. It changes 1,815 px, 0.12% of the photo. Pro: no other source, no
  download, the tones and grain stay the scan's; a script makes it again. Con:
  it would invent detail in an area with structure, but no speck is on one.
- **B. Lift each area from the Commons copy.** Its wall is clean: someone
  removed the specks. Con: its tones are much more contrasty than the scan's,
  it has fewer pixels, and it needs a download, an alignment and a tone match
  for each patch. It gives no detail that A lacks, because the areas are smooth.
- **C. Lift each area from the Science Museum Group's print.** Con: the print
  was retouched in 1932, and its background is painted out
  (`evidence/sources.jpg` in the photo's task).
- **D. A service:** a photo retoucher, or Photoshop's Spot Healing Brush. Con:
  more cost and time for the same result on small specks on smooth areas. It is
  the choice for damage across faces or detail.

Ranked: A, B, D, C. A gives a clean result here with the fewest steps, and
`evidence/comparison.png` shows each speck before and after, enlarged 6 times.

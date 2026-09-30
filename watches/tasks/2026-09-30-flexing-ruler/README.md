# 2026-09-30 flexing ruler

Slide 2 gets a steel ruler after the hairspring. See [PLAN.md](PLAN.md).
`tools/flexing_ruler.py` writes the SVG; `evidence/` has the SVG as shipped.
The live copies are `watches/art/flexing_ruler.py`, `watches/public/flexing-ruler.svg`
and `watches/components/FlexingRuler.vue`.

## After review.md (2026-09-30)

Fixed in the live files, not in the copies here: the clock runs only while the
slide is on screen and `playing` (findings 1); `frame_count` is now
`Timeline.frames`, with a check that the frame rate does not change any
`begin` or `dur` (3); the four small items. Finding 2 (print/export) was
left out on purpose: the ruler has no still for the export.

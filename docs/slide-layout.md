# Slide layout: a picture and its text

**Covers:** the default place for a picture and its text on a slide, the type of
that text, how clicks add to it, how to move the border between picture and text,
and when to leave the default.
**Read before** you place a picture or text on a slide, or choose the type of a
slide's text.
**Tasks:**
[`watches/tasks/2026-10-04-hairspring-sentence-placement/`](../watches/tasks/2026-10-04-hairspring-sentence-placement/)
(why 35 px),
[`watches/tasks/2026-10-30-part-2-visual-language/`](../watches/tasks/2026-10-30-part-2-visual-language/README.md)
(words on a map, and on a picture).

## The default

Use this design when a slide explains something mainly with a picture, and the
words support the picture. The Longitude From Time slide in `watches` is an
example.

- **The picture is on the left, and the text is on the right.** Each takes the
  room that it needs.
- **60/40 is a guideline, not a measure.** Move the border between them until the
  slide looks good.
- **Centre the text vertically, under the title.** Use the space from the bottom
  of the title, or of the subtitle, to the bottom of the slide. Centre all of the
  text of the last click, so that each paragraph keeps its place when a click adds
  another. Text that leaves at a click is its own group, centred by itself. The
  house theme's class `side-text` does this, and sets the type below. Each slide
  sets its own `left`.
- **The type is the body font at 35 px, weight 600, line height 1.25.** The author
  sets each line break (`white-space: nowrap`).
- **Each click adds a paragraph,** with 0.7 em above it.
- **The paragraphs before the newest one dim.** The newest paragraph is the focus,
  and the earlier ones stay so that the audience can look back.
- **The one number to take home is larger:** 48 px, line height 1, in the accent.
  All other text stays in the type above.

A label on a map is different. It stands at its place on the picture, in smaller
type.

## Move the border

The picture and the text share the slide's width, so each slide finds its own
border. These `watches` slides are examples:

- **A wide picture leaves a narrow rail:** the Escapement is horizontal, so a text
  rail beside it can be narrower than 40%. If that rail cannot hold the text that
  the slide needs, shrink the picture and widen the rail.
- **A supporting picture leaves more room for text:** on the Ticks and Turns slide,
  the hand is small, and the text takes the room that its table needs.
- **Long lines move the border left:** on the Gears and Gear Train slides, the text
  starts left of the 60% line.

When only the place changes, keep the type.

## When to leave the default

The default is a starting point, not a limit. Leave it when the slide's story needs
something else:

- **Clicks replace some of the text, so no one click shows all of it:** on the Gears
  slide, callouts stand next to their gears, above the rule, and leave before the
  last click. The callouts and the text are one stack, and the stack is centred.
- **The picture is the whole slide:** on the Recap slide, the only text is a caption
  and a time scale.
- **There is no picture:** on the Longitude Act slide, the words are on two cards.
  On the Seconds a Day slide, each click is a screen of a few big words.
- **The words are the picture:** on the Isaac Newton slide, the words fill the
  slide's width, centred, in a script. They still use `side-text` to centre them.

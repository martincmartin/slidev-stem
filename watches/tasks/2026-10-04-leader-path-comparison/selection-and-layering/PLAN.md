# Select slide 2 and keep its ghost on top

Read [watch.md](../../../docs/watch.md), [slide-patterns.md](../../../docs/slide-patterns.md), and [measurements.md](../../../docs/measurements.md).

## Options and choice

1. Draw the reference after the live board in the same SVG.
   SVG paint order places the ghost above the board. Both use one animation clock.
   The slide already paints above the WebGL watch layer.
2. Add a separate HTML overlay for the ghost.
   This adds a second SVG or renderer and requires clock synchronization.

Select option 1. The current SVG draws the reference before the board.
That order hides dashed segments behind the board's fill, until the board fades out.

## Work

- Save the three existing variants and their sources before removal.
- Keep the current slide 2 and its selected leader weights.
- Remove the two comparison slides and their unused production assets and code.
- Draw the ghost and callout after the board in SVG paint order.
- Check unchanged geometry, leader paths, and animation timing.
- Verify topmost reference pixels during curling, on the curled board, and on the live hairspring in both browsers.
- Check slide exit, reverse clicks, and direct entry with outside requests blocked.
- Update docs, format, and run canonical validation. Do not commit.

## Zero-bend experiment

The user requests a new copy after slide 2, with only the bend coefficient set to zero.
Keep the selected length and movement coefficients, geometry, paint order, and click sequence.
Give the experiment distinct SVG IDs.
The old original and strong-movement comparisons remain removed.
Verify both current variants in Chromium and Firefox.

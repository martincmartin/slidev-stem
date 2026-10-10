# The Gears slide's callouts

The request (2026-10-10): make "Half of the small gear" and "A quarter of the
big gear" callouts, and drop the flash that came when each line had faded in.
That flash competed with the text: the eye goes to the new words, so it
either misses the flash, or the two pull against each other.

## What changed

- Each of the two lines is a `WatchCallout` with an ink leader to its gear:
  the small gear, then the big one. They keep the sentence's type and place.
- Not keyword callouts: the leader points at the gear that the whole label
  names, and a leader in the second would merge with the span
  ([watch.md](../../docs/watch.md#the-gears-slide)).
- The leaders aim at the arbors and end `LEADER_GAP` px outside the tip
  circles (`gearsMarks` in `watch/callouts.ts`; `pinionTip` in
  `watch/teeth.ts`). The gears turn, but their tip circles do not move.
- The big gear's leader bends: straight, it left its label from below and
  crossed "Twice the radius".
- Clicks 2 and 3 no longer set `watchFlash`. `watchFlashAfterText` and
  `watchFlashInverse` stay in the timeline, unused, for a later slide.

## Options considered

1. Callouts, no flash (chosen). The leader ties the words to the gear while
   they are read. The span, in the second the whole time, shows the teeth.
2. Callouts, and keep the flash. Two cues for one point, and the flash still
   comes while the eye is on the words.
3. Flash before the text, not after. It removes the competition, but the
   audience sees teeth flash with nothing yet to say why.

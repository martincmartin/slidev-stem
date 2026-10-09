# Flash the Gears slide's spans after their text

Read [watch.md](../../docs/watch.md), [slide-patterns.md](../../docs/slide-patterns.md),
and the house [navigation rules](../../../docs/navigation.md).

The new requirement links an attention cue to a completed text reveal.
The existing timeline requires a change to the watch before it can flash.

## Options, in rank order

1. Extend the existing flash with a text delay and inverse inks.
   This keeps the five-cycle clock and one renderer. No new timers or dependencies are needed.
   The layer waits for the browser's opacity transitions to finish. The timeline can flash without changing a watch channel.
2. Add a separate timer and recolour path for this slide.
   This confines the trigger to one slide, but duplicates cancellation and flash timing.
3. Change the spans' permanent colours before each flash.
   This uses the ordinary flash, but adds a presentation change that the request does not need.

Choose option 1. Keep ordinary flashes unchanged. The inverse cue maps second inks to subject inks during each first half-cycle.
The second half-cycle restores the permanent second inks.
A jump or backward step does not start a cue.

## Verification

Test delay boundaries, all five inverse cycles, cancellation, and frontmatter scope.
Run the talk's canonical full validation and inspect both text cues in Chromium, Firefox, and WebKit.
Keep source snapshots and the browser timing tool in this directory.

## Browser timing finding

A delay measured from the navigation callback started one frame before the text reached full opacity.
The CSS transition starts after the DOM update. The cue now waits for the browser's completed opacity transitions.

# The Gears slide: the transition

**Request (2026-10-07).** A new slide after the Escapement slide: title "Gears",
subtitle "Fast gear, meet slow gear." It explains gear ratios. This first step
is only the transition. The whole Escapement picture (the mechanism, its
callouts, the words at the strikes) fades out. Then the escape wheel's pinion
with its arbor, and the fourth wheel (its wheel, not its pinion) with its
arbor, fade in. No seconds hand. The audience has not seen these parts, so the
view does not have to show where they are in the watch: the camera can jump.
The pair takes most of the slide, with room for callouts.

## What is on the fourth wheel

In this model (as in an ETA 6497), the fourth wheel's arbor carries:

- the fourth wheel itself (16 teeth), which drives the escape wheel's pinion
  (8 leaves): a ratio of 2 to 1;
- its own pinion (4 leaves), which the third wheel drives;
- the seconds hand: the fourth wheel turns once a minute.

The new subject, `gears`, has the fourth wheel's body, hub and arbor, and the
escape wheel's pinion and arbor. It leaves out the fourth wheel's pinion, the
seconds hand and the escape wheel.

## How the stage gets from one picture to the other

The stage's rule now: between two subjects where neither holds the other, the
rest of the watch fades in around the old subject, the camera moves, and the
rest fades out around the new one. The request rules that out.

The watch already fades out and back in at two places. A swap fades the
difference between two subjects where one holds the other (back from the
Escapement slide). And `global-bottom.vue` hides the canvas for a slide
without the watch; out of sight, the stage jumps to its last target
(`goOutOfSight`), and the canvas fades in on the next slide with the watch.
Only the trigger is missing.

| Option                                                                                                               | For                                                                                          | Against                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Keep the rule (rest in, move, rest out)                                                                           | no code                                                                                      | shows the whole watch for about 4–5 s: the spatial story that the request does not want                                                                                      |
| **B. A cut step hides the canvas for a moment, and reuses the jump out of sight**                                   | reuses the canvas's fade and `goOutOfSight`; about 40 lines in `global-bottom.vue` and a key | the canvas's fade is 0.3 s, not the swap's 0.8 s                                                                                                                              |
| C. A cut in the stage's timeline: a picture-opacity channel in the renderer's mix shader, and a zero-length jump phase | 0.8 s fades, from any picture on the screen, even a swap cut short                           | built first, then dropped: about 315 lines in 12 files (renderer, timeline, stage, probe checks, tests) to do what the layer already does. The user asked why; there was no good answer |

**Chosen: B.** The slide asks for it with `watchCut: true`: the step between
this slide and the previous one, in either direction, is a cut. The key names
the boundary between two slides, not a direction, so the layer still does not
ask which way the viewer went (`docs/navigation.md`, rule 1). The new slide's
text waits for the canvas to hide (400 ms, `HIDE_MILLISECONDS`), then fades in
with the new picture.

## The view

The fourth wheel and the escape pinion are one above the other in the
movement's layout (the line between their arbors is about 26° from vertical).
A `View` has no rotation, so the pair stays upright: it is tall, and the
callouts go on its right, as the house rule wants ("the main focus is on the
left"). `fitView` fits the pair in `GEARS_FRAME`, the height under the
subtitle, with the pair's middle at the frame's middle. Tilt 20°, as on the Escapement slide, so that the arbors show as
posts, not as dots.

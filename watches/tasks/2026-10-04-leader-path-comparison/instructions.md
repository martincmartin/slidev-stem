Ok let's do 1.  Also, create a copy of slide 2, inserted after the current slide 2, with the earlier curl paths, the one you initially came up with that didn't optimize anything and was pointing at the far side of the board.  The motion of the leader line was particularly smooth there.

Option 1 is dynamic programming over sampled contacts on the whole curl path.
Use squared endpoint velocity perpendicular to the leader's final segment.
Keep the short initial leader on slide 2. Do not commit.

Also, lets simplify the ghost during and after the curl.  The main motivation is that, once all curled up, the angle we're using to view the curled diving board/hairspring is shallow enough that having both the near and far sides, with thick dashed lines, is visually cluttering.  So, at the moment the curl starts, have the ghost be simply the single line that will end up on the outward facing edge of the diving board.  This probably means a discontinuous jump in the leader line end point, so find the new end point (the closest point to the call out or kink point) and start the optimization from there.  Please record the reason to use the 3D outline before the curl (its visually useful) and not for the final hairspring spiral (too visually cluttered) and curling (also too visually cluttered).

Comparison choice: Preserve the original ghost and leader.

## Viewer-facing edge correction

For the single ghost line on the hairspring, you have it on the wrong side, the far (hidden) edge, please move it to the other edge of the ribbon, closest to the viewer.

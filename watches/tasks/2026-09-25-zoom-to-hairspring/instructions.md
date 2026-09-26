# From cover zoom to hairspring

The first slide is the cover slide showing an animated illustration of a skeleton watch.  The code that creates it is in art/skeleton_watch.py, and the SVG itself is in ./public/cover/skeleton-watch.svg .

The second slide will be about the hairspring and balance wheel.  For a transition, I'd like the text on the cover slide 1 to fade out, and for us to zoom into the hairspring, having the hairspring and balance wheel take up approximately the area that the case takes up now.  Then I'd like the rest of the illustration to fade out, leaving just hairspring, still animating.

Please generate a PLAN.md in this directory.  It would be great if the movement of the hairspring, pallet fork, etc could continue smoothly, i.e. there's no moment when their positions jump back to time zero.  But if that would require Herculean effort and/or make the resulting code convoluted and hard to maintain, it may not be worth it.

Please brainstorm and suggest possible implementations.  This pattern, of zooming to different parts of the model, will likely continue for the rest of the talk, and we might e.g. add minute and hour weels later on too.

# Stage 2

While I'm still developing the narrative, I may want a 3D looking hairspring, where we can look at it from a 30 degree or 45 degree angle off the vertical, to show that it's actually a ribbon and has depth.  Bringing the animation to a stop before making the 3D transition might actually be useful pedagogically.


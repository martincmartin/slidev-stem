# Instructions

The request, 2026-10-28:

> So we're starting part 2, talking about the longitude problem. First is to
> describe the problem. Create a task, and don't modify the talk yet, but
> think: how hard would it be to create a 3D model of the earth, with the
> outlines of the continents, and lines of longitude on water (oceans and
> seas), say spaced every 15 degrees? I may reuse this model for a while, e.g.
> to show the path of the 1707 Scilly naval disater, or Anson's search for
> Juan Fernández Island in May–June 1741, which would need finer lines than
> every 15 degrees, and more detail than the initial "whole globe" or
> "atlantic ocean" version.
>
> But for now, let's focus on continents (without longitude lines) and
> oceans/seas with 15 degree lines. How hard would it be to create such a
> WebGL diagram that works well on both desktop and mobile?
>
> Create a task directory for this.

The second message, the same day, with a textbook figure of a globe: a line
drawing with stippled land, meridians every 15° that cross the land, the
equator, and labels:

> You mention "A flat triangle sinks below the sphere's surface in its middle.
> If it sinks too far, the ocean covers it." Are you assuming the water is
> under everything? Why is that? Perhaps we have land triangles and separate
> water triangles, and they could be any size.
>
> I'm picturing this more like a wireframe or drawing, we dont neccesarilly
> need to fill in the water at all, although we do want hidden line removal.
> Something like this diagram, except the longitude lines don't go through
> the land.

The third message, the same day:

> I'm not sure whether I'll want the water to be water color, it might be
> helpful especially for the zoom ins (Scilly, Anson search). I'll probably
> want to see both before I decide. The land can be paper color though I
> think.
>
> Let's go for a spike, blank land. I agree 'watch: [globe]' is bad, I'm not
> sure the tradeoff between "a general name for all the talk's art, or should
> the globe get its own keys?"
>
> For mobile, I mean the article on a phone, I don't think there's much point
> in having the deck on the phone. Also they don't need to spin the globe by
> touch.

During the spike:

> Please explain the pros and cons of the frontmatter keys. Is it purely
> asethetic? We have no plan to mix the watch and globe on the same slide, but
> if it came to it, does one choice allow it and another not? I'm not sure
> the issues here, please explain to me (and in PLAN.md).

> Also, the Scilly and Anson models can be separate models, they don't need to
> be regions on the globe, although it might be nice to rotate & zoom the
> globe to them and between them. But that could be done several ways, e.g.
> rotate and zoom in, then fade from the globe model to the specific model.
> Not sure the best solution here, I'm just brainstorming ideas.

> You said "The back half can be hidden by a sphere drawn in the paper's
> colour, " why does it need to be a sphere, why not a disc through the
> center of the globe (a great circle filled in), that's always perpendicular
> to the viewing direction?

> I agree with K1, you can choose the prefix name. I feel like the water color
> *is* the wash color, and the line color that's used where the pool water
> touches the pool walls, and also the outline of the diving board, could be
> used as a border color. How well would that work in our other color
> palettes?

> In the spike, what is step 1.5 vs 3, finish 1 vs 0? The lines don't look
> thick enough. They should be the same as the outline lines for the watch,
> e.g. the edges of the hairspring. The line width is fixed in screen
> dimensions, i.e. as we zoom from the "Mechanical Marvels" slide to the
> hairspring slide, the number of pixels doesn't change, so they're a smaller
> percentage of the width of the hairspring. The spike's longitude and coast
> lines seem thinner than the lines on the slides.

> Looking at the spike, I think the water should be bluer/darker, like the
> pool water. The pool water can also be the ocean water. What is the other
> color we need, that's not in the pool SVG/scene?

> Please shut down the spike server for now, I'll be doing something with my
> laptop soon and don't want other processes running in the background.

> In the pool SVG, the ege of the pool, where it intersects the walls, has a
> line, also the diving board bends down to where it is drawn on top of the
> pool water, so its out edge is also a boundary line with the pool.

> How did you get confused about what was wash vs edge/line? We should figure
> out how not to get confused again.
>
> There should be something in the docs that the "water" color is a wash
> color. Or should we just rename it water-wash, to be consistent with other
> wash colors? Making it obvious is better than documenting it. And we should
> document the contrasting edge line color.
>
> This will be a change outside the task directory; that's ok.

> Please start the dev server again, so I can see the globe

> I feel like we need two names, not a 0.6 that's sneaking in, trying to
> auto-generate one from the other.
>
> Sure add the entry to the agent-house watchlist.
>
> "In the theme doc's table of line colours and their washes (docs/theme.md,
> "The pairs"), water is a line colour whose wash is "(none yet)". " Is that
> the root cause?

The answers to two questions, the same day: the fill's name is `water-wash`;
the pool's edge becomes a color of its own (`water`), at full strength.

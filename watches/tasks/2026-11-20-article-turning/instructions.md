# The request

The user's messages, verbatim, in order.

> In part 1 of the article, should we allow the user to rotate the 3D watch
> models by clicking and dragging, Ciechanowski style? Its the sort of thing
> that really gets a geek excited. Plus it lets me use "Interactive 3D" in the
> HN submission title.
>
> If you do add it, guard against three classic web-3D traps. First, never
> hijack scroll-wheel zoom—nothing annoys readers faster than trying to scroll
> down an article and accidentally zooming into a gear tooth. Second, watch
> mobile touch scrolling, since a full-width draggable canvas can trap
> someone's thumb on a phone unless you constrain it or add a toggle. Third,
> clamp the tilt angles and add a subtle "Reset view" button once someone
> drags the scene, so they can't spin the watch edge-on and lose the thread of
> your explanation.

> Maybe not for the recap, which does its own camera motion.

> In the recap, we go to almost 90 degrees. I think we can safely rotate 90
> degrees in any direction, i.e. we can get edge on (from any edge, i.e.
> rotate vertical, horizontal and anything in between) but not see from
> behind.
>
> Sure, let's go with touch option A.

(Option A: on a phone, a sideways drag turns the watch and shows its depth,
with no mode or toggle; a vertical swipe scrolls the page.)

> Commit now, then do the rotation. check how it looks at exactly 90 degrees,
> you know things might start fighting for what's on top or something. If you
> want to limit it to 89 degrees, or 89.9 degrees, that works too.

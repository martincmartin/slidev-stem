# Instructions

From the user, 2026-10-24, after a bug in the article: each figure's model
re-uploaded the mainspring's geometry only when its own pose changed, while
all the figures share one renderer, so a figure could show another figure's
spring.

> When should we invalidate the cache? What's a good way to ensure that
> figures start in their default state no matter how we get to them? Of
> course, when we transition the normal way from one click of one slide to the
> next click/slide (by clicking), we want the animations to make a smooth
> transition. But we also want the illustrations in the article, and when we
> jump to a given slide/click, to end up correct.
>
> Moving backward is currently in bad shape. It's easy, by pressing "back"
> several times in a row, to have a weird subset of things on the screen.

## Scope

- Reproduce the bug of rapid presses, with a tool, and find its causes.
- Answer when a cache must be invalidated, and how a figure or a jump ends
  correct whatever the path to it.
- Propose the options, ranked. Do not commit without the user's approval.

## The second rule

From the user, 2026-10-25, after trying option 1:

> Let's have a new rule: if you hit "back" aka "left", and you're already in
> the middle of a transition, just snap to the result rather than play the
> final animation. The problem is, often when you're hitting back, you're
> looking for a certain view, and you stop when you see it. For example,
> suppose you're looking for the pool in the hairspring slide, and you keep
> hitting back until you see the water. In the current setup, when you're on
> slide 4 and hit "left" three times, you don't see the pool right away so you
> keep going. You end up going right past it. Or if you're looking for the
> "Part 1 mechanical marvels" screen, with the whole watch on the right,
> currently you have to stop when you see the hairspring alone on the left
> which is counter intuitive.
>
> Something similar happens when going forward. If I want to go to the start
> of the escapement slide, and I keep pressing forward until I see the
> escapement, I end up stopping on /5?clicks=1, just to see it disappear.

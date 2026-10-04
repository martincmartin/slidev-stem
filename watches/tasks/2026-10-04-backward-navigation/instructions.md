# Instructions

From the user, 2026-10-04:

> When going from slide 4 to slide 3, the rest shape appears instantly, then
> fades out. When going from 3 to 2?clicks=4, it appears instantly.
>
> I feel like there are many bugs when going back a slide (and perhaps a click
> in a slide). What can we do about that? For example, do we have to say both
> directions explicitly -- what happens during a forward click, and then also
> what happens during a backward click -- or does the backward default to the
> opposite of the forward? What can we do to the engine or other parts of our
> project so that future work only thinks about the correct forward path, and
> the backward happens automatically? I get that some things may not be
> automatic, e.g. the watch animation always goes forward in time (when you go
> backward a slide, the hands still move clockwise), while some other
> animations run backwards (diving board uncurls when going backwards). Still,
> there should be some general rules of thumb that give good defaults, e.g.
> fades and flashes are visual effects to draw the viewer's attention, so those
> go backward, but the watch mechanism is a physical process, so it always goes
> forward. Something like that.

## Scope

- Diagnose the two reported bugs, and look for others of the same kind.
- Propose rules of thumb (defaults by kind of animation) and changes to the
  engine and the project, so that a slide author writes only the forward
  path. Rank the options.
- Do not commit without the user's approval.

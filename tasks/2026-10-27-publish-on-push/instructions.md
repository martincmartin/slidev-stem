# The request (2026-10-27)

GitHub Pages had not been published since 2026-10-22: the publish workflow ran
only on a `given/*/*` tag or by hand. The user asked:

> Should it run automatically whenever a file in watches/ is changed that
> changes what is rendered? e.g. if slides.md is changed, but not if only
> tests/validation has changed, that sort of thing.

And then:

> You shouldn't publish if the talk changes are not in the watches/ directory,
> but only in the root slidev-stem/ directory (and sibling directories of
> watches/), and the talk is retired/frozen (whatever the tag is called now).
> The idea is that retired/frozen talks are allowed to go stale/bitrot, e.g.
> we might update Slidev to a major revision with incompatible changes and not
> want to update watches/ if its frozen. In that case, the GitHub Pages should
> just stay with the old version.
>
> Of course, if you change something in the watches/ directory that could
> affect the pages (e.g. slides.md), then it might be worth trying to rebuild
> pages, since clearly someone is making changes even though it's supposed to
> be frozen.

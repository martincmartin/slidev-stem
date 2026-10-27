Last milestone: 2026-10-25, be03b01

# Watchlist: the watches talk

**Covers:** the corrections in this talk that may come back, but have no
lesson yet. The `learn-from-corrections` skill says what an entry holds, and
when to read and change this list.
**Read before** you sort a correction in this talk, and before you tag it.

- **2026-10-25: a step in a paused article figure changed the text, not the
  picture.** The figure's state came from a clock that ran only while the
  figure played. Why it was done that way: the rule "the settled screen
  depends only on the slide and the click" (`slidev-practices`) was applied
  to the talk, where time always runs; a paused figure never settles. Why it
  was not caught sooner: no check steps a paused figure. Earlier corrections
  of the same shape (a state reached on a path other than a forward step at
  play): 5f728d4 (a reload), ae4f60f (an entry after a click), cedea24 (a
  page that starts paused). Commit be03b01,
  [task](../tasks/2026-10-25-paused-figure-steps/PLAN.md).
- **2026-10-27: the static article's figures were blank on GitHub Pages,
  from 2026-10-14 to 2026-10-27.** The prerender added a second `class` to
  `<html>`, so the page lost the palette's class, and each figure's watch
  threw. Why it was done that way: the prerender was written on 2026-10-13,
  when `<html>` had no class; the palette addon added one on 2026-10-14. Why
  it was not caught sooner: no check opens the static page after the
  prerender, and validation does not run the prerender; `pnpm dev` has no
  static page; the figures' errors are console errors, not page errors, so
  nothing failed. Now `static-page.test.ts` covers this case, and
  `staticPage` fails on an HTML parse error (parse5). If the static
  page breaks again, make the prerender open the page that it wrote, and
  fail if a figure does not draw.

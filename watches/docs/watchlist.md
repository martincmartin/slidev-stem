Last milestone: 2026-11-01, 4d8e1c8

# Watchlist: the watches talk

**Covers:** the corrections in this talk that may come back, but have no
lesson yet. The `learn-from-corrections` skill says what an entry holds, and
when to read and change this list.
**Read before** you sort a correction in this talk, and before you tag it.

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
  fail if a figure does not draw. Since 2026-11-01, the house's browser
  checks fail on a logged error too (`stem/tools/browser.ts`).

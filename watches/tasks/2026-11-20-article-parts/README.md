# The article in three pages

The article, split into a page for each part of the talk, with only the art
that each page's figures show.

- `instructions.md`: the request.
- `PLAN.md`: what every page loaded, measured; the options for the pages
  and for the watch's unused parts, ranked; the decisions; the steps; the
  results.
- `evidence/`: the measurements before and after (`before.jsonl`,
  `after.jsonl`), the script that took them (`measure.py`), and the check of
  the pages in three engines, with and without JavaScript
  (`check_pages.py`).

2026-11-20: at the user's request, the article has no list of credits: each
photo's credit is under its figure (`> [!credit]`), so each page has only
its own. The Questions slide is in the talk but not in the article
(`articleHidden`), and `articleEveryPage` is gone. The links to the parts
are at the end of each page, not under the byline, and "The figures are the
talk's slides, live. Pause them all" is now "Pause all figures": a reader
may not know the talk.

2026-11-20: Slidev's `preloadImages` (on by default) put a preload of
every slide's photos in each page's head, so Parts 1 and 3 loaded Part 2's
five photos. The headmatter turns it off. Part 1 now transfers 2,450 kB
in Chromium (2,162 in Firefox), not 3,357; Part 3, 1,365 kB, not 2,254;
Part 2 is unchanged (`evidence/measure.py`, the same way as section 7).

# 2026-09-30 Organize the house docs and the talk's docs

The request is in [instructions.md](instructions.md). **Status:** review and
plan only. The only change so far is the "House docs: read before you act"
index in `stem/AGENTS.md`.

## 1. What is there now

| File                              | Words | What it holds                                                                                                                      |
| --------------------------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------- |
| `docs/README.md`                  |   988 | an index; a one-paragraph summary; why `docs/` and `tasks/` are separate; a table of decisions; the unknown venue                  |
| `docs/theme.md`                   | 1,627 | the nine palette values, how to use them, the gates, adding a colour, pasted content, dark themes                                  |
| `docs/illustrations.md`           | 2,313 | the SVG grammar: size, the four art colours and their jobs, opacity rules, strokes, motion, washes, how to draw one                |
| `docs/webgl.md`                   | 2,311 | 3D art: layers, the files of `watches/`, the renderer's contract, the 3D style, the watch's frontmatter, budgets, checks, mistakes |
| `docs/legibility.md`              | 2,078 | venues, the two floors, flare, reading the metrics, text sizes, how to check, how the metrics mislead                              |
| `docs/talks.md`                   |   904 | talks as projects: layout, setup, why, validation, upgrades                                                                        |
| `watches/docs/README.md`          |   159 | an index                                                                                                                           |
| `watches/docs/slide-patterns.md`  | 1,669 | the theme on a slide, the card, clicks, the live watch, the ruler, notes, sizes, credits, "before you ship"                        |
| `watches/docs/rough-slides.md`    | 1,827 | the talk's outline, as working notes                                                                                               |
| `watches/docs/measurements.md`    |   452 | back-row numbers for the timekeepers and the cover watch; line widths when the view zooms                                          |
| Also: `tools/README.md`           | 1,560 | each tool; commands; which tool is the authority; signatures; why tools are copied into tasks                                      |
| Also: `themes/ledger/README.md`   |   292 | what the theme sets, and its rules                                                                                                 |
| Also: `README.md`, `watches/README.md` | 555 | how to run; what is where                                                                                                   |

Total: about 17,000 words, or about 23k tokens.

## 2. Findings

### 2.1 Out of date or wrong

| #  | Where                                                    | What it says                                                  | What is true                                                                                                                  |
| -- | -------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1  | `watches/docs/slide-patterns.md`, "The theme"            | "the seven `--palette-*` palette variables"                   | nine (seven plus `art-line`, `art-knockout`)                                                                                  |
| 2  | `themes/ledger/README.md`, `ledger.css` comment          | "seven"                                                       | nine                                                                                                                          |
| 3  | `themes/ledger/README.md`, "Rules"                       | `palette.py` "fails if a talk declares a `--palette-*` variable" | a talk may set one in a `.slidev-layout.<class>` rule (`theme.md`, since the flexing-ruler task)                            |
| 4  | `slide-patterns.md`, "The live watch"                    | slide 2 example: `clicks: 1`, no `watchHide`                  | `slides.md` has `clicks: 3`, `watchHide: 2`                                                                                   |
| 5  | `slide-patterns.md`, "Before you ship"                   | `pnpm format` in `stem/`; `artcheck.py` with no paths; `pnpm build` | format in the talk's directory (`AGENTS.md`); `artcheck` needs paths; `uv run ../tools/validate.py` does all of it        |
| 6  | `illustrations.md`, "Drawing a new one", step 7          | "Run the three tools"                                         | it lists four                                                                                                                 |
| 7  | `illustrations.md`, "Things that are true of these four" | nothing moves across the frame, nothing animates in a new way | the flexing ruler (a vibration, and a hand that moves) and the WebGL watch now exist. The section needs a look.               |
| 8  | `talks.md`                                               | "`typescript` at `~6.0`"                                      | `package.json` has `^6.0.3`                                                                                                   |
| 9  | `measurements.md`                                        | the timekeepers and the cover watch                           | the flexing ruler is not measured here, though `validate.py` checks it                                                        |
| 10 | 29 commands across the docs                              | a mix of `.venv/bin/python3 tools/x.py` and `uv run tools/x.py` | both work. `AGENTS.md` says `uv run`. Use one form.                                                                         |

### 2.2 The same fact in more than one place

| Fact                                                        | Places                                                                                               |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| How to run the tools (command lists)                        | `docs/README.md`, `illustrations.md`, `legibility.md`, `slide-patterns.md`, `tools/README.md`, `watches/README.md`, `AGENTS.md`: **7** |
| The water clock that animated invisibly                     | `docs/README.md`, `illustrations.md`, `legibility.md`, `tools/README.md`: **4**                      |
| `hold` / `p90` and how to read them ("signatures")          | `legibility.md`, `tools/README.md`                                                                   |
| Why `docs/` and `tools/` are separate from `tasks/`         | `docs/README.md`, `tools/README.md`, and the task rules in `~/.claude/AGENTS.md`                     |
| "When the venue is known, add it to `VENUES`"               | `docs/README.md`, `legibility.md`                                                                    |
| The four art colours and their jobs                         | `illustrations.md` (table), `theme.md` (list), `webgl.md` (the inks), `ledger.css` comment           |
| The watch's frontmatter keys and the order of a change      | `webgl.md`, `slide-patterns.md`                                                                      |
| Line widths stay the same when the camera zooms             | `webgl.md`, `measurements.md`                                                                        |
| Project layout, validation, format rules                    | `AGENTS.md`, `talks.md`                                                                              |

Each copy costs tokens when an agent loads it, and each copy can go stale on
its own. Findings 1–5 are copies that went stale.

### 2.3 Content in the wrong file

- **`docs/webgl.md` is half house doc and half `watches` doc.** It says it is
  for any talk, but it has the table of `watches/`' files, the watch's
  frontmatter keys ("In `watches`:"), and budgets measured on the watch. The
  renderer lives in `watches/webgl/` until a second talk needs it, so some
  mixing is natural. But a reader of `watches` looks in `watches/docs/` and
  finds only half the watch there.
- **Colour roles are split across three files.** The text colours are in
  `theme.md`, the art colours' jobs in `illustrations.md`, and the WebGL inks
  in `webgl.md`. To design a new theme, a reader needs all nine roles in one
  table. This is why `COLOUR-ROLES.md` was written.
- **`measurements.md` has a section on line widths when zooming.** That is a
  rule for the watch's geometry, not a measurement.
- **`docs/README.md` has a decisions table.** The house rules say that project
  docs hold the current decision, with a pointer to its task, not history. Each
  doc should link its own task at the top. `theme.md` does not link
  `watches/tasks/2026-09-18-theme-colors/`; only the table in `README.md` does.

### 2.4 Is `README.md` the wrong name?

`README.md` is the right name for a directory's index. GitHub shows it when
you open the directory, and people and agents look for it first. `index.md`
has no such support. `AGENTS.md` inside `docs/` would not be loaded reliably.

The problem is the content, not the name. `docs/README.md` is an index plus
four other things. Of its 988 words, the index and the summary are about 250.

## 3. Options

**O1. Fix only.** Correct the ten items in 2.1. Change nothing else.

- Pro: small, fast, low risk.
- Con: the duplicates stay, and they will go stale again. `webgl.md` stays
  mixed.

**O2. Fix, remove duplicates, and give each topic one home.** Keep the file
set, mostly. Move content to the file whose topic it is, and replace each
copy with a link.

- Pro: each fact in one place. About 20–25% fewer words to load (estimate:
  the duplicates in 2.2 are about 3,000–4,000 words).
- Pro: each file's first lines say what it covers and when to read it, so an
  agent can decide from the index and the first lines.
- Con: a half day of careful editing. Links from `tasks/` into `docs/` anchors
  may break. Frozen tasks keep their text, so a broken anchor there is
  acceptable.

**O3. Re-cut the docs by the reader's action**: "make a theme", "draw an SVG",
"build 3D art", "check legibility", "work in the repo".

- Pro: each file matches one row of the `AGENTS.md` index.
- Con: the present files already map closely to those actions (theme,
  illustrations, webgl, legibility, talks). A re-cut moves most text for little
  gain, and breaks every link.

**O4. Turn procedures into skills** (for example "add a colour", "draw a new
illustration", "upgrade a talk").

- Pro: a skill's body loads only when a task matches its description.
- Con: it works only in Claude Code, and it duplicates the docs or turns them
  into pointers. The `AGENTS.md` index already gives most of the benefit.

**Recommendation: O2.** Ranking: O2, O1, O3, O4. O2 fixes the cause of the
stale facts (duplication) at moderate cost. O1 is a subset of it. O3 costs
more for almost no gain, because the files already follow the actions. O4
fits procedures, and the docs are mostly reference.

## 4. The O2 layout

### `stem/docs/`

| File             | Change                                                                                                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`      | **Only an index:** one line per file, saying what it covers, and the one-paragraph summary. Remove "why separate from `tasks/`" (it is in `tools/README.md` and the task rules), the decisions table (each doc links its own task), and the venue section (it is in `legibility.md`). About 250 words, not 988. |
| `theme.md`       | **Owns every colour.** One table of all nine roles: value, job, and where each is used (text, card, art line, art face, WebGL ink). Add the art roles' jobs from `illustrations.md`, and the "new theme" guidance when the flash task closes. Link the theme task at the top. |
| `illustrations.md` | Owns how to draw with the colours: size, opacity rules, washes, strokes, motion. Its palette table becomes a link to `theme.md`. Fix findings 6 and 7. One command list, or a link to `tools/README.md`.                              |
| `webgl.md`       | Keeps what is true for any talk: when to use WebGL, the layers, the renderer's contract, the 3D style, the stills, the mistakes. The `watches` file table, the frontmatter keys, the order of a change and the measured budgets go to `watches/docs/watch.md`. Keep the 8.3 ms frame rule. |
| `legibility.md`  | Owns the metrics and how to read them. Its "How to check new work" becomes a link to `tools/README.md`, plus the rule "run `barroom` on the first day".                                                                                  |
| `talks.md`       | Keeps the why and the procedures (setup, upgrade). "Check your work" becomes a link to `AGENTS.md`, which already has it. Fix finding 8.                                                                                                |

### `stem/tools/README.md`

The one home for tool commands. Remove "three signatures" (it is in
`legibility.md`) and shorten the water clock story to a link.

### `stem/watches/docs/`

| File                | Change                                                                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`         | An index, as now, with one row for the new `watch.md`. The long `../art/` row moves into `watch.md`.                                                                                                                     |
| `watch.md` (new)    | Everything about this talk's live art: the files of `webgl/` and `watch/`, `art/` and `design.json`, the frontmatter keys, the order of a change (and the flash, if it ships), line widths when zooming, the flexing ruler, the measured budgets. |
| `slide-patterns.md` | Keeps the slide conventions: the theme on a slide, the card, clicks, notes, sizes, credits. "The live watch" and "The flexing ruler" move to `watch.md`. "Before you ship" becomes one line: `uv run ../tools/validate.py`. Fix findings 1, 4 and 5. |
| `measurements.md`   | Only numbers. Add the ruler, or say that it has none yet. The zoom section moves to `watch.md`.                                                                                                                         |
| `rough-slides.md`   | No change. It is the talk's outline, not a rule.                                                                                                                                                                        |

### Everywhere

- **Each doc starts with two lines:** what it covers, and when to read it, and
  a link to the task that decided it. Then an agent can read the first 5 lines
  of a file and stop if it is the wrong one.
- **One command form:** `uv run tools/x.py` (at the root) and
  `uv run ../tools/x.py` (in a talk), as in `AGENTS.md`.
- **Fix the theme's README and `ledger.css` comment** (findings 2 and 3).
- **Two indexes, two jobs.** `AGENTS.md` says _when_ to read each doc; it is
  loaded in every session. `docs/README.md` says _what_ each doc holds; a
  person browsing on GitHub sees it. They list the same files, so each says
  "keep in step with" the other.

## 5. Steps

1. Fix the ten items of 2.1 (small, safe, first).
2. Write `watches/docs/watch.md` from `webgl.md`, `slide-patterns.md` and
   `measurements.md`. Remove the moved text from those files.
3. Make `theme.md` own the colours; link to it from `illustrations.md` and
   `webgl.md`.
4. Cut `docs/README.md` to the index. Add the task links to the top of each
   doc.
5. Remove the duplicate command lists; keep `tools/README.md`.
6. Check every link: `grep` for `docs/` anchors in `docs/`, `watches/docs/`,
   the READMEs, `AGENTS.md` and code comments. Do not edit `tasks/`.
7. `pnpm format` at the root and in `watches/`. `uv run tools/validate.py` at
   the root; `uv run ../tools/validate.py` in `watches/`.
8. Record the word counts before and after in this directory.

## 6. Decisions (2026-09-30)

The user approved O2, with these rules for the content:

- **Ledger is the current theme, not the ground truth.** The theme will be
  debated again when the deck is more complete, or for a second talk, and a
  dark theme may be tried. So `theme.md` states the roles, the jobs and the
  gates, which any theme must meet. It quotes Ledger's values as the example
  of a theme that meets them, in a section of its own. The same applies to
  the art colours: `#143C6B` is Ledger's art line, not "the" art line.
- **Docs summarize the why:** what the chosen option does best, and which
  qualities decided it. They do not list the rejected options. They link the
  task directory, for a reader who needs the depth.
- The answers to the four questions below are yes: O2; `theme.md` owns all
  the colour roles; `watches/docs/watch.md`; the decisions table leaves
  `docs/README.md`, and each doc links its own task.

Changes to section 4 that follow:

- `theme.md` has two parts: **"Roles and gates"** (theme-independent: each
  role's job, its gate, the new-theme guidance) and **"The current theme:
  Ledger"** (its values, why it was chosen: pasted content is mostly light;
  what would change the choice; the link to its task). "Do not go dark
  without re-reading this" becomes a short summary of what the dark-theme
  work measured, with its link.
- Every doc that quotes a colour value says that it is Ledger's.
- One more step: a mechanical check (section 7).

## 7. Keeping the docs current

Rules alone decay; a check does not. So both:

1. **Rules in the global `AGENTS.md`** (proposed text in the reply of
   2026-09-30; it applies to every project, not only this one).
2. **`tools/doccheck.py`, run by `validate.py` at the root**, which fails if:
   - a relative link or `#anchor` in `docs/`, `<talk>/docs/`, a README or an
     `AGENTS.md` does not resolve;
   - a file in `docs/` or `<talk>/docs/` is missing from its `AGENTS.md` index
     or its `docs/README.md`, or an index names a file that is not there;
   - a doc names a `tools/*.py` that does not exist.

   It does not read `tasks/`. It cannot see a fact that is wrong but still
   links correctly (findings 1–5 were of that kind). The rules cover those,
   and so does keeping each fact in one place.

## 8. Questions for you

1. O2, or only O1 for now?
2. May `theme.md` become the one home of all colour roles, including the art
   colours that `illustrations.md` lists now?
3. The `watches` parts of `webgl.md` move to a new `watches/docs/watch.md`. Is
   that name right?
4. Should the decisions table leave `docs/README.md`, with a task link at the
   top of each doc instead?

## 9. Done (2026-09-30)

O2 is in place, except `doccheck.py`. The copies before the change are in
`before/`; word counts in `words-before.txt` and `words-after.txt`.

- Total: 16,735 to 15,608 words (−7%), not the 20–25% estimated in section 3.
  The new headers (covers, read before, tasks) add about 60 words a doc, and
  `watches/docs/watch.md` (1,324) is new. Per action, the cut is larger:
  `webgl.md` 2,311 to 1,585, `slide-patterns.md` 1,669 to 1,176,
  `docs/README.md` 988 to 333.
- Two more wrong facts turned up while writing, both from re-reading the
  source: the old `webgl.md` said `validate.py` runs
  `art/validate_watch_design.py` (it does not), and a first draft of
  `illustrations.md` said set 2 had the most back-row contrast (it ranked 6th;
  it was chosen for its look, with its faults fixed).
- The flexing ruler was measured for `measurements.md`: hold 4.00, p90 7.54,
  Fmax 0.113, dPeak 9.49.
- `watches/AGENTS.md` got a "read before you act" index. It was not in this
  session's loaded context, although the session ran in `watches/`, so
  `stem/AGENTS.md` points to it explicitly.
- A one-off link and anchor check (all relative links in the docs, READMEs and
  `AGENTS.md` files): 0 broken. `validate.py`: root 6 of 6, `watches` 18 of 18.
- The global `AGENTS.md` got a "Docs" section (structure, Chesterton's Fence,
  keeping docs current).

## 10. Where the doc check lives (2026-09-30)

The check has nothing specific to stem: links and anchors, each `docs/`
directory against its two indexes, and tool paths are all generic. Only the
settings differ (which paths, which directories to skip, where the tools are).
So the question was where one generic tool lives, and how a project runs it.

| Option                                                      | For                                                                  | Against                                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| A. A copy in each repo                                      | self-contained: a clone, CI or another machine can run it            | copies drift; each improvement is copied by hand                                                            |
| B. One global script, called by path                        | one copy                                                             | validation needs a file outside the repo; a change reaches every repo at once, with no record in any of them |
| C. A global script and a copy in each repo                  | a reference copy                                                     | A's drift and B's outside file, plus a sync step                                                            |
| **D. A package, pinned by each repo (chosen)**              | one source; each repo's `uv.lock` pins a version; upgrades are explicit | packaging; installing it needs access to the repo that holds it                                          |

**Chosen: D, plus a global skill** (`docs-audit`) for the audit procedure and
for adding the check to a new project. The package is `~/init-files/doccheck/`
for now; it may move to a repo of its own.

Not a check: "each sub-project's `AGENTS.md` is linked from its parent's". A
parent must not list its sub-projects: an agent that works in one talk must not
be pointed at the others. `stem/AGENTS.md` refers to a talk only by the
pattern `<talk>/AGENTS.md`, and each talk's `AGENTS.md` points up to
`../AGENTS.md`.

## 11. doccheck and the skill, built (2026-09-30)

- `~/init-files/doccheck/`: a uv package (stdlib only, Python 3.14), with the
  command `doccheck`. Checks: missing file, missing anchor (GitHub slugs), no
  index, not indexed, missing tool. `uv run validate.py` there: ruff, mypy
  strict, pyright, 11 tests, all pass.
- `stem/pyproject.toml`: `doccheck` in the dev group, from a `path` source for
  now. **Not yet pinned:** a path source installs what is on disk. After
  init-files is committed and pushed, change the source to the git URL with
  `subdirectory = "doccheck"` and `rev = <commit>`, and run `uv lock`.
- `tools/validate.py` runs it: at the root on `docs`, `tools`, `themes`,
  `README.md`, `AGENTS.md`; in a talk on its `docs`, `README.md`,
  `AGENTS.md`; `--tools tools` in both. Root 7 of 7, `watches` 19 of 19.
  On the old copies in `before/`, it reports 16 findings (their relative
  links broke when they were copied), so it does find things.
- The skill: `~/init-files/agents/skills/docs-audit/SKILL.md`, linked from
  `~/.claude/skills/docs-audit`.

## 12. The skill made smaller; doccheck moved into it (2026-09-30)

Most sessions change the docs, so the skill must not load for a routine
change, and must be cheap if it does.

- The description now says it is not for updating docs as part of a change
  (65 → 43 words; it is loaded in every session).
- The body (582 → 166 words) keeps only what agents do not do unasked:
  check each claim against the code, find copies, find content in the wrong
  file, re-read a source before summarizing it. Removed: what repeats the
  global `AGENTS.md` ("Docs", "Tasks"), what agents already do (list the
  docs, run validation), the word counts, and "Add doccheck", which moved to
  doccheck's README, "Use it in a project".
- doccheck moved to `~/init-files/agents/skills/docs-audit/doccheck/`, so
  the skill and its tool move and version together. The git source's
  `subdirectory` is now `agents/skills/docs-audit/doccheck`. Its local
  `.venv` (134 MB, mostly the dev tools) is git-ignored, but leave it out
  if you copy the skill directory elsewhere.

## 13. doccheck moved into stem/tools; the skill deleted (2026-10-01)

The user's decision: doccheck is a stem tool, `tools/doccheck.py`, and the
`docs-audit` skill is deleted. This replaces sections 10 to 12's package and
skill.

- `tools/doccheck.py` is the package's three modules in one stdlib script,
  like the other tools: `uv run tools/doccheck.py`. `validate.py` runs it as
  before. `stem/pyproject.toml` and `uv.lock` no longer list it.
- The package's 11 tests pass against the script (run once with `uvx
  pytest`). stem has no test runner, so they are not part of `validate.py`.
- Copies of what was deleted are here: `doccheck-package/` (the package,
  without its venv) and `docs-audit-SKILL.md` (the skill as of section 12).

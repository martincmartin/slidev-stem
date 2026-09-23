# Follow-ups: what is left to improve in the watches talk

**Written:** 2026-09-23, at the end of a long session that reviewed the `watches`
deck, fixed most of the review's findings, and made `stem/` a pnpm workspace with
a shared Slidev theme (Ledger). This file lists **only what is still open**, plus
what the next session must know to do it well. Everything that was finished is in
git history (`git log`) and is not repeated here.

Most items below already say how to do them. Write `PLAN.md` in this directory
only for an item with a real question about the best way to do it (user,
2026-09-23). Ask the user at every **Decision** below before you build.

Most items are in the `watches` talk. A few (C2–C4, D1, D5) change the repo root,
`stem/`, and group F is outside the repo.

**Paths:** a path starting with `stem/`, `~` or `./` is exactly that (`./` is
this task directory). Any other path is inside `watches/`, the talk this task
lives in.

## Where things are now (2026-09-23, commit `89fa08c`)

```
stem/                      git root and pnpm workspace root (one lockfile)
  AGENTS.md                series guidance, role, pnpm and format rules
  themes/ledger/           the house Slidev theme: fonts, --palette-* variables, h1, cover
  tasks/2026-09-23-house-theme/PLAN.md   why the theme exists; Part 2 design (item E1)
  watches/                 the first talk: slides.md, components/, docs/, tools/, public/
    tasks/                 two frozen archives (palette choice, drawing-style choice)
    tasks/2026-09-23-followups/          this task; ./tools/ has the offline checker
~/Develop/slidev/AGENTS.md rules for ALL Slidev projects (offline assets, fonts)
~/.config/agents/AGENTS.md global rules (also ~/.claude/AGENTS.md, a symlink)
```

The deck has **3 slides**: a placeholder title slide, the finished "Before
clocks, time was a flow" slide (four timekeeper cards), and a stub escapement
slide. The outline, `docs/rough-slides.md`, has 11 slides.

## Priorities

1. **Content (group A).** The talk is 1 of about 11 slides. Everything else
   exists to support it. The original review found about 700 lines of docs and
   1,100 lines of tools for one finished slide; do not add process unless a
   slide needs it.
2. Small code cleanups (group B), best done before the next content slide.
3. Repo and docs structure (groups C, D): mostly worth doing when a second talk
   starts.
4. Part 2 palette comparison (E1): only when its trigger fires.

---

## A. Content

**A1. Title slide.** Still the Slidev starter's placeholders: "Hello, **World!**"
and the speaker note "Speaker notes here". **Decision:** the real subtitle, and
whether to show the speaker, date or venue. The theme's `cover` layout centres
the content and sets `h1` to 56 px.

**A2. Escapement slide.** The title has a typo, "Escapment", and the body is a
one-line stub ("Escapement was key innovation. Mostly weight driven."). Build it
from outline slide 2. The previous slide's speaker note ends on the setup for it:
"Remember 15 minutes a day: the first mechanical clocks probably didn't beat it."

**A3. The remaining outline slides (3–11).** Mainspring, hairspring, longitude,
Waltham, pocket to wrist, types of wristwatch, lume, the quartz crisis,
microbrands. Guidance for writing them is in `stem/AGENTS.md` (story first,
concrete and vivid; data only where it carries the point). Before a claim goes
on a slide, check it. Two known suspects in the outline:

- Slide 3 says "Around 1500x10": a typo.
- The "Nuremberg eggs" name for Henlein's watches is widely described as a later
  mistranslation. I did not verify this; check it before using it.

Budget: 15–20 minutes spoken. The "Before clocks" slide has 5 clicks and about
200 words of notes.

**A4. The sundial stat is not the same quantity as the water clock's.** Slide 2
shows "±16 min / the Sun vs. a steady clock" (a seasonal offset) beside "~15 min /
per day, the best ones" (a daily drift), in the same 37 px accent. The back row
will compare them. Suggested fix: change the sundial unit so it clearly is not
per day. **Decision:** the wording.

**A5. "One accent per slide" and slide 2 disagree.** `docs/theme.md`
says one accent per slide. Slide 2 has two accent stats and an accent span in the
takeaway. **Decision:** state an exception (card stats count as one) or make the
takeaway span ink.

## B. Code cleanup (watches)

**B1. Done (2026-09-23).** The Slidev starter's leftovers are deleted
(`components/Counter.vue`, `pages/imported-slides.md`, `snippets/external.ts`,
`slides-default.md`). The outline is now `docs/rough-slides.md` (user's
decision). (The `torture.md` glob was later removed from `.prettierrc`: see
C3.)

**B2. Done (2026-09-23).** `TimekeeperCard.vue` has no `video` prop, `<video>`
branch or `.tk-art video` CSS, and no `var(--palette-*, #dark)` fallbacks. The
`video` row and the fallback comment are gone too.

**B3. Done (2026-09-23).** The four cards are an array in the slide's
`<script setup>`, rendered with `v-for`. `v-click` is on a wrapper `<div>`, so
the `dim` re-render keeps Slidev's classes. `./tools/offline_check.py --clicks 2
--back` gives the same visibility as before, forward and back. All 5 v-click
elements keep `slidev-vclick-target` (before: down to 2 of 5 by the fourth click).
`docs/slide-patterns.md` "Clicks" describes the new pattern.

## C. Repo and infrastructure

**C1. Done (2026-09-23).** The user does not deploy the decks, so
`netlify.toml`, `vercel.json` and the `.netlify` and `.vercel` ignore entries
are deleted. If the user deploys later: the lockfile and workspace are at
`stem/`, so a host probably needs its base directory at the repo root, a build
command such as `pnpm --filter watches build`, and the publish directory
`watches/dist`.

**C2. Done (2026-09-23).** `.prettierrc` is at `stem/`, with the globs
`slides.md`, `slides-*.md` and `**/pages/*.md`. `watches/.prettierignore` is
deleted, and `watches/.vscode/settings.json` finds both files at the repo root.
The deck-file rule is in `stem/AGENTS.md`, and `watches/AGENTS.md` is deleted.
`pnpm format` changed no deck file.

**C3. Done (2026-09-23).** `stem/.prettierignore` ignores `tasks/` at any
depth. The comparison of five options is in `./PLAN.md`. The `/AGENTS.md` and
`/review-quality-slidev.md` entries are removed.

**C4. No longer applies (2026-09-23).** The user moved the file.

**C5. Done (2026-09-23).** A copy of `./tools/offline_check.py` is in
`stem/tools/`, and `~/Develop/slidev/AGENTS.md` names it. It is a candidate for
a future `slidev-common` repo, when there is a second series.

## D. Docs structure

**D1. Done (2026-09-23).** The series-wide docs (`theme.md`, `legibility.md`,
`illustrations.md` and the docs index) are in `stem/docs/`, and all the tools are
in `stem/tools/`. `stem/.venv` (from `stem/requirements.txt`) replaces
`watches/.venv`. Each SVG now states the size a slide shows it at (its `width`
and `height`), so no tool depends on `TimekeeperCard.vue`, and the stroke ladder
is in CSS px. `watches/docs/` keeps the talk's own pages. `./PLAN.md` has the
design and the options.

**D2. Done (2026-09-23).** `lib.py` reads the palette from `ledger.css`, so the
values exist once. `palette.py` no longer compares two copies; it still fails if
a talk declares a `--palette-*` variable.

**D3. Done (2026-09-23).** The user chose to split the section. The explanation
of the metrics stays in `stem/docs/legibility.md`, and the timekeepers' table is
in `watches/docs/measurements.md`, with the rule to re-measure when the art
changes.

**D4. Done (2026-09-23).** A dated line under the stale sentence in
`tasks/2026-09-20-animation-style/README.md` says the defect was fixed on
2026-09-21, and where the live docs and tools are now.

**D5. Done (2026-09-23).** The user accepted Part 1. The house-theme task's
status says so. Part 2 is E1, below: do not start it before its trigger.

## E. Palette comparison (Part 2 of the house-theme task)

**E1. Trigger:** the talk has at least one slide of each kind a palette must
handle, the five the palette archive tested: **cards, dense text, code, a chart,
and images or photos** (`tasks/2026-09-18-theme-colors/evidence/
torture-sheet-*.png`). Until then, do nothing.

The design is in `stem/tasks/2026-09-23-house-theme/PLAN.md`. In short:

- One deck has one theme, so candidate palettes are CSS classes, for example
  `.palette-beacon`, that set the same `--palette-*` variables.
- A comparison deck, for example `slides-compare.md` (its name matches
  the `.prettierrc` globs), imports real slides with `src: ./slides.md#2` and
  adds a palette class with `class:`. Both parts were tested on 2026-09-23.
- A `palette:` headmatter key, added as a class by a default layout, switches
  the whole talk.
- `palette.py` needs a mode that measures a whole candidate palette.
- **Decision (art):** the SVGs load through `<img>`, so CSS cannot recolour
  them. Options: ignore the art for quick comparisons; generate recoloured
  copies per palette (the archive's `gen2.py` did this); or inline the SVGs so
  they read CSS variables (effort unknown; try one drawing first).

## F. Outside the repo (for the user)

**F1. Codex does not see the global AGENTS.md.** `~/.codex/AGENTS.md` does not
exist. If the user uses Codex, link it to `~/.config/agents/AGENTS.md`. Codex
reads from the git root down to the working directory, so it also does not see
`~/Develop/slidev/AGENTS.md` (above the git root). Options discussed: make
`~/Develop/slidev` the git root for all series, or copy the Slidev rules into
each series' AGENTS.md.

**F2. Done (2026-09-23).** The user fixed the typo; no AGENTS.md has
"approprite".

---

## What the next session must know

### Working agreements

- **Commits:** the global rule is "commit only with explicit approval". In the
  2026-09-23 session the user said "commit as you think best". That approval
  was for that session; ask again.
- **Deliverables describe what is there.** No rejected alternatives or history
  in `slides.md`, `docs/`, code or comments, except one or two sentences where a
  reader could be tempted to "improve" something with an alternative that was
  tried and was worse, with a pointer to the task directory. (Now in the global
  AGENTS.md.)
- **If the user removed text, it was deliberate.** In the 2026-09-23 session,
  four removed lines were wrongly restored as if they had been lost.
- **Memories:** propose an AGENTS.md change instead (global AGENTS.md rule).
- **Style:** ASD-STE100 for technical text. Give options with data, rank them,
  and say "I don't know" when you don't.
- The user reviews and edits AGENTS.md files; check for an editor lock file
  (`.#AGENTS.md`) before writing one.

### Environment facts (verified 2026-09-23)

- `sed`, `stat` and other tools are **GNU** versions (Homebrew `gnubin` is first
  in `PATH`): use `sed -i 's/…/…/'`, not `sed -i ''`.
- **pnpm 12** enforces a minimum release age. Asking for a version released
  hours ago makes pnpm add a `minimumReleaseAgeExclude` entry to
  `pnpm-workspace.yaml` on its own. Do not keep it: use a range that an older
  release satisfies (Prettier is `^3.9.8` for this reason) and regenerate the
  lockfile.
- The sandbox may refuse to bind a local web server. Serve a build through
  Playwright's request routing instead (`./tools/offline_check.py` does).
- `stem/.venv` has Playwright, Pillow and numpy (`stem/requirements.txt`).
- The terminal `claude` is 2.1.280 from the Homebrew cask `claude-code@latest`.
  It reads AGENTS.md files from the working directory up to `/`, unless a
  `CLAUDE.md` or `CLAUDE.local.md` exists anywhere in that chain. Do not add one
  without asking: it turns off AGENTS.md loading.

### Slidev facts (verified with Slidev 52 and 53)

- `theme: ledger` resolves `@slidev/theme-ledger`, then `slidev-theme-ledger`,
  from the deck's folder; the workspace package is `slidev-theme-ledger`.
- Slidev loads `styles/index.{ts,js,css}` from every root: the deck and the theme.
- A theme's `slidev.defaults.fonts` with `provider: none` stops the web-font
  request and keeps the fallback stacks. Seriph's defaults requested Google Fonts.
- The core `cover` layout has no default background. Seriph's asked Unsplash for
  a photo; offline, the title was white text on grey.
- `colorSchema: light` keeps the deck light on a laptop set to dark mode.
- `v-click="false"` is a no-op (`@slidev/client` `useClicks.ts`).
- `@apply font-serif` and `@apply font-mono` work in a component's scoped style,
  and follow the theme's font settings.
- `src: ./slides.md#2` imports a slide, and the importing frontmatter's `class:`
  overrides the slide's.
- `prettier-plugin-slidev` keeps comments in the headmatter.
- A slide's markdown `# Title` is an `h1`; the theme styles it (Fraunces 600,
  37 px). Inside a flex layout, set `margin: 0` on it.

### How the 2026-09-23 changes were verified (reuse this)

1. `pnpm exec slidev build --out <scratch dir>` in the talk's directory.
2. `./tools/offline_check.py <build> 1:0 2:0 2:5 3:0 --shots <prefix>`: zero
   outside requests, and the expected fonts and colours on each slide.
3. Screenshots before and after a refactor, then `./tools/pixel_diff.py`: every
   changed pixel must be inside an animated drawing (the SVG animations run on
   a clock, so those always differ).
4. `python3 tools/palette.py` and `python3 tools/artcheck.py` in `stem/`.
5. `pnpm format:check` at the root.

## Tools in this directory

| file                       | what it does                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./tools/offline_check.py` | Loads a built deck with every outside request blocked. Prints each slide's classes, background, text colour, body font and `h1` style, and the loaded web fonts. Saves screenshots (`--shots`), steps through clicks by opacity and counts the elements that keep their v-click class (`--clicks`, and back with `--back`), emulates a dark-mode laptop (`--color-scheme dark`). Exits 1 if any outside request was made. |
| `./tools/pixel_diff.py`    | Compares two screenshots and counts the differing pixels inside each art box and outside all of them.                                                                                                                                                                                                                                                                                                                     |

Both run with `stem/.venv/bin/python3`. A copy of `offline_check.py` is in `stem/tools/`.

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
   starts, except C1 if the user deploys.
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
decision). The `torture.md` and `pages/*.md` globs stay in `.prettierrc`: the
archive's `torture.md` needs the Slidev parser.

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

**C1. Deploy configs are untested since the workspace move.**
`netlify.toml` and `vercel.json` run `pnpm build` in `watches/`,
but the lockfile and workspace are now at `stem/`. Each host probably needs its
base directory at the repo root, a build command such as
`pnpm --filter watches build`, and the publish directory `watches/dist` (from the repo root).
**Decision:** does the user deploy these decks at all? If not, delete both files.

**C2. Move `.prettierrc` to `stem/`,** with the same override globs, so a new
talk needs no copy. Then move the rule from `AGENTS.md` (this talk's) ("add a new deck
filename to `.prettierrc`") to `stem/AGENTS.md`, and delete `AGENTS.md` (this talk's)
if nothing is left in it. Check: `pnpm format` at the root changes no deck file
(`git diff` is empty afterwards).

**C3. `pnpm format` also rewrites the frozen archives** under `tasks/`.
They are formatted today, but a Prettier upgrade could change files that must
not change. Option: add `**/tasks/*/deck/` to `stem/.prettierignore`.
**Decision:** the user's. Also: `stem/.prettierignore` still lists `/AGENTS.md`
as hand-written; it is now kept formatted, so that entry can go.

**C4. `stem/review-quality-slidev.md` is untracked.** It is the user's agent
definition for code-quality reviews. **Decision:** where it lives (for example
`~/.claude/agents/` for all projects, or `stem/.claude/agents/`). Do not edit it
without asking.

**C5. The offline check needs a permanent home.** `~/Develop/slidev/AGENTS.md`
says "build and load the deck with outside requests blocked; it must make none",
but names no tool. `./tools/offline_check.py` in this directory does it (see
"Tools" below). **Decision:** where it lives, for example
`~/Develop/slidev/tools/` (all Slidev projects, but not under git) or
`stem/tools/`. Then name it in the AGENTS.md line.

## D. Docs structure

**D1. Series-wide material lives in the first talk.** These apply to every STEM
talk but sit in `watches/`:

- `docs/theme.md` and the palette gates in `tools/lib.py` and `tools/palette.py`
  (they are about the Ledger theme, so they could live in `stem/themes/ledger/`);
- `docs/legibility.md` and the venue model (about the bar, so `stem/docs/`);
- the illustration style, "Line, weighted" (see below).

**Decided (user, 2026-09-23): the illustration style is series-wide.** It
applies to every talk in `stem/`, not to all Slidev projects. Move its docs and
tools up, out of `watches/`, to `stem/` (for example `stem/docs/` and
`stem/tools/`):

- `docs/illustrations.md`;
- `tools/artcheck.py`, `tools/contact.py`, `tools/barroom.py`, `tools/motion.py`;
- the art constants in `tools/lib.py`: `ART_BOX`, `CARD_ART`, `STROKE_LADDER`,
  `ART_INK`, `ART_FIELD`.

The drawings stay in the talk: `public/timekeepers/` is `watches` content. In
the moved `illustrations.md`, the four timekeepers become examples, with paths
into `watches/`.

Things to handle in the move:

- `barroom.py` and `motion.py` use the venue model, so the venue model and
  `docs/legibility.md` must move with them.
- `lib.py` sets `ROOT` to the talk directory. `art_files()` defaults to
  `ROOT/public/timekeepers`, and `contact.py` writes to `ROOT/out/`. From
  `stem/tools/`, the tools must take the talk directory or the SVG paths as
  arguments.
- `CARD_ART` (122 × 97 px) is the size that `TimekeeperCard.vue`, a `watches`
  component, gives the art. Every stroke-width number in CSS px comes from it.
  Ask the user whether the card is also series-wide, or whether each talk sets
  its own art size.
- The `.venv` with Playwright is in `watches/`. The rendering tools need one
  at `stem/`.
- The grammar (box, stroke ladder, colour roles, motion rules) is series-wide.
  The colour values are not: they depend on the palette, and the opacity window
  in `illustrations.md` depends on them. See E1 "Decision (art)".
- `tools/lib.py` finds the theme CSS through `THEME_CSS` and
  `PALETTE_PREFIX`; update both if files move.

**D2. The palette exists twice:** `stem/themes/ledger/styles/ledger.css` (what renders)
and `LEDGER` in `tools/lib.py` (what `palette.py` measures).
`palette.py` fails if they differ, so they cannot drift silently. Option: have
`lib.py` read the values from the CSS, so there is one copy. Consider with D1.

**D3. `docs/legibility.md`, "What the deck currently measures".** It is current
data, not a criterion. **Decision:** keep it as a worked example of the
criteria, or move it out. If it stays, re-measure it whenever the art changes
(`tools/barroom.py`, `tools/motion.py`).

**D4. A stale line in a frozen archive.**
`tasks/2026-09-20-animation-style/README.md`, line 42, says the water
clock defect is "recorded, unfixed". It was fixed on 2026-09-21. The global
AGENTS.md rule: add a dated line to that task's README. Do not change the old
text.

**D5. Close the house-theme task.** `stem/tasks/2026-09-23-house-theme/PLAN.md` says
"Part 1 done; waiting for the user to accept it". Ask the user. On acceptance,
set the status to done. `docs/` is already up to date for it.

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

**F2. A typo in `~/.config/agents/AGENTS.md`:** "approprite".

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
- `.venv` has Playwright, Pillow and numpy.
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
4. `python3 tools/palette.py` and `python3 tools/artcheck.py` in `watches/`.
5. `pnpm format:check` at the root.

## Tools in this directory

| file                       | what it does                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./tools/offline_check.py` | Loads a built deck with every outside request blocked. Prints each slide's classes, background, text colour, body font and `h1` style, and the loaded web fonts. Saves screenshots (`--shots`), steps through clicks by opacity and counts the elements that keep their v-click class (`--clicks`, and back with `--back`), emulates a dark-mode laptop (`--color-scheme dark`). Exits 1 if any outside request was made. |
| `./tools/pixel_diff.py`    | Compares two screenshots and counts the differing pixels inside each art box and outside all of them.                                                                                                                                                                                                                                                                                                                     |

Both run with `.venv/bin/python3`.

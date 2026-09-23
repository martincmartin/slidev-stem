# Plan: items with a real question about how to do them

## C3. Keep `pnpm format` from rewriting frozen archives

**Problem.** `pnpm format` runs Prettier on the whole repo, including the task
archives. They are formatted today, but a Prettier upgrade could change files
that must not change.

**Data (2026-09-23).** The two frozen archives, `watches/tasks/2026-09-18-theme-colors/`
and `watches/tasks/2026-09-20-animation-style/`, have 13 files that Prettier
formats:

- 6 in `tasks/*/deck/` (3 per archive);
- 2 in `tasks/2026-09-20-animation-style/water-clock-fix/deck/`;
- 5 READMEs.

The active tasks (`stem/tasks/2026-09-23-house-theme/`, this one) have 3 such
files: `PLAN.md`, `instructions.md` and this file.

| option                                           | archive files protected | active task files formatted | step when a task finishes |
| ------------------------------------------------ | ----------------------- | --------------------------- | ------------------------- |
| a. `**/tasks/*/deck/` (the suggestion in C3)     | 6 of 13                 | 3 of 3                      | none                      |
| b. `**/tasks/**/deck/`                           | 8 of 13                 | 3 of 3                      | none                      |
| c. each frozen archive by path                   | 13 of 13                | 3 of 3                      | add one ignore line       |
| d. `tasks/` (every task directory, at any depth) | 13 of 13                | 0 of 3                      | none                      |
| e. pin Prettier to an exact version              | 0 of 13 at an upgrade   | 3 of 3                      | none                      |

- **a** misses the water-clock-fix deck, which is one level deeper.
- **b** leaves the READMEs. A README change is only line wrapping, but the
  archive is supposed to stay the same.
- **c** protects everything, but only if someone remembers the step when a
  task finishes. If someone forgets, nothing shows until a Prettier upgrade.
- **d** protects everything with no step. The cost is that task documents are
  not formatted. They are prose, and Markdown renders the same either way.
- **e** only postpones the problem to the next deliberate upgrade.

**Ranking.** 1. d, 2. c, 3. b, 4. a, 5. e. **d** protects all 13 files and
needs no step to remember. The cost (3 prose files not formatted) is the
smallest of the options that protect all 13.

**Chosen: d.** Consequence: no deck inside `tasks/` is formatted, so the
`torture.md` override glob in `.prettierrc` (only an archive has that file) is
removed in C2.

## D1–D3. Series-wide docs and tools move to `stem/`

**User decisions (2026-09-23).** The illustration style is series-wide. D3:
split the section (the explanation stays, the watches table moves to
`watches/docs/`). The venv moves to `stem/.venv`, and `watches/.venv` goes.
Each SVG states the size a slide shows it at (below).

**The display size.** The floors (1.64 CSS px, 3:1) come from the venue
model and do not depend on any component. What depends on the display size
is the conversion from SVG units to CSS px: a 6-unit line is 3.05 CSS px
when the 240-unit box is shown 122 px wide, and 1.5 px (below the floor)
when it is shown 61 px wide. Until now the tools took the size from
`CARD_ART`, the image box of `TimekeeperCard.vue`, a component of one slide.

| option                                     | chosen | why                                                            |
| ------------------------------------------ | ------ | -------------------------------------------------------------- |
| the SVG's `width`/`height` state the size | yes    | the file describes itself; no constant about a component       |
| a `--shown-at` command-line option         | no     | the size lives in commands and docs, where it is easy to get wrong |
| move `CARD_ART` unchanged                  | no     | keeps a series-wide tool tied to one slide                      |

Consequences: the stroke ladder is stated in CSS px (2, 2.5, 3, 4; the
timekeepers measure 2.03, 2.54, 3.05, 4.07, so the check allows 5%). The
240 × 190 box is no longer a rule; `artcheck.py` requires `width`, `height`
and a `viewBox` of the same aspect ratio (1% tolerance). The tools render
each file at its own size.

**Where each file goes.**

| now (`watches/`)                                   | after                                  |
| -------------------------------------------------- | -------------------------------------- |
| `docs/theme.md`, `legibility.md`, `illustrations.md` | `stem/docs/`                         |
| `docs/README.md` (the index and its reasons)       | `stem/docs/README.md`; a short new `watches/docs/README.md` indexes the talk's own docs |
| `docs/slide-patterns.md`, `rough-slides.md`        | stay                                   |
| the D3 table                                       | `watches/docs/measurements.md` (new)   |
| `tools/*.py`, `tools/README.md`                    | `stem/tools/`                          |

- `theme.md` goes to `stem/docs/`, not into the theme package. The theme stays
  a plain Slidev package (no Python tools or author docs inside it), and a talk
  author finds every series-wide doc in one index. The theme's README links to
  it.
- All tools share `lib.py`, so they stay in one directory. No imports across
  directories.

**D2, one copy of the palette.** `lib.py` already has `css_palette()`, which
reads the `--palette-*` values from `ledger.css`. `LEDGER` becomes the result
of that function, so the values exist only in the CSS. The "does the CSS match
LEDGER" check in `palette.py` has nothing left to compare and is removed. The
check that no talk declares a `--palette-*` variable stays, and now scans
every talk.

**Talks.** A talk is a directory of `stem/` with a `slides.md`. With no paths
given, `artcheck.py`, `barroom.py`, `motion.py` and `contact.py` check every
SVG under every talk's `public/`.

**Verification.**

1. Every tool's output before the move (in `watches/`, `watches/.venv`) and
   after (in `stem/`, `stem/.venv`) is the same, except the removed sync
   section of `palette.py` and file paths.
2. The four SVGs change only `width`/`height`. The deck renders them at 122 × 97
   through CSS either way, so screenshots of slide 2 must differ only inside
   the animated drawings.

**Result (2026-09-23).** Point 1 holds: `barroom.py`, `motion.py`,
`artcheck.py` and `palette.py "#C0451C" accent` give the same numbers as before.
Point 2 holds for slide 2 (0 changed pixels outside the drawings), but the
drawings themselves are not pixel-identical. With every animation removed, old
and new files in the card's `<img>` differ:

| file height                         | slide `<img>` vs old (device px > 8/255, max diff) | `barroom.py` vs old                          |
| ----------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| control (old file vs itself)        | 0–106, max 52                                       | —                                            |
| `97` (chosen)                       | 724–1,856 of 47,336, max 129                        | identical                                    |
| `96.58` (the viewBox's exact ratio) | 0–106, max 52 (as the control)                      | candle `hold` 3.63 → 3.51, `Fmax` 0.078 → 0.066 |

The cause is a 0.2 px shift of the drawing against the pixel grid; at 6× zoom
the two renders look the same apart from edge anti-aliasing. `97` keeps whole
numbers and the tools' numbers; `96.58` keeps the slide's pixels but moves the
tools' numbers by the same kind of shift. Neither is more correct: at the venue
Slidev scales the canvas to the screen, so the sub-pixel position is arbitrary.
The finding went into `stem/docs/legibility.md`: treat `hold` differences under
about 0.15 as noise.

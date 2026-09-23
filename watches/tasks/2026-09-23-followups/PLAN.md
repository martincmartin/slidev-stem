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

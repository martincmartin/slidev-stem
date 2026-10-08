# Reuse full-validation results that a change cannot affect

**Request (2026-10-07):** a change to documentation only cannot change
navigation or the offline walk, so a full run after it gives nothing new.
The user asked for both fixes: (1) a policy that lets a quick run stand in
for a full run after such a change, and (2) a `validate.py` that reuses
results that the change cannot affect.

Docs read first: `AGENTS.md` ("Validate before you commit"),
`docs/talks.md` ("Check your work"), `tools/README.md`,
`tasks/2026-10-06-validation-speed/PLAN.md`. That task put persistent
caches out of its scope, because they "need complete dependency keys". This
task supplies the keys.

## 1. Where the time goes

The last full run of `watches` (2026-10-07, 22 checks) took 270.8 s:

| Check                  | Seconds | Reads                                     |
| ---------------------- | ------: | ----------------------------------------- |
| navigation and offline |   187.8 | the built deck; `tools/`                  |
| print                  |    65.7 | the built deck; `art/print_check.py`      |
| the other 20 checks    |   ~17   | sources, `public/`, the watch's code      |

Navigation and print are 94% of the time, and both read only the built
deck and their own code (`print_check.py` imports nothing from the talk;
`navcheck.py` imports only from `tools/`).

## 2. Is the build repeatable, and what changes it?

Measured with `tools/build_trials.sh` (`evidence/build-trials.txt`): two
builds of the same source are byte-identical (168 files, 3.7 MB). A change to
a doc, a README or a comment in a `.ts` file leaves the build byte-identical.
A comment in a Vue file or anywhere in `slides.md` (YAML, HTML, CSS, a note)
changes 52 to 54 files: Slidev keeps the slide's source, and Vue keeps the
component's.

## 3. Options for (2)

| Option | Key | For | Against |
| --- | --- | --- | --- |
| **A. Reuse a pass of print and navigation while the built deck and the checkers are byte-identical** (chosen) | the deck's bytes; `tools/*.py`; the talk's `art/**/*.py`, `package.json`; both projects' `uv.lock` and `.python-version` | exact: the browser sees the same deck, run by the same code and the same Playwright; covers 94% of the time; needs no list of what each source file affects | a comment in `slides.md` or a Vue file still costs a full run; the build (3 s) still runs |
| B. Key on the source files, minus a list of "build-irrelevant" paths | a hash of the talk's files outside `docs/`, READMEs, `tasks/` | reuses after a `.ts` comment too | the list must be complete; a wrong entry gives a false pass. Option A gets the same doc-only case from measured bytes |
| C. Normalise the deck (strip comments, notes) before the key | as A, after stripping | reuses after a comment in `slides.md` | notes and comments are part of the deck: a note shows in the presenter view; the stripping is a parser that can be wrong |
| D. Reuse every check, each with its own key | per check | most reuse | the other 20 checks cost ~17 s together; each key is one more list to keep right |

Chosen: A. It gives a false pass only if a checker reads a file outside its
key. The key holds the whole of `tools/` and the talk's `art/`, more than
the checkers read, so a change there costs one full run, not a false pass.

**Only passes are reused**, and only from a full run of the same project.
The record is `<project>/.validate/passes.json` (git-ignored), and holds the
key of the last pass and the checks that passed with it. A new key replaces
it. `--no-reuse` runs every check.

## 4. Option for (1)

A change to files that no build and no check reads, other than `doccheck`
and Prettier, cannot change a full run's result: `docs/`, `tasks/`, the
READMEs and the `AGENTS.md` files. Quick mode runs `doccheck` and Prettier.
So after such changes alone, since the last successful full run, a quick run
is enough before a commit. Option A gives the same result mechanically for
most changes; the rule also saves the ~17 s of the checks that are not
reused, and it does not depend on the record being on this machine.

## 5. Result

See `README.md`.

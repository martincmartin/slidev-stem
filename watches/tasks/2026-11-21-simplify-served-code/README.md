# A simplicity review of the served code

A review of the code that the site serves (the talk's code and the house
theme's build plugins, not Slidev's or a library's), for reuse,
simplification, efficiency and altitude, and the fixes. The findings that
were not done are in [`docs/cleanups.md`](../../docs/cleanups.md), which is
kept up to date; this task keeps them as they were found.

- `instructions.md`: the request.
- `PLAN.md`: the findings, what was done with each and why, and the
  measurements.
- `evidence/`: the scripts that checked the fixes, and their output. Each
  names the worktree's absolute paths: change them to run it again.
  - `springhash.ts`: hashes and times `springPoints` and
    `mainspringPoints` for 400 swings and poses. `springhash-before.txt`
    and `springhash-after.txt` are its output before and after.
  - `boxes.ts`: hashes each slide's `pictureBox`, `frameKey` and
    `figureMarks` at each click; the argument is a talk's directory.
  - `counts.mjs`: serves a build (base `/`), opens Part 1 of the article in
    Chromium, scrolls to each position given, and counts WebGL and DOM
    calls a second. `counts-before.txt` and `counts-after.txt` are its
    output on the build before and after.
  - `sloc.py`: counts the code and comment lines of the changed files,
    before (`HEAD`) and after (the working tree).

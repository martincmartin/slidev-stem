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

2026-11-21: a simplicity review after these fixes (a fresh reviewer, with
`docs/cleanups.md` as known) found 8 more, all done: `Frame.drawingOnly`
and `Mesh.inDrawing` removed (nothing set the option, and only it read the
field); the train's wheels by name (`Design.train`, which `readDesign`
checks for order), in place of 10 `as` casts and 4 reads by index;
`clipConvex` calls `clipEdge` (`globe/clip.ts`), and one `forkInWorld`;
`clamp`, `radians` and a new `degrees` at 17 more sites; `timeScaleAt` in
`slide-bottom.vue` and `frontmatterText` for `eyebrow`; no `?stills=lazy`;
16 `export`s that no other file imports removed; and the errors name
`artView` where they named `art` or `artFit`. The scene, the design, the
callouts' marks and each figure's crop were the same before and after,
except for the math sites: there `(x × 180) / π` replaced `x × (180 / π)`,
and so on, and 9 scene values, 3,034 of the globe's projected points and 70
camera values moved by at most 2.3 × 10⁻¹² (slide px or degrees). The
`docs/cleanups.md` entries for `showWatch`'s list and `BOARD_BOX` got the
review's new evidence: two more lists of the picture's keys, and the
board's place in `DivingBoard.vue`'s CSS.

# Watch primitives: the result

The plan and the options are in [PLAN.md](PLAN.md). P1–P3 are built.

## What a slide costs now

A slide that shows the watch is frontmatter only: the pieces it shows, a tilt,
and, if needed, a named view, a flash or `watchMoveWith`. The Gears slide is 5
lines of frontmatter and no TypeScript; its first version
([`2026-10-07-gears-slide`](../2026-10-07-gears-slide/PLAN.md)) was 213 lines
in 7 files.

## What the refactor cost

Measured with `git diff --numstat` against `a310e92`, without tests, docs and
tasks: +614 −488 lines, and `watch/deck.ts` (33 lines, for the tests). The code
grew by about 160 lines. **The estimate in the analysis before this task
(150–250 lines smaller) was wrong.** The lines went to:

- the piece's name at each of the 21 `solids.add` calls (about +40, with
  Prettier's line breaks);
- each piece's extent and `fittedView` (about +110);
- the parsing and the checks of piece lists, and `stageState` (about +60).

The subjects, the escapement view and its frame, and the timeline's special
cases went. The timeline is about the same size (374 → 364 lines): the set
helpers took the room of the special cases. The tests are 29 lines shorter
(+399 −428).

## The check: every step, traced

`equivalence/trace.ts` traced every step between neighbouring places of the
deck (slide and click), forward, back, and cut short at 300, 1200, 2600 and
4000 ms, every 25 ms: each mesh's opacity, the camera, the tilt and the flash.
`main` at `a310e92` against the refactor (`evidence/compare.txt`, the traces in
`evidence/*.json.gz`):

- **102 of 144 steps are identical.**
- **In the other 42, only the camera's numbers differ**: every opacity, every
  flash, every phase's order and length, and the tilt are the same. They are
  the steps to, from and within the Escapement slide, whose view is now
  fitted.
- The 6 Gears steps are new.

The Escapement slide's fitted view has the same zoom, to 0.006 %, and the same
left edge. It tilts about the middle of the shown pieces, not about the
hairspring's arbor at the spring's height, and the pieces' middle is 1.2 px
(world) above the arbor. So at the slide's tilt of 20°, the picture is about
5.7 px lower than on `main` (`evidence/escapement-click4-*.png`). The leaders
follow it; the labels stay. They still clear the drawing. Accepted: a generic
rule is worth more than this placement, and nothing in the slide depended on
the arbor's exact height.

One bug was found and fixed on the way: `global-bottom.vue` hid the canvas
when a state had no named view, so a fitted view showed no watch. The trace
does not see the layer; the screenshots did.

`evidence/gears-transition.png`: the step from the Escapement slide to the
Gears slide and back, at 0.4, 0.9, 1.2 and 2 s forward and 0.8 and 2 s back.

## To run the check again

```bash
git worktree add --detach ../before a310e92     # main before the refactor
ln -s "$PWD/watches/node_modules" ../before/watches/node_modules
cd watches/tasks/2026-10-07-watch-primitives/equivalence
node trace.ts before ../../../../../before/watches before.json
node trace.ts after ../../.. after.json          # the refactor
node compare.ts before.json after.json
```

`trace.ts` drives each version's own API (`before`: subjects; `after`:
pieces), so it runs only on these two versions.

## After the review

[review.md](review.md), 2026-10-08. Done:

- **F2 fixed.** A flash before a change needs its meshes at full opacity, not
  fading; a flash that has not started is placed again, and only one that has
  started goes on. Two tests in `webgl/timeline.test.ts`; the first fails on
  the code before the fix.
- **Pieces are objects while the watch is built** (`PieceList` in
  `watch/generate.ts`): each solid and mesh joins its piece object where it is
  made, not a name in a map. `generate()` throws on a piece with no mesh.
- **F1 not fixed**, by decision: the fit uses the plan, so a tall, thin piece
  alone can run off a tilted slide. `docs/watch.md`, "Fitted views", says so.

The deck's trace after these changes is identical to the refactor's in all
150 steps.

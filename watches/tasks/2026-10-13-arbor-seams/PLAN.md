# A line where an arbor comes up through a face

**Status:** built (2026-10-13). The current rules are in
[`docs/watch.md`](../../docs/watch.md), "Where an arbor comes up through a
face".

## Request (2026-10-12 and 2026-10-13)

- Where the escape pinion meets its arbor, there is no line: the two solids
  meld. Is this true of the other arbors? What does a fix cost?
- Is the minute pinion's root circle the same as the arbor's, or smaller?
- After the options below: "Draw a flat ring wherever an arbor comes up
  through a face" (option 1).
- While it was built: in the small 4-leaf pinions, should there also be
  vertical lines where the leaves meet the arbor, in the gaps? The larger
  pinions have them. (Yes: see "The creases".)

## Why it melds

Each train arbor is one cylinder, from the top of its wheel, through the
pinion, to `ARBOR_CAP` above the pinion. The renderer draws only each
solid's own top and bottom edges, and no line where two solids cross
(`../../docs/webgl.md`, "Which edges have a line"). No solid has an edge
where the arbor comes out of the pinion's top face.

The same happens at each of these places (`out/before/`):

| Face                | Post that comes up through it | Note                                  |
| ------------------- | ----------------------------- | ------------------------------------- |
| escape pinion       | escape arbor                  |                                       |
| fourth pinion       | fourth arbor                  | 4 leaves                              |
| third pinion        | third arbor                   | 4 leaves                              |
| centre pinion       | centre arbor                  |                                       |
| cannon pinion       | centre arbor                  | 4 leaves                              |
| minute pinion       | minute arbor                  | 4 leaves                              |
| hour wheel          | its pipe                      | partly hidden by the spoke openings   |
| one-step hour wheel | its arbor                     | partly hidden by the spoke openings   |
| collet              | balance staff                 | seen only when the roller is not shown |

The fork arbor, the one-step wheel's arbor and the barrel arbor stand on
their parts, so their own bottom edges draw the line.

## Root circle and arbor (example values, 2026-10-12, arbor $r = 2.5$)

| Pinion | Leaves | Pitch r | Root r | Tips reach r |
| ------ | ------ | ------- | ------ | ------------ |
| escape | 8      | 16.00   | 11.50  | 12.00        |
| centre | 6      | 12.33   | 7.83   | 8.33         |
| third  | 4      | 6.25    | 2.13   | 3.11         |
| fourth | 4      | 5.87    | 2.00   | 2.92         |
| cannon | 4      | 6.25    | 2.13   | 3.11         |
| minute | 4      | 5.00    | 1.70   | 2.49         |

On the 4-leaf pinions the root circle is inside the arbor. The wheel tips
reach to $r \approx 2.5$–$3.1$, so the root cannot move out past the arbor.
A thinner arbor that shows a root ring needs $r \lesssim 1.5$, which is a dot
at the deck's zooms (2 px lines). The root clearance (about 0.3 modules on
the 4-leaf pinions) was kept: it shows white between a tip and the root
when the view is zoomed in (commit 26c7ba6). The arbor radius came down from
3 to 2.5 first (commit 045864e), so that the hour wheel's tips stay out of
the minute arbor.

## Options, ranked

1. **A flat ring (a decal) where each post comes up through a face, in the
   face's piece.** Chosen.
   - Pros: one rule for every case; it shows, dims and flashes with the
     face; the Escapement slide's bare escape arbor stays clean; no height
     or holdout changes.
   - Cons: on the 4-leaf pinions the ring must be arcs on the leaves only:
     in the gaps the arbor goes on down to the wheel, and a full circle
     would float.
   - Cost, estimated: 60–80 lines, a helper in `teeth.ts`, test changes,
     a doc section, about 10 meshes.
2. **The same decal on the six pinions only.** About 20 lines less. The
   hour pipe and the one-step hour arbor still meld; their seams are the
   least visible.
3. **Split each arbor in two at the pinion's top**, so the upper part's
   bottom edge draws the line. No decals, but the Escapement slide (no
   pinion) shows a false ring halfway up the escape arbor, the line is
   drawn twice where the parts meet, and `trainHeights` changes.
4. **The renderer finds creases** (from where solids intersect, or an edge
   pass on the screen image). The most general, but much more work, and it
   changes how every line looks and the hidden-line rules.
5. **A different fill for the arbors.** It breaks the flat-wash style and
   the palette rules; a real pinion and its arbor are one piece of steel.

## What was built

- `Kit.seams` (`watch/generate.ts`): each function that makes a face that a
  post comes through adds a `Seam` (the face, and the line on its top).
  `seamMesh` makes each decal when the heights are known, and puts it in
  the face's piece. The one-step hour wheel's meshes are made in
  `oneStepHourMeshes`, so its seam is made there.
- `pinionSeam` and `drivingPinionSeam` (`watch/teeth.ts`): the arbor's
  circle if the root circle is outside it; else one open arc across each
  leaf, between its radial flanks.
- **Why the face's piece, not the arbor's:** the Hour Hand slide shows the
  minute arbor one click before the minute pinion. A seam in the arbor's
  piece would draw the pinion's top edge with no pinion.

### The creases

A larger pinion's outline has a corner where its root arc meets a flank,
and the renderer always draws a vertical line at a corner. On a 4-leaf
pinion that corner is inside the arbor. The flank runs into the arbor's
wall, and that crease is between two solids, so it had no line. The arcs
end on these creases, so `extrude` has a new option for a decal,
`endLines`: a vertical line from `bottom` to `top` at each end of an open
outline. The seam decals use it, from the pinion's bottom to its top.

## Evidence

`out/` is not in git (`tasks/*/out/` in `.gitignore`). To make it again, run
`tools/arbors.py` against an explorer at 26c7ba6 (before) and at this
task's commit (after), then `tools/sheet.py` with the crop
`225,285,505,545`.

- `out/before/` and `out/after/`: close-ups of each case at tilt 0 and 40,
  scale 8, and at tilt 40, scale 3 (`tools/arbors.py`), with contact sheets
  (`tools/sheet.py`). The "before" shots come from a worktree at
  26c7ba6, without this change, served on port 3142.
- `out/compare-*.png`: before (left) and after (right).
  `out/compare-4-leaf-t40-s8.png` shows the third, minute and fourth
  pinions close up, with the arcs and the creases.

# Watch primitives: named pieces, fitted views, one transition rule

**Request (2026-10-07).** The talk shows subsets of one mechanism, slide after
slide: the hairspring, then the balance wheel, the escapement, the escape
wheel alone, the fourth wheel and the escape pinion, then more of the train,
the barrel, the motion works. Each new slide must not need new TypeScript.
Find the primitives that every slide uses, and build P1–P3 below. Then redo
the Gears slide ([`2026-10-07-gears-slide`](../2026-10-07-gears-slide/PLAN.md))
with frontmatter only.

## What a slide cost before

Measured on `main` at `a310e92`, with the Gears slide's first version on top:

| Made by hand for each slide            | Where                                                   | Size                                                    |
| -------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| The subset of the watch (a "subject")  | `watch/generate.ts`, filters by part, role and position | 7 subjects and 5 views: 153 lines                       |
| The camera                             | constants in `watch/generate.ts`                        | 6 constants, 17 uses                                    |
| The transition                         | `webgl/timeline.ts`                                     | 5 special cases in 374 lines; the Gears slide needed a 6th |
| Each mechanism behaviour (P4, later)   | `watch/state.ts`                                        | 7 click keys, each with its own parser                  |
| Each callout's leader (P5, later)      | `watch/callouts.ts`                                     | 328 lines                                               |

The first version of the Gears slide added 213 lines in 7 files (and a version
before it, 452 lines in 15 files). About 110 of the 213 were a subset and a
view in TypeScript.

The mesh names show why a subset needed code: the escape wheel's meshes are
"escape wheel 1" to "escape wheel 4", in drawing order. A slide cannot say "the
escape pinion".

## The primitives

**P1. Named pieces.** Each solid and mesh belongs to a piece with a name that a
slide can use: `escape wheel` (its wheel and hub), `escape pinion`,
`escape arbor`, `fourth wheel`, `seconds hand`, `hairspring`, `collet`,
`stud`, and so on. The scene's named sets of meshes are these pieces. A slide
lists the pieces that it shows (`watch: [fourth wheel, fourth arbor, escape
pinion, escape arbor]`), or `watch: all`. The frontmatter names are turned into
meshes once, at the boundary (`watch/state.ts`), as before.

**P2. Fitted views.** With no `watchView`, the view is computed from the shown
pieces: as large as fits in the room under the subtitle, against the left edge
(the house rule: the picture on the left, the callouts on the right). A slide
names a view only when its picture must match other art: the cover (the title
on its left) and the Hairspring slide (the diving board).

**P3. One transition rule.** From the shown set A to the shown set B, with D
the set on the screen while the camera moves:

1. A becomes D: fade out A − D, then fade in D − A.
2. The camera moves and tilts (zooming in: move, then tilt; zooming out:
   untilt, then move). If D is empty, nothing is on the screen, so the camera
   jumps.
3. D becomes B: fade out D − B, then fade in B − D.

D is the common pieces A ∩ B by default. The step into a slide can ask for
`watchMoveWith: all` (A ∪ B: the opening's zoom, with the whole watch on the
screen) or `none` (the Gears slide: the old picture fades out, the camera
jumps, the new picture fades in). It applies to the step between that slide
and the previous one, in either direction, so the layer still does not ask
which way the viewer went (`docs/navigation.md`, rule 1). Without a camera
move, A becomes B directly: fade out A − B, then fade in B − A.

A flash plays before the change if its pieces are on the screen already, and
after the change if they fade in. A change during a fade first finishes it:
to 1 if the new state shows every fading mesh, else to 0.

The renderer already draws this (a frame's `keep`, `fade` and `rest`), so
`webgl/renderer.ts` does not change.

This replaces: the move towards and away from a subject, the swap, the swap
with a camera move, the swap cut short, and the rest fading in around an old
subject (no slide used it).

## Options for P2's numbers

The Escapement slide is the only fitted view today. Its frame
(`ESCAPEMENT_FRAME`, 420 px high) and its centre (halfway between the
subtitle's baseline and the slide's bottom) become the fitted view's
defaults, so its zoom and its place do not change. Its tilt pivot was the
hairspring's arbor at the spring's mid-height. The fitted view tilts about the
shown pieces' middle, which may move the tilted picture by a few px. The
trace below measures it: 5.7 px down, accepted ([README.md](README.md)).

## How the refactor is checked

`equivalence/` traces every step between neighbouring places of the deck
(slide and click), forward and back, and steps cut short at several times.
Every 25 ms it records each mesh's opacity, the camera, the tilt and the
flash. The trace of `main` (before) and of the refactor (after) must agree on
every slide that both have. The full validation (print, stills, smoke
navigation) runs after.

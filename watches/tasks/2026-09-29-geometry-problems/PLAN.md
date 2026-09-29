# Plan: the geometry problems

Started and done 2026-09-29. The problems are in `instructions.md`. The code
before this task is commit `a7444d9`.

## 1. The pallet stones

**What was wrong.** The fork's two hooks were drawn by hand, and did not follow
the teeth. At rest they covered part of the escape wheel (`before-escapement.png`),
and so did the back of the fork round its pivot. The pivot was also too close:
36 px from the escape arbor, with tooth tips at 33 px. The fork's arbor circle
(radius 4) reached over the tips as they passed.

**What changed** (`art/watch_design.py`):

- The fork's pivot is 40 px from the escape arbor (it was 36). The balance
  stays where it is, so the lever is 4 px shorter. Layout checks pass: the
  fork is 10.7 px from the fourth wheel.
- The stones are made from the tooth they lock (`pallet_stone`). When a stone
  locks, its face lies on the tooth's locking face (the near-radial edge of
  `escapeOutline`), and its inner corner is `LOCK_DEPTH` (4 px) inside the tip
  circle. The fork turns 18° between locks, which moves each stone about
  8.7 px in or out. So the unlocked stone is about 4 px outside the tip circle.
  The exit stone locks at the bank −9°, on the tooth whose tip is 38.5° from
  the line of centres. The entry stone locks at +9°, at 45.5°. The tooth
  phase (`ESCAPE_PHASE`) is unchanged.
- Each arm reaches round outside the teeth and holds its stone at the far end.
  The back of the pivot is flat at 2 px behind it, clear of the tips.
- The train waits for the unlock: in each tick window the fork turns over the
  whole window, and the train only in its second half (`timing.unlock` = 0.5
  in `design.json`; `stepper` in `watch/model.ts`). All the train's wheels and
  the hands wait together, so the meshes stay in step.

**Options.** Unlock fractions (worst overlap during the tick, in CSS px², with
the flush contact counted): 0 → 2.2, 0.3 → 0.48, 0.4 → 0.11, 0.45 → 0.04,
0.5 → none beyond the contact. Chosen 0.5. The instructions allow a brief
overlap, but 0.5 costs nothing visible: the wheel still makes its step inside
the window, and it moves faster.

Separate dark stones (like the impulse jewel) were not made. They might read
more clearly as jewels, but they add a solid to the fork's heights. The
stones are the tips of the fork's outline, as before.

**Evidence.** `tools/escapement_check.py` draws the wheel and the fork as
pixels and prints their overlap at 41 moments of a tick
(`evidence/escapement_check.txt`). The worst is 0.19 px², at the end, where
the stone's face lies on the tooth's face: that is the flush contact.
`evidence/escapement-u*.png` are its pictures. `evidence/after-escapement.png`
shows the renderer's pictures, at 5× zoom, at t = 0, 0.5, 0.6 and 1.0 s.

## 2. The balance's arms

The rim, the arms and the hub were four outlines, each with its own line
where they met. Now they are one: a disc with three openings (`openings()`,
as the train's wheels are drawn). There is no line where an arm meets the
rim or the hub. The hub's separate disc is gone: the openings' inner arcs
make the hub. The arms keep their width (6 px). The rim's outer edge keeps its
3 px line, and the openings take 2.5 px. `evidence/after-balance.png`.

## 3. The hairspring's inner end

There is a collet now, a disc of the spring's inner radius (8 px) that turns
with the balance, at the spring's height. It is part of the hairspring, so it
stays in slide 2's subject, "hairspring and stud", with the spring and the
stud. The spring leaves its rim on a tangent. The collet is marked
`inDrawing: false`, like the stud, because the 2D drawing had none.

## 4. The hairspring's length

Before, the spring was an Archimedean spiral with fixed inner and outer
radii, and the balance changed its turns. So its length went from about
409 px (unwound) to 529 px (wound).

Now its length is constant: 470.774 px at every swing
(`evidence/spring_length.txt`, `tools/spring_length.ts`). The radius is
r = inner + (outer − inner)(u + k u (1 − u)), with u from 0 to 1 along the
angle. The spread k is 0 at rest (the drawing's spiral), and is solved each
frame by bisection, so the length is the rest length. When the balance winds
the spring up (3.67 turns), the coils draw in: one turn in from the stud,
the radius goes from 28.8 px at rest to 26.7 px. When it lets the spring out
(2.83 turns), they spread: 32.0 px. k stays within ±0.95, so the coils never
cross.

**The outer end stays at the stud.** The instructions ask that the outside
diameter go down when the spring curls up. The stud holds the outer end, so
the outermost point cannot move. The coils inside it grow and shrink instead,
and the last turn sweeps out to the stud, as in a real hairspring. If the
whole outline should shrink, the stud would have to move with the end. Ask
the user before doing that.

## Checks

- `uv run art/validate_watch_design.py`: all passed.
- `uv run ../tools/validate.py` in `watches/`: all 18 checks passed (types,
  lint, unit tests, scenecheck, stills, barroom and motion on PNG stills,
  palette, build, offline walk).
- Re-measured the cover (`watches/docs/measurements.md`): hold 4.13 → 4.12,
  p90 8.04 → 7.89, Fmax 0.134 → 0.133, dPeak 10.17 → 10.33.

Also removed `forkOutline` from `watch/shapes.ts`. It was dead code: nothing
imported it, and it held the old hooks.

## Setup notes for this container

The container's uv (0.8) could not install Python 3.14.7, so a newer uv was
installed with pip. Playwright's Chromium download is blocked. The pictures
used the pre-installed Chromium in `/opt/pw-browsers`, linked under the
version name that this Playwright expects, with `PLAYWRIGHT_BROWSERS_PATH`
pointing at the links.

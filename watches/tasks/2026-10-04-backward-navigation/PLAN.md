# Plan: going back works with no extra work

Status: built, 2026-10-04 (option 1, steps 1–5). Not committed.

## Decisions (the user, 2026-10-04)

- **Option 1**, the full plan, not the cut on every move back.
- **The flash does not play on a move back.** It is an attention cue for the
  zoom from the whole mechanism into one small part. Zooming out does not need
  it. So rule 2's attention cue plays only on the step forward into its slide.
  This replaces the suggestion below that it play both ways.
- **A click back on the board uncurls it** (step 4).
- **The rules go in a house doc for all talks**: `stem/docs/navigation.md`.

## Results

- `tools/navcheck.py` (a house tool; a copy is in `tools/`) failed on bugs 1
  and 2 before the fix (`evidence/navcheck_before.txt`). That run was against
  the dev server while the snapshot was new, and its failures for places where
  the watch is hidden were faults of the first snapshot (fixed: a hidden watch
  and a finished fade report nothing). After the fix it passes: 12 moves
  forward, 12 back, no notes.
- `evidence/back_probe_after.txt`: 4 → 3, the rest shape stays at 0; 3 → 2,
  it fades in while the wheel fades out.
- `evidence/cover_probe_after.txt`: back to the cover, the title is at 0 until
  the camera's move ends (4.1 s), then fades in.
- `evidence/uncurl.png`: a click back from 2 to 1, at 0, 0.6, 1.2, 1.8, 2.4 and
  3.6 s: the spiral unwinds to the board, the pool and the stand fade in, and
  the swing goes on.
- **Found while building:** with the board in the watch's layer, slide 2 hid
  it at clicks 1 and 2, because `watchHide` removed the marker that makes the
  slide see-through. `navcheck` did not see it: an opacity does not say what
  covers it. Now the slide is see-through while it has a board, and the
  snapshot multiplies the layer's opacities by what the slide's paper lets
  through.

Docs read for this analysis: [`docs/watch.md`](../../docs/watch.md) (the order
of a change, the swap, the board's clicks, "The mechanism's time only goes
forward"), [`docs/slide-patterns.md`](../../docs/slide-patterns.md),
[`../docs/webgl.md`](../../../docs/webgl.md). What is new here: the cause that
the backward bugs share, the rules by kind of animation, and a check that
finds this kind of bug.

## The bugs, and the one cause that they share

Measured with `tools/back_probe.py` and `tools/cover_probe.py` (Playwright,
headless Chromium, the dev server). The output is in `evidence/`.

| #   | Navigation                | What happens                                                                                                                         | Evidence                                                  |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| 1   | 4 → 3                     | the rest shape is at opacity 0.95 in the first frame, then fades to 0 in about 15 frames. The stage does not change (rest 0).        | `back_probe.txt`                                          |
| 2   | 3 → 2 (click 4)           | the rest shape is at 1 from the first frame. The stage fades the balance wheel out over about 15 frames (rest 0.98 → 0).             | `back_probe.txt`                                          |
| 3   | 2 → 1 (the cover)         | the cover's title is at 0.35 at 1.9 s, during the tilt, and at 1.00 at 3.9 s, while the camera still moves. Forward, the text waits for the camera. | `cover_probe.txt`                                         |
| 4   | 2 click 2 → click 1       | the board jumps to flat and bends again from time 0. It does not uncurl. This is the documented behaviour (`watch.md`), not a mistake in the code. | `docs/watch.md`, "A click back from 2 returns to the bend" |

Earlier bugs of the same kind, all fixed on 2026-10-04: the curl replayed on
3 → 2 (`ae4f60f`), the hairspring flashed on 3 → 2, and a dashed line flashed
in the top left on 2 → 3 (a slide mounted before it is shown).

**The pattern.** Of these 6 bugs (1–3 and the 3 earlier ones), 0 were in the
stage's channel moves (`webgl/timeline.ts`). The stage never asks which way the navigation
went: it moves each channel from what is on the screen now to the new slide's
target. Every bug was in one of these:

- **A visual with one copy on each slide** (bugs 1, 2, and the dashed line).
  The rest shape on slide 3 is a different DOM element from the one on
  slide 2. Each copy starts a transition from _its own_ last state, not from
  what was on the screen. So the move between slides is a cut, plus a fade
  that starts from the wrong value.
- **An effect that belongs to the target slide, not to the move** (bug 3 and
  the hairspring flash). `watchFlash` and `--watch-text-delay` are set for the
  move _into_ slide 2. They also run on any other move into slide 2 (from 3),
  and they do not run on the reverse move (from 2 to the cover). On that move
  the text delay is the forward one, 1.8 s, while the reverse move takes
  4.1 s.
- **An imperative clock that a click restarts** (bug 4, and the curl replay).
  `DivingBoard.vue` sets its SMIL clock in event handlers. Each new case
  (entry from the next slide, a mounted slide that is not on the screen) needed
  one more branch.

## The rules of thumb

**Rule 0: the settled screen depends only on (slide, click).** It does not
depend on how you got there: forward, back, a jump or a reload. Only the phase
of a physical process (where the hands and the balance are) may differ.

**Rule 1: the author writes the target of each (slide, click), never a
move.** The engine makes each move from what is on the screen now to the
target. A move back is then the move forward, reversed, with no code for it.

**Rule 2: each kind of animation has a default for the move back.**

| Kind                    | What it is for                                    | Examples here                                                         | Forward                                      | Back (the default)                                                                                   |
| ----------------------- | ------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Presentation**        | shows what to look at                             | fades, the swap, the camera move and tilt, `watchOnly`, v-click, dims | an eased move to the target                  | the same move, reversed: the same durations, the channels in the reverse order (the timeline does this now) |
| **Attention cue**       | points at something during a move                 | `watchFlash`                                                          | plays during the move                        | plays during the reversed move. It belongs to the **move between two neighbours**, not to a slide   |
| **Text timing**         | keeps text off a moving picture                   | the cover title, slide 2's title                                      | after the camera move                        | after the reversed camera move. Take the delay from the stage's move, not from a constant            |
| **Narrative animation** | tells a story on a click                          | the board's bend and release, the curl                                | plays forward                                | plays **in reverse** (the board uncurls), to the earlier click's position on the same clock          |
| **Steady loop**         | a state that moves for as long as it lasts        | the board's swing, the balance's swing                                | starts at its boundary                       | starts again at its boundary (the curl reversed ends at the bottom of a swing). Not played in reverse |
| **Physical process**    | the machine, which runs on its own                | the mechanism's time, settle and resume                               | time goes forward; a mode changes by physics | the same: time goes forward, and the earlier mode comes back by physics (a click back from 4 to 3 settles again, as now) |
| **Slide text**          | the words                                         | titles, bullets                                                       | Slidev                                       | Slidev                                                                                               |

**Rule 3: a visual that is on more than one slide is one element.** It lives
in a layer that stays mounted for the whole talk (as the watch does in
`global-bottom.vue`), and it takes its target from each slide's frontmatter.

**Rule 4: a jump shows the target at once.** A reload, a URL, the overview,
or a move between slides that are not neighbours shows the target with no
move, as the stage does now. Print shows each page's target (as now).

## Options

The data for the ranking is the count above: 6 bugs that depend on the path to
a slide, found on one day, all outside the one part that already follows rules
0 and 1.

| Rank | Option                                                                                                                                                            | Future slides                                                                                    | Fixes now                     | Cost                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------- |
| 1    | **Targets, one persistent layer for each visual, moves that belong to edges, and a check that walks both ways** (rules 0–4, the steps below)                    | the author writes forward targets only. A new layer must follow rule 1, and the check finds it if it does not | bugs 1–4                      | the largest: the board moves to a layer, its clock becomes a seek, and a new check |
| 2    | Option 1 without the scrubbed clock: going back a click on the board still restarts it                                                                            | the same, except a narrative animation still needs a branch for each case                         | bugs 1–3                      | medium                                                                            |
| 3    | **Cut on every move back**: a move back shows the target at once, with no animation                                                                                | nothing to write, and nothing to break. Every move back is a cut                                  | bugs 1–4 (as cuts)            | small: one test of `navDirection` in the stage and the layers                     |
| 4    | Keep per-slide copies, and add a backward branch where a bug shows (`navDirection`, `clicksDirection` from `useNav`)                                               | every slide must think about the move back. The count of branches grows with the slides           | bugs 1–3, one at a time       | small now, and it grows                                                           |
| 5    | Write each move twice, forward and back (as Slidev's `transition: a\|b`)                                                                                          | double the work, and the two can disagree                                                         | all, by hand                  | large, and it grows                                                               |

Why 1: it is the only option where future work thinks only forward and the
moves back stay animated, which the user asked for. The stage already works
this way, and it had none of the bugs. Option 3 is the cheap fallback if the
talk date comes first: it is correct, but every move back is a cut. A move
back in a talk is usually a recovery or a question from the room, so a cut is
acceptable there, and it is a safe interim step. Options 4 and 5 put the work
on each future slide, which is what made the bugs.

## Steps for option 1

1. **The check first.** Give the deck a snapshot of each layer's state:
   `window.slideState()`, JSON from the stage's `valuesAt` (view, tilt, rest,
   subject, fading, model mode) and from each DOM layer (its opacities and
   its clock's position). A walk visits each edge between neighbours
   ((slide, click) to the next) forward and back, and samples each frame of
   the move. It fails if:
   - the settled snapshot differs from the snapshot after a direct load of the
     same (slide, click) (rule 0), or
   - a channel jumps more than a set amount in one frame (a cut), except
     where the target says so (the slide text).
   The probes in `tools/` are the start of it. It must fail on bugs 1–3 before
   any fix. Run it from `validate.py`. If it does not need the watch's
   internals (it reads only `window.slideState()`), it can be a house tool
   next to `offline_check --walk`, for every talk.
2. **The board as a layer.** Move `DivingBoard` into the persistent layer
   (above the canvas in `global-bottom.vue`, and in `slide-bottom.vue` for
   print). Its target comes from slide 2's frontmatter, in keys that
   `watch/state.ts` checks as it checks the `watch` keys. Slide 3 then needs
   nothing: it has no board keys, so the rest shape's target there is "off",
   and the move from 2 to 3 fades it out. The move from 3 back to 2 fades it
   in, and 4 to 3 does nothing. Slide 3's script, its second `DivingBoard` and
   the "entered after the click" branch in `DivingBoard.vue` go. Take the
   fade's length from `FADE_SECONDS` through a CSS variable, as
   `--watch-text-delay` is set now, so that the two fades cannot drift apart.
3. **Moves that belong to edges.** A flash plays on the move between a slide
   and its neighbour before it, in both directions. Keep `watchFlash` on the
   later slide, as now, and change its meaning in `watch.md`. Set the text delay from
   the stage's move: `Timeline.show` returns when the view channel ends, and
   the slide's text waits for that, in either direction.
4. **The board's clock as a seek.** Each click has a position on the SVG's
   timeline (hidden; the swing loop; the curl's end). A change plays the clock
   from where it is to the target at rate $+1$ or $-1$. A loop is entered at
   its boundary. A click back from 2 to 1 then uncurls the board to the bottom
   of its swing, and the swing goes on.
5. **The rules in the docs.** Rules 0–4 and the kinds table go in a house doc
   (they are true of every talk): a new section in `../docs/illustrations.md`
   (motion), or a new `../docs/navigation.md` with an `AGENTS.md` index line
   ("before you add a click or a visual that moves"). The talk's
   `docs/slide-patterns.md` gets the authoring rule: write targets, not moves.
   `docs/watch.md` changes for steps 2–4.

## Decisions for the user

- Option 1, or 3 as a quick interim step before 1?
- Rule 2's default for the flash: play it on the move back (the user's
  suggestion)? Then the move from slide 2 back to the cover flashes the
  balance, which it does not do now.
- Step 4 changes documented behaviour: a click back on the board uncurls it,
  where it now restarts the bend. Is that wanted?
- Where the rules go: a house doc for all talks, or this talk only.

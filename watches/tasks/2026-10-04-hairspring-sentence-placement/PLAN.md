# Where to put "Bend it away from straight, it pushes back" on slide 2

## The request

On slide 2 (Hairspring), show "BEND IT AWAY FROM STRAIGHT, IT PUSHES BACK"
when the diving board starts to bend (click 1). During the curl (click 2),
strike out BEND and STRAIGHT, and write WIND and REST above them. Find the
best place for the text. Moving the "Rest Shape" callout, the hairspring or
the pool is allowed.

Docs read: `docs/slide-patterns.md` (picture on the left, callouts on the
right; 17 px floor), `docs/watch.md` (the board, its callout, its clock),
`../docs/legibility.md` (text sizes), `../docs/navigation.md` (story
animations play backward).

## Method

All values are CSS px on the 980 × 552 canvas, measured on a fresh build.

- `curl_extent.py`: steps from click 1 to click 2, takes a screenshot every
  100 ms, and finds the box of the board's ink. It also measures the text
  widths in IBM Plex Sans 600 with `measureText`.
- `mock.py` (and `mock2.py`, round 2): overlays each candidate on the real slide at click 1 (the board
  swings) and click 3 (the curl is done, with the edit), in `mockups/`.
- Run both from `stem/`, with `.venv/bin/python3 <script> <scratch dir>`.
  The scratch dir must hold a build in `deck/`.

## Measurements

| What                                                                | Value                                        |
| ------------------------------------------------------------------- | -------------------------------------------- |
| Title "Hairspring"                                                  | x 392–588, y 40–82                           |
| Board swing at click 1, tip at the top of the swing                 | x ≈ 497, y ≈ 148                             |
| Curl, 0.7–0.9 s after it starts                                     | reaches y = 0 at x 34–311; y 93 at x ≤ 478   |
| Spring at rest (click 3)                                            | x 107–421, y 141–429                         |
| Pool fade                                                           | paper from x ≈ 588 (60 % of the width)       |
| "Rest Shape" label                                                  | x 610–762, baseline y 260; leader elbow 550  |
| Free right column, all clicks                                       | x 590–940 (350 wide), y 95–540               |
| Sentence on one line, 29 px                                         | 683 px                                       |
| Widest of "BEND IT AWAY / FROM STRAIGHT, / IT PUSHES BACK"          | 237 px at 29 px; 302 px at 37 px             |
| Ink contrast on paper / on the pool water                           | 14.2 : 1 / 4.1 : 1                           |

The edit needs a row above BEND and above STRAIGHT. With three lines that is
five rows, about 180 px at 29 px.

## Options

**A. Merge the sentence with the callout.** The sentence replaces the label
"Rest Shape". The line "FROM STRAIGHT," takes the label's place (x 610,
baseline 260), so the leader's start, elbow and path do not change. The
block is y ≈ 150–330.

- Pro: at click 1 the leader joins STRAIGHT to the straight dashed outline.
  After the curl it joins REST to the dashed spiral. The label changes as the
  outline changes: that is the point of the slide.
- Pro: one text block, not two. No duplicate of "rest".
- Pro: no art moves, and the leader needs no new optimisation.
- Con: the words "Rest Shape" go, unless the insert is "REST SHAPE"
  (≈ 165 px at 29 px, over STRAIGHT's 143 px: it fits).
- Con: the leader ends at the start of the line, at FROM, not at STRAIGHT.

**B. Below the callout, which stays.** Block at x 610, y ≈ 300–490.

- Pro: changes nothing that exists.
- Con: two text blocks in one column, 35 px apart. "Rest Shape" and REST
  say the same thing twice.
- Con: about 50 px further from the board than A.

**C. One line at the bottom.** x 148–832, y ≈ 470–530.

- Con: at click 1 it lies on the pool. Ink on the water is 4.1 : 1, against
  14.2 : 1 on paper, and the ripples cross the letters.
- Con: to clear the pool, the picture must move up by about 75 px. The curl
  already reaches y = 0, so it cannot move up. The hairspring's place is
  copied between `watch/generate.ts` and `art/diving_board.py`, and tests
  check it.

**D. Top right, two lines.** x 560–947, y 95–245.

- Con: with the two insert rows it needs about 150 px at 29 px, and it
  touches the "Rest Shape" label at y 236. The right margin is 33 px.
- Con: it starts 63 px from the board's tip at the top of the swing.

**E. Under the title, or across the top left.** Rejected on the
measurements: the curl sweeps x 34–478 above y 100, and reaches y = 0. The
strike would play while the board passes behind it.

**F. Move the hairspring or the pool to make room.** No gain for A or B: the
right column is 350 px wide, and the widest line is 237 px. It is needed only
for C, and C cannot have it (see C).

## Ranking

1. **A, merged with the callout.** It joins the word to the shape and keeps
   one text block, and it moves nothing.
2. **B, below the callout.** It is safe, but it has two blocks that say the
   same thing.
3. **D, top right.** It is too tight with the edit rows.
4. **C, bottom.** Poor contrast on the water, and no room to move the
   picture.
5. **E, top or title.** The curl goes through it.

## Round 2: crop the pool, or move the callout down

The user suggested two more options. `mock2.py` draws them, in `mockups/F-*`,
`G-*` and `H-*`.

**F. Crop the pool below the stand, and put one line at the bottom.** The
stand's bottom is at y 418, so the crop is at y ≈ 430. F fades over 30 px;
G is a hard edge. The line is x 148–832, with the insert row above it.

- Pro: one line, read in one pass. WIND and REST sit on one row above it.
- Pro: the board and the spring do not move. Only the pool's group changes.
- Con: 77 px of water is left, of 199 px (39 %). The pool no longer seems to
  go on past the slide's bottom, which `docs/watch.md` gives as the reason
  for its shape.
- Con: STRAIGHT is about 210 px below the dashed outline that it names. In A
  it is level with the outline and 100 px to its right.
- Con: the spring at rest ends at y 429. The insert row starts at about
  y 453, so the gap is 24 px.
- Con: `docs/slide-patterns.md` puts text on the right of the picture.
- G's hard edge cuts the ground and the pool like a cutaway. The fade (F)
  matches the fade on the right, and the pool-edge task chose a fade over a
  hard edge there.
- The mockup's paper overlay also covers the bottom of the spring at click 3.
  A real crop would mask only the pool's group.

**H. Move the callout down to baseline 350, three lines above it.** The
block is x 610–850, y ≈ 97–280. The leader in the mockup is a straight
stand-in; the real one comes from the optimiser in `art/diving_board.py`.

- Pro: keeps "Rest Shape", and the sentence is read before the label.
- Pro: 50 px between the blocks, against 35 px in B.
- Con: at click 1 the leader runs down to the right, across the pool's wall.
  The muted leader has 3.93 : 1 contrast on the wall wash, against
  4.96 : 1 on paper. It also crosses the coping line, which has the leader's
  colour, so the leader looks like part of the pool.
- Con: the leader's start and elbow change, so the path must be optimised
  again and the tuning checked again.
- Con: WIND starts at y ≈ 97, about 15 px under the title's line.

**Ranking after round 2:** A, then B, then H, then F, then D, C and E. H
beats B only if the new leader can stay off the pool. A label at baseline
≈ 310 keeps the leader almost level, but then the three lines must fit in
y 97–280, with tighter rows or smaller insert words. This was not mocked up.

## Decision

The user chose A (2026-10-04).

**Case.** Measured in IBM Plex Sans 600 (`case.py`, from a canvas):

| Case                      | Widest of the three lines at 29 px | Letter height at 29 px  |
| ------------------------- | ---------------------------------- | ----------------------- |
| ALL CAPS                  | 237 px                             | cap height 20.2 px      |
| Title Case                | 201 px                             | x-height 15.2 px        |
| Sentence case             | 194 px                             | x-height 15.2 px        |

In the same 237 px, sentence case can be set at 35 px: x-height 18.3 px and
cap height 24.4 px. Recommended: sentence case. The text is a sentence, it
fits larger, and lowercase words keep their shape. The deck's other sentence,
the takeaway on "Before clocks", is in sentence case.

The user agreed: sentence case (2026-10-04).

**Spacing.** The rows for the inserted words are there from click 1. The
lines do not move apart during the curl: the user judged that too much
motion.

**When the edit plays.** Slide 2's clicks: 1 board bends and swings; 2 pool
fades, board curls (it waits up to 1 s for the bottom of the swing, then
2.4 s); 3 board fades out, hairspring fades in; 4 hairspring swings.
The leader follows the dashed rest outline, so until the edit the leader
joins "straight" to whatever the outline is.

| When                              | "straight" on a spiral | Moves at the same time                    |
| --------------------------------- | ---------------------- | ----------------------------------------- |
| During the curl                   | about 0 s              | the curl, the slide's biggest motion      |
| Just after the curl ends          | about 0 s              | nothing: the board is still               |
| On a click of its own, after it   | until the speaker clicks | nothing                                 |
| Click 3, board → hairspring       | all of click 2         | a small crossfade (the stud and collet)   |
| Click 4, the hairspring swings    | all of clicks 2 and 3  | the swing starts                          |

Recommended: just after the curl ends, on the board's clock.

## Open questions

- In the mockups, the rows for the inserts are always there, so at click 1
  the three lines have wide gaps. The other way is to close the gaps at
  click 1 and open them during the curl. That adds motion. Resolved: the
  rows stay fixed (see Decision).
- The colours in the mockups (accent for the edit) are not checked against
  `../docs/theme.md`. Resolved: ink for the sentence (body text), accent for
  the edit (the one thing to look at).
- The strike must run on the board's clock: the curl starts up to 1 s after
  the click and lasts 2.4 s, plays backward on a click back, and is posed in
  print. If the text is in the callout group in `art/diving_board.py`, it gets
  all of these. A `v-click` does not. Resolved: HTML in the board's component,
  on the board's clock (see Built).

## Built (2026-10-04)

- **The sentence is HTML in `components/DivingBoard.vue`, not SVG text.**
  All else being equal, prefer the simplest tool for the job, and HTML is
  simpler than SVG for text. The browser lays it out with its own kerning, so
  a strike is the width of its word, with no font metrics in Python.
  `artcheck` does not decide this: it allows only the four art colours
  because those are all the art has used so far. If the art has a good use
  for another theme colour, change `artcheck` to allow it (user, 2026-10-04).
- **The edit is on the board's clock.** `Timeline.edit` (1.2 s) in
  `art/diving_board.py` is written to the SVG's root as `data-edit-duration`.
  `BoardClock` holds at the end of the curl and the edit, so a click back
  undoes the edit first and then uncurls. `editStep` in `watch/board.ts`
  gives each of the four steps, 0.3 s each, smoothstep.
- **The leader is unchanged.** The SVG differs only in its root's attributes
  and the removed `<text>`. `LeaderDesign.label` (the old label's place) is
  written to the root, and the page puts the second line's baseline there.
- **Print.** `boardPoseTime` now poses clicks 3 and 4 (only the rest shape)
  at the end of the edit; they were posed half way through the curl, like
  click 2. `art/print_check.py` checks the new pose.
- Checked: `uv run ../tools/validate.py` in `watches/` (23 checks) and
  `uv run tools/validate.py` in `stem/` (8 checks) pass. Screenshots of
  click 1, the edit part way, and click 4 looked right.

# The hands over the Recap slide's touches

**Status:** built (2026-10-13). The current rules are in
[`docs/watch.md`](../../docs/watch.md), "The Recap slide".

## Request (2026-10-13)

The victory lap's task said: "At some close stops, the hands cover the
touch. A stop can hide them"
([`2026-10-12-victory-lap`](../2026-10-12-victory-lap/PLAN.md), "Steps 2 to
6"). Where the hands are depends on how long the talk has run, and on the
time at each speed-up. The user asked:

- Is there a dynamic way to fade a hand when it covers the touch?
- Can the hands be semi-transparent (0.35), so that the mechanism shows
  through them?
- Is it worth it? At 720× even the hour hand moves fast enough. At 120× the
  hour hand can be in the way too long, but the minute hand moves fast
  enough. At 15× both move too slowly.
- Give options, with pros and cons, ranked.

Docs read first: [`docs/watch.md`](../../docs/watch.md) ("The Recap slide",
"Dimmed pieces"), [`stem/docs/webgl.md`](../../../docs/webgl.md) ("A dim",
"A fade fades its meshes as one picture", "A model can tell a story").

## How long a hand covers a touch

`tools/cover.ts` sweeps each hand through a whole turn and tests its mesh's
footprint against a disc round the touch, seen from the stop's camera. The
disc's radius is 6 world px (about the teeth in mesh). At zoom 10 that is
60 slide px. The output for 6 and 12 px is in `out/` (not in git; run the
tool again). Other parts in the way are not counted.

Radius 6. Each cell is the share of the hand's angles that cover the touch,
and the longest cover at the stop's speed-up:

| Stop                 | Speed-up | Minute hand        | Hour hand           | Seconds hand     |
| -------------------- | -------: | ------------------ | ------------------- | ---------------- |
| motion works         |    1440× | 23%, 0.4 s of 2.5 s | 14%, 4.1 s of 30 s  | —                |
| barrel               |     720× | 3.5%, 0.2 s of 5 s | 4.7%, 2.8 s of 60 s | —                |
| barrel touch         |     720× | 4.0%, 0.2 s of 5 s | 5.7%, 3.4 s of 60 s | —                |
| centre touch         |     120× | 6.0%, 1.8 s of 30 s | 6.9%, 25 s of 6 min | 3.5%, under 0.1 s |
| third touch          |      15× | 3.8%, 9 s of 4 min | 5.4%, 2.6 min       | 17%, 0.7 s of 4 s |
| fourth touch         |       2× | 3.1%, 55 s         | 2.6%, 9.5 min       | 10%, 3.1 s of 30 s |
| pallet               |       1× | 3.1%, 1.8 min      | 2.6%, 19 min        | 4.6%, 2.8 s of 60 s |
| jewel                |       1× | 3.3%, 2.0 min      | 3.3%, 24 min        | —                |
| hairspring           |       1× | 3.2%, 1.9 min      | 3.0%, 22 min        | —                |

- This agrees with the user's look. A cover of a few seconds in a sweep
  that the audience sees go by is no problem (the minute hand to 120×, the
  hour hand to 720×). A cover longer than the stop is the problem: the hour
  hand from 120×, and both hands from 15×.
- **At one run of the talk, about one chance in three** that one of the
  stops from the centre touch on opens with the hour or the minute hand
  over its touch: $1 - \prod_s (1 - p_s) \approx 0.34$, with $p_s$ the sum
  of the two hands' shares at stop $s$ (the minute hand at 120× not
  counted). With a disc of 12 px, about one in two. This takes the stops as
  independent, which they are only roughly.
- **The seconds hand stays.** At the fourth touch it covers for 3 s in
  each 30 s, a sweep that the audience sees, as the minute hand's at 120×.
  The speaker's notes name it at that stop ("the seconds hand's").

## What the renderer can do now

- **A fade** draws the frame twice, with and without the fading meshes, and
  mixes the two pictures (`render` in `webgl/renderer.ts`). So a group of
  meshes can show at any opacity, as one picture, and what it covers shows
  through it. There is one such fade at a time.
- **A model's story** can show meshes at an opacity (`Model.extra`,
  `webgl/stage.ts`), but only while the timeline does not fade. During a
  timeline fade, the story's meshes show whole or not at all.
- **A dim is not an opacity.** A dimmed hand still covers the touch.
- **A decal** (`fill: null`) draws lines only, and covers nothing.

## Options, ranked

1. **Hide the hour and minute hands from the centre touch (click 3) to the
   last click** _(recommended)_. They fade out during the move to the centre
   touch. They come back at the Changed The World section, with the cover's
   picture.
   - Pros: no hand ever covers a touch from 120× on; the same at each run,
     and on the printed page. From the centre touch on, the tour is in the
     train, under the dial, so the hands go as the dial would. No renderer
     change.
   - Cons: the hands are gone also when they would not cover (more than 90% of
     the time at each stop). There is no frontmatter syntax yet for "all
     but these pieces": a new key or syntax, for example
     `watchHide: [hour hand, minute hand]`.
   - Cost, estimated: 30–50 lines (`watch/state.ts`, its tests, the
     frontmatter, `docs/watch.md`).
2. **Ghost hands from click 3: the hand's face fades out, and a pale outline
   stays.** Each hand gets a decal of its top outline, in a piece that `all`
   leaves out, dimmed. The solid hand fades out over it.
   - Pros: the hands stay in the picture, so the time still shows; the
     teeth show at full contrast under the ghost; no renderer change.
   - Cons: two pale lines still cross the touch when a hand is over it; a
     look that no other slide has; two more pieces.
   - Cost, estimated: 60–90 lines.
3. **Hands at opacity 0.35 from click 3**, by the story's opacity
   (`Model.extra`).
   - Pros: the hands stay, as a glass hand would; the 0.35 matches the
     deck's dimmed cards.
   - Cons: under a hand the teeth show at 65% of their contrast, and the
     hand's outline still crosses them at 35%. The frame is drawn twice for
     the whole of these stops: about twice the GPU time (1–3 ms a frame now,
     `stem/docs/webgl.md`, "Budgets"). At the step out to the Changed The
     World section, the motion works fade out, so the hands pop to whole or
     to none. A fix for that is a renderer with more than one fade: more
     pictures, and more GPU time.
   - Cost, estimated: 100–150 lines, with the hands moved from the state's
     pieces to the model.
4. **A dynamic fade: a hand fades (to 0 or to 0.35) only while it covers
   the touch.** Each frame, project the touch's disc and each hand, as
   `tools/cover.ts` does, and ease the hand's opacity with some hysteresis.
   - Pros: the hands show whenever they do not cover, more than 90% of the
     time.
   - Cons: all of option 3's cons, and more. A hand that fades out for no
     cause that the audience sees, just as it reaches the touch, is an event
     with no story. From 15× down a hand barely moves during a stop, so when
     the fade starts it acts as option 1 or 3 for the whole stop. It is truly
     dynamic only at 120× (the hour hand, 25 s of 6 min). The touch, the
     camera's move and the printed page all need tests.
   - Cost, estimated: 200–300 lines.
5. **Steer the clock: add watch time during each move, so the hands land
   clear of the next touch.** Each frame is still a true state of the
   mechanism.
   - Cons: to place the minute hand needs up to 1 h of watch time in a
     2.5 s move, a mean of 1440×: a visible spurt, against the speed rule.
     At 15× the minute hand turns 45° in 30 s, so a long stop can still
     bring it over the touch.
6. **Other cameras.** Not possible: the minute hand (206 px) reaches past
   every touch (44 to 118 px from its arbor, as the camera sees them).

**Why this order.** Options 1 and 2 remove the problem with no renderer
change, and the same picture at each run and on paper. Option 1 is the
simplest, and its fade-out matches the tour: from the centre touch on, it
is in the train, under the dial. Option 2 is for a deck that wants the hands to stay. Options 3
and 4 cost more GPU time and code, and still put a line across the touch.
Option 4 adds an event that the audience cannot explain, and gains over
option 1 only at the 120× stop.

## Decision (2026-10-13)

The user's answers:

- Hide the hands for clicks 4 to 8. Bring them back before the camera tilts
  and zooms to the next slide.
- Ghost or transparent hands could confuse an audience that has seen only
  solid hands up to now. So options 2 to 4 are out.
- Click 3: the minute hand that goes there could look odd, because the
  centre wheel and its arbor show clearly.

For click 3, I compared:

1. **The hour hand goes at click 3, and the minute hand at click 4.**
   Chosen. The hour hand is the only long cover at 120× (25 s). The minute
   hand is the centre wheel's own hand: it turns once in 30 s with the
   wheel that the stop shows, as the Gear Train slide says ("The minute
   hand!"). It passes over the touch in 1.8 s.
2. **Both stay at click 3.** About one chance in 14 (one in 9 with a 12 px
   disc) that the hour hand is over the touch when the camera arrives, for
   12 to 20 s on average.
3. **Both go at click 3.** The look that the user did not like, and the
   minute hand goes where it means the most.

## What was built

- **`watchHide`** (`watch/state.ts`): a click key, as `watchDim` is. The
  pieces that it names are in `watch`, but do not show, and a fitted view
  does not fit them. A name that `watch` does not hold throws. `watch: [all,
  ...]` had no other way to leave a piece out.
- **Each hand goes after the camera arrives** (`watchGoLater`), while the
  eye follows the move. On the step back, it comes back after the camera
  moves, the step forward reversed.
- **`watchMoveAlso`** (`watch/state.ts`, `StageState.moveAlso` in
  `webgl/timeline.ts`): on the slide only, about the step between it and
  the slide before, as `watchMoveWith` is. Its pieces of either slide are on
  the screen while the camera moves. So on the step to the Changed The World
  section, the motion works fade out, the hands fade in, and then the camera
  tilts and zooms out. On the step back, the camera moves, the hands fade
  out, and then the motion works fade in. A step key, the mirror of
  `watchGoLater`, would not give that reverse: a step key belongs to the
  click that the step goes to, and on the step back that is the Recap
  slide's last click.
- **Tests:** `watch/state.test.ts` (both keys, their defaults and their
  errors), `webgl/timeline.test.ts` (`moveAlso`, forward and back),
  `watch/deck.test.ts` (which hand shows at each of the Recap slide's
  clicks; each hand on the screen at the end of the move into its click; the
  hands before the move into the cover's picture, and after the move back).

# Plan: a press during a move

Status: option 5 built, 2026-10-25, in place of option 1. Not committed.

## The second decision (the user, 2026-10-25)

Option 5: a press during a move is a jump to its own target, in either
direction. The user tried option 1 and found its flaw: a viewer who presses
until a view shows stops when the view shows. With option 1, a press first
showed the last press's target and then animated away from it, so each view
showed only after the deck had left its place. Going back from the Balance
Wheel slide, the pool showed only when the deck was one place past it, and
the Mechanical Marvels view only when the deck was at the Hairspring slide. Going forward, the escapement
showed at the Escapement slide's click 1, and then went. The user's words are
in `instructions.md`.

| Rank | Option | What a burst shows | Cost |
| ---- | ------ | ------------------ | ---- |
| 1 | **5: a press during a move, or less than `BURST_MS` after a press that jumped, is a jump** | each press's own place, at once | `global-bottom.vue` decides; the board emits `busy` |
| 2 | 5 without the burst window | every other press animates: the view of a press that animates shows only after the next press | as 5, less one constant |
| 3 | 1 (below) | each place after the deck has left it | built, replaced |

Why the window: a jump leaves nothing that runs, so without it the press
after a jump is a step from rest, and animates. At a burst of presses
150 ms apart, the targets of half the presses would then show late, the flaw
of option 1 again. `BURST_MS` is 1000 ms: longer than the gap between the
presses of a search (60 to 400 ms here), shorter than a pause to look. It is
a choice of feel, not a measurement; the user can tune it.

What decides "a move runs": the stage's `endAt` (its fades, camera, flash
and the model's story), and the board's story (bend, curl, uncurl: its new
`busy` event). On the Hairspring slide the stage is hidden under the board,
so without the board's `busy`, a press during the curl would animate.
Slidev's text is not a layer of this rule: on a jump its fades (0.4 s) still
play, as for any jump.

### Results of option 5

`tools/rapid.ts --jumps` adds a check: after a press that the rule makes a
jump (a move ran at the frame before it, or a jump came less than
`BURST_MS` before), each frame at its place shows exactly that place's
pieces, and no move runs. The earlier checks stay.

| Burst | Option 1 | Option 5 |
| ----- | -------- | -------- |
| 3 presses, 150 ms apart, Chromium | 79 failures | 0 |
| 3 presses, 150 ms apart, Firefox | | 0 |
| 3 presses, 150 ms apart, WebKit | | 0 |
| 3 presses, 400 ms apart, Chromium | | 0 |
| 5 presses, 60 ms apart, Chromium | | 1, then 0 in 8 more runs |

The outputs are `evidence/jump_*` and `evidence/rule1_jumps_3x150_chromium.txt`
(option 1). Four runs went in parallel. The one failure: at the Hairspring
slide's click 1, at the end of a burst from the cover, a move ran after a
press that the check took for a jump. Eight more runs, four of them under the
same load, did not show it again, so I do not know its cause. My guess, not
proven: the check times a press by the first frame after it, and under load
that frame can come late, so at the edge of `BURST_MS` the check and the deck
can disagree.

Full validation then failed in `art/print-check.ts`: its walk pressed
during the board's bend, so the press into the curl click jumped, and the
curl's intermediate picture never showed. The layer's test for a jump
(`pressJumps`) now also makes `slideState().busy` true, and the walk waits
for it before a press while the board shows. Elsewhere a jump shows the
same state as a step, and a wait at every press would make the walk slow.

## The first decision (the user, 2026-10-24), replaced

Option 1: the rule in both directions. The user's words for it: with a new
target n, if the screen is not between n−1 and n+1, snap it to the nearest
bound, then animate. A jump (a load, the overview) shows its target at once,
as before.

## Results of option 1

- `global-bottom.vue`: a step in the same direction as the last step, while
  the stage's change still runs (`stage.endAt`), first shows the last
  target as a jump. No layer changed.
- `tools/rapid.ts` checks each frame of a burst: its pieces (full opacity, or
  fading while the fade shows) must belong to the place that the deck is at
  (`slideNavigation()`) or to the place before it. Before the change it
  fails, after it passes:

| Burst | Before | After |
| ----- | ------ | ----- |
| 3 presses, 150 ms apart, Chromium | 33 frames | 0 |
| 5 presses, 60 ms apart, Chromium | 44 frames | 0 |
| 3 presses, 400 ms apart, Chromium | 33 frames | 0 |
| 3 presses, 150 ms apart, Firefox | | 0 |
| 3 presses, 150 ms apart, WebKit | | 0 |

  The outputs are in `evidence/` (`before_*`, `after_*`). Every burst ends
  like a direct load, before and after. Six runs went in parallel, so their
  timings are not a single run's.
- The rule is in `../../../docs/navigation.md`, "A press during a move";
  `../../../docs/webgl.md` and `../../docs/watch.md` link to it.

The tool reads the watch stage (`window.watchStage`), so it is the talk's,
not the house's. It imports the house's `tools/browser.ts` as of this task's
commit.


Docs read for this analysis: [`../../../docs/navigation.md`](../../../docs/navigation.md)
(the rules and the checks),
[`../2026-10-04-backward-navigation/PLAN.md`](../2026-10-04-backward-navigation/PLAN.md)
(rules 0–4, and the user's choice of animated moves back),
`webgl/timeline.ts` (its header: what a new state does to a move that runs),
`global-bottom.vue` (where a change of place becomes a step or a jump).
What is new here: the evidence that rapid presses end where the rules say,
and that what looks strange is the frames on the way; and a rule for a press
during a move. The code follows the rules: they do not say what a press during
a move should look like. This is a gap in the design, not a bug.

## The cache (the first question)

A cache never needs invalidating when it holds the result of a pure function,
keyed by all of that function's inputs: the mainspring's geometry for a pose.
The bug was a cache of _another object's_ state ("the mesh holds what I last
wrote"), which was wrong as soon as a second writer shared the object (the
article's figures share one renderer). That knowledge belongs to the object
that holds the state: since the fix, each model gives its geometry at every
frame, and the renderer skips a geometry that it holds already
(`webgl/renderer.ts`, `updateMesh`). A figure starts at its click's target
because a mount is a jump (rule 4), and a jump shows the target at once.

## The evidence

`tools/rapid.ts` walks the deck in bursts of 3 presses, 150 ms apart (each
press before the last move ends), forward to the end and back, waits for
quiet, and compares `slideState().settled` with a direct load of the same
place. **All 36 bursts end like a direct load**
(`evidence/ends_3x150_chromium.txt`, from the tool's first version, which compared only where a burst ends). So rule 0 holds; what looks strange is
the frames _during_ the bursts.

Why they look strange, from the code: a new target starts "from what is on the screen
now" (`webgl/timeline.ts`): a fade cut short ends at 0 or 1, the camera goes
on from where it is, and the new change runs its three phases (fade out,
move, fade in) from that screen. So each press during a move builds a screen
that no (slide, click) names, and starts a full change from it. The other
layers (the board's clock, the mainspring's story, the text delays that wait
for the camera, Slidev's `v-click`s) each handle an interrupted move their own
way, so mid-burst they can also disagree with one another. No check sees this:
`navcheck` waits for quiet before each press, and `offline-check --walk`
checks only that the walk moves.

## Options

The cost is the number of places that must change, and the risk is the number
of mid-move cases that a layer must get right.

| Rank | Option | A single press back | Rapid presses | Cost and risk |
| ---- | ------ | ------------------- | ------------- | ------------- |
| 1 | **A press in the same direction as a running move first ends that move at once** (a jump to its target), then steps from there. A press against the move (back during a forward move, or forward during a back move) steps from the screen, as now | animates, as now | each frame is a settled place, or one step from one: the two cases that every layer and both checks already cover | one place: the change handler in `global-bottom.vue` (it knows the last move and whether the layers are busy). A rule in `docs/navigation.md`. No layer changes |
| 2 | The user's rule as stated: option 1 for back presses only. Forward bursts as now | animates | back bursts clean; forward bursts as now | as 1 |
| 3 | **Snap every move back**: a step back is a jump | cuts | clean | smallest: `moveOf` returns "jump" for back. Undoes the user's choice of 2026-10-04 (animated moves back) |
| 4 | Make every layer continue correctly from any screen mid-move | animates | smooth in principle | largest: each layer (timeline phases, board clock, mainspring story, text delays) needs a correct interrupted case, and they must agree. This is the source of today's strange frames |

Why 1: it reduces every move to a step from a settled place or a jump, which
are the cases built and checked on 2026-10-04, so it adds no new mid-move
state. It is the user's rule, made the same in both directions: a speaker who
clicks forward twice quickly has the same problem as one who clicks back. As
far as I know, PowerPoint does the same: a click during an animation ends it
at once and starts the next (not checked here). Option 2 is the user's rule
exactly, if forward bursts should stay as they are. Option 3 is the cheap
fallback, at the cost of every animated move back. Option 4 is the hard path
that the question "is making it reasonable too hard?" fears: yes, for every
layer at once.

What option 1 does not change: a press against a running move (back during a
forward move) still continues from the screen. That case is one interrupted
move, not a chain of them; if it also looks wrong, the same rule can end the
forward move first (the user preferred not to).

## Steps for option 1 (or 2)

1. In `global-bottom.vue`'s change handler: keep the last step's direction,
   and ask whether its change still runs (the stage's `endAt`, the board,
   the model's story). If the new step goes the same way while it runs,
   show the last target as a jump first, then the new step.
2. A check: `tools/rapid.ts` grows a frame recorder (as `navcheck`'s), and
   fails when a frame's `shown` set during a burst is neither a place's
   target nor within the step that follows it (the meshes of the two places).
   Run it on the old code first: it must fail there.
3. `docs/navigation.md`: the rule for a press during a move, beside rule 4.

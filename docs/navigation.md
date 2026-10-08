# Navigation: forward and back

**Covers:** how a slide says what it shows, so that going back a click or a
slide works with no extra code; the default for each kind of animation when
the viewer goes back; and the check that finds a move that does not follow
the rules.

**Tasks:**
[`full-validation-profile`](../watches/tasks/2026-10-07-full-validation-profile/PLAN.md)
(the fast smoke replacement and measured coverage costs),
[`validation-speed`](../tasks/2026-10-06-validation-speed/PLAN.md)
(the combined navigation and offline walk).

**Read before** you add a click, a slide transition, or anything that moves or
fades between clicks or slides.

Why, and the options that were compared:
[`watches/tasks/2026-10-04-backward-navigation`](../watches/tasks/2026-10-04-backward-navigation/PLAN.md).
Of the first six bugs that appeared only on some paths to a slide, none was in
the one part that already followed these rules (the watch's stage).

## The rules

**Rule 0: the settled screen depends only on the slide and the click.** It does
not depend on how the viewer got there: forward, back, a jump or a reload. Only
the phase of a physical process (where the hands and the balance are) may
differ.

**Rule 1: a slide names a target for each click, never a move.** Put the target
in the slide's frontmatter or its `v-click`s. The layer that draws it moves from
what is on the screen now to the new target. So a move back is the move
forward, reversed, with no code for it. Do not write code that asks which way
the viewer went (`navDirection`, `clicksDirection`): the layer decides that.

**Rule 2: each kind of animation has a default.**

| Kind                 | What it is for                    | Forward                                      | Back                                                                     |
| -------------------- | --------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| **Presentation**     | shows what to look at             | an eased move to the target                  | the same move reversed: the same lengths, the steps in the reverse order |
| **Attention cue**    | points to where the view is going | plays on the step into its slide             | does not play: zooming out does not need it                              |
| **Text timing**      | keeps text off a moving picture   | the text waits for the camera                | the text waits for the camera, which now moves last                      |
| **Story animation**  | tells a story on a click          | plays forward                                | plays backward, to the earlier click's position on the same clock        |
| **Steady loop**      | a state that moves while it lasts | starts at its boundary                       | starts at its boundary again; it is not played backward                  |
| **Physical process** | a machine that runs on its own    | time goes forward; a mode changes by physics | the same: time goes forward, and the earlier mode comes back by physics  |
| **Slide text**       | the words                         | Slidev (`v-click`)                           | Slidev                                                                   |

Examples in the watch talk (`watches/docs/watch.md`): the fades and the
camera's move and tilt are presentation; the flash is the attention cue; the
diving board's bend and curl, and the edit of its callout's sentence after the
curl, are story animations, and its swing is a steady loop; the watch's
mechanism is a physical process. Text that is part of a story animation runs on
that animation's clock, not on a `v-click`.

**Rule 3: a visual on more than one slide is one element.** It lives in a layer
that stays mounted for the whole talk (`global-bottom.vue` or `global-top.vue`)
and takes its target from each slide. One copy on each slide cannot move
between slides: each copy starts from its own last state, not from what was on
the screen.

**Rule 4: a step animates; a jump does not.** A step is one click, or the next
or the previous slide. Anything else (a reload, a link, the overview, a slide
that is not a neighbour) is a jump, and shows the target at once. A printed
page shows its click's target, posed.

## Validation: fast smoke navigation

Full validation runs `tools/smokecheck.py` on the built deck.
Quick validation has no browser walk.
The smoke check blocks outside requests and walks forward through each slide and click.
It checks startup, page errors, each declared next position, and the declared final position.
It rejects navigation stalls and walks that exceed their limit.
It does not wait for animations or compare their settled states.

The Ledger theme supplies `window.slideNavigation()` from
`themes/ledger/setup/root.ts`. It returns the current slide and click,
the current slide's click total, the last slide, and the next position.
These values come from Slidev navigation. The smoke tool uses them to detect early stops.
The observation periods and deadlines are in `tools/smokecheck.py`.
Use `--browser firefox` for a Firefox smoke walk.

## Diagnostic: exhaustive navigation

Run `tools/navcheck.py` only when an actual navigation problem is found or suspected.
No validation mode runs it. Do not run it routinely, including before commits
or after ordinary navigation changes.

The diagnostic walks forward and backward, waits for each animation to settle,
and loads each position directly. With `--offline`, it also runs the original
rapid offline walk with outside requests blocked.
It rejects page errors, startup failures, and incomplete walks.
It also fails if:

- a place after a move differs from the same place loaded directly (rule 0);
- a number jumps outside the range between where it was and where it ends (a
  flash of something that should not show);
- a number covers most of its change by the first frame after the key press
  (a cut where a fade should be).

It reads what the deck reports. A talk with layers defines
`window.slideState()`, which returns:

| Field        | What it holds                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `settled`    | names and numbers that must be the same however the place is reached (a view, a phase)                      |
| `continuous` | numbers that must move without a cut (an opacity, a scale, a tilt). Leave out one that is not on the screen |
| `busy`       | true while a story animation or a camera move runs, so that the check waits for its end                     |

Without `--offline`, a deck without `slideState` passes with a note.
With `--offline`, it receives the ordinary offline walk.
Only headless screen wake-lock acquisition is stubbed; page errors still fail.
Give each new layer its fields in the talk's `slideState`, in the same change as the layer.
The watch talk's is `watches/watch/slide-state.ts`.

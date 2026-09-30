# A flexing ruler on slide 2

Request: a 12" metal ruler as an SVG in the talk's illustration style. It is
face-on, and it is about as wide as the balance wheel on slide 2. On a click it
turns 90° about its long axis to edge-on, and a block like the hairspring stud
clamps its left end. A hand pulls the right end down and lets go. The right end
then oscillates at constant amplitude. The hairspring fades out and the ruler
fades in.

## Choices

**How the motion is made.**

| option                                        | pro                                                                                | con                                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A. SVG with SMIL, timeline driven by a page   | one file that `artcheck`, `barroom`, `motion` can check; exact click sync and undo | 85 KB (110 sampled frames of a path); a small Vue component must own the clock        |
| B. SVG with SMIL, plays on load in an `<img>` | no code                                                                            | cannot start on a click or go back; it would run before the slide is shown             |
| C. Draw it in the WebGL scene                 | one renderer                                                                       | the request says SVG; a 2D side view gains nothing from 3D; the scene has no beam yet  |

Chosen: A. 85 KB is small next to the deck's fonts.

**The bent shape.** A small-deflection cubic stretches the ruler. Instead the
centre line has constant length, and its angle along the ruler is the slope of
the first vibration mode of a beam fixed at one end, scaled by the angle at the
free end (26°). The pull uses the same shape as the swing, so the release has no
jump. The swing is $\theta(t) = \theta_0 \cos(2\pi t / T)$, $T = 1.5$ s: no loss.
A real 12" ruler is faster (about 3 Hz); 1.5 s is slow enough to see from the
back row and is close to the balance's 2 s.

**The turn.** The ruler is drawn as its face (height $h \cos\varphi + \ldots$) and
its lower edge (thickness $t \sin\varphi$), exactly as an orthographic view of a
box. At $\varphi = 90°$ only the edge is left. The edge is 8 px thick, more than
a real ruler's, so that it stays a solid outlined shape at the back row.

**The size.** "The width of the balance wheel": the wheel's radius is 56 design
units and the hairspring view scales it by $250/56$, so it is 500 px across
(`HAIRSPRING_ZOOM` in `watch/generate.ts`); it is hidden on slide 2, where only
the spring (about 300 px) shows. I used 500 px. **Ask if the spring was meant.**

**The colours.** The ruler is the subject: blue outline and the knockout fill.
The clamp and the hand are what holds and moves it: `#736A60`. The clamp fill is
solid, not a wash, because a wash would show the ruler through it.

**Clicks.** Click 1 (unchanged): the balance settles. Click 2: the watch fades
out (new frontmatter key `watchHide`) and the face-on ruler fades in. Click 3:
the sequence plays once, and the swing goes on for ever. Going back resets it.

## Result

`uv run ../tools/validate.py` passes in `watches/` (18 checks) and in `stem/`.
`tools/artcheck.py` now skips `fill` on `animate`, `animateTransform` and `set`
(`fill="freeze"` is timing). `tools/flexing_ruler.py` and `evidence/` are the
copies from when this was done.

## Reopened 2026-09-30: colours from the theme at run time

Request: every SVG takes its colours from the theme when the page runs, not
from colours built into the file. A slide's `class:` can override the theme's
CSS, and the SVG must follow that slide's colours.

The ruler is inlined in the page (`FlexingRuler.vue`), so CSS custom
properties reach it and cascade from its slide. An SVG in an `<img>` is a
separate document: no page CSS reaches it. So the file must be inlined, and
its paint must come from `var(--palette-…)`.

| option                                                                                                                     | pro                                                                                                                                                                                     | con                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Each mark keeps its palette hex attribute. A `<style>` in the file maps namespaced classes to `var(--palette-role, hex)` | The house tools (`artcheck`, `barroom`, `motion`) read and render the file as before, with the same pixels. Standalone, the fallback is the hex. No change to a shared tool or the theme | Each colour is in the file twice (attribute and fallback). The generator writes both from one table, read from the theme                                                                                             |
| B. The theme maps hex to var with attribute selectors (`svg [stroke="#143c6b"]`)                                           | No change to any SVG                                                                                                                                                                    | Ties the theme's selectors to its own values; it repaints any inline SVG that happens to use that hex; case and short hex forms need more selectors                                                                  |
| C. Only `style="stroke: var(--palette-role, hex)"`, and `artcheck` learns to read `var()` fallbacks                        | Each mark states its colour once                                                                                                                                                        | Changes a house tool that every talk uses; `artcheck`'s inheritance walk and ladder checks read attributes; more work for no visible gain. A CSS `var()` with no fallback, outside the theme, paints the parent's colour |

Chosen: A. The generator reads the four ink values from the theme that the
talk links (`node_modules/slidev-theme-ledger/styles/ledger.css`), so
`--check` fails if the theme's values change and the file was not written
again.

**A conflict.** `tools/palette.py` failed if a slide declared a
`--palette-*` variable ("only the theme sets the palette"). So no slide could
use the override this change supports. The user decided to relax the rule.

| option                                                                                              | pro                                                                                                                                                                                | con                                                                                                                           |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1. Delete the check                                                                                 | Least code                                                                                                                                                                         | A talk can replace the palette for every slide (`:root`, `.slidev-layout`) with no gate measured                              |
| 2. Allow a declaration only in a `.slidev-layout.<class>` rule; measure each such palette's gates   | Slidev puts `class:` on `.slidev-layout`, so the selector is exactly "these slides". A global override still fails. An override that fails contrast or colour-blind gates fails | About 110 lines in `lib.py` and `palette.py`; a CSS reader built from regular expressions, not a CSS parser                   |
| 3. Allow any selector in a talk; measure nothing                                                    | Most freedom                                                                                                                                                                       | Same loss as 1 for global rules                                                                                               |

Chosen: 2. `tools/lib.py` (`talk_palette_declarations`) and
`tools/palette.py` (`show_talks`, `show_gates`) are the copies from this
change. `evidence/palette-fixture/` is the test talk, and
`evidence/palette-fixture.txt` is the output. The output shows these results:

- A comment is ignored.
- `:root` and a comma list with `:root` fail, and so does an inline `style=`.
- An unknown role fails, and so does a `var()` value.
- An override with a failing gate fails: `#FFFF00` accent on the panel is
  1.08:1, and `warm` fails accent vs second under colour blindness,
  $\Delta E = 13 < 25$.

In the deck, `class: probe` on slide 2 with
`.slidev-layout.probe { --palette-art-line: #C0451C; }` painted the ruler's
line `rgb(192, 69, 28)`. Slide 1 kept `#143c6b`. `palette.py --talk watches`
passed with that probe, and the probe was then removed.

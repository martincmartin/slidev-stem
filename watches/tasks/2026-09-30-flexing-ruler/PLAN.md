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

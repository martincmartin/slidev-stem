# The art colours: what each one is for

The data: [colour_survey.txt](colour_survey.txt) (every coloured mark in the
four timekeepers, the flexing ruler and the WebGL scene, from
[tools/colour_survey.py](tools/colour_survey.py)), and
[palette_lch.txt](palette_lch.txt) (CIE L\*C\*h and contrast of each colour).
The purpose is guidance for a new theme: what job each colour does, so that a
new theme can fill the same jobs.

## 0. What the house docs already say, and what this adds

The first version of this file was written from the code and the art. It did
not cite `docs/theme.md` or `docs/illustrations.md`, which already hold much of
it. This section is the comparison.

**Already in the docs:**

| Fact                                                                            | Where                                        |
| ------------------------------------------------------------------------------- | -------------------------------------------- |
| The nine theme variables, including `--palette-art-line` and `--palette-art-knockout` | `theme.md`, the top block               |
| The four art colours and their jobs: primary line work (also a faint fill), secondary structure, tertiary detail at 0.5, knockout (a pale face that reads as lit) | `illustrations.md`, "Palette" |
| Their contrast on the panel: 9.60, 4.58, 13.10, 1.20                             | `illustrations.md`, "Palette"                |
| art-line is the accent deepened along its hue, 5.56:1 to 9.60:1. "An accent is not a line colour." | `illustrations.md`                 |
| The subject at 0.60–1.0; the thing that holds it at 0.07–0.18; washes           | `illustrations.md`                           |
| Measure every mark on the panel, not the background                             | `theme.md`, "How to use it"                  |
| The accent is the thing to look at; `second` is for the turn, not decoration    | `theme.md`, "How to use it"                  |
| At least 1.4× lightness between same-hue marks that touch                       | `theme.md`, "Two marks of the same hue"      |
| How to test a new colour (`tools/palette.py`), and "reuse a role" first         | `theme.md`, "Adding a colour"                |
| The WebGL inks `line`, `frame`, `detail`, `knockout` and their variables        | `webgl.md`, "The house style in 3D"          |

**New in this survey:**

- The two families: the subject (the accent's hue: a dark line and a pale
  face) and not-the-subject (the warm neutrals). The docs give four jobs in a
  ranked list (primary, secondary, tertiary, knockout), not families.
- The art's muted and ink are the theme's text colours `muted` and `ink`, not
  colours of their own. The docs imply it (the variable names) but do not say
  what it means for a new theme: the text colours must also work as art.
- art-knockout has the border's lightness (L\* 87.3 against 86.9), and a hue
  30° from the accent's. No doc or task says how it was chosen.
- Each colour's uses in the WebGL watch and the flexing ruler. The docs'
  examples are the timekeepers.
- Where the art does not follow the docs (section 5).
- A conflict for the flash: `theme.md` gives "look at this" to the accent, but
  the flash must use `second` (PLAN.md, "A conflict with `docs/theme.md`").

## 1. Where each colour is used

| Colour                  | Timekeepers (SVG)                                                                                                                                                                                                      | Flexing ruler (SVG)                  | Watch (WebGL)                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `#143C6B` art-line      | The subject's outline: the vessels, the glass, the candle, the dial, the gnomon. The thing that moves: sand 0.85, water 0.60 and 0.78, the flame and the shadow solid, the stream, the drips. Washes: dial 0.07, wax 0.08. Hour bands 0.55, hour ring 0.45. | The ruler's outline                  | Every outline of the mechanism (wheels, balance, spring, fork, stud, pivot). Hand outlines. Hour marks (4 px). Solid fill of the small dark parts: the impulse jewel, the seconds hand. |
| `#736A60` muted         | What holds the subject: the hourglass frame, the candle holder, the sundial's base (with a 0.18 wash). One outside agent: the candle's draughts.                                                                           | The clamp's outline; the hand        | The case, lugs, strap and crown (outline, and a 0.18 wash). The chapter ring's edges. The hands' fill.            |
| `#2A2520` ink           | Scales: the sundial's hour ticks (0.5), the water clock's marks (0.5). Small detail: the wick (solid), the inner flame (0.7).                                                                                               | The graduations (0.6)                | The minute ticks (0.5, 2 px)                                                                                     |
| `#D3DCE3` art-knockout  | The gnomon's face (1 use)                                                                                                                                                                                               | The ruler's face, the clamp's face   | The face of every solid part: wheels, balance, spring, stud, fork, pivot, chapter ring                            |
| Paper                   | The card: `--palette-panel` `#F2EEE4`                                                                                                                                                                                  | The slide: `--palette-background`    | The slide: `--palette-background` `#FAF7F0`. Each wash is an ink over it.                                         |

## 2. How they relate to the theme

| Art colour     | Theme colour       | L\*  | C\*  | h°  | On panel | Relation                                                                              |
| -------------- | ------------------ | ---: | ---: | --: | -------: | ------------------------------------------------------------------------------------- |
| art-line       | accent `#1F5FA8`   | 25.1 | 31.7 | 278 |   9.60:1 | The accent's hue (279°), darker (L\* 40 to 25). A 3 px line needs more contrast than a 37 px numeral. |
| art-knockout   | (none)             | 87.3 |  4.8 | 249 |   1.20:1 | Near neutral, a little cool. Its lightness is the border's (L\* 86.9, 1.21:1). The theme task has no derivation for it. |
| muted          | muted `#736A60`    | 45.4 |  7.1 |  76 |   4.58:1 | The same colour as the caption text                                                   |
| ink            | ink `#2A2520`      | 15.1 |  4.4 |  73 |  13.10:1 | The same colour as the body text                                                      |
| (flash line)   | second `#9A6238`   | 46.8 | 37.7 |  61 |   4.34:1 | Not used in art yet                                                                   |
| (flash fill)   | (C1: `#E6D8CA`)    | 87.1 |  9.0 |  74 |   1.21:1 | Proposed: the second's pale face, at the knockout's lightness                          |

The theme colours that the art does not use: the accent itself, the second
(until now), the panel (except as the cards' paper) and the border.

## 3. The semantic roles

The four colours form two families, and each family has a dark colour and a
pale colour:

| Family                                       | Dark: the line                                       | Pale: the face                                               |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| **The subject** (the accent's hue)           | art-line: the subject's structure, and what moves    | art-knockout: an opaque, lit face that hides what is behind  |
| **Not the subject** (the warm neutrals)      | ink: scales and fine detail, at half opacity         | muted: what holds or acts on the subject; its 0.18 wash is the context's face |
| **Look here now** (the second's hue: proposed) | second: the flashed line                           | pale second: the flashed face                                |

Written as jobs:

1. **Subject line** (art-line). The thing the slide is about: its structure,
   and the part that moves. It is the darkest chromatic colour. It carries the
   motion, so a substance is drawn in it at 0.60 or more.
2. **Lit face** (art-knockout). An opaque fill that makes a part read as solid
   metal, not a wire. It must be just darker than the paper (1.2:1): enough to
   show a face, not enough to compete with a line.
3. **Context** (muted). What holds, contains or acts on the subject: a stand, a
   case, a clamp, a hand, a draught. As a line, and as a 0.18 wash for its face.
4. **Scale and detail** (ink). Marks that measure (ticks, graduations) and very
   small detail. At about half opacity, so it reads as darker than muted but
   stays behind the subject.
5. **Paper.** The surface that the art is on: the panel for a card, the
   background for a full slide.
6. **Attention** (second, proposed). For a short time only: "look at this
   part". It is not a permanent colour of any drawing.

## 4. Guidance for a new theme

To make the art colours of a new theme from its text colours:

| Art job          | Make it from                         | Rule                                                                                             |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Subject line     | the accent                           | Keep the hue and the chroma. Darken until it is at least 9.6:1 on the panel (Ledger's value).    |
| Lit face         | the paper, tinted to the accent's hue | Chroma about 5. About 1.2:1 on the panel, the border's lightness. It must not read as bare paper. |
| Context          | muted                                | As it is. It is at least 4.5:1 for text already.                                                 |
| Scale and detail | ink                                  | As it is, at 0.5.                                                                                |
| Flash line       | second                               | As it is. It must differ from the subject line in hue: Ledger's is dE 69.                        |
| Flash face       | second, over the paper                | The lit face's lightness in the second's hue. The flash line on it must hold 3:1.                |

## 5. Things that do not fit the pattern

These are data, not decisions. Each could be a rule, or an exception to fix:

- **The hands are filled muted**, with art-line outlines. They mix the two
  families. In a talk about the mechanism, the hands are context, so the fill
  fits. The outline does not.
- **Muted is also an outside agent** (the candle's draughts, the ruler's hand),
  not only a holder. The job "what acts on the subject" covers it.
- **Ink's opacity varies:** 0.5 (ticks), 0.6 (ruler graduations), 0.7 (inner
  flame), 1.0 (wick). `docs/illustrations.md` says "usually 0.5".
- **The candle's drips are filled at 0.35**, below the subject rule of 0.60.
  Their solid outline carries them.
- **The paper is not one colour.** Cards are on the panel; the watch and the
  ruler are on the background. The panel is 1.08:1 darker, so every gate is
  measured on the panel, which is the harder case.
- **Art-knockout's hue is 30° from the accent's** (249° against 279°). At
  chroma 4.8 the difference is hard to see. We do not know if it is deliberate.

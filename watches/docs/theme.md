# Theme — Ledger

Warm cream, deep blue, warm brown. Chosen 2026-09-19 out of 23 candidates.

```
--tk-background  #FAF7F0    the slide field
--tk-ink         #2A2520    body text, headings
--tk-muted       #736A60    captions, units, dates, secondary text
--tk-accent      #1F5FA8    the one emphasised thing
--tk-second      #9A6238    the warm counterpart: the catch, the warning
--tk-panel       #F2EEE4    card fill
--tk-border      #E0D9CA    card edge
```

`python3 tools/palette.py` prints these with every gate measured. Run it if you
change one.

## How to use it

**Give the slide `class: tk-slide`, and use the variables, not literals.** The
seven values are set once, on the `.tk-slide` class in
[`styles/index.css`](../styles/index.css). Components read `var(--tk-ink)` and so
on, so the class themes everything on the slide. The same seven values are in
`LEDGER` in `tools/lib.py`, under the same names, because that is what
`palette.py` measures. **If you change a colour, change it in both places.**
`python3 tools/palette.py` fails if the two differ. It also fails if a slide,
page or component declares a `--tk-*` variable itself. [slide-patterns.md](slide-patterns.md) shows a slide
that uses the class.

**One accent per slide.** The accent is not "the blue one", it is _the thing you
want them to look at_. A slide with four accented spans has none. The 37 px stat
number on a timekeeper card is the canonical use: one number, one colour, nothing
else competing.

**`second` is for the turn, not for decoration.** On the cards it carries the
problem line — "Freezes in winter", "Someone must flip it". It is the warm colour
because the point it makes is a warm one: here is the catch. Using it as a second
decorative accent wastes it.

**Measure a mark against the surface it lands on.** Text on a card sits on
`--tk-panel` (`#F2EEE4`), not on `--tk-background` (`#FAF7F0`). The two differ by
enough to move a gate: `muted` is 4.96:1 on the background and 4.58:1 on the panel.
Every gate below is stated against the panel for that reason — it is the harder of
the two and the one that actually applies.

## The gates

| check                   | against | threshold | Ledger    | why                                                 |
| ----------------------- | ------- | --------- | --------- | --------------------------------------------------- |
| ink                     | panel   | ≥ 12:1    | **13.10** | headroom to degrade from                            |
| accent                  | panel   | ≥ 4.5:1   | **5.56**  | the 37 px stat number                               |
| second                  | panel   | ≥ 3.5:1   | **4.34**  | 20 px bold is large text: the 3:1 floor plus margin |
| muted                   | panel   | ≥ 4.5:1   | **4.58**  | 17 px body is normal text, so WCAG AA applies       |
| accent vs **ink**       | —       | ≥ ΔE76 35 | **55**    | emphasis has to read as emphasis                    |
| accent vs second        | —       | ≥ ΔE76 25 | **75**    | under deuteranopia _and_ protanopia                 |
| accent/second lightness | —       | ≥ 1.4×    | 1.28× ⚠   | hue fails before lightness does                     |

**Two of those rows need reading carefully.**

**`muted` has almost no margin: 4.58 against a gate of 4.5, 1.7%.** It is the
thinnest thing in the palette and the first text colour to fail as a room brightens
(`Fmax 0.156` — it drops below 3:1 at about 16% ambient flare). Practical rule:
**never shrink muted text below 17 px, and never put muted on `--tk-border` or on
another muted-adjacent surface** — muted on border is 3.78:1, which is below the
gate for body text. If a caption needs to be smaller, make it ink, not muted.

> The theme archive states this gate as ≥ 4.6, which Ledger fails by 0.02, and
> gives no derivation for 4.6. The number enforced here is 4.5 because that is
> WCAG AA for normal text and 17 px is normal text — the large-text relaxation
> starts at 18 px, or 14 px bold. The margin is genuinely thin either way, which
> is the part that matters.

**The accent/second lightness ratio is 1.28× against a preferred 1.4×, and this is
a known, accepted cost of a light field.** On a light background both the accent
and the second must be dark to have contrast, so they land at similar lightness and
have to separate by hue. Ledger's ΔE 75 says they separate very well for normal and
colour-deficient vision alike — but hue is what desaturates first in a washed-out
room. If the venue turns out bright, this is where it shows.

## Two marks of the same hue need a lightness gap

The accent/second row above is one case of a rule that applies wherever two marks of
the same hue meet: **hue separation fails before lightness separation does**, so two
same-hue marks that differ only in saturation or opacity merge as a room brightens —
and merge immediately at any distance if the gap is small.

> **≥ 1.4× lightness separation** between same-hue marks that sit inside, against or
> next to each other.

The illustrations hit this directly: the water in the water clock is the same
`#143C6B` as the vessel outline holding it, so it is bracketed from _both_ sides —
dark enough to clear 3:1 against the panel, light enough to stay 1.4× off the
outline. [illustrations.md](illustrations.md) has the worked window. The same check
applies to a chart with two shades of the accent, or a diagram with a highlighted
sub-part in a tint of its parent.

```bash
python3 tools/palette.py "#6D839B"   # reports lightness ratio against every role
```

## Adding a colour

The usual right answer is **reuse a role**. Seven is already more than most slides
need, and a chart with a fifth series is usually a chart that should be two charts.

When you genuinely need one — a diagram with more parts than roles, a third series —
run it through the measurement before you commit:

```bash
python3 tools/palette.py "#C0451C"           # every surface, every neighbour
python3 tools/palette.py "#C0451C" accent    # ... and against one role's gates
```

It reports contrast against every surface, ΔE against every existing mark, the
colour-blind separation, and the flare headroom. **Do not eyeball colour-blind
risk.** Hand estimates in the theme archive were wrong in both directions: they
called two safe pairs dangerous and the two worst pairs safe.

Three traps worth knowing before you pick:

- **A warm accent beside a green is a colour-blind trap**, and its severity scales
  with the warm colour's saturation. A soft apricot cannot hold a green at all. A
  saturated caramel can. Blue secondaries have no such constraint.
- **Red-green deficiency shifts red toward grey**, so grey-plus-burgundy is the
  hardest common pairing — those two actively converge for those viewers. It works
  only with a large deliberate lightness gap.
- **A mid-lightness saturated field is the worst of both worlds.** It is neither a
  good light nor a good dark. The deck's first field, `#1B44A6`, capped white at
  8.7:1 — it gave away 40% of the available contrast before any other colour was
  chosen.

## Pasted content, which is why Ledger won

Code blocks, matplotlib charts, screenshots, papers and wiki diagrams are
overwhelmingly light-background. A light deck absorbs them; a dark deck turns every
one into a glaring white rectangle aimed at the audience. The seam is arithmetically
symmetric — a white paste against a dark deck and a dark photo against Ledger both
seam at 17:1 — but the _frequency_ is not, and a bright rectangle in a dim room is
worse than a dark one in a lit room.

**This is the single reason Ledger won, and the reason that would flip it.** If this
forum turns out to be photo-led rather than code-and-chart-led, the dark candidate
(Beacon, `#0F1C33` navy / `#FFC24E` gold) wins outright.

Two practical consequences:

- **Shiki's code theme is deck-level, not slide-level.** A code block renders light
  regardless of the slide's palette. On Ledger that is a 1.0:1 seam — invisible,
  which is the point. If anyone ever proposes going dark, this is a config
  dependency a guest presenter could undo without noticing.
- **A house frame for pasted images** — padded, rounded, slightly tinted — would
  blunt the seam for whichever theme is chosen. Never implemented; still a good idea.

## Do not go dark without re-reading this

Dark was explored properly: four candidate dark themes were built, measured and
probed on real rendered pixels (`tasks/2026-09-20-animation-style/README.md` §7,
§8.5). The finding that surprises people is that **ambient flare does not punish
dark themes** — measured unclipped, the dark candidate is ahead of Ledger at every
flare level. So "keep it light because the room might be bright" is folklore and the
arithmetic does not support it.

Ledger is light for the pasted-content reason above, and for that reason only.

There is one standing exception, and it is recommended rather than forbidden: **one
full-bleed dark slide at the narrative pivot.** A dark _card_ punched into a light
slide reads as a rendering error, especially under flare, which is why the dark
drawing sets were ranked down. A dark _slide_ just reads as a dark slide. The deck
has no narrative pivot yet; when it does, that beat is waiting.

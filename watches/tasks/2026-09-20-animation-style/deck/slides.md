---
theme: seriph
title: Drawing-set style exploration — archive deck (2026-09-20)
layout: full
class: archive-cover

# Every card visible at once: this deck exists to be COMPARED, not presented.
# The live deck's copy of slide 19 sets this true, so the cards arrive one click
# at a time there.
revealCards: false
---

# Drawing-set style exploration

<div class="lede">

**A frozen archive deck**, and the live talk renders none of it — that is the point:
this keeps working however far the deck in `slidev/stem/watches/` moves on.
The reasoning is in **`tasks/2026-09-20-animation-style/README.md`**: §8 ranks the
sets, §13 carries them to a different subject, §14 is the decision.

**Chosen: set 2, "Line, weighted"** — which §8.3 ranks 6th. The only evidence here
that came from outside my own head is that somebody liked the look of it (§8.7).

</div>

<div class="idx">

| slides    | what                                                                   |
| --------- | ---------------------------------------------------------------------- |
| **2**     | the sixteen sets, and how to read them                                 |
| **3–18**  | one set each: drawn large, then at the 122 px the deck really renders  |
| **19**    | the real slide, as the live deck had it — set 1, plus the sundial clip |
| **20–35** | that same slide sixteen times, one set each, nothing naming which      |
| **36**    | the dark-field question                                                |
| **37–40** | four candidate dark themes, probed                                     |

</div>

<style>
.archive-cover {
  background: #faf7f0;
  color: #2a2520;
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 44px 60px 30px;
}
.archive-cover h1 {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 40px;
  line-height: 1.05;
  margin: 0 0 14px;
}
.archive-cover .lede {
  font-size: 15px;
  line-height: 1.45;
  max-width: 880px;
}
.archive-cover .lede p {
  margin: 0 0 8px;
}
.archive-cover strong {
  color: #143c6b;
}
.archive-cover code {
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 13px;
  background: #f2eee4;
  padding: 1px 4px;
  border-radius: 3px;
}
.archive-cover .idx table {
  font-size: 14px;
  border-collapse: collapse;
  margin-top: 10px;
}
.archive-cover .idx th {
  text-align: left;
  color: #736a60;
  font-weight: 500;
}
.archive-cover .idx td,
.archive-cover .idx th {
  padding: 2px 26px 2px 0;
  border: none;
}
</style>

---
layout: full
class: ss-slide
---

# Sixteen drawing sets

Same four subjects, same 240x190 box, same Ledger field. Some vary one axis,
rendering fidelity; others vary annotation, shading model, mark-making
and palette. Judge them on the **bottom row**: that is the 122 px the deck really renders, and on a 1080p
projector filling ~2 m, one Slidev CSS px subtends about 1.2 arcmin at a 6 m
back row — roughly the acuity limit. Anything below 2 CSS px at full contrast
is decoration for the front three rows only.

<style>
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 52px 65px 36px;
}
.ss-slide h1 {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
}
.ss-slide strong { color: var(--tk-accent); }
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="1"
  title="Line"
  dir="t13"
  weight="9.1 KB"
  note="The set the deck uses today. Contours are 3 units — 1.5 CSS px once the card shrinks it to 122 px — and the tick marks are 2 units at 0.5 opacity, which lands near 1 CSS px at half contrast: gone from the back row. Cheapest to draw, cheapest to change."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the five sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="2"
  title="Line, weighted"
  dir="line-weighted"
  weight="9.1 KB"
  note="The same drawing as set 1, with its three measured deficits fixed and nothing else touched. Line work goes from the theme accent (5.56:1 on the card) to a deeper blue of the same hue (9.6:1); the invented grey #928E88 — in no palette, and only 2.34:1 where the sundial's ticks sit on the dial face — becomes Ledger's own muted; strokes double to 3.05 CSS px, clearing the 1.64 px an eye resolves at the back row. Still blue-led, still sparse, same geometry. Contrast held at the back row goes from 2.27:1 to 3.70:1."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the five sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="3"
  title="Engraved"
  dir="engraved"
  weight="14.1 KB"
  note="Tone carried by hatching rather than fill. The individual strokes are 1.4 units and do disappear at 122 px — but they disappear into grey, not into nothing, so the shading survives the projector even when the lines don't. Right period for the subject; ink-only, so it ignores the palette."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the five sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="4"
  title="Patent"
  dir="patent"
  weight="12.6 KB"
  note="After the clarity of a technical drawing, not after being recognisable as a patent drawing. Line-weight hierarchy - 2.5 outline, 1.5 interior, 1.0 detail - with 45-degree section hatching and stipple standing in for tone. No reference numerals, no leader lines, no dot terminators: removing them is a deliberate choice, and it is what keeps this an engineering elevation rather than a pastiche. Everything here is drawn below the 1.64 CSS px the back row resolves, which is what set 5 repairs."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="5"
  title="Patent, weighted"
  dir="patent-weighted"
  weight="13.2 KB"
  note="Set 4 with every deficit repaired and nothing else changed - the name says what the repair was. The palette needed nothing: it was already pure ink, the same ink Bold and Linocut win with. Nothing in set 4 reached the 1.64 CSS px the back row resolves; its heaviest line was 1.27. Rather than scale the weights (tripling them measures best and reads like Bold), the span is remapped to 1.73-3.56 CSS px, so the whole hierarchy clears the floor and the top stays lighter than Bold. The 45-degree section hatch goes from 0.51 px of ink - which dissolves to nothing - to 1.12, which dissolves to grey. Contrast held at the back row goes from 2.14:1 to 6.03:1. Like set 4, it carries no reference numerals or leader lines, by choice; a brief version that drew them measured worse on all three scores, because a leader was the thinnest line in the set."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="6"
  title="Guide on paper"
  dir="guide-ledger"
  weight="12.8 KB"
  note="The same drawings as Set 15, recoloured for a light field — and that is not the dark palette with hues swapped. Prominence inverts: on black the brightest mark dominates, on cream the darkest does, so the roles are re-ranked. Structure becomes ink, the substance a brown hatch, and the hot core becomes unmarked paper, which is how engraving has always drawn a highlight. It gives up the emissive quality and keeps the stripe hatching and opaque interiors."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the sets are judged against
   the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="7"
  title="Vector on paper"
  dir="vector-ledger"
  weight="15.5 KB"
  note="Set 16 on this light field: blue thin-line work on cream, which is what a pen plotter actually produced. The stacked contours survive intact. The cost is hierarchy — structure over construction is 1.21x here against 1.88x on a dark field, because a light field leaves almost no room below the ink. Under 35% ambient flare, though, its weakest role holds 2.25:1 where the dark themes fall to 1.66."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the sets are judged against
   the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="8"
  title="Bold"
  dir="bold"
  weight="7.8 KB"
  note="Nothing thinner than 5 units, nothing below full opacity, three flat colours. Every mark clears the 2 CSS px floor even at 122 px. It buys legibility and spends detail: the water clock's graduations had to move outside the vessel to survive, and the hour lines became seven notches."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the five sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="9"
  title="Linocut"
  dir="linocut"
  weight="12.2 KB"
  note="Two blocks with the colour block deliberately 2-3 units off-register, and every mark a gouge: the wobble is generated from a seeded jitter, not drawn by hand. Keeps Engraved's relief-print register, but nothing is thinner than 4 units, so unlike the engraving it arrives at the back row intact."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="10"
  title="Riso"
  dir="riso"
  weight="13.9 KB"
  note="Two ink passes - accent blue and second brown - with the brown deliberately off-register by 2.6 units and both set to mix-blend-mode multiply, so every overlap prints a third colour the palette never declared. Tone is halftone coverage and nothing else: 2*pi*r squared over a 5-unit staggered tile gives the 77 / 53 / 30 percent screens. The one set that needs an opaque paper bed, because multiply has to have something to multiply against."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="11"
  title="Pop Art"
  dir="popart"
  weight="12.9 KB"
  note="Comic-panel grammar in the deck's own palette: flat fills, one uniform 5-unit ink contour, and Ben Day dots carrying every gradation - the dot pitch IS the tone ramp, so the set contains no gradient at all. The two tints are Ledger's accent and second composited over the cream field, so every fill traces back to the theme rather than to primary red and yellow."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="12"
  title="Ciechanowski"
  dir="ciechanowski"
  weight="10.8 KB"
  note="Built from his actual shader, not from a screenshot. ciechanow.ski is hand-written WebGL with no 3D library, and its one lit shader is c.rgb *= (0.75 + 0.25 * max(0.0, n_dir.z)): a flat colour per part, scaled only by how much the surface faces you. Nothing ever goes below 75% of base, and there are no lights, shadows, textures or outlines anywhere. That 25% range is the entire look."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="13"
  title="Shaded"
  dir="shaded"
  weight="12.9 KB"
  note="Gradients for volume, one soft shadow for depth, hue for material — slate and bronze, terracotta and water, wax and brass, wood and sand. Silhouettes stay as heavy as Bold, so it reads from the back row and still rewards the front row. 1.8x Line's bytes."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the five sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="14"
  title="Photoreal"
  dir="photoreal"
  weight="24.3 KB"
  note="feTurbulence supplies real stone mottle, clay grain, walnut figure and sand grit — the one thing flat vector work cannot fake. It costs the palette (materials bring their own colours), 2.7x the bytes, and most of what it adds is invisible at 122 px. Filters are kept off the animated elements, so the texture stays cached instead of re-rendering each frame."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the five sets are judged
   against the background they will actually sit on. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="15"
  title="Guide"
  dir="guide"
  weight="13.0 KB"
  note="No computer touched the 1981 BBC Hitchhiker's Guide graphics: Rod Lord's team drew them on cels, backed the colour with gels and shot them backlit. So this copies the grammar, not the decade — green line-work on black, interiors empty, tone from stripe hatching, volumes as wireframe not shading. Marks run 5.3:1 (the flame's red) to 19.8:1 (cream) on the field, against 6.0:1 for the Ledger accent. The cost: a black panel holes the cream slide."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the sets are judged against
   the background they will actually sit on — which this one fights hardest. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: ss-slide
---

<StyleSet
  :n="16"
  title="Vector display"
  dir="vector"
  weight="15.7 KB"
  note="Not the Guide's cousin but its opposite: the Death Star briefing and the X-wing targeting computer. Volumes are stacked cross-sections — near halves only, since the original's see-through cage reads as clutter this small — over a 12% wash, in desaturated steel blue with red for whatever moves. Its defining feature is also its cost: hairlines. Primary strokes are 1.83 CSS px at 122 px, construction lines 1.12, both under the 2 px floor."
/>

<style>
/* Ledger, matching the live timekeeper slide, so the sets are judged against
   the background they will actually sit on — which this one fights hardest. */
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 40px 56px 26px;
}
</style>

---
layout: full
class: tk-slide tk-t13
---

<script setup>
import { useSlideContext } from '@slidev/client'
// The revealCards flag from the headmatter at the top of this file.
const reveal = useSlideContext().$slidev.configs.revealCards
</script>

<div class="tk-title">Before clocks, time was a flow</div>

<!-- `reveal` is the headmatter's revealCards flag. When false, v-click="false"
     makes each directive a no-op, so every card is visible from the start and
     the slide consumes no clicks. -->
<div class="tk-grid">
  <TimekeeperCard
    v-click="reveal && 1" :dim="reveal && $clicks > 1 && $clicks < 5"
    name="Sundial" date="c. 1500 BCE"
    img="/timekeepers/sundial-timelapse.jpg"
    video="/timekeepers/sundial-timelapse.mp4"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t13/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t13/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t13/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<style>
.tk-slide.tk-t13 {
  /* ---- Ledger: blue + brown on warm cream ---- */
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-takeaway span { color: var(--tk-accent); }

</style>

<!--
Before clocks, people told time by watching something flow.

[click] Sundials go back to about 1500 BCE, and a good one reads to within a few minutes. But no sun, no time. And even a perfect one can be off by up to 16 minutes from a steady clock, because the Sun itself doesn't keep steady time.

[click] Water clocks work at night, but they slow down as they drain, and they freeze in winter. The best managed about 15 minutes a day.

[click] Alfred the Great burned four-hour candles, until drafts made them burn out early. How accurate? I couldn't find anyone who measured it.

[click] Hourglass sand flows at a constant rate and doesn't mind a rolling ship. But someone has to flip a half-hour glass 48 times a day.

[click] Every one of these runs at a rate set by the outside world. A clock sets its own. Remember 15 minutes a day: the first mechanical clocks probably didn't beat it.

IF ASKED: Rome's first public sundial was war loot from Sicily; Pliny says Romans followed its wrong hours for 99 years (the latitude explanation is debated). Roman hours were 1/12 of daylight, about 45 min in winter to 75 in summer. Sailors shook the glass to end a watch early: "flogging the glass."
-->

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t13/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t13/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/t13/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/t13/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">1</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/line-weighted/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/line-weighted/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/line-weighted/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/line-weighted/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">2</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/engraved/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/engraved/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/engraved/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/engraved/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">3</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/patent/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/patent/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/patent/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/patent/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">4</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/patent-weighted/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/patent-weighted/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/patent-weighted/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/patent-weighted/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">5</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/guide-ledger/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/guide-ledger/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/guide-ledger/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/guide-ledger/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">6</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/vector-ledger/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/vector-ledger/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/vector-ledger/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/vector-ledger/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">7</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/bold/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/bold/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/bold/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/bold/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">8</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/linocut/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/linocut/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/linocut/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/linocut/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">9</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/riso/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/riso/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/riso/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/riso/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">10</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/popart/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/popart/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/popart/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/popart/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">11</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/ciechanowski/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/ciechanowski/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/ciechanowski/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/ciechanowski/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">12</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/shaded/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/shaded/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/shaded/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/shaded/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">13</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/photoreal/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/photoreal/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/photoreal/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/photoreal/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">14</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/guide/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/guide/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/guide/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/guide/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">15</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: tk-slide tk-compare
---

<!-- Same slide, one drawing set each, nothing naming which. No v-click here:
     omitting it is the always-visible case the revealCards flag produces, so
     the whole slide is up from the start and costs no clicks. The sundial uses
     the set's own drawing rather than the time-lapse, or it would be the one
     card that looked identical on all ten. -->

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/vector/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/vector/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/timekeepers/vector/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/timekeepers/vector/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num">16</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2A2520;
  --tk-muted: #736A60;
  --tk-accent: #1F5FA8;
  --tk-warn: #9A6238;
  --tk-panel: #F2EEE4;
  --tk-border: #E0D9CA;

  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-num {
  position: absolute;
  right: 22px;
  bottom: 14px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 16px;
  color: var(--tk-muted);
}
.tk-takeaway span { color: var(--tk-accent); }
</style>

---
layout: full
class: ss-slide
---

# The dark alternative

Sets 15 and 16 draw on their own black field, so on Ledger they sit at **18.1:1**
against the card panel — a hole, not a card. **Sets 6 and 7** are the same two
recoloured into Ledger's own role colours: the field _becomes_ the panel and the seam
falls to **1.00:1**. That works, and it costs the emissive quality that is the whole
point of both — they read as printed diagrams rather than lit screens.

The other way to close the seam is to move the deck. These four host them natively,
ordered by background: cool navy through to warm brown.

| Theme                   | background      | ink/bg | weakest line | flare@35% | CVD ΔE | watch out for                       |
| ----------------------- | --------------- | ------ | ------------ | --------- | ------ | ----------------------------------- |
| Beacon                  | `#0F1C33`       | 17.0   | 4.8          | 1.66      | 88     | —                                   |
| After-Hours Observatory | `#17202A` ΔE 10 | 14.5   | 4.6          | 1.64      | 90     | —                                   |
| Campfire                | `#241E1A` ΔE 12 | 14.3   | 5.9          | 1.86      | 80     | —                                   |
| Marmalade               | `#2B2420` ΔE 3  | 14.1   | 4.7          | 1.70      | 28     | green second; CVD near the 25 floor |

**The cost is already measured.** Ledger won the theme round for one reason: code,
charts and screenshots are overwhelmingly light-background, and a bright rectangle in a
dim room is worse than a dark one in a lit room. Going dark reopens exactly that, and
Shiki renders code light unless the headmatter overrides it. Ledger is also the better
bet in a badly-lit room: under 35% ambient flare its weakest role holds **2.25:1**
where every candidate here falls to 1.64–1.86.

<style>
.ss-slide {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 30px 56px 18px;
  font-size: 15px;
}
.ss-slide h1 {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 32px;
  margin-bottom: 8px;
}
.ss-slide p { margin: 7px 0; line-height: 1.35; }
/* seriph dims the paragraph after an h1 to opacity 0.5 as a subtitle treatment.
   Here that paragraph carries the headline measurement, so undo it. Note this is
   opacity, not colour -- the colour was always right. */
.ss-slide h1 + p { opacity: 1; }
.ss-slide strong { color: var(--tk-accent); }
.ss-slide table { font-size: 13px; margin: 9px 0; }
.ss-slide th, .ss-slide td { padding: 2px 10px 2px 0; text-align: left; }
.ss-slide thead { border-bottom: 1px solid var(--tk-border); }
.ss-slide code { font-size: 12px; }
</style>

---
layout: full
---

<ThemeProbe
  name="Beacon"
  blurb="navy, gold + sky — the earlier runner-up"
  bg="#0F1C33" panel="#202C41" border="#3A4558"
  ink="#FFFFFF" muted="#9197A1" accent="#FFC24E" second="#8FBEEA"
  guide="guide-beacon" vector="vector-beacon"
  metrics="seam 18.13:1 -> 1.00:1 (the field IS the panel)   ink/bg 17.0:1   weakest line role 4.8:1 (muted)   flare@35% 1.66:1   accent/second CVD dE 88   lightness 1.22x"
/>

---
layout: full
---

<ThemeProbe
  name="After-Hours Observatory"
  blurb="cool charcoal, amber + sky"
  bg="#17202A" panel="#242C35" border="#3F454B"
  ink="#F6F0DF" muted="#94948F" accent="#FFB84D" second="#7FB3E8"
  guide="guide-afterhours" vector="vector-afterhours"
  metrics="seam 18.13:1 -> 1.00:1 (the field IS the panel)   ink/bg 14.5:1   weakest line role 4.6:1 (muted)   flare@35% 1.64:1   accent/second CVD dE 90   lightness 1.28x"
/>

---
layout: full
---

<ThemeProbe
  name="Campfire"
  blurb="warm near-black, amber + cyan"
  bg="#241E1A" panel="#332A24" border="#4A3D34"
  ink="#F6EEE3" muted="#B5A594" accent="#FFB340" second="#54BCD6"
  guide="guide-campfire" vector="vector-campfire"
  metrics="seam 18.13:1 -> 1.00:1 (the field IS the panel)   ink/bg 14.3:1   weakest line role 5.9:1 (muted)   flare@35% 1.86:1   accent/second CVD dE 80   lightness 1.23x"
/>

---
layout: full
---

<ThemeProbe
  name="Marmalade"
  blurb="warm dark brown, amber + green"
  bg="#2B2420" panel="#38302C" border="#514944"
  ink="#FFF4E8" muted="#A49B92" accent="#E8883C" second="#93D096"
  guide="guide-marmalade" vector="vector-marmalade"
  metrics="seam 18.13:1 -> 1.00:1 (the field IS the panel)   ink/bg 14.1:1   weakest line role 4.7:1 (muted)   flare@35% 1.70:1   accent/second CVD dE 28   lightness 1.46x"
/>

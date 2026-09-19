---
theme: seriph
title: What Every Nerd Should Know About Watches

# Reveal the timekeeper cards one click at a time (the real presentation), or
# show every card at once so the themes can be compared at a glance.
# Set back to true once a theme is chosen.
revealCards: false
---

# What Every Nerd Should Know About Watches

Hello, **World!**

<!--
Speaker notes here
-->

---
layout: full
class: tk-slide tk-t7
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t7/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t7/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t7/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t7/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">2 &mdash; Kraft & Ink</div>

<style>
.tk-slide.tk-t7 {
  /* ---- theme 2: Kraft & Ink - manila board, petrol blue, tomato warning ---- */
  --tk-ink: #2B2318;
  --tk-muted: #6B5B46;
  --tk-accent: #14596F;
  --tk-warn: #C0451C;
  --tk-panel: #E5D3B6;
  --tk-border: #CDB48C;

  background: #EFE1CA;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t9
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t9/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t9/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t9/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t9/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">3 &mdash; Campfire</div>

<style>
.tk-slide.tk-t9 {
  /* ---- theme 3: Campfire - espresso dark, amber accent, sky-cyan caveat ---- */
  --tk-ink: #F6EEE3;
  --tk-muted: #B5A594;
  --tk-accent: #FFB340;
  --tk-warn: #54BCD6;
  --tk-panel: #332A24;
  --tk-border: #4A3D34;

  background: #241E1A;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t10
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t10/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t10/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t10/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t10/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">4 &mdash; Harbor</div>

<style>
.tk-slide.tk-t10 {
  /* ---- theme 4: Harbor - deep teal dark, gold accent, sky-blue caveat ---- */
  --tk-ink: #F2EDE3;
  --tk-muted: #A9C2BF;
  --tk-accent: #FFC145;
  --tk-warn: #6FBCE0;
  --tk-panel: #0A2C2F;
  --tk-border: #1E5A5C;

  background: #0E3B3E;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t11
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t11/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t11/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t11/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t11/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">5 &mdash; Letterpress</div>

<style>
.tk-slide.tk-t11 {
  /* ---- theme 5: Letterpress - warm white paper, vermillion accent, petrol caveat ---- */
  --tk-ink: #221C16;
  --tk-muted: #6A5F52;
  --tk-accent: #BE3517;
  --tk-warn: #175F6A;
  --tk-panel: #F5EDE3;
  --tk-border: #E5D7C6;

  background: #FCF8F3;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t12
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t12/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t12/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t12/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t12/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">6 &mdash; Fen</div>

<style>
.tk-slide.tk-t12 {
  /* ---- theme 6: Fen - blue + green, both muted: slate navy and olive ---- */
  --tk-ink: #23272A;
  --tk-muted: #666D75;
  --tk-accent: #175B92;
  --tk-warn: #6E8148;
  --tk-panel: #EFEDE4;
  --tk-border: #DCDACD;

  background: #F7F5EF;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t13/sundial.svg"
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

<div class="tk-swatch">7 &mdash; Ledger</div>

<style>
.tk-slide.tk-t13 {
  /* ---- theme 7: Ledger - blue + brown on warm cream ---- */
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
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t16
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t16/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t16/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t16/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t16/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">8 &mdash; Ash & Claret</div>

<style>
.tk-slide.tk-t16 {
  /* ---- theme 8: Ash & Claret - grey + burgundy, burgundy carries the emphasis ---- */
  --tk-ink: #232024;
  --tk-muted: #6E6870;
  --tk-accent: #6E1F32;
  --tk-warn: #757E86;
  --tk-panel: #EFECEA;
  --tk-border: #DDD8D6;

  background: #F7F5F4;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t17
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t17/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t17/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t17/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t17/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">9 &mdash; Fieldnotes</div>

<style>
.tk-slide.tk-t17 {
  /* ---- theme 9: Fieldnotes - blue + green + brown, earthy three-colour ---- */
  --tk-ink: #2A2A22;
  --tk-muted: #74644C;
  --tk-accent: #1B5D82;
  --tk-warn: #6F7E42;
  --tk-panel: #F0EBDE;
  --tk-border: #DED7C4;

  background: #F8F5EC;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t18
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t18/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t18/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t18/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t18/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">10 &mdash; Registry</div>

<style>
.tk-slide.tk-t18 {
  /* ---- theme 10: Registry - grey + navy + burgundy, scholarly with the saturation pulled down ---- */
  --tk-ink: #212327;
  --tk-muted: #696C72;
  --tk-accent: #184984;
  --tk-warn: #A84455;
  --tk-panel: #EFEEEB;
  --tk-border: #DCDBD7;

  background: #F7F6F4;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t19
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t19/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t19/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t19/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t19/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">11 &mdash; Night Ledger</div>

<style>
.tk-slide.tk-t19 {
  /* ---- theme 11: Night Ledger - blue + brown, both light on a grey-dark field ---- */
  --tk-ink: #E8E6E1;
  --tk-muted: #9A958C;
  --tk-accent: #81B3E4;
  --tk-warn: #B4834F;
  --tk-panel: #26282D;
  --tk-border: #363940;

  background: #1E2024;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t20
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t20/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t20/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t20/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t20/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">12 &mdash; Copper Circuit</div>

<style>
.tk-slide.tk-t20 {
  /* ---- theme 12: Copper Circuit - warm, technical, convivial ---- */
  --tk-ink: #F5EFE4;
  --tk-muted: #9C9A93;
  --tk-accent: #E8864A;
  --tk-warn: #52B7A8;
  --tk-panel: #2D312E;
  --tk-border: #464945;

  background: #202522;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t21
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t21/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t21/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t21/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t21/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">13 &mdash; Golden Hour Lab</div>

<style>
.tk-slide.tk-t21 {
  /* ---- theme 13: Golden Hour Lab - sunny, informal, optimistic ---- */
  --tk-ink: #2E3440;
  --tk-muted: #66686A;
  --tk-accent: #F29D38;
  --tk-warn: #D85C5C;
  --tk-panel: #F2E8D4;
  --tk-border: #D9D1C1;

  background: #FFF4DD;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t22
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t22/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t22/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t22/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t22/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">14 &mdash; Marmalade</div>

<style>
.tk-slide.tk-t22 {
  /* ---- theme 14: Marmalade - cozy, distinctive, nerd-chic ---- */
  --tk-ink: #FFF4E8;
  --tk-muted: #A49B92;
  --tk-accent: #E8883C;
  --tk-warn: #93D096;
  --tk-panel: #38302C;
  --tk-border: #514944;

  background: #2B2420;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t23
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t23/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t23/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t23/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t23/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">15 &mdash; After-Hours Observatory</div>

<style>
.tk-slide.tk-t23 {
  /* ---- theme 15: After-Hours Observatory - science-y without looking corporate ---- */
  --tk-ink: #F6F0DF;
  --tk-muted: #94948F;
  --tk-accent: #FFB84D;
  --tk-warn: #7FB3E8;
  --tk-panel: #242C35;
  --tk-border: #3F454B;

  background: #17202A;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t24
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t24/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t24/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t24/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t24/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">16 &mdash; Neon Aperitif</div>

<style>
.tk-slide.tk-t24 {
  /* ---- theme 16: Neon Aperitif - playful, contemporary, energetic ---- */
  --tk-ink: #FFF7EA;
  --tk-muted: #A29D97;
  --tk-accent: #FF7A59;
  --tk-warn: #56D6E8;
  --tk-panel: #333335;
  --tk-border: #4D4C4C;

  background: #262629;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t25
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t25/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t25/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t25/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t25/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">17 &mdash; Coffee + Code</div>

<style>
.tk-slide.tk-t25 {
  /* ---- theme 17: Coffee + Code - very warm, relaxed, cafe friendly ---- */
  --tk-ink: #FFF5E6;
  --tk-muted: #B3A79C;
  --tk-accent: #E9A23B;
  --tk-warn: #83BE8A;
  --tk-panel: #473934;
  --tk-border: #5E514B;

  background: #3B2D29;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t26
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t26/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t26/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t26/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t26/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">18 &mdash; Retro Future Lounge</div>

<style>
.tk-slide.tk-t26 {
  /* ---- theme 18: Retro Future Lounge - 1960s science optimism meets cocktail bar ---- */
  --tk-ink: #FFF1D6;
  --tk-muted: #A3A093;
  --tk-accent: #FF8F4F;
  --tk-warn: #3E9A9B;
  --tk-panel: #2C373C;
  --tk-border: #464F50;

  background: #1E2B32;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t27
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t27/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t27/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t27/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t27/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">19 &mdash; Electric Terracotta</div>

<style>
.tk-slide.tk-t27 {
  /* ---- theme 19: Electric Terracotta - earthy but intellectually lively ---- */
  --tk-ink: #302D36;
  --tk-muted: #655F62;
  --tk-accent: #C95C3F;
  --tk-warn: #5252A3;
  --tk-panel: #EADCCE;
  --tk-border: #D2C6BB;

  background: #F6E7D8;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t28
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t28/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t28/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t28/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t28/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">20 &mdash; Atomic Cocktail</div>

<style>
.tk-slide.tk-t28 {
  /* ---- theme 20: Atomic Cocktail - mid-century, social, memorable ---- */
  --tk-ink: #FFF0D3;
  --tk-muted: #AEB19D;
  --tk-accent: #F6B44C;
  --tk-warn: #6FBCE0;
  --tk-panel: #254643;
  --tk-border: #415C56;

  background: #173B3A;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t29
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t29/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t29/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t29/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t29/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">21 &mdash; Blackboard Social</div>

<style>
.tk-slide.tk-t29 {
  /* ---- theme 21: Blackboard Social - casual STEM, friendly classroom ---- */
  --tk-ink: #F7F0DE;
  --tk-muted: #A8A89B;
  --tk-accent: #F2A65A;
  --tk-warn: #7AD0DE;
  --tk-panel: #333E38;
  --tk-border: #4C554D;

  background: #26332D;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t30
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t30/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t30/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t30/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t30/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">22 &mdash; Beacon</div>

<style>
.tk-slide.tk-t30 {
  /* ---- theme 22: Beacon - deep navy, gold, sky blue ---- */
  --tk-ink: #FFFFFF;
  --tk-muted: #9197A1;
  --tk-accent: #FFC24E;
  --tk-warn: #8FBEEA;
  --tk-panel: #202C41;
  --tk-border: #3A4558;

  background: #0F1C33;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t31
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t31/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t31/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t31/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t31/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">23 &mdash; Conservatory</div>

<style>
.tk-slide.tk-t31 {
  /* ---- theme 23: Conservatory - navy, gold, green ---- */
  --tk-ink: #FFFFFF;
  --tk-muted: #959CA9;
  --tk-accent: #FFC24E;
  --tk-warn: #93D096;
  --tk-panel: #24334C;
  --tk-border: #3E4B62;

  background: #14243F;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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
class: tk-slide tk-t32
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
    name="Sundial" date="c. 1500 BCE" img="/timekeepers/t32/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="reveal && 2" :dim="reveal && $clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/t32/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="reveal && 3" :dim="reveal && $clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/t32/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="reveal && 4" :dim="reveal && $clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/t32/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="reveal && 5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-swatch">24 &mdash; Blueprint</div>

<style>
.tk-slide.tk-t32 {
  /* ---- theme 24: Blueprint - navy, cyan primary, amber second ---- */
  --tk-ink: #FFFFFF;
  --tk-muted: #9198A3;
  --tk-accent: #5FD0E8;
  --tk-warn: #F5B23C;
  --tk-panel: #212E46;
  --tk-border: #3B465C;

  background: #101E38;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;   /* anchors the candidate label */
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

/* Candidate label - delete with the losing slides. */
.tk-swatch {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tk-muted);
  opacity: 0.7;
}
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

# Escapment - Fall Becomes Tick

Escapement was key innovation. Mostly weight driven.

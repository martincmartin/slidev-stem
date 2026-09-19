---
theme: seriph
title: What Every Nerd Should Know About Watches

# Reveal the timekeeper cards one click at a time. Set false to show them all
# at once, which is handy when comparing layouts or palettes.
revealCards: true
---

# What Every Nerd Should Know About Watches

Hello, **World!**

<!--
Speaker notes here
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

# Escapment - Fall Becomes Tick

Escapement was key innovation. Mostly weight driven.

---
layout: full
---

<!-- Keep this slide last: new content slides go ABOVE this separator, not
     below it. One bullet per borrowed asset: the title linked to where it
     came from, the author, the licence linked to its terms, what you
     changed, and where it is used. Always say what you changed. -->

# Credits

- **[Sun Dial Time Lapse](https://archive.org/details/SunDialTimeLapsenoWatermark)** — NatureClip, 2012 · [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) · cropped, trimmed, sped up 2x · sundial clip, slide 2

Everything else — the water clock, candle and hourglass diagrams — was drawn
for this deck.

<style>
/* Credits are reference, not content: small enough that one borrowed asset
   stays on one line, which is what keeps the list scannable as it grows.
   Still well clear of the size where a line stops being legible at all. */
ul {
  font-size: 14px;
  line-height: 1.7;
}
</style>

<!--
Not spoken. It is here so the deck carries its own attributions: a talk is a
public performance, and the licences we borrow under ask for credit on every
copy performed, not just every copy distributed.
-->

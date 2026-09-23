---
theme: seriph
title: What Every Nerd Should Know About Watches

# Read docs/legibility.md ("The known risk in the current choice") before
# swapping the art for anything else -- in particular, this set tolerates about
# half the room light the top-ranked one does (mean Fmax 0.138 vs 0.254), which
# is a priced risk and not an oversight.
---

# What Every Nerd Should Know About Watches

Hello, **World!**

<!--
Speaker notes here
-->

---
layout: full
class: tk-slide tk-timekeepers
---

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    v-click="1" :dim="$clicks > 1 && $clicks < 5"
    name="Sundial" date="c. 1500 BCE"
    img="/timekeepers/line-weighted/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    v-click="2" :dim="$clicks > 2 && $clicks < 5"
    name="Water clock" date="c. 1400 BCE" img="/timekeepers/line-weighted/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    v-click="3" :dim="$clicks > 3 && $clicks < 5"
    name="Candle" date="9th c. CE" img="/timekeepers/line-weighted/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    v-click="4" :dim="$clicks > 4 && $clicks < 5"
    name="Hourglass" date="by 1338" img="/timekeepers/line-weighted/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div v-click="5" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<style>
/* Colours come from `.tk-slide` in styles/index.css. Layout stays here. */
.tk-slide.tk-timekeepers {
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

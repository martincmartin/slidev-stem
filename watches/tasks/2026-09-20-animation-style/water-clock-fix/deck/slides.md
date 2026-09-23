---
theme: seriph
title: Water clock - fixing the wash
layout: full
class: wc-cover
---

# The water clock animates in marks the back row cannot see

<div class="lede">

The shipped card draws its entire 8-second level change in `fill-opacity="0.18"`
and `"0.32"` - **1.37:1 and 1.80:1** on the panel, against a 3:1 floor. Measured
directly, the level change peaks at **2.34:1** and **not one pixel** of the card
crosses 3:1 between the full and half-drained states. The outline is fine
(`p90 7.71`); the motion is what is lost.

Eight options follow. **Only the water changes** in every one - vessel, spout, drip
and graduations are byte-identical, so this is a controlled comparison. Each is
shown on the real slide, at the size the deck really renders.

</div>

| option           | water                            | hold | Fmax  | dPeak | px2 >=3:1 |
| ---------------- | -------------------------------- | ---- | ----- | ----- | --------- |
| w0-baseline      | `body 0.18 / surface 0.32`       | 2.66 | 0.000 | 2.34  | 0         |
| w1-opaque        | `body 0.60 / surface 0.78`       | 5.39 | 0.201 | 7.59  | 658       |
| w2-surface-line  | `body 0.18 / surface stroked 6u` | 5.05 | 0.183 | 8.46  | 680       |
| w3-contours      | `5 solid 4u arcs, stepped`       | 5.26 | 0.195 | 9.37  | 874       |
| w4-hatched       | `4u lines on 8u pitch`           | 5.57 | 0.209 | 8.51  | 961       |
| w5-line-and-body | `body 0.60 + stroked surface`    | 4.35 | 0.140 | 9.08  | 576       |
| w6-house-rule    | `body 0.85 / surface solid`      | 7.43 | 0.270 | 9.60  | 713       |
| w7-mid-window    | `body 0.65 / surface 0.85`       | 6.37 | 0.239 | 8.43  | 682       |

<div class="foot">

`hold` and `Fmax` at TV 55in @ 7 m, from the live `tools/barroom.py`. `dPeak` and
`px2 >=3:1` describe the level change itself, from `water-clock-fix/tools/motion.py`.
Higher is better in every column.

</div>

<style>
.wc-cover {
  background: #faf7f0;
  color: #2a2520;
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 28px 46px 16px;
}
.wc-cover h1 {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 29px;
  line-height: 1.05;
  margin: 0 0 8px;
  color: #143c6b;
}
.wc-cover .lede { font-size: 13px; line-height: 1.4; max-width: 900px; }
.wc-cover .lede p { margin: 0 0 6px; }
.wc-cover table { font-size: 11px; border-collapse: collapse; margin-top: 4px; }
.wc-cover td, .wc-cover th { padding: 1px 14px 1px 0; border: none; text-align: left; }
.wc-cover th { color: #736a60; font-weight: 500; }
.wc-cover code { font-family: "IBM Plex Mono", monospace; font-size: 10px; }
.wc-cover .foot { font-size: 11px; color: #736a60; margin-top: 6px; }
</style>

---
layout: full
class: tk-slide tk-compare
---

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/tk/sundial.svg"
    stat="&#177;16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/wc/w0-baseline.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/tk/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/tk/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num"><b>w0-baseline</b> &nbsp; body 0.18 / surface 0.32<br>SHIPPED TODAY - the defect: nothing crosses 3:1 between states<br>hold 2.66 &nbsp; Fmax 0.000 &nbsp; dPeak 2.34</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-warn: #9a6238;
  --tk-panel: #f2eee4;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 46px 65px 44px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}
.tk-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-takeaway span { color: var(--tk-accent); }
.tk-num {
  position: absolute;
  left: 65px;
  right: 65px;
  bottom: 8px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 11px;
  line-height: 1.45;
  color: var(--tk-muted);
}
.tk-num b { color: #143c6b; font-size: 13px; }
</style>

---
layout: full
class: tk-slide tk-compare
---

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/tk/sundial.svg"
    stat="&#177;16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/wc/w1-opaque.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/tk/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/tk/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num"><b>w1-opaque</b> &nbsp; body 0.60 / surface 0.78<br>smallest edit that clears the floor; nothing else changes<br>hold 5.39 &nbsp; Fmax 0.201 &nbsp; dPeak 7.59</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-warn: #9a6238;
  --tk-panel: #f2eee4;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 46px 65px 44px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}
.tk-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-takeaway span { color: var(--tk-accent); }
.tk-num {
  position: absolute;
  left: 65px;
  right: 65px;
  bottom: 8px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 11px;
  line-height: 1.45;
  color: var(--tk-muted);
}
.tk-num b { color: #143c6b; font-size: 13px; }
</style>

---
layout: full
class: tk-slide tk-compare
---

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/tk/sundial.svg"
    stat="&#177;16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/wc/w2-surface-line.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/tk/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/tk/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num"><b>w2-surface-line</b> &nbsp; body 0.18 / surface stroked 6u<br>wash untouched; the waterline becomes a stroked ellipse<br>hold 5.05 &nbsp; Fmax 0.183 &nbsp; dPeak 8.46</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-warn: #9a6238;
  --tk-panel: #f2eee4;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 46px 65px 44px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}
.tk-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-takeaway span { color: var(--tk-accent); }
.tk-num {
  position: absolute;
  left: 65px;
  right: 65px;
  bottom: 8px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 11px;
  line-height: 1.45;
  color: var(--tk-muted);
}
.tk-num b { color: #143c6b; font-size: 13px; }
</style>

---
layout: full
class: tk-slide tk-compare
---

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/tk/sundial.svg"
    stat="&#177;16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/wc/w3-contours.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/tk/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/tk/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num"><b>w3-contours</b> &nbsp; 5 solid 4u arcs, stepped<br>the Patent set's water in this palette; level steps in 5 jumps<br>hold 5.26 &nbsp; Fmax 0.195 &nbsp; dPeak 9.37</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-warn: #9a6238;
  --tk-panel: #f2eee4;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 46px 65px 44px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}
.tk-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-takeaway span { color: var(--tk-accent); }
.tk-num {
  position: absolute;
  left: 65px;
  right: 65px;
  bottom: 8px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 11px;
  line-height: 1.45;
  color: var(--tk-muted);
}
.tk-num b { color: #143c6b; font-size: 13px; }
</style>

---
layout: full
class: tk-slide tk-compare
---

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/tk/sundial.svg"
    stat="&#177;16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/wc/w4-hatched.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/tk/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/tk/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num"><b>w4-hatched</b> &nbsp; 4u lines on 8u pitch<br>texture instead of tint<br>hold 5.57 &nbsp; Fmax 0.209 &nbsp; dPeak 8.51</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-warn: #9a6238;
  --tk-panel: #f2eee4;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 46px 65px 44px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}
.tk-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-takeaway span { color: var(--tk-accent); }
.tk-num {
  position: absolute;
  left: 65px;
  right: 65px;
  bottom: 8px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 11px;
  line-height: 1.45;
  color: var(--tk-muted);
}
.tk-num b { color: #143c6b; font-size: 13px; }
</style>

---
layout: full
class: tk-slide tk-compare
---

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/tk/sundial.svg"
    stat="&#177;16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/wc/w5-line-and-body.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/tk/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/tk/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num"><b>w5-line-and-body</b> &nbsp; body 0.60 + stroked surface<br>W1 and W2 together, and it measures worse than either<br>hold 4.35 &nbsp; Fmax 0.140 &nbsp; dPeak 9.08</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-warn: #9a6238;
  --tk-panel: #f2eee4;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 46px 65px 44px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}
.tk-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-takeaway span { color: var(--tk-accent); }
.tk-num {
  position: absolute;
  left: 65px;
  right: 65px;
  bottom: 8px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 11px;
  line-height: 1.45;
  color: var(--tk-muted);
}
.tk-num b { color: #143c6b; font-size: 13px; }
</style>

---
layout: full
class: tk-slide tk-compare
---

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/tk/sundial.svg"
    stat="&#177;16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/wc/w6-house-rule.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/tk/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/tk/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num"><b>w6-house-rule</b> &nbsp; body 0.85 / surface solid<br>drawn like the hourglass sand; best numbers, worst drawing<br>hold 7.43 &nbsp; Fmax 0.270 &nbsp; dPeak 9.60</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-warn: #9a6238;
  --tk-panel: #f2eee4;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 46px 65px 44px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}
.tk-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-takeaway span { color: var(--tk-accent); }
.tk-num {
  position: absolute;
  left: 65px;
  right: 65px;
  bottom: 8px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 11px;
  line-height: 1.45;
  color: var(--tk-muted);
}
.tk-num b { color: #143c6b; font-size: 13px; }
</style>

---
layout: full
class: tk-slide tk-compare
---

<div class="tk-title">Before clocks, time was a flow</div>

<div class="tk-grid">
  <TimekeeperCard
    name="Sundial" date="c. 1500 BCE" img="/tk/sundial.svg"
    stat="&#177;16 min" unit="the Sun vs. a steady clock" problem="No sun, no time"
  />
  <TimekeeperCard
    name="Water clock" date="c. 1400 BCE" img="/wc/w7-mid-window.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
  />
  <TimekeeperCard
    name="Candle" date="9th c. CE" img="/tk/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up"
  />
  <TimekeeperCard
    name="Hourglass" date="by 1338" img="/tk/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it"
  />
</div>

<div class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<div class="tk-num"><b>w7-mid-window</b> &nbsp; body 0.65 / surface 0.85<br>opacity bracketed by two constraints rather than chosen<br>hold 6.37 &nbsp; Fmax 0.239 &nbsp; dPeak 8.43</div>

<style>
.tk-slide.tk-compare {
  --tk-ink: #2a2520;
  --tk-muted: #736a60;
  --tk-accent: #1f5fa8;
  --tk-warn: #9a6238;
  --tk-panel: #f2eee4;
  --tk-border: #e0d9ca;

  background: #faf7f0;
  color: var(--tk-ink);
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 46px 65px 44px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}
.tk-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
.tk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-takeaway span { color: var(--tk-accent); }
.tk-num {
  position: absolute;
  left: 65px;
  right: 65px;
  bottom: 8px;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-size: 11px;
  line-height: 1.45;
  color: var(--tk-muted);
}
.tk-num b { color: #143c6b; font-size: 13px; }
</style>

---
layout: full
class: ev-slide
---

<div class="ev-title">All eight at 122 px, four animation times</div>
<div class="ev-blurb">What the front row sees. This sheet is only here to show what the next one costs.</div>
<img src="/evidence/variants-near.png" />

<style>
.ev-slide {
  background: #faf7f0;
  color: #2a2520;
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 12px 22px 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ev-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 19px;
  color: #143c6b;
}
.ev-blurb { font-size: 12px; color: #736a60; }
.ev-slide img { flex: 1; min-height: 0; object-fit: contain; object-position: left top; }
</style>

---
layout: full
class: ev-slide
---

<div class="ev-title">The same pixels at TV 55in @ 7 m with 10% ambient flare</div>
<div class="ev-blurb">This is the sheet that decides. Read across each row: does the level visibly change?</div>
<img src="/evidence/variants-backrow.png" />

<style>
.ev-slide {
  background: #faf7f0;
  color: #2a2520;
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 12px 22px 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ev-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 19px;
  color: #143c6b;
}
.ev-blurb { font-size: 12px; color: #736a60; }
.ev-slide img { flex: 1; min-height: 0; object-fit: contain; object-position: left top; }
</style>

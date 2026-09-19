---
theme: seriph
title: Torture test - three finalists, five slide types
---

# Torture test

Beacon, Coffee + Code and Ledger across five slide archetypes.

---
layout: full
class: tt tt-t30
---

<div class="tt-title">Before clocks, time was a flow</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 14px">
  <TimekeeperCard name="Sundial" date="c. 1500 BCE" img="/timekeepers/t30/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time" />
  <TimekeeperCard name="Water clock" date="c. 1400 BCE" img="/timekeepers/t30/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter" />
  <TimekeeperCard name="Candle" date="9th c. CE" img="/timekeepers/t30/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up" />
  <TimekeeperCard name="Hourglass" date="by 1338" img="/timekeepers/t30/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it" />
</div>

<div class="tt-lead">Their rate is set by the outside world. <em>A clock sets its own.</em></div>

<div class="tt-tag">cards &mdash; Beacon</div>

<style>
.tt.tt-t30 {
  --tk-ink: #FFFFFF; --tk-muted: #9197A1; --tk-accent: #FFC24E;
  --tk-warn: #8FBEEA; --tk-panel: #202C41; --tk-border: #3A4558;
  background: #0F1C33;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t30 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t30 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t30 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t30 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t30 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t30 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t30 li { margin: 2px 0; }
.tt.tt-t30 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t30 th, .tt.tt-t30 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t30 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t30 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t30 .slidev-code, .tt.tt-t30 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t30 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t30 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t30 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t30 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t30 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t30 .tt-chart img { width: 470px; }
.tt.tt-t30 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t25
---

<div class="tt-title">Before clocks, time was a flow</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 14px">
  <TimekeeperCard name="Sundial" date="c. 1500 BCE" img="/timekeepers/t25/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time" />
  <TimekeeperCard name="Water clock" date="c. 1400 BCE" img="/timekeepers/t25/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter" />
  <TimekeeperCard name="Candle" date="9th c. CE" img="/timekeepers/t25/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up" />
  <TimekeeperCard name="Hourglass" date="by 1338" img="/timekeepers/t25/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it" />
</div>

<div class="tt-lead">Their rate is set by the outside world. <em>A clock sets its own.</em></div>

<div class="tt-tag">cards &mdash; Coffee + Code</div>

<style>
.tt.tt-t25 {
  --tk-ink: #FFF5E6; --tk-muted: #B3A79C; --tk-accent: #E9A23B;
  --tk-warn: #83BE8A; --tk-panel: #473934; --tk-border: #5E514B;
  background: #3B2D29;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t25 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t25 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t25 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t25 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t25 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t25 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t25 li { margin: 2px 0; }
.tt.tt-t25 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t25 th, .tt.tt-t25 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t25 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t25 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t25 .slidev-code, .tt.tt-t25 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t25 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t25 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t25 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t25 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t25 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t25 .tt-chart img { width: 470px; }
.tt.tt-t25 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t13
---

<div class="tt-title">Before clocks, time was a flow</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 14px">
  <TimekeeperCard name="Sundial" date="c. 1500 BCE" img="/timekeepers/t13/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time" />
  <TimekeeperCard name="Water clock" date="c. 1400 BCE" img="/timekeepers/t13/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter" />
  <TimekeeperCard name="Candle" date="9th c. CE" img="/timekeepers/t13/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up" />
  <TimekeeperCard name="Hourglass" date="by 1338" img="/timekeepers/t13/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it" />
</div>

<div class="tt-lead">Their rate is set by the outside world. <em>A clock sets its own.</em></div>

<div class="tt-tag">cards &mdash; Ledger</div>

<style>
.tt.tt-t13 {
  --tk-ink: #2A2520; --tk-muted: #736A60; --tk-accent: #1F5FA8;
  --tk-warn: #9A6238; --tk-panel: #F2EEE4; --tk-border: #E0D9CA;
  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t13 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t13 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t13 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t13 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t13 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t13 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t13 li { margin: 2px 0; }
.tt.tt-t13 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t13 th, .tt.tt-t13 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t13 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t13 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t13 .slidev-code, .tt.tt-t13 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t13 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t13 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t13 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t13 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t13 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t13 .tt-chart img { width: 470px; }
.tt.tt-t13 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t30
---

<div class="tt-title">Simulating the escapement</div>

<div class="tt-lead">A pendulum loses <em>0.5%</em> per swing and the escapement puts it back.</div>

```python
from math import sin, pi

def tick(theta, omega, dt=1e-3, g=9.81, L=0.994, Q=8000):
    # One step of a driven pendulum. L=0.994 m gives a 2 s period.
    damping = -omega * (2 * pi / Q)
    alpha = -(g / L) * sin(theta) + damping
    if abs(theta) < 1e-4 and omega > 0:      # escapement impulse at centre
        omega += 3.1e-4
    return theta + omega * dt, omega + alpha * dt

theta, omega, beats = 0.10, 0.0, 0
for step in range(86_400_000):               # one simulated day
    prev = theta
    theta, omega = tick(theta, omega)
    if prev < 0 <= theta:
        beats += 1
print(f"{beats:,} beats/day -> drift {86400 - beats / 2:+.1f} s")
```

<div class="tt-muted">Result: <strong>+12.4 s/day</strong> &mdash; about what Huygens got in 1656.</div>

<div class="tt-tag">code &mdash; Beacon</div>

<style>
.tt.tt-t30 {
  --tk-ink: #FFFFFF; --tk-muted: #9197A1; --tk-accent: #FFC24E;
  --tk-warn: #8FBEEA; --tk-panel: #202C41; --tk-border: #3A4558;
  background: #0F1C33;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t30 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t30 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t30 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t30 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t30 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t30 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t30 li { margin: 2px 0; }
.tt.tt-t30 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t30 th, .tt.tt-t30 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t30 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t30 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t30 .slidev-code, .tt.tt-t30 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t30 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t30 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t30 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t30 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t30 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t30 .tt-chart img { width: 470px; }
.tt.tt-t30 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t25
---

<div class="tt-title">Simulating the escapement</div>

<div class="tt-lead">A pendulum loses <em>0.5%</em> per swing and the escapement puts it back.</div>

```python
from math import sin, pi

def tick(theta, omega, dt=1e-3, g=9.81, L=0.994, Q=8000):
    # One step of a driven pendulum. L=0.994 m gives a 2 s period.
    damping = -omega * (2 * pi / Q)
    alpha = -(g / L) * sin(theta) + damping
    if abs(theta) < 1e-4 and omega > 0:      # escapement impulse at centre
        omega += 3.1e-4
    return theta + omega * dt, omega + alpha * dt

theta, omega, beats = 0.10, 0.0, 0
for step in range(86_400_000):               # one simulated day
    prev = theta
    theta, omega = tick(theta, omega)
    if prev < 0 <= theta:
        beats += 1
print(f"{beats:,} beats/day -> drift {86400 - beats / 2:+.1f} s")
```

<div class="tt-muted">Result: <strong>+12.4 s/day</strong> &mdash; about what Huygens got in 1656.</div>

<div class="tt-tag">code &mdash; Coffee + Code</div>

<style>
.tt.tt-t25 {
  --tk-ink: #FFF5E6; --tk-muted: #B3A79C; --tk-accent: #E9A23B;
  --tk-warn: #83BE8A; --tk-panel: #473934; --tk-border: #5E514B;
  background: #3B2D29;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t25 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t25 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t25 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t25 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t25 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t25 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t25 li { margin: 2px 0; }
.tt.tt-t25 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t25 th, .tt.tt-t25 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t25 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t25 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t25 .slidev-code, .tt.tt-t25 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t25 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t25 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t25 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t25 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t25 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t25 .tt-chart img { width: 470px; }
.tt.tt-t25 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t13
---

<div class="tt-title">Simulating the escapement</div>

<div class="tt-lead">A pendulum loses <em>0.5%</em> per swing and the escapement puts it back.</div>

```python
from math import sin, pi

def tick(theta, omega, dt=1e-3, g=9.81, L=0.994, Q=8000):
    # One step of a driven pendulum. L=0.994 m gives a 2 s period.
    damping = -omega * (2 * pi / Q)
    alpha = -(g / L) * sin(theta) + damping
    if abs(theta) < 1e-4 and omega > 0:      # escapement impulse at centre
        omega += 3.1e-4
    return theta + omega * dt, omega + alpha * dt

theta, omega, beats = 0.10, 0.0, 0
for step in range(86_400_000):               # one simulated day
    prev = theta
    theta, omega = tick(theta, omega)
    if prev < 0 <= theta:
        beats += 1
print(f"{beats:,} beats/day -> drift {86400 - beats / 2:+.1f} s")
```

<div class="tt-muted">Result: <strong>+12.4 s/day</strong> &mdash; about what Huygens got in 1656.</div>

<div class="tt-tag">code &mdash; Ledger</div>

<style>
.tt.tt-t13 {
  --tk-ink: #2A2520; --tk-muted: #736A60; --tk-accent: #1F5FA8;
  --tk-warn: #9A6238; --tk-panel: #F2EEE4; --tk-border: #E0D9CA;
  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t13 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t13 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t13 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t13 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t13 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t13 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t13 li { margin: 2px 0; }
.tt.tt-t13 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t13 th, .tt.tt-t13 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t13 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t13 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t13 .slidev-code, .tt.tt-t13 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t13 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t13 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t13 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t13 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t13 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t13 .tt-chart img { width: 470px; }
.tt.tt-t13 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t30
---

<div class="tt-title">Four centuries, four orders of magnitude</div>

<div class="tt-chart">
  <img src="/torture/chart.png" alt="accuracy over time">
  <div>
    <div class="tt-lead">The pendulum is the <em>discontinuity</em>.</div>
    <ul>
      <li>Verge escapements plateau near <strong>15 min/day</strong></li>
      <li>1656: Huygens drops it to 15&nbsp;s</li>
      <li>1715: the deadbeat reaches 1&nbsp;s</li>
      <li>By 1889 the Riefler is at 10&nbsp;ms</li>
    </ul>
    <div class="tt-muted">Chart pasted straight out of matplotlib, unedited.</div>
  </div>
</div>

<div class="tt-tag">chart &mdash; Beacon</div>

<style>
.tt.tt-t30 {
  --tk-ink: #FFFFFF; --tk-muted: #9197A1; --tk-accent: #FFC24E;
  --tk-warn: #8FBEEA; --tk-panel: #202C41; --tk-border: #3A4558;
  background: #0F1C33;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t30 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t30 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t30 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t30 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t30 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t30 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t30 li { margin: 2px 0; }
.tt.tt-t30 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t30 th, .tt.tt-t30 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t30 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t30 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t30 .slidev-code, .tt.tt-t30 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t30 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t30 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t30 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t30 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t30 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t30 .tt-chart img { width: 470px; }
.tt.tt-t30 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t25
---

<div class="tt-title">Four centuries, four orders of magnitude</div>

<div class="tt-chart">
  <img src="/torture/chart.png" alt="accuracy over time">
  <div>
    <div class="tt-lead">The pendulum is the <em>discontinuity</em>.</div>
    <ul>
      <li>Verge escapements plateau near <strong>15 min/day</strong></li>
      <li>1656: Huygens drops it to 15&nbsp;s</li>
      <li>1715: the deadbeat reaches 1&nbsp;s</li>
      <li>By 1889 the Riefler is at 10&nbsp;ms</li>
    </ul>
    <div class="tt-muted">Chart pasted straight out of matplotlib, unedited.</div>
  </div>
</div>

<div class="tt-tag">chart &mdash; Coffee + Code</div>

<style>
.tt.tt-t25 {
  --tk-ink: #FFF5E6; --tk-muted: #B3A79C; --tk-accent: #E9A23B;
  --tk-warn: #83BE8A; --tk-panel: #473934; --tk-border: #5E514B;
  background: #3B2D29;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t25 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t25 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t25 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t25 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t25 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t25 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t25 li { margin: 2px 0; }
.tt.tt-t25 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t25 th, .tt.tt-t25 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t25 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t25 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t25 .slidev-code, .tt.tt-t25 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t25 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t25 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t25 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t25 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t25 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t25 .tt-chart img { width: 470px; }
.tt.tt-t25 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t13
---

<div class="tt-title">Four centuries, four orders of magnitude</div>

<div class="tt-chart">
  <img src="/torture/chart.png" alt="accuracy over time">
  <div>
    <div class="tt-lead">The pendulum is the <em>discontinuity</em>.</div>
    <ul>
      <li>Verge escapements plateau near <strong>15 min/day</strong></li>
      <li>1656: Huygens drops it to 15&nbsp;s</li>
      <li>1715: the deadbeat reaches 1&nbsp;s</li>
      <li>By 1889 the Riefler is at 10&nbsp;ms</li>
    </ul>
    <div class="tt-muted">Chart pasted straight out of matplotlib, unedited.</div>
  </div>
</div>

<div class="tt-tag">chart &mdash; Ledger</div>

<style>
.tt.tt-t13 {
  --tk-ink: #2A2520; --tk-muted: #736A60; --tk-accent: #1F5FA8;
  --tk-warn: #9A6238; --tk-panel: #F2EEE4; --tk-border: #E0D9CA;
  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t13 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t13 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t13 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t13 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t13 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t13 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t13 li { margin: 2px 0; }
.tt.tt-t13 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t13 th, .tt.tt-t13 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t13 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t13 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t13 .slidev-code, .tt.tt-t13 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t13 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t13 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t13 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t13 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t13 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t13 .tt-chart img { width: 470px; }
.tt.tt-t13 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t30
---

<div class="tt-title">Why nobody fixed it for 370 years</div>

<div class="tt-lead">The verge escapement was not improved between roughly 1280 and 1656. That is not because
clockmakers were lazy &mdash; it is because the <em>foliot has no natural period</em>, so there was nothing to tune.</div>

- A pendulum has a period set by its length, and only weakly by amplitude
- A foliot's period is set by the driving weight, friction, and the wind of the spring
- Adding weight to a foliot makes it run _faster_, which is the opposite of intuition
- So every repair changed the rate, and every clock needed a keeper

| Mechanism           | First use | Drift/day | Samples |
| ------------------- | --------- | --------- | ------- |
| Verge &amp; foliot  | c. 1280   | 15–30 min | 12      |
| Verge &amp; balance | c. 1500   | 10–20 min | 31      |
| Pendulum (Huygens)  | 1656      | 15 s      | 8       |
| Deadbeat (Graham)   | 1715      | 1 s       | 22      |
| Riefler             | 1889      | 0.01 s    | 4       |

<div class="tt-muted">Counts are surviving instruments with published rate measurements, not production numbers.</div>

<div class="tt-tag">dense &mdash; Beacon</div>

<style>
.tt.tt-t30 {
  --tk-ink: #FFFFFF; --tk-muted: #9197A1; --tk-accent: #FFC24E;
  --tk-warn: #8FBEEA; --tk-panel: #202C41; --tk-border: #3A4558;
  background: #0F1C33;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t30 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t30 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t30 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t30 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t30 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t30 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t30 li { margin: 2px 0; }
.tt.tt-t30 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t30 th, .tt.tt-t30 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t30 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t30 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t30 .slidev-code, .tt.tt-t30 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t30 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t30 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t30 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t30 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t30 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t30 .tt-chart img { width: 470px; }
.tt.tt-t30 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t25
---

<div class="tt-title">Why nobody fixed it for 370 years</div>

<div class="tt-lead">The verge escapement was not improved between roughly 1280 and 1656. That is not because
clockmakers were lazy &mdash; it is because the <em>foliot has no natural period</em>, so there was nothing to tune.</div>

- A pendulum has a period set by its length, and only weakly by amplitude
- A foliot's period is set by the driving weight, friction, and the wind of the spring
- Adding weight to a foliot makes it run _faster_, which is the opposite of intuition
- So every repair changed the rate, and every clock needed a keeper

| Mechanism           | First use | Drift/day | Samples |
| ------------------- | --------- | --------- | ------- |
| Verge &amp; foliot  | c. 1280   | 15–30 min | 12      |
| Verge &amp; balance | c. 1500   | 10–20 min | 31      |
| Pendulum (Huygens)  | 1656      | 15 s      | 8       |
| Deadbeat (Graham)   | 1715      | 1 s       | 22      |
| Riefler             | 1889      | 0.01 s    | 4       |

<div class="tt-muted">Counts are surviving instruments with published rate measurements, not production numbers.</div>

<div class="tt-tag">dense &mdash; Coffee + Code</div>

<style>
.tt.tt-t25 {
  --tk-ink: #FFF5E6; --tk-muted: #B3A79C; --tk-accent: #E9A23B;
  --tk-warn: #83BE8A; --tk-panel: #473934; --tk-border: #5E514B;
  background: #3B2D29;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t25 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t25 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t25 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t25 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t25 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t25 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t25 li { margin: 2px 0; }
.tt.tt-t25 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t25 th, .tt.tt-t25 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t25 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t25 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t25 .slidev-code, .tt.tt-t25 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t25 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t25 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t25 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t25 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t25 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t25 .tt-chart img { width: 470px; }
.tt.tt-t25 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t13
---

<div class="tt-title">Why nobody fixed it for 370 years</div>

<div class="tt-lead">The verge escapement was not improved between roughly 1280 and 1656. That is not because
clockmakers were lazy &mdash; it is because the <em>foliot has no natural period</em>, so there was nothing to tune.</div>

- A pendulum has a period set by its length, and only weakly by amplitude
- A foliot's period is set by the driving weight, friction, and the wind of the spring
- Adding weight to a foliot makes it run _faster_, which is the opposite of intuition
- So every repair changed the rate, and every clock needed a keeper

| Mechanism           | First use | Drift/day | Samples |
| ------------------- | --------- | --------- | ------- |
| Verge &amp; foliot  | c. 1280   | 15–30 min | 12      |
| Verge &amp; balance | c. 1500   | 10–20 min | 31      |
| Pendulum (Huygens)  | 1656      | 15 s      | 8       |
| Deadbeat (Graham)   | 1715      | 1 s       | 22      |
| Riefler             | 1889      | 0.01 s    | 4       |

<div class="tt-muted">Counts are surviving instruments with published rate measurements, not production numbers.</div>

<div class="tt-tag">dense &mdash; Ledger</div>

<style>
.tt.tt-t13 {
  --tk-ink: #2A2520; --tk-muted: #736A60; --tk-accent: #1F5FA8;
  --tk-warn: #9A6238; --tk-panel: #F2EEE4; --tk-border: #E0D9CA;
  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t13 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t13 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t13 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t13 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t13 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t13 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t13 li { margin: 2px 0; }
.tt.tt-t13 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t13 th, .tt.tt-t13 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t13 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t13 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t13 .slidev-code, .tt.tt-t13 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t13 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t13 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t13 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t13 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t13 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t13 .tt-chart img { width: 470px; }
.tt.tt-t13 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t30
---

<div class="tt-title">What the sources actually look like</div>

<div class="tt-figs">
  <figure>
    <img src="/torture/screenshot.png" alt="screenshot of a data table">
    <figcaption>A screenshot dropped in from a browser &mdash; white chrome, unedited.</figcaption>
  </figure>
  <figure>
    <img src="/torture/photo.png" alt="dusk photograph">
    <figcaption>A photograph &mdash; dark, full-bleed, soft edges.</figcaption>
  </figure>
</div>

<div class="tt-muted">Both are the kind of thing a presenter pastes without adjusting anything.</div>

<div class="tt-tag">images &mdash; Beacon</div>

<style>
.tt.tt-t30 {
  --tk-ink: #FFFFFF; --tk-muted: #9197A1; --tk-accent: #FFC24E;
  --tk-warn: #8FBEEA; --tk-panel: #202C41; --tk-border: #3A4558;
  background: #0F1C33;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t30 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t30 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t30 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t30 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t30 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t30 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t30 li { margin: 2px 0; }
.tt.tt-t30 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t30 th, .tt.tt-t30 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t30 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t30 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t30 .slidev-code, .tt.tt-t30 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t30 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t30 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t30 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t30 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t30 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t30 .tt-chart img { width: 470px; }
.tt.tt-t30 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t25
---

<div class="tt-title">What the sources actually look like</div>

<div class="tt-figs">
  <figure>
    <img src="/torture/screenshot.png" alt="screenshot of a data table">
    <figcaption>A screenshot dropped in from a browser &mdash; white chrome, unedited.</figcaption>
  </figure>
  <figure>
    <img src="/torture/photo.png" alt="dusk photograph">
    <figcaption>A photograph &mdash; dark, full-bleed, soft edges.</figcaption>
  </figure>
</div>

<div class="tt-muted">Both are the kind of thing a presenter pastes without adjusting anything.</div>

<div class="tt-tag">images &mdash; Coffee + Code</div>

<style>
.tt.tt-t25 {
  --tk-ink: #FFF5E6; --tk-muted: #B3A79C; --tk-accent: #E9A23B;
  --tk-warn: #83BE8A; --tk-panel: #473934; --tk-border: #5E514B;
  background: #3B2D29;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t25 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t25 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t25 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t25 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t25 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t25 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t25 li { margin: 2px 0; }
.tt.tt-t25 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t25 th, .tt.tt-t25 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t25 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t25 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t25 .slidev-code, .tt.tt-t25 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t25 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t25 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t25 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t25 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t25 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t25 .tt-chart img { width: 470px; }
.tt.tt-t25 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

---
layout: full
class: tt tt-t13
---

<div class="tt-title">What the sources actually look like</div>

<div class="tt-figs">
  <figure>
    <img src="/torture/screenshot.png" alt="screenshot of a data table">
    <figcaption>A screenshot dropped in from a browser &mdash; white chrome, unedited.</figcaption>
  </figure>
  <figure>
    <img src="/torture/photo.png" alt="dusk photograph">
    <figcaption>A photograph &mdash; dark, full-bleed, soft edges.</figcaption>
  </figure>
</div>

<div class="tt-muted">Both are the kind of thing a presenter pastes without adjusting anything.</div>

<div class="tt-tag">images &mdash; Ledger</div>

<style>
.tt.tt-t13 {
  --tk-ink: #2A2520; --tk-muted: #736A60; --tk-accent: #1F5FA8;
  --tk-warn: #9A6238; --tk-panel: #F2EEE4; --tk-border: #E0D9CA;
  background: #FAF7F0;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-t13 .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-t13 .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-t13 .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-t13 .tt-lead strong { color: var(--tk-warn); }
.tt.tt-t13 .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-t13 ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-t13 li { margin: 2px 0; }
.tt.tt-t13 table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-t13 th, .tt.tt-t13 td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-t13 th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-t13 td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-t13 .slidev-code, .tt.tt-t13 pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-t13 .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-t13 .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-t13 img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-t13 figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-t13 .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-t13 .tt-chart img { width: 470px; }
.tt.tt-t13 .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>

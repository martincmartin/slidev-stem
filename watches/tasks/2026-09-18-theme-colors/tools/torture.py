"""Build torture.md: the three finalists across five slide archetypes."""
import pathlib as _pl
_HERE = _pl.Path(__file__).resolve().parent
_DECK = _HERE.parent / "deck"
_OUT  = _HERE.parent / "out"
_OUT.mkdir(exist_ok=True)
import pathlib, sys
sys.path.insert(0, str(_HERE))
from lib import load_themes

FINALISTS = ["Beacon", "Coffee + Code", "Ledger"]
themes = {t["name"]: t for t in load_themes() if t["name"] in FINALISTS}
assert len(themes) == 3, themes.keys()

STYLE = """
<style>
.tt.tt-KEY {
  --tk-ink: INK; --tk-muted: MUTED; --tk-accent: ACCENT;
  --tk-warn: WARN; --tk-panel: PANEL; --tk-border: BORDER;
  background: BG;
  color: var(--tk-ink);
  font-family: 'IBM Plex Sans', Arial, sans-serif;
  padding: 40px 58px 30px;
  display: flex; flex-direction: column; gap: 12px;
  position: relative;
  font-size: 19px;
}
.tt.tt-KEY .tt-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600; font-size: 34px; line-height: 1.1; margin: 0;
}
.tt.tt-KEY .tt-lead { font-size: 20px; line-height: 1.4; margin: 0; }
.tt.tt-KEY .tt-lead em { color: var(--tk-accent); font-style: normal; font-weight: 600; }
.tt.tt-KEY .tt-lead strong { color: var(--tk-warn); }
.tt.tt-KEY .tt-muted { color: var(--tk-muted); font-size: 17px; }
.tt.tt-KEY ul { margin: 0; padding-left: 22px; line-height: 1.5; }
.tt.tt-KEY li { margin: 2px 0; }
.tt.tt-KEY table { border-collapse: collapse; width: 100%; font-size: 17px; }
.tt.tt-KEY th, .tt.tt-KEY td {
  border: 1px solid var(--tk-border); padding: 5px 10px; text-align: left;
}
.tt.tt-KEY th { background: var(--tk-panel); font-weight: 600; }
.tt.tt-KEY td.n { text-align: right; font-variant-numeric: tabular-nums; }
.tt.tt-KEY .slidev-code, .tt.tt-KEY pre {
  border: 1px solid var(--tk-border); border-radius: 8px; font-size: 16px !important;
}
.tt.tt-KEY .tt-figs { display: flex; gap: 18px; align-items: flex-start; }
.tt.tt-KEY .tt-figs figure { margin: 0; flex: 1; }
.tt.tt-KEY img { max-width: 100%; display: block; border-radius: 4px; }
.tt.tt-KEY figcaption { color: var(--tk-muted); font-size: 15px; padding-top: 5px; }
.tt.tt-KEY .tt-chart { display: flex; gap: 22px; align-items: center; }
.tt.tt-KEY .tt-chart img { width: 470px; }
.tt.tt-KEY .tt-tag {
  position: absolute; right: 16px; bottom: 10px; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tk-muted); opacity: .7;
}
</style>
"""

CARDS = """
<div class="tt-title">Before clocks, time was a flow</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 14px">
  <TimekeeperCard name="Sundial" date="c. 1500 BCE" img="/timekeepers/KEY/sundial.svg"
    stat="±16 min" unit="the Sun vs. a steady clock" problem="No sun, no time" />
  <TimekeeperCard name="Water clock" date="c. 1400 BCE" img="/timekeepers/KEY/water-clock.svg"
    stat="~15 min" unit="per day, the best ones" problem="Freezes in winter" />
  <TimekeeperCard name="Candle" date="9th c. CE" img="/timekeepers/KEY/candle.svg"
    stat="?" unknown unit="no good data found" problem="Drafts speed it up" />
  <TimekeeperCard name="Hourglass" date="by 1338" img="/timekeepers/KEY/hourglass.svg"
    stat="?" unknown unit="no good data found" problem="Someone must flip it" />
</div>

<div class="tt-lead">Their rate is set by the outside world. <em>A clock sets its own.</em></div>
"""

CODE = """
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
"""

CHART = """
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
"""

DENSE = """
<div class="tt-title">Why nobody fixed it for 370 years</div>

<div class="tt-lead">The verge escapement was not improved between roughly 1280 and 1656. That is not because
clockmakers were lazy &mdash; it is because the <em>foliot has no natural period</em>, so there was nothing to tune.</div>

- A pendulum has a period set by its length, and only weakly by amplitude
- A foliot's period is set by the driving weight, friction, and the wind of the spring
- Adding weight to a foliot makes it run *faster*, which is the opposite of intuition
- So every repair changed the rate, and every clock needed a keeper

| Mechanism | First use | Drift/day | Samples |
|---|---|---|---|
| Verge &amp; foliot | c. 1280 | 15–30 min | 12 |
| Verge &amp; balance | c. 1500 | 10–20 min | 31 |
| Pendulum (Huygens) | 1656 | 15 s | 8 |
| Deadbeat (Graham) | 1715 | 1 s | 22 |
| Riefler | 1889 | 0.01 s | 4 |

<div class="tt-muted">Counts are surviving instruments with published rate measurements, not production numbers.</div>
"""

IMAGES = """
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
"""

ARCHETYPES = [("cards", CARDS), ("code", CODE), ("chart", CHART),
              ("dense", DENSE), ("images", IMAGES)]

HEAD = """---
theme: seriph
title: Torture test - three finalists, five slide types
---

# Torture test

Beacon, Coffee + Code and Ledger across five slide archetypes.
"""

out = [HEAD]
n = 1
for aname, body in ARCHETYPES:
    for tname in FINALISTS:
        t = themes[tname]
        n += 1
        style = STYLE
        for k, v in [("KEY", t["key"]), ("INK", t["ink"]), ("MUTED", t["muted"]),
                     ("ACCENT", t["accent"]), ("WARN", t["warn"]),
                     ("PANEL", t["panel"]), ("BORDER", t["border"]), ("BG", t["bg"])]:
            style = style.replace(k, v)
        out.append(f"\n---\nlayout: full\nclass: tt tt-{t['key']}\n\n---\n")
        out.append(body.replace("KEY", t["key"]))
        out.append(f'\n<div class="tt-tag">{aname} &mdash; {tname}</div>\n')
        out.append(style)

pathlib.Path(str(_DECK / "torture.md")).write_text("".join(out))
print(f"torture.md: {n} slides ({len(ARCHETYPES)} archetypes x {len(FINALISTS)} themes)")

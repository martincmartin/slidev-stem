"""Render the foreign content a presenter would paste in: a white-background
chart, a light UI screenshot, and a dark photographic image."""
import pathlib as _pl
_HERE = _pl.Path(__file__).resolve().parent
_DECK = _HERE.parent / "deck"
_OUT  = _HERE.parent / "out"
_OUT.mkdir(exist_ok=True)
import pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(str(_DECK / "public" / "torture"))
OUT.mkdir(parents=True, exist_ok=True)

# A default-matplotlib-looking figure: white canvas, tab10 colours, DejaVu-ish sans.
CHART = """<style>
body{margin:0;background:#fff;font:11px "DejaVu Sans",Verdana,sans-serif;color:#000}
svg{display:block}
</style>
<svg width="640" height="440" xmlns="http://www.w3.org/2000/svg">
<rect width="640" height="440" fill="#ffffff"/>
<g transform="translate(80,40)">
  <rect width="520" height="340" fill="#ffffff" stroke="#000000" stroke-width="0.8"/>
  <g stroke="#b0b0b0" stroke-width="0.6" stroke-dasharray="3,3">
    <line x1="0" y1="68" x2="520" y2="68"/><line x1="0" y1="136" x2="520" y2="136"/>
    <line x1="0" y1="204" x2="520" y2="204"/><line x1="0" y1="272" x2="520" y2="272"/>
    <line x1="104" y1="0" x2="104" y2="340"/><line x1="208" y1="0" x2="208" y2="340"/>
    <line x1="312" y1="0" x2="312" y2="340"/><line x1="416" y1="0" x2="416" y2="340"/>
  </g>
  <polyline fill="none" stroke="#1f77b4" stroke-width="1.6"
    points="0,300 52,286 104,262 156,231 208,196 260,161 312,126 364,96 416,72 468,55 520,44"/>
  <polyline fill="none" stroke="#ff7f0e" stroke-width="1.6" stroke-dasharray="6,3"
    points="0,318 52,312 104,301 156,286 208,266 260,241 312,212 364,178 416,140 468,98 520,52"/>
  <g fill="#1f77b4">
    <circle cx="104" cy="262" r="2.6"/><circle cx="208" cy="196" r="2.6"/>
    <circle cx="312" cy="126" r="2.6"/><circle cx="416" cy="72" r="2.6"/>
  </g>
  <g font-size="11" fill="#000000" text-anchor="middle">
    <text x="0" y="358">1300</text><text x="104" y="358">1400</text>
    <text x="208" y="358">1500</text><text x="312" y="358">1600</text>
    <text x="416" y="358">1700</text><text x="520" y="358">1800</text>
  </g>
  <g font-size="11" fill="#000000" text-anchor="end">
    <text x="-8" y="344">0</text><text x="-8" y="276">15</text><text x="-8" y="208">30</text>
    <text x="-8" y="140">45</text><text x="-8" y="72">60</text><text x="-8" y="8">75</text>
  </g>
  <text x="260" y="382" font-size="12" text-anchor="middle">Year</text>
  <text x="-52" y="170" font-size="12" text-anchor="middle"
        transform="rotate(-90,-52,170)">Accuracy (min/day)</text>
  <text x="260" y="-14" font-size="13" text-anchor="middle">Clock accuracy over time</text>
  <g transform="translate(300,250)">
    <rect width="200" height="52" fill="#ffffff" stroke="#cccccc" stroke-width="0.8"/>
    <line x1="12" y1="18" x2="44" y2="18" stroke="#1f77b4" stroke-width="1.6"/>
    <text x="54" y="22" font-size="11">verge escapement</text>
    <line x1="12" y1="38" x2="44" y2="38" stroke="#ff7f0e" stroke-width="1.6" stroke-dasharray="6,3"/>
    <text x="54" y="42" font-size="11">pendulum</text>
  </g>
</g>
</svg>"""

# A light-chrome UI screenshot, the other thing people paste.
SHOT = """<style>
body{margin:0;background:#fff;font:13px -apple-system,system-ui,sans-serif;color:#202124}
.bar{background:#f1f3f4;border-bottom:1px solid #dadce0;padding:8px 12px;display:flex;gap:8px;align-items:center}
.dot{width:11px;height:11px;border-radius:50%}
.url{flex:1;background:#fff;border:1px solid #dadce0;border-radius:12px;padding:3px 10px;color:#5f6368;font-size:12px}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid #e0e0e0;padding:6px 10px;text-align:left}
th{background:#f8f9fa;font-weight:600}
td.n{text-align:right;font-variant-numeric:tabular-nums}
h2{font-size:16px;margin:16px 12px 8px}
</style>
<div class="bar">
  <div class="dot" style="background:#ff5f57"></div><div class="dot" style="background:#febc2e"></div>
  <div class="dot" style="background:#28c840"></div>
  <div class="url">horology-data.example/escapements</div>
</div>
<h2>Escapement accuracy, measured</h2>
<div style="padding:0 12px 14px">
<table>
<tr><th>Mechanism</th><th>First use</th><th class="n">Drift/day</th><th class="n">n</th></tr>
<tr><td>Verge &amp; foliot</td><td>c. 1280</td><td class="n">15–30 min</td><td class="n">12</td></tr>
<tr><td>Verge &amp; balance</td><td>c. 1500</td><td class="n">10–20 min</td><td class="n">31</td></tr>
<tr><td>Pendulum (Huygens)</td><td>1656</td><td class="n">15 s</td><td class="n">8</td></tr>
<tr><td>Deadbeat</td><td>1715</td><td class="n">1 s</td><td class="n">22</td></tr>
<tr><td>Riefler</td><td>1889</td><td class="n">0.01 s</td><td class="n">4</td></tr>
</table></div>"""

# Stand-in for a photograph: procedural, dark, full-bleed.
PHOTO = """<style>
body{margin:0;width:640px;height:440px;overflow:hidden}
.s{position:absolute;inset:0;background:
 radial-gradient(60% 45% at 72% 22%, #ffd9a0 0%, #e79b52 22%, rgba(180,90,40,0) 62%),
 linear-gradient(#10243c 0%, #1e3c5c 34%, #4a5a68 58%, #24303a 76%, #10161c 100%)}
.h1,.h2{position:absolute;left:-10%;width:120%;background:#0a1016}
.h1{bottom:0;height:34%;clip-path:polygon(0 42%,14% 26%,30% 40%,46% 20%,64% 36%,80% 18%,100% 32%,100% 100%,0 100%)}
.h2{bottom:0;height:22%;opacity:.75;background:#060a0e;
    clip-path:polygon(0 60%,20% 44%,38% 58%,58% 38%,76% 54%,100% 42%,100% 100%,0 100%)}
.m{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;opacity:.9}
</style>
<div class="s"></div><div class="h1"></div><div class="h2"></div>
<div class="m" style="left:18%;top:14%"></div><div class="m" style="left:34%;top:9%;width:4px;height:4px"></div>
<div class="m" style="left:52%;top:17%;width:3px;height:3px"></div><div class="m" style="left:86%;top:11%;width:4px;height:4px"></div>"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, html, size in [("chart", CHART, (640, 440)),
                             ("screenshot", SHOT, (640, 330)),
                             ("photo", PHOTO, (640, 440))]:
        pg = b.new_page(viewport={"width": size[0], "height": size[1]}, device_scale_factor=2)
        pg.set_content(html); pg.wait_for_timeout(250)
        pg.screenshot(path=str(OUT / f"{name}.png"))
        pg.close()
        print("wrote", OUT / f"{name}.png")
    b.close()

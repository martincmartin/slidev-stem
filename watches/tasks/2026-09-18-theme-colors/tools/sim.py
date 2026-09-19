"""Simulate the venue on the rendered slides: additive ambient flare plus
distance blur, and deuteranope vision. Done in the browser so no image
libraries are needed."""
import pathlib as _pl
_HERE = _pl.Path(__file__).resolve().parent
_DECK = _HERE.parent / "deck"
_OUT  = _HERE.parent / "out"
_OUT.mkdir(exist_ok=True)
import pathlib, base64
from playwright.sync_api import sync_playwright
S = pathlib.Path(str(_HERE))
SH = S / "tshots"
THEMES = [("Beacon", "cards-Beacon.png"), ("Coffee + Code", "cards-Coffee-Code.png"),
          ("Ledger", "cards-Ledger.png")]

def b64(p): return base64.b64encode((SH / p).read_bytes()).decode()

cols = [("as rendered", 0.0, False), ("flare 35%", 0.35, False),
        ("flare 60%", 0.60, False), ("deuteranope", 0.0, True)]

rows = ""
for name, f in THEMES:
    cells = ""
    for label, flare, cvd in cols:
        filt = 'filter:url(#deut) blur(0.7px);' if cvd else 'filter:blur(0.7px);'
        veil = (f'<div style="position:absolute;inset:0;background:#fff;'
                f'opacity:{flare};pointer-events:none"></div>' if flare else '')
        cells += (f'<div class="c"><div class="wrap"><img style="{filt}" '
                  f'src="data:image/png;base64,{b64(f)}">{veil}</div>'
                  f'<div class="lab">{label}</div></div>')
    rows += f'<div class="row"><div class="rl">{name}</div>{cells}</div>'

html = f"""<style>
body{{margin:0;padding:16px;background:#4a4a4a;font:12px system-ui;color:#fff}}
.row{{display:flex;gap:10px;align-items:flex-start;margin-bottom:14px}}
.rl{{width:96px;font-weight:700;font-size:13px;padding-top:28px}}
.c{{flex:1}}
.wrap{{position:relative;line-height:0;border-radius:3px;overflow:hidden}}
img{{width:100%;display:block}}
.lab{{padding-top:4px;font-size:11px;opacity:.85}}
</style>
<svg width="0" height="0" style="position:absolute">
  <filter id="deut" color-interpolation-filters="linearRGB">
    <feColorMatrix type="matrix" values="
      0.625 0.375 0     0 0
      0.700 0.300 0     0 0
      0     0.300 0.700 0 0
      0     0     0     1 0"/>
  </filter>
</svg>
{rows}"""

out = SH / "sim.html"; out.write_text(html)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1500, "height": 900})
    pg.goto(f"file://{out}", wait_until="networkidle"); pg.wait_for_timeout(500)
    pg.screenshot(path=str(SH / "sim-sheet.png"), full_page=True)
    b.close()
print("wrote", SH / "sim-sheet.png")

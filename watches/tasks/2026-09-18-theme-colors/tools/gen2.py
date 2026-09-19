#!/usr/bin/env python3
"""Rebuild slides.md and the per-theme art from a theme list.
Reconstructed after the scratchpad was cleared; the slide template is lifted
verbatim out of the existing slides.md so nothing is retyped."""
import pathlib as _pl
_HERE = _pl.Path(__file__).resolve().parent
_DECK = _HERE.parent / "deck"
_OUT  = _HERE.parent / "out"
_OUT.mkdir(exist_ok=True)
import re, shutil, pathlib, sys
sys.path.insert(0, str(_HERE))
from lib import load_themes, contrast, mix, de76, cvd, lightness_ratio

SCRATCH = pathlib.Path(str(_HERE))
ROOT = _DECK
ART = ROOT / "public" / "timekeepers"
OLD_ACCENT, OLD_STRUCT, OLD_INK = "#e0b25a", "#6f6a60", "#f0e9dc"

themes = [t for t in load_themes() if t["name"] != "Claret"]   # converged with Registry

# ---- three white-on-navy additions
NAVY = [
    ("Beacon",       "#0F1C33", "#FFC24E", "#8FBEEA", "deep navy, gold, sky blue"),
    ("Conservatory", "#14243F", "#FFC24E", "#93D096", "navy, gold, green"),
    ("Blueprint",    "#101E38", "#5FD0E8", "#F5B23C", "navy, cyan primary, amber second"),
]
n = max(int(t["key"][1:]) for t in themes)
for name, bg, accent, warn, blurb in NAVY:
    n += 1
    ink = "#FFFFFF"
    panel = mix(bg, ink, 0.07)
    muted = next(m for m in (mix(ink, bg, t / 100) for t in range(65, -1, -1))
                 if contrast(m, panel) >= 4.6)
    themes.append(dict(key=f"t{n}", name=name, blurb=blurb, bg=bg, ink=ink,
                       muted=muted, accent=accent, warn=warn,
                       panel=panel, border=mix(bg, ink, 0.18)))

# ---- art
for t in themes:
    out = ART / t["key"]
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    struct = mix(t["ink"], t["bg"], 0.5)
    for svg in sorted(ART.glob("*.svg")):
        s = svg.read_text()
        s = s.replace(OLD_ACCENT, t["accent"]).replace(OLD_STRUCT, struct).replace(OLD_INK, t["ink"])
        (out / svg.name).write_text(s)

# ---- slides
head = (SCRATCH / "head.txt").read_text()
tmpl = (SCRATCH / "tmpl.txt").read_text()
tail = (SCRATCH / "tail.txt").read_text()

def render(t, num):
    s = tmpl
    s = s.replace("class: tk-slide tk-t7", f"class: tk-slide tk-{t['key']}")
    s = s.replace("/timekeepers/t7/", f"/timekeepers/{t['key']}/")
    s = s.replace(".tk-slide.tk-t7 {", f".tk-slide.tk-{t['key']} {{")
    s = re.sub(r'<div class="tk-swatch">\d+ &mdash; .+?</div>',
               f'<div class="tk-swatch">{num} &mdash; {t["name"]}</div>', s)
    s = re.sub(r"/\* ---- theme \d+: .+? ---- \*/",
               f"/* ---- theme {num}: {t['name']} - {t['blurb']} ---- */", s)
    for var in ("ink", "muted", "accent", "warn", "panel", "border"):
        s = re.sub(rf"--tk-{var}: (#[0-9A-Fa-f]{{6}}|rgba\([^)]*\));",
                   f"--tk-{var}: {t[var]};", s)
    s = re.sub(r"\n  background: #[0-9A-Fa-f]{6};", f"\n  background: {t['bg']};", s)
    return s

(ROOT / "slides.md").write_text(
    head + "".join(render(t, i) for i, t in enumerate(themes, start=2)) + tail)

# ---- metrics
print(f"{'#':>3} {'theme':<24}{'bg':<9} {'ink':>5} {'acc/p':>6} {'2nd/p':>6} "
      f"{'mut/p':>6} {'a-v-ink':>8} {'CVD':>6} {'light':>6}")
for i, t in enumerate(themes, start=2):
    p = t["panel"] if t["panel"].startswith("#") else t["bg"]
    print(f"{i:>3} {t['name']:<24}{t['bg']:<9} {contrast(t['ink'],t['bg']):>5.1f} "
          f"{contrast(t['accent'],p):>6.2f} {contrast(t['warn'],p):>6.2f} "
          f"{contrast(t['muted'],p):>6.2f} {de76(t['accent'],t['ink']):>8.1f} "
          f"{cvd(t['accent'],t['warn']):>6.1f} {lightness_ratio(t['accent'],t['warn']):>6.2f}")
print(f"\n{len(themes)} themes, slides 2-{len(themes)+1}")

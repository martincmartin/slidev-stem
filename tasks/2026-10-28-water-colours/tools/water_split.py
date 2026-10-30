"""The two water colours of each palette: the pool's water as drawn (the old
water at 0.6 over the background) and its edge as drawn (the old water at 0.7
over that)."""

from lib import contrast, house_palettes, lch, palette_recipes, resolve

for name in house_palettes():
    palette = resolve(palette_recipes(name))
    paper, panel = palette["background"], palette["panel"]
    old = palette["water"]
    wash = old.blend(paper, 0.6)
    edge = old.blend(wash, 0.7)
    pale = old.blend(paper, 0.18)
    light, chroma, hue = lch(wash)
    edge_light, edge_chroma, edge_hue = lch(edge)
    print(
        f"{name:20} old {old.hex} wash {wash.hex} (L {light:4.1f} C {chroma:4.1f} h {hue:5.1f})"
        f" edge {edge.hex} (L {edge_light:4.1f} C {edge_chroma:4.1f} h {edge_hue:5.1f})"
        f" | wash/panel {contrast(wash, panel):4.2f} wash/paper {contrast(wash, paper):4.2f}"
        f" edge/wash {contrast(edge, wash):4.2f} 18%/panel {contrast(pale, panel):4.2f}"
        f" subject/wash {contrast(palette['subject'], wash):4.2f}"
    )

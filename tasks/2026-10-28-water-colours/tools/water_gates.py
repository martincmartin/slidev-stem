"""The pool's water (the water colour at 0.6) against the wash gates."""

from lib import contrast, house_palettes, palette_recipes, resolve

for name in house_palettes():
    palette = resolve(palette_recipes(name))
    paper, panel = palette["background"], palette["panel"]
    water = palette["water"]
    body = water.blend(paper, 0.6)
    print(
        f"{name:20} water on paper {contrast(water, paper):5.2f}"
        f"  body on paper {contrast(body, paper):4.2f}  body on panel {contrast(body, panel):4.2f}"
        f"  water line on body {contrast(water, body):4.2f}"
        f"  subject on body {contrast(palette['subject'], body):4.2f}"
        f"  ink on body {contrast(palette['ink'], body):4.2f}"
        f"  ink at 0.5 on body {contrast(palette['ink'].blend(paper, 0.5), body):4.2f}"
        f"  water==subject {water == palette['subject']}"
    )

"""Measure the layout of Bartosz Ciechanowski's "Mechanical Watch" page.

    curl -sSL -o PAGE.html https://ciechanow.ski/mechanical-watch/
    python3 -I experiments/bartosz.py PAGE.html > evidence/bartosz.json

Keep the downloaded page outside the repo: it is his work. The script reads
the HTML only (no scripts run). It counts the words of the prose, the
figures (`drawer_container`), the sliders (`slider_assembly`), the section
anchors (`hanchor`), the captions, and the part names that the prose sets in
a part's colour (`<span class="color_...">`), and the words between two
figures.
"""

import json
import re
import statistics
import sys
from collections import Counter
from pathlib import Path


def text_of(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html)


def main() -> None:
    html = Path(sys.argv[1]).read_text(encoding="utf-8")
    paragraphs = re.findall(r"<p>(.*?)</p>", html, re.S)
    words = len(" ".join(text_of(paragraph) for paragraph in paragraphs).split())
    coloured = re.findall(r'<span class="(color_[a-z_]+)">(.*?)</span>', html, re.S)
    between = [
        len(text_of(" ".join(re.findall(r"<p>(.*?)</p>", chunk, re.S))).split())
        for chunk in html.split('class="drawer_container')
    ]
    quartiles = statistics.quantiles(between, n=4)
    result = {
        "prose_words": words,
        "paragraphs": len(paragraphs),
        "paragraphs_with_a_coloured_name": sum("color_" in paragraph for paragraph in paragraphs),
        "figures": html.count('class="drawer_container'),
        "sliders": html.count('class="slider_assembly"'),
        "section_anchors": html.count('class="hanchor"'),
        "figcaptions": html.count("<figcaption"),
        "coloured_names": len(coloured),
        "coloured_names_in_bold": sum("<strong>" in name for _, name in coloured),
        "colours": len({colour for colour, _ in coloured}),
        "most_coloured_names": Counter(
            text_of(name).strip().lower() for _, name in coloured
        ).most_common(10),
        "words_between_figures": {
            "median": statistics.median(between),
            "quartiles": [quartiles[0], quartiles[2]],
            "max": max(between),
        },
        "global_pause_link": "global_animate(false)" in html,
    }
    json.dump(result, sys.stdout, indent=2)
    print()


if __name__ == "__main__":
    main()

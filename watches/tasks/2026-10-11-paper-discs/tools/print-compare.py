"""Compare each printed watch page of two built decks, in each engine.

    uv run python tasks/2026-10-11-paper-discs/tools/print-compare.py BEFORE AFTER OUT   # in watches/

BEFORE and AFTER are built decks (`pnpm build --out DIR`). It finds the
positions that show the watch by walking AFTER live in Chromium, then loads
each printed page of both decks in each engine. It writes the pages that
differ, and summary.json, to OUT.
"""
import io, json, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
sys.path.insert(0, str(Path.cwd() / "art"))
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
from print_check import Findings, launch, open_page, show, still_loaded, walk_live, watch_state

before, after, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
out.mkdir(parents=True, exist_ok=True)
live, gl, _ = walk_live(after, "chromium")
positions = [view.position for view in live if view.watch != "null"]
print(len(positions), "positions with the watch;", gl, flush=True)

def shoot(job):
    engine, name, deck = job
    shots = {}
    with sync_playwright() as playwright:
        browser = launch(playwright, engine)
        page = open_page(browser, deck, Findings())
        for position in positions:
            slide = position.slide
            show(page, f"{slide}?print=clicks&clicks={position.click}", slide)
            page.wait_for_function("s => { const i = document.querySelector(`[data-slidev-no=\"${s}\"] .watch-still-image`); return i && i.naturalWidth > 0; }", arg=slide)
            png = page.screenshot()
            shots[(position.slide, position.click)] = png
        browser.close()
    return engine, name, shots

jobs = [(engine, name, deck) for engine in ("chromium", "firefox", "webkit") for name, deck in (("before", before), ("after", after))]
with ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(shoot, jobs))
by = {(engine, name): shots for engine, name, shots in results}
summary = {}
for engine in ("chromium", "firefox", "webkit"):
    rows = []
    for key in by[(engine, "before")]:
        first = np.asarray(Image.open(io.BytesIO(by[(engine, "before")][key])).convert("RGB"), dtype=np.int16)
        second = np.asarray(Image.open(io.BytesIO(by[(engine, "after")][key])).convert("RGB"), dtype=np.int16)
        delta = np.abs(first - second).max(axis=2)
        visible = int((delta > 32).sum())
        differ = int((delta > 0).sum())
        if differ:
            Image.open(io.BytesIO(by[(engine, "before")][key])).save(out / f"{engine}-{key[0]}-{key[1]}-before.png")
            Image.open(io.BytesIO(by[(engine, "after")][key])).save(out / f"{engine}-{key[0]}-{key[1]}-after.png")
        rows.append({"slide": key[0], "click": key[1], "differ": differ, "visible": visible})
    summary[engine] = rows
    changed = [r for r in rows if r["differ"]]
    print(engine, f"{len(changed)} of {len(rows)} pages differ;", sum(r["differ"] for r in rows), "px differ,", sum(r["visible"] for r in rows), "visibly")
    for r in changed:
        print("   ", r)
(out / "summary.json").write_text(json.dumps(summary, indent=1))

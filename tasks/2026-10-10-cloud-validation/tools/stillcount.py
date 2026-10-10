import sys, time
from pathlib import Path
import print_check as pc
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=pc.launch(p,"chromium")
    for deck in sys.argv[1:]:
        f=pc.Findings(); pg=pc.open_page(b,Path(deck),f)
        for path,slide in [("3?print=clicks&clicks=2",3),("8?print=clicks&clicks=0",8)]:
            t=time.perf_counter(); pc.show(pg,path,slide); dt=time.perf_counter()-t
            print(Path(deck).name, path, f"{dt:.2f}s", "stills with image:", pg.evaluate("() => document.querySelectorAll('.watch-still-image').length"), "still divs:", pg.evaluate("() => document.querySelectorAll('.watch-still').length"), f.problems)
        pg.close()
    b.close()

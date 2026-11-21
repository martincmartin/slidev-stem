import sys
from playwright.sync_api import sync_playwright
out = sys.argv[1]
base = "http://localhost:5199/#tilt={tilt}&turn={turn}&scale={scale}&target=808.000%2C276.000%2C4.688&speed=0&guides=0"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"])
    page = b.new_page(viewport={"width": 1280, "height": 800})
    for scale in ["0.66515000", "1.6000000"]:
        for turn in ["0.00", "90.00"]:
            for tilt in ["0.00", "60.00", "85.00", "89.00", "89.90", "90.00"]:
                page.goto("about:blank"); page.goto(base.format(tilt=tilt, turn=turn, scale=scale)); page.wait_for_timeout(1500)
                page.screenshot(path=f"{out}/s{scale[:4]}-turn{turn[:-3]}-tilt{tilt}.png")
    b.close()

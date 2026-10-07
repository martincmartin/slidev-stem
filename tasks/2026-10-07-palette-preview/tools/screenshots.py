"""Screenshot slides 2-5 at clicks 0 and 1, by stepping as a viewer does."""
import mimetypes, pathlib, sys
from playwright.sync_api import sync_playwright
DECK = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(exist_ok=True)
def answer(route):
    path = route.request.url.split("://", 1)[1].split("/", 1)[1].split("?")[0]
    file = DECK / path
    if not file.is_file(): file = DECK / "index.html"
    route.fulfill(body=file.read_bytes(), content_type=mimetypes.guess_type(str(file))[0] or "text/html")
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    page = browser.new_page(viewport={"width": 980, "height": 552})
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: m.type == "error" and errors.append(m.text))
    page.route("**/*", answer)
    page.goto("http://deck.test/2")
    page.wait_for_timeout(4000)
    for slide in (2, 3, 4, 5):
        page.screenshot(path=str(OUT / f"slide{slide}-click0.png"))
        page.keyboard.press("ArrowRight"); page.wait_for_timeout(3500)
        page.screenshot(path=str(OUT / f"slide{slide}-click1.png"))
        for _ in range(3): page.keyboard.press("ArrowRight"); page.wait_for_timeout(1500)
        page.wait_for_timeout(3000)
    browser.close()
print("errors:", errors)

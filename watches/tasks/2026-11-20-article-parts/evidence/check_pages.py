"""Checks the article's pages in Chromium, Firefox and WebKit, live and with
JavaScript off. Prints one line for each check, and FAIL lines."""

import sys
from playwright.sync_api import sync_playwright

base, out_dir = sys.argv[1], sys.argv[2]
EXPECTED_LINKS = {
    1: ["Part 1: Mechanical Marvels", "Part 2: Changed The World"],
    2: ["Part 1: Mechanical Marvels", "Part 2: Changed The World"],
    3: [
        "Part 1: Mechanical Marvels",
        "Part 2: Changed The World",
        "Part 3: Look Good on Your Wrist",
    ],
}
EXPECTED_NEXT = {1: "Next: Part 2: Changed The World", 2: None, 3: None}
failures = 0


def check(label, ok, detail=""):
    global failures
    if not ok:
        failures += 1
    print(("ok   " if ok else "FAIL ") + label + (f": {detail}" if detail else ""))


with sync_playwright() as playwright:
    for engine in [playwright.chromium, playwright.firefox, playwright.webkit]:
        for javascript in [True, False]:
            browser = engine.launch()
            context = browser.new_context(
                viewport={"width": 1280, "height": 900}, java_script_enabled=javascript
            )
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            mode = f"{engine.name} {'live' if javascript else 'no-js'}"
            page.goto(f"{base}/article/")
            page.wait_for_url("**/article/1/", timeout=15000)
            check(f"{mode}: /article/ goes to part 1", page.url.endswith("/article/1/"))
            for part in [1, 2, 3]:
                page.goto(f"{base}/article/{part}/")
                page.locator("header.article-header").wait_for()
                if javascript:
                    page.wait_for_timeout(3000)
                links = page.locator(".article-parts li").all_inner_texts()
                check(
                    f"{mode}: part {part} links", links == EXPECTED_LINKS[part], str(links)
                )
                current = page.locator('.article-parts [aria-current="page"]').all_inner_texts()
                check(f"{mode}: part {part} marks itself", len(current) == 1 and current[0].startswith(f"Part {part}:"), str(current))
                nexts = page.locator(".article-next a").all_inner_texts()
                want = EXPECTED_NEXT[part]
                check(f"{mode}: part {part} next link", nexts == ([want] if want else []), str(nexts))
                figures = page.locator("figure.article-figure").count()
                stills = page.locator("img.article-figure-still").count()
                if javascript:
                    canvases = page.locator("figure.article-figure canvas").count()
                    check(f"{mode}: part {part} figures are live", figures > 0 and canvases >= 1, f"{figures} figures, {canvases} canvases")
                else:
                    broken = page.evaluate(
                        "[...document.querySelectorAll('img.article-figure-still')].filter(i => !(i.complete && i.naturalWidth > 0)).length"
                    )
                    check(f"{mode}: part {part} stills load", stills == figures and stills > 0 and broken == 0, f"{stills} stills, {broken} broken")
                credits = page.locator("h3", has_text="Credits & Sources").count()
                check(f"{mode}: part {part} has the credits once", credits == 1, str(credits))
                if engine.name == "webkit" or part == 2:
                    page.screenshot(path=f"{out_dir}/{engine.name}-{'live' if javascript else 'nojs'}-part{part}.png")
            check(f"{mode}: no page errors", not errors, "; ".join(errors[:3]))
            browser.close()

print(f"{failures} failures")
sys.exit(1 if failures else 0)

"""Check painted reference pixels above the board and WebGL spring, offline."""

import json
import mimetypes
import re
from pathlib import Path
from urllib.parse import urlparse

import numpy as np
from PIL import Image
from playwright.sync_api import Route, sync_playwright

TASK = Path(__file__).resolve().parent
EVIDENCE = TASK / "evidence"
BUILD = TASK / "deck"


def reference_pixels(full: Path, isolated: Path, colour: list[int]) -> tuple[int, int]:
    painted = np.array(Image.open(full).convert("RGB"), dtype=np.int16)
    reference = np.array(Image.open(isolated).convert("RGB"), dtype=np.int16)
    mask = np.max(np.abs(reference - np.array(colour)), axis=2) == 0
    covered = mask & (np.max(np.abs(painted - reference), axis=2) > 1)
    return int(mask.sum()), int(covered.sum())


def main() -> None:
    results = {}
    with sync_playwright() as playwright:
        for browser_type, slide in (
            (playwright.chromium, 2),
            (playwright.firefox, 2),
        ):
            label = f"{browser_type.name}-slide-{slide}"
            browser = browser_type.launch()
            page = browser.new_page(
                viewport={"width": 980, "height": 552}, device_scale_factor=2
            )
            errors: list[str] = []
            outside: list[str] = []
            page.on(
                "pageerror", lambda error, captured=errors: captured.append(str(error))
            )
            page.add_init_script("""Object.defineProperty(navigator, 'wakeLock', {
                value: {request: async () => ({addEventListener() {}, release: async () => {}})}
            });""")

            def serve(route: Route, blocked: list[str] = outside) -> None:
                url = urlparse(route.request.url)
                if url.netloc != "deck.test":
                    blocked.append(route.request.url)
                    route.abort()
                    return
                path = BUILD / url.path.lstrip("/")
                if not path.is_file():
                    path = BUILD / "index.html"
                route.fulfill(
                    body=path.read_bytes(),
                    content_type=mimetypes.guess_type(path)[0]
                    or "application/octet-stream",
                )

            page.route("**/*", serve)
            # Click 3 freezes the SVG clock. Show its board explicitly for the
            # paint-order probes, without starting the component's frame loop.
            page.goto(f"http://deck.test/{slide}?clicks=3")
            page.wait_for_selector(f".slidev-page-{slide} .diving-board svg")
            page.wait_for_timeout(1000)
            page.evaluate("""() => {
                window.layerHost = document.querySelector(`.slidev-page-${location.pathname.split('/').at(-1)} .diving-board`);
                window.layerSvg = layerHost.querySelector('svg');
                window.liveBoard = layerSvg.querySelector('[data-layer=board]');
                window.reference = layerSvg.querySelector('[data-layer=rest]');
                window.watchCanvas = document.querySelector('.watch-canvas');
                if (!(liveBoard.compareDocumentPosition(reference) & Node.DOCUMENT_POSITION_FOLLOWING))
                    throw new Error('The reference must follow the board in SVG paint order.');
            }""")
            stroke = page.evaluate("getComputedStyle(reference).stroke")
            colour = [int(value) for value in re.findall(r"\d+", stroke)]
            assert len(colour) == 3, stroke
            phases = []
            for name, fraction in (
                ("straight", None),
                ("curl-early", 0.2),
                ("curl-late", 0.55),
                ("curled", 1),
                ("spring", 1),
            ):
                page.evaluate(
                    """({fraction, spring}) => {
                    liveBoard.style.visibility = '';
                    liveBoard.style.opacity = spring ? '0' : '1';
                    watchCanvas.style.visibility = spring ? '' : 'hidden';
                    layerSvg.setCurrentTime(fraction === null ? 0 : Number(layerSvg.dataset.curlStart) + fraction*Number(layerSvg.dataset.curlDuration));
                }""",
                    {"fraction": fraction, "spring": name == "spring"},
                )
                full = EVIDENCE / f"layering-{label}-{name}.png"
                isolated = EVIDENCE / f"layering-{label}-{name}-reference.png"
                page.screenshot(path=str(full))
                page.evaluate(
                    "liveBoard.style.visibility='hidden'; watchCanvas.style.visibility='hidden'"
                )
                page.screenshot(path=str(isolated))
                count, covered = reference_pixels(full, isolated, colour)
                assert count > 1000, count
                assert covered == 0, (name, covered)
                phases.append(
                    {
                        "phase": name,
                        "solid_reference_pixels": count,
                        "covered_pixels": covered,
                    }
                )
                if name == "curled":
                    # A positive control proves that the pixel probe detects
                    # this bug when the old paint order is restored temporarily.
                    page.evaluate(
                        "liveBoard.style.visibility=''; layerSvg.insertBefore(reference,liveBoard)"
                    )
                    control = EVIDENCE / f"layering-{label}-old-order-control.png"
                    page.screenshot(path=str(control))
                    _, control_covered = reference_pixels(control, isolated, colour)
                    assert control_covered > 100, control_covered
                    page.evaluate("layerSvg.append(reference)")
            assert not errors, errors
            assert not outside, outside
            results[label] = {
                "phases": phases,
                "old_order_covered_pixels": control_covered,
                "errors": errors,
                "outside_requests": outside,
            }
            browser.close()
            print(
                f"{label}: no solid reference pixels covered in any phase",
                flush=True,
            )
    (EVIDENCE / "layering-checks.json").write_text(json.dumps(results, indent=2) + "\n")


if __name__ == "__main__":
    main()

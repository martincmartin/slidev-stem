from pathlib import Path

import fade_check
import pytest
from playwright.sync_api import sync_playwright

READY = "<script>window.watchProbeReady = true</script>"
BROKEN = "<script>throw new Error('no renderer')</script>"


def test_the_probe_page_is_ready_or_fails_at_its_first_error(tmp_path: Path) -> None:
    (tmp_path / "ready.html").write_text(READY)
    (tmp_path / "broken.html").write_text(BROKEN)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        try:
            page = browser.new_page()
            page.set_default_timeout(5_000)
            fade_check.open_probe(page, (tmp_path / "ready.html").as_uri())
            page = browser.new_page()
            page.set_default_timeout(5_000)
            with pytest.raises(RuntimeError, match="no renderer"):
                fade_check.open_probe(page, (tmp_path / "broken.html").as_uri())
        finally:
            browser.close()

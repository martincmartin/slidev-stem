import asyncio
from pathlib import Path

import pytest
import smokecheck


@pytest.mark.parametrize(
    ("fault", "passed"),
    [
        ("none", True),
        ("stall", False),
        ("early", False),
        ("missing", False),
        ("page-error", False),
        ("outside", False),
    ],
)
def test_smoke_checks_completion_and_browser_failures(
    tmp_path: Path, fault: str, passed: bool, capfd: pytest.CaptureFixture[str]
) -> None:
    document = """<div class="slidev-layout">slide</div><script>
    const fault = FAULT;
    let click = 0;
    window.slideNavigation = () => ({slide: 1, click, clicksTotal: 1,
      lastSlide: fault === 'early' ? 2 : 1,
      next: fault === 'early' || click === 1 ? null : {slide: 1, click: 1}});
    if (fault === 'missing') delete window.slideNavigation;
    if (fault === 'page-error') setTimeout(() => {throw Error('fixture error')}, 0);
    if (fault === 'outside') fetch('https://outside.test/image').catch(() => {});
    addEventListener('keydown', () => {
      if (fault === 'stall') return;
      setTimeout(() => { click = 1; history.pushState({}, '', '/1?clicks=1') }, 80);
    });
    </script>""".replace("FAULT", repr(fault))
    (tmp_path / "index.html").write_text(document)
    limits = smokecheck.SmokeLimits(
        ready_timeout_ms=500, move_timeout_ms=300, startup_ms=0, visit_ms=10
    )
    result = asyncio.run(smokecheck.check(tmp_path, "chromium", limits))
    assert (result == 0) is passed
    output = capfd.readouterr().out
    if passed:
        assert "2 positions; final 1:1" in output
    else:
        assert "FAIL" in output


@pytest.mark.parametrize("engine", ("chromium", "firefox", "webkit"))
@pytest.mark.parametrize("reads_canvas", (False, True))
def test_privacy_walk_in_each_engine(
    tmp_path: Path,
    engine: str,
    reads_canvas: bool,
) -> None:
    document = """<div class="slidev-layout">slide</div><script>
    window.slideNavigation = () => ({slide: 1, click: 0, clicksTotal: 0,
      lastSlide: 1, next: null});
    if (READS_CANVAS) {
      document.createElement('canvas').getContext('2d').getImageData(0, 0, 1, 1);
    }
    </script>""".replace("READS_CANVAS", str(reads_canvas).lower())
    (tmp_path / "index.html").write_text(document)
    limits = smokecheck.SmokeLimits(startup_ms=0, visit_ms=0)
    result = asyncio.run(
        smokecheck.check(
            tmp_path,
            engine,
            limits,
            no_canvas_readback=True,
        )
    )
    assert (result == 0) is not reads_canvas

import asyncio
from typing import cast

import offline_check
from playwright.async_api import Page


class FakeKeyboard:
    def __init__(self, page: FakePage) -> None:
        self.page = page

    async def press(self, key: str) -> None:
        if self.page.remaining:
            self.page.url = self.page.remaining.pop(0)


class FakePage:
    def __init__(self, remaining: list[str]) -> None:
        self.url = "http://deck.test/1"
        self.remaining = remaining
        self.keyboard = FakeKeyboard(self)

    async def wait_for_timeout(self, milliseconds: float) -> None:
        pass


def test_offline_fallback_rejects_a_walk_that_never_moves() -> None:
    problems: list[str] = []
    steps = asyncio.run(offline_check.walk(cast(Page, FakePage([])), problems))
    assert len(steps) == 1
    assert problems == ["the walk did not move from slide 1"]


def test_offline_fallback_accepts_a_walk_that_reaches_the_end() -> None:
    problems: list[str] = []
    steps = asyncio.run(
        offline_check.walk(cast(Page, FakePage(["http://deck.test/2"])), problems)
    )
    assert len(steps) == 2
    assert not problems


def test_offline_fallback_rejects_a_walk_that_hits_the_limit() -> None:
    problems: list[str] = []
    steps = asyncio.run(
        offline_check.walk(
            cast(Page, FakePage(["http://deck.test/2", "http://deck.test/3"])),
            problems,
            offline_check.WalkLimits(steps=3),
        )
    )
    assert len(steps) == 3
    assert problems == ["the walk did not end within 3 steps"]

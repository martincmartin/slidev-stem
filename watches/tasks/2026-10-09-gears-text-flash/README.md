# Gears text cues

[PLAN.md](PLAN.md) records the options and the timing decision.
The implementation waits for the current click's opacity transitions to finish.
It then runs the timeline's inverse flash on the marked span.
A new click cancels a cue that is still waiting for text.

## Evidence

`browser-results.json` holds samples from Chromium, Firefox, and WebKit.
Both texts reached full opacity before their first flash.
Each cue ran five cycles and used only its own span.
The first observed flash followed the completed transition by 4–8 ms.
Direct loads, backward steps, and a backward step during the fade started no cue.
The checks blocked outside requests and used fresh browser contexts.
WebKit is the automated Safari engine check. Safari itself was not tested.

The dependency reports `Failed to patch FloatingVue` on startup.
The focused check excludes that message. Other console errors and page errors fail the check.

## Run the focused check

From `watches/`, build the deck:

```bash
pnpm build --out /tmp/gears-deck
uv run tasks/2026-10-09-gears-text-flash/check_browser.py /tmp/gears-deck
```

`support/print_check.py` is the preserved local-request helper used by the check.
`source-before.zip` and `source-after.zip` preserve the changed files.
`baseline.txt` names the baseline commit. `change.patch` records the implementation.
The deck uses the talk's existing lockfiles and environments.

## Validation

The final full talk validation passed all 23 checks in 146.01 s.
The root's quick validation passed all eight shared-file checks in 21.26 s.
The focused browser check passed in all three engines with no outside requests.

2026-10-23: the talk no longer depends on Python's Playwright, which this
task's tools import. The talk's last version was playwright 1.63.0; the version
on the task's date is in that day's `uv.lock`. To run the tools again, add it
to the talk for that session (`uv add playwright==1.63.0`), and install the
browsers they use (`uv run python -m playwright install chromium`).

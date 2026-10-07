# Timing scopes

`before-timing.json` is the original complete serial validation.
`parallel-initial.json`, `parallel-before-rapid.json`, and `serial-before-rapid.json` are intermediate runs.
They omit the original rapid offline path. They are not the final coverage comparison.
`full-final.json` will hold full validation with both original browser paths retained.
`quick-final.json` intentionally excludes browser and rendered-art checks.

Each JSON file records one local run. It does not give a timing distribution.
The per-command times overlap in parallel runs.

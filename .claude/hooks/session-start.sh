#!/bin/bash
# Set up a Claude Code cloud session so that validation runs as on a laptop.
# See docs/talks.md ("Cloud sessions"). Local sessions do nothing here.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# pnpm 12 reads the lockfiles, and then switches to each project's pinned
# pnpm (devEngines). The image's pnpm 10 can do neither.
if ! pnpm --version 2>/dev/null | grep -q '^12\.'; then
  npm install --global pnpm@12.10.1
fi

# An older uv does not know the pinned Python (.python-version).
uv self update || echo "uv self update failed; keeping $(uv --version)" >&2

# Each project installs from its own lockfiles: the root, then each talk in
# progress. A given talk (a given/<talk>/... tag) is not touched (AGENTS.md).
uv sync --locked
pnpm install --frozen-lockfile
for slides in */slides.md; do
  talk="${slides%/slides.md}"
  if [ -n "$(git tag --list "given/$talk/*")" ]; then
    continue
  fi
  (cd "$talk" && pnpm install --frozen-lockfile && uv sync --locked)
done

# The browser engines, and the system libraries WebKit needs (apt).
uv run python -m playwright install chromium firefox webkit
uv run python -m playwright install-deps webkit

# Headless Firefox has WebGL only with an X display. Without one, on a machine
# with no GPU, it draws no watch, and the private-browsing check fails.
if ! pgrep -x Xvfb >/dev/null; then
  nohup Xvfb :99 -screen 0 1280x1024x24 >/dev/null 2>&1 &
fi
echo 'export DISPLAY=:99' >> "$CLAUDE_ENV_FILE"

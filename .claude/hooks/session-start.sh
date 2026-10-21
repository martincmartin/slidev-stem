#!/bin/bash
# Set up a Claude Code cloud session so that validation runs as on a laptop.
# See docs/talks.md ("Cloud sessions"). Local sessions do nothing here.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# The user-level instructions come from the cloud environment's setup script,
# which installs agent-house. An environment without it gives no error of its
# own, so say so here: this output goes into Claude's context.
if [ ! -e "$HOME/.claude/CLAUDE.md" ]; then
  echo "WARNING: this cloud environment has no ~/.claude/CLAUDE.md, so the" \
    "user's own instructions are missing. Before you do anything else, tell" \
    "the user that the environment's setup script does not install" \
    "agent-house (see https://github.com/martincmartin/agent-house#claude-code-cloud-sessions)."
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
# progress. A retired talk (a retired/<talk>/... tag) is not touched
# (AGENTS.md). A talk that you gave is still in progress.
uv sync --locked
pnpm install --frozen-lockfile
for slides in */slides.md; do
  talk="${slides%/slides.md}"
  if [ -n "$(git tag --list "retired/$talk/*")" ]; then
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

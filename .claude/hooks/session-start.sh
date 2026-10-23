#!/bin/bash
# Set up a Claude Code cloud session so that validation runs as on a laptop.
# See docs/talks.md ("Cloud sessions"). Local sessions do nothing here.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# A failed step stops the setup. Say so on stdout, and exit 0: only then does
# Claude Code add the hook's output to Claude's context. A hook's stderr shows
# only to the user, as a hook error notice; Claude does not see it.
trap 'echo "WARNING: the session setup (.claude/hooks/session-start.sh) failed at line $LINENO: $BASH_COMMAND. Validation will not work until it is fixed: tell the user before anything else."; exit 0' ERR

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

# An older uv does not know the pinned Python (.python-version). `uv self
# update` works only for a uv from Astral's installer; an image may copy the
# binary in, and the network policy may block astral.sh. Then upgrade it from
# PyPI, into ~/.local/bin, where the image's uv is.
uv self update || python3 -m pip install --quiet --user --upgrade --ignore-installed uv

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

# The system libraries WebKit needs (apt), then the browser engines: the
# install fails if a browser's libraries are missing.
uv run python -m playwright install-deps webkit
uv run python -m playwright install chromium firefox webkit

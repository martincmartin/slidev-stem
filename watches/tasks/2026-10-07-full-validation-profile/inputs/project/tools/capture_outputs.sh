#!/usr/bin/env bash
# Capture every tool's output into one directory, so that two captures (before
# and after a change to the tools) can be compared with `diff -r`. Run in stem/:
#
#     tools/capture_outputs.sh OUT_DIR TALK_DIR [PYTHON] [DECK_BUILD]
#
# TALK_DIR is the talk whose art the tools check (for example, watches). A
# given talk is not checked again, so a tool never has a default talk. PYTHON
# runs every tool (default: .venv/bin/python3). DECK_BUILD is a
# `slidev build --out` directory for offline_check.py; without it, that tool
# is skipped. Each command's stdout, stderr and exit code go into one file.
set -u
out=$1
talk=${2:?usage: capture_outputs.sh OUT_DIR TALK_DIR [PYTHON] [DECK_BUILD]}
python=${3:-.venv/bin/python3}
build=${4:-}
mkdir -p "$out"

run() {  # run NAME COMMAND...
    local name=$1
    shift
    { "$@" 2>&1; echo "exit $?"; } > "$out/$name.txt"
}

run lib "$python" tools/lib.py
run palette "$python" tools/palette.py
run palette-talk "$python" tools/palette.py --talk "$talk"
run palette-candidate-accent "$python" tools/palette.py "#C0451C" accent
run palette-candidate "$python" tools/palette.py "6d839b"
run artcheck "$python" tools/artcheck.py "$talk/public"
run barroom "$python" tools/barroom.py "$talk/public" --save "$out/barroom-images"
run motion "$python" tools/motion.py "$talk/public"
run motion-venue "$python" tools/motion.py "$talk/public" --venue laptop --flare 0.1
run contact "$python" tools/contact.py "$talk/public" --out "$out/contact.png"

if [ -n "$build" ]; then
    run offline "$python" tools/offline_check.py "$build" 1:0 2:0 2:3
    run offline-clicks "$python" tools/offline_check.py "$build" --clicks 2 --presses 3 --back
fi
# Replace the directory's name with OUT, as plain text (sed -i differs between
# GNU and macOS, and would read the path as a pattern).
"$python" - "$out" <<'PYTHON'
import pathlib
import sys

directory = pathlib.Path(sys.argv[1])
for file in directory.glob("*.txt"):
    file.write_text(file.read_text().replace(str(directory), "OUT"))
PYTHON

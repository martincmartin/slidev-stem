#!/usr/bin/env bash
# Capture every tool's output into one directory, so that two captures (before
# and after a change to the tools) can be compared with `diff -r`. Run in stem/:
#
#     tools/capture_outputs.sh OUT_DIR [PYTHON] [DECK_BUILD]
#
# PYTHON runs every tool (default: .venv/bin/python3). DECK_BUILD is a
# `slidev build --out` directory for offline_check.py; without it, that tool
# is skipped. Each command's stdout, stderr and exit code go into one file.
set -u
out=$1
python=${2:-.venv/bin/python3}
build=${3:-}
mkdir -p "$out"

run() {  # run NAME COMMAND...
    local name=$1
    shift
    { "$@" 2>&1; echo "exit $?"; } > "$out/$name.txt"
}

run lib "$python" tools/lib.py
run palette "$python" tools/palette.py --talk watches
run palette-candidate-accent "$python" tools/palette.py "#C0451C" accent
run palette-candidate "$python" tools/palette.py "6d839b"
run artcheck "$python" tools/artcheck.py watches/public
run artcheck-cover "$python" tools/artcheck.py watches/public/cover/skeleton-watch.svg
run barroom "$python" tools/barroom.py watches/public --save "$out/barroom-images"
run barroom-cover "$python" tools/barroom.py watches/public/cover/skeleton-watch.svg
run motion "$python" tools/motion.py watches/public
run motion-cover "$python" tools/motion.py watches/public/cover/skeleton-watch.svg --sep 1
run motion-venue "$python" tools/motion.py watches/public/timekeepers --venue laptop --flare 0.1
run contact "$python" tools/contact.py watches/public --out "$out/contact.png"

if [ -n "$build" ]; then
    run offline "$python" tools/offline_check.py "$build" 1:0 2:0 2:3
    run offline-clicks "$python" tools/offline_check.py "$build" --clicks 2 --presses 3 --back
fi
sed -i "s|$out|OUT|g" "$out"/*.txt

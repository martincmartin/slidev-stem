#!/usr/bin/env bash
# Run each candidate check once on the current code, and count what it finds.
# Run in stem/. Output: evidence/survey.txt (see PLAN.md, "Other checks").
set -u
scratch=$(mktemp -d)
echo "date: $(date +%F)"
echo "=== ruff rule families beyond the defaults (tools/ and watches/art/)"
for family in I UP B SIM C4 PTH RUF N PERF PL S D; do
  count=$(uv run --quiet ruff check --isolated --target-version py314 --select "$family" \
    --output-format concise tools watches/art 2>/dev/null | grep -c -E '^[^ ].*:[0-9]+:[0-9]+:')
  echo "  $family: $count"
done
uv run --quiet ruff check --isolated --target-version py314 --select B,RUF,PERF,S,PL \
  --statistics tools watches/art 2>/dev/null
echo "=== pyright, typeCheckingMode strict (config in the project, then removed)"
for pair in ".:tools" "watches:art"; do
  project=${pair%%:*} code=${pair##*:}
  (cd "$project" &&
    printf '{"include":["%s"],"typeCheckingMode":"strict","pythonVersion":"3.14","venvPath":".","venv":".venv"}' "$code" > pyrightconfig.json &&
    uv run --quiet pyright > "$scratch/strict.txt" 2>&1
    rm pyrightconfig.json
    echo "  $project/$code: $(tail -1 "$scratch/strict.txt")"
    grep -o '(report[A-Za-z]*)' "$scratch/strict.txt" | sort | uniq -c | sort -rn | sed 's/^/    /')
done
echo "=== ty, on the code only"
echo "  tools: $(uvx ty check --python .venv tools 2>&1 | tail -1)"
echo "  watches/art: $(cd watches && uvx ty check --python .venv art 2>&1 | tail -1)"
echo "=== ty through uv check (whole project, frozen tasks included)"
echo "  stem: $(uv check 2>&1 | tail -1)"
echo "  watches: $(cd watches && uv check 2>&1 | tail -1)"
echo "=== vulture, confidence >= 60%"
uvx vulture tools watches/art --min-confidence 60 2>&1 | grep -v '^Installed' | sed 's/^/  /'
echo "  (end)"
echo "=== deptry (watches, tasks excluded)"
(cd watches && uvx deptry . --extend-exclude tasks --no-ansi 2>&1 | grep -E 'DEP0|Found' | sed 's/^/  /')
echo "=== uv audit"
echo "  stem: $(uv audit --locked 2>&1 | tail -1)"
echo "  watches: $(cd watches && uv audit --locked 2>&1 | tail -1)"
echo "=== pnpm audit"
echo "  stem: $(pnpm audit 2>&1 | tail -1)"
echo "  watches:"
(cd watches && pnpm audit --json 2>/dev/null) | python3 -c '
import json, sys
for advisory in json.load(sys.stdin).get("advisories", {}).values():
    path = advisory["findings"][0]["paths"][0]
    fields = (advisory["severity"], advisory["module_name"], advisory["vulnerable_versions"], path.split(">")[2])
    print("    %-8s %s %s, via %s" % fields)
'
echo "=== codespell"
uvx codespell tools docs themes/ledger watches/art watches/docs watches/slides.md \
  watches/components AGENTS.md 2>&1 | grep -v '^Installed' | sed 's/^/  /'
echo "  (end)"
echo "=== shellcheck"
uvx --from shellcheck-py shellcheck tools/capture_outputs.sh 2>&1 | grep -v -E '^(Installed|Downloading| Downloaded)'
echo "  exit ${PIPESTATUS[0]}"
echo "=== deck build and offline_check, seconds"
start=$(date +%s)
(cd watches && pnpm exec slidev build --out "$scratch/deck" > /dev/null 2>&1)
middle=$(date +%s)
uv run tools/offline_check.py "$scratch/deck" 1:0 2:0 3:0 > /dev/null 2>&1
echo "  build $((middle - start)), offline_check $(($(date +%s) - middle)), exit $?"
echo "=== validate.py itself, seconds"
start=$(date +%s)
uv run tools/validate.py watches > "$scratch/validate.txt" 2>&1
echo "  $(($(date +%s) - start)) s: $(tail -1 "$scratch/validate.txt")"
rm -rf "$scratch"

#!/bin/sh
# Measure how the talks share dependencies now. Run in stem/.
# Output: evidence/measure.txt (see PLAN.md, "What is there").
set -u
echo "date: $(date +%F)"
echo "node $(node --version), pnpm $(pnpm --version), uv $(uv --version | cut -d' ' -f2)"
echo "pnpm-lock.yaml lines: $(wc -l < pnpm-lock.yaml)"
echo "pnpm-lock.yaml importers: $(awk '/^importers:/{f=1;next} /^[a-z]/{f=0} f && /^  [^ ]+:$/' pnpm-lock.yaml | tr -d ' :' | tr '\n' ' ')"
echo "top-level entries in stem/node_modules: $(ls node_modules | wc -l | tr -d ' ')"
echo "top-level entries in watches/node_modules: $(ls watches/node_modules | wc -l | tr -d ' ')"
du -sh node_modules watches/node_modules | sed 's/^/size: /'
echo "pins: .nvmrc/.node-version: $(ls .nvmrc .node-version 2>/dev/null | wc -l | tr -d ' ') files;" \
  "packageManager/devEngines in package.json: $(grep -l 'packageManager\|devEngines' package.json */package.json themes/*/package.json 2>/dev/null | wc -l | tr -d ' ') files"
echo "files outside a talk that a talk uses:"
grep -rln --include=*.py '"tools/[a-z_]*\.py"' watches/art | sed 's/^/  /'
grep -n 'slidev-theme-ledger\|theme:' watches/package.json watches/slides.md | head -3 | sed 's/^/  /'

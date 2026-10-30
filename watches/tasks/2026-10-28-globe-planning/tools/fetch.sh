#!/bin/sh
# Downloads the Natural Earth files that measure.ts reads, at the commit that
# the measurements used (evidence/natural-earth-commit.txt), into DIR.
#   sh tasks/2026-10-28-globe-planning/tools/fetch.sh DIR
# Natural Earth is in the public domain (https://www.naturalearthdata.com/about/terms-of-use/).
set -eu
[ $# -eq 1 ] || { echo "usage: fetch.sh DIR" >&2; exit 2; }
COMMIT=ca96624a56bd078437bca8184e78163e5039ad19
mkdir -p "$1"
for scale in 110m 50m 10m; do
  for layer in coastline land; do
    curl -sfL -o "$1/ne_${scale}_${layer}.geojson" \
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/$COMMIT/geojson/ne_${scale}_${layer}.geojson"
  done
done

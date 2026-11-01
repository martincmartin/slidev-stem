#!/bin/sh
# Downloads Natural Earth's land at 1:110m, 1:50m and 1:10m, at the commit
# that globe/earth.json was made from, into DIR, and writes the commit to
# DIR/SHA for art/earth-data.ts. Natural Earth is in the public domain
# (https://www.naturalearthdata.com/about/terms-of-use/).
#   sh art/fetch-earth.sh DIR
set -eu
[ $# -eq 1 ] || { echo "usage: fetch-earth.sh DIR" >&2; exit 2; }
COMMIT=ca96624a56bd078437bca8184e78163e5039ad19
mkdir -p "$1"
for scale in 110m 50m 10m; do
  curl -sfL -o "$1/ne_${scale}_land.geojson" \
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/$COMMIT/geojson/ne_${scale}_land.geojson"
done
echo "$COMMIT" > "$1/SHA"

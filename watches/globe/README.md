# The globe

The code of Part 2's globe and its story maps ([`docs/globe.md`](../docs/globe.md)).

- `earth.json`: Natural Earth's land at 1:110m, 1:50m and 1:10m, reduced by
  `art/earth-data.ts`. **Source:** [Natural Earth](https://www.naturalearthdata.com/),
  from [natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)
  at the commit that the file names. **Licence:** public domain
  ([terms of use](https://www.naturalearthdata.com/about/terms-of-use/)).
- `earth.ts`: its types, and the parser that checks it.
- `noon.ts`: what the Longitude From Time slide adds to the globe.

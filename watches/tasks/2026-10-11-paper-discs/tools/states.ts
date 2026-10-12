// The watch's state at each click of each slide, as JSON, for the probe:
//
//     node tasks/2026-10-11-paper-discs/tools/states.ts > out/states.json   # in watches/

import { deckSlides } from "../../../watch/deck.ts";
import { watchState } from "../../../watch/state.ts";

const frames: { name: string; state: object }[] = [];
for (const slide of await deckSlides()) {
  if (slide.frontmatter.hide === true) continue;
  const clicks = Number(slide.frontmatter.clicks ?? 0);
  let last = "";
  for (let click = 0; click <= clicks; click++) {
    const state = watchState(slide.frontmatter, click);
    if (state === undefined) continue;
    const text = JSON.stringify(state);
    if (text === last) continue; // the click changes only the text
    last = text;
    frames.push({ name: `${slide.title || "cover"} ${String(click)}`, state });
  }
}
process.stdout.write(`${JSON.stringify(frames, null, 1)}\n`);

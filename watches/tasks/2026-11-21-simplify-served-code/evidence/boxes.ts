const W = process.argv[2] + "/";
const { pictureBox, frameKey, figureMarks } = await import(W + "watch/article.ts");
const { deckSlides } = await import(W + "watch/deck.ts");
const { makeGlobe } = await import(W + "globe/model.ts");
const { makeArt } = await import(W + "watch/art.ts");
const { gearsMarks, escapementMarks } = await import(W + "watch/callouts.ts").catch(() => ({}));
const watch = makeArt(makeGlobe).art;
const out: unknown[] = [];
for (const s of await deckSlides()) {
  const total = Number(s.frontmatter["clicks"] ?? 0);
  for (let c = 0; c <= total; c++) {
    let marks: unknown;
    try { marks = figureMarks(watch, s.frontmatter, c); } catch (e) { marks = String(e); }
    out.push([pictureBox(watch, s.frontmatter, c), frameKey(s.frontmatter, c), marks]);
  }
}
console.log(JSON.stringify(out).length, (await import("node:crypto")).createHash("sha256").update(JSON.stringify(out)).digest("hex"));

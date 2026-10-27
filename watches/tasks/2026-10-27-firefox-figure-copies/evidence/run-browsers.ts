import { build } from "vite";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright-chromium"; import { firefox } from "playwright-firefox"; import { webkit } from "playwright-webkit";
await build({
  configFile: false, logLevel: "silent",
  build: { outDir: "/private/tmp/claude-501/-Users-martin-Develop-slidev-stem-work1-watches/466bfabd-8062-48df-bd62-3631e898297f/scratchpad/bundle", emptyOutDir: true, minify: false,
    lib: { entry: "/private/tmp/claude-501/-Users-martin-Develop-slidev-stem-work1-watches/466bfabd-8062-48df-bd62-3631e898297f/scratchpad/springtime.ts", formats: ["iife"], name: "springtime", fileName: () => "springtime.js" } },
});
const code = await readFile("/private/tmp/claude-501/-Users-martin-Develop-slidev-stem-work1-watches/466bfabd-8062-48df-bd62-3631e898297f/scratchpad/bundle/springtime.js", "utf8");
for (const engine of [chromium, firefox, webkit]) {
  const browser = await engine.launch();
  const page = await browser.newPage();
  await page.addScriptTag({ content: code });
  console.log(engine.name(), JSON.stringify(await page.evaluate(() => (globalThis as unknown as { results: unknown }).results)));
  await browser.close();
}

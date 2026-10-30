// Serve the spike, with the Natural Earth files (tools/fetch.sh) as its
// public files:
//   NE_DIR=... pnpm exec vite --config tasks/2026-10-28-globe-planning/spike/vite.config.ts
// `--host` serves it to a phone on the same network.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const directory = process.env["NE_DIR"];
if (directory === undefined) throw new Error("set NE_DIR to the Natural Earth files (tools/fetch.sh)");

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: directory,
  server: { port: 5199, strictPort: true },
});

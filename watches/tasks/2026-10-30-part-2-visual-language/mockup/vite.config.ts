// Serve the mockup. In watches/:
//   pnpm exec vite --config tasks/2026-10-30-part-2-visual-language/mockup/vite.config.ts
// It reads the house fonts from stem/themes/house, so it may serve files from
// the stem/ root.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  server: {
    port: 5200,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL("../../../../", import.meta.url))] },
  },
});

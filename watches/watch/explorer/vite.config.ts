// The explorer's server (`pnpm explore`). The theme is a link out of the
// talk, to ../themes/, so the server may read the whole repo.

import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    fs: { allow: [fileURLToPath(new URL("../../..", import.meta.url))] },
  },
});

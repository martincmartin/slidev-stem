import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  build: {
    outDir: fileURLToPath(new URL("../viewer-site", import.meta.url)),
    rollupOptions: {
      input: fileURLToPath(new URL("./viewer.html", import.meta.url)),
    },
  },
});

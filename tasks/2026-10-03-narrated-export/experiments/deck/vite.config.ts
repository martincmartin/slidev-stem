// Keep Vite's cache in the task directory, not in the talk's node_modules.
import { defineConfig } from "vite";

export default defineConfig({ cacheDir: ".vite-cache" });

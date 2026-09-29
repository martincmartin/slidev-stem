// Spike only: this deck lives in a task directory, so Vite does not allow
// the theme's fonts in stem/node_modules by default. Allow the repo root.
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { fs: { allow: [fileURLToPath(new URL('../../../..', import.meta.url))] } },
})

// What the house theme uses of Vite: CSS imports, and import.meta.glob.

declare module "*.css";

interface ImportMeta {
  glob(pattern: string, options: { eager: true }): Record<string, unknown>;
}

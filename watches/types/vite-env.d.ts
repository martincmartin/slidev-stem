// What the talk's code reads of Vite's `import.meta.env`.

interface ImportMeta {
  readonly env: {
    /** The deck's base URL, ending in "/": "/" unless the build gives
     *  Slidev's --base. */
    readonly BASE_URL: string;
  };
}

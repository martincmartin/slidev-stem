// The lint of the house tools' TypeScript. Here, not at the root, as
// tsconfig.json is (README.md, "TypeScript tools"). The rules are a talk's
// (watches/eslint.config.js), without Vue.
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/*.js"] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  // A disable is as narrow as it can be: one line, or a block with its
  // enable, even if the block is the whole file. It names its rules and
  // gives a reason, and it goes when it suppresses nothing
  // (../docs/talks.md, "Check your work").
  comments.recommended,
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
    rules: {
      "@eslint-community/eslint-comments/disable-enable-pair": [
        "error",
        { allowWholeFile: false },
      ],
      "@eslint-community/eslint-comments/require-description": "error",
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // node:test's `test` returns a promise that the runner awaits.
    files: ["**/*.test.ts"],
    rules: { "@typescript-eslint/no-floating-promises": "off" },
  },
  prettier,
);

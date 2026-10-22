import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import vue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "tasks/",
      "node_modules/",
      "components.d.ts",
      ".venv/",
      "**/*.js",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  vue.configs["flat/recommended"],
  // A disable is as narrow as it can be: one line, or a block with its
  // enable, even if the block is the whole file. It names its rules and
  // gives a reason, and it goes when it suppresses nothing. The plugin reads
  // script comments; tools/vuecheck.py checks a template's
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
      "vue/comment-directive": [
        "error",
        { reportUnusedDisableDirectives: true },
      ],
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".vue"],
      },
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    // typescript-eslint cannot see Vue's compiler macros (defineProps): it
    // types them as unresolved. vue-tsc checks these calls.
    rules: { "@typescript-eslint/no-unsafe-call": "off" },
  },
  {
    // node:test's `test` returns a promise that the runner awaits.
    files: ["**/*.test.ts"],
    rules: { "@typescript-eslint/no-floating-promises": "off" },
  },
  prettier,
);

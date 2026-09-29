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

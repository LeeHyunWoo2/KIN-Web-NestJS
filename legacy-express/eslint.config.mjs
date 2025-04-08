import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import js from "@eslint/js";

export default defineConfig([
  {
    files: ["**/*.{ts,js}"],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },

    plugins: {
      "@typescript-eslint": tseslint.plugin,
      js,
    },

    rules: {
      ...tseslint.configs.recommended.rules,

      "func-style": ["error", "expression", { allowArrowFunctions: true }],
      "@typescript-eslint/explicit-function-return-type": "warn",

      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

      "arrow-body-style": ["error", "as-needed"],
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],
      "no-console": "warn",
    },
    ignores: ["node_modules/*", "dist/*"],
  },
]);
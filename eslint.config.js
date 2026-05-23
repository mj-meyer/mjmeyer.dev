import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  // Replaces .eslintignore (flat config has no separate ignore file).
  {
    ignores: [
      ".husky/",
      ".vscode/",
      "public/",
      "dist/",
      ".astro/",
      ".vercel/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  // Must be last so it can turn off any stylistic rules that conflict with Prettier.
  eslintConfigPrettier
);

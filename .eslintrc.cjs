module.exports = {
     env: {
       node: true,
       es2022: true,
       browser: true,
     },
     extends: [
       "eslint:recommended",
       "plugin:@typescript-eslint/recommended",
       "plugin:astro/recommended",
       "prettier",
     ],
     parser: "@typescript-eslint/parser",
     plugins: ["@typescript-eslint"],
     parserOptions: {
       ecmaVersion: "latest",
       sourceType: "module",
       project: "./tsconfig.json",
     },
     overrides: [
       {
         files: ["*.astro"],
         parser: "astro-eslint-parser",
         parserOptions: {
           parser: "@typescript-eslint/parser",
           extraFileExtensions: [".astro"],
         },
         rules: {},
       },
       {
         files: ["*.ts", "*.tsx"],
         parser: "@typescript-eslint/parser",
         extends: ["plugin:@typescript-eslint/recommended"],
       },
     ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  ignorePatterns: [".eslintrc.cjs"]
   };

// @ts-check

const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettierConfig = require("eslint-config-prettier");
const prettierPlugin = require("eslint-plugin-prettier");

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // 1. Global ignores
  {
    ignores: [
      "node_modules/",
      "dist/", // Ignore build output
      ".vercel/",
      "*.config.js", // Ignore config files themselves for now
      "*.mjs",
    ],
  },

  // 2. Recommended rules for JavaScript and TypeScript
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Parser options for TypeScript
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true, // Automatically find the tsconfig.json
        tsconfigRootDir: __dirname,
      },
    },
  },

  // 4. Prettier integration
  // This must be LAST to override other configs.
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "warn", // Show Prettier differences as warnings
    },
  },
  prettierConfig, // Disables ESLint rules that conflict with Prettier
];

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/*.d.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off",
      // Prevent accidental server-only imports in frontend code
      'no-restricted-imports': [
        'error',
        {
          'paths': [
            { 'name': '@prisma/client', 'message': 'Do not import @prisma/client in frontend code. Use server actions or backend API.' },
            { 'name': 'fs', 'message': 'Do not import fs in frontend code.' },
          ],
          'patterns': [
            '../backend/**',
            '../../backend/**',
            'backend/**',
          ]
        }
      ],
    },
  },
  {
    files: ["next-env.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
];

export default eslintConfig;

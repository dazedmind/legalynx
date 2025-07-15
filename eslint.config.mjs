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
    // Global rules - more lenient for generated content
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "warn", // Change from error to warning
      "@typescript-eslint/ban-types": [
        "error",
        {
          types: {
            "{}": false, // Allow {} type for Prisma generated files
          },
          extendDefaults: true,
        },
      ],
    },
  },
  {
    // Completely ignore Prisma generated files and similar
    files: [
      "**/generated/**/*",
      "**/prisma/generated/**/*", 
      "**/.prisma/**/*",
      "**/node_modules/**/*",
      "**/*.config.js",
      "**/*.config.ts",
      "**/wasm.js", // Prisma WASM files
    ],
    rules: {
      // Turn off ALL TypeScript ESLint rules for generated files
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    // Rules specific to your application code
    files: ["src/**/*.ts", "src/**/*.tsx"],
    excludeFiles: [
      "src/generated/**/*",
      "src/**/generated/**/*",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", 
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
import js from "@eslint/js";
import globals from "globals";
import sonarjs from "eslint-plugin-sonarjs";
import babelParser from "@babel/eslint-parser";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["node_modules/**", ".next/**"],
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    plugins: { 
      js, 
      sonarjs 
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: { presets: ["@babel/preset-react"] },
      },
    },
    rules: {
      // --- 1. CYCLOMATIC COMPLEXITY (Alur Logika) ---
      "complexity": ["error", 10], // Maksimal 10 jalur percabangan (if/else, switch)

      // --- 2. COGNITIVE COMPLEXITY (Kemudahan Dibaca) ---
      "sonarjs/cognitive-complexity": ["error", 15], // Mengukur seberapa sulit kode dipahami otak

      // --- 3. DUPLIKASI KODE ---
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/no-identical-functions": "error",
      "sonarjs/no-identical-expressions": "error",

      // --- 4. CODE SMELLS & MAINTAINABILITY ---
      "sonarjs/no-extra-arguments": "warn",
      "sonarjs/no-nested-template-literals": "warn",
      "sonarjs/no-redundant-boolean": "warn",
      "sonarjs/no-unused-collection": "error",
      "sonarjs/prefer-immediate-return": "warn", // Mendorong kode yang lebih bersih
      "no-else-return": "warn", // Mengurangi nesting yang tidak perlu

      // --- 5. ENVIRONMENT RELEVANCE ---
      "no-undef": "error", // Memastikan variabel terdefinisi sesuai environment
      "no-console": ["warn", { allow: ["warn", "error"] }], // Mencegah sampah debug di production
    },
  },
  
  // Konfigurasi khusus untuk Backend (API Routes)
  {
    files: ["src/app/api/**/*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
  }
]);
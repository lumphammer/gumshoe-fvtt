import path from "node:path";
import { fileURLToPath } from "node:url";

import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import react from "eslint-plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: fixupConfigRules(
      compat.extends(
        "./eslintrc-core.cjs",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
      ),
    ),

    plugins: {
      react: fixupPluginRules(react),
    },

    rules: {
      // this isn't smart enough to to see the type param given to `React.FC<...>`
      "react/prop-types": ["off"],

      "react/no-unknown-property": [
        "error",
        {
          ignore: ["css"],
        },
      ],
    },

    languageOptions: {
      globals: {
        CONFIG: "readonly",
        Actor: "readonly",
        ActorSheet: "readonly",
        Actors: "readonly",
        jQuery: "readonly",
        JQuery: "readonly",
        mergeObject: "readonly",
        Item: "readonly",
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.js"],

    rules: {
      "@typescript-eslint/no-var-requires": ["off"],
    },
  },
  // vitest 1.x generates inline snapshots in backticks
  {
    files: ["**/*.test.ts"],

    rules: {
      quotes: [
        "off",
        "double",
        {
          avoidEscape: true,
        },
      ],
    },
  },
]);

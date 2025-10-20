import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Upgrade to eslint 9.37.0 caused this to have the error:
 *     error TS2742: The inferred type of 'default' cannot be named without a
 *     reference to '../../node_modules/.pnpm/@eslint+core@0.16.0/node_modules/@eslint/core/dist/cjs/types.cjs'.
 *     This is likely not portable. A type annotation is necessary.
 *
 * Original PR: https://github.com/lumphammer/shared-fvtt-bits/pull/224
 * @type {import('eslint').Linter.Config}
 */
const config = defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,

  // we ignore js files inside src because there shouldn't be any real ones. the
  // only exception is the dummy packageName.js that's needed in dev mode, which
  // is trivial enough to ignore.
  globalIgnores(["src/*.js", "**/build", "**/dist", "**/node_modules"]),

  // ///////////////////////////////////////////////////////////////////////////
  // main config
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },

    languageOptions: {
      parserOptions: {
        projectService: true,
      },

      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: 12,
    },

    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },

    rules: {
      "comma-dangle": ["error", "always-multiline"],
      curly: ["error", "multi-line", "consistent"],
      "dot-notation": "off",

      quotes: [
        "error",
        "double",
        {
          avoidEscape: true,
        },
      ],

      semi: ["error", "always"],
      "no-use-before-define": "off",

      "no-restricted-globals": [
        "error",
        {
          name: "logger",
          message:
            "This is a Foundry global which breaks tests.\n" +
            "Import `systemLogger` from `functions` instead.",
        },
      ],

      // replaced by ts version
      "no-useless-constructor": "off",

      // need to replace this with @typescript-eslint/no-restricted-imports so we
      // can allow type imports from lodash but this will require some eslint etc
      // version bumps
      // "no-restricted-imports": ["error", "lodash"],

      // typescript-eslint enforces using void to explicitely not await a promise
      "no-void": "off",

      // optional, but a nice bit of rigor
      "@typescript-eslint/no-use-before-define": ["error"],

      // unfortunately foundry create way too many situation where we need to talk
      // about any
      "@typescript-eslint/no-explicit-any": ["off"],

      // this would be a huge pain to enable because there's no auto-fix
      "@typescript-eslint/explicit-module-boundary-types": ["off"],

      // this would be enabled via extends: ['plugin:@typescript-eslint/stylistic'],
      "@typescript-eslint/no-empty-function": "error",

      // we need to use global namespaces for league types
      "@typescript-eslint/no-namespace": [
        "warn",
        {
          allowDeclarations: true,
        },
      ],

      // we also have noPropertyAccessFromIndexSignature: true in tsconfig which
      // effectively forces this on. See
      // https://typescript-eslint.io/rules/dot-notation#allowindexsignaturepropertyaccess
      "@typescript-eslint/dot-notation": [
        "error",
        {
          allowIndexSignaturePropertyAccess: true,
        },
      ],

      // ts-aware version, allows `public` constructor parameters
      "@typescript-eslint/no-useless-constructor": "error",

      // simple-import-sort
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // auto-fixable version of no-unused imports
      // see https://github.com/sweepline/eslint-plugin-unused-imports
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",

      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          // we have many situations where we need to supply a function to a  Foundry
          // API and it feels more correct to able to declare the args we're getting
          // even if we don't use them all.
          args: "none",
          ignoreRestSiblings: true,
        },
      ],

      // All these no-unsafe-* rules are turned off because we have so many
      // situations we're interacting with FVTT or something else third party and
      // we just have to be honest and type stuff as `any`.
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",

      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          // there are many situations where we have a callback or handler
          // function which is async for the convenience of `await` but the call
          // site is expecting a () => void. This is fine.
          checksVoidReturn: false,
        },
      ],

      // this is especially useful with Foundry, where some deprecated accesses
      // don't trigger a runtime warning
      "@typescript-eslint/no-deprecated": "error",
    },
  },

  {
    files: ["**/*.js"],
    rules: { "@typescript-eslint/no-var-requires": ["off"] },
  },

  // vitest 1.x generates inline snapshots in backticks
  {
    files: ["**/*.test.ts"],
    rules: {
      quotes: ["off", "double", { avoidEscape: true }],
    },
  },
]);

export default config;

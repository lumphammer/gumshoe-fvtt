import { defineConfig } from "eslint/config";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

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
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs["recommended-latest"],

  {
    languageOptions: {
      parserOptions: {
        // projectService: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      // this isn't smart enough to to see the type param given to `React.FC<...>`
      "react/prop-types": ["off"],

      // if there's a better way to tell eslint about emotion's `css` props, I'd
      // love to know
      "react/no-unknown-property": [
        "error",
        {
          ignore: ["css"],
        },
      ],

      // this gets enableed by the neostandard config but it breaks our pattern
      // of directly using document methods as handlers
      "react/jsx-handler-names": "off",
    },

    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);

export default config;

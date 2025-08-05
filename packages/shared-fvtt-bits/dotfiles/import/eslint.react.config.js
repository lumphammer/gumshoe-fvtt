import { defineConfig } from "eslint/config";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
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

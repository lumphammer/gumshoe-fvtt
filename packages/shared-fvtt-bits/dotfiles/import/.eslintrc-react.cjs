module.exports = {
  extends: [
    "./eslintrc-core.cjs",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  plugins: ["react"],
  rules: {
    // this isn't smart enough to to see the type param given to `React.FC<...>`
    "react/prop-types": ["off"],
    // if there's a better way to tell eslint about emotion's `css` props, I'd
    // love to know
    "react/no-unknown-property": ["error", { ignore: ["css"] }],
  },
  overrides: [
    {
      files: ["*.js"],
      rules: {
        "@typescript-eslint/no-var-requires": ["off"],
      },
    },
    {
      // vitest 1.x generates inline snapshots in backticks
      files: ["*.test.ts"],
      rules: {
        quotes: ["off", "double", { avoidEscape: true }],
      },
    },
  ],
  globals: {
    // Hooks: "readonly",
    CONFIG: "readonly",
    Actor: "readonly",
    ActorSheet: "readonly",
    Actors: "readonly",
    jQuery: "readonly",
    JQuery: "readonly",
    mergeObject: "readonly",
    Item: "readonly",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};

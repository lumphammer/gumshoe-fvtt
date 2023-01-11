module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "standard",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint"],
  rules: {
    quotes: ["error", "double", { avoidEscape: true }],
    semi: ["error", "always"],
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": ["error"],
    "comma-dangle": ["error", "always-multiline"],
    "@typescript-eslint/no-explicit-any": ["off"],
    "@typescript-eslint/explicit-module-boundary-types": ["off"],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { args: "none", ignoreRestSiblings: true },
    ],
    "react/prop-types": ["off"],
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-namespace": ["warn", { allowDeclarations: true }],
    "@typescript-eslint/member-delimiter-style": [
      "error",
      {
        multiline: {
          delimiter: "semi",
          requireLast: true,
        },
        singleline: {
          delimiter: "semi",
          requireLast: false,
        },
        overrides: {
          interface: {
            multiline: {
              delimiter: "semi",
              requireLast: true,
            },
            singleline: {
              delimiter: "semi",
              requireLast: true,
            },
          },
        },
      },
    ],
    // need to replace this with @typescript-eslint/no-restricted-imports so we
    // can allow type imports from lodash but this willr equire some eslint etc
    // version bumps
    // "no-restricted-imports": ["error", "lodash"],
  },
  overrides: [
    {
      files: ["*.js"],
      rules: {
        "@typescript-eslint/no-var-requires": ["off"],
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

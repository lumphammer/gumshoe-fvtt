import { defineConfig, globalIgnores } from "eslint/config";

import shared from "./dotfiles/import/eslint.core.config.js";

export default defineConfig([
  ...shared,
  globalIgnores([
    // anything using eslintrc format is legacy and not linted
    "*/**/*.eslintrc*.?js",
    "dotfiles/copy",
    "dist",
  ]),
]);

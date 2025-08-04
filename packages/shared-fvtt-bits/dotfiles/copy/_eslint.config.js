import coreConfig from "@lumphammer/shared-fvtt-bits/dotfiles/import/eslint.core.config.js";
// import reactConfig from "@lumphammer/shared-fvtt-bits/dotfiles/import/eslint.react.config.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // import shared config
  coreConfig,
  // reactConfig,

  globalIgnores([
    // anything using eslintrc format is legacy and not linted
    "*/**/*.eslintrc*.?js",
  ]),
]);

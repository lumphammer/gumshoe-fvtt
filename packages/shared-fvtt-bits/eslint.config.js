import { defineConfig, globalIgnores } from "eslint/config";

import shared from "./dotfiles/import/eslint.core.config.js";

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
  ...shared,
  globalIgnores([
    // anything using eslintrc format is legacy and not linted
    "*/**/*.eslintrc*.?js",
    "dotfiles/copy",
    "dist",
  ]),
]);

export default config;

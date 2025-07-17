import { defineWorkspace } from "vitest/config";

import { name } from "./package.json";

export default defineWorkspace([
  {
    extends: "./vite.config.ts",
    test: {
      name,
    },
  },
  // globs are relative to `root` in the main `vite.config.ts`
  "../packages/*",
]);

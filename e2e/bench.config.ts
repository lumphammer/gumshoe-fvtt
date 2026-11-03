import { defineConfig } from "@playwright/test";

import config from "../playwright.config.ts";

// Benchmarks in the test Foundry (`pnpm bench:foundry`): the browser-test
// setup, but running `*.bench.ts` instead of the tests.
export default defineConfig({
  ...config,
  testDir: ".",
  // paths here are relative to this file, not the base config
  globalSetup: "./globalSetup.ts",
  testMatch: "**/*.bench.ts",
  // one at a time, so they don't slow each other down
  workers: 1,
  reporter: "list",
});

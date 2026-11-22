import { defineConfig } from "@playwright/test";

import config from "../playwright.config.ts";

// Screenshots of the sheets in each built-in theme (`pnpm theme:shots`), to
// look at a theme without opening Foundry: the browser-test setup, but
// running `themeShots.shots.ts` instead of the tests. See docs/theming.md.
export default defineConfig({
  ...config,
  testDir: ".",
  // paths here are relative to this file, not the base config
  globalSetup: "./globalSetup.ts",
  testMatch: "**/*.shots.ts",
  // a theme per test, spread over the servers
  fullyParallel: true,
  reporter: "list",
});

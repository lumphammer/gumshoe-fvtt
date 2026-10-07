import { defineConfig, devices } from "@playwright/test";

import { foundryUrl, gmStorageStatePath } from "./e2e/config.ts";

// Browser tests against a real Foundry server. See e2e/README.md.
export default defineConfig({
  testDir: "./e2e",
  // all the tests share one Foundry world, so run them one at a time
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  globalSetup: "./e2e/globalSetup.ts",
  // Foundry takes a few seconds to load a world
  timeout: 60_000,
  // global setup has no timeout of its own
  globalTimeout: 10 * 60_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: foundryUrl,
    storageState: gmStorageStatePath,
    viewport: { width: 1600, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});

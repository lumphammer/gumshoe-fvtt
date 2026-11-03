import { defineConfig } from "@playwright/test";

import { browserArgs, foundryServers } from "./e2e/config.ts";
import { takeRunLock } from "./e2e/runLock.ts";

// Only one run at a time per Foundry. Taken here, not in global setup,
// because Playwright clears `test-results/` before that. (Workers load this
// file too; they're part of the run that holds the lock.)
if (process.env["TEST_WORKER_INDEX"] === undefined) {
  for (const server of foundryServers) takeRunLock(server.url, server.dataPath);
}

// Browser tests against a real Foundry server. See e2e/README.md.
export default defineConfig({
  testDir: "./e2e",
  // a Foundry runs one world at a time, so each worker has a server (and a
  // world) of its own, and a file's tests run one at a time in one worker
  workers: foundryServers.length,
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  globalSetup: "./e2e/globalSetup.ts",
  // Foundry takes a few seconds to load a world
  timeout: 60_000,
  // a backstop for hangs (global setup has no timeout of its own)
  globalTimeout: 30 * 60_000,
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { args: browserArgs },
  },
});

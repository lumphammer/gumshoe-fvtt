import { devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** A Foundry server the tests run against. */
export type FoundryServer = {
  url: string;
  /**
   * Its data folder, if it's on this machine. Global setup installs `build/`
   * here as the system. If it doesn't exist, the system must already be
   * installed.
   */
  dataPath: string;
  /** Where global setup saves the Gamemaster's logged-in session. */
  gmStorageStatePath: string;
};

function listFromEnv(name: string) {
  return process.env[name]?.split(",").map((item) => item.trim());
}

/**
 * The Foundry servers the tests run against, one per worker. By default,
 * the ones `scripts/e2e-foundry.sh` runs (`E2E_FOUNDRY_SERVERS` of them,
 * from port 30099 and `~/foundrydata/e2e`). Or set `E2E_FOUNDRY_URL` (and
 * `E2E_FOUNDRY_DATA`) to comma-separated lists of servers of your own.
 */
export const foundryServers: FoundryServer[] = (() => {
  const firstData =
    process.env["E2E_FOUNDRY_DATA"] ??
    path.join(os.homedir(), "foundrydata/e2e");
  const urls = listFromEnv("E2E_FOUNDRY_URL");
  const dataPaths = urls ? (listFromEnv("E2E_FOUNDRY_DATA") ?? []) : [];
  // keep the default in step with scripts/e2e-foundry.sh
  const count = urls?.length ?? Number(process.env["E2E_FOUNDRY_SERVERS"] ?? 3);
  return Array.from({ length: count }, (_, n) => ({
    url: urls?.[n] ?? `http://localhost:${30099 + n}`,
    dataPath: urls
      ? (dataPaths[n] ?? "")
      : n === 0
        ? firstData
        : `${firstData}-${n}`,
    gmStorageStatePath: path.join(dirname, ".auth", `gm-${n}.json`),
  }));
})();

/** The system build the tests install. */
export const buildPath = path.join(dirname, "..", "build");

/**
 * The world the tests use. It is deleted and recreated at the start of every
 * run, so don't point this at a world you care about.
 */
export const worldId = "investigator-e2e";

// a context option only for Playwright's own fixtures
const { defaultBrowserType: _, ...desktopChrome } = devices["Desktop Chrome"];

/**
 * The Gamemaster's browser context (and the players', who aren't logged in):
 * a desktop Chrome, big enough for a few sheets side by side, logged in by
 * global setup.
 */
export function gmContextOptions(server: FoundryServer) {
  return {
    ...desktopChrome,
    baseURL: server.url,
    storageState: server.gmStorageStatePath,
    viewport: { width: 1600, height: 1000 },
  };
}

/**
 * Chromium's launch arguments. Headless Chromium can open the sound card
 * directly through ALSA, taking it from PipeWire and silencing the desktop
 * until WirePlumber restarts (#1504); no test needs sound.
 */
export const browserArgs = ["--disable-audio-output"];

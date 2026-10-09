import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** The Foundry server the tests run against (see scripts/e2e-foundry.sh). */
export const foundryUrl =
  process.env["E2E_FOUNDRY_URL"] ?? "http://localhost:30099";

/**
 * The Foundry server's data folder, if it's on this machine (the default
 * matches scripts/e2e-foundry.sh). Global setup installs `build/` here as the
 * system. If it doesn't exist, the system must already be installed.
 */
export const foundryDataPath =
  process.env["E2E_FOUNDRY_DATA"] ?? path.join(os.homedir(), "foundrydata/e2e");

/** The system build the tests install. */
export const buildPath = path.join(dirname, "..", "build");

/**
 * The world the tests use. It is deleted and recreated at the start of every
 * run, so don't point this at a world you care about.
 */
export const worldId = "investigator-e2e";

/** Where global setup saves the Gamemaster's logged-in session. */
export const gmStorageStatePath = path.join(dirname, ".auth", "gm.json");

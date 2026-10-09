import {
  type APIRequestContext,
  type Browser,
  chromium,
  type FullConfig,
  type Page,
  request,
} from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  buildPath,
  foundryDataPath,
  foundryUrl,
  gmStorageStatePath,
  worldId,
} from "./config.ts";
import { waitForGameReady } from "./foundry.ts";

/**
 * Where Foundry's front page redirects to: "setup" when no world is running,
 * "join" or "game" when one is, "license" or "auth" when it needs a human.
 */
async function getFoundryState(api: APIRequestContext) {
  const response = await api.get("/", { maxRedirects: 0 });
  const location = response.headers()["location"] ?? "";
  return location.split("/").at(-1) ?? "";
}

async function waitForFoundryState(api: APIRequestContext, wanted: string) {
  const deadline = Date.now() + 30_000;
  let state = "";
  while (Date.now() < deadline) {
    state = await getFoundryState(api);
    if (state === wanted) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Foundry never reached "${wanted}" (stuck at "${state}")`);
}

/** POST a setup action, the way Foundry's own setup screens do. */
async function postAction(
  api: APIRequestContext,
  route: string,
  data: Record<string, unknown>,
) {
  const response = await api.post(route, { data });
  const body = await response.json().catch(() => ({}));
  if (!response.ok() || body.error) {
    throw new Error(
      `POST ${route} ${JSON.stringify(data)} failed: ${body.error ?? response.status()}`,
    );
  }
  return body;
}

async function joinAsGamemaster(page: Page) {
  await page.goto("/join");
  await page.locator('input[name="username"]').fill("Gamemaster");
  await page.locator('button[name="join"]').click();
  await page.waitForURL("**/game");
  await waitForGameReady(page);
}

async function deleteWorld(api: APIRequestContext) {
  // just after a world shuts down, its databases may still be writing files,
  // and deleting it fails with ENOTEMPTY, so try a few times
  for (let attempt = 1; ; attempt++) {
    try {
      await postAction(api, "/setup", {
        action: "uninstallPackage",
        type: "world",
        id: worldId,
      });
      return;
    } catch (e) {
      if (String(e).includes("does not exist")) return;
      if (attempt === 20) throw e;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

/**
 * Copy `build/` into the server's systems folder. It has to be a copy, not a
 * symlink: compendium packs are LevelDB databases, which only one process can
 * open at a time, so a Foundry you're developing against can't share them.
 * Call this while no world is running, so the packs are closed.
 */
function installSystem() {
  if (!fs.existsSync(foundryDataPath)) return;
  const systemPath = path.join(foundryDataPath, "Data/systems/investigator");
  const manifest = (dir: string) =>
    fs.readFileSync(path.join(dir, "system.json"), "utf8");
  if (!fs.existsSync(path.join(buildPath, "system.json"))) {
    throw new Error("There's no build to test; run `pnpm build` first.");
  }
  const manifestChanged =
    fs.existsSync(systemPath) && manifest(systemPath) !== manifest(buildPath);
  fs.rmSync(systemPath, { recursive: true, force: true });
  fs.cpSync(buildPath, systemPath, { recursive: true });
  if (manifestChanged) {
    // Foundry reads system.json (document types and so on) when it starts
    throw new Error(
      "system.json has changed, so Foundry needs a restart: " +
        "`pnpm e2e:foundry restart`, then run the tests again.",
    );
  }
}

/**
 * Throw away the test world, create a fresh one, and launch it.
 */
async function resetWorld(browser: Browser) {
  const api = await request.newContext({
    baseURL: foundryUrl,
    // Foundry rejects cross-site POSTs, so look like one of its own pages
    extraHTTPHeaders: { Origin: new URL(foundryUrl).origin },
  });
  try {
    let state: string;
    try {
      state = await getFoundryState(api);
    } catch (e) {
      throw new Error(
        `Can't reach Foundry at ${foundryUrl}. Start it with ` +
          "`pnpm e2e:foundry up` (or set E2E_FOUNDRY_URL).",
        { cause: e },
      );
    }
    if (state === "license" || state === "auth") {
      throw new Error(
        `Foundry at ${foundryUrl} wants a ${state === "license" ? "licence" : "admin password"}; ` +
          "the tests need one that's licensed and has no admin password.",
      );
    }
    if (state === "join" || state === "game") {
      // without an admin password, only a GM can shut the world down
      const page = await browser.newPage({ baseURL: foundryUrl });
      await joinAsGamemaster(page);
      await page.evaluate(() => game.shutDown());
      await page.close();
      await waitForFoundryState(api, "setup");
    }
    await deleteWorld(api);
    // deleting the world only succeeds once Foundry has closed its databases,
    // and in practice the packs are closed by then too (copying any earlier
    // made Foundry find them broken and repair them)
    installSystem();
    await postAction(api, "/create", {
      action: "createWorld",
      id: worldId,
      title: "INVESTIGATOR e2e tests",
      system: "investigator",
      launch: true,
    });
    await waitForFoundryState(api, "join");
  } finally {
    await api.dispose();
  }
}

export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();
  try {
    await resetWorld(browser);
    // log in to the new world and save the session for the tests to reuse
    const page = await browser.newPage({ baseURL: foundryUrl });
    await joinAsGamemaster(page);
    await page.evaluate(async () => {
      // These are client settings, kept in localStorage, so they're saved in
      // the storage state with the session cookie.
      // Mark the welcome tour as finished so it doesn't start. (Tour#complete
      // waits for the tour to play through.)
      const welcome = game.tours.get("core.welcome");
      await game.settings.set("core", "tourProgress", {
        core: { welcome: welcome?.steps.length ?? 0 },
      });
      // No canvas means no WebGL, so no "no hardware acceleration" warning,
      // and pages load faster.
      await game.settings.set("core", "noCanvas", true);
    });
    await page.context().storageState({ path: gmStorageStatePath });
  } finally {
    await browser.close();
  }
}

import {
  test as base,
  expect,
  type Browser,
  type Locator,
  type Page,
} from "@playwright/test";

import {
  type FoundryServer,
  foundryServers,
  gmContextOptions,
} from "./config.ts";

/** Where the system sends usage stats (`usageStatsEndpoint`). */
export const usageStatsEndpointPattern =
  "https://ingest.stats.lumphammer.net/**";

/** Wait until Foundry has finished loading the world in this page. */
export async function waitForGameReady(page: Page) {
  await page.waitForFunction(
    () => (globalThis as { game?: foundry.Game }).game?.ready === true,
    null,
    {
      timeout: 30_000,
    },
  );
}

/**
 * Console errors which aren't bugs in the system. Keep this short, and say
 * why each one is here.
 */
const ignoredErrors: RegExp[] = [];

/**
 * Client settings (kept in localStorage) for a page, depending on whether it
 * has the canvas. With no GPU, the canvas renders in software, slowly enough
 * to hold up everything else, so keep its work down.
 */
function clientSettings(canvas: boolean) {
  return [
    { name: "core.noCanvas", value: String(!canvas) },
    { name: "core.performanceMode", value: "0" },
    { name: "core.maxFPS", value: "10" },
    // stop the welcome tour (see globalSetup.ts)
    {
      name: "core.tourProgress",
      value: JSON.stringify({ core: { welcome: 99 } }),
    },
  ];
}

/** The device scale factor for pages with the canvas (see `test`). */
const canvasDeviceScaleFactor = 0.5;

/** World settings changed by `setSettings`, with their values before. */
const changedSettings = new WeakMap<Page, Record<string, unknown>>();

/** Where a page's errors go: the current test's `pageErrors`. */
type ErrorSink = { report: (text: string) => void };

/**
 * Report everything that goes wrong in this page to `sink`, labelled with
 * `who`. Call before the page loads the game.
 */
async function watchForErrors(page: Page, sink: ErrorSink, who: string) {
  page.on("pageerror", (error) => {
    sink.report(`${who}: Uncaught: ${error.stack ?? error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (ignoredErrors.some((pattern) => pattern.test(text))) return;
    sink.report(`${who}: Console: ${text}`);
  });
  await page.exposeFunction("__e2eReportError", (text: string) => {
    sink.report(`${who}: Notification: ${text}`);
  });
}

/**
 * Wait for the game to load, show the chat log (so chat cards are on screen
 * to click), and catch error notifications (which don't always reach the
 * console).
 */
async function waitForGameAndWatchNotifications(page: Page) {
  await waitForGameReady(page);
  await page.evaluate(() => {
    ui.sidebar.changeTab("chat", "primary");
    ui.sidebar.expand();
    const original = ui.notifications.error.bind(ui.notifications);
    ui.notifications.error = (message, options) => {
      void (
        globalThis as unknown as {
          __e2eReportError: (text: string) => Promise<void>;
        }
      ).__e2eReportError(String(message));
      return original(message, options);
    };
  });
}

/** Never send a test world's usage stats to the real server. */
async function routeUsageStats(page: Page) {
  // a test can route them somewhere of its own: later routes win
  await page.route(usageStatsEndpointPattern, (route) =>
    route.fulfill({ status: 204 }),
  );
}

function readLocalStorage(page: Page) {
  return page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
}

/**
 * The Gamemaster's page, kept open for the tests in a worker: loading the
 * game takes a second or more, and putting things back between tests is much
 * quicker.
 */
type GMPage = {
  page: Page;
  canvas: boolean;
  sink: ErrorSink;
  /** Errors between tests, which go to the next one. */
  strayErrors: string[];
  /** How many times the page has loaded. */
  loads: number;
  /**
   * The last test reloaded or navigated the page, or changed its
   * localStorage: whatever it did lives in the page, so load it afresh.
   */
  needsReload: boolean;
};

async function openGMPage(
  browser: Browser,
  server: FoundryServer,
  canvas: boolean,
) {
  const context = await browser.newContext({
    ...gmContextOptions(server),
    deviceScaleFactor: canvas ? canvasDeviceScaleFactor : 1,
  });
  const page = await context.newPage();
  const strayErrors: string[] = [];
  const gmPage: GMPage = {
    page,
    canvas,
    sink: { report: (text) => strayErrors.push(text) },
    strayErrors,
    loads: 0,
    needsReload: false,
  };
  page.on("load", () => gmPage.loads++);
  await page.addInitScript((settings) => {
    for (const { name, value } of settings) localStorage.setItem(name, value);
  }, clientSettings(canvas));
  await watchForErrors(page, gmPage.sink, "GM");
  await routeUsageStats(page);
  await page.goto("/game");
  await waitForGameAndWatchNotifications(page);
  return gmPage;
}

/**
 * A page's event listeners. (Playwright's `Page` is an event emitter, but its
 * types only show `on` and `off` for each event.)
 */
type PageEvents = {
  eventNames(): string[];
  listeners(name: string): ((...args: never[]) => unknown)[];
  off(name: string, listener: (...args: never[]) => unknown): void;
};

/**
 * Put the page back how a test found it, as far as a fresh page would have
 * it: close windows, undo forced dice, drop targets, show the chat.
 */
async function tidyPage(page: Page) {
  await page.evaluate(async () => {
    // Foundry's own (deleting it would leave none)
    // oxlint-disable-next-line unbound-method -- it's what Foundry sets, and doesn't use `this`
    CONFIG.Dice.randomUniform = foundry.dice.MersenneTwister.random;
    for (const app of [...foundry.applications.instances.values()]) {
      if (app.hasFrame && app.rendered) await app.close({ animate: false });
    }
    for (const app of Object.values(ui.windows)) await app.close();
    await ui.context?.close({ animate: false, target: undefined as never });
    if (game.user.targets.size > 0) canvas.tokens?.setTargets([]);
    ui.notifications.clear();
    ui.sidebar.changeTab("chat", "primary");
    ui.sidebar.expand();
    (document.activeElement as HTMLElement | null)?.blur();
  });
}

/**
 * Playwright's `test`, with `page` already in the game as the Gamemaster.
 *
 * A test fails if the page throws an uncaught error, logs a console error, or
 * shows an error notification, so every test is also a smoke test of whatever
 * it touches. If a test means to cause an error, it can clear `pageErrors`.
 *
 * The page is shared by the tests in a worker, and tidied up after each one
 * (see `tidyPage`). After a test reloads it (or changes localStorage), the
 * next test gets it reloaded again. The canvas is off unless a test file (or
 * describe block) asks for it with `test.use({ canvas: true })`, which gets
 * a page of its own. Settings changed with `setSettings` go back to how
 * they were after each test. The chat log starts empty.
 */
export const test = base.extend<
  {
    pageErrors: string[];
    canvas: boolean;
    joinAs: (userName: string) => Promise<Page>;
  },
  {
    foundryServer: FoundryServer;
    gmPages: { get: (canvas: boolean) => Promise<GMPage> };
  }
>({
  // each worker has a server of its own
  foundryServer: [
    // oxlint-disable-next-line no-empty-pattern -- Playwright needs the pattern
    async ({}, use, workerInfo) => {
      await use(foundryServers[workerInfo.parallelIndex]);
    },
    { scope: "worker" },
  ],
  canvas: [false, { option: true }],
  gmPages: [
    async ({ browser, foundryServer }, use) => {
      // one at a time: a canvas left drawing in the background would slow
      // everything else down
      let current: GMPage | undefined;
      await use({
        get: async (canvas) => {
          if (current?.canvas !== canvas) {
            await current?.page.context().close();
            current = undefined;
            current = await openGMPage(browser, foundryServer, canvas);
          }
          return current;
        },
      });
      await current?.page.context().close();
    },
    { scope: "worker" },
  ],
  // oxlint-disable-next-line no-empty-pattern -- Playwright needs the pattern
  pageErrors: async ({}, use) => {
    await use([]);
  },
  page: async ({ gmPages, canvas, pageErrors }, use) => {
    const gmPage = await gmPages.get(canvas);
    const { page, strayErrors } = gmPage;
    pageErrors.push(...strayErrors.map((text) => `(before the test) ${text}`));
    strayErrors.length = 0;
    gmPage.sink.report = (text) => pageErrors.push(text);
    if (gmPage.needsReload) {
      await page.goto("/game");
      await waitForGameAndWatchNotifications(page);
      gmPage.needsReload = false;
    }
    const loadsBefore = gmPage.loads;
    const localStorageBefore = await readLocalStorage(page);
    const events = page as unknown as PageEvents;
    const listenersBefore = new Map(
      events.eventNames().map((name) => [name, events.listeners(name)]),
    );
    // the tests share a world, so clear out earlier tests' chat: otherwise
    // `lastChatMessage` can find one of their cards before this test's arrives
    await page.evaluate(async () => {
      await ChatMessage.deleteDocuments([], { deleteAll: true });
    });

    await use(page);

    const settingsToRestore = changedSettings.get(page);
    changedSettings.delete(page);
    if (settingsToRestore) {
      await page.evaluate(async (values) => {
        for (const [key, value] of Object.entries(values)) {
          await game.settings.set("investigator", key as never, value as never);
        }
      }, settingsToRestore);
    }
    // drop the test's own listeners and routes
    for (const name of events.eventNames()) {
      const before = listenersBefore.get(name) ?? [];
      for (const listener of events.listeners(name)) {
        if (!before.includes(listener)) events.off(name, listener);
      }
    }
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await routeUsageStats(page);
    if ((await readLocalStorage(page)) !== localStorageBefore) {
      await page.evaluate(
        (entries) => {
          localStorage.clear();
          for (const [key, value] of entries) localStorage.setItem(key, value);
        },
        JSON.parse(localStorageBefore) as [string, string][],
      );
      gmPage.needsReload = true;
    }
    if (gmPage.loads !== loadsBefore) gmPage.needsReload = true;
    if (!gmPage.needsReload) await tidyPage(page);
    gmPage.sink.report = (text) => strayErrors.push(text);
    expect(pageErrors, "errors in the page").toEqual([]);
  },
  /**
   * Log another user into the game in a browser of their own, alongside the
   * Gamemaster's `page`. Their errors fail the test too.
   */
  joinAs: async (
    { browser, foundryServer, pageErrors, canvas },
    use,
    testInfo,
  ) => {
    const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    await use(async (userName) => {
      // loading a second game takes a while, especially with the canvas
      testInfo.slow();
      const context = await browser.newContext({
        ...gmContextOptions(foundryServer),
        deviceScaleFactor: canvas ? canvasDeviceScaleFactor : 1,
        // not logged in
        storageState: {
          cookies: [],
          origins: [
            {
              origin: new URL(foundryServer.url).origin,
              localStorage: clientSettings(canvas),
            },
          ],
        },
      });
      contexts.push(context);
      const page = await context.newPage();
      await watchForErrors(
        page,
        { report: (text) => pageErrors.push(text) },
        userName,
      );
      await page.goto("/join");
      await page.locator('input[name="username"]').fill(userName);
      await page.locator('button[name="join"]').click();
      await page.waitForURL("**/game");
      await waitForGameAndWatchNotifications(page);
      return page;
    });
    for (const context of contexts) await context.close();
  },
});

export { expect };

/**
 * Reload the page, and wait until it's back in the game, set up like a new
 * page from `test`. (For a fresh look at things which only render once.)
 */
export async function reloadGame(page: Page) {
  await page.reload();
  await waitForGameAndWatchNotifications(page);
}

/**
 * Every d6 rolls `face` until the test ends. (Foundry rolls
 * `ceil((1 - u) * faces)`, so 1s and 6s come out the same on any die, but the
 * faces in between only on a d6.)
 */
export async function forceDice(page: Page, face: 1 | 2 | 3 | 4 | 5 | 6) {
  await page.evaluate((face) => {
    const u = face === 6 ? 0.01 : face === 1 ? 0.99 : (6.5 - face) / 6;
    CONFIG.Dice.randomUniform = () => u;
  }, face);
}

/**
 * Create an actor. For PCs and NPCs, wait for the system to give them their
 * abilities, which it does just after creation. Returns its id.
 */
export async function createActor(
  page: Page,
  data: {
    name: string;
    type: "pc" | "npc" | "party";
    system?: object;
    prototypeToken?: object;
  },
) {
  const id = await page.evaluate(async (data) => {
    const actor = await Actor.create(data);
    return actor!.id;
  }, data);
  if (data.type !== "party") {
    // the system copies in the abilities from the new PC/NPC packs, one pack
    // at a time, and gives PCs an occupation
    const expected = await page.evaluate(async (type) => {
      const packIds = game.settings.get(
        "investigator",
        (type === "pc" ? "newPCPacks" : "newNPCPacks") as never,
      ) as string[];
      let count = type === "pc" ? 1 : 0;
      for (const packId of packIds) {
        count += (await game.packs.get(packId)?.getIndex())?.size ?? 0;
      }
      return count;
    }, data.type);
    await expect
      .poll(() => page.evaluate((id) => game.actors.get(id)!.items.size, id))
      .toBeGreaterThanOrEqual(expected);
  }
  return id;
}

/** Create a player user. Returns their id. */
export async function createPlayer(page: Page, name: string) {
  return page.evaluate(async (name) => {
    const user = await User.create({
      name,
      role: CONST.USER_ROLES.PLAYER,
    });
    return user!.id;
  }, name);
}

/** Give a user a permission level on an actor (by default, ownership). */
export async function giveOwnership(
  page: Page,
  actorId: string,
  userId: string,
  level: "NONE" | "LIMITED" | "OBSERVER" | "OWNER" = "OWNER",
) {
  await page.evaluate(
    async ({ actorId, userId, level }) => {
      await game.actors.get(actorId)!.update({
        ownership: { [userId]: CONST.DOCUMENT_OWNERSHIP_LEVELS[level] },
      });
    },
    { actorId, userId, level },
  );
}

/** Update an actor's ability by name. */
export async function updateAbility(
  page: Page,
  actorId: string,
  abilityName: string,
  system: Record<string, unknown>,
) {
  await page.evaluate(
    async ({ actorId, abilityName, system }) => {
      const item = game.actors.get(actorId)!.items.getName(abilityName);
      if (!item) throw new Error(`No ability called ${abilityName}`);
      await item.update({ system });
    },
    { actorId, abilityName, system },
  );
}

/**
 * Open a document's sheet and return a locator for it.
 */
export async function openSheet(page: Page, uuid: string) {
  const id = await page.evaluate(async (uuid) => {
    const document = (await fromUuid(uuid)) as {
      sheet: foundry.applications.api.ApplicationV2;
    } | null;
    if (!document) throw new Error(`No document ${uuid}`);
    await document.sheet.render({ force: true });
    return document.sheet.id;
  }, uuid);
  const sheet = page.locator(`[id="${id}"]`);
  await expect(sheet).toBeVisible();
  return sheet;
}

/** The newest chat message. */
export function lastChatMessage(page: Page) {
  return page.locator("#chat .chat-message").last();
}

/**
 * Change some of the system's world settings, just for this test.
 */
export async function setSettings(page: Page, values: Record<string, unknown>) {
  const before = await page.evaluate(async (values) => {
    const before: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values)) {
      before[key] = game.settings.get("investigator", key as never);
      await game.settings.set("investigator", key as never, value as never);
    }
    return before;
  }, values);
  changedSettings.set(page, { ...before, ...changedSettings.get(page) });
}

/** Create an item on an actor. Returns its id. */
export async function createOwnedItem(
  page: Page,
  actorId: string,
  data: { name: string; type: string; system?: object },
) {
  return page.evaluate(
    async ({ actorId, data }) => {
      const [item] = await game.actors
        .get(actorId)!
        .createEmbeddedDocuments("Item", [data as Item.CreateData]);
      return item.id;
    },
    { actorId, data },
  );
}

/**
 * Create a scene with a token for each actor, a grid square apart, and view
 * it. Needs `test.use({ canvas: true })`. Returns the token ids, in order.
 */
export async function createSceneWithTokens(page: Page, actorIds: string[]) {
  return page.evaluate(async (actorIds) => {
    const scene = (await Scene.create({
      name: "Test Scene",
      width: 1000,
      height: 1000,
    }))!;
    // activate rather than view, so other users see it too
    await scene.activate();
    // wait for the canvas to draw it, or Foundry can trip over new tokens
    while (!(canvas?.ready && canvas.scene?.id === scene.id)) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const tokens = await Promise.all(
      actorIds.map(async (actorId, index) => {
        const actor = game.actors.get(actorId)!;
        const data = await actor.getTokenDocument({
          x: 100 + index * 100,
          y: 100,
        });
        return data.toObject();
      }),
    );
    const created = await scene.createEmbeddedDocuments("Token", tokens);
    // match them up by actor: they don't always come back in the order they
    // were asked for
    return actorIds.map(
      (actorId) => created.find((token) => token.actorId === actorId)!.id,
    );
  }, actorIds);
}

/** Make these tokens (on the viewed scene) the user's only targets. */
export async function targetTokens(page: Page, tokenIds: string[]) {
  // Foundry animates every target's arrows on every frame, but a new token
  // only gets its arrows when it has finished drawing, so wait for that (a
  // user couldn't target it any sooner)
  await page.waitForFunction(
    (tokenIds) =>
      tokenIds.every((id) => canvas.tokens.get(id)?.targetArrows !== undefined),
    tokenIds,
  );
  await page.evaluate((tokenIds) => {
    canvas.tokens.setTargets(tokenIds);
  }, tokenIds);
  // make sure they took, and stayed
  const byId = (a: string, b: string) => a.localeCompare(b);
  const wanted = [...tokenIds].sort(byId);
  const getTargets = async () =>
    (
      await page.evaluate(() =>
        Array.from(game.user.targets).map((token) => token.id ?? ""),
      )
    ).sort(byId);
  await expect.poll(getTargets).toEqual(wanted);
  await page.waitForTimeout(250);
  expect(await getTargets(), "targets changed after being set").toEqual(wanted);
}

/**
 * Click every tab in a sheet, including tabs that only appear inside other
 * tabs, and the PC sheet's settings (a button in the header), so each one
 * renders at least once.
 */
export async function visitEveryTab(
  sheet: Locator,
  /** something to do on each tab (and before clicking any) */
  onEachTab?: () => Promise<void>,
) {
  await onEachTab?.();
  const visited = new Set<string>();
  for (let round = 0; round < 10; round++) {
    const tabs = sheet.locator(".tab-strip > label");
    const count = await tabs.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      if (!(await tab.isVisible())) continue;
      // icon-only tabs have no text
      const key = (await tab.innerText()) || (await tab.innerHTML());
      if (visited.has(key)) continue;
      visited.add(key);
      await tab.click();
      await onEachTab?.();
      clicked = true;
    }
    if (!clicked) break;
  }
  const settings = sheet.locator(
    '.window-header [data-action="toggleSheetSettings"]',
  );
  if (await settings.isVisible()) {
    await settings.click();
    await onEachTab?.();
  }
}

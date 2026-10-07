import {
  test as base,
  expect,
  type Locator,
  type Page,
} from "@playwright/test";

import { foundryUrl } from "./config.ts";

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

/** World settings changed by `setSettings`, with their values before. */
const changedSettings = new WeakMap<Page, Record<string, unknown>>();

/**
 * Report everything that goes wrong in this page into `errors`, labelled with
 * `who`, then wait for the game to be ready. Call before the page loads the
 * game.
 */
async function watchForErrors(page: Page, errors: string[], who: string) {
  page.on("pageerror", (error) => {
    errors.push(`${who}: Uncaught: ${error.stack ?? error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (ignoredErrors.some((pattern) => pattern.test(text))) return;
    errors.push(`${who}: Console: ${text}`);
  });
  await page.exposeFunction("__e2eReportError", (text: string) => {
    errors.push(`${who}: Notification: ${text}`);
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

/**
 * Playwright's `test`, with `page` already in the game as the Gamemaster.
 *
 * A test fails if the page throws an uncaught error, logs a console error, or
 * shows an error notification, so every test is also a smoke test of whatever
 * it touches. If a test means to cause an error, it can clear `pageErrors`.
 *
 * The canvas is off unless a test file asks for it with
 * `test.use({ canvas: true })`. Settings changed with `setSettings` go back
 * to how they were after each test.
 */
export const test = base.extend<{
  pageErrors: string[];
  canvas: boolean;
  joinAs: (userName: string) => Promise<Page>;
}>({
  canvas: [false, { option: true }],
  // oxlint-disable-next-line no-empty-pattern -- Playwright needs the pattern
  pageErrors: async ({}, use) => {
    await use([]);
  },
  page: async ({ page, pageErrors, canvas }, use) => {
    await page.addInitScript((settings) => {
      for (const { name, value } of settings) localStorage.setItem(name, value);
    }, clientSettings(canvas));
    await watchForErrors(page, pageErrors, "GM");
    await page.goto("/game");
    await waitForGameAndWatchNotifications(page);
    await use(page);
    const settingsToRestore = changedSettings.get(page);
    if (settingsToRestore) {
      await page.evaluate(async (values) => {
        for (const [key, value] of Object.entries(values)) {
          await game.settings.set("investigator", key as never, value as never);
        }
      }, settingsToRestore);
    }
    expect(pageErrors, "errors in the page").toEqual([]);
  },
  /**
   * Log another user into the game in a browser of their own, alongside the
   * Gamemaster's `page`. Their errors fail the test too.
   */
  joinAs: async ({ browser, pageErrors, canvas }, use, testInfo) => {
    const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    await use(async (userName) => {
      // loading a second game takes a while, especially with the canvas
      testInfo.slow();
      const context = await browser.newContext({
        storageState: {
          cookies: [],
          origins: [
            {
              origin: new URL(foundryUrl).origin,
              localStorage: clientSettings(canvas),
            },
          ],
        },
      });
      contexts.push(context);
      const page = await context.newPage();
      await watchForErrors(page, pageErrors, userName);
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

/** Every d6 rolls `face` until the page reloads. */
export async function forceDice(page: Page, face: 1 | 6) {
  await page.evaluate((face) => {
    CONFIG.Dice.randomUniform = () => (face === 6 ? 0.01 : 0.99);
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

/** Give a user ownership of an actor. */
export async function giveOwnership(
  page: Page,
  actorId: string,
  userId: string,
) {
  await page.evaluate(
    async ({ actorId, userId }) => {
      await game.actors.get(actorId)!.update({
        ownership: { [userId]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
      });
    },
    { actorId, userId },
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
    return created.map((token) => token.id);
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
}

/**
 * Click every tab in a sheet, including tabs that only appear inside other
 * tabs, so each one renders at least once.
 */
export async function visitEveryTab(sheet: Locator) {
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
      clicked = true;
    }
    if (!clicked) return;
  }
}

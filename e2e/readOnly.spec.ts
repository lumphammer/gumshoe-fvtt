import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  createPlayer,
  giveOwnership,
  openSheet,
  test,
  visitEveryTab,
} from "./foundry.ts";

/**
 * Click, type into, or choose from every control in a sheet's content, then
 * close any windows that opened. On a sheet the user can't edit, none of
 * this should try to change anything (which would be a permission error).
 */
async function pokeEverything(
  page: Page,
  sheet: Locator,
  pageErrors: string[],
) {
  const sheetId = await sheet.getAttribute("id");
  const controls = sheet
    .locator(".window-content")
    .locator(
      [
        "input:not([type=radio]):not([type=hidden])",
        "select",
        "textarea",
        "button",
        "a",
        "[contenteditable=true]",
        "[role=switch]",
      ].join(", "),
    );
  const count = Math.min(await controls.count(), 300);
  for (let i = 0; i < count; i++) {
    const control = controls.nth(i);
    // disabled controls are what we want, so skip them
    const state = await control
      .evaluate((e) => ({
        tag: e.tagName.toLowerCase(),
        usable:
          !(e as HTMLButtonElement).disabled &&
          e.getAttribute("aria-disabled") !== "true" &&
          e.getAttribute("contenteditable") !== "false" &&
          e.checkVisibility(),
      }))
      .catch(() => ({ tag: "", usable: false }));
    if (!state.usable) continue;
    const { tag } = state;
    const errorsBefore = pageErrors.length;
    try {
      if (tag === "input" || tag === "textarea") {
        await control.fill("7", { timeout: 1000 });
        await control.blur();
      } else if (tag === "select") {
        await control.selectOption({ index: 1 }, { timeout: 1000 });
      } else {
        await control.click({ timeout: 1000 });
      }
    } catch {
      // disabled, covered, or gone: fine
    }
    // close anything that opened (other sheets, dialogs, file pickers)
    await page.evaluate((sheetId) => {
      for (const app of foundry.applications.instances.values()) {
        if (app.id !== sheetId && app.hasFrame) void app.close();
      }
    }, sheetId);
    await page.waitForTimeout(100);
    if (pageErrors.length > errorsBefore) {
      // say which control it was, to make it easier to find
      pageErrors.push(
        `  ...after poking: ${await control
          .evaluate((e) => e.outerHTML.slice(0, 200))
          .catch(() => "(gone)")}`,
      );
    }
  }
}

test("a player can't change anything on a PC sheet they can only observe", async ({
  page,
  joinAs,
  pageErrors,
}) => {
  test.setTimeout(10 * 60_000);
  const pcId = await createActor(page, { name: "Observed", type: "pc" });
  const itemIds: string[] = [];
  for (const type of ["equipment", "weapon"] as const) {
    itemIds.push(
      await createOwnedItem(page, pcId, { name: `A ${type}`, type }),
    );
  }
  const playerId = await createPlayer(page, "Onlooker");
  await giveOwnership(page, pcId, playerId, "OBSERVER");

  const player = await joinAs("Onlooker");
  const actorSheet = await openSheet(player, `Actor.${pcId}`);
  await visitEveryTab(actorSheet, () =>
    pokeEverything(player, actorSheet, pageErrors),
  );
  for (const itemId of itemIds) {
    const itemSheet = await openSheet(player, `Actor.${pcId}.Item.${itemId}`);
    await visitEveryTab(itemSheet, () =>
      pokeEverything(player, itemSheet, pageErrors),
    );
  }
});

test("a player can't change anything on an NPC sheet they can only observe", async ({
  page,
  joinAs,
  pageErrors,
}) => {
  test.setTimeout(5 * 60_000);
  const npcId = await createActor(page, { name: "Observed NPC", type: "npc" });
  const weaponId = await createOwnedItem(page, npcId, {
    name: "A weapon",
    type: "weapon",
  });
  const playerId = await createPlayer(page, "Bystander");
  // Observer gets the full NPC sheet; Limited gets a simple one
  await giveOwnership(page, npcId, playerId, "OBSERVER");

  const player = await joinAs("Bystander");
  const actorSheet = await openSheet(player, `Actor.${npcId}`);
  await visitEveryTab(actorSheet, () =>
    pokeEverything(player, actorSheet, pageErrors),
  );
  const itemSheet = await openSheet(player, `Actor.${npcId}.Item.${weaponId}`);
  await visitEveryTab(itemSheet, () =>
    pokeEverything(player, itemSheet, pageErrors),
  );
});

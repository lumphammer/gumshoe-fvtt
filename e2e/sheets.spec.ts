import type { Locator } from "@playwright/test";

import { createActor, createOwnedItem, openSheet, test } from "./foundry.ts";

/**
 * Click every tab in a sheet, including tabs that only appear inside other
 * tabs, so each one renders at least once.
 */
async function visitEveryTab(sheet: Locator) {
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

for (const type of ["pc", "npc", "party"] as const) {
  test(`${type} sheet renders every tab`, async ({ page }) => {
    const id = await createActor(page, { name: "Tab Tourist", type });
    const sheet = await openSheet(page, `Actor.${id}`);
    await visitEveryTab(sheet);
  });
}

const itemTypes = [
  "investigativeAbility",
  "generalAbility",
  "equipment",
  "weapon",
  "mwItem",
  "personalDetail",
  "card",
] as const;

for (const type of itemTypes) {
  test(`${type} sheet renders every tab, in the world and on a PC`, async ({
    page,
  }) => {
    const worldItemId = await page.evaluate(async (type) => {
      const item = await Item.create({ name: `A ${type}`, type });
      return item!.id;
    }, type);
    await visitEveryTab(await openSheet(page, `Item.${worldItemId}`));

    const actorId = await createActor(page, { name: "Item Owner", type: "pc" });
    const ownedItemId = await createOwnedItem(page, actorId, {
      name: `My ${type}`,
      type,
    });
    await visitEveryTab(
      await openSheet(page, `Actor.${actorId}.Item.${ownedItemId}`),
    );
    // and the actor's sheet, now it has one of these
    await visitEveryTab(await openSheet(page, `Actor.${actorId}`));
  });
}

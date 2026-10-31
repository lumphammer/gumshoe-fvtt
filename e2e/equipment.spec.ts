import type { Page } from "@playwright/test";

import {
  createPlayer,
  expect,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";

// The equipment sheet reads its item and the equipment categories through
// snapshots, and its parts are memoised: these check that changes made
// elsewhere still reach an open sheet.

const tomes = {
  name: "Tomes",
  fields: {
    language: { name: "Language", type: "string", default: "" },
    mythos: {
      name: "Mythos Bonus",
      type: "number",
      default: 0,
      visibleToLimited: false,
    },
  },
};

async function createTome(page: Page) {
  return page.evaluate(async () => {
    const item = await Item.create({
      name: "Cultes des Goules",
      type: "equipment",
      system: {
        categoryId: "tomes",
        fields: { language: "French", mythos: 2 },
        notes: "<p>Foxed pages</p>",
      },
    });
    return item!.id;
  });
}

async function setOwnership(
  page: Page,
  itemId: string,
  userId: string,
  level: "LIMITED" | "OBSERVER" | "OWNER",
) {
  await page.evaluate(
    async ({ itemId, userId, level }) => {
      await game.items.get(itemId)!.update({
        ownership: { [userId]: CONST.DOCUMENT_OWNERSHIP_LEVELS[level] },
      });
    },
    { itemId, userId, level },
  );
}

test("an open equipment sheet shows changes made elsewhere", async ({
  page,
}) => {
  await setSettings(page, { equipmentCategories: { tomes } });
  const itemId = await createTome(page);
  const sheet = await openSheet(page, `Item.${itemId}`);
  await expect(sheet.getByLabel("Language")).toHaveValue("French");

  await page.evaluate(async (itemId) => {
    await game.items.get(itemId)!.update({
      name: "Cultes des Goules (2nd ed.)",
      system: { fields: { mythos: 4 }, notes: "<p>Rebound</p>" },
    });
  }, itemId);
  await expect(sheet.getByLabel("Name", { exact: true })).toHaveValue(
    "Cultes des Goules (2nd ed.)",
  );
  await expect(sheet.getByLabel("Mythos Bonus")).toHaveValue("4");
  // unchanged fields are still there
  await expect(sheet.getByLabel("Language")).toHaveValue("French");
  await expect(sheet).toContainText("Rebound");
});

test("an open equipment sheet follows changes to its category", async ({
  page,
}) => {
  await setSettings(page, { equipmentCategories: { tomes } });
  const itemId = await createTome(page);
  const sheet = await openSheet(page, `Item.${itemId}`);
  await expect(sheet.getByLabel("Language")).toBeVisible();

  await setSettings(page, {
    equipmentCategories: {
      tomes: {
        ...tomes,
        name: "Grimoires",
        fields: {
          ...tomes.fields,
          author: { name: "Author", type: "string", default: "" },
        },
      },
    },
  });
  await expect(sheet.getByLabel("Author")).toBeVisible();
  await expect(sheet.getByLabel("Category")).toContainText("Grimoires");
  await expect(sheet.getByLabel("Language")).toHaveValue("French");
});

test("a player's open equipment sheet hides fields when they drop to Limited", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, { equipmentCategories: { tomes } });
  const playerId = await createPlayer(page, "Dropped");
  const itemId = await createTome(page);
  await setOwnership(page, itemId, playerId, "OBSERVER");

  const player = await joinAs("Dropped");
  const sheet = await openSheet(player, `Item.${itemId}`);
  await expect(sheet).toContainText("Mythos Bonus");

  await setOwnership(page, itemId, playerId, "LIMITED");
  await expect(sheet).not.toContainText("Mythos Bonus");
  await expect(sheet.getByLabel("Language")).toHaveValue("French");
});

test("a player's open equipment sheet becomes editable when they're made its owner", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, { equipmentCategories: { tomes } });
  const playerId = await createPlayer(page, "Promoted");
  const itemId = await createTome(page);
  await setOwnership(page, itemId, playerId, "OBSERVER");

  const player = await joinAs("Promoted");
  const sheet = await openSheet(player, `Item.${itemId}`);
  const name = sheet.getByLabel("Name", { exact: true });
  await expect(name).toBeDisabled();
  await expect(sheet.getByLabel("Language")).toBeDisabled();

  await setOwnership(page, itemId, playerId, "OWNER");
  await expect(name).toBeEnabled();
  await expect(sheet.getByLabel("Language")).toBeEnabled();

  await setOwnership(page, itemId, playerId, "OBSERVER");
  await expect(name).toBeDisabled();
});

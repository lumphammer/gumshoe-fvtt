import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  createPlayer,
  expect,
  giveOwnership,
  openSheet,
  test,
  updateAbility,
} from "./foundry.ts";

// The PC sheet's Abilities tab reads the actor and each ability through
// snapshots, and its areas and rows are memoised: these check that changes
// made elsewhere still reach it.

/** An ability's pool/rating on the Abilities tab */
const poolAndRating = (sheet: Locator, name: string) =>
  sheet
    .locator("a", { hasText: new RegExp(`^${name}$`) })
    .locator("xpath=following-sibling::div[1]");

async function renameItem(
  page: Page,
  actorId: string,
  itemId: string,
  name: string,
) {
  await page.evaluate(
    async ({ actorId, itemId, name }) => {
      await game.actors.get(actorId)!.items.get(itemId)!.update({ name });
    },
    { actorId, itemId, name },
  );
}

test("the Abilities tab follows pools spent elsewhere", async ({ page }) => {
  const actorId = await createActor(page, { name: "Spender", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await expect(poolAndRating(sheet, "Athletics")).toHaveText("4/4");

  await updateAbility(page, actorId, "Athletics", { pool: 1 });
  await expect(poolAndRating(sheet, "Athletics")).toHaveText("1/4");
});

test("the Abilities tab follows abilities added, renamed and removed elsewhere", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Learner", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const link = (name: string) =>
    sheet.locator("a", { hasText: new RegExp(`^${name}$`) });

  const itemId = await createOwnedItem(page, actorId, {
    name: "Juggling",
    type: "generalAbility",
    system: { rating: 2, pool: 2 },
  });
  await expect(link("Juggling")).toBeVisible();

  await renameItem(page, actorId, itemId, "Fire Eating");
  await expect(link("Fire Eating")).toBeVisible();
  await expect(link("Juggling")).toHaveCount(0);

  await page.evaluate(
    async ({ actorId, itemId }) => {
      await game.actors.get(actorId)!.items.get(itemId)!.delete();
    },
    { actorId, itemId },
  );
  await expect(link("Fire Eating")).toHaveCount(0);
});

test("a zero-rated ability that hides itself shows once it has a rating", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Late Bloomer", type: "pc" });
  await createOwnedItem(page, actorId, {
    name: "Juggling",
    type: "generalAbility",
    system: { rating: 0, pool: 0, hideIfZeroRated: true },
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const link = sheet.locator("a", { hasText: /^Juggling$/ });
  await expect(sheet.locator("a", { hasText: /^Athletics$/ })).toBeVisible();
  await expect(link).toHaveCount(0);

  await updateAbility(page, actorId, "Juggling", { rating: 1, pool: 1 });
  await expect(link).toBeVisible();
});

test("edit mode follows ratings changed elsewhere, and their build points", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Builder", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await sheet.getByLabel("Edit mode").click();
  const generalPoints = sheet
    .locator("i", { hasText: "General build points" })
    .locator("xpath=following-sibling::span[1]");
  const before = Number(await generalPoints.innerText());
  const rating = sheet
    .locator("a", { hasText: /^Athletics$/ })
    .locator("xpath=following-sibling::div[1]")
    .locator("input");
  await expect(rating).toHaveValue("0");

  await updateAbility(page, actorId, "Athletics", { rating: 3, pool: 3 });
  await expect(rating).toHaveValue("3");
  await expect(generalPoints).toHaveText(String(before + 3));
});

test.describe("with the canvas", () => {
  // an actor's ownership changing makes Foundry cycle the player's tokens,
  // which throws (before any hooks) when there's no canvas
  test.use({ canvas: true });

  test("a player's Abilities tab becomes editable when they're made the PC's owner", async ({
    page,
    joinAs,
  }) => {
    const playerId = await createPlayer(page, "Successor");
    const actorId = await createActor(page, { name: "Handed On", type: "pc" });
    await giveOwnership(page, actorId, playerId, "OBSERVER");

    const player = await joinAs("Successor");
    const sheet = await openSheet(player, `Actor.${actorId}`);
    await sheet.getByLabel("Edit mode").click();
    const occupational = sheet.getByTitle("Occupational Ability?").first();
    await expect(occupational).toBeDisabled();

    await giveOwnership(page, actorId, playerId, "OWNER");
    await expect(occupational).toBeEnabled();
  });
});

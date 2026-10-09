import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  expect,
  forceDice,
  lastChatMessage,
  openSheet,
  test,
  updateAbility,
} from "./foundry.ts";

test("testing a general ability spends from its pool and rolls", async ({
  page,
}) => {
  const actorId = await createActor(page, {
    name: "Test Investigator",
    type: "pc",
  });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  await forceDice(page, 6);

  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.locator("a", { hasText: /^Athletics$/ }).click();

  const abilitySheet = page.locator(".application", {
    hasText: "General Ability: Athletics",
  });
  await abilitySheet.locator("label", { hasText: /^2$/ }).click();
  await abilitySheet.getByRole("button", { name: "Test" }).click();

  const card = lastChatMessage(page);
  await expect(card).toContainText("Athletics");
  await expect(card.locator(".dice-total")).toHaveText("8");
  await expect(abilitySheet.getByLabel("Pool", { exact: true })).toHaveValue(
    "2",
  );
});

/** The id of the first of an actor's abilities of this type. */
async function findAbility(
  page: Page,
  actorId: string,
  type: "investigativeAbility" | "generalAbility",
) {
  return page.evaluate(
    ({ actorId, type }) => {
      const item = game.actors
        .get(actorId)!
        .items.find((i) => i.type === type)!;
      return { id: item.id, name: item.name };
    },
    { actorId, type },
  );
}

async function getPool(page: Page, actorId: string, abilityId: string) {
  return page.evaluate(
    ({ actorId, abilityId }) =>
      game.actors.get(actorId)!.items.get(abilityId)!.system.pool as number,
    { actorId, abilityId },
  );
}

/**
 * The controls in an ability's row on the character sheet: its name links
 * to it, then come its pool, the -/+ buttons, and its spend or test button.
 */
function abilityRow(actorSheet: Locator, abilityId: string) {
  const name = actorSheet.locator(`a[data-item-id="${abilityId}"]`);
  const setButtons = name.locator("xpath=following-sibling::div[2]//button");
  return {
    minus: setButtons.nth(0),
    plus: setButtons.nth(1),
    action: name.locator("xpath=following-sibling::div[3]//button").first(),
  };
}

test("spending an investigative ability from the character sheet", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Spender", type: "pc" });
  const ability = await findAbility(page, actorId, "investigativeAbility");
  await updateAbility(page, actorId, ability.name, { rating: 3, pool: 3 });

  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  const row = abilityRow(actorSheet, ability.id);
  await row.plus.click();
  await row.plus.click();
  await row.plus.click();
  await row.minus.click();
  await row.action.click();

  await expect.poll(() => getPool(page, actorId, ability.id)).toBe(1);
  const card = lastChatMessage(page);
  await expect(card).toContainText(ability.name);
  await expect(card).toContainText("Point spend");
});

test("Full Refresh puts every pool back to its rating", async ({ page }) => {
  const actorId = await createActor(page, { name: "Tired", type: "pc" });
  const general = await findAbility(page, actorId, "generalAbility");
  const investigative = await findAbility(
    page,
    actorId,
    "investigativeAbility",
  );
  await updateAbility(page, actorId, general.name, { rating: 4, pool: 1 });
  await updateAbility(page, actorId, investigative.name, {
    rating: 2,
    pool: 0,
  });

  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.getByRole("button", { name: "Full Refresh" }).click();
  await page
    .locator(".application.dialog")
    .getByRole("button", { name: "Refresh" })
    .click();

  await expect.poll(() => getPool(page, actorId, general.id)).toBe(4);
  await expect.poll(() => getPool(page, actorId, investigative.id)).toBe(2);
});

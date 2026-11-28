import type { Page } from "@playwright/test";

import {
  abilityRow,
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
  await abilityRow(actorSheet, "Athletics").click({ button: "right" });

  // the ability's own sheet (its window title is just its name): its type,
  // owner and name at the top
  const abilitySheet = page
    .locator(".application", { hasText: "General Ability" })
    .filter({ hasText: "Test Investigator" })
    .filter({ has: page.locator("h1", { hasText: /^Athletics$/ }) });
  await abilitySheet.locator("label", { hasText: /^2$/ }).click();
  await abilitySheet.getByRole("button", { name: "Test", exact: true }).click();

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

test("spending an investigative ability from the character sheet", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Spender", type: "pc" });
  const ability = await findAbility(page, actorId, "investigativeAbility");
  await updateAbility(page, actorId, ability.name, { rating: 3, pool: 3 });

  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await abilityRow(actorSheet, ability.name).click();
  const popover = page.getByRole("dialog", { name: ability.name });
  await popover.locator("label", { hasText: /^2$/ }).click();
  await popover.getByRole("button", { name: "Spend", exact: true }).click();
  await expect(popover).toBeHidden();

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

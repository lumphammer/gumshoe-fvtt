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
import { applyPreset } from "./systemSettings.ts";

// Dying Earth tests: one d6, with a difficulty modifier, and a boon or levy
// on the pool. A re-roll costs a point (four, to re-roll a 1).

test.beforeEach(async ({ page }) => {
  await applyPreset(page, "Dying Earth (built-in)");
});

test.afterEach(async ({ page }) => {
  await applyPreset(page, "Trail of Cthulhu (built-in)");
});

/** A PC with a general ability at 3/3. Returns their ids, and its sheet. */
async function setUp(page: Page) {
  const actorId = await createActor(page, { name: "Cugel", type: "pc" });
  const ability = await page.evaluate((actorId) => {
    const item = game.actors
      .get(actorId)!
      .items.find((i) => i.type === "generalAbility")!;
    return { id: item.id, name: item.name };
  }, actorId);
  await updateAbility(page, actorId, ability.name, { rating: 3, pool: 3 });
  const sheet = await openSheet(page, `Actor.${actorId}.Item.${ability.id}`);
  return { actorId, ability, sheet };
}

async function getPool(page: Page, actorId: string, abilityId: string) {
  return page.evaluate(
    ({ actorId, abilityId }) =>
      game.actors.get(actorId)!.items.get(abilityId)!.system.pool as number,
    { actorId, abilityId },
  );
}

async function test_(sheet: Locator, difficulty: string, boonLevy: string) {
  await sheet.getByLabel("Difficulty").selectOption({ label: difficulty });
  await sheet.getByLabel("Boon/levy").selectOption({ label: boonLevy });
  await sheet.getByRole("button", { name: "Test", exact: true }).click();
}

test("a hard test with a boon", async ({ page }) => {
  const { actorId, ability, sheet } = await setUp(page);
  await forceDice(page, 6);
  await test_(sheet, "Hard (-1)", "Boon +1");
  // 6 - 1 = 5
  const card = lastChatMessage(page);
  await expect(card).toContainText("Prosaic Success");
  await expect(card).toContainText("Hard");
  // a boon adds to the pool
  await expect.poll(() => getPool(page, actorId, ability.id)).toBe(4);
});

test("re-rolling a 1 costs four points", async ({ page }) => {
  const { actorId, ability, sheet } = await setUp(page);
  await updateAbility(page, actorId, ability.name, { rating: 6, pool: 6 });
  await forceDice(page, 1);
  await test_(sheet, "Normal", "0");
  const card = lastChatMessage(page);
  await expect(card).toContainText("Dismal Failure");
  await expect.poll(() => getPool(page, actorId, ability.id)).toBe(6);

  await forceDice(page, 6);
  await card.getByRole("button").filter({ hasText: "Re-roll" }).click();
  await expect(lastChatMessage(page)).toContainText("Illustrious Success");
  await expect.poll(() => getPool(page, actorId, ability.id)).toBe(2);
});

test("a levy you can't afford is refused", async ({ page, pageErrors }) => {
  const { actorId, ability, sheet } = await setUp(page);
  await updateAbility(page, actorId, ability.name, { pool: 1 });
  const messages = await page.evaluate(() => game.messages.size);
  await test_(sheet, "Normal", "Levy (-2)");
  // it says why, with an error notification
  await expect
    .poll(() => pageErrors.join("\n"))
    .toContain("with a levy of -2 but pool is currently at 1");
  pageErrors.length = 0;
  expect(await page.evaluate(() => game.messages.size)).toBe(messages);
  expect(await getPool(page, actorId, ability.id)).toBe(1);
});

import type { Locator, Page } from "@playwright/test";

import { knife, pistol } from "./fight.ts";
import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  setSettings,
  test,
  updateAbility,
} from "./foundry.ts";

// The weapon sheet, and its attack panel (also on the Combat tab), read the
// weapon, its actor's abilities and the settings through snapshots, and their
// parts are memoised: these check that changes made elsewhere still reach
// them.

/** A PC who fights with Scuffling (6 points), and their knife. */
async function setUp(page: Page) {
  const pcId = await createActor(page, {
    name: "Scrapper",
    type: "pc",
    system: { initiativeAbility: "Scuffling" },
  });
  await updateAbility(page, pcId, "Scuffling", { rating: 6, pool: 6 });
  const knifeId = await createOwnedItem(page, pcId, {
    name: "Knife",
    type: "weapon",
    system: knife,
  });
  return { pcId, knifeId };
}

/** The spend options that are greyed out, as numbers. */
async function disabledSpends(panel: Locator) {
  const labels = await panel.locator("input:disabled + label").allInnerTexts();
  return labels.map(Number).filter((n) => !Number.isNaN(n));
}

test("an open weapon sheet follows its ability's pool, spent elsewhere", async ({
  page,
}) => {
  const { pcId, knifeId } = await setUp(page);
  const sheet = await openSheet(page, `Actor.${pcId}.Item.${knifeId}`);
  await expect.poll(() => disabledSpends(sheet)).toEqual([7]);

  await updateAbility(page, pcId, "Scuffling", { pool: 2 });
  await expect.poll(() => disabledSpends(sheet)).toEqual([3, 4, 5, 6, 7]);
  // another ability changing doesn't matter
  await updateAbility(page, pcId, "Athletics", { pool: 1 });
  await expect.poll(() => disabledSpends(sheet)).toEqual([3, 4, 5, 6, 7]);
});

test("the Combat tab's attack panel follows its ability's pool, spent elsewhere", async ({
  page,
}) => {
  const { pcId } = await setUp(page);
  const sheet = await openSheet(page, `Actor.${pcId}`);
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();
  await sheet.getByRole("switch", { name: "Ready Knife" }).click();
  await expect(
    sheet.getByRole("button", { name: "Attack with Knife" }),
  ).toBeVisible();
  await expect.poll(() => disabledSpends(sheet)).toEqual([7]);

  await updateAbility(page, pcId, "Scuffling", { pool: 4 });
  await expect.poll(() => disabledSpends(sheet)).toEqual([5, 6, 7]);
});

test("an open weapon sheet follows its actor's initiative ability", async ({
  page,
}) => {
  const { pcId, knifeId } = await setUp(page);
  const sheet = await openSheet(page, `Actor.${pcId}.Item.${knifeId}`);
  const attackButton = sheet.getByRole("button", { name: "Attack with Knife" });
  await expect(attackButton).toBeEnabled();

  await page.evaluate(async (pcId) => {
    await game.actors.get(pcId)!.update({
      system: { initiativeAbility: "Athletics" },
    });
  }, pcId);
  await expect(attackButton).toBeDisabled();
  await expect(
    sheet.getByText(
      "Scuffling isn’t this character’s active initiative ability.",
    ),
  ).toBeVisible();
});

test("an open weapon sheet follows the Extended Range setting", async ({
  page,
}) => {
  await setSettings(page, { useExtendedRange: false });
  const pcId = await createActor(page, {
    name: "Gunslinger",
    type: "pc",
    system: { initiativeAbility: "Firearms" },
  });
  const pistolId = await createOwnedItem(page, pcId, {
    name: "Pistol",
    type: "weapon",
    system: pistol,
  });
  const sheet = await openSheet(page, `Actor.${pcId}.Item.${pistolId}`);
  // range buttons are labelled "Long", or "Long · 2" when it costs points
  const costlyRange = sheet.getByText("Long · 2", { exact: true });
  await expect(sheet.getByText("Long", { exact: true })).toBeVisible();
  await expect(costlyRange).toHaveCount(0);

  await setSettings(page, { useExtendedRange: true });
  await expect(costlyRange).toBeVisible();
});

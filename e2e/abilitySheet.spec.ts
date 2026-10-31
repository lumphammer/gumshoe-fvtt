import type { Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  expect,
  forceDice,
  openSheet,
  setSettings,
  test,
  updateAbility,
} from "./foundry.ts";
import { fodgTraumaTypes, stabilityRulesOn } from "./stabilitySettings.ts";

// The ability sheet reads the ability, its actor and the settings through
// snapshots, and its parts are memoised: these check that changes made
// elsewhere still reach it.

async function getAbilityId(page: Page, actorId: string, name: string) {
  return page.evaluate(
    ({ actorId, name }) => game.actors.get(actorId)!.items.getName(name)!.id,
    { actorId, name },
  );
}

test("an open ability sheet follows its pool and rating, changed elsewhere", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Runner", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const id = await getAbilityId(page, actorId, "Athletics");
  const sheet = await openSheet(page, `Actor.${actorId}.Item.${id}`);
  await expect(sheet.getByLabel("Pool")).toHaveValue("4");

  await updateAbility(page, actorId, "Athletics", { rating: 5, pool: 2 });
  await expect(sheet.getByLabel("Pool")).toHaveValue("2");
  await expect(sheet.getByLabel("Rating")).toHaveValue("5");
});

test("a Stability sheet lists Bonds added and changed elsewhere", async ({
  page,
}) => {
  await setSettings(page, { ...stabilityRulesOn, useBonds: true });
  const actorId = await createActor(page, { name: "Bonded", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 6 });
  const id = await getAbilityId(page, actorId, "Stability");
  const sheet = await openSheet(page, `Actor.${actorId}.Item.${id}`);
  await expect(sheet.getByRole("button", { name: /Test/ })).toBeVisible();
  await expect(sheet.getByText("Mom", { exact: true })).toHaveCount(0);

  const momId = await createOwnedItem(page, actorId, {
    name: "Mom",
    type: "bond",
    system: { points: 2 },
  });
  await expect(sheet.getByText("Mom", { exact: true })).toBeVisible();
  const broken = sheet
    .locator("label", { hasText: "Mom" })
    .locator("svg title", { hasText: "Broken" });
  await expect(broken).toHaveCount(0);

  await page.evaluate(
    async ({ actorId, momId }) => {
      await game.actors
        .get(actorId)!
        .items.get(momId)!
        .update({ system: { points: -1 } });
    },
    { actorId, momId },
  );
  await expect(broken).toHaveCount(1);
});

test("an open ability sheet's rating cap follows adaptation", async ({
  page,
}) => {
  await setSettings(page, {
    ...stabilityRulesOn,
    traumaTypes: fodgTraumaTypes(["Reassurance"]),
  });
  const actorId = await createActor(page, { name: "Hardening", type: "pc" });
  await updateAbility(page, actorId, "Reassurance", { rating: 1, pool: 1 });
  const id = await getAbilityId(page, actorId, "Reassurance");
  const sheet = await openSheet(page, `Actor.${actorId}.Item.${id}`);
  const capBadge = sheet.getByTestId("rating-cap-badge");
  await expect(capBadge).toHaveCount(0);

  await page.evaluate(async (actorId) => {
    await game.actors.get(actorId)!.update({
      system: { adaptations: { violence: 3 } },
    });
  }, actorId);
  await expect(capBadge).toBeVisible();
});

test("situational modifiers switched on show everywhere, until the test", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Sneak", type: "pc" });
  await updateAbility(page, actorId, "Stealth", {
    rating: 4,
    pool: 4,
    situationalModifiers: [
      { id: "dark", situation: "In the dark", modifier: 1 },
    ],
  });
  const id = await getAbilityId(page, actorId, "Stealth");
  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  const sheet = await openSheet(page, `Actor.${actorId}.Item.${id}`);
  const badge = (on: typeof sheet) =>
    on.locator("a", { hasText: "In the dark: +1" });
  await expect(badge(sheet)).toContainText("✗");
  await expect(badge(actorSheet)).toContainText("✗");

  await badge(sheet).click();
  await expect(badge(sheet)).toContainText("✓");
  await expect(badge(actorSheet)).toContainText("✓");

  await forceDice(page, 3);
  await sheet.getByRole("button", { name: /Test/ }).click();
  await expect(page.locator("#chat .chat-message").last()).toContainText("4");
  await expect(badge(sheet)).toContainText("✗");
  await expect(badge(actorSheet)).toContainText("✗");
});

test("an open ability sheet follows the Boost setting", async ({ page }) => {
  await setSettings(page, { useBoost: false });
  const actorId = await createActor(page, { name: "Booster", type: "pc" });
  const id = await getAbilityId(page, actorId, "Athletics");
  const sheet = await openSheet(page, `Actor.${actorId}.Item.${id}`);
  await expect(sheet.getByText("Boost?")).toHaveCount(0);

  await setSettings(page, { useBoost: true });
  await expect(sheet.getByText("Boost?")).toBeVisible();
});

import type { Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  test,
} from "./foundry.ts";

// The PC sheet's Combat tab reads the actor and each weapon through
// snapshots, and its rows are memoised: these check that changes made
// elsewhere still reach it.

async function updateItem(
  page: Page,
  actorId: string,
  itemId: string,
  data: Record<string, unknown>,
) {
  await page.evaluate(
    async ({ actorId, itemId, data }) => {
      await game.actors.get(actorId)!.items.get(itemId)!.update(data);
    },
    { actorId, itemId, data },
  );
}

test("the Combat tab follows weapons changed and readied elsewhere", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Armed", type: "pc" });
  const revolverId = await createOwnedItem(page, actorId, {
    name: "Revolver",
    type: "weapon",
    system: { usesAmmo: true, ammo: { min: 0, max: 6, value: 6 } },
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();
  const revolver = sheet.getByRole("switch", { name: "Ready Revolver" });
  await expect(revolver).not.toBeChecked();
  await expect(sheet.getByText("6/6", { exact: true })).toBeVisible();

  // ammo spent elsewhere
  await updateItem(page, actorId, revolverId, {
    system: { ammo: { value: 2 } },
  });
  await expect(sheet.getByText("2/6", { exact: true })).toBeVisible();

  // readied elsewhere: the attack panel appears
  await page.evaluate(
    async ({ actorId, revolverId }) => {
      await game.actors
        .get(actorId)!
        .update({ system: { readyWeaponId: revolverId } });
    },
    { actorId, revolverId },
  );
  await expect(revolver).toBeChecked();
  await expect(
    sheet.getByRole("button", { name: /^(Fire|Attack with) / }),
  ).toHaveText(/Revolver/);

  // renamed elsewhere: the row and the panel's heading follow
  await updateItem(page, actorId, revolverId, { name: "Pistol" });
  await expect(
    sheet.getByRole("switch", { name: "Ready Pistol" }),
  ).toBeChecked();
  await expect(sheet.locator("h2", { hasText: /^Pistol$/ })).toBeVisible();

  // added and deleted elsewhere
  const knifeId = await createOwnedItem(page, actorId, {
    name: "Knife",
    type: "weapon",
  });
  const knife = sheet.getByRole("switch", { name: "Ready Knife" });
  await expect(knife).toBeVisible();
  await page.evaluate(
    async ({ actorId, knifeId }) => {
      await game.actors.get(actorId)!.items.get(knifeId)!.delete();
    },
    { actorId, knifeId },
  );
  await expect(knife).toHaveCount(0);
});

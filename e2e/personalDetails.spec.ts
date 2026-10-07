import type { Page } from "@playwright/test";

import { createActor, expect, openSheet, test } from "./foundry.ts";

async function getDetails(page: Page, actorId: string) {
  return page.evaluate(
    (actorId) =>
      game.actors
        .get(actorId)!
        .items.filter((item) => item.type === "personalDetail")
        .map((item) => ({
          name: item.name,
          slotIndex: (item.system as unknown as { slotIndex: number })
            .slotIndex,
        }))
        .sort((a, b) => a.slotIndex - b.slotIndex),
    actorId,
  );
}

test("creating, renaming and moving a personal detail", async ({ page }) => {
  const actorId = await createActor(page, { name: "Detailed", type: "pc" });
  // new investigators start with the generic occupation
  expect(await getDetails(page, actorId)).toEqual([
    { name: "Investigator", slotIndex: -1 },
  ]);

  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  const driveField = actorSheet
    .locator("label", { hasText: /^Drive$/ })
    .locator("xpath=following-sibling::div[1]");
  await driveField.getByText("Create").click();

  // its sheet opens (find it by id, since renaming it changes its title)
  await expect.poll(() => getDetails(page, actorId)).toHaveLength(2);
  const detailId = await page.evaluate(
    (actorId) => game.actors.get(actorId)!.items.getName("New Drive")!.id,
    actorId,
  );
  const detailSheet = await openSheet(
    page,
    `Actor.${actorId}.Item.${detailId}`,
  );
  await detailSheet.getByLabel("Name", { exact: true }).fill("Revenge");
  await expect(driveField).toContainText("Revenge");

  // move it to the occupation slot, alongside the existing one
  await detailSheet.getByLabel("Slot").selectOption({ label: "Occupation" });
  await expect
    .poll(() => getDetails(page, actorId))
    .toEqual([
      { name: "Investigator", slotIndex: -1 },
      { name: "Revenge", slotIndex: -1 },
    ]);
  await expect(driveField).toContainText("Create");
});

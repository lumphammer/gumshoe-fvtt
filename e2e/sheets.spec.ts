import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  test,
  visitEveryTab,
} from "./foundry.ts";

for (const type of ["pc", "npc", "party"] as const) {
  test(`${type} sheet renders every tab`, async ({ page }) => {
    const id = await createActor(page, { name: "Tab Tourist", type });
    const sheet = await openSheet(page, `Actor.${id}`);
    await visitEveryTab(sheet);
  });
}

test("a PC's abilities switch between play and edit mode", async ({ page }) => {
  const id = await createActor(page, { name: "Switcher", type: "pc" });
  const sheet = await openSheet(page, `Actor.${id}`);
  await expect(sheet.locator(".tab-strip > label")).toHaveText([
    "Abilities",
    "Combat",
    "Equipment",
    "Notes",
    "",
  ]);
  // the occupational checkboxes are only for editing
  const occupational = sheet.getByTitle("Occupational Ability?");
  await expect(occupational).toHaveCount(0);
  await sheet.getByLabel("Edit mode").click();
  await expect(occupational.first()).toBeVisible();

  // it stays in edit mode while you look at another tab
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();
  await sheet.locator(".tab-strip > label", { hasText: "Abilities" }).click();
  await expect(occupational.first()).toBeVisible();
  await sheet.getByLabel("Edit mode").click();
  await expect(occupational).toHaveCount(0);
});

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

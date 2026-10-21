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

test("one weapon at a time is ready to attack with on the Combat tab", async ({
  page,
}) => {
  const id = await createActor(page, { name: "Quickdraw", type: "pc" });
  const revolverId = await createOwnedItem(page, id, {
    name: "Revolver",
    type: "weapon",
  });
  await createOwnedItem(page, id, { name: "Shotgun", type: "weapon" });
  const sheet = await openSheet(page, `Actor.${id}`);
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();

  const revolver = sheet.getByRole("switch", { name: "Ready Revolver" });
  const shotgun = sheet.getByRole("switch", { name: "Ready Shotgun" });
  const attackButton = sheet.getByRole("button", {
    name: /^(Fire|Attack with) /,
  });
  await expect(sheet).toContainText("Ready a weapon to attack with it");
  await expect(attackButton).toHaveCount(0);

  await revolver.click();
  await expect(revolver).toBeChecked();
  await expect(attackButton).toHaveText(/Revolver/);

  // readying another unreadies the first
  await shotgun.click();
  await expect(shotgun).toBeChecked();
  await expect(revolver).not.toBeChecked();
  await expect(attackButton).toHaveText(/Shotgun/);

  await shotgun.click();
  await expect(shotgun).not.toBeChecked();
  await expect(sheet).toContainText("Ready a weapon to attack with it");

  // the rest of the row opens the weapon's sheet
  await sheet.getByText("Revolver", { exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        ({ id, revolverId }) =>
          game.actors.get(id)!.items.get(revolverId)!.sheet!.rendered,
        { id, revolverId },
      ),
    )
    .toBe(true);
});

test("an NPC's abilities and weapons each switch between play and edit mode", async ({
  page,
}) => {
  const id = await createActor(page, { name: "Cultist", type: "npc" });
  await createOwnedItem(page, id, { name: "Ritual Knife", type: "weapon" });
  const sheet = await openSheet(page, `Actor.${id}`);
  await expect(sheet.locator(".tab-strip > label")).toHaveText([
    "Abilities",
    "Combat",
    "Notes",
    "GM Notes",
  ]);

  // NPCs' ratings are only inputs for editing
  const ratingInputs = sheet.locator(".tab-content input[role=text-input]");
  await expect(ratingInputs).toHaveCount(0);
  await sheet.getByLabel("Edit mode").click();
  await expect(ratingInputs.first()).toBeVisible();

  // the Combat tab has an edit mode of its own
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();
  const ready = sheet.getByRole("switch", { name: "Ready Ritual Knife" });
  const nameInput = sheet.locator('input[value="Ritual Knife"]');
  await expect(ready).toBeVisible();
  await expect(nameInput).toHaveCount(0);
  await sheet.getByLabel("Edit mode").click();
  await expect(nameInput).toBeVisible();
  await expect(ready).toHaveCount(0);

  await sheet.locator(".tab-strip > label", { hasText: "Abilities" }).click();
  await expect(ratingInputs.first()).toBeVisible();
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

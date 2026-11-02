import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  setSettings,
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
  const shotgunId = await createOwnedItem(page, id, {
    name: "Shotgun",
    type: "weapon",
  });
  const sheet = await openSheet(page, `Actor.${id}`);
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();
  const isSheetOpen = (itemId: string) =>
    page.evaluate(
      ({ id, itemId }) =>
        game.actors.get(id)!.items.get(itemId)!.sheet!.rendered,
      { id, itemId },
    );

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
  // the ready weapon's Edit button opens its sheet
  await sheet.getByRole("button", { name: "Edit" }).click();
  await expect.poll(() => isSheetOpen(shotgunId)).toBe(true);
  // (out of the way of the PC's sheet)
  await page.evaluate(
    ({ id, shotgunId }) =>
      game.actors.get(id)!.items.get(shotgunId)!.sheet!.close(),
    { id, shotgunId },
  );

  await shotgun.click();
  await expect(shotgun).not.toBeChecked();
  await expect(sheet).toContainText("Ready a weapon to attack with it");

  // the rest of the row opens the weapon's sheet
  await sheet.getByText("Revolver", { exact: true }).click();
  await expect.poll(() => isSheetOpen(revolverId)).toBe(true);
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

const quickDeletes = [
  {
    type: "equipment",
    what: "equipment",
    tab: "Equipment",
    name: "Brass Lantern",
    settings: {},
  },
  {
    type: "weapon",
    what: "a weapon",
    tab: "Combat",
    name: "Old Revolver",
    settings: {},
  },
  {
    type: "bond",
    what: "a Bond",
    tab: "Bonds",
    name: "Mom",
    settings: { useBonds: true },
  },
  {
    type: "networkContact",
    what: "a contact",
    tab: "Contacts",
    name: "Fred",
    settings: { useNetworkContacts: true, networkAbility: "Network" },
  },
] as const;

for (const { type, what, tab, name, settings } of quickDeletes) {
  test(`deleting ${what} from a PC's ${tab} tab, after confirming`, async ({
    page,
  }) => {
    await setSettings(page, settings);
    const id = await createActor(page, { name: "Hoarder", type: "pc" });
    await createOwnedItem(page, id, { name, type });
    const sheet = await openSheet(page, `Actor.${id}`);
    await sheet.locator(".tab-strip > label", { hasText: tab }).click();
    const getCount = () =>
      page.evaluate(
        ({ id, type }) =>
          game.actors.get(id)!.items.filter((item) => item.type === type)
            .length,
        { id, type },
      );
    const deleteButton = sheet.getByRole("button", { name: "Delete" });
    const dialog = page.locator(".application.dialog");

    // cancelling keeps it
    await deleteButton.click();
    await expect(dialog).toContainText(`Delete Hoarder's "${name}"?`);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
    expect(await getCount()).toBe(1);

    await deleteButton.click();
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect.poll(getCount).toBe(0);
    await expect(sheet).not.toContainText(name);
  });
}

test("a PC can be marked as not human, or immune to Lethality, in its settings", async ({
  page,
}) => {
  await setSettings(page, {
    useDamageApplication: true,
    useGunfireOnHumans: true,
    useLethalityAndAutofire: true,
  });
  const id = await createActor(page, { name: "Ghoulish", type: "pc" });
  const sheet = await openSheet(page, `Actor.${id}`);
  await sheet
    .locator('.window-header [data-action="toggleSheetSettings"]')
    .click();
  const getFlags = () =>
    page.evaluate((id) => {
      const { isHuman, immuneToLethality } = game.actors.get(id)!.system;
      return { isHuman, immuneToLethality };
    }, id);
  expect(await getFlags()).toEqual({ isHuman: true, immuneToLethality: false });

  await sheet.getByRole("switch", { name: "Human?" }).click();
  await expect
    .poll(getFlags)
    .toEqual({ isHuman: false, immuneToLethality: false });
  await sheet.getByRole("switch", { name: "Immune to Lethality?" }).click();
  await expect
    .poll(getFlags)
    .toEqual({ isHuman: false, immuneToLethality: true });
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

// the item sheets don't re-render with Foundry: each follows its item itself
const followedFields = {
  mwItem: { notes: "<p>Changed notes</p>" },
  personalDetail: { notes: "<p>Changed notes</p>" },
  bond: { notes: "<p>Changed notes</p>" },
  networkContact: { notes: "<p>Changed notes</p>" },
  card: { description: "<p>Changed notes</p>" },
} as const;

for (const [type, system] of Object.entries(followedFields)) {
  test(`an open ${type} sheet follows its item changed elsewhere`, async ({
    page,
  }) => {
    await setSettings(page, { useBonds: true, useNetworkContacts: true });
    const actorId = await createActor(page, { name: "Follower", type: "pc" });
    const itemId = await createOwnedItem(page, actorId, {
      name: "Before",
      type,
    });
    const sheet = await openSheet(page, `Actor.${actorId}.Item.${itemId}`);
    await expect(sheet).toContainText("Before");
    const update = (data: object) =>
      page.evaluate(
        async ({ actorId, itemId, data }) => {
          await game.actors.get(actorId)!.items.get(itemId)!.update(data);
        },
        { actorId, itemId, data },
      );

    // one at a time, so neither can bring the other in
    await update({ system });
    await expect(sheet).toContainText("Changed notes");
    await update({ name: "After" });
    await expect(sheet).toContainText("After");
  });
}

test("a Moribund World item's range keeps the others, changed elsewhere", async ({
  page,
}) => {
  const itemId = await page.evaluate(async () => {
    const item = await Item.create({
      name: "Bow",
      type: "mwItem",
      system: { mwType: "missileWeapon" },
    });
    return item!.id;
  });
  const sheet = await openSheet(page, `Item.${itemId}`);
  // the name, then the four ranges
  const inputs = sheet.locator("input");
  await expect(inputs).toHaveCount(5);
  const range = (n: number) => inputs.nth(n + 1);

  await page.evaluate(async (id) => {
    await game.items.get(id)!.update({ system: { ranges: [1, 2, 3, 4] } });
  }, itemId);
  await expect(range(3)).toHaveValue("4");
  // the setter starts from the ranges as they are now, not when it opened
  await range(0).fill("9");
  await range(0).blur();
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          (game.items.get(id)!.system as unknown as { ranges: number[] })
            .ranges,
        itemId,
      ),
    )
    .toEqual([9, 2, 3, 4]);
});

test("a personal detail's sheet follows Item compendiums being created", async ({
  page,
}) => {
  const itemId = await page.evaluate(async () => {
    const item = await Item.create({ name: "Detail", type: "personalDetail" });
    return item!.id;
  });
  const sheet = await openSheet(page, `Item.${itemId}`);
  const packs = sheet.getByRole("combobox").last();
  await expect(packs.locator("option", { hasText: "Fresh Pack" })).toHaveCount(
    0,
  );
  await page.evaluate(async () => {
    await foundry.documents.collections.CompendiumCollection.createCompendium({
      type: "Item",
      label: "Fresh Pack",
    });
  });
  await expect(packs.locator("option", { hasText: "Fresh Pack" })).toHaveCount(
    1,
  );
});

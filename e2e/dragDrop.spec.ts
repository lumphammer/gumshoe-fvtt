import type { Page } from "@playwright/test";

import {
  createActor,
  createPlayer,
  expect,
  giveOwnership,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";
import { goTo, openSystemSettings } from "./systemSettings.ts";

/** The names of an actor's items of a type. */
async function getItemNames(page: Page, actorId: string, type: string) {
  return page.evaluate(
    ({ actorId, type }) =>
      game.actors
        .get(actorId)!
        .items.filter((item) => item.type === type)
        .map((item) => item.name),
    { actorId, type },
  );
}

/** Show a tab in the sidebar. */
async function showSidebarTab(page: Page, tab: string) {
  await page.evaluate((tab) => {
    ui.sidebar.changeTab(tab, "primary");
  }, tab);
}

test("dropping a world item onto a PC sheet gives them a copy", async ({
  page,
}) => {
  const pcId = await createActor(page, { name: "Collector", type: "pc" });
  const itemId = await page.evaluate(async () => {
    const item = await Item.create({
      name: "Brass Lantern",
      type: "equipment",
    });
    return item!.id;
  });
  const sheet = await openSheet(page, `Actor.${pcId}`);
  await showSidebarTab(page, "items");
  await page
    .locator(`#items [data-entry-id="${itemId}"]`)
    .dragTo(sheet.locator(".window-content"));

  await expect
    .poll(() => getItemNames(page, pcId, "equipment"))
    .toEqual(["Brass Lantern"]);
  await sheet.locator(".tab-strip > label", { hasText: "Equipment" }).click();
  await expect(sheet).toContainText("Brass Lantern");
});

test("dropping an item into a PC's notes links to it", async ({ page }) => {
  const pcId = await createActor(page, { name: "Diarist", type: "pc" });
  const itemId = await page.evaluate(async () => {
    const item = await Item.create({ name: "Silver Key", type: "equipment" });
    return item!.id;
  });
  const sheet = await openSheet(page, `Actor.${pcId}`);
  await sheet.locator(".tab-strip > label", { hasText: "Notes" }).click();
  const editor = sheet.locator("prose-mirror").first();
  await editor.hover();
  await editor.locator("button.toggle").click();
  const content = editor.locator(".ProseMirror");
  await content.click();
  await page.keyboard.type("Found this: ");
  await showSidebarTab(page, "items");
  await page.locator(`#items [data-entry-id="${itemId}"]`).dragTo(content);
  await editor.locator('[data-action="save"]').click();

  await expect
    .poll(() =>
      page.evaluate(
        (id) => (game.actors.get(id)!.system.longNotes as string[])[0] ?? "",
        pcId,
      ),
    )
    .toContain(`@UUID[Item.${itemId}]{Silver Key}`);
  // shown as a link, which opens the item
  const link = editor.locator("a.content-link");
  await expect(link).toHaveText("Silver Key");
  await link.click();
  await expect
    .poll(() =>
      page.evaluate((id) => game.items.get(id)!.sheet!.rendered, itemId),
    )
    .toBe(true);
});

/** Open a compendium, and return a locator for one of its entries. */
async function openCompendiumEntry(page: Page, packId: string, name: string) {
  const { appId, entryId } = await page.evaluate(
    async ({ packId, name }) => {
      const pack = game.packs.get(packId)!;
      const index = await pack.getIndex();
      const entry = index.find((e) => e.name === name);
      if (!entry) throw new Error(`No ${name} in ${packId}`);
      const app = pack
        .apps[0] as unknown as foundry.applications.api.ApplicationV2;
      await app.render({ force: true });
      return { appId: app.id, entryId: entry._id };
    },
    { packId, name },
  );
  const entry = page.locator(`[id="${appId}"] [data-entry-id="${entryId}"]`);
  await expect(entry).toBeVisible();
  return entry;
}

test("dropping a weapon from a compendium onto a PC sheet", async ({
  page,
}) => {
  const pcId = await createActor(page, { name: "Armourer", type: "pc" });
  const sheet = await openSheet(page, `Actor.${pcId}`);
  const weaponName = await page.evaluate(async () => {
    const index = await game.packs.get("investigator.srdWeapons")!.getIndex();
    return index.contents[0].name ?? "";
  });
  const entry = await openCompendiumEntry(
    page,
    "investigator.srdWeapons",
    weaponName,
  );
  await entry.dragTo(sheet.locator(".window-content"));

  await expect
    .poll(() => getItemNames(page, pcId, "weapon"))
    .toEqual([weaponName]);
  await sheet.locator(".tab-strip > label", { hasText: "Equipment" }).click();
  await expect(sheet).toContainText(weaponName);
});

test("dropping an ability from a compendium onto a PC sheet", async ({
  page,
}) => {
  const pcId = await createActor(page, { name: "Polymath", type: "pc" });
  const sheet = await openSheet(page, `Actor.${pcId}`);
  // one they don't have yet
  const abilityName = await page.evaluate(async (pcId) => {
    const index = await game.packs
      .get("investigator.niceBlackAgentsAbilities")!
      .getIndex();
    const actor = game.actors.get(pcId)!;
    return (
      index.find((entry) => !actor.items.getName(entry.name ?? ""))?.name ?? ""
    );
  }, pcId);
  const entry = await openCompendiumEntry(
    page,
    "investigator.niceBlackAgentsAbilities",
    abilityName,
  );
  await entry.dragTo(sheet.locator(".window-content"));

  await expect
    .poll(() =>
      page.evaluate(
        ({ pcId, abilityName }) =>
          game.actors.get(pcId)!.items.filter((i) => i.name === abilityName)
            .length,
        { pcId, abilityName },
      ),
    )
    .toBe(1);
  await expect(sheet).toContainText(abilityName);
});

test("dragging a weapon from one PC's sheet to another's copies it", async ({
  page,
}) => {
  const giverId = await createActor(page, { name: "Giver", type: "pc" });
  const takerId = await createActor(page, { name: "Taker", type: "pc" });
  await page.evaluate(async (id) => {
    await game.actors
      .get(id)!
      .createEmbeddedDocuments("Item", [
        { name: "Old Revolver", type: "weapon" },
      ]);
  }, giverId);
  const giver = await openSheet(page, `Actor.${giverId}`);
  const taker = await openSheet(page, `Actor.${takerId}`);
  // side by side
  await page.evaluate(
    ({ giverId, takerId }) => {
      game.actors.get(giverId)!.sheet!.setPosition({ left: 0, top: 0 });
      game.actors.get(takerId)!.sheet!.setPosition({ left: 500, top: 0 });
    },
    { giverId, takerId },
  );
  await giver.locator(".tab-strip > label", { hasText: "Equipment" }).click();
  await giver
    .getByText("Old Revolver", { exact: true })
    .dragTo(taker.locator(".window-content"));

  await expect
    .poll(() => getItemNames(page, takerId, "weapon"))
    .toEqual(["Old Revolver"]);
  expect(await getItemNames(page, giverId, "weapon")).toEqual(["Old Revolver"]);
});

test("dropping a folder onto a party sheet adds the PCs in it, and in folders inside it", async ({
  page,
}) => {
  const partyId = await createActor(page, { name: "Folk", type: "party" });
  const { folderId, subfolderId } = await page.evaluate(async () => {
    const folder = (await Folder.create({ name: "The Gang", type: "Actor" }))!;
    const subfolder = (await Folder.create({
      name: "Reserves",
      type: "Actor",
      folder: folder.id,
    }))!;
    return { folderId: folder.id, subfolderId: subfolder.id };
  });
  const members: Record<string, string> = {};
  for (const [name, type, folder] of [
    ["Eve", "pc", folderId],
    ["Frank", "pc", subfolderId],
    ["Henchman", "npc", folderId],
    ["Outsider", "pc", null],
  ] as const) {
    members[name] = await createActor(page, { name, type });
    await page.evaluate(
      async ({ id, folder }) => {
        await game.actors.get(id)!.update({ folder });
      },
      { id: members[name], folder },
    );
  }
  const partySheet = await openSheet(page, `Actor.${partyId}`);
  await showSidebarTab(page, "actors");
  await page
    .locator(`#actors .folder[data-folder-id="${folderId}"] > header`)
    .dragTo(partySheet.locator(".window-content"));

  await expect
    .poll(() =>
      page.evaluate(
        (id) => [...(game.actors.get(id)!.system.actorIds as string[])].sort(),
        partyId,
      ),
    )
    .toEqual([members["Eve"], members["Frank"]].sort());
  await expect(partySheet).toContainText("Eve");
  await expect(partySheet).toContainText("Frank");
  await expect(partySheet).not.toContainText("Henchman");
});

test("a player can drop a compendium weapon onto their own PC", async ({
  page,
  joinAs,
}) => {
  const pcId = await createActor(page, { name: "Shopper", type: "pc" });
  const playerId = await createPlayer(page, "Quartermaster");
  await giveOwnership(page, pcId, playerId);
  const player = await joinAs("Quartermaster");
  const sheet = await openSheet(player, `Actor.${pcId}`);
  const weaponName = await player.evaluate(async () => {
    const index = await game.packs.get("investigator.srdWeapons")!.getIndex();
    return index.contents[0].name ?? "";
  });
  const entry = await openCompendiumEntry(
    player,
    "investigator.srdWeapons",
    weaponName,
  );
  await entry.dragTo(sheet.locator(".window-content"));

  await expect
    .poll(() => getItemNames(page, pcId, "weapon"))
    .toEqual([weaponName]);
});

/** The names of the equipment categories, in order. */
async function getCategoryNames(page: Page) {
  return page.evaluate(() =>
    Object.values(
      game.settings.get(
        "investigator",
        "equipmentCategories" as never,
      ) as Record<string, { name: string }>,
    ).map((category) => category.name),
  );
}

test("dragging equipment categories into a new order, by mouse and by keyboard", async ({
  page,
}) => {
  await setSettings(page, {
    equipmentCategories: {
      alpha: { name: "Alpha", fields: {} },
      bravo: { name: "Bravo", fields: {} },
      charlie: { name: "Charlie", fields: {} },
    },
  });
  const app = await openSystemSettings(page);
  await goTo(app, "Equipment categories");
  const handles = app.getByRole("button", { name: "Drag to reorder" });
  await expect(handles).toHaveCount(3);

  // Alpha to the bottom, by mouse (once the page has slid in: hovering
  // waits for it to stop moving)
  await handles.nth(0).hover();
  const from = (await handles.nth(0).boundingBox())!;
  const to = (await handles.nth(2).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2 + 5, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(app.locator(".sortable-table a")).toHaveText([
    /Bravo/,
    /Charlie/,
    /Alpha/,
  ]);

  // Charlie to the top, by keyboard
  // (waiting for each step to take before the next: the handle shows as
  // pressed while it's picked up, and screen readers hear where it's over)
  const charlie = handles.nth(1);
  await charlie.focus();
  await page.keyboard.press("Space");
  await expect(charlie).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowUp");
  await expect(app.locator('[role="status"][aria-live]')).toContainText(
    "over droppable area 0",
  );
  await page.keyboard.press("Space");
  await expect(charlie).not.toHaveAttribute("aria-pressed", "true");
  await expect(app.locator(".sortable-table a")).toHaveText([
    /Charlie/,
    /Bravo/,
    /Alpha/,
  ]);

  await app.getByRole("button", { name: "Save changes" }).click();
  await expect(app).toBeHidden();
  expect(await getCategoryNames(page)).toEqual(["Charlie", "Bravo", "Alpha"]);
});

/**
 * Create a journal entry with a text page and an image page, set to open in
 * the system's HTML editor. Returns their ids.
 */
async function createJournal(page: Page) {
  return page.evaluate(async () => {
    const entry = (await JournalEntry.create({
      name: "Evidence",
      flags: {
        core: { sheetClass: "investigator.JournalEntryHTMLEditorSheetClass" },
      },
    }))!;
    const pages = await entry.createEmbeddedDocuments("JournalEntryPage", [
      { name: "Notes", type: "text", text: { content: "<p>Start</p>" } },
      { name: "Photo", type: "image", src: "icons/svg/book.svg" },
    ]);
    // (they don't always come back in the order they were asked for)
    const getId = (name: string) => pages.find((p) => p.name === name)!.id;
    return {
      entryId: entry.id,
      textId: getId("Notes"),
      imageId: getId("Photo"),
    };
  });
}

test("dropping an item into a journal page's HTML adds a link to it", async ({
  page,
}) => {
  const { entryId, textId } = await createJournal(page);
  const itemId = await page.evaluate(async () => {
    const item = await Item.create({ name: "Bloody Glove", type: "equipment" });
    return item!.id;
  });
  const sheet = await openSheet(page, `JournalEntry.${entryId}`);
  await sheet.getByText("Notes", { exact: true }).click();
  const editor = sheet.locator(".monaco-editor").first();
  await expect(editor).toBeVisible({ timeout: 20_000 });
  await showSidebarTab(page, "items");
  await page
    .locator(`#items [data-entry-id="${itemId}"]`)
    .dragTo(editor.locator(".view-lines"));

  await expect
    .poll(() =>
      page.evaluate(
        ({ entryId, textId }) =>
          game.journal.get(entryId)!.pages.get(textId)!.text.content ?? "",
        { entryId, textId },
      ),
    )
    .toContain(`@UUID[Item.${itemId}]{Bloody Glove}`);
});

test("dropping an item into an image's caption adds a link to it", async ({
  page,
}) => {
  const { entryId, imageId } = await createJournal(page);
  const itemId = await page.evaluate(async () => {
    const item = await Item.create({ name: "Torn Ticket", type: "equipment" });
    return item!.id;
  });
  const sheet = await openSheet(page, `JournalEntry.${entryId}`);
  await sheet.getByText("Photo", { exact: true }).click();
  const caption = sheet.getByLabel("Caption");
  await caption.fill("Found with");
  await showSidebarTab(page, "items");
  await page.locator(`#items [data-entry-id="${itemId}"]`).dragTo(caption);

  // (at the cursor, which is at the end)
  await expect(caption).toHaveValue(
    `Found with@UUID[Item.${itemId}]{Torn Ticket}`,
  );
  await caption.blur();
  await expect
    .poll(() =>
      page.evaluate(
        ({ entryId, imageId }) =>
          game.journal.get(entryId)!.pages.get(imageId)!.image.caption,
        { entryId, imageId },
      ),
    )
    .toBe(`Found with@UUID[Item.${itemId}]{Torn Ticket}`);
});

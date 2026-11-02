import type { Page } from "@playwright/test";

import { expect, openSheet, test } from "./foundry.ts";

/**
 * Create a journal entry with one text page, set to open in the system's
 * HTML editor. Returns their ids.
 */
async function createJournal(page: Page) {
  return page.evaluate(async () => {
    const entry = (await JournalEntry.create({
      name: "Case Notes",
      flags: {
        core: { sheetClass: "investigator.JournalEntryHTMLEditorSheetClass" },
      },
    }))!;
    const [jePage] = await entry.createEmbeddedDocuments("JournalEntryPage", [
      { name: "Clues", type: "text", text: { content: "<p>Start</p>" } },
    ]);
    return { entryId: entry.id, pageId: jePage.id };
  });
}

async function getContent(page: Page, entryId: string, pageId: string) {
  return page.evaluate(
    ({ entryId, pageId }) =>
      game.journal.get(entryId)!.pages.get(pageId)!.text.content ?? "",
    { entryId, pageId },
  );
}

test("editing a journal page's HTML saves it", async ({ page }) => {
  const { entryId, pageId } = await createJournal(page);
  const sheet = await openSheet(page, `JournalEntry.${entryId}`);
  await sheet.getByText("Clues", { exact: true }).click();

  const editor = sheet.locator(".monaco-editor").first();
  await expect(editor).toBeVisible({ timeout: 20_000 });
  await editor.locator(".view-lines").click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type("<p>The butler did it</p>");

  await expect
    .poll(() => getContent(page, entryId, pageId))
    .toContain("The butler did it");
  expect(await getContent(page, entryId, pageId)).toContain("<p>Start</p>");
});

test("closing the editor straight after typing keeps the change", async ({
  page,
}) => {
  const { entryId, pageId } = await createJournal(page);
  const sheet = await openSheet(page, `JournalEntry.${entryId}`);
  await sheet.getByText("Clues", { exact: true }).click();
  const editor = sheet.locator(".monaco-editor").first();
  await expect(editor).toBeVisible({ timeout: 20_000 });
  await editor.locator(".view-lines").click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type("<p>Closing time</p>");
  await page.evaluate((id) => game.journal.get(id)!.sheet!.close(), entryId);

  await expect
    .poll(() => getContent(page, entryId, pageId))
    .toContain("Closing time");
});

test("the editor follows its journal changed elsewhere", async ({ page }) => {
  const { entryId, pageId } = await createJournal(page);
  const sheet = await openSheet(page, `JournalEntry.${entryId}`);
  const navigation = sheet.getByTestId("page-navigation");
  await sheet.getByText("Clues", { exact: true }).click();
  const editor = sheet.getByTestId("editor");
  const pageName = editor.getByTestId("name").locator("input");
  await expect(pageName).toHaveValue("Clues");

  // the page itself: its name, and its CSS classes
  await page.evaluate(
    async ({ entryId, pageId }) => {
      await game.journal
        .get(entryId)!
        .pages.get(pageId)!
        .update({
          name: "Leads",
          flags: { investigator: { extraCssClasses: "spooky" } },
        });
    },
    { entryId, pageId },
  );
  await expect(navigation).toContainText("Leads");
  await expect(pageName).toHaveValue("Leads");
  await expect(editor.getByTestId("html-classes").locator("input")).toHaveValue(
    "spooky",
  );

  // a new page, and the entry's name
  await page.evaluate(async (entryId) => {
    const entry = game.journal.get(entryId)!;
    await entry.createEmbeddedDocuments("JournalEntryPage", [
      { name: "Suspects", type: "text", sort: 999999 },
    ]);
    await entry.update({ name: "Old Case Notes" });
  }, entryId);
  await expect(navigation).toContainText("Suspects");
  await expect(sheet.locator("input").first()).toHaveValue("Old Case Notes");

  // the open page deleted
  await page.evaluate(
    async ({ entryId, pageId }) => {
      await game.journal.get(entryId)!.pages.get(pageId)!.delete();
    },
    { entryId, pageId },
  );
  await expect(navigation).not.toContainText("Leads");
  await expect(sheet.getByTestId("editor")).toHaveCount(0);
});

test("an editor in a compendium follows it being locked and unlocked", async ({
  page,
}) => {
  const uuid = await page.evaluate(async () => {
    const pack =
      await foundry.documents.collections.CompendiumCollection.createCompendium(
        { type: "JournalEntry", label: "Sealed Notes" },
      );
    const entry = await JournalEntry.create(
      {
        name: "Sealed",
        flags: {
          core: {
            sheetClass: "investigator.JournalEntryHTMLEditorSheetClass",
          },
        },
      },
      { pack: pack.collection },
    );
    return entry!.uuid;
  });
  const sheet = await openSheet(page, uuid);
  // the entry's name
  const name = sheet.locator("input").first();
  await expect(name).toHaveValue("Sealed");
  await expect(name).toBeEditable();

  const setLocked = (locked: boolean) =>
    page.evaluate(
      async ({ uuid, locked }) => {
        const entry = (await fromUuid(uuid)) as JournalEntry;
        await entry.compendium!.configure({ locked });
      },
      { uuid, locked },
    );
  // locking a compendium changes a setting, not the entry
  await setLocked(true);
  await expect(name).not.toBeEditable();
  await setLocked(false);
  await expect(name).toBeEditable();
});

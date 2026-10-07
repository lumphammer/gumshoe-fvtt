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

import {
  createActor,
  expect,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";
import type { Page } from "@playwright/test";

// Text fields save as you type, a little at a time, and ignore the saves
// coming back while you're still typing.

test("typing slowly into a field saves everything, in the end", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "A", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const name = sheet.getByLabel("Name", { exact: true });

  await name.fill("");
  // slow enough that several saves (and their echoes) happen while typing
  await name.pressSequentially("Professor Henry Armitage", { delay: 80 });
  await expect(name).toHaveValue("Professor Henry Armitage");
  await expect
    .poll(() => page.evaluate((id) => game.actors.get(id)!.name, actorId))
    .toBe("Professor Henry Armitage");
  // and the echoes didn't put anything back in the field
  await expect(name).toHaveValue("Professor Henry Armitage");
});

test("closing the sheet straight after typing keeps the change", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "B", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const name = sheet.getByLabel("Name", { exact: true });
  await name.fill("Wilbur Whateley");
  await page.evaluate((id) => game.actors.get(id)!.sheet!.close(), actorId);
  await expect
    .poll(() => page.evaluate((id) => game.actors.get(id)!.name, actorId))
    .toBe("Wilbur Whateley");
});

test("editing a title in a theme with uppercase titles keeps its case", async ({
  page,
}) => {
  await setSettings(page, { defaultThemeName: "greenTriangleTheme" });
  const itemId = await page.evaluate(async () => {
    const item = await Item.create({ name: "Lantern", type: "equipment" });
    return item!.id;
  });
  const sheet = await openSheet(page, `Item.${itemId}`);
  const title = sheet.locator("h1 [contenteditable]");
  await expect(title).toHaveCSS("text-transform", "uppercase");

  await title.click();
  await page.keyboard.press("End");
  await page.keyboard.type("s");
  await expect
    .poll(() => page.evaluate((id) => game.items.get(id)!.name, itemId))
    .toBe("Lanterns");
});

test.describe("editable titles stay on one line", () => {
  async function openTitle(page: Page) {
    const itemId = await page.evaluate(async () => {
      const item = await Item.create({ name: "Lantern", type: "equipment" });
      return item!.id;
    });
    const sheet = await openSheet(page, `Item.${itemId}`);
    const title = sheet.locator("h1 [contenteditable]");
    const savedName = () =>
      page.evaluate((id) => game.items.get(id)!.name, itemId);
    return { title, savedName };
  }

  test("Enter finishes the edit instead of adding a line", async ({ page }) => {
    const { title, savedName } = await openTitle(page);
    await title.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Red");
    await page.keyboard.press("Enter");
    await expect(title).not.toBeFocused();
    await expect.poll(savedName).toBe("Lantern Red");
    await expect(title).toHaveText("Lantern Red");
  });

  test("pasting puts the lines on one line, as plain text", async ({
    page,
  }) => {
    const { title, savedName } = await openTitle(page);
    await title.click();
    await page.keyboard.press("End");
    await title.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", " Red\nand\r\n Green");
      clipboardData.setData("text/html", "<b>Red</b><br>and<p>Green</p>");
      element.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await expect.poll(savedName).toBe("Lantern Red and Green");
    expect(await title.evaluate((element) => element.innerHTML)).toBe(
      await title.evaluate((element) => element.textContent),
    );
  });

  test("a paste can be undone", async ({ page }) => {
    const { title, savedName } = await openTitle(page);
    await title.click();
    await page.keyboard.press("ControlOrMeta+A");
    await title.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", "Lamp");
      element.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await expect.poll(savedName).toBe("Lamp");
    await page.keyboard.press("ControlOrMeta+Z");
    await expect(title).toHaveText("Lantern");
    await expect.poll(savedName).toBe("Lantern");
  });

  test("line breaks that get in anyway are flattened", async ({ page }) => {
    const { title, savedName } = await openTitle(page);
    await title.click();
    // as if text had been dragged in
    await title.evaluate((element) => {
      element.innerHTML = "<div>Red</div>Lantern<br>Society";
      element.dispatchEvent(new InputEvent("input", { bubbles: true }));
    });
    await expect.poll(savedName).toBe("Red Lantern Society");
    await expect(title).toHaveText("Red Lantern Society");
  });
});

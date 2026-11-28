import type { Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  test,
} from "./foundry.ts";

// Foundry refuses a blank name with an error notification, which fails the
// test, so these also check that nothing blank is ever sent.

/** a bit longer than the inputs' throttle, so a waiting change is saved */
const afterThrottle = 700;

function actorName(page: Page, actorId: string) {
  return page.evaluate((id) => game.actors.get(id)!.name, actorId);
}

test("clearing the logo puts the name back, not what was left of it", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Jo", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const logo = sheet.locator(".logo .front-text-element [contenteditable]");
  await logo.click();
  await page.keyboard.press("End");
  await page.keyboard.press("Backspace");
  // part-deleted text is saved as you go
  await expect.poll(() => actorName(page, actorId)).toBe("J");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(afterThrottle);
  await page.keyboard.press("Enter");
  await expect(logo).toHaveText("Jo");
  await expect.poll(() => actorName(page, actorId)).toBe("Jo");
});

test("an item's name can be cleared and retyped", async ({ page }) => {
  const actorId = await createActor(page, { name: "Owner", type: "pc" });
  const itemId = await createOwnedItem(page, actorId, {
    name: "Revolver",
    type: "weapon",
  });
  const sheet = await openSheet(page, `Actor.${actorId}.Item.${itemId}`);
  const title = sheet.locator("h1 [contenteditable]");
  await title.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(afterThrottle);
  await page.keyboard.type("Shotgun");
  await page.keyboard.press("Enter");
  await expect
    .poll(() =>
      page.evaluate(
        ({ actorId, itemId }) =>
          game.actors.get(actorId)!.items.get(itemId)!.name,
        { actorId, itemId },
      ),
    )
    .toBe("Shotgun");
  await expect(title).toHaveText("Shotgun");
});

test("clearing the party's name puts it back", async ({ page }) => {
  const partyId = await createActor(page, { name: "The Gang", type: "party" });
  const sheet = await openSheet(page, `Actor.${partyId}`);
  const input = sheet.getByLabel("Party Name");
  await input.fill("");
  await page.waitForTimeout(afterThrottle);
  await input.blur();
  await expect(input).toHaveValue("The Gang");
  expect(await actorName(page, partyId)).toBe("The Gang");
});

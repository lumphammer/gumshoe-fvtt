import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  expect,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";
import { stabilityRulesOn } from "./stabilitySettings.ts";

// When a sheet's tabs don't fit in one row, they're laid out as a grid of
// buttons instead, so none of them is ever cut off.

async function setSheetWidth(page: Page, actorId: string, width: number) {
  await page.evaluate(
    ({ actorId, width }) => {
      game.actors.get(actorId)!.sheet!.setPosition({ width });
    },
    { actorId, width },
  );
}

/** How the strip is laid out, and whether every tab is inside it. */
function layout(sheet: Locator) {
  return sheet.locator(".tab-strip").evaluate((strip) => {
    const box = strip.getBoundingClientRect();
    const labels = Array.from(strip.querySelectorAll(":scope > label"));
    return {
      wrapped: strip.hasAttribute("data-wrapped"),
      allInside: labels.every((label) => {
        const tab = label.getBoundingClientRect();
        return tab.left >= box.left - 0.5 && tab.right <= box.right + 0.5;
      }),
    };
  });
}

test("a sheet's tabs fit in one row normally", async ({ page }) => {
  const actorId = await createActor(page, { name: "Roomy", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await expect
    .poll(() => layout(sheet))
    .toEqual({ wrapped: false, allInside: true });
});

test("too many tabs for one row are laid out in a grid, and back again", async ({
  page,
}) => {
  await setSettings(page, {
    ...stabilityRulesOn,
    useBonds: true,
    useNetworkContacts: true,
    useCards: true,
  });
  // the theme with the widest font
  const actorId = await createActor(page, {
    name: "Crowded",
    type: "pc",
    system: { sheetTheme: "mutantCityBlueTheme" },
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);

  await setSheetWidth(page, actorId, 600);
  await expect
    .poll(() => layout(sheet))
    .toEqual({ wrapped: true, allInside: true });

  // every tab can be clicked, and shows as selected
  const labels = sheet.locator(".tab-strip > label");
  const count = await labels.count();
  for (let i = 0; i < count; i++) {
    const label = labels.nth(i);
    await label.click();
    await expect(
      sheet.locator(".tab-strip > input:checked + label"),
    ).toHaveText((await label.innerText()) || "");
    await expect
      .poll(() => layout(sheet))
      .toEqual({ wrapped: true, allInside: true });
  }

  await setSheetWidth(page, actorId, 1400);
  await expect
    .poll(() => layout(sheet))
    .toEqual({ wrapped: false, allInside: true });
});

test("the settings button in the header shows the settings, and goes back", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Configured", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const button = sheet.locator(
    '.window-header [data-action="toggleSheetSettings"]',
  );
  const selectedTab = sheet.locator(".tab-strip > input:checked + label");
  const content = sheet.locator(".tab-content");

  await sheet.locator(".tab-strip > label", { hasText: "Notes" }).click();
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(selectedTab).toHaveCount(0);
  await expect(content).toContainText("Theme");

  // clicking it again goes back to the tab that was showing
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(selectedTab).toHaveText("Notes");

  // and so does clicking a tab
  await button.click();
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(content).not.toContainText("Theme");
});

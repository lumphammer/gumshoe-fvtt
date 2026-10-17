import type { Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  setSettings,
  test,
  visitEveryTab,
} from "./foundry.ts";

async function getBonds(page: Page, actorId: string) {
  return page.evaluate(
    (actorId) =>
      game.actors
        .get(actorId)!
        .items.filter((item) => item.type === "bond")
        .map((item) => {
          const system = item.system as unknown as {
            points: number;
            isDeltaGreen: boolean;
          };
          return {
            name: item.name,
            points: system.points,
            isDeltaGreen: system.isDeltaGreen,
          };
        }),
    actorId,
  );
}

test("the Bonds tab only shows when Bonds are on", async ({ page }) => {
  await setSettings(page, { useBonds: false });
  const actorId = await createActor(page, { name: "Unbonded", type: "pc" });
  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await expect(
    actorSheet.locator(".tab-strip > label", { hasText: "Bonds" }),
  ).toHaveCount(0);

  await setSettings(page, { useBonds: true });
  // the sheet only re-renders for its own document
  await page.evaluate(
    async (actorId) => {
      await game.actors.get(actorId)!.sheet!.render();
    },
    actorId,
  );
  await expect(
    actorSheet.locator(".tab-strip > label", { hasText: "Bonds" }),
  ).toHaveCount(1);
});

test("adding, editing and breaking a Bond", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Bonded", type: "pc" });
  await createOwnedItem(page, actorId, {
    name: "Bob",
    type: "bond",
    system: { points: 2, isDeltaGreen: true },
  });

  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.locator(".tab-strip > label", { hasText: "Bonds" }).click();
  await expect(actorSheet.getByText("DELTA GREEN")).toBeVisible();

  // adding one opens its sheet
  await actorSheet.getByRole("button", { name: "Add Bond" }).click();
  await expect.poll(() => getBonds(page, actorId)).toHaveLength(2);
  const bondId = await page.evaluate(
    (actorId) => game.actors.get(actorId)!.items.getName("New Bond")!.id,
    actorId,
  );
  const bondSheet = await openSheet(page, `Actor.${actorId}.Item.${bondId}`);
  await bondSheet.getByLabel("Bond", { exact: true }).fill("Mom");
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Mom", points: 1, isDeltaGreen: false });

  // ordinary Bonds come before DELTA GREEN ones
  const rows = actorSheet.getByTestId("bonds-area").locator("a[data-item-id]");
  await expect(rows).toHaveText(["Mom", "Bob"]);

  // step Mom down to -1, where she's broken (and no further)
  const momRow = rows.filter({ hasText: "Mom" }).locator("xpath=../..");
  const minus = momRow.locator("button:has(.fa-minus)");
  await expect(actorSheet.getByText("Broken")).toHaveCount(0);
  for (let i = 0; i < 3; i++) await minus.click();
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Mom", points: -1, isDeltaGreen: false });
  await expect(actorSheet.getByText("Broken")).toBeVisible();

  await visitEveryTab(bondSheet);
});

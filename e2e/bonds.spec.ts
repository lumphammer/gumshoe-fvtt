import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  expect,
  forceDice,
  lastChatMessage,
  openSheet,
  setSettings,
  test,
  updateAbility,
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

/** Click Burn, check the confirmation spells out the trade, and confirm */
async function burn(page: Page, button: Locator, expectedText: string) {
  await button.click();
  const dialog = page.locator(".application.dialog");
  await expect(dialog).toContainText(expectedText);
  await dialog.getByRole("button", { name: "Burn" }).click();
  await expect(dialog).toHaveCount(0);
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
  await page.evaluate(async (actorId) => {
    await game.actors.get(actorId)!.sheet!.render();
  }, actorId);
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

test("spending Bond points on a Stability test", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Steady", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 6 });
  await createOwnedItem(page, actorId, {
    name: "Mom",
    type: "bond",
    system: { points: 1 },
  });
  await createOwnedItem(page, actorId, {
    name: "Broken Friend",
    type: "bond",
    system: { points: -1 },
  });
  const stabilityId = await page.evaluate(
    (actorId) => game.actors.get(actorId)!.items.getName("Stability")!.id,
    actorId,
  );

  const sheet = await openSheet(page, `Actor.${actorId}.Item.${stabilityId}`);
  // each Bond gets a row of spend buttons, labelled with its points
  const momRow = sheet
    .locator("label", { hasText: /^Mom \(1\)$/ })
    .locator("xpath=following-sibling::div[1]");
  // broken Bonds have nothing to spend
  await expect(sheet.getByText("Broken Friend")).toHaveCount(0);

  // Mom can go from 1 down to -1: two points, and no more
  await expect(momRow.getByRole("radio", { name: "2" })).toBeEnabled();
  await expect(momRow.getByRole("radio", { name: "3" })).toBeDisabled();
  await momRow.getByText("2", { exact: true }).click();

  await forceDice(page, 6);
  await sheet.getByRole("button", { name: "Test" }).click();
  const card = lastChatMessage(page);
  await expect(card.getByTestId("bond-spends")).toHaveText("Bonds: Mom 2");
  await expect(card.locator(".dice-total")).toHaveText("8");
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Mom", points: -1, isDeltaGreen: false });
  // Mom is now broken, so her row goes
  await expect(sheet.getByText(/^Mom/)).toHaveCount(0);
});

test("burning a Bond for Stability", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Burner", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 4 });
  await createOwnedItem(page, actorId, {
    name: "Jerome",
    type: "bond",
    system: { points: 3 },
  });

  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.locator(".tab-strip > label", { hasText: "Bonds" }).click();
  await burn(
    page,
    actorSheet.getByRole("button", { name: "Burn" }),
    "Burn 2 points of your Bond with Jerome (3 → 1) to restore 1 Stability (4 → 5)?",
  );

  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Jerome", points: 1, isDeltaGreen: false });
  await expect
    .poll(() =>
      page.evaluate(
        (actorId) =>
          (
            game.actors.get(actorId)!.items.getName("Stability")!
              .system as unknown as { pool: number }
          ).pool,
        actorId,
      ),
    )
    .toBe(5);
  await expect(lastChatMessage(page)).toContainText(
    "Burner burned 2 points of their Bond with Jerome for 1 Stability",
  );

  // 1 point left can still be burned (down to broken)...
  await burn(
    page,
    actorSheet.getByRole("button", { name: "Burn" }),
    "This will break the Bond for good.",
  );
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Jerome", points: -1, isDeltaGreen: false });
  // ...and then there's nothing left to burn
  await expect(actorSheet.getByRole("button", { name: "Burn" })).toBeDisabled();
});

test("burning a Bond from its sheet", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Sheet Burner", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 5 });
  const bondId = await createOwnedItem(page, actorId, {
    name: "Zorah",
    type: "bond",
    system: { points: 4 },
  });

  const bondSheet = await openSheet(page, `Actor.${actorId}.Item.${bondId}`);
  const burnButton = bondSheet.getByRole("button", { name: "Burn" });
  await burn(page, burnButton, "(4 → 2)");
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Zorah", points: 2, isDeltaGreen: false });
  // Stability is back at its rating, so no more burning (the sheet notices,
  // though Stability is a different item)
  await expect(burnButton).toBeDisabled();
});

async function getPool(page: Page, actorId: string, abilityName: string) {
  return page.evaluate(
    ({ actorId, abilityName }) =>
      (
        game.actors.get(actorId)!.items.getName(abilityName)!
          .system as unknown as { pool: number }
      ).pool,
    { actorId, abilityName },
  );
}

test("rebuilding a Bond: a successful 6", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Rebuilder", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 4 });
  await updateAbility(page, actorId, "Reassurance", { rating: 2, pool: 2 });
  const bondId = await createOwnedItem(page, actorId, {
    name: "Jerome",
    type: "bond",
    system: { points: 2 },
  });

  const bondSheet = await openSheet(page, `Actor.${actorId}.Item.${bondId}`);
  const panel = bondSheet.getByTestId("rebuild-bond-panel");
  const row = (label: string) =>
    panel
      .locator("label", { hasText: new RegExp(`^${label}$`) })
      .locator("xpath=following-sibling::div[1]");
  await row("Stability").getByText("1", { exact: true }).click();
  await row("Reassurance").getByText("1", { exact: true }).click();
  // only up to what's in the pool
  await expect(
    row("Reassurance").getByRole("radio", { name: "3" }),
  ).toBeDisabled();

  await forceDice(page, 6);
  await panel.getByRole("button", { name: "Rebuild Bond" }).click();

  const card = lastChatMessage(page).getByTestId("rebuild-bond-card");
  await expect(card.getByTestId("rebuild-outcome")).toHaveText("Successful 6!");
  await expect(card).toContainText("Spent: Stability 1, Reassurance 1");
  // +2, but no higher than 4
  await expect(card.getByTestId("rebuild-bond-change")).toHaveText(
    "Jerome: 2 → 4",
  );
  // 4 - 1 spent + 6 refreshed, but no higher than the rating
  await expect(card.getByTestId("rebuild-stability-change")).toContainText(
    "Stability: 4 → 6",
  );
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Jerome", points: 4, isDeltaGreen: false });
  expect(await getPool(page, actorId, "Stability")).toBe(6);
  expect(await getPool(page, actorId, "Reassurance")).toBe(1);
});

test("rebuilding a Bond: a failed 1", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Neglecter", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 6 });
  const bondId = await createOwnedItem(page, actorId, {
    name: "Zorah",
    type: "bond",
    system: { points: 3 },
  });

  const bondSheet = await openSheet(page, `Actor.${actorId}.Item.${bondId}`);
  await forceDice(page, 1);
  await bondSheet.getByRole("button", { name: "Rebuild Bond" }).click();

  const card = lastChatMessage(page).getByTestId("rebuild-bond-card");
  await expect(card.getByTestId("rebuild-outcome")).toHaveText("Failed 1");
  await expect(card.getByTestId("rebuild-bond-change")).toHaveText(
    "Zorah: 3 → 2",
  );
  // no refresh, and nothing spent, so no change to Stability
  await expect(card.getByTestId("rebuild-stability-change")).toHaveCount(0);
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Zorah", points: 2, isDeltaGreen: false });
});

test("DELTA GREEN and broken Bonds can't be rebuilt", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, {
    name: "Unrebuildable",
    type: "pc",
  });
  for (const [name, system] of [
    ["Bob", { points: 2, isDeltaGreen: true }],
    ["Gone", { points: -1 }],
  ] as const) {
    const bondId = await createOwnedItem(page, actorId, {
      name,
      type: "bond",
      system,
    });
    const bondSheet = await openSheet(page, `Actor.${actorId}.Item.${bondId}`);
    await expect(bondSheet.getByText("Bond", { exact: true })).toBeVisible();
    await expect(bondSheet.getByTestId("rebuild-bond-panel")).toHaveCount(0);
  }
});

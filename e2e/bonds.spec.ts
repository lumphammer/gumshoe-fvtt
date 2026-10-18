import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  createPlayer,
  expect,
  forceDice,
  giveOwnership,
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
  await bondSheet.getByLabel("Name", { exact: true }).fill("Mom");
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Mom", points: 1, isDeltaGreen: false });

  // ordinary Bonds come before DELTA GREEN ones, with their ratings
  const area = actorSheet.getByTestId("bonds-area");
  await expect(area.getByTestId("bond-name")).toHaveText(["Mom", "Bob"]);
  await expect(area.getByTestId("bond-rating")).toHaveText(["1", "2"]);
  // just the table: editing and burning are on the Bond's sheet
  await expect(area.getByRole("button", { name: "Burn" })).toHaveCount(0);
  await expect(area.locator("input")).toHaveCount(0);

  // step Mom down to -1, where she's broken (and no further)
  const minus = bondSheet.locator("button:has(.fa-minus)");
  await expect(area.getByText("Broken")).toHaveCount(0);
  for (let i = 0; i < 3; i++) await minus.click();
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Mom", points: -1, isDeltaGreen: false });
  await expect(area.getByText("Broken")).toBeVisible();
  await expect(area.getByTestId("bond-rating")).toHaveText(["-1", "2"]);

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
  // each Bond gets a row of spend buttons; how many are enabled shows its points
  const bondRow = (label: RegExp) =>
    sheet
      .locator("label", { hasText: label })
      .locator("xpath=following-sibling::div[1]");
  const momRow = bondRow(/^Mom$/);
  // broken Bonds are listed, with a broken heart, but have nothing to spend
  const brokenRow = bondRow(/^Broken Friend Broken$/);
  await expect(
    sheet.locator("label", { hasText: "Broken Friend" }).locator("svg title"),
  ).toHaveText("Broken");
  for (const name of ["0", "1"]) {
    await expect(brokenRow.getByRole("radio", { name })).toBeDisabled();
  }

  // the name opens the Bond's sheet, without picking a spend
  await sheet.getByText("Mom", { exact: true }).click();
  const isMomsSheetOpen = () =>
    page.evaluate(
      (actorId) =>
        game.actors.get(actorId)!.items.getName("Mom")!.sheet!.rendered,
      actorId,
    );
  await expect.poll(isMomsSheetOpen).toBe(true);
  await expect(momRow.getByRole("radio", { name: "0" })).toBeChecked();
  await page.evaluate(
    (actorId) => game.actors.get(actorId)!.items.getName("Mom")!.sheet!.close(),
    actorId,
  );
  await expect.poll(isMomsSheetOpen).toBe(false);

  // Mom can go from 1 down to -1: two points, and no more
  await expect(momRow.getByRole("radio", { name: "2" })).toBeEnabled();
  await expect(momRow.getByRole("radio", { name: "3" })).toBeDisabled();
  await momRow.getByText("2", { exact: true }).click();

  // taking her to -1 breaks the Bond, so it asks first; cancelling does nothing
  const messages = page.locator("#chat .chat-message");
  const messageCount = await messages.count();
  const dialog = page.locator(".application.dialog");
  await sheet.getByRole("button", { name: "Test" }).click();
  await expect(dialog).toContainText("break your Bond with Mom");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(momRow.getByRole("radio", { name: "2" })).toBeChecked();
  expect(await messages.count()).toBe(messageCount);

  await forceDice(page, 6);
  await sheet.getByRole("button", { name: "Test" }).click();
  await dialog.getByRole("button", { name: "Test" }).click();
  await expect(dialog).toHaveCount(0);
  const card = lastChatMessage(page);
  await expect(card.getByTestId("bond-spends")).toHaveText("Bonds: Mom 2");
  await expect(card.locator(".dice-total")).toHaveText("8");
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Mom", points: -1, isDeltaGreen: false });
  // Mom is now broken: still listed, but with nothing to spend
  await expect(
    bondRow(/^Mom Broken$/).getByRole("radio", { name: "0" }),
  ).toBeDisabled();
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

  // clicking anywhere on the row opens the Bond's sheet
  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.locator(".tab-strip > label", { hasText: "Bonds" }).click();
  await actorSheet
    .getByTestId("bonds-area")
    .getByTestId("bond-rating")
    .filter({ hasText: "3" })
    .click();
  const bondSheet = page.locator(".application", {
    has: page.locator(".window-title", { hasText: "Jerome" }),
  });
  await expect(bondSheet).toBeVisible();
  const burnButton = bondSheet.getByRole("button", { name: "Burn" });
  await burn(
    page,
    burnButton,
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
  await burn(page, burnButton, "This will break the Bond for good.");
  await expect
    .poll(() => getBonds(page, actorId))
    .toContainEqual({ name: "Jerome", points: -1, isDeltaGreen: false });
  // ...and then there's nothing left to burn
  await expect(burnButton).toBeDisabled();
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
  await updateAbility(page, actorId, "Flattery", { rating: 1, pool: 0 });
  const bondId = await createOwnedItem(page, actorId, {
    name: "Jerome",
    type: "bond",
    system: { points: 2 },
  });

  const bondSheet = await openSheet(page, `Actor.${actorId}.Item.${bondId}`);
  await bondSheet.getByTestId("open-rebuild-bond").click();
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
  // listed with a rating, even with nothing left to spend
  await expect(
    row("Flattery").getByRole("radio", { name: "0" }),
  ).toBeDisabled();
  // not listed without one
  await expect(row("Cop Talk")).toHaveCount(0);

  await forceDice(page, 6);
  await panel.getByRole("button", { name: "Rebuild Bond" }).click();
  // back to the Bond once it's rolled
  await expect(panel).toHaveCount(0);

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
  await bondSheet.getByTestId("open-rebuild-bond").click();
  await bondSheet
    .getByTestId("rebuild-bond-panel")
    .getByRole("button", { name: "Rebuild Bond" })
    .click();

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

test("the names on the rebuild panel open their sheets", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Linker", type: "pc" });
  await updateAbility(page, actorId, "Reassurance", { rating: 1, pool: 0 });
  const bondId = await createOwnedItem(page, actorId, {
    name: "Ruth",
    type: "bond",
    system: { points: 2 },
  });

  const bondSheet = await openSheet(page, `Actor.${actorId}.Item.${bondId}`);
  await bondSheet.getByTestId("open-rebuild-bond").click();
  const panel = bondSheet.getByTestId("rebuild-bond-panel");
  for (const name of ["Stability", "Reassurance"]) {
    await panel.getByText(name, { exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(
          ({ actorId, name }) =>
            game.actors.get(actorId)!.items.getName(name)!.sheet!.rendered,
          { actorId, name },
        ),
      )
      .toBe(true);
    // the spend buttons don't pick up the click
    await expect(panel.getByRole("radio", { checked: true })).toHaveCount(2);
    // out of the way of the next link
    await page.evaluate(
      ({ actorId, name }) =>
        game.actors.get(actorId)!.items.getName(name)!.sheet!.close(),
      { actorId, name },
    );
  }
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
    await expect(bondSheet.getByText("Name", { exact: true })).toBeVisible();
    await expect(bondSheet.getByTestId("open-rebuild-bond")).toHaveCount(0);
  }
});

/** Open the Bonds tab, and the panel to establish a new Bond */
async function openEstablishPanel(page: Page, actorId: string) {
  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.locator(".tab-strip > label", { hasText: "Bonds" }).click();
  const button = actorSheet.getByTestId("open-establish-bond");
  // the tooltip shows wherever on the button you hover
  for (const title of await button
    .locator("[title]")
    .evaluateAll((els) => els.map((el) => el.getAttribute("title")))) {
    expect(title).toBe("Roll to establish a new Bond between operations");
  }
  await button.click();
  const panel = actorSheet.getByTestId("establish-bond-panel");
  await expect(panel).toBeVisible();
  return panel;
}

test("establishing a new Bond", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Charmer", type: "pc" });
  await updateAbility(page, actorId, "Reassurance", { rating: 2, pool: 2 });
  await updateAbility(page, actorId, "Flattery", { rating: 1, pool: 0 });
  await createOwnedItem(page, actorId, {
    name: "Mom",
    type: "bond",
    system: { points: 3 },
  });
  await createOwnedItem(page, actorId, {
    name: "Bob",
    type: "bond",
    system: { points: 2, isDeltaGreen: true },
  });

  const panel = await openEstablishPanel(page, actorId);
  // no broken Bonds, so nobody to re-form
  await expect(panel.getByLabel("Who")).toHaveCount(0);
  await panel.getByLabel("Name", { exact: true }).fill("Ruth");
  // an empty ability is listed, but can't be picked
  const spend = panel.getByLabel("Spend");
  await expect(spend.locator("option", { hasText: "Flattery" })).toBeDisabled();
  await expect(spend).toHaveValue(
    await page.evaluate(
      (actorId) => game.actors.get(actorId)!.items.getName("Reassurance")!.id,
      actorId,
    ),
  );
  // only ordinary Bonds can be neglected
  await expect(panel.getByLabel("Neglect").locator("option")).toHaveText([
    "Mom (3 → 2)",
  ]);

  await forceDice(page, 4);
  await panel.getByRole("button", { name: "Establish Bond" }).click();
  await expect(panel).toHaveCount(0);

  const card = lastChatMessage(page).getByTestId("establish-bond-card");
  await expect(card).toContainText("Establishing a Bond with Ruth");
  await expect(card.getByTestId("establish-outcome")).toHaveText("Bonded");
  // the die minus 2
  await expect(card.getByTestId("establish-bond-points")).toHaveText("Ruth: 2");
  await expect(card.getByTestId("establish-spent")).toHaveText(
    "Spent: Reassurance 1",
  );
  await expect(card.getByTestId("establish-neglected")).toHaveText(
    "Neglected: Mom 3 → 2",
  );
  await expect
    .poll(() => getBonds(page, actorId))
    .toEqual(
      expect.arrayContaining([
        { name: "Ruth", points: 2, isDeltaGreen: false },
        { name: "Mom", points: 2, isDeltaGreen: false },
        { name: "Bob", points: 2, isDeltaGreen: true },
      ]),
    );
  expect(await getPool(page, actorId, "Reassurance")).toBe(1);
});

test("a new Bond rejected, with no Bond to neglect", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Loner", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 5 });
  await updateAbility(page, actorId, "Reassurance", { rating: 1, pool: 1 });

  const panel = await openEstablishPanel(page, actorId);
  await expect(panel).toContainText("No Bond to neglect");
  const button = panel.getByRole("button", { name: "Establish Bond" });
  // it needs a name
  await expect(button).toBeDisabled();
  await panel.getByLabel("Name", { exact: true }).fill("Ruth");

  await forceDice(page, 1);
  await button.click();

  const card = lastChatMessage(page).getByTestId("establish-bond-card");
  await expect(card.getByTestId("establish-outcome")).toHaveText("Rejected");
  await expect(card.getByTestId("establish-bond-points")).toHaveCount(0);
  await expect(card.getByTestId("establish-neglected")).toHaveCount(0);
  await expect(card.getByTestId("establish-stability")).toHaveText(
    "Stability: 5 → 4",
  );
  await expect.poll(() => getPool(page, actorId, "Stability")).toBe(4);
  expect(await getPool(page, actorId, "Reassurance")).toBe(0);
  expect(await getBonds(page, actorId)).toEqual([]);
});

test("re-forming a broken Bond on a 6, neglecting one to breaking", async ({
  page,
}) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Reformer", type: "pc" });
  await updateAbility(page, actorId, "Reassurance", { rating: 1, pool: 1 });
  await createOwnedItem(page, actorId, {
    name: "Gone",
    type: "bond",
    system: { points: -1 },
  });
  await createOwnedItem(page, actorId, {
    name: "Zero",
    type: "bond",
    system: { points: 0 },
  });

  const panel = await openEstablishPanel(page, actorId);
  await panel.getByLabel("Who").selectOption({ label: "Gone (broken)" });
  // the name comes from the broken Bond
  await expect(panel.getByLabel("Name", { exact: true })).toHaveCount(0);

  // neglecting Zero breaks it, so it asks first; cancelling does nothing
  const messages = page.locator("#chat .chat-message");
  const messageCount = await messages.count();
  const dialog = page.locator(".application.dialog");
  const button = panel.getByRole("button", { name: "Establish Bond" });
  await button.click();
  await expect(dialog).toContainText("Neglecting Zero will break that Bond");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  expect(await messages.count()).toBe(messageCount);

  await forceDice(page, 6);
  await button.click();
  await dialog.getByRole("button", { name: "Establish Bond" }).click();

  const card = lastChatMessage(page).getByTestId("establish-bond-card");
  await expect(card).toContainText("Re-forming the Bond with Gone");
  await expect(card.getByTestId("establish-outcome")).toHaveText(
    "Bonded on a 6!",
  );
  await expect(card.getByTestId("establish-bond-points")).toHaveText("Gone: 3");
  await expect(card.getByTestId("establish-spent")).toHaveText(
    "Spent: Reassurance 1 (refunded)",
  );
  await expect(card.getByTestId("establish-neglected")).toHaveText(
    "Neglected: Zero 0 → -1 (Broken)",
  );
  await expect
    .poll(() => getBonds(page, actorId))
    .toEqual(
      expect.arrayContaining([
        { name: "Gone", points: 3, isDeltaGreen: false },
        { name: "Zero", points: -1, isDeltaGreen: false },
      ]),
    );
  // the same Bond, not a new one
  expect(await getBonds(page, actorId)).toHaveLength(2);
  // a 6 gives the point back
  expect(await getPool(page, actorId, "Reassurance")).toBe(1);
});

test("no points to establish a new Bond", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Spent", type: "pc" });
  await updateAbility(page, actorId, "Reassurance", { rating: 2, pool: 0 });

  const panel = await openEstablishPanel(page, actorId);
  await panel.getByLabel("Name", { exact: true }).fill("Ruth");
  await expect(
    panel.getByRole("button", { name: "Establish Bond" }),
  ).toBeDisabled();
  await expect(panel.getByRole("status")).toHaveText(
    "No Interpersonal points left to spend",
  );
});

/** Drop a document onto an element, as dragging it from the sidebar would */
async function dropDocument(
  page: Page,
  target: Locator,
  data: { type: string; uuid: string },
) {
  const dataTransfer = await page.evaluateHandle((json) => {
    const dt = new DataTransfer();
    dt.setData("text/plain", json);
    return dt;
  }, JSON.stringify(data));
  await target.dispatchEvent("dragover", { dataTransfer });
  await target.dispatchEvent("drop", { dataTransfer });
}

test("linking a Bond to an actor", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const actorId = await createActor(page, { name: "Amanda", type: "pc" });
  const teammateId = await createActor(page, {
    name: "Bob Tanner",
    type: "pc",
  });
  // given a picture of her own
  const zorahId = await createActor(page, { name: "Zorah", type: "npc" });
  await page.evaluate(async (zorahId) => {
    await game.actors.get(zorahId)!.update({ img: "icons/svg/aura.svg" });
  }, zorahId);
  const bondId = await createOwnedItem(page, actorId, {
    name: "Bob",
    type: "bond",
    system: { points: 2 },
  });
  const getBond = () =>
    page.evaluate(
      ({ actorId, bondId }) => {
        const bond = game.actors.get(actorId)!.items.get(bondId)!;
        return {
          img: bond.img,
          actorUuid: (bond.system as unknown as { actorUuid: string | null })
            .actorUuid,
        };
      },
      { actorId, bondId },
    );
  const defaultImg = (await getBond()).img;

  // any Bond can have one, DELTA GREEN or not
  const bondSheet = await openSheet(page, `Actor.${actorId}.Item.${bondId}`);
  const actorRow = bondSheet.getByTestId("bond-actor");
  await expect(actorRow).toHaveText("Drag an actor here");

  // not the Agent themself
  await dropDocument(page, actorRow, {
    type: "Actor",
    uuid: `Actor.${actorId}`,
  });
  await expect(actorRow).toHaveText("Drag an actor here");
  expect((await getBond()).actorUuid).toBeNull();

  // a default picture isn't taken
  await dropDocument(page, actorRow, {
    type: "Actor",
    uuid: `Actor.${teammateId}`,
  });
  await expect(actorRow).toHaveText("Bob Tanner");
  expect(await getBond()).toEqual({
    img: defaultImg,
    actorUuid: `Actor.${teammateId}`,
  });

  // the name opens their sheet
  await actorRow.getByText("Bob Tanner").click();
  await expect
    .poll(() =>
      page.evaluate(
        (teammateId) => game.actors.get(teammateId)!.sheet!.rendered,
        teammateId,
      ),
    )
    .toBe(true);
  await page.evaluate(
    (teammateId) => game.actors.get(teammateId)!.sheet!.close(),
    teammateId,
  );

  await actorRow.getByTitle("Unlink").click();
  await expect(actorRow).toHaveText("Drag an actor here");
  expect((await getBond()).actorUuid).toBeNull();

  // a chosen picture is
  await dropDocument(page, actorRow, {
    type: "Actor",
    uuid: `Actor.${zorahId}`,
  });
  await expect(actorRow).toHaveText("Zorah");
  expect(await getBond()).toEqual({
    img: "icons/svg/aura.svg",
    actorUuid: `Actor.${zorahId}`,
  });
});

/** An Agent in a party with some teammates, so only they're offered */
async function createTeam(page: Page, agent: string, teammates: string[]) {
  const actorId = await createActor(page, { name: agent, type: "pc" });
  const teammateIds: Record<string, string> = {};
  for (const name of teammates) {
    teammateIds[name] = await createActor(page, { name, type: "pc" });
  }
  await createActor(page, {
    name: `${agent}'s team`,
    type: "party",
    system: { actorIds: [actorId, ...Object.values(teammateIds)] },
  });
  return { actorId, teammateIds };
}

async function openTeamCrisisPanel(page: Page, actorId: string) {
  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.locator(".tab-strip > label", { hasText: "Bonds" }).click();
  await actorSheet.getByTestId("open-team-crisis").click();
  const panel = actorSheet.getByTestId("team-crisis-panel");
  await expect(panel).toBeVisible();
  return panel;
}

/**
 * Tick a teammate who was there. (The teammates come first: a Bond with them
 * may be further down, among the spends.)
 */
const pickTeammate = (panel: Locator, name: string) =>
  panel
    .locator("label", { hasText: new RegExp(`^${name}$`) })
    .first()
    .click();

/**
 * A row of spend buttons in the panel, by its label. A Bond can have two:
 * paying for a failure (first), and spending on the test.
 */
const panelRow = (panel: Locator, label: string) =>
  panel
    .locator("label", { hasText: new RegExp(`^${label}$`) })
    .locator("xpath=following-sibling::div[1]");

async function getLinkedBonds(page: Page, actorId: string) {
  return page.evaluate(
    (actorId) =>
      game.actors
        .get(actorId)!
        .items.filter((item) => item.type === "bond")
        .map((item) => {
          const system = item.system as unknown as {
            points: number;
            isDeltaGreen: boolean;
            actorUuid: string | null;
          };
          return {
            name: item.name,
            points: system.points,
            isDeltaGreen: system.isDeltaGreen,
            actorUuid: system.actorUuid,
          };
        }),
    actorId,
  );
}

test("a team crisis: forming and strengthening DELTA GREEN Bonds", async ({
  page,
}) => {
  await setSettings(page, { useBonds: true });
  const { actorId, teammateIds } = await createTeam(page, "Amanda", [
    "Bob",
    "Carlos",
    "Dana",
  ]);
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 6 });
  // Carlos has a picture of his own, which his new Bond takes
  await page.evaluate(async (carlosId) => {
    await game.actors.get(carlosId)!.update({ img: "icons/svg/aura.svg" });
  }, teammateIds["Carlos"]);
  for (const name of ["Zorah", "Jerome"]) {
    await createOwnedItem(page, actorId, {
      name,
      type: "bond",
      system: { points: 4 },
    });
  }
  await createOwnedItem(page, actorId, {
    name: "Bob",
    type: "bond",
    system: {
      points: 2,
      isDeltaGreen: true,
      actorUuid: `Actor.${teammateIds["Bob"]}`,
    },
  });

  const panel = await openTeamCrisisPanel(page, actorId);
  const teammates = panel.getByTestId("crisis-teammate");
  await expect(teammates).toHaveCount(3);
  const button = panel.getByRole("button", { name: "Make the test" });
  await expect(panel.getByRole("status")).toHaveText(
    "Choose the teammates who were there",
  );
  await expect(button).toBeDisabled();

  await pickTeammate(panel, "Bob");
  await pickTeammate(panel, "Carlos");
  // what a failure would do: half the highest Bond (4) for the new one
  await expect(teammates).toHaveText(["2 → 3", "New (2)", ""]);
  // 1 for the new Bond, 1 for the one strengthened
  await expect(panel).toContainText("If it fails, your other Bonds lose: 2");
  await expect(panel.getByRole("status")).toHaveText(
    "Choose which Bonds lose points (2 in all)",
  );
  await panelRow(panel, "Zorah")
    .first()
    .getByText("1", { exact: true })
    .click();
  // only as much as is still owed
  await expect(
    panelRow(panel, "Jerome").first().locator('input[value="2"]'),
  ).toBeDisabled();
  await panelRow(panel, "Jerome")
    .first()
    .getByText("1", { exact: true })
    .click();
  await expect(panel.getByRole("status")).toHaveCount(0);

  await forceDice(page, 1);
  await button.click();
  await expect(panel).toHaveCount(0);

  const card = lastChatMessage(page).getByTestId("team-crisis-card");
  await expect(card.getByTestId("crisis-outcome")).toHaveText("Bonds form");
  await expect(card.getByTestId("crisis-change")).toHaveText([
    "Strengthened: Bob 2 → 3",
    "New: Carlos 2",
  ]);
  await expect(card.getByTestId("crisis-loss")).toHaveText([
    // in the Bonds' order
    "Lost: Jerome 4 → 3",
    "Lost: Zorah 4 → 3",
  ]);
  await expect
    .poll(() => getLinkedBonds(page, actorId))
    .toEqual(
      expect.arrayContaining([
        { name: "Zorah", points: 3, isDeltaGreen: false, actorUuid: null },
        { name: "Jerome", points: 3, isDeltaGreen: false, actorUuid: null },
        {
          name: "Bob",
          points: 3,
          isDeltaGreen: true,
          actorUuid: `Actor.${teammateIds["Bob"]}`,
        },
        {
          name: "Carlos",
          points: 2,
          isDeltaGreen: true,
          actorUuid: `Actor.${teammateIds["Carlos"]}`,
        },
      ]),
    );
  expect(
    await page.evaluate(
      (actorId) => game.actors.get(actorId)!.items.getName("Carlos")!.img,
      actorId,
    ),
  ).toBe("icons/svg/aura.svg");
});

test("a team crisis that holds together", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const { actorId } = await createTeam(page, "Steady Eddie", ["Fran"]);
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 6 });
  await createOwnedItem(page, actorId, {
    name: "Mom",
    type: "bond",
    system: { points: 3 },
  });

  const panel = await openTeamCrisisPanel(page, actorId);
  await pickTeammate(panel, "Fran");
  // Mom appears twice: paying for a failure, then spending on the test
  const [momLoss, momSpend] = [
    panelRow(panel, "Mom").first(),
    panelRow(panel, "Mom").last(),
  ];
  await momLoss.getByText("1", { exact: true }).click();
  // Stability and Bond points can be spent on the test
  await panelRow(panel, "Stability").getByText("1", { exact: true }).click();
  await momSpend.getByText("1", { exact: true }).click();

  await forceDice(page, 6);
  await panel.getByRole("button", { name: "Make the test" }).click();

  const card = lastChatMessage(page).getByTestId("team-crisis-card");
  await expect(card.getByTestId("crisis-outcome")).toHaveText("Holds together");
  await expect(card).toContainText("Spent: Stability 1, Mom 1");
  await expect(card.getByTestId("crisis-change")).toHaveCount(0);
  // only the spends come off
  await expect
    .poll(() => getBonds(page, actorId))
    .toEqual([{ name: "Mom", points: 2, isDeltaGreen: false }]);
  expect(await getPool(page, actorId, "Stability")).toBe(5);
});

test("a team crisis re-forms a broken Bond, and asks before breaking one", async ({
  page,
}) => {
  await setSettings(page, { useBonds: true });
  const { actorId, teammateIds } = await createTeam(page, "Raina", [
    "Bob",
    "Jerome",
  ]);
  await createOwnedItem(page, actorId, {
    name: "Mom",
    type: "bond",
    system: { points: 0 },
  });
  await createOwnedItem(page, actorId, {
    name: "Jerome",
    type: "bond",
    system: {
      points: 3,
      isDeltaGreen: true,
      actorUuid: `Actor.${teammateIds["Jerome"]}`,
    },
  });
  await createOwnedItem(page, actorId, {
    name: "Bob",
    type: "bond",
    system: {
      points: -1,
      isDeltaGreen: true,
      actorUuid: `Actor.${teammateIds["Bob"]}`,
    },
  });

  const panel = await openTeamCrisisPanel(page, actorId);
  await pickTeammate(panel, "Bob");
  // half of Jerome's 3, rounded up
  await expect(panel.getByTestId("crisis-teammate").first()).toHaveText(
    "Re-formed (2)",
  );
  // only Mom can pay: Jerome is a DELTA GREEN Bond
  await panelRow(panel, "Mom").first().getByText("1", { exact: true }).click();

  const dialog = page.locator(".application.dialog");
  await forceDice(page, 1);
  await panel.getByRole("button", { name: "Make the test" }).click();
  await expect(dialog).toContainText("This could break your Bond with Mom");
  await dialog.getByRole("button", { name: "Make the test" }).click();
  await expect(dialog).toHaveCount(0);

  const card = lastChatMessage(page).getByTestId("team-crisis-card");
  await expect(card.getByTestId("crisis-change")).toHaveText([
    "Re-formed: Bob -1 → 2",
  ]);
  await expect(card.getByTestId("crisis-loss")).toHaveText([
    "Lost: Mom 0 → -1 (Broken)",
  ]);
  await expect
    .poll(() => getBonds(page, actorId))
    .toEqual(
      expect.arrayContaining([
        { name: "Bob", points: 2, isDeltaGreen: true },
        { name: "Mom", points: -1, isDeltaGreen: false },
      ]),
    );
  // re-formed in place, not a new Bond
  expect(await getBonds(page, actorId)).toHaveLength(3);
});

test("a GM calls a team crisis from the party sheet", async ({ page }) => {
  await setSettings(page, { useBonds: true });
  const { actorId, teammateIds } = await createTeam(page, "Agent Amanda", [
    "Agent Bob",
    "Agent Carlos",
  ]);
  await createOwnedItem(page, actorId, {
    name: "Zorah",
    type: "bond",
    system: { points: 4 },
  });
  const partyId = await page.evaluate(
    (name) => game.actors.getName(name)!.id,
    "Agent Amanda's team",
  );

  // the GM says who was there: not Carlos
  const partySheet = await openSheet(page, `Actor.${partyId}`);
  await partySheet.getByTestId("call-team-crisis").click();
  const dialog = page.locator(".application.dialog");
  await dialog.getByLabel("Agent Carlos").uncheck();
  await dialog.getByRole("button", { name: "Call Team Crisis" }).click();
  await expect(dialog).toHaveCount(0);

  // a card, with a button for each Agent there (the GM owns them all)
  const call = lastChatMessage(page).getByTestId("crisis-call-card");
  const members = call.getByTestId("crisis-call-member");
  await expect(members).toHaveText([
    /^Agent Amanda\s*Make the test\s*$/,
    /^Agent Bob\s*Make the test\s*$/,
  ]);

  // Amanda's opens her test, with Bob ticked as her teammate
  await members
    .filter({ hasText: "Agent Amanda" })
    .getByRole("button", { name: "Make the test" })
    .click();
  const crisisWindow = page.locator(
    `[id="investigator-team-crisis-${actorId}"]`,
  );
  const panel = crisisWindow.getByTestId("team-crisis-panel");
  await expect(panel.getByTestId("crisis-teammate")).toHaveText([
    "New (2)",
    "",
  ]);
  await panelRow(panel, "Zorah")
    .first()
    .getByText("1", { exact: true })
    .click();
  await forceDice(page, 1);
  await panel.getByRole("button", { name: "Make the test" }).click();
  // the window closes once it's done
  await expect(crisisWindow).toHaveCount(0);

  const card = lastChatMessage(page).getByTestId("team-crisis-card");
  await expect(card.getByTestId("crisis-change")).toHaveText([
    "New: Agent Bob 2",
  ]);
  await expect
    .poll(() => getLinkedBonds(page, actorId))
    .toContainEqual({
      name: "Agent Bob",
      points: 2,
      isDeltaGreen: true,
      actorUuid: `Actor.${teammateIds["Agent Bob"]}`,
    });
});

test("a player sees a button only for their own Agent on a crisis call", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, { useBonds: true });
  const { actorId, teammateIds } = await createTeam(page, "Agent Erin", [
    "Agent Fox",
  ]);
  const playerId = await createPlayer(page, "Erin's player");
  await giveOwnership(page, actorId, playerId);
  const partyId = await page.evaluate(
    (name) => game.actors.getName(name)!.id,
    "Agent Erin's team",
  );

  const player = await joinAs("Erin's player");
  const partySheet = await openSheet(page, `Actor.${partyId}`);
  await partySheet.getByTestId("call-team-crisis").click();
  await page
    .locator(".application.dialog")
    .getByRole("button", { name: "Call Team Crisis" })
    .click();

  const members = lastChatMessage(player)
    .getByTestId("crisis-call-card")
    .getByTestId("crisis-call-member");
  await expect(members).toHaveText([/^Agent Erin/, /^Agent Fox/]);
  await expect(
    members.filter({ hasText: "Agent Erin" }).getByRole("button"),
  ).toHaveCount(1);
  await expect(
    members.filter({ hasText: "Agent Fox" }).getByRole("button"),
  ).toHaveCount(0);

  // and the player can make the test from it
  await members.filter({ hasText: "Agent Erin" }).getByRole("button").click();
  const panel = player
    .locator(`[id="investigator-team-crisis-${actorId}"]`)
    .getByTestId("team-crisis-panel");
  await forceDice(player, 1);
  await panel.getByRole("button", { name: "Make the test" }).click();
  await expect
    .poll(() => getLinkedBonds(page, actorId))
    .toContainEqual({
      name: "Agent Fox",
      points: 0,
      isDeltaGreen: true,
      actorUuid: `Actor.${teammateIds["Agent Fox"]}`,
    });
});

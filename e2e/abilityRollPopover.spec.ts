import {
  abilityRow,
  createActor,
  createPlayer,
  expect,
  giveOwnership,
  lastChatMessage,
  openSheet,
  test,
  updateAbility,
} from "./foundry.ts";

// An ability's row on a character sheet shows only its name and pool:
// clicking it opens a popover with the same controls as the ability's sheet.

test("a row's popover tests the ability, then closes", async ({ page }) => {
  const actorId = await createActor(page, { name: "Climber", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const row = abilityRow(sheet, "Athletics");
  await expect(row).toContainText("pool 4, rating 4");

  await row.click();
  const popover = page.getByRole("dialog", { name: "Athletics" });
  await expect(popover).toBeVisible();
  await expect(popover).toBeFocused();
  await popover.locator("label", { hasText: /^2$/ }).click();
  await popover.getByRole("button", { name: /Test/ }).click();

  await expect(popover).toBeHidden();
  await expect(row).toContainText("pool 2, rating 4");
  await expect(lastChatMessage(page)).toContainText("Athletics");
});

test("Esc closes the popover, not the sheet, and starts it afresh", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Dawdler", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const row = abilityRow(sheet, "Athletics");
  const popover = page.getByRole("dialog", { name: "Athletics" });

  await row.click();
  // the spend picker's button for 3 (its radio is hidden)
  const three = popover.locator("label", { hasText: /^3$/ });
  await three.click();
  await expect(three).toHaveAttribute("data-pressed");
  await page.keyboard.press("Escape");

  await expect(popover).toBeHidden();
  await expect(sheet).toBeVisible();
  await expect(row).toBeFocused();

  // clicking the row again closes it
  await row.click();
  await expect(popover).toBeVisible();
  await expect(three).not.toHaveAttribute("data-pressed");
  await row.click();
  await expect(popover).toBeHidden();
  await expect(row).toContainText("pool 4, rating 4");
});

test("right-clicking a row, or the popover's link, opens the ability's sheet", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Reader", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const row = abilityRow(sheet, "Athletics");
  const abilitySheet = page.locator(".application", {
    has: page.getByTestId("test-difficulty-picker"),
  });

  await row.click({ button: "right" });
  await expect(abilitySheet).toBeVisible();
  await abilitySheet.getByRole("button", { name: "Close Window" }).click();
  await expect(abilitySheet).toBeHidden();

  await row.click();
  const popover = page.getByRole("dialog", { name: "Athletics" });
  await popover.getByRole("button", { name: "Open sheet" }).click();
  await expect(popover).toBeHidden();
  await expect(abilitySheet).toBeVisible();
});

test("someone who can only look at the sheet gets the ability's sheet", async ({
  page,
  joinAs,
}) => {
  const actorId = await createActor(page, { name: "Exhibit", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const playerId = await createPlayer(page, "Ability Onlooker");
  await giveOwnership(page, actorId, playerId, "OBSERVER");

  const player = await joinAs("Ability Onlooker");
  const sheet = await openSheet(player, `Actor.${actorId}`);
  await abilityRow(sheet, "Athletics").click();

  await expect(player.getByRole("dialog", { name: "Athletics" })).toHaveCount(
    0,
  );
  await expect(
    player.locator(".application", {
      has: player.getByTestId("test-difficulty-picker"),
    }),
  ).toBeVisible();
});
